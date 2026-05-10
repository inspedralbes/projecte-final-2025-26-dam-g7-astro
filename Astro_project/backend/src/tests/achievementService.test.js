const AchievementService = require('../services/achievementService');
const User = require('../domain/User');

describe('AchievementService', () => {
    let achievementService;
    let mockUserRepo;
    let mockNormalize;

    beforeEach(() => {
        mockUserRepo = {
            findByUsername: jest.fn(),
            update: jest.fn()
        };
        mockNormalize = jest.fn(ids => ids);

        achievementService = new AchievementService({
            userRepository: mockUserRepo,
            normalizeAchievementIds: mockNormalize
        });
    });

    test('getUserAchievements debe retornar los logros del usuario', async () => {
        mockUserRepo.findByUsername.mockResolvedValue({
            selectedAchievements: [1, null, 2],
            unlockedAchievements: [1, 2, 3]
        });

        const result = await achievementService.getUserAchievements('test');
        expect(result.selectedAchievements).toEqual([1, null, 2]);
        expect(result.unlockedAchievements).toEqual([1, 2, 3]);
    });

    test('updateSelectedAchievements debe actualizar los logros seleccionados', async () => {
        mockUserRepo.findByUsername.mockResolvedValue(new User({ user: 'test' }));
        
        const newSelection = [1, 2, 3];
        await achievementService.updateSelectedAchievements('test', newSelection);
        
        expect(mockUserRepo.update).toHaveBeenCalled();
        const updatedUser = mockUserRepo.update.mock.calls[0][0];
        expect(updatedUser.selectedAchievements).toEqual(newSelection);
    });

    test('updateSelectedAchievements debe fallar si hay más de 3 logros', async () => {
        await expect(achievementService.updateSelectedAchievements('test', [1, 2, 3, 4]))
            .rejects.toThrow('Lista de logros no válida (máximo 3)');
    });
});
