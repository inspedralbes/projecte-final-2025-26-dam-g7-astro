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

    async register(username, password, rank) {
        if (!username || username.trim() === '') {
            throw new Error('El nombre de usuario no puede estar vacío.');
        }

        const existingUser = await this.userRepo.findByUsername(username);
        if (existingUser) {
            throw new Error('El ID de tripulante ya existe.');
        }

        const newUser = new User({
            user: username,
            rank: rank || 'Cadete de Vuelo'
        });
        
        // Preparem el document per a MongoDB assegurant els noms de camps correctes
        const userDoc = {
            user: newUser.username,
            pass: password,
            plan: newUser.plan,
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

        const user = new User(userDoc);
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
