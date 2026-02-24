function normalizeAchievementIds(ids = []) {
    if (!Array.isArray(ids)) return [];

    return [...new Set(
        ids
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0)
    )].sort((a, b) => a - b);
}

module.exports = {
    normalizeAchievementIds
};
