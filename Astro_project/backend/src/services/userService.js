// Astro_project/backend/src/services/userService.js

const { isStrongPassword } = require('../utils/passwordValidator');

class UserService {
    constructor({ userRepository }) {
        this.userRepo = userRepository;
    }

    _isValidIndividualPlan(plan) {
        return plan === 'INDIVIDUAL_FREE' || plan === 'INDIVIDUAL_PREMIUM';
    }

    _isGroupOwner(user) {
        if (!user) return false;
        if (user.plan !== 'GRUPAL') return false;
        if (user.role === 'CENTER') return true;
        return user.role === 'TEACHER' && !user.parentId;
    }

    _resolveOwnerRole(groupType) {
        if (groupType === 'CENTER') return 'CENTER';
        if (groupType === 'TEACHER' || groupType === 'PROFESSOR') return 'TEACHER';
        return null;
    }

    async _collectDescendantUsernames(rootUsername) {
        const queue = [rootUsername];
        const descendants = [];
        const seen = new Set([rootUsername]);

        while (queue.length > 0) {
            const parent = queue.shift();
            const children = await this.userRepo.collection.find({ parentId: parent }).toArray();

            for (const child of children) {
                const childUsername = child.user || child.username;
                if (!childUsername || seen.has(childUsername)) continue;
                seen.add(childUsername);
                descendants.push(childUsername);
                queue.push(childUsername);
            }
        }

        return descendants;
    }

    async _applyOwnerDowngrade(owner, targetPlan = 'INDIVIDUAL_FREE') {
        const descendants = await this._collectDescendantUsernames(owner.username);
        const updates = descendants.map(async (childUsername) => {
            const child = await this.userRepo.findByUsername(childUsername);
            if (!child) return;
            child.plan = 'INDIVIDUAL_FREE';
            child.role = null;
            child.parentId = null;
            child.scheduledPlanDowngrade = null;
            child.pendingGroupLeaveRequest = null;
            await this.userRepo.update(child);
        });

        await Promise.all(updates);

        owner.plan = this._isValidIndividualPlan(targetPlan) ? targetPlan : 'INDIVIDUAL_FREE';
        owner.role = null;
        owner.parentId = null;
        owner.scheduledPlanDowngrade = null;
        owner.pendingGroupLeaveRequest = null;
        await this.userRepo.update(owner);
    }

    async processScheduledPlanDowngrade(username) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error("Usuario no encontrado");

        const scheduled = user.scheduledPlanDowngrade;
        if (!scheduled?.effectiveAt) {
            return { applied: false, scheduledPlanDowngrade: null };
        }

        const effectiveAt = new Date(scheduled.effectiveAt);
        if (Number.isNaN(effectiveAt.getTime())) {
            user.scheduledPlanDowngrade = null;
            await this.userRepo.update(user);
            return { applied: false, scheduledPlanDowngrade: null };
        }

        if (effectiveAt > new Date()) {
            return { applied: false, scheduledPlanDowngrade: scheduled };
        }

        await this._applyOwnerDowngrade(user, scheduled.targetPlan);
        return { applied: true, scheduledPlanDowngrade: null };
    }

    async updatePlan(username, plan, options = {}) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error("Usuario no encontrado");

        await this.processScheduledPlanDowngrade(username);
        const refreshedUser = await this.userRepo.findByUsername(username);
        if (!refreshedUser) throw new Error("Usuario no encontrado");

        if (plan === 'GRUPAL') {
            const role = this._resolveOwnerRole(options.groupType || options.role);
            if (!role) {
                throw new Error("Para pasar a GRUPAL debes indicar groupType: CENTER o TEACHER");
            }
            refreshedUser.plan = 'GRUPAL';
            refreshedUser.role = role;
            refreshedUser.parentId = null;
            refreshedUser.scheduledPlanDowngrade = null;
            refreshedUser.pendingGroupLeaveRequest = null;
        } else if (this._isValidIndividualPlan(plan)) {
            if (refreshedUser.plan === 'GRUPAL' && this._isGroupOwner(refreshedUser)) {
                throw new Error("Como responsable de grupo debes usar la baja programada con contraseña");
            }
            if (refreshedUser.plan === 'GRUPAL' && refreshedUser.parentId) {
                throw new Error("Debes solicitar aprobación del responsable para pasar a individual");
            }
            refreshedUser.plan = plan;
            refreshedUser.role = null;
            refreshedUser.parentId = null;
            refreshedUser.scheduledPlanDowngrade = null;
            refreshedUser.pendingGroupLeaveRequest = null;
        } else {
            throw new Error("Plan no válido");
        }

        await this.userRepo.update(refreshedUser);
        return {
            plan: refreshedUser.plan,
            role: refreshedUser.role,
            parentId: refreshedUser.parentId,
            scheduledPlanDowngrade: refreshedUser.scheduledPlanDowngrade
        };
    }

    async requestGroupOwnerPlanDowngrade(username, password, targetPlan = 'INDIVIDUAL_FREE') {
        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error("Usuario no encontrado");

        if (!this._isGroupOwner(user)) {
            throw new Error("Solo el responsable de un grupo puede programar esta baja");
        }

        const validCredentials = await this.userRepo.findByCredentials(username, password);
        if (!validCredentials) {
            throw new Error("Contraseña actual incorrecta");
        }

        if (user.scheduledPlanDowngrade?.effectiveAt) {
            throw new Error("Ya existe una baja programada");
        }

        const now = new Date();
        const effectiveAt = new Date(now);
        effectiveAt.setDate(effectiveAt.getDate() + 30);

        user.scheduledPlanDowngrade = {
            targetPlan: this._isValidIndividualPlan(targetPlan) ? targetPlan : 'INDIVIDUAL_FREE',
            requestedAt: now.toISOString(),
            effectiveAt: effectiveAt.toISOString()
        };

        await this.userRepo.update(user);
        return user.scheduledPlanDowngrade;
    }

    async cancelGroupOwnerPlanDowngrade(username) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error("Usuario no encontrado");

        if (!user.scheduledPlanDowngrade) {
            return false;
        }

        user.scheduledPlanDowngrade = null;
        await this.userRepo.update(user);
        return true;
    }

    async updateAvatar(username, avatar) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error("Usuario no encontrado");

        user.avatar = avatar;
        await this.userRepo.update(user);
        return avatar;
    }

    async updateSelectedTitle(username, title) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error("Usuario no encontrado");

        user.selectedTitle = title;
        await this.userRepo.update(user);
        return title;
    }

    async updateProfileColor(username, color) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error("Usuario no encontrado");

        user.profileColor = color;
        await this.userRepo.update(user);
        return color;
    }

    async changePassword(username, oldPassword, newPassword) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error("Usuario no encontrado");

        if (!isStrongPassword(newPassword)) {
            throw new Error("La nueva contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula, un número y un carácter especial.");
        }

        const validCredentials = await this.userRepo.findByCredentials(username, oldPassword);
        if (!validCredentials) throw new Error("Contraseña actual incorrecta");

        const updated = await this.userRepo.updatePassword(username, newPassword);
        if (!updated) throw new Error("No se pudo actualizar la contraseña");
        return true;
    }

    async getAllExplorers() {
        // En una app real, el repositori hauria de tenir un mètode findAll simplificat
        // Per ara, usem la col·lecció directament via repo si l'exposem o afegim el mètode.
        return await this.userRepo.findAllExplorers();
    }

    async requestAccountDeletion(username) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error("Usuario no encontrado");

        const deletionDate = new Date();
        deletionDate.setDate(deletionDate.getDate() + 30);
        
        user.deletionScheduledAt = deletionDate.toISOString();
        await this.userRepo.update(user);
        return user.deletionScheduledAt;
    }

    async cancelAccountDeletion(username) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error("Usuario no encontrado");

        user.deletionScheduledAt = null;
        await this.userRepo.update(user);
        return true;
    }
}

module.exports = UserService;
