const chatService = require('../services/chatService');

describe('Chat Service', () => {
    let mockDb;
    let mockMessagesCollection;

    beforeEach(() => {
        mockMessagesCollection = {
            insertOne: jest.fn().mockResolvedValue({}),
            find: jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                toArray: jest.fn().mockResolvedValue([])
            }),
            updateMany: jest.fn().mockResolvedValue({}),
            aggregate: jest.fn().mockReturnValue({
                toArray: jest.fn().mockResolvedValue([])
            })
        };

        mockDb = {
            collection: jest.fn().mockReturnValue(mockMessagesCollection)
        };
    });

    test('saveMessage debe insertar un mensaje correctamente', async () => {
        const msgData = { from: 'UserA', to: 'UserB', content: 'Hola' };
        const result = await chatService.saveMessage(mockDb, msgData);

        expect(mockDb.collection).toHaveBeenCalledWith('messages');
        expect(mockMessagesCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
            from: 'UserA',
            to: 'UserB',
            content: 'Hola',
            read: false,
            at: expect.any(Date)
        }));
        expect(result.content).toBe('Hola');
    });

    test('getHistory debe buscar mensajes bidireccionales', async () => {
        await chatService.getHistory(mockDb, 'UserA', 'UserB');

        expect(mockMessagesCollection.find).toHaveBeenCalledWith({
            $or: [
                { from: 'UserA', to: 'UserB' },
                { from: 'UserB', to: 'UserA' }
            ]
        });
    });

    test('markAsRead debe actualizar los mensajes no leídos', async () => {
        await chatService.markAsRead(mockDb, 'Sender', 'Receiver');

        expect(mockMessagesCollection.updateMany).toHaveBeenCalledWith(
            { from: 'Sender', to: 'Receiver', read: false },
            { $set: { read: true } }
        );
    });

    test('getUnreadByConversation debe retornar conteos por remitente', async () => {
        mockMessagesCollection.aggregate.mockReturnValue({
            toArray: jest.fn().mockResolvedValue([
                { _id: 'UserA', count: 2 },
                { _id: 'UserB', count: 5 }
            ])
        });

        const counts = await chatService.getUnreadByConversation(mockDb, 'CurrentUser');

        expect(counts).toEqual({
            'UserA': 2,
            'UserB': 5
        });
    });

    test('saveMessage de tipo challenge debe inicializar con status pending y read false', async () => {
        const msgData = { from: 'UserA', to: 'UserB', content: 'Duelo', type: 'challenge' };
        await chatService.saveMessage(mockDb, msgData);

        expect(mockMessagesCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
            from: 'UserA',
            to: 'UserB',
            content: 'Duelo',
            type: 'challenge',
            read: false,
            status: 'pending'
        }));
    });

    test('updateLatestChallengeStatus debe buscar y actualizar el último desafío pendiente marcándolo como leído', async () => {
        const mockFindOne = jest.fn().mockResolvedValue({ _id: 'challenge_id_123', from: 'UserA', to: 'UserB', status: 'pending' });
        const mockUpdateOne = jest.fn().mockResolvedValue({});
        
        mockMessagesCollection.findOne = mockFindOne;
        mockMessagesCollection.updateOne = mockUpdateOne;

        await chatService.updateLatestChallengeStatus(mockDb, 'UserA', 'UserB', 'accepted');

        expect(mockFindOne).toHaveBeenCalledWith(
            { from: 'UserA', to: 'UserB', type: 'challenge', status: 'pending' },
            { sort: { at: -1 } }
        );
        expect(mockUpdateOne).toHaveBeenCalledWith(
            { _id: 'challenge_id_123' },
            { $set: { status: 'accepted', read: true } }
        );
    });

    test('markExpiredChallenges debe expirar los desafíos pendientes que excedan el límite temporal', async () => {
        const mockUpdateMany = jest.fn().mockResolvedValue({});
        mockMessagesCollection.updateMany = mockUpdateMany;

        await chatService.markExpiredChallenges(mockDb, 5);

        expect(mockUpdateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'challenge',
                status: 'pending',
                at: expect.any(Object)
            }),
            { $set: { status: 'expired' } }
        );
    });
});
