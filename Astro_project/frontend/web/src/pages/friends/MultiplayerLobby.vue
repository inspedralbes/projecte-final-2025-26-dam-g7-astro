<template>
  <v-container class="lobby-container py-8 px-6 fill-height gradient-bg" fluid>
    <!-- Overlay de Ruleta -->
    <RouletteOverlay
      :games="availableGames"
      :show="showRoulette"
      :target-game="multiplayerStore.room?.gameConfig?.currentGame"
      @finished="onRouletteFinished"
    />

    <!-- Overlay de Juego Activo -->
    <transition name="fade-zoom">
      <div v-if="activeGameComponent || isTransitioning || (multiplayerStore.room?.gameConfig?.mode === 'RACE' && multiplayerStore.room?.status === 'PLAYING')" class="game-active-overlay">
        <!-- MODO CARRERA HUD -->
        <RaceHUD 
          v-if="multiplayerStore.room?.gameConfig?.mode === 'RACE'" 
          :sequence="RACE_SEQUENCE" 
        />
        
        <GlobalAnomalyManager v-if="multiplayerStore.room?.status === 'PLAYING'" :forced-anomaly="currentAnomaly" />

        <!-- Puntuación Unificada en COOP (Estilo Just Dance) -->
        <div v-if="multiplayerStore.room?.gameConfig?.mode !== 'RACE' && isTeammate && teamsList.length <= 1" class="hud-score-coop-modern">
          <CoopScoreBar :max-score="5000" :score="totalCoopScore" />
        </div>

        <!-- Puntuación por Equipos (VS por Parejas) -->
        <div v-else-if="teamsList.length > 1" class="hud-score-teams-modern d-flex flex-column gap-2 align-center">
          <CoopScoreBar
            v-for="team in teamsList"
            :key="team.id"
            :compact="true"
            :max-score="8000"
            :score="getTeamScore(team.id)"
            :team-name="team.name"
            :theme="team.theme"
            :time="getTeamTime(team.id)"
          />
        </div>

        <div v-if="multiplayerStore.room?.gameConfig?.mode !== 'RACE'" class="game-hud-container d-flex justify-center align-center">
          <div class="hud-main-bar d-flex align-center px-6">
            <!-- Jugador local -->
            <div class="hud-item d-flex align-center gap-3">
              <v-avatar class="border-cyan" size="36">
                <v-img :src="getPlayerAvatar(astroStore.user)" />
              </v-avatar>
              <div class="hud-text">
                <div class="hud-name">{{ astroStore.displayName || astroStore.user }}</div>
                <div v-if="astroStore.selectedTitle" class="text-caption text-cyan-accent-1 line-height-1 mb-1 font-italic">{{ $t('shopItems.' + getTitleKey(astroStore.selectedTitle) + '.name') }}</div>
                <div v-if="!isTeammate" class="hud-puntos">{{ multiplayerStore.roundScores[astroStore.user] || 0 }} <span class="hud-total">({{ multiplayerStore.room?.gameConfig?.scores?.[astroStore.user] || 0 }})</span></div>
              </div>
            </div>

            <!-- Centro: VS + ronda + Indicador Tiempo -->
            <div class="hud-center-unit mx-8 text-center position-relative">
              <div v-if="!isTeammate" class="vs-text">VS</div>
              <div v-else class="vs-text text-cyan-accent-2">COOP</div>

              <div class="round-text">{{ $t('multiplayerLobby.round', { current: (multiplayerStore.room?.gameConfig?.currentRound || 0) + 1, total: multiplayerStore.room?.gameConfig?.totalRounds || '?' }) }}</div>

              <!-- Temporizador Global -->
              <div class="global-timer" :class="{ 'timer-low': multiplayerStore.timeLeft <= 10 }">
                <v-icon class="mr-1" :icon="multiplayerStore.timeLeft <= 10 ? 'mdi-timer-alert' : 'mdi-timer-outline'" size="small" />
                {{ Math.ceil(multiplayerStore.timeLeft) }}s
              </div>

              <!-- Notificacions de sabotatge (flotants) -->
              <transition-group name="floating-score">
                <div
                  v-for="notif in activeNotifications"
                  :key="notif.id"
                  class="sabotage-notif"
                  :class="notif.amount > 0 ? 'text-success' : 'text-error'"
                >
                  {{ notif.amount > 0 ? '+' : '' }}{{ notif.amount }}s
                </div>
              </transition-group>
            </div>

            <!-- Oponente -->
            <div class="hud-item d-flex align-center flex-row-reverse gap-3 text-right">
              <v-avatar class="border-cyan" size="36">
                <v-img :src="getPlayerAvatar(opponentName)" />
              </v-avatar>
              <div class="hud-text">
                <div class="hud-name">{{ opponentDisplayName }}</div>
                <div v-if="opponentTitle" class="text-caption text-cyan-accent-1 line-height-1 mb-1 font-italic">{{ $t('shopItems.' + getTitleKey(opponentTitle) + '.name') }}</div>
                <div v-if="!isTeammate" class="hud-puntos">{{ multiplayerStore.roundScores[opponentName] || 0 }} <span class="hud-total">({{ multiplayerStore.room?.gameConfig?.scores?.[opponentName] || 0 }})</span></div>
              </div>
            </div>

          </div>
        </div>

        <!-- BOTÓN DE ABORTAR: Extremo superior derecho -->
        <div class="abort-corner-container">
          <v-btn
            class="abort-btn-hud-corner"
            color="error"
            height="50"
            rounded="xl"
            variant="elevated"
            @click="handleAbort"
          >
            <v-icon icon="mdi-power" start />
            {{ $t('auth.abortCmd') || 'ABANDONAR PARTIDA' }}
          </v-btn>
        </div>

        <div class="game-content">
          <!-- MAPA DE CARRERA (Solo en Modo RACE y cuando no hay juego activo) -->
          <transition name="fade">
            <RaceMap 
              v-if="multiplayerStore.room?.gameConfig?.mode === 'RACE' && !activeGameComponent && !isTransitioning"
              @select-planet="onPlanetSelected"
            />
          </transition>

          <component
            :is="activeGameComponent"
            v-if="activeGameComponent && !isTransitioning"
            :key="multiplayerStore.room?.id + '-' + (multiplayerStore.room?.gameConfig?.currentGame || 'none')"
            :is-multiplayer="multiplayerStore.room?.gameConfig?.mode === 'RACE' ? false : true"
            :is-race="multiplayerStore.room?.gameConfig?.mode === 'RACE'"
            @game-over="onGameFinished"
          />

          <!-- Pantalla de Transición -->
          <div v-if="isTransitioning" class="transition-screen d-flex flex-column align-center justify-center">
            <v-progress-circular color="cyan" indeterminate size="64" width="6" />
            <template v-if="multiplayerStore.room?.gameConfig?.mode === 'RACE'">
              <h2 class="text-h2 font-weight-black text-white mt-8 glow-text">{{ $t('multiplayerLobby.nextPlanet') || 'VIATJANT AL SEGÜENT PLANETA...' }}</h2>
              <p class="text-h1 text-cyan-accent-2 mt-4 font-italic tracking-widest">{{ currentPlanets[multiplayerStore.raceProgress]?.toUpperCase() }}</p>
              <div class="planet-decoration mt-8">
                 <v-icon icon="mdi-planet" size="120" color="cyan-lighten-2" class="planet-pulse" />
              </div>
            </template>
            <template v-else>
              <h2 class="text-h2 font-weight-black text-white mt-8 glow-text">{{ $t('multiplayerLobby.nextGameStarting') || 'PREPARANDO SIGUIENTE MISIÓN...' }}</h2>
              <p class="text-h4 text-cyan-accent-2 mt-4 font-italic tracking-widest">{{ multiplayerStore.room?.gameConfig?.currentGame?.toUpperCase() }}</p>
            </template>
          </div>

          <!-- Pop-up de Briefing Automático (10s) -->
          <transition name="fade-zoom">
            <div v-if="showBriefing" class="briefing-overlay d-flex flex-column align-center justify-center">
              <div class="briefing-card pa-10 text-center rounded-xl elevation-24">
                <v-icon class="mb-4" color="cyan-accent-2" icon="mdi-shield-airplane" size="80" />
                <h2 class="text-h3 font-weight-black text-white mb-2">{{ $t('multiplayerLobby.briefingTitle') || 'INSTRUCCIONES DE MISIÓN' }}</h2>
                <div class="briefing-timer mb-6">{{ briefingCountdown }}s</div>
                
                <div class="role-explanation pa-6 rounded-xl bg-slate-800 border-cyan mb-8">
                  <template v-if="multiplayerStore.room?.gameConfig?.currentGame === 'RhymeSquad'">
                    <div v-if="multiplayerStore.subRole === 'catcher'" class="text-green-accent-3">
                      <v-icon icon="mdi-basket-fill" size="48" class="mb-2" />
                      <h3 class="text-h4 font-weight-bold">RECOLECTOR</h3>
                      <p class="text-body-1 text-white mt-2">¡Atrapa solo las palabras que RIMEN con la pista!</p>
                    </div>
                    <div v-else class="text-red-accent-3">
                      <v-icon icon="mdi-target" size="48" class="mb-2" />
                      <h3 class="text-h4 font-weight-bold">DESTRUCTOR</h3>
                      <p class="text-body-1 text-white mt-2">¡Destruye las palabras que NO riman para proteger al equipo!</p>
                    </div>
                  </template>
                  <template v-else>
                    <p class="text-h5 text-white">¡Colaborad para conseguir la máxima puntuación!</p>
                    <p class="text-body-1 text-grey-lighten-1 mt-2">La comunicación es clave para el éxito de la misión.</p>
                  </template>
                </div>

                <div class="text-overline text-cyan-accent-1 animate-pulse">Iniciando automáticamente...</div>
              </div>
            </div>
          </transition>
        </div>

        <!-- Overlay de Resultados de Ronda -->
        <transition name="scale">
          <div v-if="showRoundResults" class="round-result-overlay d-flex flex-column align-center justify-center">
            <v-avatar class="mb-4 border-cyan glow-cyan" size="120">
              <v-img v-if="roundWinner && !roundWinner.startsWith('team-')" :src="getPlayerAvatar(roundWinner)" />
              <v-icon v-else-if="roundWinner && roundWinner.startsWith('team-')" color="cyan-accent-2" icon="mdi-account-group" size="80" />
              <v-icon v-else-if="isRoundTie" color="amber-accent-2" icon="mdi-handshake" size="80" />
              <v-icon v-else color="grey-lighten-1" icon="mdi-timer-off" size="80" />
            </v-avatar>
            <h2 class="text-h2 font-weight-black text-cyan-accent-2 mb-2 italic">
              {{ roundWinner ? $t('multiplayerLobby.roundWinner') : (isRoundTie ? $t('multiplayerLobby.tie') : $t('multiplayerLobby.timeout')) }}
            </h2>
            <h1 class="text-h1 font-weight-black text-white glow-text">
              {{ roundWinner ? (roundWinner.startsWith('team-') ? $t('multiplayerLobby.team') + ' ' + roundWinner.split('-')[1] : (roundWinner === astroStore.user ? $t('multiplayerLobby.you') : roundWinner)) : (isRoundTie ? $t('multiplayerLobby.tie') : '-') }}
            </h1>
          </div>
        </transition>
      </div>
    </transition>

    <!-- Pantalla de Resultados Final -->
    <MatchResultScreen
      v-if="showMatchResult"
      :is-host="isHost"
      :is-teammate="isTeammate"
      :is-tie="matchWinnerName === null"
      :opponent-name="opponentName"
      :scores="finalScores"
      :total-rounds="multiplayerStore.room?.gameConfig?.totalRounds || 0"
      :winner="matchWinnerName"
      @rematch="requestRematch"
      @return-to-lobby="returnToLobby"
    />

    <div v-if="!activeGameComponent && multiplayerStore.room?.status !== 'PLAYING' && multiplayerStore.room?.status !== 'MATCH_STARTING'" class="w-100">
      <div class="mb-10 text-center">
        <div class="d-flex align-center justify-center mb-6">
          <v-icon class="mr-4" color="orange-accent-2" icon="mdi-sword-cross" size="x-large" />
          <h1 class="text-h4 font-weight-bold text-white tracking-wide">{{ $t('multiplayerLobby.title') }}</h1>
        </div>
        <p class="text-subtitle-1 text-grey-lighten-1">{{ $t('multiplayerLobby.subtitle') }}</p>
      </div>

      <v-row>
        <!-- Pantalla Principal de Misión -->
        <v-col cols="12" md="8">
          <!-- VISTA: EN UNA SALA ACTIVA -->
          <v-card v-if="multiplayerStore.room" class="mission-control-panel rounded-xl overflow-hidden d-flex flex-column" elevation="12" style="max-height: 80vh;">
            <div class="mission-header pa-6 d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <v-icon class="mr-4" color="cyan-accent-2" icon="mdi-shield-star" size="36" />
                <div>
                  <div class="text-overline text-cyan-accent-2 line-height-1">{{ $t('multiplayerLobby.missionInProgress') }}</div>
                  <h2 class="text-h4 font-weight-black text-white tracking-widest">{{ $t('multiplayerLobby.room', { id: multiplayerStore.room.id }) }}</h2>
                </div>
              </div>
              <v-btn
                class="px-6 font-weight-bold"
                color="error"
                rounded="pill"
                size="small"
                variant="tonal"
                @click="multiplayerStore.leaveRoom()"
              >
                <v-icon icon="mdi-logout" start />
                {{ $t('multiplayerLobby.abort') }}
              </v-btn>
            </div>

            <div class="pa-8 flex-grow-1 overflow-y-auto custom-scroll">
              <div class="d-flex align-center mb-8">
                <h3 class="text-h6 text-white font-weight-bold mr-4">{{ $t('multiplayerLobby.currentCrew') }} (<span class="text-cyan-accent-2">{{ multiplayerStore.room?.players?.length || 0 }}</span> / {{ multiplayerStore.room?.maxPlayers || 4 }})</h3>
                <v-divider class="flex-grow-1 border-opacity-25" color="cyan-lighten-4" />
              </div>

              <v-row class="mb-4">
                <v-col
                  v-for="player in multiplayerStore.room.players"
                  :key="getPlayerName(player)"
                  cols="12"
                  lg="3"
                  md="4"
                  sm="6"
                >
                  <v-card 
                    class="crew-card pa-4 rounded-xl text-center" 
                    :class="'team-' + (getPlayerTeam(getPlayerName(player)) || 1)"
                    variant="outlined"
                  >
                    <v-badge
                      v-if="getPlayerName(player) === multiplayerStore.room.host"
                      color="amber-accent-2"
                      icon="mdi-crown"
                      location="top right"
                      offset-x="10"
                      offset-y="10"
                      overlap
                    >
                      <v-avatar class="mb-3 player-glow-avatar" size="80">
                        <v-img alt="Avatar" cover :src="getPlayerAvatar(getPlayerName(player))" />
                      </v-avatar>
                    </v-badge>
                    <v-avatar v-else class="mb-3 player-glow-avatar" size="80">
                      <v-img alt="Avatar" cover :src="getPlayerAvatar(getPlayerName(player))" />
                    </v-avatar>

                    <div class="text-h6 font-weight-bold text-white mb-1">{{ getPlayerName(player) }}</div>

                    <div v-if="player.level" class="text-caption text-cyan-accent-1 mb-2 font-weight-bold">
                      {{ $t('multiplayerLobby.level') }} {{ player.level }} · {{ getRankName(player.level) }}
                    </div>

                    <v-chip
                      v-if="getPlayerName(player) === multiplayerStore.room.host"
                      class="text-black font-weight-black px-3 mb-2"
                      color="amber-accent-2"
                      size="x-small"
                      variant="flat"
                    >
                      {{ $t('multiplayerLobby.commander') }}
                    </v-chip>
                    <v-chip
                      v-else
                      class="font-weight-bold px-3 mb-2"
                      color="cyan-accent-1"
                      size="x-small"
                      variant="tonal"
                    >
                      {{ $t('multiplayerLobby.crewmate') }}
                    </v-chip>

                    <!-- Selector de Equipo con Flechas (Oculto en Carrera) -->
                    <div v-if="selectedModality !== '1vs1' && selectedModality !== 'carrera'" class="mt-4 team-arrow-selector d-flex align-center justify-center gap-2">
                      <v-btn
                        icon="mdi-chevron-left"
                        variant="text"
                        density="compact"
                        size="small"
                        :disabled="!isHost"
                        :color="getTeamColor(getPlayerTeam(getPlayerName(player)))"
                        @click="prevTeam(getPlayerName(player))"
                      />
                      
                      <div class="team-label-box px-4 py-1 rounded-pill" :class="'bg-' + getTeamColor(getPlayerTeam(getPlayerName(player)))">
                        <span class="text-caption font-weight-black text-black">
                          {{ getSquadName(getPlayerTeam(getPlayerName(player))) }}
                        </span>
                      </div>

                      <v-btn
                        icon="mdi-chevron-right"
                        variant="text"
                        density="compact"
                        size="small"
                        :disabled="!isHost"
                        :color="getTeamColor(getPlayerTeam(getPlayerName(player)))"
                        @click="cycleTeam(getPlayerName(player))"
                      />
                    </div>
                  </v-card>
                </v-col>

                <!-- Huecos Vacíos -->
                <v-col
                  v-for="n in ((multiplayerStore.room?.maxPlayers || 4) - (multiplayerStore.room.players?.length || 0))"
                  :key="'empty-' + n"
                  cols="12"
                  lg="3"
                  md="4"
                  sm="6"
                >
                  <v-card class="crew-card-empty pa-4 rounded-xl d-flex flex-column align-center justify-center h-100 border-dashed" min-height="180" variant="outlined">
                    <v-icon class="mb-2" color="grey-darken-1" icon="mdi-account-plus-outline" size="32" />
                    <div class="text-body-2 text-grey-darken-1">{{ $t('multiplayerLobby.waiting') }}</div>
                  </v-card>
                </v-col>
              </v-row>

              <div class="mt-12 d-flex flex-column align-center">
                <div v-if="isHost && selectedModality !== '1vs1' && selectedModality !== 'carrera'" class="team-actions mb-4 d-flex gap-3">
                  <v-btn
                    color="cyan-accent-2"
                    prepend-icon="mdi-dice-5"
                    rounded="pill"
                    variant="tonal"
                    @click="randomizeTeams"
                  >
                    {{ $t('multiplayerLobby.randomizeTeams') }}
                  </v-btn>
                </div>

                <v-btn
                  v-if="isHost"
                  class="start-mission-btn rounded-pill px-12 font-weight-black"
                  color="orange-accent-3"
                  :disabled="(multiplayerStore.room?.players?.length || 0) < 2 || !allPlayersHaveTeam"
                  elevation="12"
                  size="x-large"
                  @click="multiplayerStore.startMatch()"
                >
                  {{ $t('multiplayerLobby.launchNow') }}
                </v-btn>
                <div v-else class="waiting-broadcast d-flex align-center">
                  <v-progress-circular
                    class="mr-3"
                    color="amber-accent-2"
                    indeterminate
                    size="20"
                    width="2"
                  />
                  <span class="text-amber-accent-2 font-weight-bold">{{ $t('multiplayerLobby.waitingOrders') }}</span>
                </div>
              </div>
            </div>
          </v-card>

          <!-- VISTA: SIN SALA (CREAR O UNIRSE) -->
          <div v-else>
            <v-card class="setup-panel pa-6 rounded-xl" elevation="4">
              <div class="text-center mb-6">
                <v-icon class="mb-2" color="cyan-accent-2" icon="mdi-orbit" size="48" />
                <h3 class="text-h5 font-weight-black text-white">{{ $t('multiplayerLobby.prepareExpedition') }}</h3>
              </div>

              <v-row justify="center">
                <v-col cols="12" sm="10">
                  <!-- Sección Crear -->
                  <div class="setup-section mb-8 pa-4 rounded-xl border-light">
                    <div class="d-flex align-center justify-space-between mb-4">
                      <div class="d-flex align-center">
                        <v-icon class="mr-2" color="cyan-accent-2" icon="mdi-plus-circle-outline" />
                        <span class="text-subtitle-1 font-weight-bold text-white">{{ $t('multiplayerLobby.newMission') }}</span>
                      </div>
                      <v-switch
                        v-model="isPublic"
                        class="privacy-switch"
                        color="cyan-accent-2"
                        density="compact"
                        hide-details
                        inset
                        :label="isPublic ? $t('multiplayerLobby.public') : $t('multiplayerLobby.private')"
                      />
                    </div>

                    <v-btn
                      block
                      class="rounded-pill font-weight-bold h-custom-btn text-black shadow-cyan"
                      color="cyan-accent-2"
                      size="large"
                      @click="createRoom"
                    >
                      {{ $t('multiplayerLobby.startRoom') }}
                    </v-btn>
                  </div>

                  <v-divider class="mb-8" color="rgba(255,255,255,0.1)" />

                  <!-- Sección Unirse -->
                  <div class="setup-section pa-4 rounded-xl border-light">
                    <div class="d-flex align-center mb-4">
                      <v-icon class="mr-2" color="amber-accent-2" icon="mdi-key-variant" />
                      <span class="text-subtitle-1 font-weight-bold text-white">{{ $t('multiplayerLobby.joinByCode') }}</span>
                    </div>
                    <v-text-field
                      v-model="roomCode"
                      bg-color="rgba(255,255,255,0.05)"
                      class="room-code-input mb-4"
                      hide-details
                      maxlength="6"
                      :placeholder="$t('multiplayerLobby.codePlaceholder')"
                      rounded="pill"
                      variant="solo-filled"
                    />
                    <v-btn
                      block
                      class="rounded-pill font-weight-bold text-black h-custom-btn shadow-amber"
                      color="amber-accent-2"
                      :disabled="!roomCode || roomCode.length < 6"
                      size="large"
                      @click="joinByCode"
                    >
                      {{ $t('multiplayerLobby.dock') }}
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-card>
          </div>
        </v-col>

        <!-- Panel Lateral -->
        <v-col cols="12" md="4">
          <!-- SELECCIONA MODALITAT -->
          <v-card class="side-panel-card rounded-xl pa-4 mb-6" elevation="0">
            <h3 class="text-subtitle-1 font-weight-bold text-white mb-4 d-flex align-center">
              <v-icon class="mr-2" color="cyan-accent-2" icon="mdi-gamepad-variant" />
              {{ $t('multiplayerLobby.selectModality') }}
            </h3>

            <!-- CONFIGURACIÓN DE SALA (Solo Host en Lobby) -->
            <div v-if="multiplayerStore.room && isHost" class="room-settings-in-lobby mb-6 pa-4 rounded-xl bg-slate-900 border-light">
              <div class="mb-4">
                <div class="text-caption text-cyan-accent-2 font-weight-bold mb-2 tracking-widest text-uppercase">{{ $t('multiplayerLobby.maxPlayers') }}</div>
                <v-select
                  v-model="maxPlayers"
                  bg-color="rgba(255,255,255,0.05)"
                  class="player-limit-select-mini"
                  density="compact"
                  hide-details
                  :items="[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]"
                  :menu-props="{ maxHeight: '300' }"
                  prepend-inner-icon="mdi-account-group"
                  rounded="pill"
                  variant="solo-filled"
                >
                  <template #selection="{ item }">
                    <span class="text-white font-weight-bold text-caption">{{ item.title }} {{ $t('multiplayerLobby.astronauts') }}</span>
                  </template>
                </v-select>
              </div>

              <div>
                <div class="text-caption text-orange-accent-2 font-weight-bold mb-2 tracking-widest text-uppercase">{{ $t('multiplayerLobby.roundsCount') }}</div>
                <v-select
                  v-model="pointsToWin"
                  bg-color="rgba(255,255,255,0.05)"
                  class="points-limit-select-mini"
                  density="compact"
                  hide-details
                  :items="[1, 2, 3, 4, 5]"
                  prepend-inner-icon="mdi-trophy-outline"
                  rounded="pill"
                  variant="solo-filled"
                >
                  <template #selection="{ item }">
                    <span class="text-white font-weight-bold text-caption">{{ item.title }} {{ $t('multiplayerLobby.rounds') }}</span>
                  </template>
                </v-select>
              </div>
            </div>

            <v-row dense>
              <v-col v-for="mode in modalities" :key="mode.id" cols="6">
                <v-card
                  class="modality-card pa-3 d-flex flex-column align-center justify-center text-center rounded-lg cursor-pointer"
                  :class="{ 'active-mode': selectedModality === mode.id, 'disabled-mode': !mode.active }"
                  variant="flat"
                  @click="mode.active ? selectedModality = mode.id : null"
                >
                  <v-icon class="mb-2" :color="selectedModality === mode.id ? 'cyan-accent-2' : 'grey-darken-1'" :icon="mode.icon" size="28" />
                  <div class="text-caption font-weight-black line-height-1" :class="selectedModality === mode.id ? 'text-white' : 'text-grey-darken-1'">
                    {{ $te('multiplayerLobby.modalities.' + mode.id) ? $t('multiplayerLobby.modalities.' + mode.id) : mode.name }}
                  </div>
                  <v-chip
                    v-if="!mode.active"
                    class="mt-2 text-7px"
                    color="grey-darken-2"
                    size="x-small"
                    variant="tonal"
                  >{{ $t('multiplayerLobby.comingSoon') }}</v-chip>
                </v-card>
              </v-col>
            </v-row>

            <!-- SELECTOR DE RUTA VISUAL (Solo en Carrera) -->
            <div v-if="selectedModality === 'carrera'" class="mt-6">
              <div class="text-overline text-cyan-accent-2 font-weight-bold mb-3 tracking-widest d-flex align-center">
                <v-icon icon="mdi-map-marker-path" size="small" class="mr-2" />
                {{ $t('multiplayerLobby.selectRoute') }}
              </div>
              
              <v-row dense>
                <v-col v-for="(route, id) in raceRoutes" :key="id" cols="12">
                  <v-card
                    class="route-card mb-2 pa-3 rounded-xl cursor-pointer transition-all"
                    :class="{ 'active-route': selectedRouteId === id, 'opacity-50': !isHost && selectedRouteId !== id }"
                    variant="flat"
                    @click="isHost ? selectedRouteId = id : null"
                  >
                    <div class="d-flex align-center">
                      <div class="route-icon-box mr-4 rounded-lg d-flex align-center justify-center">
                        <v-icon :icon="id === 'SISTEMA_SOLAR' ? 'mdi-earth' : 'mdi-vortex'" color="cyan-accent-2" />
                      </div>
                      <div class="flex-grow-1">
                        <div class="text-subtitle-2 font-weight-black text-white">{{ route.name }}</div>
                        <div class="text-7px text-grey-lighten-1">{{ route.planets.length }} PLANETAS · {{ route.sequence.length }} MISIONES</div>
                      </div>
                      <v-radio v-if="isHost" :model-value="selectedRouteId === id" color="cyan-accent-2" hide-details density="compact" />
                    </div>
                    
                    <div v-if="selectedRouteId === id" class="mt-3 planet-mini-path d-flex align-center gap-1">
                      <template v-for="(planet, idx) in route.planets" :key="idx">
                        <div class="mini-node" :title="planet" />
                        <div v-if="idx < route.planets.length - 1" class="mini-connector" />
                      </template>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-card>

          <!-- Invitaciones -->
          <v-card v-if="multiplayerStore.invitations.length > 0" class="side-panel-card rounded-xl pa-4 mb-6" elevation="0">
            <h3 class="text-subtitle-1 font-weight-bold text-white mb-4 d-flex align-center">
              <v-icon class="mr-2" color="orange-accent-2" icon="mdi-email-alert" />
              {{ $t('multiplayerLobby.incomingCalls', { count: multiplayerStore.invitations.length }) }}
            </h3>
            <v-list bg-color="transparent">
              <v-list-item v-for="(inv, index) in multiplayerStore.invitations" :key="index" class="px-2 invitation-item mb-2 rounded-lg">
                <div class="d-flex align-center w-100">
                  <div class="flex-grow-1">
                    <div class="text-body-2 text-white"><span v-html="$t('multiplayerLobby.requestSupport', { user: `<b>${inv.from}</b>` })" /></div>
                  </div>
                  <div class="d-flex gap-2">
                    <v-btn
                      color="success"
                      icon="mdi-check"
                      size="x-small"
                      variant="flat"
                      @click="acceptInvitation(inv, index)"
                    />
                    <v-btn
                      color="error"
                      icon="mdi-close"
                      size="x-small"
                      variant="tonal"
                      @click="rejectInvitation(index)"
                    />
                  </div>
                </div>
              </v-list-item>
            </v-list>
          </v-card>

          <!-- Salas Disponibles (Misiones Públicas) -->
          <v-card v-if="!multiplayerStore.room" class="side-panel-card rounded-xl pa-0 mb-6 overflow-hidden" elevation="8">
            <div class="side-panel-header pa-4 d-flex align-center">
              <v-icon class="mr-3" color="cyan-accent-2" icon="mdi-map-search" />
              <h3 class="text-subtitle-1 font-weight-black text-white tracking-widest">{{ $t('multiplayerLobby.missionNetwork') }}</h3>
            </div>

            <div class="pa-4">
              <v-list v-if="multiplayerStore.availableRooms.length > 0" bg-color="transparent" class="pa-0">
                <v-fade-transition group>
                  <v-list-item v-for="room in multiplayerStore.availableRooms" :key="room.id" class="px-3 py-4 mb-4 mission-card-v3 rounded-xl">
                    <div class="d-flex flex-column w-100">
                      <div class="d-flex align-center justify-space-between mb-3">
                        <div class="d-flex align-center">
                          <div class="mission-status-led mr-2" />
                          <div class="text-body-2 font-weight-black text-white">{{ $t('multiplayerLobby.sector', { id: room.id }) }}</div>
                        </div>
                        <v-chip class="rounded-pill font-weight-bold" color="cyan-lighten-4" size="x-small" variant="tonal">
                          {{ room.players.length }}/{{ room.maxPlayers || 4 }} SLOT
                        </v-chip>
                      </div>

                      <div class="d-flex align-center mb-4">
                        <v-avatar class="mr-3 border-thin" size="32">
                          <v-img cover :src="getPlayerAvatar(room.host)" />
                        </v-avatar>
                        <div>
                          <div class="text-caption text-grey-lighten-1 line-height-1">{{ $t('multiplayerLobby.commander') }}</div>
                          <div class="text-body-2 font-weight-bold text-white">{{ room.host }}</div>
                        </div>
                      </div>

                      <v-btn
                        block
                        class="rounded-pill font-weight-black text-black action-glow-btn"
                        color="cyan-accent-2"
                        size="small"
                        variant="elevated"
                        @click="multiplayerStore.joinRoom(room.id)"
                      >
                        {{ $t('multiplayerLobby.establishLink') }}
                      </v-btn>
                    </div>
                  </v-list-item>
                </v-fade-transition>
              </v-list>
              <div v-else class="text-center py-12 empty-discovery rounded-xl">
                <v-icon class="mb-4" color="rgba(255, 255, 255, 0.05)" icon="mdi-wifi-off" size="48" />
                <p class="text-caption text-grey-darken-1 font-weight-bold">{{ $t('multiplayerLobby.noSignals') }}</p>
              </div>
            </div>
          </v-card>

          <!-- Reclutamiento -->
          <v-card v-if="multiplayerStore.room" class="side-panel-card rounded-xl pa-0 overflow-hidden" elevation="4">
            <div class="pa-4 border-bottom-light">
              <h3 class="text-subtitle-1 font-weight-bold text-white d-flex align-center">
                <v-icon class="mr-2" color="cyan-accent-2" icon="mdi-account-group" />
                {{ $t('multiplayerLobby.recruitCrew') }}
              </h3>
            </div>
            <v-list bg-color="transparent" class="pa-0 recruit-list" max-height="450px">
              <template v-if="friendsList.length > 0">
                <v-list-subheader class="text-cyan-accent-2 font-weight-bold text-overline pb-0">{{ $t('multiplayerLobby.friends') }}</v-list-subheader>
                <v-list-item v-for="explorer in friendsList" :key="explorer.user" class="px-4 py-3 recruit-item border-bottom-light">
                  <template #prepend>
                    <v-avatar class="mr-3 border-light" size="40">
                      <v-img cover :src="getAvatarUrl(explorer.avatar, explorer.user)" />
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-body-2 text-white font-weight-bold">{{ explorer.user }}</v-list-item-title>
                  <v-list-item-subtitle class="text-caption text-grey-darken-1">
                    Lv. {{ explorer.level }} · {{ getRankName(explorer.level) }}
                  </v-list-item-subtitle>
                  <template #append>
                    <v-btn
                      color="cyan-accent-2"
                      :disabled="multiplayerStore.room?.players?.some(p => (p.username || p) === explorer.user) || (multiplayerStore.room?.players?.length >= (multiplayerStore.room?.maxPlayers || 4))"
                      icon="mdi-bullhorn-outline"
                      size="small"
                      variant="text"
                      @click="multiplayerStore.inviteFriend(explorer.user)"
                    />
                  </template>
                </v-list-item>
              </template>

              <template v-if="otherExplorersList.length > 0">
                <v-list-subheader class="text-grey-lighten-1 font-weight-bold text-overline pb-0 mt-2">{{ $t('multiplayerLobby.possibleCrewmates') }}</v-list-subheader>
                <v-list-item v-for="explorer in otherExplorersList" :key="explorer.user" class="px-4 py-3 recruit-item border-bottom-light">
                  <template #prepend>
                    <v-avatar class="mr-3 border-light" size="40">
                      <v-img cover :src="getAvatarUrl(explorer.avatar, explorer.user)" />
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-body-2 text-white font-weight-bold">{{ explorer.user }}</v-list-item-title>
                  <v-list-item-subtitle class="text-caption text-grey-darken-1">
                    Lv. {{ explorer.level }} · {{ getRankName(explorer.level) }}
                  </v-list-item-subtitle>
                  <template #append>
                    <v-btn
                      color="cyan-accent-2"
                      :disabled="multiplayerStore.room?.players?.some(p => (p.username || p) === explorer.user) || (multiplayerStore.room?.players?.length >= (multiplayerStore.room?.maxPlayers || 4))"
                      icon="mdi-bullhorn-outline"
                      size="small"
                      variant="text"
                      @click="multiplayerStore.inviteFriend(explorer.user)"
                    />
                  </template>
                </v-list-item>
              </template>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  // Importar juegos
  import RadarScan from '@/components/games/RadarScan.vue'
  import RadioSignal from '@/components/games/RadioSignal.vue'

  import RhymeSquad from '@/components/games/RhymeSquad.vue'
  import RouletteOverlay from '@/components/games/RouletteOverlay.vue'
  import SpelledRosco from '@/components/games/SpelledRosco.vue'
  import SyllableQuest from '@/components/games/SyllableQuest.vue'
  import SymmetryBreaker from '@/components/games/SymmetryBreaker.vue'
  import WordConstruction from '@/components/games/WordConstruction.vue'
  import CoopScoreBar from '@/components/multiplayer/CoopScoreBar.vue'
  import RaceHUD from '@/components/multiplayer/RaceHUD.vue'
  import RaceMap from '@/components/multiplayer/RaceMap.vue'
  import MatchResultScreen from '@/components/multiplayer/MatchResultScreen.vue'
  import { useAstroStore } from '@/stores/astroStore'
  import { useMultiplayerStore } from '@/stores/multiplayerStore'

  const { t } = useI18n()
  const router = useRouter()
  const astroStore = useAstroStore()
  const multiplayerStore = useMultiplayerStore()

  const isHost = computed(() => {
    return multiplayerStore.room?.host === astroStore.user
  })

  const gameComponents = {
    RadarScan,
    RadioSignal,
    RhymeSquad,
    SpelledRosco,
    SymmetryBreaker,
    WordConstruction,
    SyllableQuest,
  }

  const availableGames = Object.keys(gameComponents)
  
  const raceRoutes = {
    'SISTEMA_SOLAR': {
      name: 'Sistema Solar',
      sequence: ['WordConstruction', 'RadioSignal', 'RadarScan', 'SymmetryBreaker', 'SpelledRosco', 'SyllableQuest', 'RhymeSquad'],
      planets: ['Terra', 'Mart', 'Júpiter', 'Saturn', 'Urà', 'Neptú'],
    },
    'NEBULOSA_KALI': {
      name: 'Nebulosa Kali',
      sequence: ['RadarScan', 'RadioSignal', 'SyllableQuest', 'WordConstruction'],
      planets: ['Kali-1', 'Kali-2', 'Kali-Alpha', 'Vortex'],
    },
  }

  const selectedRouteId = ref('SISTEMA_SOLAR')
  const RACE_SEQUENCE = computed(() => raceRoutes[selectedRouteId.value].sequence)
  const currentPlanets = computed(() => raceRoutes[selectedRouteId.value].planets)

  const snackbar = ref({ show: false, text: '', color: 'success' })
  const isPublic = ref(true)
  const maxPlayers = ref(Number(localStorage.getItem('astro_mp_maxPlayers')) || 4)
  const pointsToWin = ref(Number(localStorage.getItem('astro_mp_pointsToWin')) || 3)
  const roomCode = ref('')
  const showRoulette = ref(false)
  const showBriefing = ref(false)
  const briefingCountdown = ref(10)
  let briefingTimer = null
  const activeGameComponent = shallowRef(null)
  const roundWinner = ref(null)
  const isRoundTie = ref(false)
  const showRoundResults = ref(false)
  const showMatchResult = ref(false)
  const finalScores = ref({})
  const matchWinnerName = ref(null)
  const selectedModality = ref(localStorage.getItem('astro_mp_modality') || '1vs1')

  const globalTimeLeft = computed(() => multiplayerStore.timeLeft)

  watch(globalTimeLeft, (newVal) => {
    if (newVal <= 0 && multiplayerStore.room?.status === 'PLAYING' && isHost.value) {
      console.log('TIEMPO AGOTADO: El host fuerza el fin de la ronda')
      multiplayerStore.submitRoundResult()
    }
  })

  // Watcher para el combustible en modo carrera
  watch(() => multiplayerStore.raceFuel, (newFuel) => {
    if (newFuel <= 0 && multiplayerStore.room?.status === 'PLAYING') {
      console.log('COMBUSTIBLE AGOTADO: Game Over local')
      onGameFinished() // O forzar submitRoundResult
    }
  })

  const modalities = [
    { id: '1vs1', name: 'Mode 1vs1', icon: 'mdi-sword-cross', active: true },
    { id: '2vs2', name: 'Mode 2vs2', icon: 'mdi-account-group', active: true },
    { id: 'boss', name: 'Mode Boss', icon: 'mdi-skull', active: false },
    { id: 'carrera', name: 'Carrera Espacial', icon: 'mdi-rocket-launch', active: true },
    { id: 'torneig', name: 'Torneig', icon: 'mdi-trophy-variant', active: false },
  ]

  const ALL_TITLES = [
    { name: 'El Imparable', key: 'titleUnstoppable' },
    { name: 'Leyenda Galáctica', key: 'titleLegend' },
    { name: 'Destructor de Asteroides', key: 'titleDestroyer' },
  ]

  function getTitleKey (titleName) {
    if (!titleName) return ''
    const cleanName = titleName.replace('Título: ', '')
    const title = ALL_TITLES.find(t => t.name === cleanName)
    return title ? title.key : ''
  }

  function getRankName (level) {
    const index = Math.min(Math.floor(((level || 1) - 1) / 10), 14)
    return t(`ranks.${index}`)
  }

  watch(() => multiplayerStore.room?.status, newStatus => {
    if (!newStatus) return

    if (newStatus === 'PLAYING' || newStatus === 'MATCH_STARTING') {
      showRoulette.value = false
      roundWinner.value = null
      showRoundResults.value = false

      if (multiplayerStore.room?.gameConfig?.mode !== 'RACE') {
        const gameName = multiplayerStore.room?.gameConfig?.currentGame
        if (gameName && gameComponents[gameName]) {
          activeGameComponent.value = gameComponents[gameName]
        }
      }
      return
    }

    switch (newStatus) {
      case 'ROULETTE': {
        showRoulette.value = true
        roundWinner.value = null
        showRoundResults.value = false
        activeGameComponent.value = null
        break
      }
      case 'ROUND_RESULTS': {
        showRoundResults.value = true
        if (isHost.value) {
          // Salto a la siguiente ronda mucho más rápido (3s en lugar de 8s)
          setTimeout(() => {
            if (multiplayerStore.room?.status === 'ROUND_RESULTS') {
              multiplayerStore.nextRound()
            }
          }, 1500)
        }
        break
      }
      case 'GAME_OVER':
      case 'MATCH_RESULTS': {
        showRoundResults.value = false
        activeGameComponent.value = null
        break
      }
      case 'LOBBY': {
        activeGameComponent.value = null
        showRoulette.value = false
        roundWinner.value = null
        showRoundResults.value = false
        showMatchResult.value = false
        matchWinnerName.value = null
        finalScores.value = {}
        break
      }
    }
  }, { immediate: true })

  const isTransitioning = ref(false)

  watch(() => multiplayerStore.lastMessage, msg => {
    if (!msg) return

    if (msg.type === 'MATCH_STARTING') {
      showRoulette.value = false
      isTransitioning.value = true
      
      const gameName = multiplayerStore.room?.gameConfig?.currentGame
      if (gameName && gameComponents[gameName] && multiplayerStore.room?.gameConfig?.mode !== 'RACE') {
        setTimeout(() => {
          activeGameComponent.value = gameComponents[gameName]
          isTransitioning.value = false
          startBriefing()
        }, 300)
      } else {
        isTransitioning.value = false
      }
    }

    if (msg.type === 'ROUND_ENDED_BY_WINNER') {
      roundWinner.value = msg.winner
      isRoundTie.value = msg.tie || false
    }

    if (msg.type === 'MATCH_FINISHED') {
      matchWinnerName.value = msg.winner ?? null
      finalScores.value = msg.room?.gameConfig?.scores || {}
      showMatchResult.value = true
      activeGameComponent.value = null
      showRoundResults.value = false
    }

    if (msg.type === 'GAME_ACTION' && msg.action?.type === 'SABOTAGE') {
      handleSabotageNotification(msg)
    }
  })

  const currentAnomaly = ref(null)
  const activeNotifications = ref([])
  let notifCounter = 0

  function handleSabotageNotification (data) {
    const isMe = data.from === astroStore.user
    const amount = data.action.amount || 0

    if (data.action.subtype === 'REDUCE_TIME') {
      const id = notifCounter++
      activeNotifications.value.push({
        id,
        amount: isMe ? 10 : -amount,
        from: data.from,
      })

      setTimeout(() => {
        activeNotifications.value = activeNotifications.value.filter(n => n.id !== id)
      }, 2500)
    }
  }

  watch(() => multiplayerStore.room?.players?.length, (newLen, oldLen) => {
    if (newLen > (oldLen || 0)) {
      astroStore.fetchAllUsers()
    }
  }, { immediate: true })

  watch(() => multiplayerStore.error, newError => {
    if (newError) {
      showMessage(newError, 'error')
      multiplayerStore.error = null
    }
  })



  const friendsList = computed(() => {
    if (!astroStore.explorers) return []
    return astroStore.explorers.filter(e =>
      e.user !== astroStore.user
      && astroStore.friends?.includes(e.user),
    )
  })

  const otherExplorersList = computed(() => {
    if (!astroStore.explorers) return []
    return astroStore.explorers.filter(e =>
      e.user !== astroStore.user
      && !astroStore.friends?.includes(e.user),
    )
  })

  const opponentName = computed(() => {
    if (!multiplayerStore.room) return t('multiplayerLobby.opponent')
    const op = multiplayerStore.room.players.find(p => (p.username || p) !== astroStore.user)
    return op?.username || op || t('multiplayerLobby.opponent')
  })

  const opponentDisplayName = computed(() => {
    const username = opponentName.value
    if (username === t('multiplayerLobby.opponent')) return username
    const explorer = astroStore.explorers?.find(e => e.user === username)
    return explorer?.displayName || username
  })

  const opponentTitle = computed(() => {
    const opName = opponentName.value
    if (opName === t('multiplayerLobby.opponent')) return null
    const explorer = astroStore.explorers?.find(e => e.user === opName)
    return explorer?.selectedTitle || null
  })

  const isTeammate = computed(() => {
    if (!multiplayerStore.room) return false

    // Juegos que usan el marcador unificado estilo Just Dance
    const COOP_GAMES = ['RadioSignal', 'SymmetryBreaker', 'WordConstruction', 'SyllableQuest', 'RadarScan', 'SpelledRosco']
    if (COOP_GAMES.includes(multiplayerStore.room?.gameConfig?.currentGame)) return true

    if (!multiplayerStore.room?.gameConfig?.teams) return false
    const myTeam = multiplayerStore.room?.gameConfig.teams[astroStore.user]
    const opponentTeam = multiplayerStore.room?.gameConfig.teams[opponentName.value]
    return myTeam && myTeam === opponentTeam
  })

  const allPlayersHaveTeam = computed(() => {
    if (!multiplayerStore.room) return false
    if (selectedModality.value === '1vs1' || selectedModality.value === 'carrera') return true
    const teams = multiplayerStore.room.gameConfig?.teams || {}
    return multiplayerStore.room.players.every(p => teams[getPlayerName(p)])
  })

  const totalCoopScore = computed(() => {
    if (!multiplayerStore.room) return 0

    // Puntuación acumulada de rondas anteriores
    const matchScores = multiplayerStore.room?.gameConfig?.scores || {}
    const prevScore = Math.max(0, ...Object.values(matchScores).map(v => v || 0))

    // Puntuación de la ronda actual (máximo de los jugadores si es coop total, o suma si es por equipos)
    // Para simplificar, si hay equipos usamos la lógica de getTeamScore
    const currentRoundScore = Math.max(0, ...Object.values(multiplayerStore.roundScores).map(v => v || 0))

    return prevScore + currentRoundScore
  })

  const teamsList = computed(() => {
    if (!multiplayerStore.room?.gameConfig?.teams) return []
    const teams = multiplayerStore.room.gameConfig.teams
    const uniqueTeamIds = [...new Set(Object.values(teams))].sort()
    return uniqueTeamIds.map(id => ({
      id,
      name: t('multiplayerLobby.team') + ' ' + id,
      theme: id == '1' ? 'red' : (id == '2' ? 'green' : (id == '3' ? 'amber' : 'purple')),
    }))
  })

  function getTeamScore (teamId) {
    if (!multiplayerStore.room) return 0
    const teams = multiplayerStore.room.gameConfig.teams || {}
    const roundScores = multiplayerStore.roundScores || {}
    const matchScores = multiplayerStore.room.gameConfig.scores || {}

    let total = 0
    for (const [user, tId] of Object.entries(teams)) {
      if (String(tId) === String(teamId)) {
        total += (matchScores[user] || 0) + (roundScores[user] || 0)
      }
    }
    return total
  }

  function getTeamTime (teamId) {
    if (!multiplayerStore.room) return null
    // Si hay un temporizador específico por equipo en el config, lo usamos
    const teamTimers = multiplayerStore.room.gameConfig?.teamTimers || {}
    if (teamTimers[teamId] !== undefined) return teamTimers[teamId]

    // Por defecto usamos el global de la tienda
    return multiplayerStore.timeLeft
  }

  function getTeamColor (tId) {
    const colors = {
      1: 'red-accent-3',
      2: 'green-accent-3',
      3: 'amber-accent-2',
      4: 'purple-accent-2',
    }
    return colors[tId] || 'grey'
  }

  function getPlayerTeam (playerName) {
    return multiplayerStore.room?.gameConfig?.teams?.[playerName] || null
  }

  function assignTeam (playerName, teamId) {
    if (!isHost.value && playerName !== astroStore.user) return
    const currentTeams = { ...multiplayerStore.room?.gameConfig?.teams, [playerName]: teamId }
    multiplayerStore.updateGameConfig({ teams: currentTeams })
  }

  function getSquadName (tId) {
    const names = {
      1: 'ALPHA',
      2: 'BETA',
      3: 'GAMMA',
      4: 'DELTA',
    }
    return names[tId] || 'SQUAD'
  }

  function cycleTeam (playerName) {
    if (!isHost.value) return
    const currentTeam = getPlayerTeam(playerName) || 1
    const nextTeam = (currentTeam % 4) + 1
    assignTeam(playerName, nextTeam)
  }

  function prevTeam (playerName) {
    if (!isHost.value) return
    const currentTeam = getPlayerTeam(playerName) || 1
    let nextTeam = currentTeam - 1
    if (nextTeam < 1) nextTeam = 4
    assignTeam(playerName, nextTeam)
  }

  function randomizeTeams () {
    if (!isHost.value) return
    const players = multiplayerStore.room.players.map(p => getPlayerName(p))
    const shuffled = [...players].sort(() => Math.random() - 0.5)
    const newTeams = {}

    // Repartir en equipos de 2 según la modalidad
    let teamSize = 2
    if (selectedModality.value === '1vs1') teamSize = 1

    for (const [i, p] of shuffled.entries()) {
      newTeams[p] = Math.floor(i / teamSize) + 1
    }

    multiplayerStore.updateGameConfig({ teams: newTeams })
  }

  watch(pointsToWin, newVal => {
    if (isHost.value && multiplayerStore.room) {
      multiplayerStore.updateGameConfig({ pointsToWin: newVal })
    }
  })

  function getAvatarUrl (avatarName, username) {
    const safeUsername = (username && typeof username === 'object') ? (username.name || username.user || 'Astronauta') : username
    if (avatarName && typeof avatarName === 'string' && (avatarName.includes('.jpg') || avatarName.includes('.png'))) {
      return `/${avatarName.trim()}`
    }
    if (avatarName && typeof avatarName === 'string' && avatarName.toLowerCase().startsWith('astronauta')) {
      return `/${avatarName.trim()}`
    }
    if (safeUsername && safeUsername !== '[object Object]') {
      return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(safeUsername)}`
    }
    return '/Astronauta_blanc.jpg'
  }

  function getPlayerName (player) {
    if (!player) return 'Unknown'

    // Si es un string (username), buscar displayName en explorers
    if (typeof player === 'string') {
      const explorer = astroStore.explorers?.find(e => e.user === player)
      return explorer?.displayName || player
    }

    // Si es un objeto, buscar displayName en el propio objeto o en explorers
    const username = player.username || player.user || player.id
    if (player.displayName) return player.displayName
    if (username) {
      const explorer = astroStore.explorers?.find(e => e.user === username)
      if (explorer?.displayName) return explorer.displayName
    }

    const name = username
    if (name) {
      if (typeof name === 'string') return name
      if (typeof name === 'object' && name !== null) {
        return name.username || name.user || JSON.stringify(name)
      }
      return String(name)
    }

    return 'Jugador'
  }

  function getPlayerAvatar (username) {
    if (!username) return '/Astronauta_blanc.jpg'
    if (username === astroStore.user) {
      return getAvatarUrl(astroStore.avatar, username)
    }
    const explorer = astroStore.explorers?.find(e => e.user === username)
    if (explorer) {
      return getAvatarUrl(explorer.avatar, username)
    }
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`
  }

  function showMessage (text, color = 'success') {
    snackbar.value = { show: true, text, color }
  }

  function createRoom () {
    const initialConfig = {
      pointsToWin: selectedModality.value === 'carrera' ? 1 : pointsToWin.value,
      modality: selectedModality.value,
      mode: selectedModality.value === 'carrera' ? 'RACE' : 'NORMAL',
      routeId: selectedRouteId.value,
    }
    multiplayerStore.createRoom(astroStore.user, isPublic.value, maxPlayers.value, initialConfig)
  }

  function joinByCode () {
    if (roomCode.value) {
      multiplayerStore.joinRoom(roomCode.value.toUpperCase())
      roomCode.value = ''
    }
  }

  function acceptInvitation (inv, index) {
    multiplayerStore.joinRoom(inv.roomId)
    multiplayerStore.invitations.splice(index, 1)
    showMessage(t('multiplayerLobby.joiningRoom', { user: inv.from }))
  }

  function rejectInvitation (index) {
    multiplayerStore.invitations.splice(index, 1)
  }

  function onRouletteFinished () {
    if (isHost.value) {
      multiplayerStore.setRoomStatus('PLAYING')
    }
  }

  function onGameFinished (score) {
    if (multiplayerStore.room?.gameConfig?.mode === 'RACE') {
      // Recargar combustible
      multiplayerStore.rechargeFuel(25)
      
      // Marcar planeta actual como completado
      const completedPlanetId = multiplayerStore.raceProgress
      multiplayerStore.updateRaceProgress(completedPlanetId, true)
      currentAnomaly.value = null
      
      // Pequeño delay visual para la transición de vuelta al mapa
      isTransitioning.value = true
      setTimeout(() => {
        activeGameComponent.value = null // Volver al mapa
        isTransitioning.value = false
      }, 1500)
    } else {
      multiplayerStore.submitRoundResult()
    }
  }

  function onPlanetSelected ({ id, game }) {
    if (game && gameComponents[game]) {
      // Actualizar posición antes de entrar al juego
      multiplayerStore.updateRaceProgress(id, false)
      
      // Buscar anomalía del planeta
      const planetsData = {
        'PLANET_1': 'meteorits',
        'PLANET_2': 'nebulosa',
        'PLANET_3': 'raig-alienigena',
        'PLANET_4': 'raig-tempesta'
      }
      currentAnomaly.value = planetsData[id] || null

      isTransitioning.value = true
      setTimeout(() => {
        activeGameComponent.value = gameComponents[game]
        isTransitioning.value = false
      }, 1000)
    }
  }

  function returnToMap () {
    activeGameComponent.value = null
  }

  function returnToLobby () {
    showMatchResult.value = false
    activeGameComponent.value = null
  }

  function handleAbort () {
    if (isHost.value) {
      multiplayerStore.setRoomStatus('LOBBY')
    } else {
      multiplayerStore.leaveRoom()
      // Forzamos que se quede en esta página (el lobby) en lugar de redirigir a /plans
      // multiplayerStore.leaveRoom() suele redirigir, así que lo sobreescribimos si es necesario
      setTimeout(() => {
        if (router.currentRoute.value.path !== '/multiplayer') {
          router.push('/multiplayer')
        }
      }, 100)
    }
  }


  function requestRematch () {
    showMatchResult.value = false
    activeGameComponent.value = null
    showRoundResults.value = false
    multiplayerStore.startMatch()
  }

  // Persistencia de preferencias
  watch(selectedModality, (newVal) => localStorage.setItem('astro_mp_modality', newVal))
  watch(maxPlayers, (newVal) => {
    localStorage.setItem('astro_mp_maxPlayers', String(newVal))
    if (isHost.value && multiplayerStore.room) {
      multiplayerStore.updateGameConfig({ maxPlayers: newVal })
    }
  })
  watch(pointsToWin, (newVal) => {
    localStorage.setItem('astro_mp_pointsToWin', String(newVal))
    if (isHost.value && multiplayerStore.room) {
      multiplayerStore.updateGameConfig({ pointsToWin: newVal })
    }
  })

  watch(selectedRouteId, (newId) => {
    if (isHost.value && multiplayerStore.room) {
      multiplayerStore.updateGameConfig({ routeId: newId })
    }
  })

  watch(() => multiplayerStore.room?.gameConfig?.routeId, (newId) => {
    if (newId && newId !== selectedRouteId.value) {
      selectedRouteId.value = newId
    }
  })

  onMounted(() => {
    if (!multiplayerStore.isConnected) {
      multiplayerStore.connect()
    }
  })

  function startBriefing () {
    showBriefing.value = true
    briefingCountdown.value = 1.5
    
    if (briefingTimer) clearInterval(briefingTimer)
    
    briefingTimer = setInterval(() => {
      briefingCountdown.value--
      if (briefingCountdown.value <= 0) {
        clearInterval(briefingTimer)
        showBriefing.value = false
        // El juego ya está montado, simplemente el overlay se va y empieza la acción
      }
    }, 1000)
  }

  onUnmounted(() => {
    if (briefingTimer) clearInterval(briefingTimer)
  })
</script>

<style scoped>
.lobby-container {
  min-height: 100vh;
  background: radial-gradient(circle at top right, #0f172a 0%, #020617 100%);
  position: relative;
  overflow-x: hidden;
}

.mission-control-panel {
  background: rgba(15, 23, 42, 0.8) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 229, 255, 0.2) !important;
}

.mission-header {
  background: rgba(0, 229, 255, 0.05);
  border-bottom: 1px solid rgba(0, 229, 255, 0.1);
}

.crew-card {
  background: rgba(15, 23, 42, 0.4) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

.crew-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: transparent;
  transition: background 0.3s ease;
}

.crew-card:hover {
  transform: translateY(-8px);
  border-color: rgba(0, 229, 255, 0.3) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  background: rgba(15, 23, 42, 0.6) !important;
}

/* Bordes de equipo */
.crew-card.team-1 { border-top: 4px solid #ff5252 !important; }
.crew-card.team-2 { border-top: 4px solid #00e676 !important; }
.crew-card.team-3 { border-top: 4px solid #ffab40 !important; }
.crew-card.team-4 { border-top: 4px solid #e040fb !important; }

.squad-badge-btn {
  letter-spacing: 1.5px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.squad-badge-btn:hover:not(:disabled) {
  transform: scale(1.05);
  filter: brightness(1.2);
}

.team-arrow-selector {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 50px;
  padding: 2px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.team-label-box {
  min-width: 100px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.team-label-box span {
  letter-spacing: 1px;
}

.player-glow-avatar {
  border: 2px solid rgba(0, 229, 255, 0.3);
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.1);
}

.start-mission-btn {
  height: 64px !important;
  font-size: 1.4rem !important;
  font-weight: 900 !important;
  letter-spacing: 4px !important;
  text-transform: uppercase !important;
  background: linear-gradient(45deg, #ff9100, #ffab40) !important;
  color: #000 !important;
  box-shadow: 0 0 30px rgba(255, 145, 0, 0.4) !important;
  border: 2px solid rgba(255, 255, 255, 0.2) !important;
  transition: all 0.3s ease !important;
}

.start-mission-btn:hover:not(:disabled) {
  transform: scale(1.05) translateY(-2px) !important;
  box-shadow: 0 0 50px rgba(255, 145, 0, 0.6) !important;
  filter: brightness(1.1);
}

.setup-panel {
  background: rgba(15, 23, 42, 0.6) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 229, 255, 0.1) !important;
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.4);
}

.border-light {
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.h-custom-btn {
  height: 56px !important;
}

.side-panel-card {
  background: rgba(15, 23, 42, 0.6) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
}

.modality-card {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  transition: all 0.2s ease;
}

.active-mode {
  border-color: #00e5ff !important;
  background: rgba(0, 229, 255, 0.1) !important;
}

.disabled-mode {
  opacity: 0.5;
  cursor: not-allowed;
}

.mission-card-v3 {
  background: rgba(0, 229, 255, 0.03) !important;
  border: 1px solid rgba(0, 229, 255, 0.1) !important;
}

.mission-status-led {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00e5ff;
  box-shadow: 0 0 10px #00e5ff;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

.game-active-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999; /* Máxima prioridad */
  background: #020617;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.game-hud-container {
  height: 140px; /* Un poco más de espacio para los relojes apilados */
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0.95), transparent);
  z-index: 210;
}

.hud-main-bar {
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(0, 229, 255, 0.4);
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.7);
  border-radius: 999px;
  height: 80px;
  backdrop-filter: blur(20px);
  position: relative;
  z-index: 50;
}

.abort-btn-hud {
  border: 1px solid rgba(255, 82, 82, 0.3);
  background: rgba(255, 82, 82, 0.1) !important;
  transition: all 0.3s ease;
}

.abort-btn-hud:hover {
  background: rgba(255, 82, 82, 0.3) !important;
  transform: scale(1.1);
  box-shadow: 0 0 15px rgba(255, 82, 82, 0.4);
}

.abort-corner-container {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10000;
}

.abort-btn-hud-corner {
  font-weight: 800;
  letter-spacing: 1px;
  box-shadow: 0 0 20px rgba(255, 82, 82, 0.4) !important;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.abort-btn-hud-corner:hover {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(255, 82, 82, 0.6) !important;
}

.vs-text {
  font-family: 'Orbitron', sans-serif;
  font-weight: 900;
  font-size: 1.5rem;
  color: #ff9100;
  line-height: 1;
}

.hud-score-coop-modern {
  position: absolute;
  top: 20px;
  left: 100px;
  width: 400px;
  z-index: 220;
}

.hud-score-teams-modern {
  position: absolute;
  top: 20px;
  left: 100px;
  width: 400px;
  pointer-events: none;
  align-items: flex-start !important;
}

.round-text {
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.hud-name {
  font-weight: 800;
  font-size: 0.9rem;
  color: #fff;
  line-height: 1.2;
}

.hud-puntos {
  font-family: 'JetBrains Mono', monospace;
  color: #00e5ff;
  font-weight: 700;
  font-size: 1rem;
}

.hud-total {
  color: #64748b;
  font-size: 0.8rem;
}

.game-content {
  flex-grow: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.round-result-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(2, 6, 23, 0.95);
  backdrop-filter: blur(15px);
  z-index: 300;
}

.sabotage-notif {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  font-weight: 900;
  font-size: 1.5rem;
  pointer-events: none;
}

.floating-score-enter-active { animation: float-up 2.5s ease-out forwards; }
@keyframes float-up {
  0% { opacity: 0; transform: translate(-50%, 0); }
  20% { opacity: 1; transform: translate(-50%, -20px); }
  100% { opacity: 0; transform: translate(-50%, -100px); }
}

.custom-scroll::-webkit-scrollbar {
  width: 6px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 229, 255, 0.2);
  border-radius: 10px;
}

.shadow-cyan { box-shadow: 0 0 20px rgba(0, 229, 255, 0.3); }
.shadow-amber { box-shadow: 0 0 20px rgba(255, 171, 64, 0.3); }

/* Ocultar HUDs internos de los minijuegos en multijugador para evitar solapamientos */
:deep(.session-hud),
:deep(.hud),
:deep(.hud-row),
:deep(.radio-cabinet .session-hud),
:deep(.word-construction-header),
:deep(.hud-pill),
:deep(.game-container > .v-card:first-child:not(.rhyme-header):not(.bg-grey-darken-4)),
:deep(.radio-cabinet + .session-hud) {
  display: none !important;
}

/* REGLAS ESPECÍFICAS PARA MINIJUEGOS EN MULTIPLAYER */
:deep(.rhyme-header) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  position: absolute;
  top: 180px; /* Debajo del HUD principal */
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  pointer-events: none;
}

:deep(.rhyme-header .d-flex > div:first-child),
:deep(.rhyme-header .d-flex > div:last-child) {
  display: none !important;
}

:deep(.rhyme-header .target-box) {
  pointer-events: auto;
  background: rgba(15, 23, 42, 0.9) !important;
  border: 2px solid #00e5ff !important;
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.3);
}

.global-timer {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.4rem;
  font-weight: 800;
  color: #00e5ff;
  text-shadow: 0 0 15px rgba(0, 229, 255, 0.6);
  margin-top: 2px;
}

.timer-low {
  color: #ff5252;
  text-shadow: 0 0 20px rgba(255, 82, 82, 0.8);
  animation: timer-pulse 0.8s infinite alternate;
}

@keyframes timer-pulse {
  from { transform: scale(1); }
  to { transform: scale(1.15); }
}
.briefing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(2, 6, 23, 0.85);
  backdrop-filter: blur(20px);
  z-index: 1000;
}

.briefing-card {
  background: rgba(15, 23, 42, 0.9);
  border: 2px solid rgba(0, 229, 255, 0.3);
  box-shadow: 0 0 50px rgba(0, 229, 255, 0.2);
  max-width: 600px;
  width: 90%;
}

.briefing-timer {
  font-family: 'JetBrains Mono', monospace;
  font-size: 4rem;
  font-weight: 900;
  color: #00e5ff;
  text-shadow: 0 0 20px rgba(0, 229, 255, 0.6);
}

.role-explanation {
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.5);
}
.planet-pulse {
  animation: planet-glow 2s infinite alternate ease-in-out;
  filter: drop-shadow(0 0 20px rgba(0, 229, 255, 0.4));
}

@keyframes planet-glow {
  from { transform: scale(1); filter: drop-shadow(0 0 10px rgba(0, 229, 255, 0.2)); }
  to { transform: scale(1.1); filter: drop-shadow(0 0 40px rgba(0, 229, 255, 0.6)); }
}

.planet-preview-list {
  max-height: 100px;
  overflow-y: auto;
}

.route-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.route-card:hover {
  background: rgba(15, 23, 42, 0.9);
  border-color: rgba(0, 229, 255, 0.2);
  transform: translateX(4px);
}

.active-route {
  background: rgba(0, 229, 255, 0.1) !important;
  border-color: rgba(0, 229, 255, 0.5) !important;
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.1);
}

.route-icon-box {
  width: 40px;
  height: 40px;
  background: rgba(0, 229, 255, 0.1);
}

.planet-mini-path {
  padding-left: 2px;
}

.mini-node {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00e5ff;
  box-shadow: 0 0 5px #00e5ff;
}

.mini-connector {
  width: 12px;
  height: 2px;
  background: rgba(0, 229, 255, 0.3);
}

.transition-all {
  transition: all 0.3s ease;
}
</style>
