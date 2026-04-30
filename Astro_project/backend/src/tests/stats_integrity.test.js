const { registerStatsService } = require('../services/statsService');

// Mock de la base de datos para el test
const mockCollections = {
    users: {
        findOne: jest.fn(async (query) => {
            if (query.$or && query.$or[0].user === 'kim') {
                return {
                    _id: 'mock_id_121',
                    user: 'kim',
                    level: 121,
                    coins: 569400,
                    rank: 'Arquitecto de Realidades',
                    friends: ['amigo1'],
                    dailyMissions: [],
                    weeklyMissions: [],
                    gameHistory: [],
                    selectedAchievements: ['logro1'],
                    inventory: []
                };
            }
            return null;
        }),
        updateOne: jest.fn(async () => ({ modifiedCount: 1 }))
    },
    partides: {
        aggregate: jest.fn(() => ({
            toArray: async () => [{ total: 1000000 }]
        }))
    }
};

const mockApp = {};
const mockDependencies = {
    getCollections: () => mockCollections,
    JERARQUIA: ['Cadete', 'Arquitecto de Realidades']
};

describe('Integridad de Estadísticas (Stats Integrity)', () => {
    test('Debe recuperar correctamente todos los campos críticos de un usuario de alto nivel', async () => {
        const service = registerStatsService(mockApp, mockDependencies);
        const stats = await service.getUserStats('kim');

        // 1. Verificación de existencia
        expect(stats).toBeDefined();
        expect(stats.user).toBe('kim');

        // 2. Verificación de progreso (Lo que causaba el bug del Nivel 1)
        expect(stats.level).toBe(121);
        expect(stats.coins).toBe(569400);
        expect(stats.rank).toBe('Arquitecto de Realidades');

        // 3. Verificación de estructura de Arrays (Social y Logros)
        expect(Array.isArray(stats.friends)).toBe(true);
        expect(stats.friends).toContain('amigo1');
        expect(Array.isArray(stats.selectedAchievements)).toBe(true);
        expect(Array.isArray(stats.dailyMissions)).toBe(true);
        // 4. Verificación de metadatos técnicos
        expect(stats._id).toBe('mock_id_121');
    });

    test('Debe devolver null si el usuario no existe (exact match)', async () => {
        const service = registerStatsService(mockApp, mockDependencies);
        const stats = await service.getUserStats('usuario_inexistente');
        expect(stats).toBeNull();
    });
});
