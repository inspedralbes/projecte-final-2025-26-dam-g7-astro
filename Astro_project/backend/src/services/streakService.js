function createUpdateStreak({
    getCollections,
    normalizeInventoryEntries,
    getInventoryQuantity
}) {
    return async function updateStreak(username, isGame = false) {
        const { users } = getCollections();
        const userDoc = await users.findOne({ user: username });
        if (!userDoc) return null;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const lastActivity = userDoc.lastActivity ? new Date(userDoc.lastActivity) : null;
        const lastGame = userDoc.lastGame ? new Date(userDoc.lastGame) : null;
        const normalizedInventory = normalizeInventoryEntries(userDoc.inventory || []);
        const availableFreezes = Math.max(userDoc.streakFreezes || 0, getInventoryQuantity(normalizedInventory, 2));

        let newStreak = userDoc.streak || 0;
        let needsFreeze = false;

        if (lastActivity) {
            const lastActivityDay = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());
            const diffDays = Math.floor((today - lastActivityDay) / (1000 * 60 * 60 * 24));

            if (diffDays > 1) {
                if (availableFreezes > 0) {
                    needsFreeze = true;
                } else {
                    newStreak = 0;
                }
            }
        }

        if (isGame) {
            if (needsFreeze) {
                newStreak = 1;
                needsFreeze = false;
            } else if (newStreak === 0) {
                newStreak = 1;
            } else if (lastGame) {
                const lastGameDay = new Date(lastGame.getFullYear(), lastGame.getMonth(), lastGame.getDate());
                const diffGameDays = Math.floor((today - lastGameDay) / (1000 * 60 * 60 * 24));

                if (diffGameDays >= 1) {
                    newStreak++;
                }
            } else {
                newStreak = 1;
            }
        }

        const updateData = { $set: { streak: newStreak } };
        if ((userDoc.streakFreezes || 0) !== availableFreezes) {
            updateData.$set.streakFreezes = availableFreezes;
        }

        if (!isGame) {
            updateData.$set.lastActivity = now;
        } else {
            updateData.$set.lastActivity = now;
            updateData.$set.lastGame = now;
        }

        await users.updateOne({ user: username }, updateData);
        return { streak: newStreak, needsFreeze, lastGame: isGame ? now : userDoc.lastGame };
    };
}

module.exports = {
    createUpdateStreak
};
