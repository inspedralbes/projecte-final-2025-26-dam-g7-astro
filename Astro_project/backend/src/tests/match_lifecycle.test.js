const roomManager = require('../ws/RoomManager');

jest.useFakeTimers();

describe('Match Lifecycle (LOBBY -> ROULETTE -> PLAYING -> ROUND_RESULTS)', () => {
    let mockRoomsCollection;
    let mockGetCollections;
    let mockWss;

    beforeEach(() => {
        // Limpiar estado interno del singleton
        roomManager.rooms.clear();
        roomManager.sessions.clear();
        roomManager.roundTimers.clear();
        roomManager.roundFinishedPlayers.clear();
        roomManager.roundGameScores.clear();

        mockRoomsCollection = {
            insertOne: jest.fn().mockResolvedValue({}),
            updateOne: jest.fn().mockResolvedValue({}),
            deleteOne: jest.fn().mockResolvedValue({}),
            deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
            find: jest.fn().mockReturnValue({
                toArray: jest.fn().mockResolvedValue([])
            })
        };

        mockGetCollections = jest.fn().mockReturnValue({
            rooms: mockRoomsCollection
        });

        mockWss = {
            clients: new Set()
        };

        roomManager.init(mockGetCollections, mockWss);
        
        // Mock broadcastToRoom para evitar errores de red en el test
        roomManager.broadcastToRoom = jest.fn();
    });

    test('Ciclo de vida completo de una ronda', async () => {
        // 1. LOBBY
        const roomId = await roomManager.createRoom('UserA');
        await roomManager.joinRoom(roomId, 'UserB');
        
        const room = roomManager.rooms.get(roomId);
        expect(room.status).toBe('LOBBY');

        // 2. ROULETTE
        await roomManager.startMatch(roomId);
        expect(room.status).toBe('ROULETTE');
        expect(room.gameConfig.currentGame).toBeDefined();

        // 3. PLAYING
        await roomManager.setRoomStatus(roomId, 'PLAYING');
        expect(room.status).toBe('PLAYING');
        expect(roomManager.roundTimers.has(roomId)).toBe(true);

        // 4. ROUND_RESULTS (simular que ambos jugadores terminan)
        // Simulamos puntuaciones
        roomManager.handleGameAction(roomId, 'UserA', { type: 'SCORE_UPDATE', score: 10 });
        roomManager.handleGameAction(roomId, 'UserB', { type: 'SCORE_UPDATE', score: 5 });

        await roomManager.handlePlayerFinished(roomId, 'UserA');
        await roomManager.handlePlayerFinished(roomId, 'UserB');

        expect(room.status).toBe('ROUND_RESULTS');
        expect(room.gameConfig.scores['UserA']).toBe(1);
        expect(roomManager.broadcastToRoom).toHaveBeenCalledWith(roomId, expect.objectContaining({
            type: 'ROUND_ENDED_BY_WINNER',
            winner: 'UserA'
        }));

        // 5. Transición después de ROUND_RESULTS (usamos fake timers)
        jest.advanceTimersByTime(5000);

        // Debería volver a ROULETTE si no se ha alcanzado la puntuación máxima
        expect(room.status).toBe('ROULETTE');
        expect(room.gameConfig.currentRound).toBe(1);
    });

    test('SymmetryBreaker (juego no par) se inicia correctamente', async () => {
        const roomId = await roomManager.createRoom('UserA');
        await roomManager.joinRoom(roomId, 'UserB');
        
        const room = roomManager.rooms.get(roomId);
        
        // Forzamos el juego SymmetryBreaker
        await roomManager.startMatch(roomId);
        room.gameConfig.currentGame = 'SymmetryBreaker';
        
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

        // Avanzamos 60 segundos
        jest.advanceTimersByTime(60000);

        expect(roomManager.rooms.get(roomId).status).toBe('ROUND_RESULTS');
    });

    test('La partida termina cuando se alcanza el límite de rondas', async () => {
        const roomId = await roomManager.createRoom('UserA', true, 4, { pointsToWin: 1 });
        await roomManager.joinRoom(roomId, 'UserB');
        await roomManager.startMatch(roomId);
        
        const room = roomManager.rooms.get(roomId);
        room.gameConfig.currentGame = 'SymmetryBreaker';
        
        await roomManager.setRoomStatus(roomId, 'PLAYING');

        // UserA gana la única ronda necesaria
        roomManager.handleGameAction(roomId, 'UserA', { type: 'SCORE_UPDATE', score: 10 });
        await roomManager.handlePlayerFinished(roomId, 'UserA');
        await roomManager.handlePlayerFinished(roomId, 'UserB');

        expect(roomManager.rooms.get(roomId).status).toBe('ROUND_RESULTS');

        // Avanzamos 5 segundos para la transición final
        jest.advanceTimersByTime(5000);

        expect(roomManager.rooms.get(roomId).status).toBe('GAME_OVER');
        expect(roomManager.broadcastToRoom).toHaveBeenCalledWith(roomId, expect.objectContaining({
            type: 'MATCH_FINISHED',
            winner: 'UserA'
        }));
    });
});
