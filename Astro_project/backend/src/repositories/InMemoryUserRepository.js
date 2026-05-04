// Astro_project/backend/src/repositories/InMemoryUserRepository.js

const UserRepository = require('./UserRepository');
const User = require('../domain/User');

class InMemoryUserRepository extends UserRepository {
    constructor() {
        super();
        this.users = new Map();
    }

    async findByUsername(username) {
        const data = this.users.get(username.toString());
        return data ? new User(data) : null;
    }

    async findById(id) {
        const data = [...this.users.values()].find(u => (u._id || u.id) === id);
        return data ? new User(data) : null;
    }

    async save(user) {
        if (!user.id && !user._id) user.id = Math.random().toString(36).substr(2, 9);
        const data = user instanceof User ? { ...user, user: user.username } : user;
        this.users.set((data.user || data.username).toString(), data);
        return user instanceof User ? user : new User(data);
    }

    async update(user) {
        const data = user instanceof User ? { ...user, user: user.username } : user;
        this.users.set((data.user || data.username).toString(), data);
        return user;
    }
}

module.exports = InMemoryUserRepository;
