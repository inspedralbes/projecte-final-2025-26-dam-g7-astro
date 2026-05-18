// Astro_project/backend/src/utils/passwordValidator.js

/**
 * Valida si una contraseña cumple con los requisitos de seguridad:
 * - Al menos 8 caracteres
 * - Al menos una letra mayúscula (A-Z)
 * - Al menos una letra minúscula (a-z)
 * - Al menos un dígito (0-9)
 * - Al menos un carácter especial (signos de puntuación, símbolos, etc.)
 *
 * @param {string} password - La contraseña a validar
 * @returns {boolean} True si cumple todos los requisitos, false en caso contrario
 */
function isStrongPassword(password) {
    if (!password || typeof password !== 'string') return false;
    
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    
    return hasMinLength && hasUppercase && hasLowercase && hasDigit && hasSpecial;
}

module.exports = {
    isStrongPassword
};
