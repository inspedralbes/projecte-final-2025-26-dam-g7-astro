// Astro_project/backend/src/repositories/InMemoryUserRepository.js

const UserRepository = require('./UserRepository');
const User = require('../domain/User');

class InMemoryUserRepository extends UserRepository {
    constructor() {
        super();
        this.users = new Map();
    }

    get collection() {
        return {
            find: (query) => ({
                toArray: async () => {
                    let results = [...this.users.values()];
                    if (query.parentId) {
                        results = results.filter(u => u.parentId === query.parentId);
                    }
                    if (query.role) {
                        results = results.filter(u => u.role === query.role);
                    }
                    return results;
                }
            })
        };
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

    async saveDoc(doc) {
        const data = doc;
        if (!data.id && !data._id) data.id = Math.random().toString(36).substr(2, 9);
        this.users.set((data.user || data.username).toString(), data);
        return { insertedId: data.id || data._id };
    }

    async findByCredentials(username, password) {
        const key = username?.toString();
        if (!key || !password) return null;
        const user = this.users.get(key);
        if (!user) return null;

        const storedPass = user.pass;
        if (!storedPass) return null;

        const bcrypt = require('bcryptjs');
        let isValid = false;

        if (typeof storedPass === 'string' && (storedPass.startsWith('$2a$') || storedPass.startsWith('$2b$') || storedPass.startsWith('$2y$'))) {
            isValid = await bcrypt.compare(password, storedPass);
        } else {
            isValid = (password === storedPass);
        }

        return isValid ? user : null;
    }

    async updatePassword(username, newPassword) {
        const key = username?.toString();
        if (!key || !newPassword) return false;

        const existing = this.users.get(key);
        if (!existing) return false;

        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        this.users.set(key, { ...existing, pass: hashedPassword });
        return true;
    }
}

module.exports = InMemoryUserRepository;
