// Astro_project/backend/src/services/streakService.js

class StreakService {
    constructor({
        userRepository,
        normalizeInventoryEntries,
        getInventoryQuantity
    }) {
        this.userRepo = userRepository;
        this.normalizeInventoryEntries = normalizeInventoryEntries;
        this.getInventoryQuantity = getInventoryQuantity;
    }

    async updateStreak(username, isGame = false) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) return null;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const lastActivity = user.lastActivity ? new Date(user.lastActivity) : null;
        const lastGame = user.lastGame ? new Date(user.lastGame) : null;
        const normalizedInventory = this.normalizeInventoryEntries(user.inventory || []);
        
        // Utilitzar el camp de l'objecte de domini User o el càlcul de l'inventari
        const availableFreezes = Math.max(user.streakFreezes || 0, this.getInventoryQuantity(normalizedInventory, 2));

        let newStreak = user.streak || 0;
        let needsFreeze = false;

        if (lastActivity) {
            const lastActivityDay = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());
            const diffDays = Math.floor((today - lastActivityDay) / (1000 * 60 * 60 * 24));

            if (diffDays > 1) {
                if (availableFreezes > 0) {
                    needsFreeze = true;
                } else {
                    newStreak = 0;
                }
            }
        }

        if (isGame) {
            if (needsFreeze) {
                newStreak = 1;
                needsFreeze = false;
                // Si usem un freeze, hauríem de restar-lo de l'inventari? 
                // La lògica original sembla que només els "compta", però no els resta aquí.
            } else if (newStreak === 0) {
                newStreak = 1;
            } else if (lastGame) {
                const lastGameDay = new Date(lastGame.getFullYear(), lastGame.getMonth(), lastGame.getDate());
                const diffGameDays = Math.floor((today - lastGameDay) / (1000 * 60 * 60 * 24));

                if (diffGameDays >= 1) {
                    newStreak++;
                }
            } else {
                newStreak = 1;
            }
        }

        // Actualitzar l'objecte User
        user.streak = newStreak;
        user.streakFreezes = availableFreezes;
        user.lastActivity = now;
        if (isGame) {
            user.lastGame = now;
        }

        await this.userRepo.update(user);

        return { 
            streak: newStreak, 
            needsFreeze, 
            lastGame: isGame ? now : user.lastGame 
        };
    }
}

// Compatibilitat temporal
function createUpdateStreak(dependencies) {
    const service = new StreakService({
        userRepository: dependencies.userRepository,
        normalizeInventoryEntries: dependencies.normalizeInventoryEntries,
        getInventoryQuantity: dependencies.getInventoryQuantity
    });
    return (username, isGame) => service.updateStreak(username, isGame);
}

module.exports = {
    StreakService,
    createUpdateStreak
};
