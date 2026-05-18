<template>
  <v-container class="lobby-container py-8 px-6 fill-height gradient-bg" fluid>
    <!-- Overlay de Ruleta -->
    <RouletteOverlay
      :games="availableGames"
      :show="showRoulette"
      :target-game="multiplayerStore.room?.gameConfig?.currentGame"
      @finished="onRouletteFinished"
    />

    <transition name="fade-zoom">
      <div v-if="(activeGameComponent || isTransitioning || ['TOURNAMENT_BRACKETS', 'MATCH_RESULTS', 'ROUND_RESULTS'].includes(multiplayerStore.room?.status) || (multiplayerStore.room?.gameConfig?.mode === 'RACE' && multiplayerStore.room?.status === 'PLAYING') || (multiplayerStore.room?.gameConfig?.mode === 'TOURNAMENT' && multiplayerStore.room?.status === 'PLAYING')) && !showMatchResult" class="game-active-overlay" :key="'game-overlay-' + (multiplayerStore.room?.id || 'none')">
        <!-- MODO CARRERA HUD -->
        <RaceHUD
          v-if="multiplayerStore.room?.gameConfig?.mode === 'RACE'"
          :sequence="[]"
        />
        
        <GlobalAnomalyManager v-if="multiplayerStore.room?.status === 'PLAYING' && activeGameComponent" :forced-anomaly="currentAnomaly" />

        <!-- Puntuación Unificada en COOP (Estilo Just Dance) -->
        <div v-if="multiplayerStore.room?.gameConfig?.mode !== 'RACE' && multiplayerStore.room?.gameConfig?.mode !== 'BOSS' && isTeammate && teamsList.length <= 1 && multiplayerStore.room?.status !== 'TOURNAMENT_BRACKETS'" class="hud-score-coop-modern">
          <CoopScoreBar :max-score="5000" :score="totalCoopScore" />
        </div>

        <!-- Puntuación por Equipos (VS por Parejas) -->
        <div v-if="multiplayerStore.room?.gameConfig?.mode !== 'RACE' && multiplayerStore.room?.gameConfig?.mode !== 'BOSS' && teamsList.length > 1 && !isDuel && multiplayerStore.room?.status !== 'TOURNAMENT_BRACKETS'" class="hud-score-teams-modern d-flex flex-column gap-2 align-center">
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

        <!-- HUD DE MODO JEFE (Overlay sobre el juego) -->
        <div v-if="multiplayerStore.room?.gameConfig?.mode === 'BOSS'" class="boss-mode-hud-container">
          <div class="boss-header-center">
            <BossHealthBar />
          </div>
          
          <!-- Vidas de los Héroes (Flotante a la Izquierda) -->
          <div class="heroes-status-side d-flex flex-column ga-2 pa-4">
            <div v-for="hero in heroesList" :key="hero" class="hero-status-compact d-flex align-center ga-3 pa-2 rounded-xl">
              <v-avatar size="32" class="border-hero">
                <v-img :src="getPlayerAvatar(hero)" />
              </v-avatar>
              <div class="d-flex flex-column">
                <span class="text-7px font-weight-black text-white text-uppercase">{{ hero }}</span>
                <HeroHearts :health="multiplayerStore.room?.gameConfig?.heroHealth?.[hero] || 0" :size="12" />
              </div>
            </div>
          </div>
          
          <!-- Panel de Arsenal exclusivo para el Jefe (Desplegable con SPACE) -->
          <transition name="slide-x">
            <div v-if="multiplayerStore.room?.gameConfig?.boss === astroStore.user && showBossArsenal" class="boss-arsenal-fixed-right">
              <BossArsenalPanel />
            </div>
          </transition>

          <!-- Hint para el jefe -->
          <v-fade-transition>
            <div v-if="multiplayerStore.room?.gameConfig?.boss === astroStore.user && !showBossArsenal" class="boss-space-hint">
              PRESIONA <v-chip class="mx-2 font-weight-black" color="red-accent-2" size="small" variant="flat">SPACE</v-chip> PARA EL ARSENAL
            </div>
          </v-fade-transition>

          <!-- Feed de Acciones (Flotante Abajo Izquierda) -->
          <div class="action-feed-floating" v-if="!showBossArsenal">
            <ActionFeed />
          </div>

          <!-- Efectos Visuales de Ataque del Jefe -->
          <div v-if="multiplayerStore.activeBossEffect" :class="['boss-effect-overlay', 'effect-' + multiplayerStore.activeBossEffect.toLowerCase()]">
            <div v-if="multiplayerStore.activeBossEffect === 'FREEZE'" class="frost-overlay"></div>
            <div v-if="multiplayerStore.activeBossEffect === 'LIGHTNING_STORM'" class="lightning-flash"></div>
            <div v-if="multiplayerStore.activeBossEffect === 'BLACK_HOLE'" class="vortex-effect"></div>
          </div>
        </div>

        <!-- ALERTA DE MUERTE SÚBITA (SUDDEN DEATH) -->
        <v-fade-transition>
          <div v-if="showSuddenDeathOverlay" class="sudden-death-overlay">
            <div class="sudden-death-content">
              <v-icon icon="mdi-skull-crossbones" size="80" color="red-accent-4" class="mb-4 animate-pulse" />
              <h2 class="text-h2 font-weight-black text-red-accent-2 italic glow-text">MUERTE SÚBITA</h2>
              <p class="text-h5 text-white font-weight-bold mt-4 tracking-widest text-uppercase">¡EL PRÓXIMO PUNTO GANA EL DUELO!</p>
            </div>
          </div>
        </v-fade-transition>

        <div v-if="multiplayerStore.room?.gameConfig?.mode !== 'RACE' && multiplayerStore.room?.gameConfig?.mode !== 'BOSS' && multiplayerStore.room?.status !== 'TOURNAMENT_BRACKETS'" class="game-hud-container d-flex justify-center align-center">
          <div class="hud-main-bar d-flex align-center px-6">
            <!-- Jugador 1 (Participante 1 o Local) -->
            <div class="hud-item d-flex align-center gap-3">
              <v-avatar class="border-cyan" size="36">
                <v-img :src="getPlayerAvatar(tournamentParticipants ? tournamentParticipants.p1 : astroStore.user)" />
              </v-avatar>
              <div class="hud-text">
                <div class="hud-name">{{ tournamentParticipants ? tournamentParticipants.p1 : astroStore.user }}</div>
                <div v-if="astroStore.selectedTitle && !tournamentParticipants" class="text-caption text-cyan-accent-1 line-height-1 mb-1 font-italic">{{ $t('shopItems.' + getTitleKey(astroStore.selectedTitle) + '.name') }}</div>
                <div v-if="!isTeammate" class="hud-puntos">
                  <div v-if="multiplayerStore.playerTimes[tournamentParticipants ? tournamentParticipants.p1 : astroStore.user]" class="text-caption font-weight-bold text-cyan-accent-2 animate-pulse">⏱️ {{ multiplayerStore.playerTimes[tournamentParticipants ? tournamentParticipants.p1 : astroStore.user] }}s</div>
                  {{ multiplayerStore.roundScores[tournamentParticipants ? tournamentParticipants.p1 : astroStore.user] || 0 }}
                  <span v-if="multiplayerStore.room?.gameConfig?.mode !== 'TOURNAMENT'" class="hud-total">({{ multiplayerStore.room?.gameConfig?.scores?.[tournamentParticipants ? tournamentParticipants.p1 : astroStore.user] || 0 }})</span>
                </div>
              </div>
            </div>

            <!-- Centro: VS + ronda + Indicador Tiempo -->
            <div class="hud-center-unit mx-8 text-center position-relative">
              <div v-if="!isTeammate" class="vs-text">VS</div>
              <div v-else class="vs-text" :class="multiplayerStore.room?.gameConfig?.mode === 'BOSS' ? 'text-red-accent-2' : 'text-cyan-accent-2'">
                {{ multiplayerStore.room?.gameConfig?.mode === 'BOSS' ? 'BOSS' : 'COOP' }}
              </div>

              <div class="round-text">{{ $t('multiplayerLobby.round', { current: (multiplayerStore.room?.gameConfig?.currentRound || 0) + 1, total: multiplayerStore.room?.gameConfig?.totalRounds || '?' }) }}</div>

              <!-- Temporizador Global (No se muestra en BOSS) -->
              <div v-if="multiplayerStore.room?.status !== 'SUDDEN_DEATH' && multiplayerStore.room?.gameConfig?.mode !== 'BOSS'" class="global-timer" :class="{ 'timer-low': multiplayerStore.timeLeft <= 10 }">
                <v-icon class="mr-1" :icon="multiplayerStore.timeLeft <= 10 ? 'mdi-timer-alert' : 'mdi-timer-outline'" size="small" />
                {{ Math.ceil(multiplayerStore.timeLeft) }}s
              </div>
              <div v-else class="sudden-death-timer-alt animate-pulse">
                <v-icon class="mr-1" icon="mdi-skull" color="red-accent-4" size="small" />
                SUDDEN DEATH
              </div>
            </div>

            <!-- Jugador 2 (Participante 2 o Oponente) -->
            <div class="hud-item d-flex align-center flex-row-reverse gap-3 text-right">
              <v-avatar class="border-cyan" size="36">
                <v-img :src="getPlayerAvatar(tournamentParticipants ? tournamentParticipants.p2 : opponentName)" />
              </v-avatar>
              <div class="hud-text">
                <div class="hud-name">{{ tournamentParticipants ? tournamentParticipants.p2 : opponentName }}</div>
                <div v-if="opponentTitle && !tournamentParticipants" class="text-caption text-cyan-accent-1 line-height-1 mb-1 font-italic">{{ $t('shopItems.' + getTitleKey(opponentTitle) + '.name') }}</div>
                <div v-if="!isTeammate" class="hud-puntos">
                  <div v-if="multiplayerStore.playerTimes[tournamentParticipants ? tournamentParticipants.p2 : opponentName]" class="text-caption font-weight-bold text-cyan-accent-2 animate-pulse">⏱️ {{ multiplayerStore.playerTimes[tournamentParticipants ? tournamentParticipants.p2 : opponentName] }}s</div>
                  {{ multiplayerStore.roundScores[tournamentParticipants ? tournamentParticipants.p2 : opponentName] || 0 }}
                  <span v-if="multiplayerStore.room?.gameConfig?.mode !== 'TOURNAMENT'" class="hud-total">({{ multiplayerStore.room?.gameConfig?.scores?.[tournamentParticipants ? tournamentParticipants.p2 : opponentName] || 0 }})</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- BOTÓN DE ABORTAR: Extremo superior derecho -->
        <div 
          v-if="!activeGameComponent || multiplayerStore.room?.gameConfig?.mode !== 'RACE' || canAbortMission" 
          class="abort-corner-container"
        >
          <v-btn
            class="abort-btn-hud-corner"
            color="error"
            height="50"
            rounded="xl"
            variant="elevated"
            @click="handleAbort"
          >
            <v-icon icon="mdi-power" start />
            {{ (activeGameComponent || showRoundResults) ? 'ABORTAR / VOLVER A BASE' : 'ABANDONAR SALA' }}
          </v-btn>
        </div>


        <transition name="scale">
          <div 
            v-if="activeGameComponent && multiplayerStore.room?.gameConfig?.mode === 'RACE' && canAbortMission" 
            class="abort-mission-btn-container"
            @click.stop="handleAbortMission"
          >
            <div class="abort-mission-ring"></div>
            <div class="abort-mission-btn">
              <v-icon size="32" color="white">mdi-rocket-launch</v-icon>
              <div class="btn-label">ABORTAR</div>
              <div class="key-hint">SPACE</div>
            </div>
          </div>
          
          <!-- Indicador de cuenta atrás discreto para abortar -->
          <div 
            v-else-if="activeGameComponent && multiplayerStore.room?.gameConfig?.mode === 'RACE' && !canAbortMission && !isDuel"
            class="abort-cooldown-indicator"
          >
            <v-progress-circular
              :model-value="(45 - abortTimerSeconds) / 45 * 100"
              color="red-accent-2"
              size="40"
              width="3"
            >
              <span class="text-caption font-weight-black">{{ abortTimerSeconds }}</span>
            </v-progress-circular>
            <div class="ml-2 text-overline text-red-accent-2">BLOQUEIG D'ABORTAMENT</div>
          </div>
        </transition>

        <div class="game-content">
          <!-- MAPA DE CARRERA (Solo en Modo RACE y cuando no hay juego activo) -->
          <transition name="fade">
            <div
              v-if="multiplayerStore.room?.gameConfig?.mode === 'RACE' && !activeGameComponent && !isTransitioning && !spectatedGameComponent"
              class="race-map-wrapper h-100 w-100 position-relative"
            >
              <RaceMap @select-planet="onPlanetSelected" @map-ready="onMapReady" />

              <!-- Pop-up de Missió Abortada (Temporal) -->
              <v-fade-transition>
                <div v-if="showSpectatorAlert" class="spectator-overlay">
                  <div class="spectator-content text-center pa-10">
                    <v-icon color="red-accent-2" size="80" class="mb-4">mdi-gas-station-off</v-icon>
                    <h2 class="text-h3 font-weight-black text-white mb-2">MISSIÓ ABORTADA</h2>
                    <p class="text-h6 text-red-accent-1 font-weight-bold tracking-widest">T'HAS QUEDAT SENSE COMBUSTIBLE</p>
                    <div class="mt-6 text-body-1 text-grey-lighten-1">Ara ets un espectador. Segueix la cursa dels teus rivals!</div>
                  </div>
                </div>
              </v-fade-transition>

              <!-- Etiqueta de Modo Espectador (Persistente pero discreta) -->
              <div v-if="multiplayerStore.raceFuel <= 0 && !showMatchResult && !showSpectatorAlert" class="spectator-tag pa-4 d-flex align-center gap-3">
                <v-icon color="red-accent-2" size="24">mdi-eye-outline</v-icon>
                <div class="text-overline font-weight-black text-white line-height-1">MODO ESPECTADOR</div>
              </div>
            </div>
          </transition>

          <!-- VISTA DE OBSERVADOR (Ver partida de otro) -->
          <transition name="fade">
            <div v-if="spectatedGameComponent" class="spectator-view-container h-100 w-100">
              <div class="spectator-hud d-flex align-center justify-space-between px-6 py-4">
                <div class="d-flex align-center gap-3">
                  <v-avatar class="border-red" size="40">
                    <v-img :src="getPlayerAvatar(spectatedPlayer)" />
                  </v-avatar>
                  <div>
                    <div class="text-overline text-red-accent-2 line-height-1">OBSERVANT A:</div>
                    <div class="text-h6 font-weight-black text-white">{{ spectatedPlayer }}</div>
                  </div>
                </div>
                <!-- Control de espectador: Carrera vs Torneo -->
                <v-btn 
                  v-if="multiplayerStore.room?.gameConfig?.mode === 'RACE'" 
                  color="cyan-accent-2" 
                  variant="tonal" 
                  rounded="pill" 
                  @click="spectatedPlayer = null"
                >
                  <v-icon start icon="mdi-map-marker-path" />
                  TORNAR AL MAPA
                </v-btn>

                <!-- Switch players for tournament -->
                <div v-if="multiplayerStore.room?.gameConfig?.mode === 'TOURNAMENT' && tournamentParticipants" class="d-flex align-center gap-4">
                  <v-btn 
                    :variant="spectatedPlayer === tournamentParticipants.p1 ? 'elevated' : 'outlined'" 
                    :color="spectatedPlayer === tournamentParticipants.p1 ? 'cyan-accent-2' : 'white'"
                    rounded="pill"
                    @click="spectatedPlayer = tournamentParticipants.p1"
                  >
                    <v-icon start icon="mdi-camera-account" />
                    {{ tournamentParticipants.p1 }}
                  </v-btn>
                  <div class="text-white font-italic opacity-50 font-weight-black">VS</div>
                  <v-btn 
                    :variant="spectatedPlayer === tournamentParticipants.p2 ? 'elevated' : 'outlined'" 
                    :color="spectatedPlayer === tournamentParticipants.p2 ? 'red-accent-2' : 'white'"
                    rounded="pill"
                    @click="spectatedPlayer = tournamentParticipants.p2"
                  >
                    <v-icon start icon="mdi-camera-account" />
                    {{ tournamentParticipants.p2 }}
                  </v-btn>
                </div>
              </div>

              <div class="game-wrapper-mp">
                <component
                  :is="spectatedGameComponent"
                  :is-multiplayer="true"
                  :is-spectator="!!spectatedPlayer"
                  :spectated-player="spectatedPlayer"
                  :players-config="multiplayerStore.room?.gameConfig?.teams || []"
                  :room-id="multiplayerStore.room?.id"
                  @game-over="onGameFinished"
                  @action="multiplayerStore.sendGameAction($event)"
                />
                
                <!-- Cursores para espectadores (ven al jugador observado) -->
                <div class="remote-cursors-overlay">
                  <div
                    v-for="(pos, username) in multiplayerStore.remoteCursors"
                    :key="username"
                    class="remote-cursor"
                    :style="{ 
                      left: pos.x + '%', 
                      top: pos.y + '%',
                      display: (username === spectatedPlayer) ? 'block' : 'none'
                    }"
                  >
                    <div class="cursor-pointer" :class="{ 'is-firing': pos.isFiring }" />
                    <div class="cursor-label">{{ username }}</div>
                  </div>
                </div>
              </div>

            </div>
          </transition>

          <!-- OVERLAY DE RESULTADOS DE DUELO -->
          <v-overlay
            v-model="showDuelResultOverlay"
            class="align-center justify-center"
            persistent
            scrim="black"
            style="z-index: 20000;"
          >
            <v-card
              class="pa-10 text-center duel-result-card"
              :class="duelResult?.winner === astroStore.user ? 'winner-border' : 'loser-border'"
              max-width="600"
              rounded="xl"
            >
              <v-icon
                :color="duelResult?.winner === astroStore.user ? 'yellow-accent-4' : 'red-accent-4'"
                :icon="duelResult?.winner === astroStore.user ? 'mdi-trophy' : 'mdi-skull-crossbones'"
                size="120"
                class="mb-6"
              />
              
              <h1 class="text-h2 font-weight-black mb-4" :class="duelResult?.winner === astroStore.user ? 'text-yellow-accent-4' : 'text-red-accent-4'">
                {{ duelResult?.winner === astroStore.user ? 'VICTÒRIA!' : 'DERROTA...' }}
              </h1>
              
              <div class="d-flex justify-space-around align-center my-8">
                <div class="score-box">
                  <div class="text-overline">TU</div>
                  <div class="text-h3 font-weight-bold">{{ duelResult?.myScore }}</div>
                </div>
                <div class="text-h4 font-weight-black">VS</div>
                <div class="score-box">
                  <div class="text-overline text-uppercase">{{ Object.keys(multiplayerStore.playersProgress).find(u => u !== astroStore.user) }}</div>
                  <div class="text-h3 font-weight-bold">{{ duelResult?.partnerScore }}</div>
                </div>
              </div>

              <p class="text-h5 text-grey-lighten-1">
                {{ duelResult?.winner === astroStore.user ? 'Has guanyat el duel! Segueix avançant.' : 'Has perdut el duel... Estàs immobilitzat!' }}
              </p>
            </v-card>
          </v-overlay>

          <!-- ALERTA DE MISTERIO (?) -->
          <transition name="scale">
            <div v-if="activeMysteryAlert" class="mystery-alert-overlay">
              <div class="mystery-alert-card pa-8 rounded-xl border-purple shadow-purple text-center">
                <v-icon 
                  :color="anomalyIcon.color" 
                  size="84" 
                  class="mb-4 animate-bounce"
                  :icon="anomalyIcon.icon"
                />
                <div class="text-h4 font-weight-black text-white mb-2 tracking-tighter">ALERTA METEOROLÒGICA</div>
                <div class="text-h6 text-purple-accent-1 font-weight-bold uppercase mb-4">{{ anomalyIcon.name }}</div>
                <div class="text-body-1 text-white bg-purple-darken-4 pa-4 rounded-lg border-purple-lighten-2">
                  {{ activeMysteryAlert }}
                </div>
              </div>
            </div>
          </transition>

          <div class="game-wrapper-mp" v-if="activeGameComponent && !isTransitioning">
            <component
              :is="activeGameComponent"
              v-if="activeGameComponent"
              :key="multiplayerStore.room?.gameConfig?.modality + '-' + multiplayerStore.room?.status"
              :auto-start="true"
              class="minigame-component"
              :class="[
                multiplayerStore.activeBossEffect ? 'boss-effect-active-' + multiplayerStore.activeBossEffect.toLowerCase() : ''
              ]"
              :duration="multiplayerStore.timeLeft || 60"
              :is-duel="isDuel"
              :is-multiplayer="true"
              :is-race="multiplayerStore.room?.gameConfig?.mode === 'RACE'"
              :is-spectator="!isPlayerInMatch"
              :spectated-player="spectatedPlayer"
              :anomaly="currentAnomaly"
              @game-over="onGameFinished"
              @action="multiplayerStore.sendGameAction($event)"
            />
            
            <!-- Cursores remotos eliminados para jugadores activos por petición del usuario (solo los ve el observador) -->
          </div>

          <!-- ÁRBOL DEL TORNEO -->
          <transition name="fade">
            <TournamentTree
              v-if="multiplayerStore.room?.status === 'TOURNAMENT_BRACKETS' && !activeGameComponent && !isTransitioning && !spectatedGameComponent"
              :is-host="isHost"
              @spectate-match="onTournamentSpectate"
            />
          </transition>

          <!-- Pantalla de Transición -->
          <div v-if="isTransitioning" class="transition-screen d-flex flex-column align-center justify-center">
            <v-progress-circular color="cyan" indeterminate size="64" width="6" />
            <template v-if="multiplayerStore.room?.gameConfig?.mode === 'RACE'">
              <h2 class="text-h2 font-weight-black text-white mt-8 glow-text">{{ $t('multiplayerLobby.nextPlanet') || 'VIATJANT AL SEGÜENT PLANETA...' }}</h2>
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
                  <template v-if="multiplayerStore.room?.gameConfig?.mode === 'RACE'">
                    <div class="text-amber-accent-4">
                      <v-icon icon="mdi-sword-cross" size="64" class="mb-4 shadow-amber animate-pulse" />
                      <h3 class="text-h2 font-weight-black italic glow-text-red">{{ isDuel ? '¡BATALLA 1VS1!' : 'MISSIÓ EXPLORATÒRIA' }}</h3>
                      <p class="text-h5 text-white mt-4 font-weight-bold">{{ isDuel ? 'NOMÉS UN POT GUANYAR AQUÍ.' : 'DEMOSTRA EL TEU TALENT EN AQUEST PLANETA.' }}</p>
                      <div class="competitive-briefing-box pa-6 mt-6 rounded-xl" :class="isDuel ? 'bg-red-darken-4 border-red' : 'bg-slate-800 border-cyan'">
                        <p class="text-h6 text-white">
                          <template v-if="isDuel">
                            <span v-if="multiplayerStore.room?.gameConfig?.currentGame === 'SpelledRosco'">
                              <v-icon start>mdi-alphabetical</v-icon> EL PRIMER EN COMPLETAR EL ROSCO O AMB MÉS ENCERTS GUANYA EL DUEL!
                            </span>
                            <span v-else-if="multiplayerStore.room?.gameConfig?.currentGame === 'RadioSignal'">
                              <v-icon start>mdi-radio-tower</v-icon> EL PRIMER EN SINTONITZAR TRES FRASES CORRECTES DESTROSSARÀ AL RIVAL!
                            </span>
                            <span v-else-if="multiplayerStore.room?.gameConfig?.currentGame === 'RhymeSquad'">
                              <v-icon start>mdi-target</v-icon> SIGUES EL REPTIL MÉS RÀPID ATRAPANT RIMES. QUI EN TINGUI MÉS GUANYA!
                            </span>
                            <span v-else-if="multiplayerStore.room?.gameConfig?.currentGame === 'WordConstruction'">
                              <v-icon start>mdi-crane</v-icon> CONSTRUEIX LA PARAULA ABANS QUE EL TEU RIVAL PER GUANYAR EL COMBAT!
                            </span>
                            <span v-else-if="multiplayerStore.room?.gameConfig?.currentGame === 'SymmetryBreaker'">
                              <v-icon start>mdi-axis-z-rotate-clockwise</v-icon> MANTÉ LA SIMETRIA PERFECTA DURANT 30 SEGONS PER IMPOSAR-TE!
                            </span>
                            <span v-else>
                              <v-icon start>mdi-lightning-bolt</v-icon> DEMOSTRA QUE ETS EL MILLOR. EL QUE TINGUI MÉS PUNTS AL FINAL DEL TEMPS GUANYA!
                            </span>
                          </template>
                          <template v-else>
                            <v-icon start color="cyan-accent-2">mdi-rocket-launch</v-icon> COMPLETA LA MISSIÓ PER RECARREGAR COMBUSTIBLE I SEGUIR AVANÇANT!
                          </template>
                        </p>
                      </div>
                      <p v-if="isDuel" class="text-h5 text-red-accent-2 mt-6 font-weight-black tracking-widest">SI PERDS, QUEDARÀS PARALITZAT 15 SEGONS!</p>

                      <!-- Aviso de Anomalía Meteorológica -->
                      <div v-if="currentAnomaly" class="mt-4 pa-4 rounded-lg bg-orange-darken-4 border-orange d-flex align-center justify-center">
                        <v-icon color="orange-accent-2" size="24" class="mr-3">mdi-weather-lightning-rainy</v-icon>
                        <div class="text-subtitle-1 font-weight-black text-white">
                          AVÍS METEOROLÒGIC: 
                          <span class="text-uppercase ml-2">{{ 
                            currentAnomaly === 'meteorits' ? 'PLUJA DE METEORITS' : 
                            (currentAnomaly === 'raig-tempesta' ? 'TORMENTA DE RAIGS' : 
                            (currentAnomaly === 'nebulosa' ? 'NEBULOSA DENSA' : currentAnomaly.toUpperCase())) 
                          }}</span>
                        </div>
                      </div>
                    </div>
                  </template>
                  <template v-else-if="multiplayerStore.room?.gameConfig?.currentGame === 'RhymeSquad' && multiplayerStore.room?.gameConfig?.modality === '2vs2'">
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
                    <p class="text-h5 text-white">¡Prepárate para iniciar el juego!</p>
                    <p class="text-body-1 text-grey-lighten-1 mt-2">El objetivo comenzará en breve.</p>
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

      <!-- VISTA: EN UNA SALA ACTIVA -->
      <div v-if="multiplayerStore.room">
        <v-row>
          <!-- Fila 1 - Columna Izquierda: Panel de Control de Misión -->
          <v-col cols="12" md="8">
            <v-card class="mission-control-panel rounded-xl overflow-hidden d-flex flex-column" elevation="12" style="max-height: 75vh;">
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

                <!-- DESCRIPCIÓN DEL MODO ACTIVO -->
                <div class="active-mode-info mb-8 pa-4 rounded-xl border-light" style="background: rgba(0, 229, 255, 0.05); border-left: 4px solid #00e5ff;">
                  <div class="text-overline text-cyan-accent-2 font-weight-black mb-1">
                    {{ $t('multiplayerLobby.missionType') }}: {{ $t('multiplayerLobby.modalities.' + selectedModality) }}
                  </div>
                  <div class="text-caption text-white opacity-80">
                    {{ $t('multiplayerLobby.modeDescriptions.' + selectedModality) }}
                  </div>
                </div>

                <!-- SECCIÓN DE INSCRIPCIÓN AL TORNEO -->
                <!-- La inscripció ara és automàtica al llançar el torneig -->

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
                      <!-- Barra de Vida para Héroes en Modo BOSS -->
                      <div v-if="multiplayerStore.room?.gameConfig?.mode === 'BOSS' && getPlayerName(player) !== multiplayerStore.room?.gameConfig?.boss" class="hero-health-overlay mb-2">
                        <HeroHearts :health="multiplayerStore.room?.gameConfig?.heroHealth?.[getPlayerName(player)] || 0" :size="18" />
                      </div>

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

                      <!-- INFO DE VIDAS Y APUESTA (Modo Boss) -->
                      <div v-if="selectedModality === 'boss' && (multiplayerStore.room?.status === 'LOBBY' || multiplayerStore.room?.status === 'ROULETTE')" class="inventory-lives mb-3">
                        <div class="d-flex align-center justify-center mb-1">
                          <v-icon color="red-accent-2" icon="mdi-heart-multiple" size="14" class="mr-1" />
                          <span class="text-caption font-weight-bold text-grey-lighten-1">{{ player.lives || 0 }} Packs</span>
                        </div>
                        
                        <!-- Selector de Apuesta para el usuario local -->
                        <div v-if="getPlayerName(player) === astroStore.user" class="stake-selector d-flex align-center justify-center gap-2 mt-1">
                          <v-btn icon="mdi-minus" density="compact" size="x-small" variant="tonal" color="red-accent-2" @click="updateStake(-1)" :disabled="currentStake <= 1" />
                          <div class="stake-value px-2 rounded bg-black border-light">
                            <span class="text-caption font-weight-black text-white">{{ currentStake }}</span>
                          </div>
                          <v-btn icon="mdi-plus" density="compact" size="x-small" variant="tonal" color="cyan-accent-2" @click="updateStake(1)" :disabled="currentStake >= (player.lives || 1)" />
                        </div>
                        <!-- Visualización de apuesta para otros jugadores -->
                        <div v-else-if="(multiplayerStore.room?.gameConfig?.bossStakes?.[getPlayerName(player)] || 1) > 1" class="mt-1">
                           <v-chip size="x-small" color="cyan-accent-2" variant="flat" class="text-black font-weight-black">
                             {{ multiplayerStore.room?.gameConfig?.bossStakes?.[getPlayerName(player)] }} Packs
                           </v-chip>
                        </div>
                      </div>

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

                      <!-- Selector de Equipo -->
                      <div v-if="selectedModality !== '1vs1' && selectedModality !== 'carrera' && selectedModality !== 'torneig' && selectedModality !== 'boss'" class="mt-4 team-arrow-selector d-flex align-center justify-center gap-2">
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
                  <div v-if="selectedModality === '1vs1' && (multiplayerStore.room?.players?.length || 0) !== 2" class="mb-4 text-orange-accent-2 font-weight-bold d-flex align-center gap-2">
                    <v-icon icon="mdi-alert-circle-outline" />
                    <span>EL MODO DUELO REQUIERE EXACTAMENTE 2 PILOTOS</span>
                  </div>
                  
                  <v-btn
                    v-if="isHost"
                    class="start-mission-btn rounded-pill px-12 font-weight-black"
                    color="orange-accent-3"
                    :disabled="multiplayerStore.room?.status !== 'LOBBY' || ((multiplayerStore.room?.players?.length || 0) < 2) || (selectedModality === '1vs1' && (multiplayerStore.room?.players?.length || 0) !== 2) || !allPlayersHaveTeam"
                    elevation="12"
                    size="x-large"
                    @click="startMatch"
                  >
                    {{ $t('multiplayerLobby.launchNow') }}
                  </v-btn>
                  <div v-else class="waiting-broadcast d-flex align-center">
                    <v-progress-circular class="mr-3" color="amber-accent-2" indeterminate size="20" width="2" />
                    <span class="text-amber-accent-2 font-weight-bold">{{ $t('multiplayerLobby.waitingOrders') }}</span>
                  </div>
                </div>
              </div>
            </v-card>

            <!-- MANUAL DE OPERACIONES (EXTENSO) movido aquí -->
            <v-card class="rules-panel-modern pa-8 rounded-xl mt-6" elevation="12" style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(0, 229, 255, 0.2) !important;">
              <div class="text-h4 font-weight-black text-white tracking-widest mb-2 text-uppercase text-center">MANUAL DE OPERACIONES</div>
              <div class="text-subtitle-1 text-cyan-accent-1 opacity-70 text-center mb-8">Selecciona un minijuego o modo para ver su manual</div>

              <div class="d-flex flex-column gap-4 mb-8">
                <!-- MINIJUEGOS -->
                <div class="d-flex align-center justify-space-between bg-dark-soft pa-4 rounded-xl border-light">
                  <div class="d-flex align-center">
                    <v-icon color="cyan-accent-2" size="32" class="mr-4">mdi-gamepad-variant</v-icon>
                    <div class="text-overline text-cyan-accent-2 font-weight-black">MINIJUEGOS</div>
                  </div>
                  <div class="d-flex gap-3">
                    <v-btn v-for="game in availableGames" :key="game" :class="{ 'game-btn-active-large': selectedGameForRule === game }" class="game-selector-btn-large rounded-xl" icon @click="selectedGameForRule = game">
                      <v-icon size="32">{{ getGameIcon(game) }}</v-icon>
                      <v-tooltip activator="parent" location="top">{{ t('games.' + game) }}</v-tooltip>
                    </v-btn>
                  </div>
                </div>

                <!-- MODOS -->
                <div class="d-flex align-center justify-space-between bg-dark-soft pa-4 rounded-xl border-light">
                  <div class="d-flex align-center">
                    <v-icon color="orange-accent-2" size="32" class="mr-4">mdi-strategy</v-icon>
                    <div class="text-overline text-orange-accent-2 font-weight-black">MODOS DE JUEGO</div>
                  </div>
                  <div class="d-flex gap-3">
                    <v-btn v-for="mode in modalities" :key="mode.id" :class="{ 'game-btn-active-large': selectedGameForRule === mode.id }" class="game-selector-btn-large rounded-xl" icon @click="selectedGameForRule = mode.id">
                      <v-icon size="32">{{ mode.icon }}</v-icon>
                      <v-tooltip activator="parent" location="top">{{ mode.name }}</v-tooltip>
                    </v-btn>
                  </div>
                </div>
              </div>

              <v-divider class="mb-8 border-opacity-25" color="cyan-accent-2" />
              <div v-if="selectedGameForRule" class="rule-display-extensive animate-fade-in">
                <v-row>
                  <v-col cols="12" md="7">
                    <div class="d-flex align-center mb-6">
                      <v-icon color="cyan-accent-2" class="mr-4" size="32">{{ isModality(selectedGameForRule) ? getModality(selectedGameForRule).icon : 'mdi-rocket-launch-outline' }}</v-icon>
                      <h2 class="text-h3 font-weight-black text-white">{{ isModality(selectedGameForRule) ? getModality(selectedGameForRule).name : t('multiplayerLobby.gameRules.' + selectedGameForRule + '.name') }}</h2>
                    </div>
                    <div class="text-h6 text-grey-lighten-2 mb-8 line-height-1-8 font-weight-medium">{{ isModality(selectedGameForRule) ? getModality(selectedGameForRule).desc : t('multiplayerLobby.gameRules.' + selectedGameForRule + '.rules') }}</div>
                    <div class="tip-box-large pa-6 rounded-xl d-flex align-center">
                      <v-icon color="amber-accent-2" size="40" class="mr-6">mdi-lightbulb-on</v-icon>
                      <div>
                        <div class="text-h6 font-weight-black text-amber-accent-2 mb-2">CONSEJO TÁCTICO</div>
                        <div class="text-subtitle-1 text-white font-weight-bold">"{{ isModality(selectedGameForRule) ? getModality(selectedGameForRule).tip : t('multiplayerLobby.gameRules.' + selectedGameForRule + '.tip') }}"</div>
                      </div>
                    </div>
                  </v-col>
                  <v-col cols="12" md="5" class="d-flex align-center justify-center">
                    <div class="mission-visual-box rounded-xl pa-8 text-center border-light">
                      <v-icon color="cyan-accent-2" size="120" class="mb-4 opacity-50">{{ isModality(selectedGameForRule) ? getModality(selectedGameForRule).icon : getGameIcon(selectedGameForRule) }}</v-icon>
                      <div class="text-overline text-cyan-accent-2 font-weight-black">MÓDULO OPERATIVO</div>
                      <div class="text-h5 text-white font-weight-bold">OPERATIVO AL 100%</div>
                    </div>
                  </v-col>
                </v-row>
              </div>
            </v-card>
          </v-col>

          <!-- Fila 1 - Columna Derecha: Configuración y Reclutamiento -->
          <v-col cols="12" md="4">
            <!-- SELECCIONA MODALITAT -->
            <v-card class="side-panel-card rounded-xl pa-4 mb-6" elevation="0">
              <h3 class="text-subtitle-1 font-weight-bold text-white mb-4 d-flex align-center">
                <v-icon class="mr-2" color="cyan-accent-2" icon="mdi-gamepad-variant" />
                {{ $t('multiplayerLobby.selectModality') }}
              </h3>

              <div v-if="isHost" class="mb-6 pa-4 rounded-xl bg-dark-soft border-light">
                <div class="mb-4">
                  <div class="text-caption text-cyan-accent-2 font-weight-bold mb-2 tracking-widest text-none">Máximo de pilotos</div>
                  <v-select
                    v-model="maxPlayers"
                    bg-color="rgba(255,255,255,0.05)"
                    class="player-limit-select-mini"
                    density="compact"
                    hide-details
                    :items="[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]"
                    prepend-inner-icon="mdi-account-group"
                    rounded="pill"
                    variant="solo-filled"
                  >
                    <template #selection="{ item }">{{ item.title }} pilotos</template>
                  </v-select>
                </div>
                <div class="mb-4">
                  <div class="text-caption text-orange-accent-2 font-weight-bold mb-2 tracking-widest text-none">Objetivo de rondas</div>
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
                    <template #selection="{ item }">{{ item.title }} rondas</template>
                  </v-select>
                </div>

                <div v-if="selectedModality === 'torneig'" class="mb-4">
                  <div class="text-caption text-yellow-accent-4 font-weight-bold mb-2 tracking-widest text-none">Cuota de entrada</div>
                  <v-text-field
                    v-model.number="tournamentBuyIn"
                    bg-color="rgba(255,255,255,0.05)"
                    class="buyin-select-mini"
                    density="compact"
                    hide-details
                    type="number"
                    min="0"
                    step="100"
                    prepend-inner-icon="mdi-database-outline"
                    rounded="pill"
                    variant="solo-filled"
                    :suffix="$t('multiplayerLobby.astrocions')"
                    @update:model-value="updateRoomConfig"
                  />
                </div>
                
                <!-- Personalización de Mapa (Solo en Carrera) -->
                <div v-if="selectedModality === 'carrera'" class="mt-4 pt-4 border-top-light">
                  <div class="text-overline text-cyan-accent-2 font-weight-bold mb-4">AJUSTES DEL MAPA</div>
                  <v-row dense>
                    <v-col cols="6" class="mb-4">
                      <div class="text-7px text-yellow-accent-4 font-weight-bold mb-1">MINAS DE ORO: {{ numGoldMines }}</div>
                      <v-slider v-model="numGoldMines" color="yellow-accent-4" density="compact" hide-details max="5" min="0" step="1" thumb-size="12" @update:model-value="updateRoomConfig" />
                    </v-col>
                    <v-col cols="6" class="mb-4">
                      <div class="text-7px text-red-accent-2 font-weight-bold mb-1">ARENAS: {{ numBattles }}</div>
                      <v-slider v-model="numBattles" color="red-accent-2" density="compact" hide-details max="6" min="0" step="1" thumb-size="12" @update:model-value="updateRoomConfig" />
                    </v-col>
                    <v-col cols="6" class="mb-2">
                      <div class="text-7px text-cyan-accent-2 font-weight-bold mb-1">GASOLINERAS: {{ numFuelStations }}</div>
                      <v-slider v-model="numFuelStations" color="cyan-accent-2" density="compact" hide-details max="5" min="1" step="1" thumb-size="12" @update:model-value="updateRoomConfig" />
                    </v-col>
                    <v-col cols="6" class="mb-2">
                      <div class="text-7px text-purple-accent-1 font-weight-bold mb-1">MISTERIOS: {{ numMysteryNodes }}</div>
                      <v-slider v-model="numMysteryNodes" color="purple-accent-1" density="compact" hide-details max="8" min="0" step="1" thumb-size="12" @update:model-value="updateRoomConfig" />
                    </v-col>
                  </v-row>
                  
                  <div class="mt-4 d-flex align-center justify-space-between bg-dark-soft pa-3 rounded-lg border-light">
                    <div class="text-caption text-white font-weight-bold">Repetir mismo mapa</div>
                    <v-switch v-model="sharedChallenge" color="cyan-accent-2" density="compact" hide-details inset @update:model-value="updateRoomConfig" />
                  </div>
                </div>
              </div>

              <v-row class="ma-n1">
                <v-col v-for="mode in modalities" :key="mode.id" :cols="mode.id === 'torneig' ? 12 : 6" class="pa-1">
                  <v-card
                    v-ripple="mode.active && isHost"
                    class="modality-card pa-3 d-flex align-center rounded-lg cursor-pointer transition-all w-100"
                    :class="{ 
                      'active-mode': selectedModality === mode.id, 
                      'disabled-mode': !mode.active,
                      'is-host': isHost,
                      'mode-selected-anim': selectedModality === mode.id
                    }"
                    variant="flat"
                    @click="mode.active ? selectModality(mode.id) : null"
                  >
                    <v-icon 
                      class="mr-3 mode-icon" 
                      :class="{ 'icon-pop': selectedModality === mode.id }"
                      :color="selectedModality === mode.id ? 'cyan-accent-2' : 'grey-lighten-1'" 
                      :icon="mode.icon" 
                      size="24" 
                    />
                    <div class="flex-grow-1 overflow-hidden">
                      <div class="text-caption font-weight-black text-uppercase text-truncate" :class="selectedModality === mode.id ? 'text-white' : 'text-grey-lighten-1'">
                        {{ $te('multiplayerLobby.modalities.' + mode.id) ? $t('multiplayerLobby.modalities.' + mode.id) : mode.name }}
                      </div>
                      <v-chip
                        v-if="!mode.active"
                        class="mt-1 text-7px"
                        color="grey-darken-2"
                        size="x-small"
                        variant="tonal"
                      >{{ $t('multiplayerLobby.comingSoon') }}</v-chip>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </v-card>

            <!-- RECLUTAR TRIPULACIÓN -->
            <v-card class="side-panel-card rounded-xl pa-0 overflow-hidden" elevation="4">
              <div class="pa-4 border-bottom-light">
                <h3 class="text-subtitle-1 font-weight-bold text-white d-flex align-center">
                  <v-icon class="mr-2" color="cyan-accent-2" icon="mdi-account-group" />
                  {{ $t('multiplayerLobby.recruitCrew') }}
                </h3>
              </div>
              <v-list bg-color="transparent" class="pa-0 recruit-list" max-height="400px">
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
                
                <div v-if="friendsList.length === 0 && otherExplorersList.length === 0" class="text-center py-8 opacity-40">
                  <v-icon size="40" class="mb-2">mdi-account-search-outline</v-icon>
                  <div class="text-caption">No hi ha exploradors disponibles</div>
                </div>
              </v-list>
            </v-card>
          </v-col>
        </v-row>


      </div>

      <!-- VISTA: SIN SALA (CREAR O UNIRSE) -->
      <div v-else>
        <v-row>
          <v-col cols="12" md="8">
            <v-card class="setup-panel pa-8 rounded-xl" elevation="4" style="min-height: 550px;">
              <div class="text-center mb-10">
                <v-icon class="mb-4" color="cyan-accent-2" icon="mdi-orbit" size="80" />
                <h3 class="text-h3 font-weight-black text-white tracking-widest">{{ $t('multiplayerLobby.prepareExpedition') }}</h3>
                <p class="text-subtitle-1 text-grey-darken-1 mt-2">Configura els sistemes per al llançament</p>
              </div>

              <v-row>
                <v-col cols="12" md="6">
                  <div class="setup-section pa-6 rounded-xl border-light h-100" style="background: rgba(0, 229, 255, 0.03);">
                    <div class="d-flex align-center justify-space-between mb-6">
                      <div class="d-flex align-center">
                        <v-icon class="mr-3" color="cyan-accent-2" icon="mdi-plus-circle-outline" size="28" />
                        <span class="text-h6 font-weight-bold text-white">{{ $t('multiplayerLobby.newMission') }}</span>
                      </div>
                      <v-switch v-model="isPublic" color="cyan-accent-2" density="compact" hide-details inset :label="isPublic ? $t('multiplayerLobby.public') : $t('multiplayerLobby.private')" />
                    </div>
                    <p class="text-caption text-grey-lighten-1 mb-8">Crea un nou sector operatiu per a tu i la teva tripulació.</p>
                    <v-btn block color="cyan-accent-2" size="x-large" class="rounded-pill font-weight-black text-black action-glow-btn mt-auto" @click="createRoom">
                      {{ $t('multiplayerLobby.startRoom') }}
                    </v-btn>
                  </div>
                </v-col>

                <v-col cols="12" md="6">
                  <div class="setup-section pa-6 rounded-xl border-light h-100" style="background: rgba(255, 160, 0, 0.03);">
                    <div class="d-flex align-center mb-6">
                      <v-icon class="mr-3" color="amber-accent-2" icon="mdi-key-variant" size="28" />
                      <span class="text-h6 font-weight-bold text-white">{{ $t('multiplayerLobby.joinByCode') }}</span>
                    </div>
                    <v-text-field 
                      v-model="roomCode" 
                      bg-color="rgba(255,255,255,0.05)" 
                      class="mb-6 custom-otp-field" 
                      maxlength="6" 
                      :placeholder="$t('multiplayerLobby.codePlaceholder')" 
                      rounded="pill" 
                      variant="solo-filled" 
                      flat
                    />
                    <v-btn block color="amber-accent-2" :disabled="!roomCode || roomCode.length < 6" size="x-large" class="rounded-pill font-weight-black text-black" @click="joinByCode">
                      {{ $t('multiplayerLobby.dock') }}
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <!-- Invitacions (Només si no estem en sala) -->
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
                      <v-btn color="success" icon="mdi-check" size="x-small" variant="flat" @click="acceptInvitation(inv, index)" />
                      <v-btn color="error" icon="mdi-close" size="x-small" variant="tonal" @click="rejectInvitation(index)" />
                    </div>
                  </div>
                </v-list-item>
              </v-list>
            </v-card>

            <!-- Red de Misiones (Salas Públicas) -->
            <v-card class="side-panel-card rounded-xl pa-0 overflow-hidden d-flex flex-column" elevation="8" style="height: 550px;">
              <div class="side-panel-header pa-4 d-flex align-center border-bottom-light">
                <v-icon class="mr-3" color="cyan-accent-2" icon="mdi-map-search" />
                <h3 class="text-subtitle-1 font-weight-black text-white tracking-widest">{{ $t('multiplayerLobby.missionNetwork') }}</h3>
              </div>

              <div class="pa-4 flex-grow-1 overflow-y-auto custom-scroll">
                <v-list v-if="multiplayerStore.availableRooms.length > 0" bg-color="transparent" class="pa-0">
                  <v-fade-transition group>
                    <v-list-item v-for="room in multiplayerStore.availableRooms" :key="room.id" class="px-3 py-4 mb-4 mission-card-v3 rounded-xl">
                      <div class="d-flex flex-column w-100">
                        <div class="d-flex align-center justify-space-between mb-3">
                          <div class="d-flex align-center">
                            <div class="mission-status-led mr-2" />
                            <div class="text-body-2 font-weight-black text-white">SECTOR {{ room.id }}</div>
                          </div>
                          <v-chip class="rounded-pill font-weight-bold" color="cyan-lighten-4" size="x-small" variant="tonal">
                            {{ room.players.length }}/{{ room.gameConfig?.maxPlayers || room.maxPlayers || 4 }} PILOTOS
                          </v-chip>
                        </div>

                        <div class="d-flex align-center mb-4">
                          <v-avatar class="mr-3 border-thin" size="32">
                            <v-img cover :src="getPlayerAvatar(room.host)" />
                          </v-avatar>
                          <div>
                            <div class="text-caption text-grey-lighten-1 line-height-1">COMANDANTE</div>
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
                          ESTABLECER VÍNCULO
                        </v-btn>
                      </div>
                    </v-list-item>
                  </v-fade-transition>
                </v-list>
                <div v-else class="text-center py-12 empty-discovery rounded-xl h-100 d-flex flex-column align-center justify-center">
                  <v-icon class="mb-4" color="rgba(255, 255, 255, 0.05)" icon="mdi-wifi-off" size="64" />
                  <p class="text-body-2 text-grey-darken-1 font-weight-bold">{{ $t('multiplayerLobby.noSignals') }}</p>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>

    <!-- Overlay de Congelación (Modo Jefe) -->
    <FreezeOverlay />
    </v-container>

    <!-- SELECTOR DE DUEL (Forzado a Z-INDEX ultra alto) -->
    <v-dialog v-model="showDuelSelector" max-width="600" persistent z-index="999999">
      <v-card class="duel-selector-card pa-6">
        <div class="text-h4 text-center text-red-accent-3 font-weight-black mb-2">
          <v-icon size="40" class="mr-2">mdi-sword-cross</v-icon>
          ARENA DE DUEL
        </div>
        <p class="text-center text-grey-lighten-1 mb-6">Tria el teu rival per al combat</p>

        <template v-if="otherPlayers.length > 0">
          <!-- Botón Aleatorio -->
          <v-btn
            block
            class="mb-6 font-weight-black py-4"
            color="amber-accent-4"
            rounded="xl"
            size="large"
            variant="flat"
            @click="selectRandomRival"
          >
            <v-icon class="mr-2">mdi-shuffle-variant</v-icon>
            RIVAL ALEATORI (SOLS LLIURES)
          </v-btn>

          <v-row>
            <v-col 
              v-for="player in otherPlayers" 
              :key="player.username || player"
              cols="12" sm="6"
            >
              <div 
                class="rival-card-v2 pa-4 rounded-xl text-center cursor-pointer border-light"
                :class="{ 'rival-busy': playerState(player) !== 'MAP' }"
                @click="playerState(player) === 'MAP' ? selectRival(player) : null"
              >
                <div v-if="playerState(player) !== 'MAP'" class="busy-badge">EN MISSIÓ</div>
                <v-avatar size="80" class="mb-3 border-cyan elevation-6">
                  <v-img :src="getAvatar(player)" />
                </v-avatar>
                <div class="text-h6 font-weight-bold text-white">{{ player.username || player }}</div>
                <v-chip 
                  size="small" 
                  :color="playerState(player) === 'MAP' ? 'success' : 'error'"
                  class="mt-2 font-weight-bold"
                  variant="flat"
                >
                  {{ playerState(player) === 'MAP' ? 'DISPONIBLE' : 'EN MISSIÓ' }}
                </v-chip>
              </div>
            </v-col>
          </v-row>
        </template>
        <template v-else>
          <div class="text-center py-6">
            <v-icon size="64" color="grey-darken-2" class="mb-4">mdi-account-off-outline</v-icon>
            <h3 class="text-h6 text-grey-lighten-1">No hi ha rivals disponibles</h3>
            <v-btn 
              color="red-accent-3" 
              size="large" 
              rounded="pill" 
              block
              class="font-weight-black mt-6"
              @click="selectRival({ username: 'SISTEMA' })"
            >
              ENTRENAMENT EN SOLITARI
            </v-btn>
          </div>
        </template>

        <div class="d-flex justify-center mt-6">
          <v-btn
            color="grey-lighten-1"
            variant="text"
            @click="showDuelSelector = false"
          >
            TORNAR AL MAPA
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref, shallowRef, watch, nextTick } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  // Importar juegos
  import RadarScan from '@/modes/shared/minigames/RadarScan.vue'
  import RadioSignal from '@/modes/shared/minigames/RadioSignal.vue'

  import RhymeSquad from '@/modes/shared/minigames/RhymeSquad.vue'
  import RouletteOverlay from '@/modes/shared/minigames/RouletteOverlay.vue'
  import SpelledRosco from '@/modes/shared/minigames/SpelledRosco.vue'
  import SyllableQuest from '@/modes/shared/minigames/SyllableQuest.vue'
  import SymmetryBreaker from '@/modes/shared/minigames/SymmetryBreaker.vue'
  import WordConstruction from '@/modes/shared/minigames/WordConstruction.vue'
  import CoopScoreBar from '@/modes/multiplayer/components/CoopScoreBar.vue'
  import BossHealthBar from '@/modes/multiplayer/components/BossHealthBar.vue'
  import BossArsenalPanel from '@/modes/multiplayer/components/BossArsenalPanel.vue'
  import HeroHearts from '@/modes/multiplayer/components/HeroHearts.vue'
  import ActionFeed from '@/modes/multiplayer/components/ActionFeed.vue'
  import FreezeOverlay from '@/modes/multiplayer/components/FreezeOverlay.vue'
  import EliminatedOverlay from '@/modes/multiplayer/components/EliminatedOverlay.vue'
  import RaceHUD from '@/modes/multiplayer/components/RaceHUD.vue'
  import RaceMap from '@/modes/multiplayer/components/RaceMap.vue'
  import MatchResultScreen from '@/modes/multiplayer/components/MatchResultScreen.vue'
  import TournamentTree from '@/modes/multiplayer/components/TournamentTree.vue'
  import { useAstroStore } from '@/stores/astroStore'
  import { useMultiplayerStore } from '@/modes/multiplayer/store/multiplayerStore'
  import { useInventoryStore } from '@/stores/inventoryStore'

  const { t } = useI18n()
  const router = useRouter()
  const astroStore = useAstroStore()
  const multiplayerStore = useMultiplayerStore()
  const inventoryStore = useInventoryStore()

  onMounted(() => {
    window.addEventListener('keydown', handleGlobalKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleGlobalKeydown)
    stopHudTimer()
  })

  const modalities = [
    { id: '1vs1', name: 'Modo 1vs1', icon: 'mdi-sword-cross', active: true, desc: 'Enfréntate a un rival en duelo directo. El piloto con mejor puntuación al finalizar el tiempo se lleva la victoria.', tip: 'Sé rápido y preciso para no darle ventaja al oponente.' },
    { id: '2vs2', name: 'Modo 2vs2', icon: 'mdi-account-group', active: true, desc: 'Forma escuadrones de dos y compite sumando la puntuación total del equipo. La coordinación es clave.', tip: 'Divide las tareas para ser más eficientes.' },
    { id: 'carrera', name: 'Carrera Espacial', icon: 'mdi-rocket-launch', active: true, desc: 'Avanza por un mapa de nodos recogiendo minerales, sobreviviendo a anomalías y enfrentándote en duelos antes de que se acabe tu combustible.', tip: 'Controla siempre tus reservas de gas y evita quedarte varado.' },
    { id: 'boss', name: 'Modo Boss', icon: 'mdi-skull', active: true, desc: 'Toda la tripulación se enfrenta a un enemigo colosal. Requiere tener Packs de Vidas para participar.', tip: 'Prepara tus mejores tácticas, el trabajo en equipo lo es todo.' },
    { id: 'torneig', name: 'Torneo', icon: 'mdi-trophy-variant', active: true, desc: 'Competición de eliminación directa. Paga tu inscripción con Astrocions y avanza en el bracket para ganar el premio final.', tip: 'No hay margen de error, una derrota y quedarás eliminado.' },
  ]

  const isHost = computed(() => {
    const currentHost = multiplayerStore.room?.host
    const currentUser = astroStore.user
    
    if (!currentHost || !currentUser) return false
    
    // Extraer el nombre si es un objeto {username: '...'} o un string
    const hostName = (typeof currentHost === 'object' ? currentHost.username || currentHost.user : currentHost) || ''
    const myName = (typeof currentUser === 'object' ? currentUser.username || currentUser.user : currentUser) || ''
    
    const result = hostName.toLowerCase() === myName.toLowerCase()
    
    if (!result && hostName) {
      console.debug('--- DEBUG HOST ---', { hostName, myName, match: result })
    }
    
    return result
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

  // Configuración del mapa de carrera
  const numGoldMines    = ref(Number(localStorage.getItem('astro_mp_goldMines'))    || 1)
  const numBattles      = ref(Number(localStorage.getItem('astro_mp_battles'))      || 2)
  const numFuelStations = ref(Number(localStorage.getItem('astro_mp_fuelStations')) || 1)
  const numMysteryNodes = ref(Number(localStorage.getItem('astro_mp_mysteryNodes')) || 1) // Bajado de 3 a 1 por defecto



  const snackbar = ref({ show: false, text: '', color: 'success' })
  const isPublic = ref(true)
  const maxPlayers = ref(Number(localStorage.getItem('astro_mp_maxPlayers')) || 4)
  const pointsToWin = ref(Number(localStorage.getItem('astro_mp_pointsToWin')) || 3)
  const tournamentBuyIn = ref(Number(localStorage.getItem('astro_mp_tournamentBuyIn')) || 500)
  const sharedChallenge = ref(localStorage.getItem('astro_mp_sharedChallenge') === 'true')
  const roomCode = ref('')
  
  // Estado de inscripción al torneo
  const isEnrolled = ref(false)
  const loadingEnrollment = ref(false)
  
  const showRoulette = ref(false)
  const showBriefing = ref(false)
  const briefingCountdown = ref(10)
  let briefingTimer = null
  const selectedGameForRule = ref('WordConstruction')
  const activeGameComponent = shallowRef(null)
  const serverGameName = ref(null) // Para sincronización exacta de espectador
  const spectatedPlayer = ref(null)

  async function handleTournamentEnrollment() {
    if (!multiplayerStore.room) return
    
    loadingEnrollment.value = true
    try {
      const cost = tournamentBuyIn.value
      const tournamentId = multiplayerStore.room.id
      
      const result = await astroStore.joinTournament(tournamentId, cost)
      
      if (result.success) {
        isEnrolled.value = true
        showMessage('¡T\'has inscrit correctament al torneig!', 'success')
      } else {
        showMessage(result.message || 'Error en la inscripció', 'error')
      }
    } catch (err) {
      showMessage(err.message || 'Error al connectar amb el servidor', 'error')
    } finally {
      loadingEnrollment.value = false
    }
  }

  const currentTournamentMatch = computed(() => {
    if (multiplayerStore.room?.gameConfig?.mode === 'TOURNAMENT') {
      return multiplayerStore.room?.gameConfig?.tournament?.brackets?.find(m => m.status === 'PLAYING')
    }
    return null
  })
  const tournamentParticipants = computed(() => {
    const match = currentTournamentMatch.value
    if (match) {
      return { p1: match.p1, p2: match.p2 }
    }
    return null
  })

  const isTournamentFinished = computed(() => {
    if (multiplayerStore.room?.gameConfig?.mode !== 'TOURNAMENT') return false
    const brackets = multiplayerStore.room?.gameConfig?.tournament?.brackets || []
    if (brackets.length === 0) return false
    // La final es el último match generado en el bracket
    const finalMatch = brackets[brackets.length - 1]
    // El torneo acaba cuando el estado de la sala es GAME_OVER (enviado por el servidor al finalizar la gran final)
    return multiplayerStore.room?.status === 'GAME_OVER' || multiplayerStore.room?.status === 'TOURNAMENT_FINISHED'
  })
  const showDuelSelector = ref(false)
  const currentDuelNodeId = ref(null)
  const showBossArsenal = ref(false)

  function handleGlobalKeydown(e) {
    // Solo si el usuario no está escribiendo en un input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

    if (e.code === 'Space') {
      if (multiplayerStore.room?.gameConfig?.mode === 'BOSS' && multiplayerStore.room?.gameConfig?.boss === astroStore.user) {
        e.preventDefault()
        showBossArsenal.value = !showBossArsenal.value
      }
    }
  }

  const otherPlayers = computed(() => {
    return multiplayerStore.room?.players.filter(p => (p.username || p) !== astroStore.user) || []
  })

  const playerState = (player) => {
    const username = player.username || player
    return multiplayerStore.playerStates[username] || 'MAP'
  }

  function selectRival (player) {
    const rivalName = player.username || player
    showDuelSelector.value = false
    
    // Elegir juego
    const duelGames = ['SymmetryBreaker', 'RadioSignal', 'WordConstruction']
    const randomGame = duelGames[Math.floor(Math.random() * duelGames.length)]
    
    // 1. Notificar al servidor para que el RIVAL también entre al juego
    multiplayerStore.sendGameAction({
      type: 'DUEL_START',
      attacker: astroStore.user,
      rival: rivalName,
      game: randomGame,
      nodeId: currentDuelNodeId.value
    })

    // 2. El ATACANTE entra al juego con Briefing
    multiplayerStore.activeGameName = randomGame
    currentAnomaly.value = null // NUNCA hay eventos en duelos 1vs1
    isDuelInternal.value = true
    
    startBriefing(randomGame)
  }

  function onTournamentSpectate (playerName) {
    console.log('👀 Espectando manualmente a:', playerName)
    spectatedPlayer.value = playerName
    isTransitioning.value = false
    isDuelInternal.value = true
  }

  function selectRandomRival () {
    const available = otherPlayers.value.filter(p => playerState(p) === 'MAP')
    if (available.length > 0) {
      const randomPlayer = available[Math.floor(Math.random() * available.length)]
      selectRival(randomPlayer)
    } else {
      showMessage(t('multiplayerLobby.noRivalsAvailableShort') || 'No hi ha ningú lliure!', 'error')
    }
  }

  const activeMysteryAlert = ref(null)
  const fullMapNodes = ref({})

  function onMapReady (nodes) {
    fullMapNodes.value = nodes
  }

  const spectatedGameComponent = computed(() => {
    const isRaceMode = multiplayerStore.room?.gameConfig?.mode === 'RACE'
    const isTournament = multiplayerStore.room?.gameConfig?.mode === 'TOURNAMENT'

    if (isRaceMode && multiplayerStore.raceFuel > 0) return null
    if (!spectatedPlayer.value) return null

    if (isTournament) {
      const gameName = serverGameName.value || multiplayerStore.room?.gameConfig?.currentGame
      return gameName ? gameComponents[gameName] : null
    }

    const nodeId = multiplayerStore.playersProgress[spectatedPlayer.value]
    if (!nodeId || !fullMapNodes.value[nodeId]) return null
    const node = fullMapNodes.value[nodeId]
    return node.game ? gameComponents[node.game] : null
  })

  const roundWinner = ref(null)
  const isRoundTie = ref(false)
  const showRoundResults = ref(false)
  const showSpectatorAlert = ref(false)
  const showMatchResult = ref(false)
  const isDuelInternal = ref(false)
  const isDuel = computed(() => {
    return isDuelInternal.value || multiplayerStore.room?.gameConfig?.modality === '1vs1' || multiplayerStore.room?.gameConfig?.mode === 'TOURNAMENT'
  })
  const isPlayerInMatch = computed(() => {
    if (!multiplayerStore.room) return false
    
    // Si estamos observando explícitamente a alguien
    if (spectatedPlayer.value) return false

    const mode = multiplayerStore.room?.gameConfig?.mode
    
    // MODO TORNEO: Solo juegan los dos participantes del combate activo
    if (mode === 'TOURNAMENT') {
      const currentMatch = multiplayerStore.room?.gameConfig?.tournament?.brackets?.find(m => m.status === 'PLAYING')
      if (currentMatch) {
        return currentMatch.p1 === astroStore.user || currentMatch.p2 === astroStore.user
      }
      return false
    }

    // MODO CARRERA: Solo juega si le queda combustible
    if (mode === 'RACE') {
      return multiplayerStore.raceFuel > 0
    }

    // Por defecto, todos los jugadores de la sala están en la partida
    const players = Array.isArray(multiplayerStore.room.players) ? multiplayerStore.room.players : []
    return players.some(p => (p.username || p) === astroStore.user)
  })
  const duelResult = ref(null) // { winner: string, loser: string, myScore: number, partnerScore: number }
  const showDuelResultOverlay = ref(false)
  const canAbortMission = ref(false)
  const abortTimerSeconds = ref(45)
  let abortInterval = null

  const anomalyIcon = computed(() => {
    const a = multiplayerStore.currentGlobalAnomaly
    if (a === 'meteorits') return { icon: 'mdi-weather-pouring', color: 'orange-accent-3', name: 'PLUJA DE METEORITS' }
    if (a === 'raig-tempesta') return { icon: 'mdi-lightning-bolt', color: 'yellow-accent-2', name: 'TORMENTA ELÈCTRICA' }
    if (a === 'nebulosa') return { icon: 'mdi-blur', color: 'deep-purple-lighten-3', name: 'NEBULOSA DENSA' }
    return { icon: 'mdi-alert-decagram', color: 'purple-accent-1', name: 'FENOMEN DESCONEGUT' }
  })

  // Vigilante para mostrar la alerta a TODOS los jugadores cuando se activa una anomalía
  watch(() => multiplayerStore.currentGlobalAnomaly, (newAnomaly) => {
    if (newAnomaly) {
      const anomalyNames = {
        'meteorits': 'PLUJA DE METEORITS (Dificultat ++)',
        'nebulosa': 'NEBULOSA DENSA (Visibilitat reduïda)',
        'raig-tempesta': 'TORMENTA DE RAIGS (Descàrregues elèctriques)'
      }
      const eventName = anomalyNames[newAnomaly] || newAnomaly.toUpperCase()
      activeMysteryAlert.value = `S'ha detectat un fenomen a l'espai! Efectes actius per a la pròxima missió: ${eventName}`
      
      // La alerta desaparece tras 6 segundos
      setTimeout(() => {
        activeMysteryAlert.value = null
      }, 6000)
    }
  })
  const finalScores = ref({})
  const matchWinnerName = ref(null)
  const showSuddenDeathOverlay = ref(false)
  const selectedModality = ref(localStorage.getItem('astro_mp_modality') || '1vs1')
  const subRole = computed(() => multiplayerStore.subRole)

  const globalTimeLeft = computed(() => multiplayerStore.timeLeft)

  watch(() => multiplayerStore.raceFuel, (newFuel) => {
    if (newFuel <= 0 && multiplayerStore.room?.gameConfig?.mode === 'RACE') {
      showSpectatorAlert.value = true
      setTimeout(() => {
        showSpectatorAlert.value = false
      }, 6000)
    }
  })

  // Watcher para el combustible en modo carrera
  watch(() => multiplayerStore.raceFuel, (newFuel) => {
    const isRaceMode = multiplayerStore.room?.gameConfig?.mode === 'RACE'
    const isPlaying = multiplayerStore.room?.status === 'PLAYING'

    if (newFuel <= 0 && isRaceMode && isPlaying) {
      if (activeGameComponent.value) {
        // Estas dentro de un juego activo: expulsarte al mapa en modo espectador
        console.log('COMBUSTIBLE AGOTADO: Expulsando del juego al mapa (modo espectador)')
        isTransitioning.value = true
        setTimeout(() => {
          activeGameComponent.value = null // Volver al mapa
          isTransitioning.value = false
          // El overlay .spectator-overlay se muestra automaticamente via v-if raceFuel <= 0
        }, 800)
      } else {
        // Ya estas en el mapa: el overlay de espectador se muestra automaticamente, nada mas
        console.log('COMBUSTIBLE AGOTADO: Modo espectador activo (mirando el mapa)')
      }
    }
  })


  function isModality(id) {
    return modalities.some(m => m.id === id)
  }

  function getModality(id) {
    return modalities.find(m => m.id === id) || {}
  }

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

  function selectModality (mId) {
    if (!isHost.value) {
      console.warn('--- INTENTO DE SELECCIÓN SIN SER HOST ---', mId)
      return
    }
    
    if (selectedModality.value === mId) return // Ya seleccionado

    // Validación de Vidas para el Modo Boss
    if (mId === 'boss') {
      const bossValidation = multiplayerStore.validateBossAccess()
      if (!bossValidation.valid) {
        showMessage(bossValidation.message, 'error')
        return
      }
    }

    console.log('--- CAMBIANDO MODALIDAD A ---', mId)
    selectedModality.value = mId
    localStorage.setItem('astro_mp_modality', mId)
    
    // Forzar actualización en el store
    if (multiplayerStore.room) {
      const modeMapping = {
        'carrera': 'RACE',
        'torneig': 'TOURNAMENT',
        '1vs1': 'NORMAL',
        '2vs2': 'NORMAL',
        'boss': 'BOSS'
      }

      multiplayerStore.updateGameConfig({ 
        modality: mId, 
        mode: modeMapping[mId] || 'NORMAL'
      })
    }
  }

  // Sincronizar modalidad desde el room (para guests y confirmar host)
  watch(() => multiplayerStore.room?.gameConfig?.modality, (newModality) => {
    if (newModality && newModality !== selectedModality.value) {
      console.log('--- MODALIDAD RECIBIDA DEL SERVIDOR ---', newModality)
      selectedModality.value = newModality
    }
  }, { immediate: true })

  watch(() => multiplayerStore.room?.gameConfig?.buyIn, (newBuyIn) => {
    if (newBuyIn && newBuyIn !== tournamentBuyIn.value) {
      console.log('--- CUOTA DE ENTRADA ACTUALIZADA ---', newBuyIn)
      tournamentBuyIn.value = newBuyIn
    }
  }, { immediate: true })

  function getRankName (level) {
    const index = Math.min(Math.floor(((level || 1) - 1) / 10), 14)
    return t(`ranks.${index}`)
  }

  function getGameIcon (game) {
    const icons = {
      'RadarScan': 'mdi-radar',
      'RadioSignal': 'mdi-radio-tower',
      'RhymeSquad': 'mdi-music-note',
      'SpelledRosco': 'mdi-alpha-a-circle-outline',
      'SymmetryBreaker': 'mdi-mirror-variant',
      'WordConstruction': 'mdi-hammer-wrench',
      'SyllableQuest': 'mdi-format-letter-case'
    }
    return icons[game] || 'mdi-gamepad-variant'
  }

  // Vigilante para cambios de juego (Solo para modo Cooperativo/Normal, el modo Carrera lo gestiona por Duelos)
  watch(() => multiplayerStore.room?.gameConfig?.currentGame, (newGame) => {
    const isRaceMode = multiplayerStore.room?.gameConfig?.mode === 'RACE'
    const isTournament = multiplayerStore.room?.gameConfig?.mode === 'TOURNAMENT'
    const status = multiplayerStore.room?.status
    
    // Solo saltar al juego si el estado es PLAYING o MATCH_STARTING y NO es modo Carrera
    if (!isRaceMode && (status === 'PLAYING' || status === 'MATCH_STARTING') && newGame && gameComponents[newGame] && !activeGameComponent.value) {
      
      // En modo TORNEO, solo entramos si somos participantes del match activo
      if (isTournament) {
        const currentMatch = multiplayerStore.room?.gameConfig?.tournament?.brackets?.find(m => m.status === 'PLAYING')
        if (currentMatch) {
          const isParticipant = currentMatch.p1 === astroStore.user || currentMatch.p2 === astroStore.user
          if (!isParticipant) {
            console.log('👀 Ets espectador d\'aquest duel del torneig.')
            activeGameComponent.value = null
            spectatedPlayer.value = currentMatch.p1
            isDuelInternal.value = true
            return
          } else {
            // Soy participante: ASEGURAR que spectatedPlayer sea nulo para no entrar en bucle de observación
            spectatedPlayer.value = null
          }
        }
      }

      // Reset de seguridad para abortar
      canAbortMission.value = false
      if (abortInterval) clearInterval(abortInterval)

      if (!isDuel.value) {
        abortTimerSeconds.value = 45
        abortInterval = setInterval(() => {
          if (abortTimerSeconds.value > 0) {
            abortTimerSeconds.value--
          } else {
            canAbortMission.value = true
            if (abortInterval) clearInterval(abortInterval)
          }
        }, 1000)
      } else {
        // En duelos no se puede abortar
        canAbortMission.value = false
      }
      
      console.log('--- CAMBIO DE JUEGO DETECTADO ---', newGame)
      const status = multiplayerStore.room?.status;
      // Solo cargamos el componente si estamos realmente jugando.
      // Si estamos en resultados o viendo el árbol, mantenemos null para ver el mapa.
      if (status === 'PLAYING' || status === 'SUDDEN_DEATH') {
        activeGameComponent.value = gameComponents[newGame]
      } else {
        activeGameComponent.value = null;
      }
    }
  })

  watch(() => multiplayerStore.room?.status, (newStatus, oldStatus) => {
    if (multiplayerStore.room?.gameConfig?.mode === 'TOURNAMENT') {
      if (isTournamentFinished.value || newStatus === 'GAME_OVER') {
        console.log('🏆 Torneig finalitzat! Mostrant podi i premis...')
        showMatchResult.value = true
        activeGameComponent.value = null
        return
      }

      if (newStatus === 'TOURNAMENT_BRACKETS') {
        console.log('🏆 Entrant a la vista de bracket. Netejant estats de joc...')
        spectatedPlayer.value = null
        activeGameComponent.value = null
        showMatchResult.value = false
        showRoundResults.value = false
        isTransitioning.value = false
      }

      if (newStatus === 'PLAYING' || newStatus === 'SUDDEN_DEATH') {
        const gameName = multiplayerStore.activeGameName;
        if (gameName && gameComponents[gameName]) {
          activeGameComponent.value = gameComponents[gameName];
        }
      }
    }
  })

  // Vigilante de Duelos 1vs1 (Sincronización Atacante-Rival)
  watch(() => multiplayerStore.lastDuelEvent, (event) => {
    if (!event) return
    
    // Si yo soy el RIVAL, tengo que entrar al juego que el atacante ha elegido
    const myName = (astroStore.user || '').toLowerCase()
    const targetRival = (event.rival || '').toLowerCase()

    if (targetRival === myName) {
      console.log("⚔️ ¡HAS SIDO RETADO POR " + event.attacker + "! Entrando en " + event.game)
      
      // Limpiar estados previos para "reparar" el siguiente juego
      multiplayerStore.lastSpectatorSync = {}
      spectatedPlayer.value = null
      activeGameComponent.value = null
      
      // Iniciar briefing con retraso para asegurar carga limpia
      setTimeout(() => {
        multiplayerStore.activeGameName = event.game
        currentDuelNodeId.value = event.nodeId
        currentAnomaly.value = null // NUNCA hay eventos en duelos 1vs1
        isDuelInternal.value = true
        
        startBriefing(event.game)
      }, 100)
    }
  })

  watch(() => multiplayerStore.room?.status, newStatus => {
    if (!newStatus) return

    if (newStatus === 'PLAYING' || newStatus === 'MATCH_STARTING') {
      showRoulette.value = false
      roundWinner.value = null
      
      if (newStatus === 'PLAYING') {
        startLocalTimer()
        if (isHost.value) {
          // El Host inicia el cronómetro global inmediatamente
          multiplayerStore.timeLeft = multiplayerStore.room?.gameConfig?.duration || 60
          console.log('--- CRONÓMETRO GLOBAL INICIADO POR EL HOST ---')
        }
      } else {
        stopLocalTimer()
      }
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
      case 'SUDDEN_DEATH': {
        stopLocalTimer()
        showSuddenDeathOverlay.value = true
        setTimeout(() => {
          showSuddenDeathOverlay.value = false
        }, 3000)
        break
      }
      case 'ROULETTE': {
        showRoulette.value = true
        roundWinner.value = null
        showRoundResults.value = false
        activeGameComponent.value = null
        
        // Limpieza profunda de estados anteriores para evitar parpadeos o bloqueos
        showBriefing.value = false
        isTransitioning.value = false
        spectatedPlayer.value = null
        multiplayerStore.roundScores = {}
        multiplayerStore.playerTimes = {}
        multiplayerStore.timeLeft = 0
        break
      }
      case 'TOURNAMENT_BRACKETS': {
        showRoulette.value = false
        showRoundResults.value = false
        activeGameComponent.value = null
        spectatedPlayer.value = null

        // Notificar cobro de buy-in si existe
        const buyIn = multiplayerStore.room?.gameConfig?.buyIn || 0
        if (buyIn > 0) {
          showMessage(`S'ha cobrat una inscripció de ${buyIn} Astrocions pel torneig`, 'warning')
        }
        break
      }
      case 'ROUND_RESULTS': {
        const isCompetitive = ['1vs1', 'carrera', 'torneig'].includes(selectedModality.value)
        showRoundResults.value = !isCompetitive 
        activeGameComponent.value = null
        spectatedPlayer.value = null
        if (isHost.value) {
          // En modo competitivo saltamos casi instantáneamente (300ms)
          const delay = isCompetitive ? 300 : 1500
          setTimeout(() => {
            if (multiplayerStore.room?.status === 'ROUND_RESULTS') {
              multiplayerStore.nextRound()
            }
          }, delay)
        }
        break
      }
      case 'GAME_OVER':
      case 'MATCH_RESULTS':
      case 'MATCH_FINISHED': {
        showRoundResults.value = false
        showMatchResult.value = true
        activeGameComponent.value = null
        spectatedPlayer.value = null
        finalScores.value = multiplayerStore.room?.gameConfig?.scores || {}
        
        if (multiplayerStore.room?.gameConfig?.mode === 'TOURNAMENT') {
          matchWinnerName.value = multiplayerStore.room?.gameConfig?.tournament?.brackets?.find(m => m.round === Math.ceil(Math.log2(multiplayerStore.room?.players?.length || 2)))?.winner || null
        } else {
          // Si no es torneo, el ganador es el que tiene más rondas ganadas en scores
          const scores = multiplayerStore.room?.gameConfig?.scores || {}
          const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
          if (sorted.length > 0) {
            if (sorted.length === 1 || sorted[0][1] > sorted[1][1]) {
              matchWinnerName.value = sorted[0][0]
            } else {
              matchWinnerName.value = null // Empate real
            }
          } else {
            matchWinnerName.value = null
          }
        }
        break
      }
      case 'LOBBY': {
        activeGameComponent.value = null
        spectatedPlayer.value = null
        showRoulette.value = false
        roundWinner.value = null
        showRoundResults.value = false
        showMatchResult.value = false
        matchWinnerName.value = null
        finalScores.value = {}
        isDuelInternal.value = false // Reset de duelo al volver al lobby
        break
      }
    }
  }, { immediate: true })

  const isTransitioning = ref(false)

  watch(() => multiplayerStore.lastMessage, msg => {
    if (!msg) return

    if (msg.type === 'MATCH_STARTING') {
      // Si el servidor indica que estamos en fase de ruleta, no iniciamos el juego todavía
      if (multiplayerStore.room?.status === 'ROULETTE') {
        console.log('--- RECIBIDO MATCH_STARTING EN FASE ROULETTE, ESPERANDO A QUE LA RULETA GIRE ---')
        return
      }
      showRoulette.value = false
      isTransitioning.value = true
      
      // Sincronización exacta del minijuego desde el servidor
      const gameName = msg.currentGame || multiplayerStore.room?.gameConfig?.currentGame
      serverGameName.value = gameName
      
      // La gestión de Astrocions ahora es automática desde el servidor al inicio del torneo

      const isTournament = multiplayerStore.room?.gameConfig?.mode === 'TOURNAMENT'

      if (gameName && gameComponents[gameName] && multiplayerStore.room?.gameConfig?.mode !== 'RACE') {
        const launch = () => {
          if (isTournament) {
            const currentMatch = multiplayerStore.room?.gameConfig?.tournament?.brackets?.find(m => m.status === 'PLAYING')
            if (currentMatch) {
              const isParticipant = currentMatch.p1 === astroStore.user || currentMatch.p2 === astroStore.user
              if (!isParticipant) {
                console.log('👀 Ets espectador d\'aquest duel del torneig. Component:', gameName)
                isTransitioning.value = false
                isDuelInternal.value = true
                multiplayerStore.roundScores = {}
                showBriefing.value = false
                
                // Retraso para que el usuario pueda ver el árbol antes de entrar a observar
                setTimeout(() => {
                  if (multiplayerStore.room?.status === 'PLAYING' && !activeGameComponent.value) {
                    spectatedPlayer.value = currentMatch.p1
                  }
                }, 1500)
                return
              }
            }
            // En torneos, inicio instantáneo para los participantes
            spectatedPlayer.value = null
            activeGameComponent.value = null
            multiplayerStore.lastSpectatorSync = {}
            multiplayerStore.roundScores = {}
            multiplayerStore.returnedPlayers = []
            
            setTimeout(() => {
              activeGameComponent.value = gameComponents[gameName]
              isTransitioning.value = false
              startBriefing(gameName, null, 10)
            }, 50)
          } else {
            // MODO NORMAL / COOP / VS
            activeGameComponent.value = gameComponents[gameName]
            isTransitioning.value = false
            startBriefing(gameName)
          }
        }

        if (isTournament) {
          launch()
        } else {
          setTimeout(launch, 300)
        }
      } else {
        // En modo carrera u otros, quitamos la transición si ya estamos en el mapa o no hay juego
        isTransitioning.value = false
      }
    }

    if (msg.type === 'SUDDEN_DEATH_START') {
      console.log('⚡ ¡MUERTE SÚBITA! El primer acierto gana.')
      showMessage('¡EMPATE! MUERTE SÚBITA: El primer acierto gana.', 'error')
      showSuddenDeathOverlay.value = true
      setTimeout(() => {
        showSuddenDeathOverlay.value = false
      }, 3000)
    }

    if (msg.type === 'ROUND_ENDED_BY_WINNER') {
      roundWinner.value = msg.winner
      isRoundTie.value = msg.tie || false
      // Solo mostrar resultados de ronda en modo Cooperativo o por Equipos, no en Duelo/Carrera
      showRoundResults.value = !isDuel.value && multiplayerStore.room?.gameConfig?.mode !== 'RACE'
      
      // En modo carrera, ocultar automáticamente después de 4 segundos
      if (multiplayerStore.room?.gameConfig?.mode === 'RACE') {
        setTimeout(() => {
          showRoundResults.value = false
        }, 4000)
      }
    }

    if (msg.type === 'MATCH_FINISHED') {
      matchWinnerName.value = msg.winner ?? null
      finalScores.value = msg.room?.gameConfig?.scores || {}
      showMatchResult.value = true
      
      // LIMPIEZA INMEDIATA: Expulsar a todos (jugadores y observadores) del componente de juego
      activeGameComponent.value = null
      spectatedPlayer.value = null
      multiplayerStore.lastSpectatorSync = {}
      showRoundResults.value = false

      // Entrega de premios y automatización de retorno en Torneos
      if (multiplayerStore.room?.gameConfig?.mode === 'TOURNAMENT') {
        const brackets = multiplayerStore.room.gameConfig.tournament.brackets || []
        const finalMatch = brackets[brackets.length - 1]
        
        // Si el match que acaba de terminar NO es el último del bracket, volvemos al árbol
        const isFinalMatch = finalMatch && tournamentParticipants.value &&
          ((finalMatch.p1 === tournamentParticipants.value.p1 && finalMatch.p2 === tournamentParticipants.value.p2) ||
           (finalMatch.p1 === tournamentParticipants.value.p2 && finalMatch.p2 === tournamentParticipants.value.p1))

        if (!isFinalMatch && !isTournamentFinished.value) {
          console.log('🔄 Combate finalitzat. Tornant a l\'arbre automàticament...')
          setTimeout(async () => {
            if (showMatchResult.value) {
              showMatchResult.value = false
              spectatedPlayer.value = null // Limpiar espectador si lo había
              await nextTick()
              // NO llamamos a returnToLobby() para no forzar el estado LOBBY localmente
            }
          }, 3000)
        } else {
          console.log('🏆 TORNEIG FINALITZAT DEFINITIVAMENT.')
        }

        const buyIn = multiplayerStore.room.gameConfig.buyIn || 0
        const totalPlayers = (multiplayerStore.room.players || []).length
        const totalPool = buyIn * totalPlayers
        
        // Determinar rankings por scores
        const sortedScores = Object.entries(finalScores.value)
          .sort(([,a], [,b]) => b - a)
          .map(([user]) => user)
          
        const myRank = sortedScores.indexOf(astroStore.user) + 1
        let prize = 0
        
        if (myRank === 1) prize = Math.floor(totalPool * 0.6)
        else if (myRank === 2) prize = Math.floor(totalPool * 0.3)
        else if (myRank === 3) prize = Math.floor(totalPool * 0.1)
        
        if (prize > 0) {
          console.log(`🏆 PREMIO DE TORNEO (Puesto ${myRank}): ${prize} Astrocions`)
          astroStore.setCoins(astroStore.coins + prize)
          showMessage(`¡HAS QUEDAT EN EL PUESTO ${myRank}! Has guanyat ${prize} Astrocions`, 'success')
        }
      }
    }

    if (msg.type === 'GAME_ACTION' && msg.action?.type === 'SABOTAGE') {
      handleSabotageNotification(msg)
    }

    if (msg.type === 'GAME_ACTION' && msg.action?.type === 'TIME_PENALTY') {
      // Simular notificación de sabotaje para TIME_PENALTY también
      handleSabotageNotification({
        from: msg.from,
        action: { subtype: 'REDUCE_TIME', amount: msg.action.amount || 5 }
      })
    }

    if (msg.type === 'GAME_ACTION' && msg.action?.type === 'SCORE_UPDATE') {
      if (msg.from && msg.from !== astroStore.user) {
        multiplayerStore.roundScores = { ...multiplayerStore.roundScores, [msg.from]: msg.action.score }
      }
    }

    if (isHost.value && msg.type === 'GAME_ACTION' && msg.action?.type === 'REQUEST_ABORT_MATCH') {
      console.log('--- RECIBIDA PETICIÓN DE ABORTO DE INVITADO ---')
      multiplayerStore.setRoomStatus('LOBBY')
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

  // Sincronización de DUELOS (para que el rival también sepa que es un duelo)
  watch(() => multiplayerStore.lastDuelEvent, (newDuel) => {
    if (newDuel && (newDuel.attacker === astroStore.user || newDuel.rival === astroStore.user)) {
      console.log("🔥 DUELO DETECTADO Y SINCRONIZADO EN LOBBY:", newDuel)
      isDuelInternal.value = true
      currentDuelNodeId.value = newDuel.nodeId
      
      // Si soy el rival, debo prepararme para entrar al juego cuando el host lo lance
      if (newDuel.rival === astroStore.user) {
        startBriefing(newDuel.game, null)
      }
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
    const players = Array.isArray(multiplayerStore.room.players) ? multiplayerStore.room.players : []
    const op = players.find(p => (p.username || p) !== astroStore.user)
    return op?.username || op || t('multiplayerLobby.opponent')
  })

  const opponentTitle = computed(() => {
    const opName = opponentName.value
    if (opName === t('multiplayerLobby.opponent')) return null
    const explorer = astroStore.explorers?.find(e => e.user === opName)
    return explorer?.selectedTitle || null
  })

  const heroesList = computed(() => {
    if (!multiplayerStore.room?.gameConfig?.heroHealth) return []
    return Object.keys(multiplayerStore.room.gameConfig.heroHealth)
  })

  const currentStake = computed(() => {
    return multiplayerStore.room?.gameConfig?.bossStakes?.[astroStore.user] || 1
  })

  const updateStake = (delta) => {
    const players = Array.isArray(multiplayerStore.room?.players) ? multiplayerStore.room.players : []
    const playerObj = players.find(p => getPlayerName(p) === astroStore.user)
    const maxAvailable = playerObj?.lives || 0
    const newStake = Math.max(1, Math.min(maxAvailable, currentStake.value + delta))
    multiplayerStore.updateBossStakes(newStake)
  }

  const isTeammate = computed(() => {
    if (!multiplayerStore.room) return false

    // Juegos que usan el marcador unificado estilo Just Dance (SOLO EN COOP)
    const COOP_GAMES = ['RadioSignal', 'SymmetryBreaker', 'WordConstruction', 'SyllableQuest', 'RadarScan', 'SpelledRosco']
    const isCoopGame = COOP_GAMES.includes(multiplayerStore.room?.gameConfig?.currentGame)
    
    if (isDuel.value) return false
    if (isCoopGame) return true

    if (!multiplayerStore.room?.gameConfig?.teams) return false
    const myTeam = multiplayerStore.room?.gameConfig.teams[astroStore.user]
    const opponentTeam = multiplayerStore.room?.gameConfig.teams[opponentName.value]
    return myTeam && myTeam === opponentTeam
  })

  const allPlayersHaveTeam = computed(() => {
    if (!multiplayerStore.room) return false
    if (selectedModality.value === '1vs1' || selectedModality.value === 'carrera' || selectedModality.value === 'torneig' || selectedModality.value === 'boss') return true
    const teams = multiplayerStore.room.gameConfig?.teams || {}
    const players = Array.isArray(multiplayerStore.room.players) ? multiplayerStore.room.players : []
    return players.every(p => teams[getPlayerName(p)])
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
    if (isDuel.value && !multiplayerStore.room?.gameConfig?.teams) {
      // En duelos sin equipos definidos (ej: vs SISTEMA), forzamos 2 "equipos" para el HUD
      return [
        { id: astroStore.user, name: astroStore.user, theme: 'red' },
        { id: opponentName.value, name: opponentName.value, theme: 'amber' }
      ]
    }
    
    if (!multiplayerStore.room?.gameConfig?.teams) return []
    const seed = (multiplayerStore.room?.id || 'BASE') + (multiplayerStore.room?.gameConfig?.seed || '')
    const seedSum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
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

    // Caso especial de duelos sin equipos (teamId es el nombre del usuario)
    if (isDuel.value && !multiplayerStore.room?.gameConfig?.teams) {
      return (matchScores[teamId] || 0) + (roundScores[teamId] || 0)
    }

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
    const playersArr = Array.isArray(multiplayerStore.room.players) ? multiplayerStore.room.players : []
    const players = playersArr.map(p => getPlayerName(p))
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

  watch(maxPlayers, newVal => {
    if (isHost.value && multiplayerStore.room) {
      multiplayerStore.updateGameConfig({ maxPlayers: newVal })
      localStorage.setItem('astro_mp_maxPlayers', newVal)
    }
  })

  watch(pointsToWin, newVal => {
    if (isHost.value && multiplayerStore.room) {
      multiplayerStore.updateGameConfig({ pointsToWin: newVal })
      localStorage.setItem('astro_mp_pointsToWin', newVal)
    }
  })

  let hudTimerInterval = null

  function startHudTimer() {
    if (hudTimerInterval) clearInterval(hudTimerInterval)
    hudTimerInterval = setInterval(() => {
      const mode = multiplayerStore.room?.gameConfig?.mode
      const modality = multiplayerStore.room?.gameConfig?.modality
      const is1vs1 = modality === '1vs1' || mode === 'TOURNAMENT' || mode === 'DUEL'
      
      if (is1vs1 && multiplayerStore.room?.status === 'PLAYING') {
        const updatedTimes = { ...multiplayerStore.playerTimes }
        let changed = false
        Object.keys(updatedTimes).forEach(p => {
          if (updatedTimes[p] > 0) {
            updatedTimes[p]--
            changed = true
          }
        })
        if (changed) {
          multiplayerStore.playerTimes = updatedTimes
          // También sincronizar timeLeft del jugador local
          if (updatedTimes[astroStore.user] !== undefined) {
            multiplayerStore.timeLeft = updatedTimes[astroStore.user]
          }
        }
      }
    }, 1000)
  }

  function stopHudTimer() {
    if (hudTimerInterval) {
      clearInterval(hudTimerInterval)
      hudTimerInterval = null
    }
  }

  watch(() => multiplayerStore.room?.status, (newStatus) => {
    if (newStatus === 'PLAYING') {
      startHudTimer()
    } else {
      stopHudTimer()
    }
  }, { immediate: true })

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
    if (typeof player === 'string') return player

    // Prioridad de campos: displayName -> username -> user -> id
    const name = player.displayName || player.username || player.user || player.id

    if (name) {
      if (typeof name === 'string') return name
      if (typeof name === 'object' && name !== null) {
        // Si el campo es un objeto, intentamos sacar el string de dentro
        return name.username || name.user || JSON.stringify(name)
      }
      return String(name)
    }

    return 'Jugador'
  }

  function getPlayerAvatar (username) {
    if (!username) return '/Astronauta_blanc.jpg'
    const players = Array.isArray(multiplayerStore.room?.players) ? multiplayerStore.room.players : []
    const player = players.find(p => (p.username || p) === username)
    if (player?.avatar) return player.avatar
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
      pointsToWin: (selectedModality.value === 'carrera' || selectedModality.value === 'torneig') ? 1 : pointsToWin.value,
      buyIn: tournamentBuyIn.value,
      modality: selectedModality.value,
      mode: selectedModality.value === 'carrera' ? 'RACE' : (selectedModality.value === 'torneig' ? 'TOURNAMENT' : 'NORMAL'),
      numGoldMines: numGoldMines.value,
      numBattles: numBattles.value,
      numFuelStations: numFuelStations.value,
      numMysteryNodes: numMysteryNodes.value
    }
    multiplayerStore.createRoom(astroStore.user, isPublic.value, maxPlayers.value, initialConfig)
  }

  function startMatch () {
    if (!isHost.value) return

    // Doble verificación de vidas para el Modo Boss al iniciar
    if (selectedModality.value === 'boss') {
      const bossValidation = multiplayerStore.validateBossAccess()
      if (!bossValidation.valid) {
        showMessage(bossValidation.message, 'error')
        return
      }
    }
    
    // Generar una semilla aleatoria nueva para que el mapa sea distinto en cada lanzamiento
    const newSeed = Math.random().toString(36).substring(7)
    
    // Actualizar la config con la nueva semilla y los ajustes actuales antes de empezar
    multiplayerStore.updateGameConfig({
      seed: newSeed,
      currentRound: 0,
      scores: {},
      buyIn: tournamentBuyIn.value,
      numGoldMines: numGoldMines.value,
      numBattles: numBattles.value,
      numFuelStations: numFuelStations.value,
      numMysteryNodes: numMysteryNodes.value,
      sharedChallenge: sharedChallenge.value
    })
    
    // Limpiar cualquier juego previo antes de lanzar modo Carrera
    activeGameComponent.value = null
    multiplayerStore.activeGameName = null
    
    // Iniciar la partida oficialmente
    multiplayerStore.startMatch()
  }

  function updateRoomConfig () {
    if (!isHost.value || !multiplayerStore.room) return
    multiplayerStore.updateGameConfig({
      numGoldMines: numGoldMines.value,
      numBattles: numBattles.value,
      numFuelStations: numFuelStations.value,
      numMysteryNodes: numMysteryNodes.value,
      buyIn: tournamentBuyIn.value,
      sharedChallenge: sharedChallenge.value
    })
    localStorage.setItem('astro_mp_sharedChallenge', String(sharedChallenge.value))
    localStorage.setItem('astro_mp_tournamentBuyIn', String(tournamentBuyIn.value))

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

  async function onGameFinished (scoreValue) {
    if (abortInterval) clearInterval(abortInterval)
    
    // Registrar la partida para ganar Astrocions y XP (Solo si no somos espectadores)
    if (astroStore.registerCompletedGame && !spectatedPlayer.value) {
      console.log('💰 REGISTRANDO PARTIDA PARA ASTROCIONS:', multiplayerStore.activeGameName, 'Puntos:', scoreValue)
      await astroStore.registerCompletedGame(multiplayerStore.activeGameName || 'MultiplayerGame', scoreValue)
    }

    if (spectatedPlayer.value) {
      console.log('👀 Fin de observación de partida para:', spectatedPlayer.value)
      isTransitioning.value = true
      setTimeout(() => {
        spectatedPlayer.value = null
        isTransitioning.value = false
      }, 1000)
      return
    }

    if (multiplayerStore.room?.gameConfig?.mode === 'RACE') {
      if (isDuel.value) {
        handleDuelEnd(scoreValue)
        return
      }
      
      // Misión normal en planeta
      const completedPlanetId = multiplayerStore.raceProgress
      multiplayerStore.updateRaceProgress(completedPlanetId, true)
      isTransitioning.value = true
      setTimeout(() => {
        activeGameComponent.value = null
        isTransitioning.value = false
      }, 1500)
    } else if (multiplayerStore.room?.gameConfig?.mode === 'TOURNAMENT') {
      multiplayerStore.submitRoundResult()
      isTransitioning.value = true
      setTimeout(() => {
        activeGameComponent.value = null
        isTransitioning.value = false
      }, 1500)
    } else {
      multiplayerStore.submitRoundResult()
    }
  }

  function handleDuelEnd (myFinalScore) {
    // Obtenemos la puntuación del rival desde el store (se actualiza por SCORE_UPDATE)
    const partnerName = Object.keys(multiplayerStore.playersProgress).find(u => u !== astroStore.user)
    const partnerScore = multiplayerStore.roundScores[partnerName] || 0
    
    const amIWinner = myFinalScore > partnerScore
    
    duelResult.value = {
      winner: amIWinner ? astroStore.user : partnerName,
      loser: amIWinner ? partnerName : astroStore.user,
      myScore: myFinalScore,
      partnerScore: partnerScore
    }
    
    showDuelResultOverlay.value = true
    
    // Después de 4 segundos de gloria/vergüenza, volvemos al mapa
    setTimeout(() => {
      showDuelResultOverlay.value = false
      
      if (!amIWinner) {
        // Si he perdido, me aplico el stun a mí mismo
        multiplayerStore.applyStun(30)
      }
      
      // Marcar nodo como completado y volver
      const completedPlanetId = multiplayerStore.raceProgress
      multiplayerStore.updateRaceProgress(completedPlanetId, true)
      
      activeGameComponent.value = null
      isDuelInternal.value = false
    }, 4000)
  }

  async function onPlanetSelected ({ id, node }) {
    // Guardia: si no hay combustible, somos espectadores, no podemos movernos
    if (multiplayerStore.raceFuel <= 0) return

    // Caso 1: Nodo de Misterio (?)
    if (node.type === 'mystery') {
      const anomalyNames = {
        'meteorits': 'PLUJA DE METEORITS',
        'nebulosa': 'NEBULOSA DENSA',
        'raig-tempesta': 'TORMENTA DE RAIGS'
      }
      const eventName = anomalyNames[node.anomaly] || node.anomaly?.toUpperCase() || 'FENOMEN DESCONEGUT'
      activeMysteryAlert.value = `¡AVÍS METEOROLÒGIC! En la pròxima missió hi haurà: ${eventName}`
      
      // Notificar a TODOS los jugadores para que guarden la anomalía para SU propia próxima partida
      multiplayerStore.sendGameAction({
        type: 'GLOBAL_ANOMALY_TRIGGER',
        anomaly: node.anomaly
      })

      // Guardarla también localmente por si acaso el mensaje tarda
      multiplayerStore.nextMoveAnomaly = node.anomaly

      // Actualizar posición pero NO entrar en juego
      multiplayerStore.updateRaceProgress(id, true)
      
      setTimeout(() => {
        activeMysteryAlert.value = null
      }, 5000)
      return
    }

    // Caso 4: Arena de Duel
    if (node.type === 'battle') {
      // Mover la nave inmediatamente
      multiplayerStore.updateRaceProgress(id, false)
      
      if (otherPlayers.value.length === 0) {
        console.log("ARENA DUEL: No hay rivales, modo práctica auto-activado")
        // Si no hay rivales (estás solo), entrar a un juego aleatorio directamente (Modo Práctica)
        const duelGames = ['SymmetryBreaker', 'RadioSignal', 'WordConstruction']
        const randomGame = duelGames[Math.floor(Math.random() * duelGames.length)]
        
        multiplayerStore.activeGameName = randomGame
        currentDuelNodeId.value = id
        isDuelInternal.value = true
        
        startBriefing(randomGame)
      } else {
        console.log("ARENA DUEL: Rivales encontrados, abriendo selector. Rivales:", otherPlayers.value.length)
        // Si hay rivales, mostrar el selector
        showDuelSelector.value = true
        isDuelInternal.value = true
        currentDuelNodeId.value = id
      }
      return 
    }

    // Caso 2: Planeta con Juego
    if (node.game && gameComponents[node.game]) {
      // Informar al store del juego activo para ajustar consumos
      multiplayerStore.activeGameName = node.game
      isDuelInternal.value = false
      
      // Actualizar posición antes de entrar al juego
      multiplayerStore.updateRaceProgress(id, false)
      
      // En misiones normales SÍ permitimos anomalías
      startBriefing(node.game, node.anomaly || null)
    } 
    
    // Caso 3: Otros nodos (Fuel, Coins, etc)
    multiplayerStore.updateRaceProgress(id, true)
    
    // Si es la meta final, enviar resultado para terminar la partida y mostrar estadísticas
    if (node.isGoal) {
      // Bonus por llegar a la meta
      const finalBonus = 500
      
      // Registrar bonus final como una "partida" para que sume Astrocions (+100 aprox por el bonus)
      if (astroStore.registerCompletedGame) {
        console.log('🏆 META ALCANZADA: Registrando bonus de 500 puntos...')
        await astroStore.registerCompletedGame('RaceGoal', finalBonus)
      }
      
      setTimeout(() => {
        multiplayerStore.submitRoundResult()
      }, 2000)
    }
  }

  function returnToMap () {
    console.log('--- FORZANDO RETORNO AL MAPA ---')
    activeGameComponent.value = null
    if (multiplayerStore.room?.status === 'MAP' || multiplayerStore.room?.status === 'PLAYING') {
      isTransitioning.value = false
    }
  }

  function returnToLobby () {
    showMatchResult.value = false
    activeGameComponent.value = null
  }

  function handleAbort () {
    console.log('--- HANDLE ABORT CLICADO ---', { 
      hasGame: !!activeGameComponent.value, 
      mode: multiplayerStore.room?.gameConfig?.mode,
      isHost: isHost.value 
    })

    // Prioridad 1: Salir del minijuego al mapa si estamos en carrera
    if (activeGameComponent.value && multiplayerStore.room?.gameConfig?.mode === 'RACE') {
      console.log('Abortando misión y volviendo al mapa...')
      handleAbortMission()
      return
    }

    // Prioridad 2: Si hay juego activo o estamos en resultados, abortar y volver al LOBBY (Sala)
    if (activeGameComponent.value || multiplayerStore.room?.status === 'ROUND_RESULTS') {
      if (isHost.value) {
        console.log('Host cerrando partida a LOBBY...')
        multiplayerStore.setRoomStatus('LOBBY')
      } else {
        console.log('Invitado solicitando abortar partida al Host...')
        multiplayerStore.sendGameAction({ type: 'REQUEST_ABORT_MATCH' })
      }
      return
    }

    // Prioridad 3: Salida definitiva si no hay partida en curso
    if (isHost.value) {
      console.log('Host cerrando sala...')
      multiplayerStore.setRoomStatus('LOBBY')
    } else {
      console.log('Invitado abandonando sala definitivamente...')
      multiplayerStore.leaveRoom()
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



  // Sincronizar sliders del mapa con el gameConfig (host → todos)
  watch([numGoldMines, numBattles, numFuelStations, numMysteryNodes], ([mines, battles, fuels, mystery]) => {
    localStorage.setItem('astro_mp_goldMines',    String(mines))
    localStorage.setItem('astro_mp_battles',      String(battles))
    localStorage.setItem('astro_mp_fuelStations', String(fuels))
    localStorage.setItem('astro_mp_mysteryNodes', String(mystery))
    
    if (isHost.value && multiplayerStore.room) {
      updateRoomConfig()
    }
  })

  function getAvatar (user) {
    if (!user) return 'https://api.dicebear.com/7.x/bottts/svg?seed=guest'
    // Si user es un objeto (player), sacar el username
    const username = typeof user === 'object' ? (user.username || user.id) : user
    const p = multiplayerStore.room?.players?.find(p => p.username === username)
    return p?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + username
  }

  function handleAbortMission () {
    if (!canAbortMission.value) return
    console.log('--- EJECUTANDO ABORTAR MISIÓN ---')
    canAbortMission.value = false
    const currentNodeId = multiplayerStore.playersProgress[astroStore.user] || 'START'
    multiplayerStore.updateRaceProgress(currentNodeId, true)
    returnToMap()
  }

  function handleKeydown (e) {
    if (e.code === 'Space') {
      console.log('--- TECLA ESPACIO PULSADA ---', { 
        hasGame: !!activeGameComponent.value,
        canAbort: canAbortMission.value,
        mode: multiplayerStore.room?.gameConfig?.mode 
      })
    }
    if (e.code === 'Space' && activeGameComponent.value && multiplayerStore.room?.gameConfig?.mode === 'RACE' && canAbortMission.value) {
      e.preventDefault()
      e.stopPropagation()
      handleAbortMission()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown, { capture: true })
    if (!multiplayerStore.isConnected) {
      multiplayerStore.connect()
    }
  })

  function startAbortTimer () {
    canAbortMission.value = false
    abortTimerSeconds.value = 45
    if (abortInterval) clearInterval(abortInterval)
    
    console.log('⏱️ INICIANDO CUENTA ATRÁS DE ABORTO: 45s')
    
    abortInterval = setInterval(() => {
      if (abortTimerSeconds.value > 0) {
        abortTimerSeconds.value--
      } else {
        console.log('🚀 BOTÓN DE ABORTO DISPONIBLE')
        canAbortMission.value = true
        clearInterval(abortInterval)
      }
    }, 1000)
  }

  function startBriefing (gameName, anomaly = null, duration = 10) {
    if (!gameName || !gameComponents[gameName]) return
    
    // Si no viene anomalía, usamos la que tengamos guardada del interrogante
    const activeAnomaly = anomaly || multiplayerStore.nextMoveAnomaly
    currentAnomaly.value = activeAnomaly

    // Si había una anomalía pendiente, la "consumimos" ahora
    if (multiplayerStore.nextMoveAnomaly) {
      console.log('🌪️ CONSUMIENDO ANOMALÍA PENDIENTE EN BRIEFING:', multiplayerStore.nextMoveAnomaly)
      multiplayerStore.clearGlobalAnomaly()
    }

    // OMITIR BRIEFING: Solo la modalidad cooperativa 2vs2 muestra la pantalla de instrucciones/briefing.
    // Todos los demás modos (1vs1, individual, torneo, modo jefe, carrera, etc.) inician instantáneamente.
    const modality = multiplayerStore.room?.gameConfig?.modality
    const is2vs2 = modality === '2vs2'
    
    if (!is2vs2) {
      showBriefing.value = false
      isTransitioning.value = true
      
      if (!isDuel.value) {
        startAbortTimer()
      } else {
        canAbortMission.value = false
      }
      
      setTimeout(() => {
        activeGameComponent.value = gameComponents[gameName]
        isTransitioning.value = false
      }, 500)
      return
    }
    
    // Si es un duelo o modo normal (COOP/VS), mostramos el briefing detallado
    showBriefing.value = true
    briefingCountdown.value = duration
    
    if (briefingTimer) clearInterval(briefingTimer)
    
    // Mientras mostramos el briefing, preparamos la transición
    isTransitioning.value = true
    
    // En duelos no se puede abortar, pero en misiones cooperativas normales sí (tras 45s)
    if (!isDuel.value) {
      startAbortTimer()
    } else {
      canAbortMission.value = false
    }

    briefingTimer = setInterval(() => {
      briefingCountdown.value--
      if (briefingCountdown.value <= 0) {
        clearInterval(briefingTimer)
        showBriefing.value = false
        isTransitioning.value = false
        // Al terminar el briefing, montamos el juego
        activeGameComponent.value = gameComponents[gameName]
      }
    }, 1000)
  }

  let localTimerInterval = null

  function startLocalTimer() {
    if (localTimerInterval) clearInterval(localTimerInterval)
    localTimerInterval = setInterval(() => {
      // Solo si el estado sigue siendo PLAYING
      if (multiplayerStore.room?.status !== 'PLAYING') {
        clearInterval(localTimerInterval)
        localTimerInterval = null
        return
      }

      // Decrementar localmente el tiempo global
      if (multiplayerStore.timeLeft > 0) {
        multiplayerStore.timeLeft--
      }

      // Decrementar localmente los tiempos individuales para evitar visual lag
      if (multiplayerStore.playerTimes) {
        Object.keys(multiplayerStore.playerTimes).forEach(username => {
          if (multiplayerStore.playerTimes[username] > 0) {
            multiplayerStore.playerTimes[username]--
          }
        })
      }
      
      // Sincronizar con el gameConfig local
      if (multiplayerStore.room?.gameConfig) {
        multiplayerStore.room.gameConfig.timeLeft = multiplayerStore.timeLeft
        if (multiplayerStore.room.gameConfig.playerTimes) {
          multiplayerStore.room.gameConfig.playerTimes = { ...multiplayerStore.playerTimes }
        }
      }
    }, 1000)
  }

  function stopLocalTimer() {
    if (localTimerInterval) {
      clearInterval(localTimerInterval)
      localTimerInterval = null
    }
  }

  onUnmounted(() => {
    if (briefingTimer) clearInterval(briefingTimer)
    stopLocalTimer()
    multiplayerStore.stopFuelTimer()
    window.removeEventListener('keydown', handleKeydown, { capture: true })
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

.rules-panel-modern {
  border: 1px solid rgba(0, 229, 255, 0.2) !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4), inset 0 0 60px rgba(0, 229, 255, 0.05);
}

.rules-icon-bg-large {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 229, 255, 0.1);
  border-radius: 20px;
  border: 2px solid rgba(0, 229, 255, 0.3);
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.2);
}

.modality-card {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  min-height: 60px;
  margin-bottom: 4px;
}

.modality-card:hover:not(.disabled-mode).is-host {
  border-color: rgba(0, 229, 255, 0.6);
  background: rgba(0, 229, 255, 0.1);
  transform: translateX(5px);
}

.modality-card.active-mode {
  border-color: #00e5ff;
  background: rgba(0, 229, 255, 0.2);
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.3);
}

.modality-card .text-caption {
  font-size: 0.75rem !important;
  font-weight: 900 !important;
  letter-spacing: 0.5px;
}

.game-selector-btn-large {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.game-btn-active-large {
  background: rgba(0, 229, 255, 0.2) !important;
  border: 2px solid rgba(0, 229, 255, 0.6) !important;
  box-shadow: 0 0 30px rgba(0, 229, 255, 0.4);
  transform: scale(1.1);
}

.line-height-1-8 {
  line-height: 1.8;
}

.tip-box-large {
  background: rgba(255, 179, 0, 0.08);
  border: 1px solid rgba(255, 179, 0, 0.3);
  border-left: 6px solid #ffb300;
  box-shadow: 0 0 20px rgba(255, 179, 0, 0.1);
}

.tip-icon-glow {
  filter: drop-shadow(0 0 10px #ffb300);
}

.mission-visual-box {
  width: 100%;
  max-width: 400px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 229, 255, 0.1);
  box-shadow: inset 0 0 30px rgba(0, 229, 255, 0.05);
}

.bg-dark-soft {
  background: rgba(15, 23, 42, 0.4);
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.line-height-1-4 {
  line-height: 1.4;
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.modality-card.is-host:hover:not(.disabled-mode):not(.active-mode) {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
  transform: translateY(-4px);
}

.active-mode {
  border-color: #00e5ff !important;
  background: rgba(0, 229, 255, 0.15) !important;
  box-shadow: 0 0 25px rgba(0, 229, 255, 0.3);
  animation: mode-pulse 2s infinite ease-in-out;
}

@keyframes mode-pulse {
  0% { box-shadow: 0 0 15px rgba(0, 229, 255, 0.2); }
  50% { box-shadow: 0 0 30px rgba(0, 229, 255, 0.4); }
  100% { box-shadow: 0 0 15px rgba(0, 229, 255, 0.2); }
}

.icon-pop {
  animation: icon-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes icon-pop {
  0% { transform: scale(0.8); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.disabled-mode {
  opacity: 0.3;
  cursor: not-allowed;
  filter: grayscale(0.8);
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

.boss-mode-hud-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1000;
}

.boss-header-center {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: auto;
  min-width: 500px;
  pointer-events: auto;
}

.heroes-status-side {
  position: absolute;
  top: 100px;
  left: 20px;
  max-height: 70vh;
  overflow-y: auto;
  pointer-events: auto;
}

.hero-status-compact {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(0, 229, 255, 0.3);
  backdrop-filter: blur(10px);
  min-width: 130px;
  transition: all 0.2s ease;
}

.hero-status-compact:hover {
  border-color: #00e5ff;
  transform: translateX(5px);
}

.action-feed-floating {
  position: absolute;
  bottom: 120px;
  left: 20px;
  width: 300px;
  pointer-events: auto;
}

.boss-arsenal-fixed-right {
  position: fixed;
  top: 50%;
  right: 40px;
  transform: translateY(-50%);
  width: 380px;
  z-index: 3000;
  pointer-events: auto;
  animation: arsenal-slide-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.boss-space-hint {
  position: fixed;
  bottom: 40px;
  right: 40px;
  background: rgba(15, 23, 42, 0.8);
  padding: 12px 24px;
  border-radius: 99px;
  border: 1px solid rgba(255, 82, 82, 0.6);
  color: white;
  font-size: 0.95rem;
  font-weight: bold;
  letter-spacing: 1px;
  z-index: 2500;
  backdrop-filter: blur(12px);
  box-shadow: 0 0 30px rgba(255, 82, 82, 0.3);
  animation: hint-float 3s infinite ease-in-out;
}

/* ==== EFECTOS DE ATAQUE DEL JEFE ==== */
.boss-effect-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  pointer-events: none;
}

.boss-effect-active-black_hole {
  animation: intense-shake 0.5s infinite;
}

.boss-effect-active-lightning_storm {
  animation: lightning-glitch 0.4s infinite;
}

.boss-effect-active-freeze {
  filter: saturate(0.2) contrast(1.1);
  transition: filter 0.5s ease;
}

@keyframes intense-shake {
  0% { transform: translate(0,0) rotate(0deg); }
  25% { transform: translate(8px, 8px) rotate(1deg); }
  50% { transform: translate(-8px, -8px) rotate(-1deg); }
  75% { transform: translate(8px, -8px) rotate(1deg); }
  100% { transform: translate(0,0) rotate(0deg); }
}

@keyframes lightning-glitch {
  0%, 100% { opacity: 1; transform: scale(1); filter: brightness(1); }
  10% { opacity: 0.8; transform: scale(1.01); filter: brightness(2); }
  20% { opacity: 1; transform: scale(1); filter: brightness(1); }
  30% { opacity: 0.9; transform: translate(5px, 0); }
  40% { opacity: 1; transform: translate(0, 0); }
}

@keyframes screen-shake {
  0% { transform: translate(0,0); }
  25% { transform: translate(5px, 5px); }
  50% { transform: translate(-5px, -5px); }
  75% { transform: translate(5px, -5px); }
  100% { transform: translate(0,0); }
}

@keyframes vortex-pull {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

@keyframes lightning-strobe {
  0%, 10%, 20%, 100% { background: transparent; }
  5%, 15% { background: rgba(255,255,255,0.2); }
}

@keyframes arsenal-slide-in {
  from { transform: translateX(100%) scale(0.9); opacity: 0; }
  to { transform: translateX(0) scale(1); opacity: 1; }
}

@keyframes hint-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); box-shadow: 0 5px 25px rgba(255, 82, 82, 0.4); }
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

.duel-result-card {
  background: rgba(15, 23, 42, 0.95) !important;
  border-width: 4px !important;
  border-style: solid !important;
  backdrop-filter: blur(20px);
}

.winner-border {
  border-color: #ffd700 !important;
  box-shadow: 0 0 50px rgba(255, 215, 0, 0.3);
}

.loser-border {
  border-color: #ff5252 !important;
  box-shadow: 0 0 50px rgba(255, 82, 82, 0.3);
}

.score-box {
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 20px;
  min-width: 150px;
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
  align-items: stretch; /* Cambiado de center a stretch */
  justify-content: center;
  width: 100%; /* Asegurar ancho total */
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

/* Mantenim els dissenys originals dels minijocs */

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
  background: rgba(2, 6, 23, 0.95); /* Más opaco */
  backdrop-filter: blur(25px); /* Más desenfoque */
  z-index: 9999999 !important; /* PRIORIDAD MÁXIMA */
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

.game-content {
  flex: 1;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.game-wrapper-mp {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.remote-cursors-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
  overflow: hidden;
}

.remote-cursor {
  position: absolute;
  transition: all 0.1s linear;
  z-index: 1001;
  pointer-events: none;
}

.cursor-pointer {
  width: 20px;
  height: 20px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%2300e5ff' d='M7,2L19,12L11,13L15.06,21L13,22L8.94,14L4,19L7,2Z' /%3E%3C/svg%3E") no-repeat;
  filter: drop-shadow(0 0 5px rgba(0, 229, 255, 0.8));
  transform: translate(-2px, -2px);
}

.cursor-pointer.is-firing {
  filter: drop-shadow(0 0 15px #00e5ff) brightness(1.5);
  transform: translate(-2px, -2px) scale(1.2);
}

.cursor-label {
  background: rgba(0, 229, 255, 0.9);
  color: #000;
  font-size: 10px;
  font-weight: 900;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
  position: absolute;
  top: 20px;
  left: 10px;
  text-transform: uppercase;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}

.transition-all {
  transition: all 0.3s ease;
}

/* ==== SPECTATOR MODE (Sin combustible) ==== */
.race-map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.spectator-overlay {
  position: absolute;
  inset: 0;
  z-index: 9999999 !important;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(2, 6, 23, 0.7); /* Mucho más translúcido */
  backdrop-filter: blur(10px);
  pointer-events: auto; 
}

.spectator-content {
  border: 2px solid rgba(255, 82, 82, 0.4);
  border-radius: 32px;
  background: rgba(15, 23, 42, 0.95);
  box-shadow: 0 0 50px rgba(255, 82, 82, 0.3);
  max-width: 500px;
  width: 90%;
  animation: spectator-appear 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards;
}

.spectator-tag {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 82, 82, 0.2);
  border: 1px solid rgba(255, 82, 82, 0.4);
  border-radius: 999px;
  backdrop-filter: blur(10px);
  z-index: 1000;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  animation: slide-down-tag 0.5s ease-out;
}

@keyframes slide-down-tag {
  from { transform: translate(-50%, -100%); opacity: 0; }
  to { transform: translate(-50%, 0); opacity: 1; }
}

/* Estilos para el modo observador y alertas */
.spectator-view-container {
  position: absolute;
  inset: 0;
  z-index: 500;
  background: black;
}

.spectator-hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 510;
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0.95), transparent);
  border-bottom: 1px solid rgba(255, 82, 82, 0.3);
}

.abort-cooldown-indicator {
  position: absolute;
  top: 120px;
  right: 40px;
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 16px;
  border-radius: 40px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 82, 82, 0.3);
  z-index: 500;
  pointer-events: none;
}

.mystery-alert-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10000;
  width: 90%;
  max-width: 550px;
}

.mystery-alert-card {
  background: rgba(15, 0, 30, 0.95);
  backdrop-filter: blur(20px);
  border: 2px solid #b388ff;
  box-shadow: 0 0 50px rgba(179, 136, 255, 0.5);
  text-align: center;
  max-width: 500px;
  animation: mystery-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes mystery-pop {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.cursor-pointer { cursor: pointer !important; }
.hover-scale { transition: transform 0.2s; }
.hover-scale:hover { transform: scale(1.15); }
.border-red { border: 2px solid #ff5252 !important; }
.border-purple { border: 2px solid #e040fb !important; }
.shadow-purple { box-shadow: 0 0 30px rgba(224, 64, 251, 0.4); }

@keyframes spectator-appear {
  from {
    opacity: 0;
    transform: scale(0.85) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
/* ==== BOTÓN ROJO DE ABORTAR MISSIÓ ==== */
.abort-mission-btn-container {
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100000 !important; /* PRIORIDAD EXTREMA */
  cursor: pointer;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.abort-mission-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4px dashed rgba(255, 82, 82, 0.5);
  border-radius: 50%;
  animation: rotate-ring 10s linear infinite;
}

@keyframes rotate-ring {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.abort-mission-btn {
  width: 90px;
  height: 90px;
  background: radial-gradient(circle at 30% 30%, #ff5252, #b71c1c);
  border-radius: 50%;
  border: 4px solid #424242;
  box-shadow: 
    0 0 20px rgba(255, 82, 82, 0.6),
    inset 0 0 15px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.abort-mission-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 0 40px rgba(255, 82, 82, 0.9);
}

.abort-mission-btn:active {
  transform: scale(0.9);
  background: #d32f2f;
}

.btn-label {
  color: white;
  font-weight: 900;
  font-size: 0.7rem;
  margin-top: 4px;
}

.key-hint {
  position: absolute;
  bottom: -25px;
  background: rgba(0,0,0,0.6);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.65rem;
  color: #ff5252;
  font-weight: 800;
  border: 1px solid rgba(255, 82, 82, 0.3);
}

@keyframes scale-pop {
  from { transform: scale(0) translateY(-50%); opacity: 0; }
  to { transform: scale(1) translateY(-50%); opacity: 1; }
}

.scale-enter-active { animation: scale-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
.scale-leave-active { animation: scale-pop 0.3s reverse ease-in forwards; }
/* ==== SELECTOR DE DUEL ==== */
.duel-selector-card {
  background: rgba(15, 23, 42, 0.95) !important;
  border: 3px solid #ff5252 !important;
  border-radius: 32px !important;
  box-shadow: 0 0 50px rgba(255, 82, 82, 0.3) !important;
}

.rival-card-v2 {
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.rival-card-v2:hover:not(.rival-busy) {
  background: rgba(0, 229, 255, 0.1);
  transform: translateY(-5px);
  border-color: #00e5ff !important;
}

.rival-busy {
  opacity: 0.5;
  filter: grayscale(0.8);
  cursor: not-allowed !important;
}

.busy-badge {
  position: absolute;
  top: 10px;
  right: -30px;
  background: #ff5252;
  color: white;
  padding: 4px 40px;
  font-size: 0.6rem;
  font-weight: 900;
  transform: rotate(45deg);
  box-shadow: 0 0 10px rgba(255, 82, 82, 0.5);
}

.rival-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.rival-card:hover:not(.rival-busy) {
  background: rgba(255, 82, 82, 0.1);
  border-color: #ff5252;
  transform: translateY(-5px);
}

.rival-busy {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.8);
}

.rival-busy::after {
  content: "EN MISSIÓ";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-15deg);
  background: #ff5252;
  color: white;
  padding: 2px 10px;
  font-weight: 900;
  font-size: 0.8rem;
  border-radius: 4px;
}

.mode-icon {
  transition: all 0.3s ease;
}

.icon-pop {
  transform: scale(1.2);
  filter: drop-shadow(0 0 8px rgba(0, 229, 255, 0.6));
}

.disabled-mode {
  opacity: 0.4;
  cursor: not-allowed;
}

.text-7px {
  font-size: 7px;
}

.mode-selected-anim {
  animation: mode-pulse 2s infinite;
}

@keyframes mode-pulse {
  0%, 100% { border-color: #00e5ff; }
  50% { border-color: rgba(0, 229, 255, 0.4); }
}
.sudden-death-overlay {
  position: absolute;
  inset: 0;
  z-index: 9999;
  background: rgba(20, 0, 0, 0.75);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.sudden-death-content {
  text-align: center;
  animation: sudden-death-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* ==== BOSS MODE HUD STYLES ==== */
.boss-mode-hud {
  width: 100%;
  max-width: 900px;
  position: relative;
  z-index: 10;
}

.hero-status-pill {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(0, 229, 255, 0.3);
  min-width: 140px;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
}

.border-hero {
  border: 2px solid #00e5ff;
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.4);
}

.hero-status-pill:hover {
  transform: translateY(-2px);
  border-color: #00e5ff;
  background: rgba(15, 23, 42, 0.9);
}

.line-height-1 {
  line-height: 1;
}

@keyframes sudden-death-pop {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.glow-text {
  text-shadow: 0 0 20px currentColor, 0 0 40px currentColor;
}

.sudden-death-timer-alt {
  font-family: 'Orbitron', sans-serif;
  font-size: 1rem;
  font-weight: 900;
  color: #ff5252;
  text-shadow: 0 0 15px rgba(255, 82, 82, 0.6);
  letter-spacing: 1px;
}
</style>


