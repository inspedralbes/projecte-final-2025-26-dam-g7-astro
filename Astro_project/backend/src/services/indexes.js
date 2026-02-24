function createEnsureIndexes(getDB) {
    let indexesReady = false;

    return async function ensureIndexes() {
        if (indexesReady) return;

        const db = getDB();
        await Promise.all([
            db.collection('users').createIndex({ user: 1 }),
            db.collection('partides').createIndex({ user: 1, createdAt: -1 }),
            db.collection('partides').createIndex({ user: 1, game: 1, createdAt: -1 })
        ]);

        indexesReady = true;
    };
}

module.exports = {
    createEnsureIndexes
};
