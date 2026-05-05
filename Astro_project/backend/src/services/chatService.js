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
        read: false,
        status: type === 'challenge' ? 'pending' : undefined
    };
    await messages.insertOne(doc);
    return doc;
}

/**
 * Actualiza el estado de un mensaje (ej: para desafíos).
 * @param {import('mongodb').Db} db
 * @param {string} from Quien envió el desafío
 * @param {string} to Quien recibió el desafío
 * @param {'accepted'|'rejected'|'expired'} status Nuevo estado
 */
async function updateLatestChallengeStatus(db, from, to, status) {
    const messages = db.collection('messages');
    // Buscamos el último mensaje de tipo 'challenge' entre estos dos usuarios
    // que sea de 'from' para 'to' y esté 'pending'.
    const lastChallenge = await messages.findOne(
        { from, to, type: 'challenge', status: 'pending' },
        { sort: { at: -1 } }
    );

    if (lastChallenge) {
        await messages.updateOne(
            { _id: lastChallenge._id },
            { $set: { status } }
        );
        return true;
    }
    return false;
}

/**
 * Marca como expirados los desafíos que llevan más de N minutos pendientes.
 * @param {import('mongodb').Db} db
 * @param {number} minutes Umbral de expiración
 */
async function markExpiredChallenges(db, minutes = 5) {
    const messages = db.collection('messages');
    const threshold = new Date(Date.now() - minutes * 60 * 1000);
    
    await messages.updateMany(
        { 
            type: 'challenge', 
            status: 'pending', 
            at: { $lt: threshold } 
        },
        { $set: { status: 'expired' } }
    );
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
    getUnreadByConversation,
    updateLatestChallengeStatus,
    markExpiredChallenges
};
