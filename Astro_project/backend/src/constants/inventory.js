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
        stackable: true
    },
    {
        id: 2,
        name: 'Congelar Racha',
        desc: 'Protege tu racha un día.',
        icon: 'mdi-snowflake',
        color: 'cyan-accent-2',
        cat: 'items',
        price: 500,
        stackable: true
    },
    {
        id: 3,
        name: 'Doble de Monedas',
        desc: 'Multiplica x2 las monedas ganadas.',
        icon: 'mdi-piggy-bank',
        color: 'yellow-accent-3',
        cat: 'items',
        price: 300,
        stackable: true
    },
    {
        id: 4,
        name: 'Doble Puntuación',
        desc: 'Multiplica x2 los puntos obtenidos.',
        icon: 'mdi-star-shooting',
        color: 'orange-accent-3',
        cat: 'items',
        price: 300,
        stackable: true
    },
    // --- NUEVOS SUMINISTROS BÁSICOS ---
    {
        id: 5,
        name: 'Cronómetro Lento',
        desc: 'El tiempo pasa un 20% más lento.',
        icon: 'mdi-timer-sand-empty',
        color: 'blue-accent-2',
        cat: 'items',
        price: 400,
        stackable: true
    },
    {
        id: 6,
        name: 'Escudo Protector',
        desc: 'Evita perder vida/racha al fallar.',
        icon: 'mdi-shield-check',
        color: 'teal-accent-4',
        cat: 'items',
        price: 600,
        stackable: true
    },
    // -----------------------------------
    {
        id: 101,
        name: 'Pin Comandante',
        desc: 'Insignia dorada.',
        icon: 'mdi-medal',
        color: 'amber-accent-3',
        cat: 'skin',
        price: 2500,
        stackable: false,
        maxQuantity: 1
    },
    {
        id: 102,
        name: 'Skin Cyberpunk',
        desc: 'Aspecto robótico.',
        icon: 'mdi-robot',
        color: 'purple-accent-3',
        cat: 'skin',
        price: 5000,
        stackable: false,
        maxQuantity: 1
    },
    {
        id: 103,
        name: 'Mascota Dron',
        desc: 'Un compañero fiel.',
        icon: 'mdi-quadcopter',
        color: 'green-accent-3',
        cat: 'pets',
        price: 3500,
        stackable: false,
        maxQuantity: 1
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
        id: 201,
        name: 'Pin Raro',
        desc: 'Insignia rara obtenida en la ruleta.',
        icon: 'mdi-decagram',
        color: 'purple-accent-2',
        cat: 'collectible',
        price: null,
        stackable: true
    },
    {
        id: 202,
        name: 'Avatar Ninja',
        desc: 'Aspecto ninja obtenido en la ruleta.',
        icon: 'mdi-ninja',
        color: 'blue-accent-2',
        cat: 'skin',
        price: null,
        stackable: false,
        maxQuantity: 1
    }
]);

const LEGACY_ITEM_NAME_TO_ID = Object.freeze({
    'Vida Extra': 1,
    'Pack de Vidas': 1,
    'Congelar Racha': 2,
    'Doble de Monedas': 3,
    'Doble Puntuación': 4,
    'Cronómetro Lento': 5, // AÑADIDO
    'Escudo Protector': 6, // AÑADIDO
    'Pin Comandante': 101,
    'Skin Cyberpunk': 102,
    'Mascota Dron': 103,
    'Rastro de Neón': 104,
    'Pin Raro': 201,
    'Avatar Ninja': 202
});

const LEGACY_WHEEL_REWARD_ID_TO_ITEM_ID = Object.freeze({
    0: 1,
    1: 201,
    2: 202
});

const WHEEL_ITEMS = [
    { id: 0, label: 'Vida Extra', icon: 'mdi-heart', color: '#FF5252', weight: 20, inventoryItemId: 1 },
    { id: 1, label: 'Pin Raro', icon: 'mdi-decagram', color: '#9C27B0', weight: 5, inventoryItemId: 201 },
    { id: 2, label: 'Avatar Ninja', icon: 'mdi-ninja', color: '#2196F3', weight: 5, inventoryItemId: 202 },
    { id: 3, label: 'Monedas', icon: 'mdi-currency-usd', color: '#FFC107', weight: 30, coinsReward: 100 },
    { id: 4, label: 'Nada', icon: 'mdi-emoticon-sad', color: '#795548', weight: 40 }
];

module.exports = {
    MAX_INVENTORY_UNITS,
    INVENTORY_ITEMS,
    LEGACY_ITEM_NAME_TO_ID,
    LEGACY_WHEEL_REWARD_ID_TO_ITEM_ID,
    WHEEL_ITEMS
};