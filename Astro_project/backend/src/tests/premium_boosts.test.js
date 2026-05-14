// Astro_project/backend/src/tests/premium_boosts.test.js
const GameService = require('../services/gameService');
const User = require('../domain/User');

describe('Premium Avatar Boosts Logic', () => {
    let gameService;
    let userRepo;
    let mockPartidaRepo;
    let mockInventoryService;

    beforeEach(() => {
        userRepo = {
            findByUsername: jest.fn(),
            update: jest.fn()
        };
        mockPartidaRepo = {
            save: jest.fn()
        };
        mockInventoryService = {
            getEquippedAvatarBoost: jest.fn()
        };

        gameService = new GameService({
            userRepository: userRepo,
            partidaRepository: mockPartidaRepo,
            updateStreak: jest.fn().mockResolvedValue({ streak: 1 }),
            JERARQUIA: ['Cadete'],
            normalizeActiveBoosters: (b) => b || {},
            consumeBoostersForCompletedGame: (b) => b,
            getScoreMultiplier: () => 1.0,
            getCoinsMultiplier: () => 1.0,
            statsService: { getUserStats: jest.fn().mockResolvedValue({}) },
            inventoryService: mockInventoryService
        });
    });

    test('Avatar Ciber Hacker debe aplicar multiplicador x1.15 a la puntuación', async () => {
        const username = 'testuser';
        const user = new User({ user: username, xp: 0, coins: 0, inventory: [] });
        userRepo.findByUsername.mockResolvedValue(user);
        
        // Simulamos que tiene el boost de Hacker (102)
        mockInventoryService.getEquippedAvatarBoost.mockReturnValue({ type: 'score', multiplier: 1.15 });

        const result = await gameService.completeGame(username, { game: 'RadarScan', score: 100 });

        // Score base 100 * 1.15 = 115
        // XP = 115 / 10 = 11
        // Coins = 11 * 1.0 = 11
        expect(result.boostedScore).toBe(115);
        expect(result.xpEarned).toBe(11);
        expect(result.coinsEarned).toBe(11);
    });

    test('Avatar Caballero Estelar debe aplicar multiplicador x1.1 a las AstroCoins', async () => {
        const username = 'testuser';
        const user = new User({ user: username, xp: 0, coins: 0, inventory: [] });
        userRepo.findByUsername.mockResolvedValue(user);
        
        // Simulamos que tiene el boost de Knight (203)
        mockInventoryService.getEquippedAvatarBoost.mockReturnValue({ type: 'coins', multiplier: 1.1 });

        const result = await gameService.completeGame(username, { game: 'RadarScan', score: 100 });

        // Score base 100
        // XP = 100 / 10 = 10
        // Coins = 10 * 1.1 = 11
        expect(result.boostedScore).toBe(100);
        expect(result.xpEarned).toBe(10);
        expect(result.coinsEarned).toBe(11);
    });

    test('Sin avatar premium no debe haber bonificaciones extra', async () => {
        const username = 'testuser';
        const user = new User({ user: username, xp: 0, coins: 0, inventory: [] });
        userRepo.findByUsername.mockResolvedValue(user);
        
        // Sin boost
        mockInventoryService.getEquippedAvatarBoost.mockReturnValue(null);

        const result = await gameService.completeGame(username, { game: 'RadarScan', score: 100 });

        expect(result.boostedScore).toBe(100);
        expect(result.xpEarned).toBe(10);
        expect(result.coinsEarned).toBe(10);
    });
});
