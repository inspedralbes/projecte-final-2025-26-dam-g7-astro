const { connectDB, getDB, closeDB } = require('./db');

async function seed() {
    try {
        await connectDB();
        const db = getDB();
        const users = db.collection('users');
        const supplies = db.collection('supplies');

        console.log('--- Netejant dades de prova anteriors ---');
        await users.deleteMany({ user: { $in: ['centro_demo', 'profe_demo', 'alumne_demo'] } });
        await supplies.deleteMany({ ownerId: 'profe_demo' });

        console.log('--- Creant comptes de prova ---');

        // 1. CENTRE
        await users.insertOne({
            user: 'centro_demo',
            pass: 'pass123',
            plan: 'GRUPAL',
            role: 'CENTER',
            rank: 'Centro de Mando',
            avatar: 'Astronauta_negre.jpg',
            level: 10,
            coins: 5000,
            createdAt: new Date()
        });

        // 2. PROFESSOR (Fill del centre)
        await users.insertOne({
            user: 'profe_demo',
            pass: 'pass123',
            plan: 'GRUPAL',
            role: 'TEACHER',
            parentId: 'centro_demo',
            rank: 'Instructor de Vuelo',
            avatar: 'Astronauta_taronja.jpg',
            level: 5,
            coins: 2000,
            createdAt: new Date()
        });

        // 3. ALUMNE (Fill del profe)
        await users.insertOne({
            user: 'alumne_demo',
            pass: 'pass123',
            plan: 'GRUPAL',
            role: 'STUDENT',
            parentId: 'profe_demo',
            rank: 'Recluta Espacial',
            avatar: 'Astronauta_blanc.jpg',
            level: 1,
            xp: 0,
            coins: 100,
            createdAt: new Date()
        });

        console.log('--- Creant subministraments de prova ---');
        await supplies.insertOne({
            ownerId: 'profe_demo',
            name: 'Missió: Vocabulari de Mart',
            type: 'words',
            active: true,
            content: [
                { word: 'MARCIÀ', hint: 'Habitant del planeta vermell' },
                { word: 'CRÀTER', hint: 'Forat a la superfície' },
                { word: 'ROBOT', hint: 'Explorador mecànic' },
                { word: 'OXIGEN', hint: 'El que necessitem per respirar' },
                { word: 'SORRA', hint: 'N\'hi ha molta al desert' }
            ],
            createdAt: new Date()
        });

        console.log('✅ Seeding completat amb èxit!');
        console.log('Comptes creats (tots amb pass: pass123):');
        console.log('- centro_demo (CENTER)');
        console.log('- profe_demo (TEACHER)');
        console.log('- alumne_demo (STUDENT)');

    } catch (error) {
        console.error('❌ Error durant el seeding:', error);
    } finally {
        await closeDB();
        process.exit();
    }
}

seed();
