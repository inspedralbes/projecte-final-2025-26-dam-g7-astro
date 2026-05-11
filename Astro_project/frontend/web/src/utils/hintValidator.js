/**
 * Normaliza una cadena quitando acentos, convirtiendo a minúsculas y eliminando símbolos/espacios.
 * @param {string} text
 * @returns {string}
 */
export function normalizeText (text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '') // Quita acentos
    .replace(/[^a-z0-z0-9]/g, '') // Quita todo lo que no sea alfanumérico
}

/**
 * Genera una expresión regular dinámica para detectar una palabra con posibles caracteres de relleno.
 * Ejemplo: 'sol' -> /s.{0,2}o.{0,2}l/i
 * @param {string} secretWord
 * @returns {RegExp}
 */
export function generateAntiCheatRegex (secretWord) {
  const normalizedSecret = normalizeText(secretWord)
  const pattern = normalizedSecret
    .split('')
    .map((char, index) => {
      if (index === normalizedSecret.length - 1) {
        return char
      }
      return `${char}.{0,2}`
    })
    .join('')
  return new RegExp(pattern, 'i')
}

/**
 * Valida si una pista es válida (no es la palabra secreta ni una variante obfuscada).
 * @param {string} hint
 * @param {string} secretWord
 * @returns {boolean} True si es válida, false si es trampa.
 */
export function isValidHint (hint, secretWord) {
  const normalizedHint = normalizeText(hint)
  const normalizedSecret = normalizeText(secretWord)

  if (!normalizedHint || !normalizedSecret) {
    return true
  }

  // 1. Verificación exacta
  if (normalizedHint === normalizedSecret) {
    return false
  }

  // 2. Verificación por RegEx (trampas tipo S.O.L)
  const regex = generateAntiCheatRegex(normalizedSecret)
  if (regex.test(normalizedHint)) {
    return false
  }

  return true
}
