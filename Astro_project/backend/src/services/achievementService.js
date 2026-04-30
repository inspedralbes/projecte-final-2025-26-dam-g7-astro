// Astro_project/backend/src/services/achievementService.js

class AchievementService {
    constructor({
        userRepository,
        normalizeAchievementIds
    }) {
        this.userRepo = userRepository;
        this.normalizeAchievementIds = normalizeAchievementIds;
    }

    async getUserAchievements(username) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error('Usuario no encontrado.');

        return {
            selectedAchievements: Array.isArray(user.selectedAchievements)
                ? user.selectedAchievements
                : [null, null, null],
            unlockedAchievements: this.normalizeAchievementIds(user.unlockedAchievements || [])
        };
    }

    async updateUnlockedAchievements(username, unlockedAchievements) {
        if (!Array.isArray(unlockedAchievements)) {
            throw new Error('Formato de logros desbloqueados no válido.');
        }

        const normalizedUnlocked = this.normalizeAchievementIds(unlockedAchievements);
        if (normalizedUnlocked.length > 200) {
            throw new Error('Demasiados logros desbloqueados.');
        }

        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error('Usuario no encontrado.');

        user.unlockedAchievements = normalizedUnlocked;
        await this.userRepo.update(user);

        return normalizedUnlocked;
    }

    async updateSelectedAchievements(username, achievements) {
        if (!Array.isArray(achievements) || achievements.length > 3) {
            throw new Error('Lista de logros no válida (máximo 3)');
        }

        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error('Usuario no encontrado.');

        user.selectedAchievements = achievements;
        await this.userRepo.update(user);

        return achievements;
    }
}

module.exports = AchievementService;
