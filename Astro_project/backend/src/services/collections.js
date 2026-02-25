function createGetCollections(getDB) {
    return function getCollections() {
        const db = getDB();
        return {
            users: db.collection('users'),
            partides: db.collection('partides'),
            rooms: db.collection('rooms')
        };
    };
}

module.exports = {
    createGetCollections
};
