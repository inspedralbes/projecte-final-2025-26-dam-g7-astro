// Astro_project/backend/src/domain/User.js

class User {
    constructor(data = {}) {
        // Suport per a noms de camps tant de MongoDB ('user', '_id') com de l'entitat ('username', 'id')
        this.id = data._id || data.id;
        this.username = data.user || data.username;
        
        this.plan = data.plan || 'INDIVIDUAL_FREE';
        this.rank = data.rank || 'Cadete de Vuelo';
        this.level = data.level || 1;
        this.xp = data.xp || 0;
        this.coins = data.coins !== undefined ? data.coins : 1000;
        this.tickets = data.tickets !== undefined ? data.tickets : 0;
        this.streak = data.streak || 0;
        this.streakFreezes = data.streakFreezes || 0;
        this.inventory = data.inventory || [];
        this.activeBoosters = data.activeBoosters || {};
        this.dailyMissions = data.dailyMissions || [];
        this.weeklyMissions = data.weeklyMissions || [];
        this.friends = data.friends || [];
        this.friendRequests = data.friendRequests || [];
        this.maxScores = data.maxScores || {};
        this.lastActivity = data.lastActivity;
        this.lastGame = data.lastGame;
        this.lastDailyMissionDate = data.lastDailyMissionDate;
        this.lastWeeklyMissionKey = data.lastWeeklyMissionKey;
        this.mapLevel = data.mapLevel || 1;
        
        // Camps extres per compatibilitat amb el frontend
        this.gameHistory = data.gameHistory || [];
        this.totalGamesPlayed = data.totalGamesPlayed || 0;
        this.totalPoints = data.totalPoints || 0;
        this.selectedAchievements = data.selectedAchievements || [null, null, null];
        this.unlockedAchievements = data.unlockedAchievements || [];
        this.avatar = data.avatar || 'Astronauta_blanc.jpg';
        this.missionsCompleted = data.missionsCompleted || 0;
    }

    getXPNeeded() {
        return 100 + (this.level - 1) * 50;
    }

    addXP(amount) {
        this.xp += amount;
        let xpNeeded = this.getXPNeeded();
        let leveledUp = false;

        while (this.xp >= xpNeeded) {
            this.xp -= xpNeeded;
            this.level++;
            xpNeeded = this.getXPNeeded();
            leveledUp = true;
        }
        return leveledUp;
    }

    addCoins(amount) {
        this.coins = (this.coins || 0) + amount;
    }

    canAfford(amount) {
        return (this.coins || 0) >= amount;
    }

    subtractCoins(amount) {
        if (this.canAfford(amount)) {
            this.coins -= amount;
            return true;
        }
        return false;
    }

    updateLastActivity() {
        this.lastActivity = new Date().toISOString();
    }

    updateMissionProgress(type, amount) {
        const updateMissions = (missions) => {
            if (!missions || !Array.isArray(missions)) return [];
            return missions.map(mission => {
                if (mission.completed || mission.claimed) return mission;
                if (mission.type === type) {
                    let newProgress = (mission.progress || 0) + amount;
                    if (newProgress >= mission.goal) {
                        newProgress = mission.goal;
                        mission.completed = true;
                    }
                    mission.progress = newProgress;
                }
                return mission;
            });
        };

        this.dailyMissions = updateMissions(this.dailyMissions);
        this.weeklyMissions = updateMissions(this.weeklyMissions);
    }

    syncStreakMissions(streak) {
        this.streak = streak;
        this.updateMissionProgress('streak', 1);
        
        this.weeklyMissions = (this.weeklyMissions || []).map(m => {
            if (m.type === 'streak' && !m.completed && !m.claimed) {
                m.progress = Math.min(m.goal, streak);
                if (m.progress >= m.goal) m.completed = true;
            }
            return m;
        });
    }

    updateMaxScore(game, score) {
        if (!this.maxScores) this.maxScores = {};
        if (!this.maxScores[game] || score > this.maxScores[game]) {
            this.maxScores[game] = score;
            return true;
        }
        return false;
    }

    advanceMap(node) {
        if (node >= this.mapLevel) {
            this.mapLevel = node + 1;
            return true;
        }
        return false;
    }
}

module.exports = User;
