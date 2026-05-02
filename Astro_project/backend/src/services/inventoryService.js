// Astro_project/backend/src/services/inventoryService.js

const {
    MAX_INVENTORY_UNITS,
    INVENTORY_ITEMS,
    LEGACY_ITEM_NAME_TO_ID,
    LEGACY_WHEEL_REWARD_ID_TO_ITEM_ID
} = require('../constants/inventory');
const { toInteger, toPositiveInteger } = require('../utils/numbers');

const INVENTORY_ITEM_BY_ID = new Map(INVENTORY_ITEMS.map((item) => [item.id, item]));

class InventoryService {
    constructor({
        userRepository,
        normalizeActiveBoosters,
        getBoosterFieldByItemId,
        addBoosterDuration
    } = {}) {
        this.userRepo = userRepository;
        this.normalizeActiveBoosters = normalizeActiveBoosters;
        this.getBoosterFieldByItemId = getBoosterFieldByItemId;
        this.addBoosterDuration = addBoosterDuration;
    }

    getInventoryCatalogItem(itemId) {
        return INVENTORY_ITEM_BY_ID.get(itemId) || null;
    }

    getItemMaxQuantity(itemId) {
        const item = this.getInventoryCatalogItem(itemId);
        if (!item) return 1;
        if (Number.isInteger(item.maxQuantity) && item.maxQuantity > 0) return item.maxQuantity;
        if (item.stackable === false) return 1;
        return MAX_INVENTORY_UNITS;
    }

    resolveInventoryItemId(rawItem) {
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

    normalizeInventoryEntries(rawInventory = []) {
        const mergedById = new Map();
        const source = Array.isArray(rawInventory) ? rawInventory : [];

        for (const rawItem of source) {
            const itemId = this.resolveInventoryItemId(rawItem);
            const catalogItem = this.getInventoryCatalogItem(itemId);
            if (!catalogItem) continue;

            const maxQuantity = this.getItemMaxQuantity(itemId);
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

    serializeInventory(inventory = []) {
        return [...(Array.isArray(inventory) ? inventory : [])]
            .map((item) => {
                const itemId = toPositiveInteger(item?.id);
                const catalogItem = this.getInventoryCatalogItem(itemId);
                if (!catalogItem) return null;

                const maxQuantity = this.getItemMaxQuantity(itemId);
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

    enrichInventory(inventory = []) {
        return this.serializeInventory(inventory)
            .map((entry) => {
                const catalogItem = this.getInventoryCatalogItem(entry.id);
                if (!catalogItem) return null;

                return {
                    id: entry.id,
                    quantity: entry.quantity,
                    equipped: catalogItem.cat !== 'items' ? !!entry.equipped : false,
                    maxQuantity: this.getItemMaxQuantity(entry.id),
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

    inventorySignature(inventory = []) {
        return JSON.stringify(this.serializeInventory(this.normalizeInventoryEntries(inventory)));
    }

    getInventoryQuantity(inventory = [], itemId) {
        const targetId = toPositiveInteger(itemId);
        if (!targetId) return 0;

        const found = this.serializeInventory(inventory).find((entry) => entry.id === targetId);
        return found ? found.quantity : 0;
    }

    async normalizeAndPersistInventory(user) {
        const normalized = this.normalizeInventoryEntries(user.inventory || []);
        const serialized = this.serializeInventory(normalized);
        const storedFreezes = Math.max(0, user.streakFreezes || 0);

        if (storedFreezes > this.getInventoryQuantity(serialized, 2)) {
            const freezeMax = this.getItemMaxQuantity(2);
            const targetFreezeUnits = Math.min(freezeMax, storedFreezes);
            const freezeIndex = serialized.findIndex((entry) => entry.id === 2);

            if (freezeIndex === -1) {
                serialized.push({ id: 2, quantity: targetFreezeUnits, equipped: false });
            } else {
                serialized[freezeIndex].quantity = Math.max(serialized[freezeIndex].quantity, targetFreezeUnits);
            }
        }

        const canonicalInventory = this.serializeInventory(serialized);
        const freezeUnits = this.getInventoryQuantity(canonicalInventory, 2);
        
        const inventoryNeedsSync = this.inventorySignature(user.inventory || []) !== this.inventorySignature(canonicalInventory);
        const streakNeedsSync = user.streakFreezes !== freezeUnits;

        if (inventoryNeedsSync || streakNeedsSync) {
            user.inventory = canonicalInventory;
            user.streakFreezes = freezeUnits;
            await this.userRepo.update(user);
        }

        return canonicalInventory;
    }

    async useFreeze(username) {
        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error('Usuario no encontrado');

        let normalizedInventory = await this.normalizeAndPersistInventory(user);
        const availableFreezes = Math.max(user.streakFreezes || 0, this.getInventoryQuantity(normalizedInventory, 2));

        if (availableFreezes <= 0) {
            throw new Error('No tienes congeladores disponibles.');
        }

        const freezeIndex = normalizedInventory.findIndex((entry) => entry.id === 2);
        if (freezeIndex !== -1) {
            if (normalizedInventory[freezeIndex].quantity > 1) {
                normalizedInventory[freezeIndex].quantity -= 1;
            } else {
                normalizedInventory.splice(freezeIndex, 1);
            }
        }

        normalizedInventory = this.serializeInventory(normalizedInventory);
        user.inventory = normalizedInventory;
        user.streakFreezes = this.getInventoryQuantity(normalizedInventory, 2);
        user.updateLastActivity();

        await this.userRepo.update(user);

        return {
            streak: user.streak,
            streakFreezes: user.streakFreezes,
            inventory: this.enrichInventory(user.inventory),
            activeBoosters: this.normalizeActiveBoosters(user.activeBoosters)
        };
    }

    async useItem(username, itemId) {
        const parsedItemId = toPositiveInteger(itemId);
        if (!parsedItemId) throw new Error('Item inválido.');

        const boosterField = this.getBoosterFieldByItemId(parsedItemId);
        if (!boosterField) throw new Error('Este objeto no se puede usar desde inventario.');

        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error('Usuario no encontrado');

        let normalizedInventory = await this.normalizeAndPersistInventory(user);
        const itemIndex = normalizedInventory.findIndex((entry) => entry.id === parsedItemId);

        if (itemIndex === -1 || normalizedInventory[itemIndex].quantity <= 0) {
            throw new Error('No tienes unidades disponibles.');
        }

        if (normalizedInventory[itemIndex].quantity > 1) {
            normalizedInventory[itemIndex].quantity -= 1;
        } else {
            normalizedInventory.splice(itemIndex, 1);
        }

        normalizedInventory = this.serializeInventory(normalizedInventory);
        const nextActiveBoosters = this.addBoosterDuration(
            this.normalizeActiveBoosters(user.activeBoosters),
            boosterField,
            3
        );

        user.inventory = normalizedInventory;
        user.activeBoosters = nextActiveBoosters;
        user.streakFreezes = this.getInventoryQuantity(normalizedInventory, 2);
        user.updateMissionProgress('item', 1);
        user.updateLastActivity();

        await this.userRepo.update(user);

        return {
            inventory: this.enrichInventory(user.inventory),
            activeBoosters: user.activeBoosters,
            dailyMissions: user.dailyMissions,
            weeklyMissions: user.weeklyMissions
        };
    }

    async toggleEquip(username, itemId) {
        const parsedItemId = toPositiveInteger(itemId);
        if (!parsedItemId) throw new Error('Item inválido.');

        const user = await this.userRepo.findByUsername(username);
        if (!user) throw new Error('Usuario no encontrado');

        let normalizedInventory = await this.normalizeAndPersistInventory(user);
        const itemTarget = normalizedInventory.find((item) => item.id === parsedItemId);
        if (!itemTarget) throw new Error('Item no encontrado en inventario');

        const itemMeta = this.getInventoryCatalogItem(parsedItemId);
        if (!itemMeta || itemMeta.cat === 'items') {
            throw new Error('Este objeto no se puede equipar.');
        }

        const isEquipping = !itemTarget.equipped;

        const updatedInventory = normalizedInventory.map((item) => {
            if (item.id === parsedItemId) {
                return { ...item, equipped: isEquipping };
            }

            const currentMeta = this.getInventoryCatalogItem(item.id);
            if (isEquipping && currentMeta?.cat === itemMeta.cat && item.equipped) {
                return { ...item, equipped: false };
            }

            return item;
        });

        const serializedInventory = this.serializeInventory(updatedInventory);
        user.inventory = serializedInventory;
        await this.userRepo.update(user);

        return { inventory: this.enrichInventory(serializedInventory) };
    }
}

// Singleton o instància per defecte per mantenir compatibilitat
const defaultService = new InventoryService();

module.exports = {
    InventoryService,
    getInventoryCatalogItem: defaultService.getInventoryCatalogItem.bind(defaultService),
    getItemMaxQuantity: defaultService.getItemMaxQuantity.bind(defaultService),
    normalizeInventoryEntries: defaultService.normalizeInventoryEntries.bind(defaultService),
    serializeInventory: defaultService.serializeInventory.bind(defaultService),
    enrichInventory: defaultService.enrichInventory.bind(defaultService),
    getInventoryQuantity: defaultService.getInventoryQuantity.bind(defaultService),
    toPositiveInteger,
    normalizeAndPersistInventory: async (userDoc, usersCollection) => {
        const repo = { update: async (u) => usersCollection.updateOne({ _id: u.id || userDoc._id }, { $set: { inventory: u.inventory, streakFreezes: u.streakFreezes } }), findByUsername: () => userDoc };
        const service = new InventoryService({ userRepository: repo });
        return await service.normalizeAndPersistInventory(userDoc);
    }
};
