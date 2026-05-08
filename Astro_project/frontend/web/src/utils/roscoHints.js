/**
 * Utilidad para generar pistas dinámicas en SpelledRosco.
 */

const CATEGORY_MAP = {
  // Espacio
  estrella: 'ESPACIO',
  planeta: 'ESPACIO',
  galaxia: 'ESPACIO',
  cohete: 'ESPACIO',
  astronauta: 'ESPACIO',
  orbita: 'ESPACIO',
  luna: 'ESPACIO',
  marte: 'ESPACIO',
  jupiter: 'ESPACIO',
  saturno: 'ESPACIO',
  telescopio: 'ESPACIO',
  cometa: 'ESPACIO',
  agujero: 'ESPACIO',

  // Tecnología / Ciencia
  programar: 'TECNOLOGÍA',
  codigo: 'TECNOLOGÍA',
  ordenador: 'TECNOLOGÍA',
  internet: 'TECNOLOGÍA',
  software: 'TECNOLOGÍA',
  hardware: 'TECNOLOGÍA',
  robot: 'TECNOLOGÍA',
  algoritmo: 'TECNOLOGÍA',
  pantalla: 'TECNOLOGÍA',
  teclado: 'TECNOLOGÍA',
  raton: 'TECNOLOGÍA',
  redes: 'TECNOLOGÍA',
  datos: 'TECNOLOGÍA',
  celular: 'TECNOLOGÍA',
  chip: 'TECNOLOGÍA',
  ciencia: 'CIENCIA',
  quimica: 'CIENCIA',
  fisica: 'CIENCIA',
  biologia: 'CIENCIA',

  // Acciones / Verbos comunes
  correr: 'ACCIONES',
  saltar: 'ACCIONES',
  comer: 'ACCIONES',
  dormir: 'ACCIONES',
  pensar: 'ACCIONES',
  escribir: 'ACCIONES',
  leer: 'ACCIONES',
  jugar: 'ACCIONES',
  hablar: 'ACCIONES',
  cantar: 'ACCIONES',
  bailar: 'ACCIONES',

  // Objetos / Hogar
  casa: 'HOGAR',
  mesa: 'HOGAR',
  silla: 'HOGAR',
  puerta: 'HOGAR',
  ventana: 'HOGAR',
  cocina: 'HOGAR',
  cama: 'HOGAR',

  // Naturaleza / Animales
  arbol: 'NATURALEZA',
  bosque: 'NATURALEZA',
  flor: 'NATURALEZA',
  rio: 'NATURALEZA',
  mar: 'NATURALEZA',
  montaña: 'NATURALEZA',
  perro: 'ANIMALES',
  gato: 'ANIMALES',
  pajaro: 'ANIMALES',
  leon: 'ANIMALES',
  tigre: 'ANIMALES',
  caballo: 'ANIMALES',
}

/**
 * Obtiene una categoría temática basada en la palabra.
 * @param {string} word
 * @returns {string}
 */
export function getWordCategory (word) {
  if (!word) {
    return 'GENERAL'
  }
  const normalized = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036F]/g, '')

  // Búsqueda directa
  if (CATEGORY_MAP[normalized]) {
    return CATEGORY_MAP[normalized]
  }

  // Búsqueda por sub-palabras clave si no hay match directo
  if (normalized.includes('espac') || normalized.includes('astron')) {
    return 'ESPACIO'
  }
  if (normalized.includes('tecno') || normalized.includes('comput')) {
    return 'TECNOLOGÍA'
  }
  if (normalized.includes('comid') || normalized.includes('aliment')) {
    return 'ALIMENTACIÓN'
  }
  if (normalized.includes('deport') || normalized.includes('futbol')) {
    return 'DEPORTES'
  }

  return 'GENERAL'
}

/**
 * Deriva el tipo de palabra (Sustantivo, Verbo, Adverbio) basándose en terminaciones.
 * @param {string} word
 * @returns {string}
 */
export function getWordType (word) {
  if (!word) {
    return 'SUSTANTIVO'
  }
  const normalized = word.toLowerCase()

  // Verbos (infinitivos comunes en español)
  if (normalized.endsWith('ar') || normalized.endsWith('er') || normalized.endsWith('ir')) {
    return 'VERBO'
  }

  // Adverbios
  if (normalized.endsWith('mente')) {
    return 'ADVERBIO'
  }

  // Sustantivos con terminaciones comunes
  if (normalized.endsWith('cion') || normalized.endsWith('sion') || normalized.endsWith('dad') || normalized.endsWith('ismo')) {
    return 'SUSTANTIVO'
  }

  // Por defecto, tratamos como sustantivo/adjetivo
  return 'SUSTANTIVO'
}
