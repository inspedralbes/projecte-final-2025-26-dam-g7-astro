const request = require('supertest');
const express = require('express');
const { registerFriendRoutes } = require('../routes/friendRoutes');
const SocialService = require('../services/socialService');
const InMemoryUserRepository = require('../repositories/InMemoryUserRepository');
const User = require('../domain/User');

describe('Friend Routes', () => {
    let app;
    let userRepo;
    let socialService;

    beforeEach(() => {
        app = express();
        app.use(express.json());

        userRepo = new InMemoryUserRepository();
        socialService = new SocialService({ userRepository: userRepo });

        registerFriendRoutes(app, { socialService });
    });

    test('POST /api/friends/request debe enviar una solicitud si el usuario existe', async () => {
        // Arrange
        const userMe = new User({ user: 'Me' });
        const userFriend = new User({ user: 'FriendUser' });
        await userRepo.save(userMe);
        await userRepo.save(userFriend);

        // Act
        const res = await request(app)
            .post('/api/friends/request')
            .send({ user: 'Me', friendName: 'FriendUser' });

        // Assert
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Solicitud enviada');
        
        const updatedFriend = await userRepo.findByUsername('FriendUser');
        expect(updatedFriend.friendRequests).toContain('Me');
    });

    test('POST /api/friends/accept debe añadir a ambos como amigos', async () => {
        // Arrange
        const userMe = new User({ user: 'Me', friendRequests: ['FriendUser'] });
        const userFriend = new User({ user: 'FriendUser' });
        await userRepo.save(userMe);
        await userRepo.save(userFriend);

        // Act
        const res = await request(app)
            .post('/api/friends/accept')
            .send({ user: 'Me', friendName: 'FriendUser' });

        // Assert
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        const updatedMe = await userRepo.findByUsername('Me');
        const updatedFriend = await userRepo.findByUsername('FriendUser');
        
        expect(updatedMe.friends).toContain('FriendUser');
        expect(updatedFriend.friends).toContain('Me');
        expect(updatedMe.friendRequests).not.toContain('FriendUser');
    });

    test('POST /api/friends/request debe fallar si el usuario no existe', async () => {
        // Arrange
        const userMe = new User({ user: 'Me' });
        await userRepo.save(userMe);

        // Act
        const res = await request(app)
            .post('/api/friends/request')
            .send({ user: 'Me', friendName: 'Unknown' });

        // Assert
        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Ese explorador no existe');
    });
});
