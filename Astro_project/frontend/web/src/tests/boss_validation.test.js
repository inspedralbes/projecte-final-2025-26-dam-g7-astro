import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMultiplayerStore } from '../modes/multiplayer/store/multiplayerStore'
import { useInventoryStore } from '../stores/inventoryStore'

vi.mock('../stores/astroShared', () => ({
  API_BASE_URL: 'http://localhost',
  requestJson: vi.fn(),
  STORAGE_KEYS: {
    user: 'astro_user',
    token: 'astro_token',
  },
  storageGetItem: vi.fn(),
  storageSetItem: vi.fn(),
  storageRemoveItem: vi.fn(),
}))

// Mock de i18n
vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: (key, def) => def || key
    }
  }
}))

describe('Multiplayer Store - Boss Mode Validation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('canAccessBossMode debe ser false si el inventario está vacío', () => {
    const multiplayerStore = useMultiplayerStore()
    const inventoryStore = useInventoryStore()
    
    inventoryStore.inventory = []
    expect(multiplayerStore.canAccessBossMode).toBeFalsy()
  })

  it('canAccessBossMode debe ser true si tiene el item ID 1 con cantidad > 0', () => {
    const multiplayerStore = useMultiplayerStore()
    const inventoryStore = useInventoryStore()
    
    inventoryStore.inventory = [
      { id: 1, quantity: 5, name: 'Pack de Vidas' }
    ]
    expect(multiplayerStore.canAccessBossMode).toBe(true)
  })

  it('canAccessBossMode debe ser false si tiene el item ID 1 con cantidad 0', () => {
    const multiplayerStore = useMultiplayerStore()
    const inventoryStore = useInventoryStore()
    
    inventoryStore.inventory = [
      { id: 1, quantity: 0, name: 'Pack de Vidas' }
    ]
    expect(multiplayerStore.canAccessBossMode).toBeFalsy()
  })

  it('validateBossAccess debe devolver error si no hay vidas', () => {
    const multiplayerStore = useMultiplayerStore()
    const inventoryStore = useInventoryStore()
    
    inventoryStore.inventory = []
    const result = multiplayerStore.validateBossAccess()
    
    expect(result.valid).toBe(false)
    expect(result.message).toContain('Pack de Vidas')
  })

  it('validateBossAccess debe devolver valid: true si hay vidas', () => {
    const multiplayerStore = useMultiplayerStore()
    const inventoryStore = useInventoryStore()
    
    inventoryStore.inventory = [
      { id: 1, quantity: 1, name: 'Pack de Vidas' }
    ]
    const result = multiplayerStore.validateBossAccess()
    
    expect(result.valid).toBe(true)
  })
})
