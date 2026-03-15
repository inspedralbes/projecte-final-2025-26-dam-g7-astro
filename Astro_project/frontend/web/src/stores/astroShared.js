const hasWindow = typeof window !== 'undefined';

function getStorage() {
    if (!hasWindow) return null;
    return window.localStorage;
}

export const STORAGE_KEYS = Object.freeze({
    user: 'astro_user',
    plan: 'astro_plan',
    rank: 'astro_rank',
    level: 'astro_level',
    xp: 'astro_xp',
    streak: 'astro_streak',
    streakFreezes: 'astro_streak_freezes',
    activeBoosters: 'astro_active_boosters',
    selectedAchievements: 'astro_selected_achievements',
    unlockedAchievements: 'astro_unlocked_achievements',
    avatar: 'astro_avatar',
    mascot: 'astro_mascot',
    token: 'astro_token',
    lastActivity: 'astro_last_activity',
    lastGame: 'astro_last_game'
});

// --- PERSISTENCIA ---
export function storageGetItem(key) {
    const storage = getStorage();
    return storage ? storage.getItem(key) : null;
}

export function storageSetItem(key, value) {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(key, String(value));
}

export function storageRemoveItem(key) {
    const storage = getStorage();
    if (!storage) return;
    storage.removeItem(key);
}

export function readStoredArray(key, fallback = []) {
    const rawValue = storageGetItem(key);
    if (!rawValue) return fallback;
    try {
        const parsedValue = JSON.parse(rawValue);
        return Array.isArray(parsedValue) ? parsedValue : fallback;
    } catch (error) {
        return fallback;
    }
}

export function readStoredObject(key, fallback = {}) {
    const rawValue = storageGetItem(key);
    if (!rawValue) return fallback;
    try {
        const parsedValue = JSON.parse(rawValue);
        return parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue) ? parsedValue : fallback;
    } catch (error) {
        return fallback;
    }
}

export function writeStoredJson(key, value) {
    storageSetItem(key, JSON.stringify(value));
}

// --- LÓGICA DE URL Y RED ---

function resolveDefaultApiBaseUrl() {
    if (!hasWindow) return 'http://localhost:3000';
    const { hostname } = window.location;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

    // En producción, usamos la ruta relativa para que Nginx haga el proxy correctamente
    return isLocalHost ? 'http://localhost:3000' : '/api';
}

// Mantenemos VITE_API_URL como solicitaste
const rawApiBaseUrl = import.meta.env.VITE_API_URL || resolveDefaultApiBaseUrl();

// Limpiamos la URL base para que no termine en barra
export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '');

export function buildApiUrl(path) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    // Si el path que viene del store ya trae '/api' y la base también es '/api',
    // evitamos que se genere '/api/api/...'
    if (cleanPath.startsWith('/api') && API_BASE_URL === '/api') {
        return cleanPath;
    }

    return `${API_BASE_URL}${cleanPath}`;
}

export async function requestJson(path, options = {}) {
    const url = buildApiUrl(path);
    const response = await fetch(url, options);
    const text = await response.text();

    if (!text) return { response, data: {} };

    try {
        return { response, data: JSON.parse(text) };
    } catch (error) {
        return { response, data: { message: text } };
    }
}

export function buildWebSocketBaseUrl() {
    const explicitWsBaseUrl = String(import.meta.env.VITE_WS_BASE_URL || '').trim();

    if (explicitWsBaseUrl) return explicitWsBaseUrl.replace(/\/$/, '');

    if (hasWindow) {
        const { hostname, protocol, host } = window.location;
        const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

        // En local, forzamos conectar al puerto 3000 del backend ya que Vite (3001) no hace proxy de WS
        if (isLocalHost) {
            return `ws://${hostname}:3000/ws`;
        }

        // En producción, usamos el host actual (que Nginx gestionará)
        const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
        return `${wsProtocol}//${host}/ws`;
    }

    return 'ws://localhost:3000/ws';
}

// --- NORMALIZADORES ---

export function normalizeSelectedAchievements(values = []) {
    return [values[0] ?? null, values[1] ?? null, values[2] ?? null];
}

export function normalizeUnlockedAchievements(values = []) {
    return [...new Set(
        values.map((v) => Number(v)).filter((v) => Number.isInteger(v) && v > 0)
    )].sort((a, b) => a - b);
}

function toNonNegativeInteger(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function normalizeActiveBoosters(values = {}) {
    const source = values && typeof values === 'object' && !Array.isArray(values) ? values : {};
    return {
        doubleCoinsGamesLeft: toNonNegativeInteger(source.doubleCoinsGamesLeft),
        doubleScoreGamesLeft: toNonNegativeInteger(source.doubleScoreGamesLeft),
        slowTimeGamesLeft: toNonNegativeInteger(source.slowTimeGamesLeft),
        shieldGamesLeft: toNonNegativeInteger(source.shieldGamesLeft)
    };
}

// --- CATÁLOGO E INVENTARIO ---

export const INVENTORY_CATALOG = Object.freeze({
    1: { id: 1, name: 'Pack de Vidas', desc: 'Recupera 5 vidas inmediatamente.', icon: 'mdi-heart-multiple', color: 'red-accent-2', cat: 'items', maxQuantity: 99 },
    2: { id: 2, name: 'Congelar Racha', desc: 'Protege tu racha un día.', icon: 'mdi-snowflake', color: 'cyan-accent-2', cat: 'items', maxQuantity: 99 },
    3: { id: 3, name: 'Doble de Monedas', desc: 'Multiplica x2 las monedas ganadas.', icon: 'mdi-piggy-bank', color: 'yellow-accent-3', cat: 'items', maxQuantity: 99 },
    4: { id: 4, name: 'Doble Puntuación', desc: 'Multiplica x2 los puntos obtenidos.', icon: 'mdi-star-shooting', color: 'orange-accent-3', cat: 'items', maxQuantity: 99 },
    5: { id: 5, name: 'Cronómetro Lento', desc: 'El tiempo pasa un 20% más lento.', icon: 'mdi-timer-sand-empty', color: 'blue-accent-2', cat: 'items', maxQuantity: 99 },
    6: { id: 6, name: 'Escudo Protector', desc: 'Evita perder vida/racha al fallar.', icon: 'mdi-shield-check', color: 'teal-accent-4', cat: 'items', maxQuantity: 99 },
    101: { id: 101, name: 'Pin Comandante', desc: 'Insignia dorada.', icon: 'mdi-medal', color: 'amber-accent-3', cat: 'skin', maxQuantity: 1 },
    102: { id: 102, name: 'Skin Cyberpunk', desc: 'Aspecto robótico.', icon: 'mdi-robot', color: 'purple-accent-3', cat: 'skin', maxQuantity: 1 },
    103: { id: 103, name: 'Mascota Dron', desc: 'Un compañero fiel.', icon: 'mdi-quadcopter', color: 'green-accent-3', cat: 'pets', maxQuantity: 1 },
    104: { id: 104, name: 'Rastro de Neón', desc: 'Efectos visuales.', icon: 'mdi-creation', color: 'pink-accent-3', cat: 'trails', maxQuantity: 1 },
    201: { id: 201, name: 'Pin Raro', desc: 'Insignia rara obtenida en la ruleta.', icon: 'mdi-decagram', color: 'purple-accent-2', cat: 'collectible', maxQuantity: 99 },
    202: { id: 202, name: 'Avatar Ninja', desc: 'Aspecto ninja obtenido en la ruleta.', icon: 'mdi-ninja', color: 'blue-accent-2', cat: 'skin', maxQuantity: 1 }
});

const LEGACY_ITEM_NAME_TO_ID = Object.freeze({
    'Vida Extra': 1, 'Pack de Vidas': 1, 'Congelar Racha': 2, 'Doble de Monedas': 3,
    'Doble Puntuación': 4, 'Cronómetro Lento': 5, 'Escudo Protector': 6,
    'Pin Comandante': 101, 'Skin Cyberpunk': 102, 'Mascota Dron': 103,
    'Rastro de Neón': 104, 'Pin Raro': 201, 'Avatar Ninja': 202
});

const LEGACY_WHEEL_REWARD_TO_ITEM = Object.freeze({ 0: 1, 1: 201, 2: 202 });

function toInteger(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) ? parsed : null;
}

export function toPositiveInteger(value) {
    const parsed = toInteger(value);
    return parsed !== null && parsed > 0 ? parsed : null;
}

function resolveInventoryItemId(rawItem) {
    const candidate = rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
        ? rawItem.itemId ?? rawItem.id ?? rawItem.name ?? rawItem.label : rawItem;

    if (typeof candidate === 'number' && Number.isInteger(candidate)) return candidate;
    if (typeof candidate !== 'string') return null;

    const trimmed = candidate.trim();
    if (Object.prototype.hasOwnProperty.call(LEGACY_ITEM_NAME_TO_ID, trimmed)) return LEGACY_ITEM_NAME_TO_ID[trimmed];

    const legacyPrizeMatch = trimmed.match(/^prize_\d+_(\d+)$/);
    if (legacyPrizeMatch) {
        const legacyWheelId = toInteger(legacyPrizeMatch[1]);
        if (legacyWheelId !== null && Object.prototype.hasOwnProperty.call(LEGACY_WHEEL_REWARD_TO_ITEM, legacyWheelId)) {
            return LEGACY_WHEEL_REWARD_TO_ITEM[legacyWheelId];
        }
    }
    return toInteger(trimmed);
}

export function normalizeInventoryItems(values = []) {
    const source = Array.isArray(values) ? values : [];
    const mergedById = new Map();

    for (const rawItem of source) {
        const itemId = resolveInventoryItemId(rawItem);
        const catalogItem = INVENTORY_CATALOG[itemId];
        if (!catalogItem) continue;

        const isObj = rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem);
        const maxQuantity = (isObj ? toPositiveInteger(rawItem.maxQuantity) : null) || catalogItem.maxQuantity || 99;
        const parsedQuantity = (isObj ? toPositiveInteger(rawItem.quantity ?? rawItem.qty ?? rawItem.units) : 1) || 1;

        const previous = mergedById.get(itemId);
        const nextQuantity = Math.min(maxQuantity, (previous?.quantity || 0) + Math.min(maxQuantity, parsedQuantity));
        const itemCat = (isObj ? rawItem.cat : null) || catalogItem.cat;

        mergedById.set(itemId, {
            id: itemId,
            quantity: nextQuantity,
            maxQuantity,
            equipped: itemCat !== 'items' ? !!(previous?.equipped || (isObj && rawItem.equipped)) : false,
            name: (isObj ? rawItem.name : null) || catalogItem.name,
            desc: (isObj ? rawItem.desc : null) || catalogItem.desc,
            icon: (isObj ? rawItem.icon : null) || catalogItem.icon,
            color: (isObj ? rawItem.color : null) || catalogItem.color,
            cat: itemCat
        });
    }
    return [...mergedById.values()].sort((a, b) => a.id - b.id);
}