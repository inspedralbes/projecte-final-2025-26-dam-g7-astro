// Astro_project/backend/src/services/missionService.js

class MissionService {
    constructor({ userRepository }) {
        this.userRepo = userRepository;
    }

    async claimMission(username, missionId, type) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error("Usuario no encontrado");

        const missionKey = type === 'daily' ? 'dailyMissions' : 'weeklyMissions';
        const missions = user[missionKey] || [];
        
        const mission = missions.find(m => m.id === missionId);

        if (!mission) throw new Error("Misión no encontrada");
        if (!mission.completed) throw new Error("La misión aún no está completada");
        if (mission.claimed) throw new Error("Esta recompensa ya ha sido reclamada");

        // Marcar com a reclamada i sumar recompensa
        mission.claimed = true;
        user.coins = (user.coins || 0) + (mission.reward || 0);

        await this.userRepo.update(user);

        return {
            newBalance: user.coins,
            dailyMissions: user.dailyMissions,
            weeklyMissions: user.weeklyMissions
        };
    }
}

module.exports = MissionService;
