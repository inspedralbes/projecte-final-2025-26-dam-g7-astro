const { RoomManager } = require('../ws/RoomManager');
const InMemoryRoomRepository = require('../repositories/InMemoryRoomRepository');
const InMemoryUserRepository = require('../repositories/InMemoryUserRepository');

jest.useFakeTimers();

describe('RoomManager Garbage Collector', () => {
    let roomManager;
    let roomRepo;
    let userRepo;
    let mockWss;

    beforeEach(() => {
        roomManager = new RoomManager();
        
        roomRepo = new InMemoryRoomRepository();
        userRepo = new InMemoryUserRepository();
        mockWss = { clients: new Set() };

        roomManager.init(roomRepo, userRepo, mockWss);
    });

    afterEach(() => {
        roomManager.stop();
    });

    test('debe eliminar salas inactivas en LOBBY después del timeout', async () => {
        const roomId = await roomManager.createRoom('HostUser');
        const room = roomManager.rooms.get(roomId);
        
        // Simulamos que la sala es vieja
        room.createdAt = new Date(Date.now() - 20 * 60 * 1000); // 20 min ago
        room.lastActivity = Date.now() - 20 * 60 * 1000;

        // Ejecutamos el GC (avanzamos 5 minutos)
        jest.advanceTimersByTime(5 * 60 * 1000);
        // Dejamos que las promesas del setInterval se resuelvan
        for (let i = 0; i < 10; i++) await Promise.resolve();

        expect(roomManager.rooms.has(roomId)).toBe(false);
        const roomInDb = await roomRepo.findById(roomId);
        expect(roomInDb).toBeNull();
    });

    test('debe eliminar salas inactivas en PLAYING después del timeout largo', async () => {
        const roomId = await roomManager.createRoom('HostUser');
        await roomManager.joinRoom(roomId, 'GuestUser');
        await roomManager.startMatch(roomId);
        
        const room = roomManager.rooms.get(roomId);
        
        // Simulamos inactividad prolongada (más de 10 min)
        room.lastActivity = Date.now() - 15 * 60 * 1000; // 15 min ago

        jest.advanceTimersByTime(5 * 60 * 1000);
        for (let i = 0; i < 10; i++) await Promise.resolve();

        expect(roomManager.rooms.has(roomId)).toBe(false);
    });

    test('no debe eliminar salas activas', async () => {
        const roomId = await roomManager.createRoom('HostUser');
        
        // Actividad reciente
        roomManager.rooms.get(roomId).lastActivity = Date.now();

        jest.advanceTimersByTime(5 * 60 * 1000);
        for (let i = 0; i < 10; i++) await Promise.resolve();

        expect(roomManager.rooms.has(roomId)).toBe(true);
    });
});
