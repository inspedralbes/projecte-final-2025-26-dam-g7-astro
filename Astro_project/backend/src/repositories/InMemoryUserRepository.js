// Astro_project/backend/src/repositories/InMemoryUserRepository.js

const UserRepository = require('./UserRepository');
const User = require('../domain/User');

class InMemoryUserRepository extends UserRepository {
    constructor() {
        super();
        this.users = new Map();
    }

    async findByUsername(username) {
        return this.users.get(username.toString()) || null;
    }

    async findById(id) {
        return [...this.users.values()].find(u => u.id === id) || null;
    }

    async save(user) {
        if (!user.id) user.id = Math.random().toString(36).substr(2, 9);
        this.users.set(user.username.toString(), user);
        return user;
    }

    async update(user) {
        this.users.set(user.username.toString(), user);
        return user;
    }
}

module.exports = InMemoryUserRepository;
