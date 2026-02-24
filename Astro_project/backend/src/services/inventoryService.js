const {
    MAX_INVENTORY_UNITS,
    INVENTORY_ITEMS,
    LEGACY_ITEM_NAME_TO_ID,
    LEGACY_WHEEL_REWARD_ID_TO_ITEM_ID
} = require('../constants/inventory');
const { toInteger, toPositiveInteger } = require('../utils/numbers');

const INVENTORY_ITEM_BY_ID = new Map(INVENTORY_ITEMS.map((item) => [item.id, item]));

function getInventoryCatalogItem(itemId) {
    return INVENTORY_ITEM_BY_ID.get(itemId) || null;
}

function getItemMaxQuantity(itemId) {
    const item = getInventoryCatalogItem(itemId);
    if (!item) return 1;
    if (Number.isInteger(item.maxQuantity) && item.maxQuantity > 0) return item.maxQuantity;
    if (item.stackable === false) return 1;
    return MAX_INVENTORY_UNITS;
}

function resolveInventoryItemId(rawItem) {
    const candidate =
        rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
            ? rawItem.itemId ?? rawItem.id ?? rawItem.name ?? rawItem.label
            : rawItem;

    if (typeof candidate === 'number' && Number.isInteger(candidate)) {
        return candidate;
    }

    if (typeof candidate !== 'string') return null;

    const trimmed = candidate.trim();
    if (!trimmed) return null;

    if (Object.prototype.hasOwnProperty.call(LEGACY_ITEM_NAME_TO_ID, trimmed)) {
        return LEGACY_ITEM_NAME_TO_ID[trimmed];
    }

    const legacyPrizeMatch = trimmed.match(/^prize_\d+_(\d+)$/);
    if (legacyPrizeMatch) {
        const legacyWheelId = toInteger(legacyPrizeMatch[1]);
        if (
            legacyWheelId !== null &&
            Object.prototype.hasOwnProperty.call(LEGACY_WHEEL_REWARD_ID_TO_ITEM_ID, legacyWheelId)
        ) {
            return LEGACY_WHEEL_REWARD_ID_TO_ITEM_ID[legacyWheelId];
        }
    }

    return toInteger(trimmed);
}

function normalizeInventoryEntries(rawInventory = []) {
    const mergedById = new Map();
    const source = Array.isArray(rawInventory) ? rawInventory : [];

    for (const rawItem of source) {
        const itemId = resolveInventoryItemId(rawItem);
        const catalogItem = getInventoryCatalogItem(itemId);
        if (!catalogItem) continue;

        const maxQuantity = getItemMaxQuantity(itemId);
        const rawQuantity =
            rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
                ? rawItem.quantity ?? rawItem.qty ?? rawItem.units ?? rawItem.count
                : 1;
        const parsedQuantity = toPositiveInteger(rawQuantity) ?? 1;
        const safeQuantity = Math.min(maxQuantity, parsedQuantity);

        const previous = mergedById.get(itemId);
        const nextQuantity = Math.min(maxQuantity, (previous?.quantity || 0) + safeQuantity);
        const isEquipable = catalogItem.cat !== 'items';
        const equippedCandidate =
            rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
                ? !!rawItem.equipped
                : false;

        mergedById.set(itemId, {
            id: itemId,
            quantity: nextQuantity,
            equipped: isEquipable ? Boolean(previous?.equipped || equippedCandidate) : false
        });
    }

    return [...mergedById.values()].sort((a, b) => a.id - b.id);
}

function serializeInventory(inventory = []) {
    return [...(Array.isArray(inventory) ? inventory : [])]
        .map((item) => {
            const itemId = toPositiveInteger(item?.id);
            const catalogItem = getInventoryCatalogItem(itemId);
            if (!catalogItem) return null;

            const maxQuantity = getItemMaxQuantity(itemId);
            const quantity = Math.min(maxQuantity, toPositiveInteger(item?.quantity) || 1);

            return {
                id: itemId,
                quantity,
                equipped: catalogItem.cat !== 'items' ? !!item?.equipped : false
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.id - b.id);
}

function enrichInventory(inventory = []) {
    return serializeInventory(inventory)
        .map((entry) => {
            const catalogItem = getInventoryCatalogItem(entry.id);
            if (!catalogItem) return null;

            return {
                id: entry.id,
                quantity: entry.quantity,
                equipped: catalogItem.cat !== 'items' ? !!entry.equipped : false,
                maxQuantity: getItemMaxQuantity(entry.id),
                name: catalogItem.name,
                desc: catalogItem.desc,
                icon: catalogItem.icon,
                color: catalogItem.color,
                cat: catalogItem.cat,
                price: Number.isFinite(catalogItem.price) ? catalogItem.price : null
            };
        })
        .filter(Boolean);
}

function inventorySignature(inventory = []) {
    return JSON.stringify(serializeInventory(normalizeInventoryEntries(inventory)));
}

function getInventoryQuantity(inventory = [], itemId) {
    const targetId = toPositiveInteger(itemId);
    if (!targetId) return 0;

    const found = serializeInventory(inventory).find((entry) => entry.id === targetId);
    return found ? found.quantity : 0;
}

async function normalizeAndPersistInventory(userDoc, usersCollection) {
    const normalized = normalizeInventoryEntries(userDoc?.inventory || []);
    const serialized = serializeInventory(normalized);
    const hasStreakFreezesField = Number.isInteger(userDoc?.streakFreezes);
    const storedFreezes = hasStreakFreezesField ? Math.max(0, userDoc.streakFreezes) : 0;

    // Migración de legado: si había congeladores en campo separado, los convertimos a unidades del item 2.
    if (storedFreezes > getInventoryQuantity(serialized, 2)) {
        const freezeMax = getItemMaxQuantity(2);
        const targetFreezeUnits = Math.min(freezeMax, storedFreezes);
        const freezeIndex = serialized.findIndex((entry) => entry.id === 2);

        if (freezeIndex === -1) {
            serialized.push({ id: 2, quantity: targetFreezeUnits, equipped: false });
        } else {
            serialized[freezeIndex].quantity = Math.max(serialized[freezeIndex].quantity, targetFreezeUnits);
        }
    }

    const canonicalInventory = serializeInventory(serialized);
    const freezeUnits = getInventoryQuantity(canonicalInventory, 2);
    const streakNeedsSync = hasStreakFreezesField && userDoc.streakFreezes !== freezeUnits;
    const inventoryNeedsSync = inventorySignature(userDoc?.inventory || []) !== inventorySignature(canonicalInventory);

    if (inventoryNeedsSync || streakNeedsSync) {
        const updatePayload = { inventory: canonicalInventory };
        if (hasStreakFreezesField) {
            updatePayload.streakFreezes = freezeUnits;
        }

        await usersCollection.updateOne({ _id: userDoc._id }, { $set: updatePayload });
    }

    return canonicalInventory;
}

module.exports = {
    getInventoryCatalogItem,
    getItemMaxQuantity,
    normalizeInventoryEntries,
    serializeInventory,
    enrichInventory,
    normalizeAndPersistInventory,
    getInventoryQuantity,
    toPositiveInteger
};
