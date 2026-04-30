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
});
