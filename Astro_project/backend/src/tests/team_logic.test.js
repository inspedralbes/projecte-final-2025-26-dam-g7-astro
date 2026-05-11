const { RoomManager } = require('../ws/RoomManager');
const InMemoryRoomRepository = require('../repositories/InMemoryRoomRepository');
const InMemoryUserRepository = require('../repositories/InMemoryUserRepository');
const { ROSCO_ROLES } = require('../constants/rosco');

describe('RoomManager Team and Role Logic', () => {
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
        roomManager.broadcastToRoom = jest.fn();
        roomManager.broadcastToTeam = jest.fn();
    });

    afterEach(() => {
        roomManager.stop();
    });

    test('debe asignar equipos y roles correctamente en juegos de parejas', async () => {
        const roomId = await roomManager.createRoom('User1');
        await roomManager.joinRoom(roomId, 'User2');
        await roomManager.joinRoom(roomId, 'User3');
        await roomManager.joinRoom(roomId, 'User4');

        // Forzamos un juego de parejas
        const room = roomManager.rooms.get(roomId);
        room.gameConfig.currentGame = 'SpelledRosco';
        roomManager.assignRoles(roomId, 'SpelledRosco');
        
        // User1 y User2 deberían ser equipo 1
        expect(room.gameConfig.teams['User1']).toBe('team-1');
        expect(room.gameConfig.teams['User2']).toBe('team-1');
        
        // User3 y User4 deberían ser equipo 2
        expect(room.gameConfig.teams['User3']).toBe('team-2');
        expect(room.gameConfig.teams['User4']).toBe('team-2');

        // Roles en SpelledRosco
        expect(room.gameConfig.subRoles['User1']).toBe(ROSCO_ROLES.SENDER);
        expect(room.gameConfig.subRoles['User2']).toBe(ROSCO_ROLES.GUESSER);
    });

    test('swapTeamRoles debe intercambiar roles dentro de un equipo', async () => {
        const roomId = await roomManager.createRoom('User1');
        await roomManager.joinRoom(roomId, 'User2');

        const room = roomManager.rooms.get(roomId);
        room.gameConfig.currentGame = 'SpelledRosco';
        roomManager.assignRoles(roomId, 'SpelledRosco');

        expect(room.gameConfig.subRoles['User1']).toBe(ROSCO_ROLES.SENDER);
        expect(room.gameConfig.subRoles['User2']).toBe(ROSCO_ROLES.GUESSER);

        roomManager.swapTeamRoles(roomId, 'team-1');

        expect(room.gameConfig.subRoles['User1']).toBe(ROSCO_ROLES.GUESSER);
        expect(room.gameConfig.subRoles['User2']).toBe(ROSCO_ROLES.SENDER);
        
        expect(roomManager.broadcastToTeam).toHaveBeenCalledWith(roomId, 'team-1', expect.objectContaining({
            type: 'GAME_ROLES_SWAPPED'
        }));
    });

    test('assignRoles en modo RACE debe asignar a cada uno su propio equipo', async () => {
        const roomId = await roomManager.createRoom('User1', true, 4, { mode: 'RACE' });
        await roomManager.joinRoom(roomId, 'User2');

        roomManager.assignRoles(roomId, 'AnyGame');
        const room = roomManager.rooms.get(roomId);

        expect(room.gameConfig.teams['User1']).toBe('User1');
        expect(room.gameConfig.teams['User2']).toBe('User2');
        expect(room.gameConfig.subRoles['User1']).toBeNull();
    });
});
