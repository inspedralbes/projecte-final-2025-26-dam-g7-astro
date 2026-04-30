
const assert = require('assert');
const { registerStatsService } = require('../services/statsService');

// Mock de la base de datos
const mockCollections = {
    users: {
        findOne: async (query) => {
            if (query.$or[0].user === 'kim') {
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
                    selectedAchievements: ['logro1']
                };
            }
            return null;
        },
        updateOne: async () => ({ modifiedCount: 1 })
    },
    partides: {
        aggregate: () => ({
            toArray: async () => [{ total: 1000000 }]
        })
    }
};

const mockApp = {};
const mockDependencies = {
    getCollections: () => mockCollections,
    JERARQUIA: ['Cadete', 'Arquitecto de Realidades']
};

async function testStatsIntegrity() {
    console.log('🧪 Ejecutando Test de Integridad de Estadísticas...');
    
    const service = registerStatsService(mockApp, mockDependencies);
    const stats = await service.getUserStats('kim');

    // 1. Verificar que el usuario no sea nulo
    assert.ok(stats, 'El servicio debería encontrar al usuario "kim"');

    // 2. Verificar Campos Críticos (Lo que fallaba antes)
    assert.strictEqual(stats.level, 121, 'El nivel debería ser 121');
    assert.strictEqual(stats.coins, 569400, 'Los créditos deberían ser 569400');
    assert.strictEqual(stats.rank, 'Arquitecto de Realidades', 'El rango debería ser correcto');
    
    // 3. Verificar Estructura Social y Progresión
    assert.ok(Array.isArray(stats.friends), 'El campo friends debe ser un Array');
    assert.strictEqual(stats.friends.length, 1, 'Debería tener 1 amigo');
    assert.ok(Array.isArray(stats.selectedAchievements), 'El campo selectedAchievements debe ser un Array');
    assert.ok(Array.isArray(stats.dailyMissions), 'El campo dailyMissions debe ser un Array');

    // 4. Verificar que el _id esté presente (Para depuración)
    assert.ok(stats._id, 'El _id debe estar presente en la respuesta');

    console.log('✅ Test de Integridad pasado con éxito: Todos los campos están "bien conectados".');
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testStatsIntegrity().catch(err => {
        console.error('❌ TEST FALLIDO:', err.message);
        process.exit(1);
    });
}

module.exports = { testStatsIntegrity };
