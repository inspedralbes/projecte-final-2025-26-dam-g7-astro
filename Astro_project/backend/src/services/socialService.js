// Astro_project/backend/src/services/socialService.js

class SocialService {
    constructor({ userRepository }) {
        this.userRepo = userRepository;
    }

    async addFriend(username, friendName) {
        if (username === friendName) {
            throw new Error("No puedes ser amigo de ti mismo");
        }

        const user = await this.userRepo.findByUsername(username);
        const friend = await this.userRepo.findByUsername(friendName);

        if (!user || !friend) {
            throw new Error("Ese explorador no existe");
        }

        // Afegir amic bidireccionalment
        if (!user.friends) user.friends = [];
        if (!user.friends.includes(friendName)) user.friends.push(friendName);

        if (!friend.friends) friend.friends = [];
        if (!friend.friends.includes(username)) friend.friends.push(username);

        await Promise.all([
            this.userRepo.update(user),
            this.userRepo.update(friend)
        ]);

        return user.friends;
    }

    async removeFriend(username, friendName) {
        const user = await this.userRepo.findByUsername(username);
        const friend = await this.userRepo.findByUsername(friendName);

        if (!user || !friend) {
            throw new Error("Usuario o amigo no encontrado");
        }

        user.friends = (user.friends || []).filter(f => f !== friendName);
        friend.friends = (friend.friends || []).filter(f => f !== username);

        await Promise.all([
            this.userRepo.update(user),
            this.userRepo.update(friend)
        ]);

        return user.friends;
    }

    async sendFriendRequest(username, friendName) {
        if (username === friendName) {
            throw new Error("No te puedes enviar solicitud a ti mismo");
        }

        const friend = await this.userRepo.findByUsername(friendName);
        if (!friend) {
            throw new Error("Ese explorador no existe");
        }

        if (friend.friends && friend.friends.includes(username)) {
            throw new Error("Ya sois amigos");
        }

        if (!friend.friendRequests) friend.friendRequests = [];
        if (!friend.friendRequests.includes(username)) {
            friend.friendRequests.push(username);
        }

        await this.userRepo.update(friend);
        return true;
    }

    async acceptFriendRequest(username, friendName) {
        const user = await this.userRepo.findByUsername(username);
        const friend = await this.userRepo.findByUsername(friendName);

        if (!user || !friend) {
            throw new Error("Usuario o amigo no encontrado");
        }

        // Afegir a amics i treure de peticions
        if (!user.friends) user.friends = [];
        if (!user.friends.includes(friendName)) user.friends.push(friendName);
        user.friendRequests = (user.friendRequests || []).filter(f => f !== friendName);

        if (!friend.friends) friend.friends = [];
        if (!friend.friends.includes(username)) friend.friends.push(username);

        await Promise.all([
            this.userRepo.update(user),
            this.userRepo.update(friend)
        ]);

        return {
            friends: user.friends,
            friendRequests: user.friendRequests
        };
    }

    async rejectFriendRequest(username, friendName) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error("Usuario no encontrado");

        user.friendRequests = (user.friendRequests || []).filter(f => f !== friendName);
        await this.userRepo.update(user);

        return user.friendRequests;
    }
}

module.exports = SocialService;
