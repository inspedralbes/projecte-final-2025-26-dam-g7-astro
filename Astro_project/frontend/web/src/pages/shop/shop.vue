<template>
  <div class="scroll-container space-background">
    <v-container class="pa-4 pa-md-6 content-wrapper" fluid>
      <v-row justify="center">

        <v-col class="text-center mt-2 mb-6" cols="12">
          <h1 class="text-h3 font-weight-bold text-uppercase text-cyan-accent-3 glow-text">
            {{ $t('store.title') }}
          </h1>
          <p class="text-subtitle-1 text-grey-lighten-1 mt-2">
            {{ $t('store.subtitle') }}
          </p>
        </v-col>

        <v-col class="mb-10 mx-auto" cols="12" md="6">
          <div
            class="px-8 py-6 rounded-xl balance-pill d-flex align-center justify-center text-center w-100 elevation-10"
            style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(0, 229, 255, 0.2);"
          >
            <div class="flex-grow-1">
              <span class="text-subtitle-1 text-grey-lighten-1 block text-uppercase mb-2">{{ $t('store.balance') }}</span>
              <div class="d-flex align-center justify-center position-relative">
                <span class="text-h2 font-weight-black text-amber-accent-3 mr-3" style="text-shadow: 0 0 25px rgba(255, 193, 7, 0.6);">{{ animatedCoins }}</span>
                <v-icon color="amber-accent-3" size="70">mdi-database</v-icon>
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
          </div>
        </v-col>

        <v-col cols="12" max-width="1200">
          <div class="d-flex align-center mb-6 px-2">
            <v-icon class="mr-3" color="cyan-accent-3">mdi-cube-outline</v-icon>
            <h3 class="text-h5 font-weight-bold text-white">{{ $t('store.suppliesTitle') }}</h3>
            <v-divider class="ml-4 border-cyan opacity-50" />
          </div>

          <v-row class="px-2 mb-10">
            <v-col v-for="item in basicItems" :key="item.id" cols="12" md="6">
              <v-card
                class="mx-auto item-card rounded-xl pa-4 d-flex align-center"
                color="#1e293b"
                height="100%"
              >
                <div class="d-flex align-center flex-grow-1 mr-4" style="min-width: 0;">
                  <v-avatar
                    class="mr-3 flex-shrink-0"
                    :color="item.bgColor || 'rgba(0, 229, 255, 0.1)'"
                    size="50"
                  >
                    <v-icon :color="item.color" size="24">{{ item.icon }}</v-icon>
                  </v-avatar>

                  <div class="text-truncate">
                    <div class="text-subtitle-1 font-weight-bold text-white text-truncate">{{
                      item.name }}</div>
                    <div
                      class="text-caption text-grey-lighten-2 text-truncate"
                      style="line-height: 1.2;"
                    >
                      {{ item.desc }}
                    </div>
                    <div class="text-caption text-cyan-accent-1 mt-1 font-weight-bold">
                      {{ $t('store.units', { qty: getItemQuantity(item.id) }) }} / 99
                    </div>
                    <div class="text-caption text-amber-accent-2 opacity-80">
                      {{ $t('store.dailyLimit') }}: {{ getDailyBoughtToday(item.id) }}/5
                    </div>
                  </div>
                </div>

                <div class="d-flex flex-column align-end ga-2" style="width: 150px; flex-shrink: 0;">
                  <!-- Selector de Cantidad para Suministros Básicos -->
                  <div v-if="!hasReachedMax(item.id)" class="d-flex align-center ga-2 mb-1">
                    <v-btn
                      class="qty-btn"
                      color="grey-darken-3"
                      density="compact"
                      size="small"
                      variant="tonal"
                      @click="decreaseQty(item.id)"
                    >
                      <v-icon color="white" size="small">mdi-minus</v-icon>
                    </v-btn>
                    <span class="text-body-2 font-weight-bold text-white" style="min-width: 20px; text-align: center;">
                      {{ selectedQuantities[item.id] || 1 }}
                    </span>
                    <v-btn
                      class="qty-btn"
                      color="grey-darken-3"
                      density="compact"
                      size="small"
                      variant="tonal"
                      @click="increaseQty(item.id)"
                    >
                      <v-icon color="white" size="small">mdi-plus</v-icon>
                    </v-btn>
                  </div>

                  <v-btn
                    block
                    class="font-weight-bold rounded-lg text-black"
                    :color="hasReachedMax(item.id) ? 'grey-darken-2' : (userCoins >= (item.price * (selectedQuantities[item.id] || 1)) ? 'amber-accent-3' : 'grey-darken-3')"
                    :disabled="userCoins < (item.price * (selectedQuantities[item.id] || 1)) || hasReachedMax(item.id)"
                    height="44"
                    :variant="hasReachedMax(item.id) ? 'outlined' : 'flat'"
                    @click="openConfirmDialog(item)"
                  >
                    <template v-if="hasReachedMax(item.id)">
                      {{ $t('store.max') }}
                    </template>
                    <template v-else>
                      {{ item.price * (selectedQuantities[item.id] || 1) }} <v-icon end size="x-small">mdi-database</v-icon>
                    </template>
                  </v-btn>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-col>

        <v-col class="pb-16" cols="12" max-width="1200">
          <div class="d-flex align-center mb-8 px-2">
            <v-icon class="mr-3" color="amber-accent-3">mdi-crown-outline</v-icon>
            <h3 class="text-h5 font-weight-bold text-white">{{ $t('store.eliteTitle') }}</h3>
            <v-divider class="ml-4 border-amber opacity-50" />
          </div>

          <v-row class="px-2">
            <v-col
              v-for="item in premiumItems"
              :key="item.id"
              cols="12"
              md="3"
              sm="6"
            >
              <v-card
                class="mx-auto item-card premium-card rounded-xl pt-6 pb-4"
                color="#1e293b"
                elevation="6"
                height="100%"
              >
                <div class="text-center mb-4">
                  <v-avatar
                    class="elevation-4"
                    :color="item.bgColor || 'rgba(255, 193, 7, 0.15)'"
                    size="80"
                  >
                    <v-img v-if="item.image" :src="`/${item.image}`" cover>
                      <template #error>
                        <v-icon :color="item.color" size="40">{{ item.icon }}</v-icon>
                      </template>
                    </v-img>
                    <v-icon v-else :color="item.color" size="40">{{ item.icon }}</v-icon>
                  </v-avatar>
                </div>
                <v-card-title class="text-subtitle-1 font-weight-bold text-center text-white pt-0">
                  {{ item.name }}
                </v-card-title>
                <div class="text-center text-caption text-grey mb-2">
                  {{ isOwned(item.id) ? $t('store.owned') : $t('store.available') }}
                </div>
                <v-card-actions class="justify-center px-4 pb-2">
                  <v-btn
                    block
                    class="font-weight-bold rounded-lg text-black"
                    :color="isOwned(item.id) ? 'success' : (userCoins >= item.price ? 'amber-accent-3' : 'grey')"
                    :disabled="(userCoins < item.price && !isOwned(item.id)) || isOwned(item.id)"
                    height="40"
                    :variant="isOwned(item.id) ? 'tonal' : (userCoins >= item.price ? 'flat' : 'outlined')"
                    @click="openConfirmDialog(item)"
                  >
                    <template v-if="isOwned(item.id)">
                      {{ $t('store.owned') }} <v-icon end>mdi-check</v-icon>
                    </template>
                    <template v-else>
                      {{ item.price }} <v-icon end size="small">mdi-database</v-icon>
                    </template>
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <!-- Diálogo de Confirmación de Compra -->
      <v-dialog v-model="showConfirmDialog" max-width="400" persistent>
        <v-card class="rounded-xl pa-6 confirm-dialog-card" color="#0f172a">
          <div class="text-center mb-6">
            <v-avatar :color="pendingItem?.bgColor" size="80">
              <v-img v-if="pendingItem?.image" :src="`/${pendingItem?.image}`" cover />
              <v-icon v-else :color="pendingItem?.color" size="40">{{ pendingItem?.icon }}</v-icon>
            </v-avatar>
            <h2 class="text-h5 font-weight-bold text-white mt-4">{{ $t('shopActions.confirmTitle') }}</h2>
            <p class="text-body-2 text-grey-lighten-1 mt-2">
              ¿Quieres comprar <span class="text-cyan-accent-3 font-weight-black">{{ pendingQuantity }}x</span> 
              {{ pendingItem?.name }} por <span class="text-amber-accent-3 font-weight-black">{{ pendingItem?.price * pendingQuantity }} créditos</span>?
            </p>
          </div>
          <v-row dense>
            <v-col cols="6">
              <v-btn block class="rounded-lg" color="grey-darken-3" variant="flat" @click="showConfirmDialog = false">
                {{ $t('general.cancel') }}
              </v-btn>
            </v-col>
            <v-col cols="6">
              <v-btn 
                block 
                class="rounded-lg font-weight-bold" 
                color="cyan-accent-3" 
                :loading="isBuying" 
                variant="flat"
                @click="confirmPurchase"
              >
                {{ $t('general.confirm') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-dialog>

      <!-- Diálogo de Éxito de Compra -->
      <v-dialog v-model="showSuccessDialog" max-width="450">
        <v-card class="rounded-xl pa-8 text-center success-dialog-card overflow-visible" color="#020617">
          <div class="success-glow" />
          
          <div class="unlock-animation-wrapper mb-6">
            <v-avatar class="elevation-12 main-icon-bounce" :color="purchasedItem?.bgColor" size="120">
              <v-img v-if="purchasedItem?.image" :src="`/${purchasedItem.image}`" cover />
              <v-icon v-else :color="purchasedItem?.color" size="60">{{ purchasedItem?.icon }}</v-icon>
            </v-avatar>
            <div class="sparkles">
              <span v-for="i in 8" :key="i" :class="`sparkle s${i}`">✦</span>
            </div>
          </div>

          <h2 class="text-h4 font-weight-black text-white mb-2 text-uppercase">
            {{ $t('shopActions.buySuccessTitle') }}
          </h2>
          <p class="text-body-1 text-grey-lighten-1 mb-8">
            Has adquirido <span class="text-cyan-accent-3 font-weight-bold">{{ purchasedQuantity }}x</span> {{ purchasedItem?.name }}.
            <br>
            <span class="text-caption text-grey mt-2 block">Puedes utilizarlo desde tu inventario.</span>
          </p>

          <v-row class="ga-3" no-gutters>
            <v-btn 
              block 
              class="rounded-xl font-weight-black mb-3" 
              color="cyan-accent-3" 
              size="large" 
              @click="goToInventory"
            >
              {{ $t('store.goToInventory') }}
            </v-btn>
            <v-btn 
              block 
              class="rounded-xl font-weight-bold text-grey-lighten-1" 
              color="white" 
              size="large" 
              variant="outlined" 
              @click="showSuccessDialog = false"
            >
              {{ $t('store.keepBuying') }}
            </v-btn>
          </v-row>
        </v-card>
      </v-dialog>

    </v-container>
  </div>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { useAstroStore } from '@/stores/astroStore'

  const { t } = useI18n()
  const router = useRouter()
  const astroStore = useAstroStore()
  const userCoins = computed(() => astroStore.coins)
  const animatedCoins = ref(userCoins.value)
  const coinChanges = ref([])
  let coinTimer = null

  // Nuevos estados para diálogos y cantidades
  const selectedQuantities = ref({})
  const showConfirmDialog = ref(false)
  const showSuccessDialog = ref(false)
  const pendingItem = ref(null)
  const pendingQuantity = ref(1)
  const purchasedItem = ref(null)
  const purchasedQuantity = ref(1)
  const isBuying = ref(false)

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

  function getItemQuantity (itemId) {
    const targetId = Number(itemId)
    const found = astroStore.inventory?.find(item => Number(item.id) === targetId)
    return Number(found?.quantity) || 0
  }

  function getDailyBoughtToday (itemId) {
    return astroStore.dailyPurchaseHistory?.items?.[itemId] || 0
  }

  function getRemainingDailyLimit (itemId) {
    const id = Number(itemId)
    if (id >= 1 && id <= 6) {
      const bought = getDailyBoughtToday(itemId)
      return Math.max(0, 5 - bought)
    }
    return 1 // Elite: 1 unidad máximo (ya se controla con isOwned)
  }

  function getMaxInventoryQuantity (itemId) {
    const id = Number(itemId)
    if (id >= 1 && id <= 6) return 99
    return 1
  }

  function getMaxPurchasableNow (itemId) {
    const remainingDaily = getRemainingDailyLimit(itemId)
    const currentInInv = getItemQuantity(itemId)
    const maxInv = getMaxInventoryQuantity(itemId)
    const remainingInv = Math.max(0, maxInv - currentInInv)
    
    return Math.min(remainingDaily, remainingInv)
  }

  function isOwned (itemId) {
    return getItemQuantity(itemId) > 0
  }

  function hasReachedMax (itemId) {
    const id = Number(itemId)
    // Para elite, "max reached" es si ya lo tiene
    if (id >= 101) return isOwned(id)
    // Para básicos, "max reached" es si no le queda cupo diario O si tiene 99 en inv
    return getRemainingDailyLimit(id) <= 0 || getItemQuantity(id) >= 99
  }

  function increaseQty (itemId) {
    const maxNow = getMaxPurchasableNow(itemId)
    const selected = selectedQuantities.value[itemId] || 1
    if (selected < maxNow) {
      selectedQuantities.value[itemId] = selected + 1
    }
  }

  function decreaseQty (itemId) {
    const selected = selectedQuantities.value[itemId] || 1
    if (selected > 1) {
      selectedQuantities.value[itemId] = selected - 1
    }
  }

  function openConfirmDialog (item) {
    pendingItem.value = item
    pendingQuantity.value = selectedQuantities.value[item.id] || 1
    showConfirmDialog.value = true
  }

  async function confirmPurchase () {
    if (!pendingItem.value) return
    isBuying.value = true
    try {
      const result = await astroStore.buyItem(pendingItem.value, pendingQuantity.value)
      if (result.success) {
        purchasedItem.value = pendingItem.value
        purchasedQuantity.value = pendingQuantity.value
        showConfirmDialog.value = false
        showSuccessDialog.value = true
        // Limpiar cantidad seleccionada
        selectedQuantities.value[pendingItem.value.id] = 1
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('Error en la tienda:', error)
    } finally {
      isBuying.value = false
    }
  }

  function goToInventory () {
    showSuccessDialog.value = false
    router.push('/inventory')
  }

  const basicItems = computed(() => [
    { id: 1, name: t('shopItems.vidas.name'), cat: 'items', price: 200, icon: 'mdi-heart-multiple', color: 'red-accent-2', desc: t('shopItems.vidas.desc'), bgColor: 'rgba(255, 82, 82, 0.1)' },
    { id: 2, name: t('shopItems.racha.name'), cat: 'items', price: 500, icon: 'mdi-snowflake', color: 'cyan-accent-2', desc: t('shopItems.racha.desc'), bgColor: 'rgba(24, 255, 255, 0.1)' },
    { id: 3, name: t('shopItems.dobleMonedas.name'), cat: 'items', price: 300, icon: 'mdi-piggy-bank', color: 'yellow-accent-3', desc: t('shopItems.dobleMonedas.desc'), limitacio: t('shopItems.limit3'), bgColor: 'rgba(255, 213, 79, 0.1)' },
    { id: 4, name: t('shopItems.doblePuntos.name'), cat: 'items', price: 300, icon: 'mdi-star-shooting', color: 'orange-accent-3', desc: t('shopItems.doblePuntos.desc'), limitacio: t('shopItems.limit3'), bgColor: 'rgba(255, 152, 0, 0.1)' },
    { id: 5, name: t('shopItems.sabotageRay.name'), cat: 'items', price: 500, icon: 'mdi-lightning-bolt', color: 'deep-purple-accent-2', desc: t('shopItems.sabotageRay.desc'), limitacio: t('shopItems.sabotageRay.limit'), bgColor: 'rgba(124, 77, 255, 0.1)' },
    { id: 6, name: t('shopItems.nameChange.name'), cat: 'items', price: 10_000, icon: 'mdi-account-edit', color: 'green-accent-2', desc: t('shopItems.nameChange.desc'), bgColor: 'rgba(0, 255, 136, 0.1)' },
  ])

  const premiumItems = computed(() => [
    { id: 101, name: t('shopItems.pin.name'), cat: 'skin', price: 2500, icon: 'mdi-medal', color: 'amber-accent-3', desc: t('shopItems.pin.desc'), bgColor: 'rgba(255, 193, 7, 0.15)' },
    { id: 102, name: t('shopItems.avatarHacker.name'), cat: 'skin', price: 5000, icon: 'mdi-robot-vacuum-variant', color: 'purple-accent-3', desc: t('shopItems.avatarHacker.desc'), image: 'avatar_hacker.png', bgColor: 'rgba(224, 64, 251, 0.15)' },
    { id: 202, name: t('shopItems.avatarNebula.name'), cat: 'skin', price: 7500, icon: 'mdi-rocket-launch', color: 'cyan-accent-3', desc: t('shopItems.avatarNebula.desc'), image: 'avatar_nebula.png', bgColor: 'rgba(0, 229, 255, 0.15)' },
    { id: 203, name: t('shopItems.avatarKnight.name'), cat: 'skin', price: 8000, icon: 'mdi-shield-sun', color: 'amber-accent-4', desc: t('shopItems.avatarKnight.desc'), image: 'avatar_knight.png', bgColor: 'rgba(255, 160, 0, 0.15)' },
    { id: 104, name: t('shopItems.neon.name'), cat: 'trails', price: 1500, icon: 'mdi-creation', color: 'pink-accent-3', desc: t('shopItems.neon.desc'), bgColor: 'rgba(255, 64, 129, 0.15)' },
    { id: 105, name: t('shopItems.titleUnstoppable.name'), cat: 'title', price: 1000, icon: 'mdi-format-title', color: 'red-accent-3', desc: t('shopItems.titleUnstoppable.desc'), bgColor: 'rgba(255, 82, 82, 0.15)' },
    { id: 106, name: t('shopItems.titleLegend.name'), cat: 'title', price: 1000, icon: 'mdi-format-title', color: 'cyan-accent-3', desc: t('shopItems.titleLegend.desc'), bgColor: 'rgba(0, 229, 255, 0.15)' },
    { id: 107, name: t('shopItems.titleDestroyer.name'), cat: 'title', price: 1000, icon: 'mdi-format-title', color: 'amber-accent-3', desc: t('shopItems.titleDestroyer.desc'), bgColor: 'rgba(255, 193, 7, 0.15)' },
  ])

  onMounted(async () => {
    if (astroStore.user) {
      await Promise.all([astroStore.fetchUserBalance(), astroStore.fetchUserInventory()])
    }
  })
</script>

<style scoped>
.scroll-container {
    height: 100vh;
    width: 100%;
    overflow-y: auto;
    background-color: #0b1120 !important;
}

.item-card {
    background-color: #1e293b !important;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.2s ease;
}

.item-card:hover {
    transform: translateY(-5px);
    border-color: #00e5ff;
    box-shadow: 0 10px 30px rgba(0, 229, 255, 0.15) !important;
}

.premium-card:hover {
    border-color: #ffc107;
    box-shadow: 0 10px 30px rgba(255, 193, 7, 0.2) !important;
}

.glow-text {
    text-shadow: 0 0 20px rgba(0, 229, 255, 0.4);
}

.balance-pill {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.border-cyan {
    border-color: #00e5ff !important;
}

.border-amber {
    border-color: #ffc107 !important;
}

/* Coin Animations */
.coin-change-popup {
    position: absolute;
    top: -30px;
    right: 20%;
    font-size: 1.5rem;
    font-weight: 900;
    pointer-events: none;
    z-index: 10;
}

.coin-change-popup.plus {
    color: #ffeb3b;
    text-shadow: 0 0 20px rgba(255, 235, 59, 0.8);
}

.coin-change-popup.minus {
    color: #ff5252;
    text-shadow: 0 0 20px rgba(255, 82, 82, 0.8);
}

.float-coin-enter-active {
    animation: float-up 2s ease-out forwards;
}

@keyframes float-up {
    0% {
        transform: translateY(0) scale(1);
        opacity: 0;
    }
    20% {
        opacity: 1;
        transform: translateY(-20px) scale(1.3);
    }
    100% {
        transform: translateY(-80px) scale(0.8);
        opacity: 0;
    }
}

/* Botones de cantidad */
.qty-btn {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.qty-btn:active {
    transform: scale(0.85) !important;
    opacity: 0.7;
}

/* Dialog Styles */
.confirm-dialog-card {
    border: 1px solid rgba(0, 229, 255, 0.2);
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.8);
}

.success-dialog-card {
    border: 2px solid #00e5ff;
    box-shadow: 0 0 50px rgba(0, 229, 255, 0.3);
    position: relative;
}

.success-glow {
    position: absolute;
    top: -50px;
    left: 50%;
    transform: translateX(-50%);
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(0, 229, 255, 0.2) 0%, transparent 70%);
    z-index: -1;
}

.unlock-animation-wrapper {
    position: relative;
    display: inline-block;
}

.main-icon-bounce {
    animation: bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes bounce-in {
    0% { transform: scale(0); }
    100% { transform: scale(1); }
}

.sparkles {
    position: absolute;
    inset: -20px;
    pointer-events: none;
}

.sparkle {
    position: absolute;
    color: #00e5ff;
    font-size: 20px;
    opacity: 0;
    animation: sparkle-fade 1.5s infinite;
}

.s1 { top: 10%; left: 10%; animation-delay: 0.1s; }
.s2 { top: 20%; right: 10%; animation-delay: 0.3s; }
.s3 { bottom: 20%; left: 15%; animation-delay: 0.5s; }
.s4 { bottom: 10%; right: 15%; animation-delay: 0.7s; }
.s5 { top: 50%; left: -10%; animation-delay: 0.2s; }
.s6 { top: 50%; right: -10%; animation-delay: 0.4s; }
.s7 { top: -10%; left: 50%; animation-delay: 0.6s; }
.s8 { bottom: -10%; left: 50%; animation-delay: 0.8s; }

@keyframes sparkle-fade {
    0%, 100% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1.2) rotate(15deg); opacity: 1; }
}

.block {
    display: block;
}
</style>
