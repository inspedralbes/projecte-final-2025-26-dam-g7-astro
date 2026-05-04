const roomManager = require('../ws/RoomManager');

describe('Room Manager (Multiplayer Logic)', () => {
    let mockRoomsCollection;
    let mockGetCollections;
    let mockWss;

    beforeEach(() => {
        // Limpiar estado interno del singleton
        roomManager.rooms.clear();
        roomManager.sessions.clear();

        mockRoomsCollection = {
            insertOne: jest.fn().mockResolvedValue({}),
            updateOne: jest.fn().mockResolvedValue({}),
            deleteOne: jest.fn().mockResolvedValue({}),
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
    });

    test('createRoom debe crear una sala y persistirla', async () => {
        const roomId = await roomManager.createRoom('HostUser', true, 4);

        expect(roomId).toBeDefined();
        expect(roomManager.rooms.has(roomId)).toBe(true);
        expect(mockRoomsCollection.insertOne).toHaveBeenCalled();
        
        const room = roomManager.getRoom(roomId);
        expect(room.host).toBe('HostUser');
        expect(room.players).toContain('HostUser');
    });

    test('joinRoom debe añadir un jugador a la sala', async () => {
        const roomId = await roomManager.createRoom('HostUser');
        const result = await roomManager.joinRoom(roomId, 'SecondUser');

        expect(result.success).toBe(true);
        const room = roomManager.getRoom(roomId);
        expect(room.players).toContain('SecondUser');
        expect(mockRoomsCollection.updateOne).toHaveBeenCalledWith(
            { id: roomId },
            { $addToSet: { players: 'SecondUser' } }
        );
    });

    test('leaveRoom debe eliminar la sala si se queda vacía', async () => {
        const roomId = await roomManager.createRoom('HostUser');
        await roomManager.leaveRoom(roomId, 'HostUser');

        expect(roomManager.rooms.has(roomId)).toBe(false);
        expect(mockRoomsCollection.deleteOne).toHaveBeenCalledWith({ id: roomId });
    });

    test('leaveRoom debe migrar el host si el host sale', async () => {
        const roomId = await roomManager.createRoom('HostUser');
        await roomManager.joinRoom(roomId, 'SecondUser');
        
        await roomManager.leaveRoom(roomId, 'HostUser');

        const room = roomManager.getRoom(roomId);
        expect(room.host).toBe('SecondUser');
        expect(room.players).not.toContain('HostUser');
    });

    test('startMatch debe fallar si no hay suficientes jugadores', async () => {
        const roomId = await roomManager.createRoom('HostUser');
        const result = await roomManager.startMatch(roomId);

        expect(result.error).toBe('Se necesitan al menos 2 jugadores');
    });

    test('startMatch debe iniciar la partida con 2 jugadores', async () => {
        const roomId = await roomManager.createRoom('HostUser');
        await roomManager.joinRoom(roomId, 'SecondUser');
        
        const result = await roomManager.startMatch(roomId);

        expect(result.success).toBe(true);
        expect(roomManager.rooms.get(roomId).status).toBe('ROULETTE');
    });
});
