const MAX_INVENTORY_UNITS = 99;

const INVENTORY_ITEMS = Object.freeze([
    {
        id: 1,
        name: 'Pack de Vidas',
        desc: 'Recupera 5 vidas inmediatamente.',
        icon: 'mdi-heart-multiple',
        color: 'red-accent-2',
        cat: 'items',
        price: 200,
        stackable: true,
        maxQuantity: 99,
        dailyPurchaseLimit: 5
    },
    {
        id: 2,
        name: 'Congelar Racha',
        desc: 'Protege tu racha un día.',
        icon: 'mdi-snowflake',
        color: 'cyan-accent-2',
        cat: 'items',
        price: 500,
        stackable: true,
        maxQuantity: 99,
        dailyPurchaseLimit: 5
    },
    {
        id: 3,
        name: 'Doble de AstroCoins',
        desc: 'Multiplica x2 las AstroCoins ganadas.',
        icon: 'mdi-piggy-bank',
        color: 'yellow-accent-3',
        cat: 'items',
        price: 300,
        stackable: true,
        maxQuantity: 99,
        dailyPurchaseLimit: 5
    },
    {
        id: 4,
        name: 'Doble Puntuación',
        desc: 'Multiplica x2 los puntos obtenidos.',
        icon: 'mdi-star-shooting',
        color: 'orange-accent-3',
        cat: 'items',
        price: 300,
        stackable: true,
        maxQuantity: 99,
        dailyPurchaseLimit: 5
    },
    {
        id: 5,
        name: 'Rayo Saboteador',
        desc: 'En multijugador, tus aciertos restan el doble de tiempo al rival.',
        icon: 'mdi-lightning-bolt',
        color: 'deep-purple-accent-2',
        cat: 'items',
        price: 500,
        stackable: true,
        maxQuantity: 99,
        dailyPurchaseLimit: 5
    },
    {
        id: 6,
        name: 'Cambio de Nombre',
        desc: 'Cambia tu apodo mostrado en el perfil. ¡El primero es gratis desde tu perfil!',
        icon: 'mdi-account-edit',
        color: 'green-accent-2',
        cat: 'items',
        price: 10000,
        stackable: true,
        maxQuantity: 99,
        dailyPurchaseLimit: 5
    },
    {
        id: 101,
        name: 'Pin Comandante',
        desc: 'Insignia dorada.',
        icon: 'mdi-medal',
        color: 'amber-accent-3',
        cat: 'skin',
        price: 15000,
        stackable: false,
        maxQuantity: 1
    },
    {
        id: 102,
        name: 'Avatar Ciber Hacker',
        desc: 'Un hacker del futuro. Otorga +15% de puntuación en todas las misiones.',
        icon: 'mdi-robot',
        image: 'avatar_hacker.png',
        color: 'cyan-accent-3',
        cat: 'skin',
        price: 15000,
        stackable: false,
        maxQuantity: 1,
        boost: { type: 'score', multiplier: 1.15 }
    },
    {
        id: 104,
        name: 'Rastro de Neón',
        desc: 'Efectos visuales.',
        icon: 'mdi-creation',
        color: 'pink-accent-3',
        cat: 'trails',
        price: 1500,
        stackable: false,
        maxQuantity: 1
    },
    {
        id: 105,
        name: 'Título: El Imparable',
        desc: 'Etiqueta de texto permanente.',
        icon: 'mdi-format-title',
        color: 'red-accent-3',
        cat: 'title',
        price: 1000,
        stackable: false,
        maxQuantity: 1
    },
    {
        id: 106,
        name: 'Título: Leyenda Galáctica',
        desc: 'Etiqueta de texto permanente.',
        icon: 'mdi-format-title',
        color: 'cyan-accent-3',
        cat: 'title',
        price: 1000,
        stackable: false,
        maxQuantity: 1
    },
    {
        id: 107,
        name: 'Título: Destructor de Asteroides',
        desc: 'Etiqueta de texto permanente.',
        icon: 'mdi-format-title',
        color: 'amber-accent-3',
        cat: 'title',
        price: 1000,
        stackable: false,
        maxQuantity: 1
    },
    {
        id: 201,
        name: 'Pin Raro',
        desc: 'Insignia rara de edición limitada.',
        icon: 'mdi-decagram',
        color: 'purple-accent-2',
        cat: 'collectible',
        price: null,
        stackable: true
    },
    {
        id: 202,
        name: 'Avatar Viajero Nebulosa',
        desc: 'Explorador cósmico. Otorga +20% de tiempo en misiones contrarreloj.',
        icon: 'mdi-space-invaders',
        image: 'avatar_nebula.png',
        color: 'purple-accent-2',
        cat: 'skin',
        price: 15000,
        stackable: false,
        maxQuantity: 1,
        boost: { type: 'time', multiplier: 1.2 }
    },
    {
        id: 203,
        name: 'Avatar Caballero Estelar',
        desc: 'Guerrero solar. Otorga +10% de AstroCoins en todas las misiones.',
        icon: 'mdi-shield-sun',
        image: 'avatar_knight.png',
        color: 'amber-accent-4',
        cat: 'skin',
        price: 15000,
        stackable: false,
        maxQuantity: 1,
        boost: { type: 'coins', multiplier: 1.1 }
    }
]);

const LEGACY_ITEM_NAME_TO_ID = Object.freeze({
    'Vida Extra': 1,
    'Pack de Vidas': 1,
    'Congelar Racha': 2,
    'Doble de Monedas': 3,
    'Doble de AstroCoins': 3,
    'Doble Puntuación': 4,
    'Pin Comandante': 101,
    'Avatar Ciber Hacker': 102,
    'Rastro de Neón': 104,
    'Pin Raro': 201,
    'Avatar Viajero Nebulosa': 202,
    'Avatar Caballero Estelar': 203
});

const LEGACY_WHEEL_REWARD_ID_TO_ITEM_ID = Object.freeze({
    0: 1,
    1: 201,
    2: 202
});

module.exports = {
    MAX_INVENTORY_UNITS,
    INVENTORY_ITEMS,
    LEGACY_ITEM_NAME_TO_ID,
    LEGACY_WHEEL_REWARD_ID_TO_ITEM_ID
};
