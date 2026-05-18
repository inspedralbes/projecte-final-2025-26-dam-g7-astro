<template>
  <v-container class="profile-container pa-0" fluid>
    <div class="profile-layout-wrapper py-8 px-4 px-md-8">
      <v-row justify="center">
        <!-- COLUMNA PERFIL -->
        <v-col cols="12" lg="8" md="10">
          <v-card
            class="profile-card elevation-24"
            height="100%"
            :style="{ background: 'rgba(10, 12, 16, 0.95)' }"
          >
            <!-- BANNER SUPERIOR -->
            <div class="banner-section">
              <v-img class="banner-image" cover height="200" src="/fondo3.jpg">
                <template #placeholder>
                  <div class="d-flex align-center justify-center fill-height">
                    <v-progress-circular color="cyan-accent-3" indeterminate />
                  </div>
                </template>
                <div class="banner-overlay" />
              </v-img>
            </div>

            <!-- CABECERA: AVATAR Y DATOS BÁSICOS -->
            <div class="profile-header px-6 px-md-10">
              <div class="avatar-container">
                <div class="main-avatar-wrapper">
                  <v-avatar class="avatar-circle" size="160">
                    <v-img alt="Avatar" cover :src="`/${avatar}`" />
                  </v-avatar>
                  <v-btn
                    class="edit-avatar-btn"
                    color="cyan-accent-3"
                    elevation="8"
                    icon="mdi-camera-outline"
                    size="small"
                    @click="avatarDialog = true"
                  />
                </div>
              </div>

              <div class="user-meta mt-4">
                <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4">
                  <div class="flex-grow-1">
                    <h1 class="user-name text-h3 font-weight-black text-white capitalize mb-2 d-flex align-center">
                      {{ displayName || user || $t('profile.guest') }}
                      <v-btn
                        class="ml-1 name-edit-btn"
                        color="grey-lighten-1"
                        icon="mdi-pencil-outline"
                        size="x-small"
                        :title="$t('profile.changeDisplayName')"
                        variant="text"
                        @click="openNameChangeDialog"
                      />
                    </h1>
                    <div class="d-flex flex-wrap align-center ga-3">
                      <v-chip
                        :class="['rank-chip font-weight-black', getRankClass(level)]"
                        size="small"
                        style="cursor: pointer;"
                        variant="flat"
                        @click="titleDialog = true"
                      >
                        {{ formattedTitle }}
                      </v-chip>
                      <div class="d-flex align-center ga-3 text-grey-lighten-1">
                        <span class="text-overline">{{ $t('profile.level', { level: level || 1 }) }}</span>
                        <v-divider class="mx-1 my-1 border-opacity-25" color="white" vertical />
                        <div class="status-indicator d-flex align-center ga-2">
                          <div class="status-dot online" />
                          <span class="text-caption font-weight-bold">{{ $t('profile.online') }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="d-flex align-center ga-2 history-actions">
                    <v-btn
                      class="history-toggle-btn px-6"
                      color="cyan-accent-4"
                      prepend-icon="mdi-history"
                      rounded="lg"
                      variant="tonal"
                      @click="historyDialog = !historyDialog"
                    >
                      {{ historyDialog ? $t('profile.closeHistory') : $t('profile.openHistory') }}
                    </v-btn>
                    <v-btn
                      :aria-label="$t('profile.settings')"
                      class="settings-btn"
                      color="cyan-accent-4"
                      icon="mdi-cog"
                      rounded="lg"
                      :title="$t('profile.settings')"
                      variant="tonal"
                      @click="openSettingsDialog"
                    />
                  </div>
                </div>

                <!-- Barra de Progreso XP -->
                <div class="xp-progress-wrapper mt-6">
                  <div class="d-flex justify-space-between align-center mb-1 px-1">
                    <span class="text-caption font-weight-bold text-cyan-accent-3">{{ $t('profile.missionProgress') }}</span>
                    <span class="text-caption font-weight-black text-white">{{ $t('profile.xpProgress', { xp, req: xpRequired }) }}</span>
                  </div>
                  <v-progress-linear
                    bg-color="rgba(255,255,255,0.05)"
                    bg-opacity="1"
                    class="xp-bar shadow-cyan"
                    color="cyan-accent-3"
                    height="10"
                    :model-value="(xp / xpRequired) * 100"
                    rounded
                  />
                </div>
              </div>

              <v-divider class="my-8 border-opacity-10" />

              <!-- ESTADÍSTICAS RÁPIDAS -->
              <div class="stats-grid mb-10">
                <div class="stat-item">
                  <span class="stat-label">{{ $t('profile.planLabel') }}</span>
                  <span class="stat-value text-cyan-accent-2">{{ translatedPlan }}</span>
                </div>
                <div class="stat-item text-center">
                  <span class="stat-label">{{ $t('profile.missionLabel') }}</span>
                  <span class="stat-value text-amber-accent-2">{{ currentMissionName }}</span>
                </div>
                <div class="stat-item text-right">
                  <span class="stat-label">{{ $t('profile.systemLabel') }}</span>
                  <span class="stat-value">{{ $t('profile.systemValue') }}</span>
                </div>
              </div>

              <!-- SECCIÓN DE LOGROS -->
              <div class="achievements-section mb-10">
                <div class="section-header d-flex align-center justify-space-between mb-4">
                  <h3 class="text-overline font-weight-black text-grey-lighten-2">{{ $t('profile.featuredAchievements') }}</h3>
                </div>
                <v-row dense>
                  <v-col v-for="i in 3" :key="i" cols="4">
                    <div class="achievement-slot" @click="openSelection(i - 1)">
                      <div v-if="getAchievement(selectedAchievements[i - 1])" class="slot-glow" />
                      <Medal
                        v-if="getAchievement(selectedAchievements[i - 1])"
                        :icon="getAchievement(selectedAchievements[i - 1]).icon"
                        :icon-size="52"
                        :scale="0.7"
                        :type="getAchievement(selectedAchievements[i - 1]).type"
                      />
                      <div v-else class="empty-slot">
                        <v-icon color="rgba(255,255,255,0.1)" icon="mdi-plus" size="32" />
                      </div>
                    </div>
                  </v-col>
                </v-row>
              </div>

              <!-- ACCIONES -->
              <div class="actions-container ga-3 mb-10">
                <v-row dense>
                  <v-col v-if="canAccessEducational" cols="12">
                    <v-btn
                      block
                      class="action-btn font-weight-black mb-2"
                      color="cyan-accent-4"
                      height="56"
                      rounded="lg"
                      to="/educational"
                      variant="flat"
                    >
                      <v-icon class="mr-2" icon="mdi-shield-account" start />
                      {{ $t('profile.eduManagement') }}
                    </v-btn>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-btn
                      block
                      class="action-btn font-weight-black"
                      color="grey-darken-4"
                      height="56"
                      rounded="lg"
                      variant="flat"
                      @click="goToInventory"
                    >
                      <v-icon class="mr-2" icon="mdi-cube-outline" start />
                      {{ $t('profile.inventoryBtn') }}
                    </v-btn>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-btn
                      block
                      class="action-btn font-weight-black"
                      color="grey-darken-4"
                      height="56"
                      rounded="lg"
                      variant="flat"
                      @click="changePlan"
                    >
                      <v-icon class="mr-2" icon="mdi-rocket-launch-outline" start />
                      {{ $t('profile.changePlanBtn') }}
                    </v-btn>
                  </v-col>
                </v-row>
                <v-btn
                  block
                  class="logout-btn font-weight-black mt-4"
                  color="red-darken-4"
                  height="56"
                  rounded="lg"
                  variant="tonal"
                  @click="showLogoutDialog = true"
                >
                  {{ $t('profile.logoutBtn') }}
                </v-btn>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- DIÁLOGO DE HISTORIAL -->
    <v-dialog v-model="historyDialog" max-width="850" transition="fade-transition">
      <v-card class="history-popup-card">
        <div class="history-popup-header pa-4 d-flex align-center justify-space-between">
          <div>
            <h2 class="text-h5 font-weight-black text-white mb-0">{{ $t('profile.flightHistory') }}</h2>
            <p class="text-caption text-cyan-accent-2 mb-0">{{ $t('profile.flightHistorySub') }}</p>
          </div>
          <v-btn
            color="white"
            icon="mdi-close"
            size="small"
            variant="text"
            @click="historyDialog = false"
          />
        </div>

        <v-divider class="border-opacity-10" />

        <div class="history-popup-content pa-5">
          <v-row>
            <!-- TOP MISIONES -->
            <v-col class="pr-md-6 border-right-sep" cols="12" md="6">
              <h4 class="text-overline text-amber-accent-3 font-weight-black mb-6 d-flex align-center">
                <v-icon class="mr-2" size="20">mdi-star</v-icon> {{ $t('profile.personalRecords') }}
              </h4>
               <div v-if="topGames.length > 0" class="top-games-list-popup ga-3 d-flex flex-column">
                <div v-for="(match, idx) in topGames" :key="`top-${idx}`" class="top-game-card-popup">
                  <div class="rank-num">{{ idx + 1 }}</div>
                   <div class="game-info flex-grow-1">
                    <div class="game-name font-weight-bold">{{ $te('games.' + match.game) ? $t('games.' + match.game) : match.game }}</div>
                    <div class="game-date text-caption text-grey">{{ new Date(match.createdAt).toLocaleDateString() }}</div>
                  </div>
                  <div class="game-score-small-popup font-weight-black text-amber-accent-3">{{ match.score }}</div>
                </div>
              </div>
              <div v-else class="empty-state-popup">
                <v-icon class="mb-2" color="grey-darken-3" icon="mdi-trophy-outline" size="48" />
                <span class="text-caption">{{ $t('profile.noEliteRecords') }}</span>
              </div>
            </v-col>

            <!-- RECIENTES -->
            <v-col class="pl-md-6" cols="12" md="6">
              <div class="d-flex justify-space-between align-center mb-6">
                <h4 class="text-overline text-cyan-accent-3 font-weight-black d-flex align-center mb-0">
                  <v-icon class="mr-2" size="20">mdi-history</v-icon> {{ $t('profile.recentIncursions') }}
                </h4>
                <div class="d-flex ga-1">
                  <v-btn
                    :color="historyFilter === 'all' ? 'cyan-accent-3' : 'grey-lighten-1'"
                    density="compact"
                    size="small"
                    :variant="historyFilter === 'all' ? 'flat' : 'text'"
                    @click="historyFilter = 'all'; currentPage = 1"
                  >
                    {{ $t('general.all') || 'ALL' }}
                  </v-btn>
                  <v-btn
                    :color="historyFilter === 'single' ? 'cyan-accent-3' : 'grey-lighten-1'"
                    density="compact"
                    size="small"
                    :variant="historyFilter === 'single' ? 'flat' : 'text'"
                    @click="historyFilter = 'single'; currentPage = 1"
                  >
                    {{ $t('profile.singleplayer') || 'SOLO' }}
                  </v-btn>
                  <v-btn
                    :color="historyFilter === 'multi' ? 'cyan-accent-3' : 'grey-lighten-1'"
                    density="compact"
                    size="small"
                    :variant="historyFilter === 'multi' ? 'flat' : 'text'"
                    @click="historyFilter = 'multi'; currentPage = 1"
                  >
                    {{ $t('profile.multiplayer') || 'MULTI' }}
                  </v-btn>
                </div>
              </div>
              <div v-if="filteredHistory.length > 0" class="recent-list-popup ga-3 d-flex flex-column">
                <div v-for="(match, idx) in paginatedHistory" :key="`hist-${idx}`" class="recent-item-popup">
                  <div class="recent-icon-popup">
                    <v-icon :color="match.game === 'Multijugador' ? 'amber-accent-2' : 'cyan-accent-2'" size="18">
                      {{ match.game === 'Multijugador' ? 'mdi-account-group' : 'mdi-sword-cross' }}
                    </v-icon>
                  </div>
                  <div class="game-info flex-grow-1">
                    <div class="d-flex align-center">
                      <span class="game-name font-weight-bold">{{ $te('games.' + match.game) ? $t('games.' + match.game) : match.game }}</span>
                      <v-chip
                        v-if="match.game === 'Multijugador'"
                        class="ml-2"
                        color="amber-accent-2"
                        density="comfortable"
                        size="x-small"
                        variant="tonal"
                      >
                        MP
                      </v-chip>
                    </div>
                    <div class="d-flex align-center text-caption text-grey">
                      <span>{{ new Date(match.createdAt).toLocaleDateString() }}</span>
                      <span v-if="match.timeSeconds" class="ml-2">• {{ match.timeSeconds }}s</span>
                    </div>
                  </div>
                  <div class="game-score-small-popup font-weight-black text-white">{{ match.score }}</div>
                </div>
              </div>

              <!-- Paginación Mejorada -->
              <div v-if="filteredHistory.length > pageSize" class="d-flex align-center justify-center ga-6 mt-8">
                <v-btn
                  color="cyan-accent-3"
                  density="comfortable"
                  :disabled="currentPage === 1"
                  icon="mdi-chevron-left"
                  variant="tonal"
                  @click="currentPage--"
                />
                <div class="text-center">
                  <span class="text-h6 font-weight-black text-white">{{ currentPage }}</span>
                  <span class="text-caption text-grey ml-1">/ {{ totalPages }}</span>
                </div>
                <v-btn
                  color="cyan-accent-3"
                  density="comfortable"
                  :disabled="currentPage >= totalPages"
                  icon="mdi-chevron-right"
                  variant="tonal"
                  @click="currentPage++"
                />
              </div>

              <div v-if="filteredHistory.length === 0" class="empty-state-popup">
                <span class="text-caption">{{ $t('profile.noRecent') }}</span>
              </div>
            </v-col>
          </v-row>
        </div>
      </v-card>
    </v-dialog>

    <!-- Diálogo Selección Logros -->
    <v-dialog v-model="selectionDialog" max-width="500">
      <v-card class="glass-popup pa-4">
        <v-card-title class="text-white font-weight-bold d-flex justify-space-between align-center">
          {{ $t('profile.selectAchievement') }}
          <v-btn color="white" icon="mdi-close" variant="text" @click="selectionDialog = false" />
        </v-card-title>
        <v-card-text>
          <v-list bg-color="transparent" class="text-white">
            <v-list-item
              v-for="achievement in allAchievements"
              :key="achievement.id"
              class="mb-2 achievement-list-item"
              :class="{
                'selected': isSelected(achievement.id),
                'locked-item': !achievement.unlocked
              }"
              :disabled="!achievement.unlocked"
              :subtitle="$te('achievementsList.' + achievement.id + '.desc') ? $t('achievementsList.' + achievement.id + '.desc') : achievement.description"
              :title="$te('achievementsList.' + achievement.id + '.title') ? $t('achievementsList.' + achievement.id + '.title') : achievement.title"
              @click="achievement.unlocked ? selectAchievement(achievement.id) : null"
            >
              <template #prepend>
                <div
                  class="mr-4 d-flex align-center justify-center"
                  style="width: 60px; height: 60px; overflow: hidden;"
                >
                  <Medal
                    :icon="achievement.icon"
                    :icon-size="48"
                    :locked="!achievement.unlocked"
                    :scale="0.3"
                    :type="achievement.type"
                  />
                </div>
              </template>
            </v-list-item>
            <v-divider class="my-2 border-opacity-20" />
            <v-list-item
              class="text-error"
              prepend-icon="mdi-delete-outline"
              :title="$t('profile.removeAchievement')"
              @click="selectAchievement(null)"
            />
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Diálogo Avatar -->
    <v-dialog v-model="avatarDialog" max-width="500">
      <v-card class="glass-popup pa-4">
        <v-card-title class="text-white font-weight-bold d-flex justify-space-between align-center">
          {{ $t('profile.astronautSuit') }}
          <v-btn color="white" icon="mdi-close" variant="text" @click="avatarDialog = false" />
        </v-card-title>
        <v-card-text>
          <v-row class="mt-2 text-center">
            <v-col
              v-for="opt in avatarOptions"
              :key="opt.file"
              class="pa-2"
              cols="4"
              sm="3"
            >
              <v-avatar
                class="avatar-option"
                :class="{ 'active-avatar': avatar === opt.file }"
                size="70"
                @click="selectAvatar(opt.file)"
              >
                <v-img :src="`/${opt.file}`" />
              </v-avatar>
              <div class="text-caption text-grey-lighten-1 mt-2 font-weight-bold">{{ opt.label }}</div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Diálogo Título -->
    <v-dialog v-model="titleDialog" max-width="500">
      <v-card class="glass-popup pa-4">
        <v-card-title class="text-white font-weight-bold d-flex justify-space-between align-center">
          {{ $t('profile.selectTitle') }}
          <v-btn color="white" icon="mdi-close" variant="text" @click="titleDialog = false" />
        </v-card-title>
        <v-card-text>
          <v-list bg-color="transparent" class="text-white">
            <v-list-item
              class="mb-2 achievement-list-item"
              :class="{ 'selected': !selectedTitle }"
              :subtitle="$t('profile.rankBasedOnLevel')"
              :title="$t('profile.defaultTitle')"
              @click="selectTitle(null)"
            >
              <template #prepend>
                <v-icon class="mr-3" color="grey-lighten-1">mdi-medal-outline</v-icon>
              </template>
            </v-list-item>
            <v-list-item
              v-for="t in ownedTitles"
              :key="t.id"
              class="mb-2 achievement-list-item"
              :class="{ 'selected': selectedTitle === t.name }"
              :subtitle="$t('profile.boughtInShop')"
              :title="$t('shopItems.' + getTitleKey(t.name) + '.name')"
              @click="selectTitle(t.name)"
            >
              <template #prepend>
                <v-icon class="mr-3" :color="t.color">{{ t.icon }}</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Diálogo Logout -->
    <v-dialog v-model="showLogoutDialog" max-width="400">
      <v-card class="glass-popup pa-6 text-center shadow-xl">
        <v-icon class="mb-4 pulse-error" color="error" icon="mdi-alert-circle-outline" size="64" />
        <h2 class="text-h5 font-weight-bold text-white mb-2 tracking-tighter">{{ $t('profile.logoutBtn').toUpperCase() }}?</h2>
        <p class="text-body-2 text-grey-lighten-1 mb-8">
          {{ $t('profile.logoutConfirm') }}
        </p>
        <div class="d-flex justify-center mt-4">
          <v-btn
            class="rounded-lg flex-grow-1 mr-2"
            color="grey-lighten-1"
            height="48"
            variant="outlined"
            @click="showLogoutDialog = false"
          >
            {{ $t('general.cancel').toUpperCase() }}
          </v-btn>
          <v-btn
            class="rounded-lg flex-grow-1 ml-2"
            color="error"
            height="48"
            variant="flat"
            @click="confirmLogout"
          >
            {{ $t('profile.logoutBtn').split(' ')[0].toUpperCase() }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Diálogo Ajustes -->
    <v-dialog v-model="settingsDialog" max-width="850" transition="dialog-bottom-transition">
      <v-card class="settings-modern-card glass-popup">
        <div class="settings-layout">
          <!-- Sidebar -->
          <div class="settings-sidebar">
            <div class="sidebar-header pa-6">
              <h2 class="text-h6 font-weight-black text-white">{{ $t('profile.accountSettings') }}</h2>
            </div>
            <v-list bg-color="transparent" class="px-2">
              <v-list-item
                :active="settingsTab === 'profile'"
                class="mb-1 nav-item"
                prepend-icon="mdi-account-outline"
                rounded="lg"
                :title="$t('sidebar.profile').toUpperCase()"
                @click="settingsTab = 'profile'"
              />
              <v-list-item
                :active="settingsTab === 'security'"
                class="mb-1 nav-item"
                prepend-icon="mdi-shield-lock-outline"
                rounded="lg"
                :title="$t('profile.security')"
                @click="settingsTab = 'security'"
              />
              <v-list-item
                :active="settingsTab === 'prefs'"
                class="mb-1 nav-item"
                prepend-icon="mdi-tune-variant"
                rounded="lg"
                :title="$t('profile.preferences')"
                @click="settingsTab = 'prefs'"
              />
              <v-list-item
                :active="settingsTab === 'danger'"
                class="nav-item danger-nav"
                prepend-icon="mdi-alert-octagon-outline"
                rounded="lg"
                :title="$t('profile.dangerZone')"
                @click="settingsTab = 'danger'"
              />
            </v-list>
          </div>

          <!-- Contenido -->
          <div class="settings-content pa-8">
            <div class="d-flex justify-end position-absolute top-0 right-0 pa-4" style="z-index: 10;">
              <v-btn
                color="white"
                icon="mdi-close"
                size="small"
                variant="text"
                @click="closeSettingsDialog"
              />
            </div>

            <!-- SECCIÓN: PERFIL -->
            <div v-if="settingsTab === 'profile'" class="tab-pane">
              <h3 class="text-h5 font-weight-black text-white mb-6">{{ $t('sidebar.profile').toUpperCase() }}</h3>

              <!-- Mini replica Friend Card Preview -->
              <div class="d-flex flex-column align-center mb-6">
                <div class="text-caption text-cyan-accent-3 font-weight-black mb-2">{{ $t('profile.preview') || 'VISTA PREVIA DE TU TARJETA' }}</div>
                <v-card
                  class="friend-card detailed-card"
                  :style="{
                    maxWidth: '320px',
                    width: '100%'
                  }"
                  variant="flat"
                >
                  <div
                    class="card-header-gradient"
                    :class="!pendingColor || pendingColor === '#0a192f' ? getRankClass(level) : ''"
                    :style="{
                      background: pendingColor && pendingColor !== '#0a192f' ? `${pendingColor} !important` : '',
                      opacity: pendingColor && pendingColor !== '#0a192f' ? '0.95 !important' : ''
                    }"
                  />

                  <div class="card-body pa-5 pt-2 mb-2">
                    <div class="d-flex align-start justify-space-between mb-2">
                      <div class="avatar-container mt-n12">
                        <div class="avatar-ring" :class="getRankClass(level)">
                          <v-avatar class="main-avatar" color="#0a192f" size="84">
                            <v-img cover :src="`/${avatar}`" />
                          </v-avatar>
                        </div>
                      </div>

                      <div class="text-right">
                        <div class="text-overline text-cyan-accent-1 lh-1 mb-1">{{ $t('friends.level', { level: level || 1 }) }}</div>
                        <div class="xp-mini-bar">
                          <v-progress-linear color="cyan-accent-2" height="4" :model-value="(xp / xpRequired) * 100" rounded />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 class="text-h5 font-weight-black text-white mb-1 name-title">{{ newDisplayName || displayName || user }}</h2>
                      <v-chip :class="['rank-chip-mini font-weight-black', getRankClass(level)]" size="x-small">
                        {{ selectedTitle ? $t('shopItems.' + getTitleKey(selectedTitle) + '.name') : getRankName(level) }}
                      </v-chip>
                    </div>
                  </div>
                </v-card>
              </div>

              <v-form @submit.prevent="saveProfileChanges">
                <div class="d-flex align-center ga-2 mb-2">
                  <div class="text-subtitle-2 text-grey-lighten-1 mb-0">{{ $t('profile.changeDisplayName') }}</div>
                  <div v-if="nameChangesCount === 0" class="text-caption text-cyan-accent-3 font-weight-bold mb-0">
                    ({{ $t('profile.firstChangeFree') }})
                  </div>
                  <div v-else class="text-caption text-grey mb-0">
                    ({{ $t('profile.tokensAvailable', { count: nameChangeTokens }) }})
                  </div>
                </div>
                <v-text-field
                  v-model="newDisplayName"
                  class="mb-4"
                  color="cyan-accent-3"
                  density="comfortable"
                  :label="$t('profile.newDisplayName')"
                  prepend-inner-icon="mdi-pencil-outline"
                  variant="outlined"
                />

                <div class="text-subtitle-2 text-grey-lighten-1 mb-3">{{ $t('profile.cardColor') }}</div>
                <div class="d-flex flex-wrap ga-3 mb-6">
                  <div
                    v-for="color in profileColorOptions"
                    :key="color"
                    class="color-option"
                    :class="{ 'active-color': pendingColor === color }"
                    :style="{ background: color }"
                    @click="pendingColor = color"
                  >
                    <v-icon v-if="pendingColor === color" color="white" icon="mdi-check" size="20" />
                  </div>
                </div>

                <v-alert
                  v-if="nameChangeError"
                  class="mb-4"
                  density="compact"
                  type="error"
                  variant="tonal"
                >
                  {{ nameChangeError }}
                </v-alert>
                <v-alert
                  v-if="settingsSuccess"
                  class="mb-4"
                  density="compact"
                  type="success"
                  variant="tonal"
                >
                  {{ settingsSuccess }}
                </v-alert>

                <div class="d-flex align-center ga-4">
                  <v-btn
                    class="font-weight-black flex-grow-1"
                    color="cyan-accent-3"
                    :disabled="newDisplayName === (displayName || user) && pendingColor === (profileColor || '#0a192f')"
                    height="48"
                    :loading="nameChangeLoading"
                    rounded="lg"
                    type="submit"
                  >
                    {{ $t('profile.saveChanges') }}
                  </v-btn>
                </div>
              </v-form>
            </div>

            <!-- SECCIÓN: SEGURIDAD -->
            <div v-if="settingsTab === 'security'" class="tab-pane">
              <h3 class="text-h5 font-weight-black text-white mb-6">{{ $t('profile.security') }}</h3>

              <v-alert
                v-if="settingsError"
                class="mb-4"
                density="compact"
                type="error"
                variant="tonal"
              >
                {{ settingsError }}
              </v-alert>
              <v-alert
                v-if="settingsSuccess"
                class="mb-4"
                density="compact"
                type="success"
                variant="tonal"
              >
                {{ settingsSuccess }}
              </v-alert>

              <v-alert
                v-if="astroStore.isPasswordWeak"
                class="mb-4"
                density="comfortable"
                type="warning"
                variant="tonal"
                icon="mdi-alert-decagram"
              >
                {{ $t('profile.weakPasswordWarning') }}
              </v-alert>

              <v-form @submit.prevent="submitPasswordChange">
                <v-text-field
                  v-model="oldPassword"
                  class="mb-4"
                  color="cyan-accent-3"
                  density="comfortable"
                  :label="$t('profile.oldPassword')"
                  prepend-inner-icon="mdi-lock-outline"
                  type="password"
                  variant="outlined"
                />

                <v-text-field
                  v-model="newPassword"
                  class="mb-4"
                  color="cyan-accent-3"
                  density="comfortable"
                  :label="$t('profile.newPassword')"
                  prepend-inner-icon="mdi-lock-reset"
                  type="password"
                  variant="outlined"
                />

                <v-text-field
                  v-model="confirmNewPassword"
                  class="mb-8"
                  color="cyan-accent-3"
                  :confirm-new-password="confirmNewPassword && !passwordsMatch"
                  density="comfortable"
                  :error="confirmNewPassword && !passwordsMatch"
                  :error-messages="confirmNewPassword && !passwordsMatch ? [$t('profile.passwordMismatch')] : []"
                  :label="$t('profile.confirmNewPassword')"
                  prepend-inner-icon="mdi-lock-check-outline"
                  type="password"
                  variant="outlined"
                />

                <v-btn
                  block
                  class="font-weight-black"
                  color="cyan-accent-3"
                  :disabled="!canSubmitPasswordChange"
                  height="50"
                  :loading="settingsLoading"
                  rounded="lg"
                  type="submit"
                >
                  {{ $t('profile.saveChanges') }}
                </v-btn>
              </v-form>
            </div>

            <!-- SECCIÓN: PREFERENCIAS -->
            <div v-if="settingsTab === 'prefs'" class="tab-pane">
              <h3 class="text-h5 font-weight-black text-white mb-6">{{ $t('profile.preferences') }}</h3>

              <div class="mb-8">
                <div class="text-overline text-cyan-accent-3 mb-2">{{ $t('profile.language') }}</div>
                <LanguageSelector />
              </div>

              <div class="mb-8">
                <div class="text-overline text-grey-lighten-1 mb-4">{{ $t('profile.appearance') }}</div>
                <div class="d-flex ga-4">
                  <v-switch
                    color="cyan-accent-3"
                    density="compact"
                    hide-details
                    :label="$t('profile.interface') + ': Neon UI'"
                    model-value="true"
                  />
                </div>
              </div>

              <div class="mb-2">
                <div class="text-overline text-grey-lighten-1 mb-4">Mantenimiento de Datos</div>
                <v-btn
                  block
                  color="cyan-accent-3"
                  disabled
                  prepend-icon="mdi-sync"
                  variant="tonal"
                >
                  Sincronizar Cloud Atlas
                </v-btn>
              </div>
            </div>

            <!-- SECCIÓN: PELIGRO -->
            <div v-if="settingsTab === 'danger'" class="tab-pane">
              <h3 class="text-h5 font-weight-black text-white mb-6">{{ $t('profile.dangerZone') }}</h3>

              <v-card class="pa-6 rounded-xl border-dashed" color="red-darken-3" variant="outlined">
                <div v-if="!deletionScheduledAt">
                  <div class="d-flex align-center mb-4">
                    <v-icon class="mr-3" color="red-accent-3" icon="mdi-alert-outline" size="32" />
                    <span class="text-h6 font-weight-black text-red-accent-3">{{ $t('profile.deleteAccount') }}</span>
                  </div>
                  <p class="text-body-2 text-grey-lighten-1 mb-6">
                    {{ $t('profile.deleteConfirmDesc') }}
                  </p>

                  <div class="text-caption text-grey-lighten-1 mb-2">
                    {{ $t('profile.deleteConfirmationLabel', { phrase: $t('profile.deleteConfirmationPhrase') }) }}
                  </div>
                  <v-text-field
                    v-model="deleteConfirmationInput"
                    class="mb-4 delete-confirm-input"
                    color="red-accent-3"
                    density="comfortable"
                    :error="deleteConfirmationInput.length > 0 && !isDeleteConfirmed"
                    :error-messages="deleteConfirmationInput.length > 0 && !isDeleteConfirmed ? [$t('profile.wrongPhrase')] : []"
                    hide-details="auto"
                    :placeholder="$t('profile.deleteConfirmationPhrase')"
                    variant="outlined"
                    @paste.prevent
                  />

                  <v-btn
                    block
                    class="font-weight-black"
                    :class="{ 'btn-blurred': !isDeleteConfirmed }"
                    color="red-accent-4"
                    :disabled="!isDeleteConfirmed"
                    height="48"
                    :loading="deleteLoading"
                    variant="flat"
                    @click="handleRequestDeletion"
                  >
                    {{ $t('profile.deleteAction') }}
                  </v-btn>
                </div>

                <div v-else>
                  <div class="d-flex align-center mb-4">
                    <v-icon class="mr-3" color="amber-accent-3" icon="mdi-timer-sand" size="32" />
                    <span class="text-h6 font-weight-black text-amber-accent-3">{{ $t('profile.deleteScheduledTitle') }}</span>
                  </div>
                  <p class="text-body-2 text-grey-lighten-1 mb-6">
                    {{ $t('profile.deleteScheduledDesc', { date: formattedDeletionDate }) }}
                  </p>
                  <v-btn
                    block
                    class="font-weight-black"
                    color="cyan-accent-3"
                    height="48"
                    :loading="deleteLoading"
                    variant="flat"
                    @click="handleCancelDeletion"
                  >
                    <v-icon class="mr-2" icon="mdi-undo" start />
                    {{ $t('profile.cancelDeleteAction') }}
                  </v-btn>
                </div>
              </v-card>
            </div>
          </div>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
  import { storeToRefs } from 'pinia'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import Medal from '@/components/achievements/Medal.vue'
  import LanguageSelector from '@/components/layout/LanguageSelector.vue'
  import { ACHIEVEMENTS } from '@/constants/achievements'
  import { useAstroStore } from '@/stores/astroStore'
  import { INVENTORY_CATALOG } from '@/stores/astroShared'

  const { t, te } = useI18n()
  const router = useRouter()
  const astroStore = useAstroStore()

  const selectionDialog = ref(false)
  const avatarDialog = ref(false)
  const titleDialog = ref(false)
  const historyDialog = ref(false)
  const showLogoutDialog = ref(false)
  const settingsDialog = ref(false)
  const settingsTab = ref('profile')
  const settingsLoading = ref(false)
  const deleteLoading = ref(false)
  const nameChangeLoading = ref(false)
  const historyFilter = ref('all') // 'all', 'single', 'multi'
  const deleteConfirmationInput = ref('')
  const settingsError = ref('')
  const nameChangeError = ref('')
  const newDisplayName = ref('')
  const settingsSuccess = ref('')
  const pendingColor = ref('#0a192f')
  const oldPassword = ref('')
  const newPassword = ref('')
  const confirmNewPassword = ref('')
  const currentPage = ref(1)
  const pageSize = 5
  const currentSlotIndex = ref(null)

  const {
    user, rank, selectedTitle, plan, role, parentId, selectedAchievements, unlockedAchievements,
    avatar, level, coins, xp, partides, inventory, displayName, nameChangesCount,
    gameHistory, topGames, maxScores, totalGamesPlayed, totalPoints, deletionScheduledAt, profileColor,
  } = storeToRefs(astroStore)

  function getRankName (lvl = 1) {
    const index = Math.min(Math.floor((lvl - 1) / 10), 14)
    return t(`ranks.${index}`)
  }

  function getRankClass (lvl = 1) {
    if (lvl <= 10) return 'rank-tier-1'
    if (lvl <= 30) return 'rank-tier-2'
    if (lvl <= 60) return 'rank-tier-3'
    if (lvl <= 100) return 'rank-tier-4'
    if (lvl <= 130) return 'rank-tier-5'
    return 'rank-tier-6'
  }

  const filteredHistory = computed(() => {
    const list = gameHistory.value || []
    if (historyFilter.value === 'single') return list.filter(m => m.game !== 'Multijugador')
    if (historyFilter.value === 'multi') return list.filter(m => m.game === 'Multijugador')
    return list
  })

  const paginatedHistory = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    const end = start + pageSize
    return filteredHistory.value.slice(start, end)
  })

  const totalPages = computed(() => {
    return Math.ceil(filteredHistory.value.length / pageSize) || 1
  })

  const xpRequired = computed(() => {
    return 100 + ((level.value || 1) - 1) * 50
  })

  const missionKeyPrefixes = ['mission_1', 'mission_2', 'mission_3', 'mission_4', 'mission_5', 'mission_6']

  const currentMissionName = computed(() => {
    const currentLvl = level.value || 1
    if (currentLvl <= missionKeyPrefixes.length) {
      return t(`profile.${missionKeyPrefixes[currentLvl - 1]}`).toUpperCase()
    }
    return t('profile.deepSpace', { level: currentLvl })
  })

  const canAccessEducational = computed(() => {
    return (plan.value === 'GRUPAL' && (role.value === 'CENTER' || role.value === 'TEACHER'))
      || plan.value === 'INDIVIDUAL_PREMIUM'
  })

  const translatedPlan = computed(() => {
    const planValue = String(plan.value || 'INDIVIDUAL_FREE').toUpperCase()

    if (planValue === 'GRUPAL') {
      return t('plans.grupal').toUpperCase()
    }
    if (planValue === 'INDIVIDUAL_PREMIUM') {
      return t('plans.premium').toUpperCase()
    }
    return t('plans.individual').toUpperCase()
  })

  const avatarOptions = computed(() => {
    const base = [
      { label: t('profile.avatar_white'), file: 'Astronauta_blanc.jpg' },
      { label: t('profile.avatar_yellow'), file: 'Astronauta_groc.jpg' },
      { label: t('profile.avatar_purple'), file: 'Astronauta_lila.jpg' },
      { label: t('profile.avatar_black'), file: 'Astronauta_negre.jpg' },
      { label: t('profile.avatar_orange'), file: 'Astronauta_taronja.jpg' },
      { label: t('profile.avatar_green'), file: 'Astronauta_verd.jpg' },
      { label: t('profile.avatar_red'), file: 'Astronauta_vermell.jpg' },
    ]

    if (inventory.value) {
      // Usamos el catálogo como fallback si falta la propiedad image en el item
      const skins = inventory.value.filter(i => i.cat === 'skin')
      skins.forEach(s => {
        const image = s.image || INVENTORY_CATALOG[s.id]?.image
        if (image && !base.find(b => b.file === image)) {
          base.push({ label: s.name, file: image })
        }
      })
    }
    return base
  })

  const ALL_TITLES = [
    { id: 105, name: 'El Imparable', key: 'titleUnstoppable', icon: 'mdi-format-title', color: 'red-accent-3' },
    { id: 106, name: 'Leyenda Galáctica', key: 'titleLegend', icon: 'mdi-format-title', color: 'cyan-accent-3' },
    { id: 107, name: 'Destructor de Asteroides', key: 'titleDestroyer', icon: 'mdi-format-title', color: 'amber-accent-3' },
  ]

  const profileColorOptions = [
    'linear-gradient(135deg, #455a64, #1a237e)',
    'linear-gradient(135deg, #2e7d32, #004d40)',
    'linear-gradient(135deg, #1565c0, #0d47a1)',
    'linear-gradient(135deg, #6a1b9a, #4a148c)',
    'linear-gradient(135deg, #00e5ff, #311b92)',
    'linear-gradient(135deg, #ff00ea, #6a1b9a)',
    'linear-gradient(135deg, #ffe600, #ff5100)',
  ]

  function updateColor (color) {
    pendingColor.value = color
  }

  function getTitleKey (titleName) {
    if (!titleName) return ''
    const cleanName = titleName.replace('Título: ', '')
    const title = ALL_TITLES.find(t => t.name === cleanName)
    return title ? title.key : ''
  }

  const ownedTitles = computed(() => {
    if (!inventory.value) return []
    return ALL_TITLES.filter(title => {
      const item = inventory.value.find(i => Number(i.id) === title.id)
      return item && Number(item.quantity) > 0
    })
  })

  const formattedTitle = computed(() => {
    if (selectedTitle.value) {
      return t('shopItems.' + getTitleKey(selectedTitle.value) + '.name')
    }
    return getRankName(level.value)
  })

  const nameChangeTokens = computed(() => {
    if (!inventory.value) return 0
    const item = inventory.value.find(i => Number(i.id) === 6)
    return item ? Number(item.quantity) : 0
  })

  const playerMetrics = computed(() => ({
    coins: Number(coins.value) || 0,
    games: Number(partides.value) || 0,
    missions: Number(astroStore.missionsCompleted) || 0,
    inventory: Number(astroStore.inventoryUnits) || 0,
    level: Number(level.value) || 1,
    xp: Number(xp.value) || 0,
  }))

  const allAchievements = computed(() => {
    const unlockedFromDb = new Set(unlockedAchievements.value || [])
    return ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: (playerMetrics.value[a.metric] || 0) >= (a.goal || 0) || unlockedFromDb.has(a.id),
    }))
  })

  const passwordsMatch = computed(() => newPassword.value === confirmNewPassword.value)

  const isDeleteConfirmed = computed(() => {
    return deleteConfirmationInput.value.trim().toLowerCase() === t('profile.deleteConfirmationPhrase').toLowerCase()
  })

  const formattedDeletionDate = computed(() => {
    if (!deletionScheduledAt.value) return ''
    const date = new Date(deletionScheduledAt.value)
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
  })

  const canSubmitPasswordChange = computed(() => {
    return Boolean(
      oldPassword.value
        && newPassword.value
      && confirmNewPassword.value
        && passwordsMatch.value,
    )
  })

  onMounted(async () => {
    if (!astroStore.user) return
    await Promise.all([
      astroStore.fetchUserStats(),
      astroStore.fetchUserInventory(),
      astroStore.fetchUserAchievements(),
    ])
  })

  function isSelected (id) {
    return selectedAchievements.value.some(sid => sid !== null && Number(sid) === Number(id))
  }

  function getAchievement (id) {
    if (id === null || id === undefined) return null
    return ACHIEVEMENTS.find(a => a.id === Number(id))
  }

  function openSelection (index) {
    currentSlotIndex.value = index
    selectionDialog.value = true
  }

  async function selectAchievement (achievementId) {
    if (!user.value) return
    selectionDialog.value = false
    const targetId = achievementId === null ? null : Number(achievementId)
    let newSelection = [...selectedAchievements.value]
    if (targetId !== null) {
      const existingIndex = newSelection.findIndex(id => id !== null && Number(id) === targetId)
      if (existingIndex !== -1) newSelection[existingIndex] = null
    }
    newSelection[currentSlotIndex.value] = targetId
    await astroStore.updateAchievements(newSelection)
  }

  function confirmLogout () {
    showLogoutDialog.value = false
    astroStore.logout()
    router.push('/login')
  }

  function goToInventory () {
    router.push('/inventory')
  }
  function changePlan () {
    router.push('/plans')
  }

  function selectAvatar (file) {
    astroStore.updateAvatar(file)
    avatarDialog.value = false
  }

  async function handleRequestDeletion () {
    if (!isDeleteConfirmed.value || deleteLoading.value) return
    deleteLoading.value = true
    const result = await astroStore.scheduleAccountDeletion()
    deleteLoading.value = false
    if (result.success) {
      deleteConfirmationInput.value = ''
    } else {
      settingsError.value = result.message
    }
  }

  async function handleCancelDeletion () {
    if (deleteLoading.value) return
    deleteLoading.value = true
    const result = await astroStore.cancelAccountDeletion()
    deleteLoading.value = false
    if (!result.success) {
      settingsError.value = result.message
    }
  }

  function selectTitle (titleName) {
    astroStore.updateSelectedTitle(titleName)
    titleDialog.value = false
  }

  function clearPasswordForm () {
    oldPassword.value = ''
    newPassword.value = ''
    confirmNewPassword.value = ''
    settingsError.value = ''
    settingsSuccess.value = ''
  }

  function openSettingsDialog () {
    clearPasswordForm()
    newDisplayName.value = displayName.value || user.value || ''
    pendingColor.value = profileColor.value || '#0a192f'
    settingsTab.value = 'profile'
    settingsDialog.value = true
  }

  function closeSettingsDialog () {
    settingsDialog.value = false
    clearPasswordForm()
  }

  function openNameChangeDialog () {
    newDisplayName.value = displayName.value || user.value || ''
    pendingColor.value = profileColor.value || '#0a192f'
    nameChangeError.value = ''
    settingsTab.value = 'profile'
    settingsDialog.value = true
  }

  async function saveProfileChanges () {
    if (nameChangeLoading.value) return
    nameChangeError.value = ''
    settingsSuccess.value = ''
    nameChangeLoading.value = true
    try {
      const displayNameChanged = newDisplayName.value && newDisplayName.value !== (displayName.value || user.value)
      const colorChanged = pendingColor.value !== (profileColor.value || '#0a192f')

      let success = true
      let errorMsg = ''

      if (displayNameChanged) {
        const result = await astroStore.changeDisplayName(newDisplayName.value)
        if (!result.success) {
          success = false
          errorMsg = result.message || 'Error al cambiar apodo'
        }
      }

      if (colorChanged && success) {
        const result = await astroStore.updateProfileColorAction(pendingColor.value)
        if (!result.success) {
          success = false
          errorMsg = result.message || 'Error al guardar el color'
        }
      }

      if (success) {
        settingsSuccess.value = t('profile.colorUpdated') || '¡Cambios guardados con éxito!'
        setTimeout(() => {
          settingsSuccess.value = ''
        }, 3000)
      } else {
        nameChangeError.value = errorMsg
      }
    } catch (e) {
      nameChangeError.value = e.message
    } finally {
      nameChangeLoading.value = false
    }
  }

  async function submitPasswordChange () {
    if (settingsLoading.value) return
    settingsError.value = ''
    settingsSuccess.value = ''
    if (!oldPassword.value || !newPassword.value || !confirmNewPassword.value) {
      settingsError.value = t('profile.passwordFieldsRequired')
      return
    }
    if (!passwordsMatch.value) {
      settingsError.value = t('profile.passwordMismatch')
      return
    }
    if (oldPassword.value === newPassword.value) {
      settingsError.value = t('profile.passwordMustDiffer')
      return
    }
    settingsLoading.value = true
    const result = await astroStore.changePassword(oldPassword.value, newPassword.value)
    settingsLoading.value = false
    if (!result?.success) {
      settingsError.value = result?.message || t('profile.passwordChangeError')
      return
    }
    settingsSuccess.value = t('profile.passwordChangeSuccess')
    oldPassword.value = ''
    newPassword.value = ''
    confirmNewPassword.value = ''
  }

  watch(historyDialog, async isOpen => {
    if (isOpen && user.value) {
      await astroStore.fetchUserStats()
    }
  })
</script>

<style scoped>
.profile-container {
    background: transparent !important;
    min-height: 100vh;
}

.profile-layout-wrapper {
    display: flex;
    justify-content: center;
    width: 100%;
}

.settings-modern-card {
    min-height: 500px;
    border: 1px solid rgba(0, 242, 255, 0.2);
}

.settings-layout {
    display: flex;
    flex-direction: row;
    height: 100%;
}

.settings-sidebar {
    width: 280px;
    flex-shrink: 0;
    background: rgba(0, 0, 0, 0.3);
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    flex-direction: column;
}

.settings-content {
    flex-grow: 1;
    background: rgba(0, 0, 0, 0.1);
    position: relative;
    max-height: 600px;
    overflow-y: auto;
}

.nav-item {
    transition: all 0.3s ease;
    opacity: 0.7;
}

.nav-item:hover {
    background: rgba(0, 242, 255, 0.05) !important;
    opacity: 1;
}

.nav-item.v-list-item--active {
    background: rgba(0, 242, 255, 0.1) !important;
    color: #00f2ff !important;
    opacity: 1;
    border-right: 3px solid #00f2ff;
}

.danger-nav.v-list-item--active {
    color: #ff5252 !important;
    border-color: #ff5252;
    background: rgba(255, 82, 82, 0.1) !important;
}

.profile-preview-box {
    background: rgba(0, 242, 255, 0.05);
    border: 1px solid rgba(0, 242, 255, 0.1);
}

.border-cyan {
    border: 2px solid #00f2ff !important;
}

.tab-pane {
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from { opacity: 0; transform: translateX(10px); }
    to { opacity: 1; transform: translateX(0); }
}

.btn-blurred {
    filter: blur(1px);
    opacity: 0.6 !important;
}

.delete-confirm-input :deep(input) {
    text-align: center;
    font-weight: 700;
    letter-spacing: 1px;
}

@media (max-width: 600px) {
    .settings-layout {
        flex-direction: column;
    }
    .settings-sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
}

.banner-section { position: relative; }
.banner-image { filter: brightness(0.8); }
.banner-overlay {
    position: absolute;
    bottom: 0; left: 0; right: 0; height: 60%;
    background: linear-gradient(to top, #0a0c10, transparent);
}

.profile-header {
    margin-top: -80px;
    position: relative;
    z-index: 3;
}

.avatar-container { display: flex; align-items: flex-end; gap: 16px; }
.main-avatar-wrapper { position: relative; }
.avatar-circle {
    border: 5px solid #0a0c10;
    box-shadow: 0 10px 30px rgba(0,0,0,0.8);
}
.avatar-circle :deep(.v-img__img) { transform: scale(1.1); }
.edit-avatar-btn {
    position: absolute; bottom: 5px; right: 5px;
    border: 3px solid #0a0c10 !important;
}

.user-name {
    letter-spacing: -1px !important;
    text-shadow: 0 4px 10px rgba(0,0,0,0.5);
}

.name-edit-btn {
    opacity: 0.85;
}

.history-actions {
    flex-shrink: 0;
}

.history-toggle-btn {
    min-height: 48px;
    font-weight: 800;
}

.settings-btn {
    width: 48px;
    height: 48px;
}

.rank-chip {
    letter-spacing: 1px;
    text-transform: uppercase;
    transition: all 0.3s ease;
}

/* Ranks */
.rank-tier-1 { background: linear-gradient(135deg, #78909c, #455a64) !important; color: white !important; }
.rank-tier-2 { background: linear-gradient(135deg, #00acc1, #006064) !important; color: white !important; border: 1px solid rgba(0, 255, 255, 0.3) !important; }
.rank-tier-3 { background: linear-gradient(135deg, #8e24aa, #4a148c) !important; color: white !important; border: 1px solid rgba(255, 0, 255, 0.4) !important; }
.rank-tier-4 { background: linear-gradient(135deg, #ff9800, #e65100) !important; color: white !important; border: 2px solid rgba(255, 255, 0, 0.5) !important; }
.rank-tier-5 { background: linear-gradient(135deg, #c62828, #1a237e) !important; color: white !important; border: 2px solid #ff1744 !important; }
.rank-tier-6 { background: linear-gradient(270deg, #6200ea, #00b0ff, #d500f9) !important; background-size: 400% 400% !important; animation: cosmic-bg 10s ease infinite !important; }

@keyframes cosmic-bg {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.status-dot.online { background: #00e676; box-shadow: 0 0 10px #00e676; }

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 20px;
}
.stat-item { display: flex; flex-direction: column; }
.stat-label { font-family: 'Rajdhani', sans-serif; font-size: 0.65rem; font-weight: 800; color: rgba(255,255,255,0.4); letter-spacing: 2px; }
.stat-value { font-family: 'Orbitron', sans-serif; font-size: 0.9rem; font-weight: 700; }

.achievement-slot {
    aspect-ratio: 1;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    cursor: pointer;
}
.achievement-slot:hover { background: rgba(0, 242, 255, 0.05); border-color: rgba(0, 242, 255, 0.2); transform: translateY(-5px); }

.history-popup-card {
    background: #0a0c10 !important;
    border: 1px solid rgba(0, 242, 255, 0.2);
    border-radius: 24px !important;
    overflow: hidden;
    box-shadow: 0 0 50px rgba(0, 0, 0, 0.8) !important;
}

.history-popup-content {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 229, 255, 0.2) transparent;
}

.history-popup-content::-webkit-scrollbar {
    width: 6px;
}

.history-popup-content::-webkit-scrollbar-thumb {
    background: rgba(0, 229, 255, 0.2);
    border-radius: 10px;
}
.history-popup-header { background: linear-gradient(to right, #0a0c10, #111827); }
.top-game-card-popup {
    display: flex; align-items: center; gap: 12px;
    background: rgba(255, 193, 7, 0.03); border: 1px solid rgba(255, 193, 7, 0.1);
    padding: 10px 16px; border-radius: 10px; transition: all 0.3s;
    min-height: 64px;
}
.top-game-card-popup:hover { background: rgba(255, 193, 7, 0.08); border-color: rgba(255, 193, 7, 0.3); transform: scale(1.01); }
.top-games-list-popup, .recent-list-popup {
    height: 380px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 242, 255, 0.1) transparent;
}

.top-games-list-popup::-webkit-scrollbar, .recent-list-popup::-webkit-scrollbar {
    width: 4px;
}

.top-games-list-popup::-webkit-scrollbar-thumb, .recent-list-popup::-webkit-scrollbar-thumb {
    background: rgba(0, 242, 255, 0.1);
    border-radius: 4px;
}

.recent-item-popup {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 16px; background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05); border-radius: 10px;
    min-height: 64px;
}
.recent-item-popup:hover { background: rgba(255,255,255,0.05); border-color: rgba(0, 242, 255, 0.2); }

.border-right-sep {
    border-right: 1px solid rgba(255, 255, 255, 0.05);
}

@media (max-width: 960px) {
    .border-right-sep {
        border-right: none;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        padding-bottom: 24px;
        margin-bottom: 24px;
    }
}

.game-score-small-popup { font-family: 'Orbitron', sans-serif; color: #00e5ff; font-size: 0.95rem; }
.rank-num {
    width: 28px; height: 28px; background: #ffc107; color: #000;
    font-weight: 900; font-size: 0.8rem; border-radius: 50%; display: flex;
    align-items: center; justify-content: center; flex-shrink: 0;
}

.empty-state-popup {
    padding: 40px; text-align: center; background: rgba(255,255,255,0.01);
    border: 2px dashed rgba(255,255,255,0.05); border-radius: 20px;
    color: rgba(255,255,255,0.2);
    height: 380px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.glass-popup {
    background: rgba(10, 12, 16, 0.95) !important;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(0, 242, 255, 0.2);
    border-radius: 20px !important;
}

.achievement-list-item { border-radius: 12px; background: rgba(255,255,255,0.02) !important; margin-bottom: 8px; }
.achievement-list-item.selected { border: 1px solid #00e5ff; background: rgba(0, 229, 255, 0.1) !important; }

.avatar-option { cursor: pointer; transition: transform 0.2s; }
.avatar-option:hover { transform: scale(1.1); }
.active-avatar { border: 2px solid #00e5ff !important; box-shadow: 0 0 15px rgba(0, 229, 255, 0.3); }

@media (max-width: 600px) {
    .stats-grid { grid-template-columns: 1fr; }
    .user-name { font-size: 2rem !important; }
    .history-actions {
        width: 100%;
        justify-content: flex-start;
    }
}

.pulse-error { animation: pulse-red 2s infinite; }
@keyframes pulse-red {
    0% { filter: drop-shadow(0 0 0px rgba(255, 82, 82, 0)); }
    50% { filter: drop-shadow(0 0 10px rgba(255, 82, 82, 0.5)); }
    100% { filter: drop-shadow(0 0 0px rgba(255, 82, 82, 0)); }
}
.tracking-tighter { letter-spacing: -1px; }
.xp-bar :deep(.v-progress-linear__determinate) {
    transition: width 2.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.color-option {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(255, 255, 255, 0.1);
    transition: all 0.2s ease;
}

.color-option:hover {
    transform: scale(1.1);
    border-color: rgba(255, 255, 255, 0.5);
}

.active-color {
    border: 3px solid #00f2ff !important;
    box-shadow: 0 0 15px rgba(0, 242, 255, 0.4);
}

/* --- FRIEND CARD PREVIEW CLASSES --- */
.friend-card {
  width: 100%;
}
.detailed-card {
  background: rgba(10, 25, 41, 0.7) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  border-radius: 24px !important;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}
.card-header-gradient {
  height: 80px;
  opacity: 0.6;
}
.card-header-gradient.rank-tier-1 { background: linear-gradient(135deg, #455a64, #1a237e); }
.card-header-gradient.rank-tier-2 { background: linear-gradient(135deg, #2e7d32, #004d40); }
.card-header-gradient.rank-tier-3 { background: linear-gradient(135deg, #1565c0, #0d47a1); }
.card-header-gradient.rank-tier-4 { background: linear-gradient(135deg, #6a1b9a, #4a148c); }
.card-header-gradient.rank-tier-5 { background: linear-gradient(135deg, #00e5ff, #311b92); }
.card-header-gradient.rank-tier-6 { background: linear-gradient(135deg, #ff00ea, #6a1b9a); }

.avatar-container {
  position: relative;
  display: inline-block;
}
.avatar-ring {
  padding: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}
.avatar-ring.rank-tier-1 { background: #90a4ae; box-shadow: 0 0 15px rgba(144, 164, 174, 0.3); }
.avatar-ring.rank-tier-2 { background: #4caf50; box-shadow: 0 0 15px rgba(76, 175, 80, 0.3); }
.avatar-ring.rank-tier-3 { background: #2196f3; box-shadow: 0 0 15px rgba(33, 150, 243, 0.3); }
.avatar-ring.rank-tier-4 { background: #9c27b0; box-shadow: 0 0 15px rgba(156, 39, 176, 0.3); }
.avatar-ring.rank-tier-5 { background: #00e5ff; box-shadow: 0 0 15px rgba(0, 229, 255, 0.5); }
.avatar-ring.rank-tier-6 { background: #ff00ea; box-shadow: 0 0 15px rgba(255, 0, 234, 0.5); }

.main-avatar {
  border: 4px solid #0a192f;
}
:deep(.main-avatar .v-img__img) {
  transform: scale(1.4);
}
.name-title {
  letter-spacing: 1px;
}
.rank-chip-mini {
  height: 18px;
  font-size: 0.6rem;
  letter-spacing: 1px;
}
.rank-chip-mini.rank-tier-1 { background: #90a4ae !important; color: #000 !important; }
.rank-chip-mini.rank-tier-2 { background: #4caf50 !important; color: #fff !important; }
.rank-chip-mini.rank-tier-3 { background: #2196f3 !important; color: #fff !important; }
.rank-chip-mini.rank-tier-4 { background: #9c27b0 !important; color: #fff !important; }
.rank-chip-mini.rank-tier-5 { background: #00e5ff !important; color: #000 !important; }
.rank-chip-mini.rank-tier-6 { background: #ff00ea !important; color: #fff !important; }

.section-label-mini {
  font-size: 0.65rem;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.3);
  letter-spacing: 2px;
  text-transform: uppercase;
}
.xp-mini-bar {
  width: 60px;
}
.achievements-showcase {
  display: flex;
  gap: 8px;
}
.mini-medal-slot {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.h-large {
  height: 48px !important;
}
.gap-2 { gap: 8px; }
</style>
