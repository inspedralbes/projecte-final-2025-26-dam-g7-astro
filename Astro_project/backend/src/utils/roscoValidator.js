// backend/src/utils/roscoValidator.js

const { ROSCO_WORDS } = require('../constants/rosco');

function validateRoscoWords() {
    const errors = [];
    ROSCO_WORDS.forEach((word, index) => {
        if (!word.char) errors.push(`Word at index ${index} is missing 'char'`);
        if (!word.question) errors.push(`Word at index ${index} is missing 'question'`);
        if (!word.answer) errors.push(`Word at index ${index} is missing 'answer'`);
        if (!word.hieroglyphs || !Array.isArray(word.hieroglyphs) || word.hieroglyphs.length !== 3) {
            errors.push(`Word '${word.answer}' (${word.char}) must have exactly 3 hieroglyphs.`);
        }
    });

    if (errors.length > 0) {
        console.error('Rosco validation failed:');
        errors.forEach(err => console.error(` - ${err}`));
        return false;
    }

    console.log('Rosco validation successful: all words have 3 hieroglyphs.');
    return true;
}

module.exports = {
    validateRoscoWords
};
