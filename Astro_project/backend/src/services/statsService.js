function createGetUserStats({
    getCollections,
    normalizeInventoryEntries,
    getInventoryQuantity,
    normalizeActiveBoosters
}) {
    return async function getUserStats(username) {
        const { users, partides } = getCollections();

        const userDoc = await users.findOne(
            { user: username },
            {
                projection: {
                    user: 1,
                    coins: 1,
                    inventory: 1,
                    rank: 1,
                    plan: 1,
                    level: 1,
                    xp: 1,
                    streak: 1,
                    lastActivity: 1,
                    streakFreezes: 1,
                    lastGame: 1,
                    activeBoosters: 1
                }
            }
        );

        if (!userDoc) return null;

        const normalizedInventory = normalizeInventoryEntries(userDoc.inventory || []);
        const inventoryUnits = normalizedInventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const freezeUnits = getInventoryQuantity(normalizedInventory, 2);
        const activeBoosters = normalizeActiveBoosters(userDoc.activeBoosters);

        const [gamesPlayed, gamesByTypeRaw] = await Promise.all([
            partides.countDocuments({ user: username }),
            partides
                .aggregate([
                    { $match: { user: username } },
                    { $group: { _id: '$game', total: { $sum: 1 } } }
                ])
                .toArray()
        ]);

        const gamesByType = {};
        for (const item of gamesByTypeRaw) {
            gamesByType[item._id || 'UNKNOWN'] = item.total;
        }

        return {
            user: userDoc.user,
            plan: userDoc.plan || 'INDIVIDUAL_FREE',
            rank: userDoc.rank || 'Cadete de Vuelo',
            level: userDoc.level || 1,
            xp: userDoc.xp || 0,
            coins: userDoc.coins !== undefined ? userDoc.coins : 1000,
            inventoryCount: normalizedInventory.length,
            inventoryUnits,
            gamesPlayed,
            gamesByType,
            streak: userDoc.streak || 0,
            streakFreezes: Math.max(userDoc.streakFreezes || 0, freezeUnits),
            activeBoosters,
            lastActivity: userDoc.lastActivity,
            lastGame: userDoc.lastGame
        };
    };
}

module.exports = {
    createGetUserStats
};
