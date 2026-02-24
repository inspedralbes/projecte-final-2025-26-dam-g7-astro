function toInteger(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) ? parsed : null;
}

function toPositiveInteger(value) {
    const parsed = toInteger(value);
    return parsed !== null && parsed > 0 ? parsed : null;
}

module.exports = {
    toInteger,
    toPositiveInteger
};
