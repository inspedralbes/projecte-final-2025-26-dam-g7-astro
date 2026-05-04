// Astro_project/backend/src/services/multiplayerService.js

class MultiplayerService {
    constructor({ roomRepository }) {
        this.roomRepo = roomRepository;
    }

    async getPublicLobbies() {
        return await this.roomRepo.findPublicLobbies();
    }
}

module.exports = MultiplayerService;
