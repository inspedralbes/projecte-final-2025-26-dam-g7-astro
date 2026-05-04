const User = require('../domain/User');
const MongoUserRepository = require('../repositories/MongoUserRepository');

describe('MongoUserRepository', () => {
    let mockCollection;
    let repo;

    beforeEach(() => {
        mockCollection = {
            findOne: jest.fn(),
            insertOne: jest.fn(),
            updateOne: jest.fn(),
            find: jest.fn()
        };
        repo = new MongoUserRepository(() => mockCollection);
    });

    test('findByUsername should handle strings and numbers', async () => {
        mockCollection.findOne.mockResolvedValue({ user: 'testuser', level: 5 });
        
        const user = await repo.findByUsername('testuser');
        
        expect(mockCollection.findOne).toHaveBeenCalledWith({
            $or: [{ user: 'testuser' }]
        });
        expect(user).toBeInstanceOf(User);
        expect(user.username).toBe('testuser');
    });

    test('findByUsername with numeric string should include number in query', async () => {
        mockCollection.findOne.mockResolvedValue({ user: 123, level: 10 });
        
        const user = await repo.findByUsername('123');
        
        expect(mockCollection.findOne).toHaveBeenCalledWith({
            $or: [{ user: '123' }, { user: 123 }]
        });
        expect(user.username).toBe(123);
    });

    test('update should use _id if available', async () => {
        const user = new User({ _id: 'some-id', user: 'testuser' });
        
        await repo.update(user);
        
        expect(mockCollection.updateOne).toHaveBeenCalledWith(
            { _id: 'some-id' },
            expect.objectContaining({ $set: expect.any(Object) })
        );
    });

    test('update should use username and handle numbers if _id is missing', async () => {
        const user = new User({ user: '123' });
        
        await repo.update(user);
        
        expect(mockCollection.updateOne).toHaveBeenCalledWith(
            { user: { $in: ['123', 123] } },
            expect.objectContaining({ $set: expect.any(Object) })
        );
    });
});
