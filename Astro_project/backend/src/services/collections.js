function createGetCollections(getDB) {
    return function getCollections() {
        const db = getDB();
        return {
            users: db.collection('users'),
            partides: db.collection('partides')
        };
    };
}

module.exports = {
    createGetCollections
};
