const { createUpdateStreak } = require('../services/streakService');

describe('Streak Service', () => {
    let mockUsersCollection;
    let mockGetCollections;
    let updateStreak;

    beforeEach(() => {
        mockUsersCollection = {
            findOne: jest.fn(),
            updateOne: jest.fn()
        };
        mockGetCollections = jest.fn().mockReturnValue({
            users: mockUsersCollection
        });

        updateStreak = createUpdateStreak({
            getCollections: mockGetCollections,
            normalizeInventoryEntries: (i) => i,
            getInventoryQuantity: () => 0
        });
    });

    test('debe retornar null si el usuario no existe', async () => {
        mockUsersCollection.findOne.mockResolvedValue(null);
        const result = await updateStreak('nonexistent');
        expect(result).toBeNull();
    });

    test('debe inicializar la racha a 1 en el primer juego', async () => {
        mockUsersCollection.findOne.mockResolvedValue({
            user: 'testuser',
            streak: 0,
            lastActivity: null
        });

        const result = await updateStreak('testuser', true);
        expect(result.streak).toBe(1);
        expect(mockUsersCollection.updateOne).toHaveBeenCalledWith(
            { user: 'testuser' },
            expect.objectContaining({
                $set: expect.objectContaining({ streak: 1 })
            })
        );
    });

    test('debe incrementar la racha si el último juego fue ayer', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        mockUsersCollection.findOne.mockResolvedValue({
            user: 'testuser',
            streak: 5,
            lastActivity: yesterday,
            lastGame: yesterday
        });

        const result = await updateStreak('testuser', true);
        expect(result.streak).toBe(6);
    });
});
