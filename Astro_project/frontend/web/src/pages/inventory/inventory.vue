<template>
  <div class="scroll-container space-background">
    <v-container class="pa-4 pa-md-8 content-wrapper" fluid>
      <v-row>
        <!-- Cabecera -->
        <v-col class="text-center mb-8" cols="12">
          <div class="d-flex align-center justify-center mb-2">
            <v-icon class="mr-3 icon-glow" color="cyan-accent-3" size="40">mdi-archive-outline</v-icon>
            <h1 class="text-h2 font-weight-bold tracking-wide text-white">{{ $t('inventory.title') }}</h1>
          </div>
          <p class="text-h6 text-cyan-accent-1 opacity-75 mb-6">
            {{ $t('inventory.subtitle') }}
          </p>

          <!-- Balance Pill -->
          <div class="d-flex justify-center mb-4">
            <div class="balance-pill-inventory px-6 py-2 rounded-pill d-flex align-center position-relative">
              <v-icon class="mr-2" color="amber-accent-3">mdi-database</v-icon>
              <span class="text-h6 font-weight-black text-amber-accent-3">{{ animatedCoins }}</span>
              <transition-group name="float-coin">
                <span
                  v-for="change in coinChanges"
                  :key="change.id"
                  class="coin-change-popup"
                  :class="change.amount > 0 ? 'plus' : 'minus'"
                >
                  {{ change.amount > 0 ? '+' : '' }}{{ change.amount }}
                </span>
              </transition-group>
            </div>
          </div>
        </v-col>

        <!-- Categorías -->
        <v-col cols="12" md="3">
          <v-list bg-color="transparent" class="glass-sidebar pa-2 rounded-xl">
            <v-list-item
              v-for="cat in categories"
              :key="cat.id"
              v-model="activeCategory"
              class="mb-2 rounded-lg category-item"
              :class="{ 'active-cat': activeCategory === cat.id }"
              :prepend-icon="cat.icon"
              :title="cat.name"
              :value="cat.id"
              @click="activeCategory = cat.id"
            />
          </v-list>
        </v-col>

        <!-- Malla de Items -->
        <v-col cols="12" md="9">
          <v-row v-if="filteredItems.length > 0">
            <v-col
              v-for="item in filteredItems"
              :key="item.id"
              cols="12"
              lg="4"
              sm="6"
            >
              <v-card
                class="item-card glass-card h-100 pa-4 d-flex flex-column"
                rounded="xl"
              >
                <!-- Badge de cantidad -->
                <div class="quantity-badge">
                  x{{ item.quantity }}
                </div>

                <div class="d-flex flex-column align-center flex-grow-1">
                  <v-avatar
                    class="mb-4 avatar-glow"
                    size="90"
                    :style="{ backgroundColor: item.color + '20' }"
                  >
                    <v-icon :color="item.color" size="45">{{ item.icon }}</v-icon>
                  </v-avatar>

                  <h3 class="text-h6 font-weight-bold text-white mb-1 text-center">
                    {{ getItemKey(item) ? $t(getItemKey(item)) : item.name }}
                  </h3>

                  <v-chip class="mb-3 opacity-70" color="cyan-accent-3" size="x-small" variant="tonal">
                    {{ $t(`inventory.categories.${item.cat}`) }}
                  </v-chip>

                  <p class="text-caption text-grey-lighten-1 text-center mb-4 description-text">
                    {{ getDescKey(item) ? $t(getDescKey(item)) : item.desc }}
                  </p>

                  <v-chip
                    v-if="isUsableBooster(item) && getBoosterGamesLeft(item) > 0"
                    class="mb-4 active-booster-chip"
                    color="green-accent-3"
                    size="x-small"
                    variant="tonal"
                  >
                    <v-icon size="12" start>mdi-check-circle-outline</v-icon>
                    {{ $t('inventory.active', { games: getBoosterGamesLeft(item) }) }}
                  </v-chip>
                </div>

                <v-spacer />

                <div class="action-buttons mt-4">
                  <v-btn
                    class="font-weight-bold flex-grow-1"
                    :color="getItemActionColor(item)"
                    :disabled="isItemActionDisabled(item)"
                    rounded="pill"
                    :variant="getItemActionVariant(item)"
                    @click="handleItemAction(item)"
                  >
                    {{ getItemActionLabel(item) }}
                  </v-btn>

                  <v-btn
                    v-if="canSell(item)"
                    class="ml-2 sell-btn"
                    color="amber-accent-2"
                    icon="mdi-currency-usd"
                    size="small"
                    :title="$t('inventory.sell')"
                    variant="tonal"
                    @click="confirmSell(item)"
                  />
                </div>
              </v-card>
            </v-col>
          </v-row>
          <v-row v-else align="center" justify="center" style="min-height: 300px;">
            <v-col class="text-center" cols="12">
              <div class="empty-state">
                <v-icon class="mb-4" color="grey-darken-3" size="80">mdi-package-variant</v-icon>
                <h3 class="text-h5 text-grey-darken-1">{{ $t('inventory.empty') }}</h3>
                <v-btn class="mt-4" color="cyan-accent-3" to="/shop" variant="text">
                  <v-icon start>mdi-cart-outline</v-icon>
                  {{ $t('inventory.goToShop') }}
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>

    <!-- Diálogo de Venta -->
    <v-dialog v-model="sellDialog" max-width="400">
      <v-card class="glass-card rounded-xl pa-4">
        <v-card-title class="text-h5 font-weight-bold text-white text-center">
          {{ $t('inventory.sell') }}
        </v-card-title>
        <v-card-text class="text-center text-grey-lighten-1 py-4">
          {{ $t('inventory.sellConfirm', { item: selectedItemName, price: selectedItemSellPrice }) }}
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-btn class="px-6 rounded-pill" color="grey" variant="text" @click="sellDialog = false">
            {{ $t('general.cancel') }}
          </v-btn>
          <v-btn class="px-6 rounded-pill text-black font-weight-bold" color="amber-accent-3" :loading="selling" variant="flat" @click="doSell">
            {{ $t('inventory.sell') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useAstroStore } from '@/stores/astroStore'
  import { API_BASE_URL } from '@/stores/astroShared'

  const { t } = useI18n()
  const astroStore = useAstroStore()
  const userCoins = computed(() => astroStore.coins)
  const animatedCoins = ref(userCoins.value)
  const coinChanges = ref([])
  let coinTimer = null

  watch(userCoins, (newVal, oldVal) => {
    const diff = newVal - oldVal
    if (diff !== 0) {
      animateValue(oldVal, newVal, 800)
      const id = Date.now()
      coinChanges.value.push({ id, amount: diff })
      setTimeout(() => {
        coinChanges.value = coinChanges.value.filter(c => c.id !== id)
      }, 2000)
    }
  })

  function animateValue(start, end, duration) {
    if (coinTimer) clearInterval(coinTimer)
    const range = end - start
    let current = start
    const increment = range / (duration / 16)
    const startTime = Date.now()
    
    coinTimer = setInterval(() => {
      const elapsed = Date.now() - startTime
      if (elapsed >= duration) {
        animatedCoins.value = end
        clearInterval(coinTimer)
      } else {
        current += increment
        animatedCoins.value = Math.floor(current)
      }
    }, 16)
  }

  const activeCategory = ref('all')
  const USABLE_BOOSTER_ITEM_IDS = Object.freeze([3, 4, 5])

  const categories = computed(() => [
    { id: 'all', name: t('inventory.categories.all'), icon: 'mdi-apps' },
    { id: 'skin', name: t('inventory.categories.skin'), icon: 'mdi-palette' },
    { id: 'pets', name: t('inventory.categories.pets'), icon: 'mdi-robot' },
    { id: 'collectible', name: t('inventory.categories.collectible'), icon: 'mdi-trophy' },
    { id: 'trails', name: t('inventory.categories.trails'), icon: 'mdi-creation' },
    { id: 'items', name: t('inventory.categories.items'), icon: 'mdi-flask-outline' },
  ])

  // Estado para la venta
  const sellDialog = ref(false)
  const selectedItem = ref(null)
  const selling = ref(false)

  const selectedItemName = computed(() => {
    if (!selectedItem.value) return ''
    const key = getItemKey(selectedItem.value)
    return key ? t(key) : selectedItem.value.name
  })

  const selectedItemSellPrice = computed(() => {
    if (!selectedItem.value) return 0
    const basePrice = selectedItem.value.price || 100
    return Math.floor(basePrice * 0.5)
  })

  const inventoryItems = computed(() => astroStore.inventory || [])

  const filteredItems = computed(() => {
    if (activeCategory.value === 'all') return inventoryItems.value
    return inventoryItems.value.filter(item => item.cat === activeCategory.value)
  })

  onMounted(async () => {
    if (astroStore.user) {
      await astroStore.fetchUserInventory()
    }
  })

  async function toggleEquip (item) {
    if (!isEquipable(item)) return
    const API_BASE = API_BASE_URL

    try {
      const response = await fetch(`${API_BASE}/api/inventory/toggle-equip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: astroStore.user,
          itemId: Number(item.id),
        }),
      })

      const data = await response.json()
      if (data.success) {
        astroStore.setInventory(data.inventory || [])
      }
    } catch (error) {
      console.error('Error al equipar item:', error)
    }
  }

  function isEquipable (item) {
    return item?.cat !== 'items'
  }

  function isUsableBooster (item) {
    return USABLE_BOOSTER_ITEM_IDS.includes(Number(item?.id))
  }

  function getBoosterGamesLeft (item) {
    const itemId = Number(item?.id)
    if (itemId === 3) return Number(astroStore.activeBoosters?.doubleCoinsGamesLeft) || 0
    if (itemId === 4) return Number(astroStore.activeBoosters?.doubleScoreGamesLeft) || 0
    if (itemId === 5) return Number(astroStore.activeBoosters?.sabotageGamesLeft) || 0
    return 0
  }

  function getItemActionLabel (item) {
    if (isUsableBooster(item)) return t('inventory.use')
    if (!isEquipable(item)) return t('inventory.unequipable')
    return item.equipped ? t('inventory.equipped') : t('inventory.equip')
  }

  function getItemActionColor (item) {
    if (isUsableBooster(item)) return 'amber-accent-3'
    if (!isEquipable(item)) return 'grey-darken-3'
    return item.equipped ? 'success' : 'cyan-accent-3'
  }

  function getItemActionVariant (item) {
    if (isUsableBooster(item)) return 'flat'
    if (!isEquipable(item)) return 'tonal'
    return item.equipped ? 'tonal' : 'flat'
  }

  function isItemActionDisabled (item) {
    if (isUsableBooster(item)) return Number(item?.quantity) <= 0
    return !isEquipable(item)
  }

  async function handleItemAction (item) {
    if (isUsableBooster(item)) {
      const result = await astroStore.useInventoryItem(item.id)
      if (!result.success) {
        alert(result.message || t('inventory.useError'))
      }
      return
    }
    await toggleEquip(item)
  }

  function canSell (item) {
    // No permitir vender items equipados
    return item.quantity > 0 && !item.equipped
  }

  function confirmSell (item) {
    selectedItem.value = item
    sellDialog.value = true
  }

  async function doSell () {
    if (!selectedItem.value) return

    selling.value = true
    try {
      const result = await astroStore.sellItem(selectedItem.value.id)
      if (result.success) {
        sellDialog.value = false
      } else {
        alert(result.message || t('general.error'))
      }
    } catch (error) {
      console.error('Error al vender item:', error)
    } finally {
      selling.value = false
    }
  }

  function getItemKey (item) {
    const idMap = {
      1: 'vidas',
      2: 'racha',
      3: 'dobleMonedas',
      4: 'doblePuntos',
      5: 'sabotageRay',
      6: 'nameChange',
      101: 'pin',
      102: 'cyberpunk',
      103: 'dron',
      104: 'neon',
      105: 'titleUnstoppable',
      106: 'titleLegend',
      107: 'titleDestroyer',
    }
    const key = idMap[item.id]
    return key ? `shopItems.${key}.name` : null
  }

  function getDescKey (item) {
    const idMap = {
      1: 'vidas',
      2: 'racha',
      3: 'dobleMonedas',
      4: 'doblePuntos',
      5: 'sabotageRay',
      6: 'nameChange',
      101: 'pin',
      102: 'cyberpunk',
      103: 'dron',
      104: 'neon',
    }
    if ([105, 106, 107].includes(Number(item.id))) return 'shopItems.titleDesc'
    const key = idMap[item.id]
    return key ? `shopItems.${key}.desc` : null
  }
</script>

<style scoped>
.scroll-container {
    height: 100vh;
    width: 100%;
    overflow-y: auto;
    background-color: #0b1120 !important;
    background-image: 
        radial-gradient(circle at 20% 30%, rgba(0, 229, 255, 0.05) 0%, transparent 40%),
        radial-gradient(circle at 80% 70%, rgba(41, 121, 255, 0.05) 0%, transparent 40%);
}

.tracking-wide {
    letter-spacing: 0.15em;
    background: linear-gradient(to right, #00e5ff, #2979ff);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.icon-glow {
    filter: drop-shadow(0 0 8px rgba(0, 229, 255, 0.5));
}

.glass-sidebar {
    background: rgba(255, 255, 255, 0.03) !important;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
}

.category-item {
    transition: all 0.3s ease;
    color: #94a3b8;
}

.category-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #f8fafc;
}

.active-cat {
    background: linear-gradient(90deg, rgba(0, 229, 255, 0.15), transparent) !important;
    color: #00e5ff !important;
    border-left: 3px solid #00e5ff;
}

.glass-card {
    background: rgba(255, 255, 255, 0.03) !important;
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
    position: relative;
    overflow: hidden;
}

.glass-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    background: linear-gradient(135deg, rgba(255,255,255,0.05), transparent);
    pointer-events: none;
}

.item-card:hover {
    transform: translateY(-8px);
    border-color: rgba(0, 229, 255, 0.3);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 229, 255, 0.1);
}

.avatar-glow {
    box-shadow: 0 0 30px rgba(0, 229, 255, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
}

.item-card:hover .avatar-glow {
    box-shadow: 0 0 40px rgba(0, 229, 255, 0.3);
    transform: scale(1.05);
}

.quantity-badge {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(0, 229, 255, 0.2);
    color: #00e5ff;
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: bold;
    border: 1px solid rgba(0, 229, 255, 0.3);
}

.description-text {
    line-height: 1.4;
    height: 3.2em;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.action-buttons {
    display: flex;
    width: 100%;
}

.sell-btn {
    opacity: 0.6;
    transition: all 0.3s ease;
}

.sell-btn:hover {
    opacity: 1;
    background: rgba(255, 193, 7, 0.2) !important;
    transform: rotate(15deg);
}

.active-booster-chip {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 0.7; }
    50% { opacity: 1; }
    100% { opacity: 0.7; }
}

.empty-state {
    padding: 60px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.02);
    border: 2px dashed rgba(255, 255, 255, 0.05);
}

.balance-pill-inventory {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 193, 7, 0.3);
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* Coin Animations */
.coin-change-popup {
    position: absolute;
    top: -20px;
    right: 0;
    font-size: 1.2rem;
    font-weight: 900;
    pointer-events: none;
    z-index: 10;
}

.coin-change-popup.plus {
    color: #ffeb3b;
    text-shadow: 0 0 15px rgba(255, 235, 59, 0.8);
}

.coin-change-popup.minus {
    color: #ff5252;
    text-shadow: 0 0 15px rgba(255, 82, 82, 0.8);
}

.float-coin-enter-active {
    animation: float-up-inventory 2s ease-out forwards;
}

@keyframes float-up-inventory {
    0% {
        transform: translateY(0) scale(1);
        opacity: 0;
    }
    20% {
        opacity: 1;
        transform: translateY(-10px) scale(1.2);
    }
    100% {
        transform: translateY(-50px) scale(0.8);
        opacity: 0;
    }
}
</style>
