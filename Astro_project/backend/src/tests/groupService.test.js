const GroupService = require('../services/groupService');

describe('GroupService', () => {
    let groupService;
    let mockUserRepo;
    let mockCollection;

    beforeEach(() => {
        mockCollection = {
            find: jest.fn().mockReturnThis(),
            toArray: jest.fn()
        };

        mockUserRepo = {
            findByUsername: jest.fn(),
            saveDoc: jest.fn(),
            collection: mockCollection
        };

        groupService = new GroupService({ userRepository: mockUserRepo });
    });

    test('createTeacher debe crear un profesor si el usuario es un centro', async () => {
        mockUserRepo.findByUsername.mockImplementation(async (username) => {
            if (username === 'center1') return { username: 'center1', role: 'CENTER' };
            return null;
        });
        mockUserRepo.saveDoc.mockResolvedValue({ insertedId: 'teacher1' });

        const result = await groupService.createTeacher('center1', {
            username: 'profesor1',
            password: 'password123'
        });

        expect(result).toBeDefined();
        expect(mockUserRepo.saveDoc).toHaveBeenCalledWith(expect.objectContaining({
            user: 'profesor1',
            role: 'TEACHER',
            parentId: 'center1'
        }));
    });

    test('createTeacher debe lanzar error si el usuario no es un centro', async () => {
        mockUserRepo.findByUsername.mockResolvedValue({ username: 'notacenter', role: 'STUDENT' });

        await expect(groupService.createTeacher('notacenter', { username: 'p1', password: 'p1' }))
            .rejects.toThrow('El usuario no es un centro autorizado.');
    });

    test('createStudent debe crear un alumno si el usuario es un profesor', async () => {
        mockUserRepo.findByUsername.mockImplementation(async (username) => {
            if (username === 'teacher1') return { username: 'teacher1', role: 'TEACHER' };
            return null;
        });
        mockUserRepo.saveDoc.mockResolvedValue({ insertedId: 'student1' });

        const result = await groupService.createStudent('teacher1', {
            username: 'alumno1',
            password: 'password123'
        });

        expect(result).toBeDefined();
        expect(mockUserRepo.saveDoc).toHaveBeenCalledWith(expect.objectContaining({
            user: 'alumno1',
            role: 'STUDENT',
            parentId: 'teacher1'
        }));
    });

    test('getMembers debe retornar los miembros asociados al padre', async () => {
        const membersData = [
            { user: 'm1', role: 'STUDENT', level: 1 },
            { user: 'm2', role: 'STUDENT', level: 2 }
        ];
        mockCollection.toArray.mockResolvedValue(membersData);

        const members = await groupService.getMembers('parent1');
        
        expect(members).toHaveLength(2);
        expect(members[0].username).toBe('m1');
        expect(mockCollection.find).toHaveBeenCalledWith({ parentId: 'parent1' });
    });
});
