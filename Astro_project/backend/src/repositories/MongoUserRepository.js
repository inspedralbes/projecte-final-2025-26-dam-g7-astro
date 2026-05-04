// Astro_project/backend/src/repositories/MongoUserRepository.js

const UserRepository = require('./UserRepository');
const User = require('../domain/User');

class MongoUserRepository extends UserRepository {
    constructor(getCollection) {
        super();
        this._getCollection = getCollection;
    }

    get collection() {
        return this._getCollection();
    }

    async findByUsername(username) {
        if (username === undefined || username === null) return null;

        const query = { 
            $or: [
                { user: username }
            ]
        };

        const numUser = Number(username);
        if (!isNaN(numUser) && username !== '') {
            query.$or.push({ user: numUser });
        }

        const doc = await this.collection.findOne(query);
        return doc ? new User(doc) : null;
    }

    async findById(id) {
        if (!id) return null;
        const doc = await this.collection.findOne({ _id: id });
        return doc ? new User(doc) : null;
    }

    async findByCredentials(username, password) {
        if (!username || !password) return null;

        const query = { 
            $or: [
                { user: username, pass: password }
            ]
        };
        
        const numUser = Number(username);
        if (!isNaN(numUser) && username !== '') {
            query.$or.push({ user: numUser, pass: password });
        }

        return await this.collection.findOne(query);
    }

    async save(user) {
        const doc = this._toMongoDoc(user);
        const result = await this.collection.insertOne(doc);
        user.id = result.insertedId;
        return user;
    }

    async saveDoc(doc) {
        const result = await this.collection.insertOne(doc);
        return result;
    }

    async update(user) {
        const doc = this._toMongoDoc(user);
        const { _id, user: usernameField, ...updateData } = doc;
        
        // Preferim actualitzar per _id si el tenim (és l'objecte de domini)
        // Si no, busquem per l'usuari original
        const filter = user.id ? { _id: user.id } : { user: user.username };
        
        // Si no tenim ID i l'usuari podria ser numèric, fem servir la mateixa lògica de cerca
        if (!user.id && user.username !== undefined && user.username !== null) {
            const numUser = Number(user.username);
            if (!isNaN(numUser) && user.username !== '') {
                filter.user = { $in: [user.username, numUser] };
            }
        }

        await this.collection.updateOne(
            filter, 
            { $set: updateData }
        );
        return user;
    }

    async findAllExplorers() {
        const allUsers = await this.collection.find({}, {
            projection: {
                user: 1,
                level: 1,
                rank: 1,
                mascot: 1,
                avatar: 1,
                streak: 1,
                selectedAchievements: 1,
                friendRequests: 1
            }
        }).toArray();

        return allUsers.map(u => ({
            ...u,
            avatar: u.avatar || 'Astronauta_blanc.jpg'
        }));
    }

    _toMongoDoc(user) {
        return {
            user: user.username,
            plan: user.plan,
            rank: user.rank,
            level: user.level,
            xp: user.xp,
            coins: user.coins,
            tickets: user.tickets,
            streak: user.streak,
            streakFreezes: user.streakFreezes,
            inventory: user.inventory,
            activeBoosters: user.activeBoosters,
            dailyMissions: user.dailyMissions,
            weeklyMissions: user.weeklyMissions,
            friends: user.friends,
            friendRequests: user.friendRequests,
            maxScores: user.maxScores,
            lastActivity: user.lastActivity,
            lastGame: user.lastGame,
            lastDailyMissionDate: user.lastDailyMissionDate,
            lastWeeklyMissionKey: user.lastWeeklyMissionKey,
            mapLevel: user.mapLevel,
            selectedAchievements: user.selectedAchievements,
            unlockedAchievements: user.unlockedAchievements,
            avatar: user.avatar,
            missionsCompleted: user.missionsCompleted,
            gameHistory: user.gameHistory,
            totalGamesPlayed: user.totalGamesPlayed,
            totalPoints: user.totalPoints
        };
    }
}

module.exports = MongoUserRepository;
