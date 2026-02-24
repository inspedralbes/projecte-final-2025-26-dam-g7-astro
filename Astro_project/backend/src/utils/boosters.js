const DEFAULT_ACTIVE_BOOSTERS = Object.freeze({
    doubleCoinsGames: 0,
    doubleScoreGames: 0
});

function clampGames(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) return 0;
    return Math.min(parsed, 99);
}

function normalizeActiveBoosters(rawBoosters = {}) {
    const source = rawBoosters && typeof rawBoosters === 'object' ? rawBoosters : {};

    return {
        doubleCoinsGames: clampGames(source.doubleCoinsGames),
        doubleScoreGames: clampGames(source.doubleScoreGames)
    };
}

module.exports = {
    DEFAULT_ACTIVE_BOOSTERS,
    normalizeActiveBoosters
};
