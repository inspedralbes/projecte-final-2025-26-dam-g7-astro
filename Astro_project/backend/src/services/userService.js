// Astro_project/backend/src/services/userService.js

class UserService {
    constructor({ userRepository }) {
        this.userRepo = userRepository;
    }

    async updatePlan(username, plan) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error("Usuario no encontrado");

        user.plan = plan;
        await this.userRepo.update(user);
        return plan;
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

    async changePassword(username, oldPassword, newPassword) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error("Usuario no encontrado");

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
}

module.exports = UserService;
