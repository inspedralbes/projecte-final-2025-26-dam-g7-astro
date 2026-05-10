require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
console.log('🔌 Intentando conectar a:', uri);


const client = new MongoClient(uri);
let database = null;

/**
* Funció per connectar a MongoDB
* Aquesta funció s'ha de cridar abans de fer qualsevol operació amb la BD
* @returns {Promise<Db>}
*/

async function connectDB() {
    try {
        const isAtlas = uri.includes('mongodb.net');
        console.log(`🔌 Conectando a MongoDB (${isAtlas ? 'Atlas' : 'Local'})...`);
        
        await client.connect();
        console.log(`✅ Conectado con éxito a: ${isAtlas ? 'MongoDB Atlas' : 'Instancia Local'}`);
        
        database = client.db('Astro');
        return database;
    } catch (error) {
        console.error('❌ Error crítico al conectar a MongoDB:', error.message);
        console.error('   Asegúrate de que la URI es correcta y que tienes acceso de red.');
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