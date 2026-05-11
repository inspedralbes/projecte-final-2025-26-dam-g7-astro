<template>
  <div class="scroll-container">
    <v-container class="pa-8" fluid>
      <!-- Header Section -->
      <div class="header mb-12 text-center">
        <div class="d-flex justify-center align-center mb-4">
          <v-icon class="mr-4" color="cyan-accent-2" icon="mdi-trophy-outline" size="48" />
          <h1 class="text-h2 font-weight-bold text-white tracking-wide">{{ $t('achievements.title') }}</h1>
          <v-icon class="ml-4" color="cyan-accent-2" icon="mdi-trophy-outline" size="48" />
        </div>
        <p class="text-h6 text-cyan-lighten-4 opacity-75">{{ $t('achievements.subtitle') }}</p>
      </div>

      <!-- Stats Overview -->
      <v-row v-if="!loading" class="mb-12 justify-center">
        <v-col cols="12" md="10">
          <v-card class="stats-card pa-6" variant="tonal">
            <v-row align="center">
              <v-col class="text-center" cols="12" sm="4">
                <div class="text-overline text-cyan-accent-1">{{ $t('achievements.completed') }}</div>
                <div class="text-h3 font-weight-black text-white">
                  {{ unlockedCount }}<span class="text-h5 text-grey">/{{ totalCount }}</span>
                </div>
                <v-progress-linear
                  class="mt-4 mx-auto"
                  color="cyan-accent-2"
                  height="8"
                  :model-value="completionPercentage"
                  rounded
                  style="max-width: 150px;"
                />
              </v-col>
              <v-col cols="12" sm="8">
                <v-row>
                  <v-col
                    v-for="type in ['bronze', 'silver', 'gold', 'platinum']"
                    :key="type"
                    class="text-center"
                    cols="6"
                    sm="3"
                  >
                    <div :class="['text-caption text-uppercase font-weight-bold mb-1', type + '-text']">
                      {{ $t('achievements.types.' + type) }}
                    </div>
                    <div class="text-h5 text-white">{{ countByType(type) }}</div>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>

      <v-alert
        v-if="loadError"
        class="mb-8"
        color="orange-lighten-1"
        type="warning"
        variant="tonal"
      >
        {{ loadError }}
      </v-alert>

      <div v-if="loading" class="d-flex justify-center align-center" style="height: 300px;">
        <div class="loading-scanner">
          <v-progress-circular color="cyan-accent-3" indeterminate size="80" width="8" />
          <div class="text-overline mt-4 text-cyan-accent-1">{{ $t('achievements.syncing') }}</div>
        </div>
      </div>

      <!-- Achievements Grid -->
      <v-row v-else class="mt-8 pb-16">
        <v-col
          v-for="achievement in processedAchievements"
          :key="achievement.id"
          class="d-flex justify-center"
          cols="12"
          lg="3"
          md="4"
          sm="6"
        >

          <v-card class="achievement-card" :class="{ 'card-locked': !achievement.unlocked }" variant="flat">
            <div class="medal-wrapper">
              <Medal :icon="achievement.icon" :locked="!achievement.unlocked" :type="achievement.type" />
            </div>

            <div class="achievement-info pa-4">
              <h3 :class="['text-h6 font-weight-bold mb-1', achievement.unlocked ? 'text-white' : 'text-grey-darken-1']">
                {{ $te('achievementsList.' + achievement.id + '.title') ? $t('achievementsList.' + achievement.id + '.title') : achievement.title }}
              </h3>
              <p class="achievement-description text-body-2 mb-4">
                {{ $te('achievementsList.' + achievement.id + '.desc') ? $t('achievementsList.' + achievement.id + '.desc') : achievement.description }}
              </p>

              <div class="progress-section">
                <div class="d-flex justify-space-between text-caption mb-1">
                  <span :class="achievement.unlocked ? 'text-cyan-accent-1' : 'text-grey'">
                    {{ $t('achievements.metrics.' + achievement.metric) }}
                  </span>
                  <span class="text-white">{{ achievement.progress }} / {{ achievement.goal }}</span>
                </div>
                <v-progress-linear
                  bg-color="rgba(255,255,255,0.05)"
                  :color="achievement.unlocked ? 'green-accent-3' : 'cyan-accent-2'"
                  height="6"
                  :model-value="achievement.progressPct"
                  rounded
                />
                <div class="mt-3 text-center">
                  <v-chip
                    v-if="achievement.unlocked"
                    class="text-uppercase font-weight-bold"
                    color="green-accent-3"
                    prepend-icon="mdi-check-decagram"
                    size="x-small"
                    variant="tonal"
                  >
                    {{ $t('achievements.unlocked') }}
                  </v-chip>
                  <v-chip
                    v-else
                    class="text-uppercase font-weight-bold"
                    color="blue-grey-lighten-2"
                    size="x-small"
                    variant="outlined"
                  >
                    {{ $t('achievements.locked') }}
                  </v-chip>
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import Medal from '@/components/achievements/Medal.vue'
  import { ACHIEVEMENTS as ACHIEVEMENT_DEFINITIONS } from '@/constants/achievements'
  import { useAstroStore } from '@/stores/astroStore'

  const { t, te } = useI18n()
  const astroStore = useAstroStore()
  const loading = ref(false)
  const loadError = ref(null)
  const readyToSync = ref(false)
  const syncingUnlocked = ref(false)

  const playerMetrics = computed(() => ({
    coins: Number(astroStore.coins) || 0,
    games: Number(astroStore.partides) || 0,
    inventory: Number(astroStore.inventoryUnits) || 0,
    level: Number(astroStore.level) || 1,
    xp: Number(astroStore.xp) || 0,
    missions: Number(astroStore.missionsCompleted) || 0,
  }))

  onMounted(async () => {
    loading.value = true
    try {
      const [statsResult, , achievementsResult] = await Promise.all([
        astroStore.fetchUserStats(),
        astroStore.fetchUserInventory(),
        astroStore.fetchUserAchievements(),
      ])

      loadError.value = statsResult?.success === false || achievementsResult?.success === false ? t('achievements.syncErrorAtlas') : null
    } catch (error) {
      console.error('Error de sincronización:', error)
      loadError.value = t('achievements.syncErrorBase')
    } finally {
      loading.value = false
      readyToSync.value = true
      void syncUnlockedAchievementsIfNeeded(unlockedAchievementIds.value)
    }
  })

  const processedAchievements = computed(() => {
    const unlockedFromDb = new Set(astroStore.unlockedAchievements || [])

    return ACHIEVEMENT_DEFINITIONS.map(achievement => {
      const currentValue = playerMetrics.value[achievement.metric] || 0
      const unlockedByProgress = currentValue >= achievement.goal
      const unlocked = unlockedByProgress || unlockedFromDb.has(achievement.id)
      const progress = Math.min(currentValue, achievement.goal)
      const progressPct = Math.round((progress / achievement.goal) * 100)

      return {
        ...achievement,
        unlocked,
        progress,
        progressPct,
      }
    })
  })

  const unlockedCount = computed(() => processedAchievements.value.filter(a => a.unlocked).length)
  const totalCount = computed(() => ACHIEVEMENT_DEFINITIONS.length)
  const completionPercentage = computed(() => (unlockedCount.value / totalCount.value) * 100)

  function countByType (type) {
    return processedAchievements.value.filter(a => a.type === type && a.unlocked).length
  }

  const unlockedAchievementIds = computed(() => {
    return processedAchievements.value
      .filter(achievement => achievement.unlocked)
      .map(achievement => achievement.id)
      .sort((a, b) => a - b)
  })

  function idsToKey (ids = []) {
    return ids.join(',')
  }

  async function syncUnlockedAchievementsIfNeeded (nextIds) {
    if (!readyToSync.value || syncingUnlocked.value || !astroStore.user) return

    const storedIds = [...(astroStore.unlockedAchievements || [])].sort((a, b) => a - b)
    if (idsToKey(nextIds) === idsToKey(storedIds)) return

    syncingUnlocked.value = true
    try {
      await astroStore.syncUnlockedAchievements(nextIds)
    } finally {
      syncingUnlocked.value = false
    }
  }

  watch(unlockedAchievementIds, nextIds => {
    void syncUnlockedAchievementsIfNeeded(nextIds)
  })
</script>

<style scoped>
.scroll-container {
    height: 100vh;
    width: 100%;
    overflow-y: auto;
    background: radial-gradient(circle at top center, #0a192f 0%, #020617 100%);
}

.tracking-wide {
    letter-spacing: 0.2em;
    background: linear-gradient(to right, #00e5ff, #2979ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.stats-card {
    background: rgba(10, 25, 47, 0.6) !important;
    border: 1px solid rgba(0, 229, 255, 0.2) !important;
    border-radius: 20px !important;
    backdrop-filter: blur(10px);
}

.bronze-text { color: #cd7f32; }
.silver-text { color: #bdc3c7; }
.gold-text { color: #fbc02d; }
.platinum-text { color: #00acc1; }

.achievement-card {
    width: 280px;
    background: rgba(30, 41, 59, 0.4) !important;
    border: 1px solid rgba(255, 255, 255, 0.05) !important;
    border-radius: 24px !important;
    overflow: visible !important;
    transition: all 0.3s ease;
    margin-top: 40px;
}

.achievement-card:hover {
    transform: translateY(-10px);
    background: rgba(30, 41, 59, 0.7) !important;
    border-color: rgba(0, 229, 255, 0.3) !important;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.card-locked {
    filter: saturate(0.5);
}

.medal-wrapper {
    margin-top: -60px;
    display: flex;
    justify-content: center;
}

.achievement-description {
    color: rgba(255, 255, 255, 0.5);
    height: 40px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.loading-scanner {
    text-align: center;
}
</style>
