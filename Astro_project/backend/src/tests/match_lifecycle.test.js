const { RoomManager } = require('../ws/RoomManager');
const InMemoryRoomRepository = require('../repositories/InMemoryRoomRepository');
const InMemoryUserRepository = require('../repositories/InMemoryUserRepository');

jest.useFakeTimers();

describe('Match Lifecycle (LOBBY -> ROULETTE -> PLAYING -> ROUND_RESULTS)', () => {
    let roomManager;
    let roomRepo;
    let userRepo;
    let mockWss;

    beforeEach(() => {
        roomManager = new RoomManager();
        
        // Reducir duraciones para los tests
        roomManager.gameDurations = {
            'RadarScan': 5000,
            'RadioSignal': 5000,
            'RhymeSquad': 5000,
            'SpelledRosco': 5000,
            'SyllableQuest': 5000,
            'SymmetryBreaker': 5000,
            'WordConstruction': 5000
        };

        roomRepo = new InMemoryRoomRepository();
        userRepo = new InMemoryUserRepository();

        mockWss = {
            clients: new Set()
        };

        roomManager.init(roomRepo, userRepo, mockWss);
        
        // Mock broadcastToRoom para evitar errores de red en el test
        roomManager.broadcastToRoom = jest.fn();
    });

    afterEach(() => {
        roomManager.stop();
    });

    test('Ciclo de vida completo de una ronda', async () => {
        // 1. LOBBY
        const roomId = await roomManager.createRoom('UserA', true, 4, { mode: 'RACE' });
        await roomManager.joinRoom(roomId, 'UserB');
        
        const room = roomManager.rooms.get(roomId);
        expect(room.status).toBe('LOBBY');

        // 2. ROULETTE / PLAYING (en RACE es directo)
        await roomManager.startMatch(roomId);
        room.gameConfig.currentGame = 'SymmetryBreaker';
        roomManager.assignRoles(roomId, 'SymmetryBreaker');

        expect(room.status).toBe('PLAYING');
        expect(room.gameConfig.currentGame).toBe('SymmetryBreaker');

        // 3. PLAYING (ya está en PLAYING)
        await roomManager.setRoomStatus(roomId, 'PLAYING');
        expect(room.status).toBe('PLAYING');
        expect(roomManager.roundTimers.has(roomId)).toBe(true);

        // 4. ROUND_RESULTS (simular que ambos jugadores terminan)
        // Simulamos puntuaciones
        roomManager.handleGameAction(roomId, 'UserA', { type: 'SCORE_UPDATE', score: 10 });
        roomManager.handleGameAction(roomId, 'UserB', { type: 'SCORE_UPDATE', score: 5 });

        await roomManager.handlePlayerFinished(roomId, 'UserA');
        await roomManager.handlePlayerFinished(roomId, 'UserB');
        
        // Esperamos a que finalice la lógica async de finishRound
        for (let i = 0; i < 10; i++) await Promise.resolve();

        expect(room.status).toBe('ROUND_RESULTS');
        expect(room.gameConfig.scores['UserA']).toBe(1);
        expect(roomManager.broadcastToRoom).toHaveBeenCalledWith(roomId, expect.objectContaining({
            type: 'ROUND_ENDED_BY_WINNER',
            winner: 'UserA'
        }));

        // 5. Transición después de ROUND_RESULTS (usamos fake timers)
        jest.advanceTimersByTime(5000);
        // Esperamos a que se resuelvan las promesas del setTimeout async
        for (let i = 0; i < 10; i++) await Promise.resolve();

        // Debería volver a PLAYING (en RACE mode) si no se ha alcanzado la puntuación máxima
        expect(room.status).toBe('PLAYING');
        expect(room.gameConfig.currentRound).toBe(1);
    });

    test('SymmetryBreaker (juego no par) se inicia correctamente', async () => {
        const roomId = await roomManager.createRoom('UserA');
        await roomManager.joinRoom(roomId, 'UserB');
        
        const room = roomManager.rooms.get(roomId);
        
        // Forzamos el juego SymmetryBreaker
        await roomManager.startMatch(roomId);
        room.gameConfig.currentGame = 'SymmetryBreaker';
        roomManager.assignRoles(roomId, 'SymmetryBreaker');
        
        // No debería fallar al llamar a setRoomStatus
        await roomManager.setRoomStatus(roomId, 'PLAYING');
        
        expect(room.status).toBe('PLAYING');
        expect(room.gameConfig.teams['UserA']).toBe('red');
        expect(room.gameConfig.teams['UserB']).toBe('blue');
    });

    test('El tiempo agotado finaliza la ronda', async () => {
        const roomId = await roomManager.createRoom('UserA');
        await roomManager.joinRoom(roomId, 'UserB');
        await roomManager.startMatch(roomId);
        await roomManager.setRoomStatus(roomId, 'PLAYING');

        expect(roomManager.roundTimers.has(roomId)).toBe(true);

        // Avanzamos 10 segundos (nuestras duraciones de test son 5s)
        jest.advanceTimersByTime(10000);
        for (let i = 0; i < 10; i++) await Promise.resolve();

        expect(roomManager.rooms.get(roomId).status).toBe('ROUND_RESULTS');
    });

    test('La partida termina cuando se alcanza el límite de rondas', async () => {
        const roomId = await roomManager.createRoom('UserA', true, 4, { pointsToWin: 1, mode: 'RACE' });
        await roomManager.joinRoom(roomId, 'UserB');
        await roomManager.startMatch(roomId);
        
        const room = roomManager.rooms.get(roomId);
        room.gameConfig.currentGame = 'SymmetryBreaker';
        roomManager.assignRoles(roomId, 'SymmetryBreaker');
        
        await roomManager.setRoomStatus(roomId, 'PLAYING');

        // UserA gana la única ronda necesaria
        roomManager.handleGameAction(roomId, 'UserA', { type: 'SCORE_UPDATE', score: 10 });
        await roomManager.handlePlayerFinished(roomId, 'UserA');
        await roomManager.handlePlayerFinished(roomId, 'UserB');

        // Esperamos a que finalice la lógica async de finishRound
        for (let i = 0; i < 10; i++) await Promise.resolve();

        // Al ser la última ronda, pasa a MATCH_RESULTS
        expect(roomManager.rooms.get(roomId).status).toBe('MATCH_RESULTS');

        // Avanzamos 5 segundos para la transición final
        jest.advanceTimersByTime(5000);
        for (let i = 0; i < 10; i++) await Promise.resolve();

        expect(roomManager.rooms.get(roomId).status).toBe('GAME_OVER');
        expect(roomManager.broadcastToRoom).toHaveBeenCalledWith(roomId, expect.objectContaining({
            type: 'MATCH_FINISHED',
            winner: 'UserA'
        }));
    });

    test('Regreso al lobby tras finalizar partida', async () => {
        const roomId = await roomManager.createRoom('UserA', true, 4, { mode: 'RACE' });
        await roomManager.joinRoom(roomId, 'UserB');
        
        const room = roomManager.rooms.get(roomId);
        room.status = 'GAME_OVER';

        // Primer jugador vuelve
        await roomManager.handlePlayerReturnToLobby(roomId, 'UserA');
        expect(room.status).toBe('GAME_OVER'); // Aún falta UserB

        // Segundo jugador vuelve
        await roomManager.handlePlayerReturnToLobby(roomId, 'UserB');
        
        // Esperamos promesas
        for (let i = 0; i < 10; i++) await Promise.resolve();

        expect(room.status).toBe('LOBBY');
        expect(roomManager.roundFinishedPlayers.has(roomId)).toBe(false);
        expect(roomManager.roundGameScores.has(roomId)).toBe(false);
    });
});
