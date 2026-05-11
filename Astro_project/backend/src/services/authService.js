// Astro_project/backend/src/services/authService.js

const User = require('../domain/User');

class AuthService {
    constructor({
        userRepository,
        updateStreak,
        normalizeAndPersistInventory,
        getInventoryQuantity,
        normalizeActiveBoosters
    }) {
        this.userRepo = userRepository;
        this.updateStreak = updateStreak;
        this.normalizeAndPersistInventory = normalizeAndPersistInventory;
        this.getInventoryQuantity = getInventoryQuantity;
        this.normalizeActiveBoosters = normalizeActiveBoosters;
    }

    _isGroupOwner(user) {
        if (!user || user.plan !== 'GRUPAL') return false;
        if (user.role === 'CENTER') return true;
        return user.role === 'TEACHER' && !user.parentId;
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

    async _applyDueScheduledDowngrade(user) {
        const scheduled = user?.scheduledPlanDowngrade;
        if (!scheduled?.effectiveAt || !this._isGroupOwner(user)) return user;

        const effectiveAt = new Date(scheduled.effectiveAt);
        if (Number.isNaN(effectiveAt.getTime()) || effectiveAt > new Date()) {
            return user;
        }

        const descendants = await this._collectDescendantUsernames(user.username);
        await Promise.all(descendants.map(async (childUsername) => {
            const child = await this.userRepo.findByUsername(childUsername);
            if (!child) return;
            child.plan = 'INDIVIDUAL_FREE';
            child.role = null;
            child.parentId = null;
            child.scheduledPlanDowngrade = null;
            await this.userRepo.update(child);
        }));

        user.plan = scheduled.targetPlan || 'INDIVIDUAL_FREE';
        user.role = null;
        user.parentId = null;
        user.scheduledPlanDowngrade = null;
        await this.userRepo.update(user);
        return user;
    }

    async register(username, password, rank, role = null, plan = 'INDIVIDUAL_FREE') {
        if (!username || username.trim() === '') {
            throw new Error('El nombre de usuario no puede estar vacío.');
        }

        const existingUser = await this.userRepo.findByUsername(username);
        if (existingUser) {
            throw new Error('El ID de tripulante ya existe.');
        }

        const newUser = new User({
            user: username,
            rank: rank || 'Cadete de Vuelo',
            role,
            plan
        });
        
        // Preparem el document per a MongoDB assegurant els noms de camps correctes
        const userDoc = {
            user: newUser.username,
            pass: password,
            plan: newUser.plan,
            role: newUser.role,
            rank: newUser.rank,
            level: newUser.level,
            xp: newUser.xp,
            coins: newUser.coins,
            streak: newUser.streak,
            streakFreezes: newUser.streakFreezes,
            inventory: newUser.inventory,
            activeBoosters: this.normalizeActiveBoosters(),
            selectedAchievements: [null, null, null],
            unlockedAchievements: [],
            avatar: 'Astronauta_blanc.jpg',
            mapLevel: 1,
            parentId: null,
            groupInvitations: [],
            groupApprovalRequests: [],
            scheduledPlanDowngrade: null,
            createdAt: new Date(),
            lastActivity: new Date()
        };

        const result = await this.userRepo.saveDoc(userDoc);
        newUser.id = result.insertedId;
        return newUser;
    }

    async login(username, password) {
        // En una app real, aquí comprovaríem el hash de la password
        const userDoc = await this.userRepo.findByCredentials(username, password);
        if (!userDoc) {
            throw new Error('Credenciales no reconocidas');
        }

        const initialUser = new User(userDoc);
        const user = await this._applyDueScheduledDowngrade(initialUser);
        // Utilitzar l'entitat de domini User
        const normalizedInventory = await this.normalizeAndPersistInventory(user);
        const freezeUnits = this.getInventoryQuantity(normalizedInventory, 2);
        const streakResult = await this.updateStreak(user.username, false);

        return {
            user,
            streakResult,
            freezeUnits,
            normalizedInventory
        };
    }
}

module.exports = AuthService;
