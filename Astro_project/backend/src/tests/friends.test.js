const request = require('supertest');
const express = require('express');
const { registerFriendRoutes } = require('../routes/friendRoutes');

describe('Friend Routes', () => {
    let app;
    let mockUsersCollection;
    let mockGetCollections;

    beforeEach(() => {
        app = express();
        app.use(express.json());

        mockUsersCollection = {
            findOne: jest.fn(),
            updateOne: jest.fn().mockResolvedValue({}),
            find: jest.fn().mockReturnValue({
                toArray: jest.fn().mockResolvedValue([])
            })
        };

        mockGetCollections = jest.fn().mockReturnValue({
            users: mockUsersCollection
        });

        registerFriendRoutes(app, { getCollections: mockGetCollections });
    });

    test('POST /api/friends/request debe enviar una solicitud si el usuario existe', async () => {
        mockUsersCollection.findOne.mockResolvedValue({ user: 'FriendUser', friends: [] });

        const res = await request(app)
            .post('/api/friends/request')
            .send({ user: 'Me', friendName: 'FriendUser' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Solicitud enviada');
        expect(mockUsersCollection.updateOne).toHaveBeenCalledWith(
            { user: 'FriendUser' },
            { $addToSet: { friendRequests: 'Me' } }
        );
    });

    test('POST /api/friends/accept debe añadir a ambos como amigos', async () => {
        mockUsersCollection.findOne.mockResolvedValue({ 
            user: 'Me', 
            friends: ['FriendUser'], 
            friendRequests: [] 
        });

        const res = await request(app)
            .post('/api/friends/accept')
            .send({ user: 'Me', friendName: 'FriendUser' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(mockUsersCollection.updateOne).toHaveBeenCalledTimes(2);
    });

    test('POST /api/friends/request debe fallar si el usuario no existe', async () => {
        mockUsersCollection.findOne.mockResolvedValue(null);

        const res = await request(app)
            .post('/api/friends/request')
            .send({ user: 'Me', friendName: 'Unknown' });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Ese explorador no existe');
    });
});
