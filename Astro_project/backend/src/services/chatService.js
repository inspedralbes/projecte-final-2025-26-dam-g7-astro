/**
 * chatService.js
 * Lógica de persistencia de mensajes privados entre amigos.
 */

/**
 * Guarda un mensaje en la colección 'messages'.
 * @param {import('mongodb').Db} db
 * @param {{ from: string, to: string, content: string }} param
 * @returns {Promise<object>} El documento insertado
 */
async function saveMessage(db, { from, to, content, type = 'text' }) {
    const messages = db.collection('messages');
    const doc = {
        from,
        to,
        content,
        type,
        at: new Date(),
        read: false
    };
    await messages.insertOne(doc);
    return doc;
}

/**
 * Recupera el historial de mensajes entre dos usuarios (últimos 50, orden cronológico).
 * @param {import('mongodb').Db} db
 * @param {string} userA
 * @param {string} userB
 * @returns {Promise<object[]>}
 */
async function getHistory(db, userA, userB) {
    const messages = db.collection('messages');
    return messages
        .find({
            $or: [
                { from: userA, to: userB },
                { from: userB, to: userA }
            ]
        })
        .sort({ at: 1 })
        .limit(50)
        .toArray();
}

/**
 * Marca como leídos todos los mensajes enviados por `from` a `to`.
 * @param {import('mongodb').Db} db
 * @param {string} from  Quien envió
 * @param {string} to    Quien recibe (el usuario actual)
 */
async function markAsRead(db, from, to) {
    const messages = db.collection('messages');
    await messages.updateMany(
        { from, to, read: false },
        { $set: { read: true } }
    );
}

/**
 * Devuelve el número de mensajes no leídos por conversación para un usuario.
 * @param {import('mongodb').Db} db
 * @param {string} user
 * @returns {Promise<Record<string, number>>} { [senderUsername]: count }
 */
async function getUnreadByConversation(db, user) {
    const messages = db.collection('messages');
    const pipeline = [
        { $match: { to: user, read: false } },
        { $group: { _id: '$from', count: { $sum: 1 } } }
    ];
    const results = await messages.aggregate(pipeline).toArray();
    return results.reduce((acc, { _id, count }) => {
        acc[_id] = count;
        return acc;
    }, {});
}

module.exports = {
    saveMessage,
    getHistory,
    markAsRead,
    getUnreadByConversation
};
