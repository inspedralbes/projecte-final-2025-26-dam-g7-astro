const roomManager = require('../ws/RoomManager');
const InMemoryRoomRepository = require('../repositories/InMemoryRoomRepository');
const InMemoryUserRepository = require('../repositories/InMemoryUserRepository');
const User = require('../domain/User');

describe('Room Manager (Multiplayer Logic)', () => {
    let roomRepo;
    let userRepo;
    let mockWss;

    beforeEach(() => {
        // Limpiar estado interno del singleton
        roomManager.rooms.clear();
        roomManager.sessions.clear();

        roomRepo = new InMemoryRoomRepository();
        userRepo = new InMemoryUserRepository();

        mockWss = {
            clients: new Set()
        };

        roomManager.init(roomRepo, userRepo, mockWss);
    });

    test('createRoom debe crear una sala y persistirla', async () => {
        const roomId = await roomManager.createRoom('HostUser', true, 4);

        expect(roomId).toBeDefined();
        expect(roomManager.rooms.has(roomId)).toBe(true);

        const roomInDb = await roomRepo.findById(roomId);
        expect(roomInDb).toBeDefined();
        expect(roomInDb.host).toBe('HostUser');

        const room = await roomManager.getRoom(roomId);
        expect(room.host).toBe('HostUser');
        expect(room.players.map(p => p.username)).toContain('HostUser');
    });

    test('joinRoom debe añadir un jugador a la sala', async () => {
        const roomId = await roomManager.createRoom('HostUser');
        const result = await roomManager.joinRoom(roomId, 'SecondUser');

        expect(result.success).toBe(true);
        const room = await roomManager.getRoom(roomId);
        expect(room.players.map(p => p.username)).toContain('SecondUser');

        const roomInDb = await roomRepo.findById(roomId);
        expect(roomInDb.players).toContain('SecondUser');
    });

    test('leaveRoom debe eliminar la sala si se queda vacía', async () => {
        const roomId = await roomManager.createRoom('HostUser');
        await roomManager.leaveRoom(roomId, 'HostUser');

        expect(roomManager.rooms.has(roomId)).toBe(false);
        const roomInDb = await roomRepo.findById(roomId);
        expect(roomInDb).toBeNull();
    });

    test('leaveRoom debe migrar el host si el host sale', async () => {
        const roomId = await roomManager.createRoom('HostUser');
        await roomManager.joinRoom(roomId, 'SecondUser');

        await roomManager.leaveRoom(roomId, 'HostUser');

        const room = await roomManager.getRoom(roomId);
        expect(room.host).toBe('SecondUser');
        expect(room.players.map(p => p.username)).not.toContain('HostUser');
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

    test('getRoom debe retornar datos completos del jugador (level, rank, avatar)', async () => {
        // Setup: usuario con datos específicos
        await userRepo.save(new User({
            user: 'RichUser',
            level: 42,
            rank: 'Comandante',
            avatar: 'spaceship_gold'
        }));

        const roomId = await roomManager.createRoom('RichUser');
        const room = await roomManager.getRoom(roomId);

        expect(room.players.length).toBe(1);
        const player = room.players[0];

        expect(player.username).toBe('RichUser');
        expect(player.level).toBe(42);
        expect(player.rank).toBe('Comandante');
        expect(player.avatar).toBe('spaceship_gold');
    });
});
