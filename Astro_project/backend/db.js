require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

const client = new MongoClient(uri);
let database = null;

/**
* Funció per connectar a MongoDB
* Aquesta funció s'ha de cridar abans de fer qualsevol operació amb la BD
* @returns {Promise<Db>}
*/

async function connectDB() {
    try {
        await client.connect();
        database = client.db('Astro');

        // LOG DE DIAGNÓSTICO: Verificamos la conexión real
        const dbName = database.databaseName;
        const host = client.options.srvHost || 'localhost';
        console.log(`📡 Conectado a MongoDB: ${dbName} en ${host}`);

        return database;
    } catch (error) {
        console.error(' Error connectant a MongoDB:', error);
        throw error;
    }
}

/**
* Funció per obtenir la base de dades
* Retorna la referència a la BD si ja està connectada
* @returns {Db}
*/
function getDB() {
    if (!database) {
        throw new Error(' Base de dades no connectada! Crida connectDB() primer.');
    }
    return database;
}

async function closeDB() {
    try {
        await client.close();
        console.log(' Connexió tancada');
    } catch (error) {
        console.error(' Error tancant la connexió:', error);
        throw error;
    }
}

module.exports = {
    connectDB,
    getDB,
    closeDB
};