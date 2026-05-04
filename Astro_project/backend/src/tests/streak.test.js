const { createUpdateStreak } = require('../services/streakService');

describe('Streak Service', () => {
    let mockUserRepo;
    let updateStreak;

    beforeEach(() => {
        mockUserRepo = {
            findByUsername: jest.fn(),
            update: jest.fn()
        };

        updateStreak = createUpdateStreak({
            userRepository: mockUserRepo,
            normalizeInventoryEntries: (i) => i,
            getInventoryQuantity: () => 0
        });
    });

    test('debe retornar null si el usuario no existe', async () => {
        mockUserRepo.findByUsername.mockResolvedValue(null);
        const result = await updateStreak('nonexistent');
        expect(result).toBeNull();
    });

    test('debe inicializar la racha a 1 en el primer juego', async () => {
        const User = require('../domain/User');
        mockUserRepo.findByUsername.mockResolvedValue(new User({
            user: 'testuser',
            streak: 0,
            lastActivity: null
        }));

        const result = await updateStreak('testuser', true);
        expect(result.streak).toBe(1);
        expect(mockUserRepo.update).toHaveBeenCalled();
    });

    test('debe incrementar la racha si el último juego fue ayer', async () => {
        const User = require('../domain/User');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        mockUserRepo.findByUsername.mockResolvedValue(new User({
            user: 'testuser',
            streak: 5,
            lastActivity: yesterday,
            lastGame: yesterday
        }));

        const result = await updateStreak('testuser', true);
        expect(result.streak).toBe(6);
    });
});
