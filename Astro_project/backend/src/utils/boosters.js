const BOOSTER_ITEM_FIELD_MAP = Object.freeze({
    3: 'doubleCoinsGamesLeft',
    4: 'doubleScoreGamesLeft',
    5: 'slowTimeGamesLeft',  // NUEVO: ID 5 -> Cronómetro
    6: 'shieldGamesLeft'     // NUEVO: ID 6 -> Escudo
});

const DEFAULT_ACTIVE_BOOSTERS = Object.freeze({
    doubleCoinsGamesLeft: 0,
    doubleScoreGamesLeft: 0,
    slowTimeGamesLeft: 0,    // NUEVO
    shieldGamesLeft: 0       // NUEVO
});

const DEFAULT_BOOSTER_DURATION_GAMES = 3;

function toNonNegativeInteger(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed < 0) return 0;
    return parsed;
}

function normalizeActiveBoosters(activeBoosters = {}) {
    const source =
        activeBoosters && typeof activeBoosters === 'object' && !Array.isArray(activeBoosters)
            ? activeBoosters
            : {};

    return {
        doubleCoinsGamesLeft: toNonNegativeInteger(source.doubleCoinsGamesLeft),
        doubleScoreGamesLeft: toNonNegativeInteger(source.doubleScoreGamesLeft),
        slowTimeGamesLeft: toNonNegativeInteger(source.slowTimeGamesLeft), // NUEVO
        shieldGamesLeft: toNonNegativeInteger(source.shieldGamesLeft)      // NUEVO
    };
}

function getBoosterFieldByItemId(itemId) {
    return BOOSTER_ITEM_FIELD_MAP[itemId] || null;
}

function addBoosterDuration(activeBoosters, field, duration = DEFAULT_BOOSTER_DURATION_GAMES) {
    const normalized = normalizeActiveBoosters(activeBoosters);
    if (!field || !Object.prototype.hasOwnProperty.call(DEFAULT_ACTIVE_BOOSTERS, field)) {
        return normalized;
    }

    normalized[field] = normalized[field] + Math.max(0, toNonNegativeInteger(duration));
    return normalized;
}

function consumeBoostersForCompletedGame(activeBoosters) {
    const normalized = normalizeActiveBoosters(activeBoosters);

    if (normalized.doubleCoinsGamesLeft > 0) normalized.doubleCoinsGamesLeft -= 1;
    if (normalized.doubleScoreGamesLeft > 0) normalized.doubleScoreGamesLeft -= 1;
    if (normalized.slowTimeGamesLeft > 0)    normalized.slowTimeGamesLeft -= 1;    // NUEVO
    if (normalized.shieldGamesLeft > 0)      normalized.shieldGamesLeft -= 1;      // NUEVO

    return normalized;
}

function getScoreMultiplier(activeBoosters) {
    const normalized = normalizeActiveBoosters(activeBoosters);
    return normalized.doubleScoreGamesLeft > 0 ? 2 : 1;
}

function getCoinsMultiplier(activeBoosters) {
    const normalized = normalizeActiveBoosters(activeBoosters);
    return normalized.doubleCoinsGamesLeft > 0 ? 2 : 1;
}

module.exports = {
    BOOSTER_ITEM_FIELD_MAP,
    DEFAULT_ACTIVE_BOOSTERS,
    DEFAULT_BOOSTER_DURATION_GAMES,
    normalizeActiveBoosters,
    getBoosterFieldByItemId,
    addBoosterDuration,
    consumeBoostersForCompletedGame,
    getScoreMultiplier,
    getCoinsMultiplier
};