// Astro_project/backend/src/repositories/UserRepository.js

/**
 * Interfície (contracte) per al repositori d'usuaris.
 * Seguint l'estàndard professional, definim què es pot fer sense dir com.
 */
class UserRepository {
    async findByUsername(username) {
        throw new Error('Not implemented: findByUsername');
    }

    async findById(id) {
        throw new Error('Not implemented: findById');
    }

    async save(user) {
        throw new Error('Not implemented: save');
    }

    async update(user) {
        throw new Error('Not implemented: update');
    }

    async findByCredentials(username, password) {
        throw new Error('Not implemented: findByCredentials');
    }

    async saveDoc(doc) {
        throw new Error('Not implemented: saveDoc');
    }

    async findAllExplorers() {
        throw new Error('Not implemented: findAllExplorers');
    }
}

module.exports = UserRepository;
