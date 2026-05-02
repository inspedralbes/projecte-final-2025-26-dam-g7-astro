// Astro_project/backend/src/tests/statsService.test.js

const { StatsService } = require('../services/statsService');
const InMemoryUserRepository = require('../repositories/InMemoryUserRepository');
const InMemoryPartidaRepository = require('../repositories/InMemoryPartidaRepository');
const User = require('../domain/User');

describe('StatsService', () => {
    let statsService;
    let userRepo;
    let partidaRepo;

    beforeEach(() => {
        userRepo = new InMemoryUserRepository();
        partidaRepo = new InMemoryPartidaRepository();
        
        statsService = new StatsService({
            userRepository: userRepo,
            partidaRepository: partidaRepo,
            normalizeInventoryEntries: (inv) => inv, // Mock
            getInventoryQuantity: () => 0, // Mock
            normalizeActiveBoosters: (b) => b // Mock
        });
    });

    test('Hauria de retornar les estadístiques correctament per a un usuari existent', async () => {
        // Arrange
        const username = 'Enrique';
        const user = new User({ user: username, level: 5, coins: 500 });
        await userRepo.save(user);

        await partidaRepo.save({ user: username, game: 'RadarScan', score: 100, createdAt: new Date() });
        await partidaRepo.save({ user: username, game: 'RadioSignal', score: 200, createdAt: new Date() });

        // Act
        const stats = await statsService.getUserStats(username);

        // Assert
        expect(stats).not.toBeNull();
        expect(stats.user).toBe(username);
        expect(stats.level).toBe(5);
        expect(stats.coins).toBe(500);
        expect(stats.gamesPlayed).toBe(2);
        expect(stats.totalPoints).toBe(300);
        expect(stats.gamesByType.RadarScan).toBe(1);
        expect(stats.gamesByType.RadioSignal).toBe(1);
    });

    test('Hauria de retornar null si l\'usuari no existeix', async () => {
        const stats = await statsService.getUserStats('Inexistent');
        expect(stats).toBeNull();
    });

    test('Hauria de regenerar missions si la data ha canviat', async () => {
        // Arrange
        const username = 'Enrique';
        const oldDate = 'Mon Jan 01 2024';
        const user = new User({ 
            user: username, 
            lastDailyMissionDate: oldDate,
            dailyMissions: [{ id: 'old' }]
        });
        await userRepo.save(user);

        // Act
        const stats = await statsService.getUserStats(username);

        // Assert
        expect(stats.lastDailyMissionDate).not.toBe(oldDate);
        expect(stats.dailyMissions.length).toBe(3);
        expect(stats.dailyMissions[0].id).not.toBe('old');
    });
});
