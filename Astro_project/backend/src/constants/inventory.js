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
        desc: 'Insignia rara de edición limitada.',
        icon: 'mdi-decagram',
        color: 'purple-accent-2',
        cat: 'collectible',
        price: null,
        stackable: true
    },
    {
        id: 202,
        name: 'Avatar Ninja',
        desc: 'Aspecto ninja exclusivo.',
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

module.exports = {
    MAX_INVENTORY_UNITS,
    INVENTORY_ITEMS,
    LEGACY_ITEM_NAME_TO_ID,
    LEGACY_WHEEL_REWARD_ID_TO_ITEM_ID
};
