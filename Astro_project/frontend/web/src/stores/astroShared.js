const hasWindow = typeof window !== 'undefined'

function getStorage (persistent = false) {
  if (!hasWindow) {
    return null
  }
  return persistent ? window.localStorage : window.sessionStorage
}

export const STORAGE_KEYS = Object.freeze({
  user: 'astro_user',
  plan: 'astro_plan',
  rank: 'astro_rank',
  level: 'astro_level',
  xp: 'astro_xp',
  streak: 'astro_streak',
  streakFreezes: 'astro_streak_freezes',
  activeBoosters: 'astro_active_boosters',
  selectedAchievements: 'astro_selected_achievements',
  unlockedAchievements: 'astro_unlocked_achievements',
  avatar: 'astro_avatar',
  token: 'astro_token',
  role: 'astro_role',
  parentId: 'astro_parent_id',
  lastActivity: 'astro_last_activity',
  lastGame: 'astro_last_game',
})

export const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutos en milisegundos

export function storageGetItem (key, persistent = false) {
  const storage = getStorage(persistent)
  return storage ? storage.getItem(key) : null
}

export function storageSetItem (key, value, persistent = false) {
  const storage = getStorage(persistent)
  if (!storage) {
    return
  }
  storage.setItem(key, String(value))
}

export function storageRemoveItem (key, persistent = false) {
  const storage = getStorage(persistent)
  if (!storage) {
    return
  }
  storage.removeItem(key)
}

export function readStoredArray (key, fallback = []) {
  const rawValue = storageGetItem(key)
  if (!rawValue) {
    return fallback
  }

  try {
    const parsedValue = JSON.parse(rawValue)
    return Array.isArray(parsedValue) ? parsedValue : fallback
  } catch {
    console.warn(`⚠️ Valor inválido en localStorage para ${key}. Se usa valor por defecto.`)
    return fallback
  }
}

export function readStoredObject (key, fallback = {}) {
  const rawValue = storageGetItem(key)
  if (!rawValue) {
    return fallback
  }

  try {
    const parsedValue = JSON.parse(rawValue)
    return parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue)
      ? parsedValue
      : fallback
  } catch {
    console.warn(`⚠️ Valor inválido en localStorage para ${key}. Se usa valor por defecto.`)
    return fallback
  }
}

export function writeStoredJson (key, value, persistent = false) {
  storageSetItem(key, JSON.stringify(value), persistent)
}

export function normalizeSelectedAchievements (values = []) {
  return [
    values[0] ?? null,
    values[1] ?? null,
    values[2] ?? null,
  ]
}

export function normalizeUnlockedAchievements (values = []) {
  return [...new Set(
    values
      .map(Number)
      .filter(value => Number.isInteger(value) && value > 0),
  )].sort((a, b) => a - b)
}

function toNonNegativeInteger (value) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0
}

export function normalizeActiveBoosters (values = {}) {
  const source
    = values && typeof values === 'object' && !Array.isArray(values)
      ? values
      : {}

  return {
    doubleCoinsGamesLeft: toNonNegativeInteger(source.doubleCoinsGamesLeft),
    doubleScoreGamesLeft: toNonNegativeInteger(source.doubleScoreGamesLeft),
    sabotageGamesLeft: toNonNegativeInteger(source.sabotageGamesLeft),
  }
}

const DEFAULT_INVENTORY_MAX = 99

export const INVENTORY_CATALOG = Object.freeze({
  1: {
    id: 1,
    name: 'Pack de Vidas',
    desc: 'Recupera 5 vidas inmediatamente.',
    icon: 'mdi-heart-multiple',
    color: 'red-accent-2',
    cat: 'items',
    maxQuantity: 99,
  },
  2: {
    id: 2,
    name: 'Congelar Racha',
    desc: 'Protege tu racha un día.',
    icon: 'mdi-snowflake',
    color: 'cyan-accent-2',
    cat: 'items',
    maxQuantity: 99,
  },
  3: {
    id: 3,
    name: 'Doble de Monedas',
    desc: 'Multiplica x2 las monedas ganadas.',
    icon: 'mdi-piggy-bank',
    color: 'yellow-accent-3',
    cat: 'items',
    maxQuantity: 99,
  },
  4: {
    id: 4,
    name: 'Doble Puntuación',
    desc: 'Multiplica x2 los puntos obtenidos.',
    icon: 'mdi-star-shooting',
    color: 'orange-accent-3',
    cat: 'items',
    maxQuantity: 99,
  },
  5: {
    id: 5,
    name: 'Rayo Saboteador',
    desc: 'En multijugador, tus aciertos restan el doble de tiempo al rival.',
    icon: 'mdi-lightning-bolt',
    color: 'deep-purple-accent-2',
    cat: 'items',
    maxQuantity: 99,
  },
  6: {
    id: 6,
    name: 'Cambio de Nombre',
    desc: 'Cambia tu apodo mostrado en el perfil. ¡El primero es gratis desde tu perfil!',
    icon: 'mdi-account-edit',
    color: 'green-accent-2',
    cat: 'items',
    maxQuantity: 99,
  },
  101: {
    id: 101,
    name: 'Pin Comandante',
    desc: 'Insignia dorada.',
    icon: 'mdi-medal',
    color: 'amber-accent-3',
    cat: 'skin',
    maxQuantity: 1,
  },
  102: {
    id: 102,
    name: 'Avatar Ciber Hacker',
    desc: 'Un hacker del futuro. Otorga +15% de puntuación en todas las misiones.',
    icon: 'mdi-robot',
    image: 'avatar_hacker.png',
    color: 'cyan-accent-3',
    cat: 'skin',
    maxQuantity: 1,
    boost: { type: 'score', multiplier: 1.15 },
  },
  104: {
    id: 104,
    name: 'Rastro de Neón',
    desc: 'Efectos visuales.',
    icon: 'mdi-creation',
    color: 'pink-accent-3',
    cat: 'trails',
    maxQuantity: 1,
  },
  105: {
    id: 105,
    name: 'El Imparable',
    desc: 'Etiqueta de texto permanente.',
    icon: 'mdi-format-title',
    color: 'red-accent-3',
    cat: 'title',
    maxQuantity: 1,
  },
  106: {
    id: 106,
    name: 'Leyenda Galáctica',
    desc: 'Etiqueta de texto permanente.',
    icon: 'mdi-format-title',
    color: 'cyan-accent-3',
    cat: 'title',
    maxQuantity: 1,
  },
  107: {
    id: 107,
    name: 'Destructor de Asteroides',
    desc: 'Etiqueta de texto permanente.',
    icon: 'mdi-format-title',
    color: 'amber-accent-3',
    cat: 'title',
    maxQuantity: 1,
  },
  201: {
    id: 201,
    name: 'Pin Raro',
    desc: 'Insignia rara de edición limitada.',
    icon: 'mdi-decagram',
    color: 'purple-accent-2',
    cat: 'collectible',
    maxQuantity: 99,
  },
  202: {
    id: 202,
    name: 'Avatar Viajero Nebulosa',
    desc: 'Explorador cósmico. Otorga +20% de tiempo en misiones contrarreloj.',
    icon: 'mdi-space-invaders',
    image: 'avatar_nebula.png',
    color: 'purple-accent-2',
    cat: 'skin',
    maxQuantity: 1,
    boost: { type: 'time', multiplier: 1.2 },
  },
  203: {
    id: 203,
    name: 'Avatar Caballero Estelar',
    desc: 'Guerrero solar. Otorga +10% de créditos en todas las misiones.',
    icon: 'mdi-shield-sun',
    image: 'avatar_knight.png',
    color: 'amber-accent-4',
    cat: 'skin',
    maxQuantity: 1,
    boost: { type: 'coins', multiplier: 1.1 },
  },
})

const LEGACY_ITEM_NAME_TO_ID = Object.freeze({
  'Vida Extra': 1,
  'Pack de Vidas': 1,
  'Congelar Racha': 2,
  'Doble de Monedas': 3,
  'Doble Puntuación': 4,
  'Pin Comandante': 101,
  'Avatar Ciber Hacker': 102,
  'Rastro de Neón': 104,
  'Pin Raro': 201,
  'Avatar Viajero Nebulosa': 202,
  'Avatar Caballero Estelar': 203,
})

const LEGACY_WHEEL_REWARD_TO_ITEM = Object.freeze({
  0: 1,
  1: 201,
  2: 202,
})

function toInteger (value) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) ? parsed : null
}

export function toPositiveInteger (value) {
  const parsed = toInteger(value)
  return parsed !== null && parsed > 0 ? parsed : null
}

function resolveInventoryItemId (rawItem) {
  const candidate
    = rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
      ? rawItem.itemId ?? rawItem.id ?? rawItem.name ?? rawItem.label
      : rawItem

  if (typeof candidate === 'number' && Number.isInteger(candidate)) {
    return candidate
  }

  if (typeof candidate !== 'string') {
    return null
  }

  const trimmed = candidate.trim()
  if (!trimmed) {
    return null
  }

  if (Object.prototype.hasOwnProperty.call(LEGACY_ITEM_NAME_TO_ID, trimmed)) {
    return LEGACY_ITEM_NAME_TO_ID[trimmed]
  }

  const legacyPrizeMatch = trimmed.match(/^prize_\d+_(\d+)$/)
  if (legacyPrizeMatch) {
    const legacyWheelId = toInteger(legacyPrizeMatch[1])
    if (
      legacyWheelId !== null
      && Object.prototype.hasOwnProperty.call(LEGACY_WHEEL_REWARD_TO_ITEM, legacyWheelId)
    ) {
      return LEGACY_WHEEL_REWARD_TO_ITEM[legacyWheelId]
    }
  }

  return toInteger(trimmed)
}

export function normalizeInventoryItems (values = []) {
  const source = Array.isArray(values) ? values : []
  const mergedById = new Map()

  for (const rawItem of source) {
    const itemId = resolveInventoryItemId(rawItem)
    const catalogItem = INVENTORY_CATALOG[itemId]
    if (!catalogItem) {
      continue
    }

    const rawMax
      = rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
        ? toPositiveInteger(rawItem.maxQuantity)
        : null
    const maxQuantity = rawMax || catalogItem.maxQuantity || DEFAULT_INVENTORY_MAX

    const rawQuantity
      = rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
        ? rawItem.quantity ?? rawItem.qty ?? rawItem.units
        : 1
    const parsedQuantity = toPositiveInteger(rawQuantity) || 1
    const safeQuantity = Math.min(maxQuantity, parsedQuantity)

    const previous = mergedById.get(itemId)
    const nextQuantity = Math.min(maxQuantity, (previous?.quantity || 0) + safeQuantity)
    const itemCat
      = rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
        ? rawItem.cat || catalogItem.cat
        : catalogItem.cat
    const isEquipable = itemCat !== 'items'
    const equippedCandidate
      = rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
        ? !!rawItem.equipped
        : false

    mergedById.set(itemId, {
      id: itemId,
      quantity: nextQuantity,
      maxQuantity,
      equipped: isEquipable ? !!(previous?.equipped || equippedCandidate) : false,
      name:
                rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
                  ? rawItem.name || catalogItem.name
                  : catalogItem.name,
      desc:
                rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
                  ? rawItem.desc || catalogItem.desc
                  : catalogItem.desc,
      icon:
                rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
                  ? rawItem.icon || catalogItem.icon
                  : catalogItem.icon,
      color:
                rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
                  ? rawItem.color || catalogItem.color
                  : catalogItem.color,
      cat: itemCat,
      image:
                rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
                  ? rawItem.image || catalogItem.image
                  : catalogItem.image,
      boost:
                rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem)
                  ? rawItem.boost || catalogItem.boost
                  : catalogItem.boost,
    })
  }

  return [...mergedById.values()].sort((a, b) => a.id - b.id)
}

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '')

export function buildApiUrl (path) {
  if (!path.startsWith('/')) {
    return `${API_BASE_URL}/${path}`
  }
  return `${API_BASE_URL}${path}`
}

export async function requestJson (path, options = {}) {
  const response = await fetch(buildApiUrl(path), options)
  const text = await response.text()

  if (!text) {
    return { response, data: {} }
  }

  try {
    return { response, data: JSON.parse(text) }
  } catch {
    return { response, data: { message: text } }
  }
}
