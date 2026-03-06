<template>
  <v-container fluid class="lobby-container py-8 px-6 fill-height gradient-bg">
    <!-- Overlay de Ruleta -->
    <RouletteOverlay 
      :show="showRoulette" 
      :games="availableGames" 
      :target-game="multiplayerStore.room?.gameConfig?.currentGame"
      @finished="onRouletteFinished"
    />

    <MultiplayerScoreSystem
      ref="multiplayerScoreSystem"
      :visible="isInMatch"
      :opponent-name="opponentName"
      :get-player-avatar="getPlayerAvatar"
      @match-finished="onMatchFinished"
    />

    <!-- Overlay de Juego Activo -->
    <transition name="fade-zoom">
      <div 
        v-if="activeGameComponent" 
        class="game-active-overlay"
        @mousemove.passive="handleMouseMove"
      >
        <!-- Minimapa (Visible siempre en cooperativo durante el minijuego) -->
        <div v-if="multiplayerStore.room?.gameConfig?.mode === 'COOPERATIVE'" style="z-index: 2000;">
          <SpaceRaceMap 
            :teams="multiplayerStore.room?.gameConfig?.teams"
            :hazard-type="multiplayerStore.room?.gameConfig?.hazard"
            :hazard-progress="multiplayerStore.room?.gameConfig?.hazardProgress"
            :time-limit="multiplayerStore.room?.gameConfig?.timeLimit"
            :start-time="multiplayerStore.room?.gameConfig?.startTime"
            :mini-mode="true"
          />
        </div>

        <!-- Cursores (Solo en cooperativo) -->
        <template v-if="multiplayerStore.room?.gameConfig?.mode === 'COOPERATIVE'">
          <!-- Otros jugadores -->
          <div 
            v-for="(pos, user) in multiplayerStore.remoteCursors" 
            :key="user" 
            class="remote-cursor ghost-cursor"
            :style="{ left: pos.x + '%', top: pos.y + '%' }"
          >
            <v-icon icon="mdi-cursor-default" color="cyan-accent-2" size="28" class="mouse-icon-shadow"></v-icon>
            <div class="cursor-tag">{{ user }}</div>
          </div>
          
          <!-- Mi propio cursor (para ver ambos en pantalla compartida) -->
          <div 
            class="remote-cursor local-cursor"
            :style="{ left: localMouse.x + '%', top: localMouse.y + '%' }"
          >
            <v-icon icon="mdi-cursor-default-outline" color="orange-accent-2" size="28" class="mouse-icon-shadow"></v-icon>
            <div class="cursor-tag">Tú (Comandante)</div>
          </div>
        </template>
        
        <div class="game-content">
          <component
            :is="activeGameComponent"
            :is-multiplayer="true"
          />
        </div>
      </div>
    </transition>

    <!-- Pantalla de Resultados Final -->
    <MatchResultScreen
      v-if="showMatchResult"
      :scores="finalScores"
      :winner="matchWinnerName"
      :is-tie="matchWinnerName === null"
      :total-rounds="multiplayerStore.room?.gameConfig?.totalRounds || 0"
      :opponent-name="opponentName"
      :is-host="isHost"
      @rematch="requestRematch"
      @return-to-lobby="returnToLobby"
    />

    <!-- Pantalla Central (Lobby / Habitacions / Amics) -->
    <!-- Només es mostra si NO estem en partida (ni jugant, ni ruleta, ni resultats) -->
    <div v-show="!isInMatch && !showMatchResult && !showRoulette" class="w-100">
      <div class="mb-10 text-center">
        <div class="d-flex align-center justify-center mb-6">
          <v-icon icon="mdi-sword-cross" size="x-large" color="orange-accent-2" class="mr-4"></v-icon>
          <h1 class="text-h4 font-weight-bold text-white tracking-wide">Centro de Mando Multijugador</h1>
        </div>
        <p class="text-subtitle-1 text-grey-lighten-1">Invita a tus amigos y preparaos para la misión.</p>
      </div>

      <v-row>
      <!-- Pantalla Principal de Misión -->
      <v-col cols="12" md="8">
        <!-- VISTA: EN UNA SALA ACTIVA -->
        <v-card v-if="multiplayerStore.room" class="mission-control-panel rounded-xl overflow-hidden d-flex flex-column" elevation="12" style="max-height: 80vh;">
          <div class="mission-header pa-6 d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon icon="mdi-shield-star" color="cyan-accent-2" size="36" class="mr-4"></v-icon>
              <div>
                <div class="text-overline text-cyan-accent-2 line-height-1">Misión en curso</div>
                <h2 class="text-h4 font-weight-black text-white tracking-widest">SALA {{ multiplayerStore.room.id }}</h2>
              </div>
            </div>
            <div class="d-flex gap-2">
              <v-btn color="red-accent-2" variant="elevated" rounded="pill" size="small" @click="multiplayerStore.leaveRoom()" class="px-6 font-weight-black action-glow-red">
                <v-icon icon="mdi-logout" start></v-icon>
                Abortar Missió
              </v-btn>
            </div>
          </div>

          <div class="pa-8 flex-grow-1 overflow-y-auto custom-scroll">
            <div class="d-flex align-center mb-8">
              <h3 class="text-h6 text-white font-weight-bold mr-4">Tripulación Actual: <span class="text-cyan-accent-2">{{ multiplayerStore.room?.players?.length || 0 }}</span> de {{ multiplayerStore.room?.maxPlayers || 4 }}</h3>
              <v-divider class="flex-grow-1 border-opacity-25" color="cyan-lighten-4"></v-divider>
              <div v-if="isHost" class="ml-4 d-flex align-center gap-4">
                 <div class="d-flex align-center">
                   <v-icon icon="mdi-account-multiple" size="small" color="cyan-accent-2" class="mr-2"></v-icon>
                   <v-select
                     v-model="maxPlayers"
                     :items="[2, 4, 6, 8, 10, 12, 14, 16]"
                     variant="plain"
                     density="compact"
                     hide-details
                     class="min-setting-select"
                   ></v-select>
                 </div>
                 <div class="d-flex align-center">
                   <v-icon icon="mdi-trophy" size="small" color="orange-accent-2" class="mr-2"></v-icon>
                   <v-select
                     v-model="pointsToWin"
                     :items="[1, 2, 3, 4, 5]"
                     variant="plain"
                     density="compact"
                     hide-details
                     class="min-setting-select"
                   ></v-select>
                 </div>
                  <div class="d-flex align-center">
                    <v-icon icon="mdi-rocket-launch" size="small" color="cyan-accent-2" class="mr-2"></v-icon>
                    <v-select
                      v-model="selectedModality"
                      :items="modalities.filter(m => m.active)"
                      item-title="name"
                      item-value="id"
                      variant="plain"
                      density="compact"
                      hide-details
                      class="min-setting-select"
                    ></v-select>
                  </div>
               </div>
               <v-chip v-else color="cyan-accent-2" variant="tonal" size="small" class="ml-4 font-weight-black">
                  MODO: {{ multiplayerStore.room?.gameConfig?.mode === 'COOPERATIVE' ? 'COOPERATIVO' : 'BATALLA' }} | RONDAS: {{ multiplayerStore.room?.gameConfig?.pointsToWin }}
               </v-chip>
            </div>

            <v-row class="mb-4">
              <v-col v-for="player in multiplayerStore.room.players" :key="player" cols="12" sm="6" md="4" lg="3">
                <v-card class="crew-card pa-4 rounded-xl text-center" variant="outlined">
                  <v-badge
                    v-if="player === multiplayerStore.room.host"
                    icon="mdi-crown"
                    color="amber-accent-2"
                    location="top right"
                    overlap
                    offset-x="10"
                    offset-y="10"
                  >
                    <v-avatar size="80" class="mb-3 player-glow-avatar">
                      <v-img :src="getPlayerAvatar(player)" alt="Avatar" cover></v-img>
                    </v-avatar>
                  </v-badge>
                  <v-avatar v-else size="80" class="mb-3 player-glow-avatar">
                    <v-img :src="getPlayerAvatar(player)" alt="Avatar" cover></v-img>
                  </v-avatar>

                  <div class="text-h6 font-weight-bold text-white mb-1">{{ player }}</div>
                  <v-chip v-if="player === multiplayerStore.room.host" color="amber-accent-2" size="x-small" variant="flat" class="text-black font-weight-black px-3">
                    COMANDANTE
                  </v-chip>
                  <v-chip v-else color="cyan-accent-1" size="x-small" variant="tonal" class="font-weight-bold px-3">
                    TRIPULANTE
                  </v-chip>
                </v-card>
              </v-col>

              <!-- Huecos Vacíos -->
              <v-col v-for="n in ((multiplayerStore.room?.maxPlayers || 4) - (multiplayerStore.room.players?.length || 0))" :key="'empty-' + n" cols="12" sm="6" md="4" lg="3">
                <v-card class="crew-card-empty pa-4 rounded-xl d-flex flex-column align-center justify-center h-100" variant="dashed" min-height="180">
                  <v-icon icon="mdi-account-plus-outline" color="grey-darken-1" size="32" class="mb-2"></v-icon>
                  <div class="text-body-2 text-grey-darken-1">Esperando...</div>
                </v-card>
              </v-col>
            </v-row>


              <div class="mt-12 d-flex flex-column align-center">
                <v-btn 
                  v-if="isHost" 
                  color="orange-accent-3" 
                  size="x-large" 
                  class="start-mission-btn rounded-pill px-12 font-weight-black" 
                  elevation="12"
                  :disabled="!canStartGame && multiplayerStore.room?.status !== 'GAME_OVER'"
                  @click="intentStartMatch"
                >
                  ¡DESPEGAR AHORA!
                </v-btn>
                <div v-else class="waiting-broadcast d-flex align-center">
                  <v-progress-circular indeterminate color="amber-accent-2" size="20" width="2" class="mr-3"></v-progress-circular>
                  <span class="text-amber-accent-2 font-weight-bold">Esperando órdenes del Comandante...</span>
                </div>
              </div>
            </div>
          </v-card>

        <!-- VISTA: SIN SALA (CREAR O UNIRSE) -->
        <div v-else>
          <v-card class="setup-panel pa-6 rounded-xl" elevation="4">
            <div class="text-center mb-6">
              <v-icon icon="mdi-orbit" size="48" color="cyan-accent-2" class="mb-2"></v-icon>
              <h3 class="text-h5 font-weight-black text-white">Preparar Expedición</h3>
            </div>

            <v-row justify="center">
              <v-col cols="12" sm="10">
                <!-- Sección Crear -->
                <div class="setup-section mb-8 pa-4 rounded-xl border-light">
                  <div class="d-flex align-center justify-space-between mb-4">
                    <div class="d-flex align-center">
                      <v-icon icon="mdi-plus-circle-outline" color="cyan-accent-2" class="mr-2"></v-icon>
                      <span class="text-subtitle-1 font-weight-bold text-white">Nueva Misión</span>
                    </div>
                    <v-switch
                      v-model="isPublic"
                      color="cyan-accent-2"
                      :label="isPublic ? 'Pública' : 'Privada'"
                      hide-details
                      density="compact"
                      inset
                      class="privacy-switch"
                    ></v-switch>
                  </div>
                  

                  <v-row>
                    <v-col cols="12" sm="6">
                       <div class="text-caption text-cyan-accent-2 font-weight-bold mb-2 tracking-widest">TAMAÑO MÁXIMO</div>
                       <v-select
                          v-model="maxPlayers"
                          :items="[2, 4, 6, 8, 10, 12, 14, 16]"
                          variant="solo-filled"
                          bg-color="rgba(255,255,255,0.05)"
                          class="player-limit-select"
                          rounded="pill"
                          hide-details
                          density="comfortable"
                          prepend-inner-icon="mdi-account-group"
                       >
                          <template v-slot:selection="{ item }">
                             <span class="text-white font-weight-bold">{{ item.title }} Astronautas</span>
                          </template>
                       </v-select>
                    </v-col>
                    <v-col cols="12" sm="6">
                       <div class="text-caption text-orange-accent-2 font-weight-bold mb-2 tracking-widest">NÚMERO DE RONDAS</div>
                       <v-select
                          v-model="pointsToWin"
                          :items="[1, 2, 3, 4, 5]"
                          variant="solo-filled"
                          bg-color="rgba(255,255,255,0.05)"
                          class="points-limit-select"
                          rounded="pill"
                          hide-details
                          density="comfortable"
                          prepend-inner-icon="mdi-trophy-outline"
                       >
                          <template v-slot:selection="{ item }">
                             <span class="text-white font-weight-bold">{{ item.title }} Rondes</span>
                          </template>
                       </v-select>
                    </v-col>
                  </v-row>

                  <!-- Hemos quitado el v-select de aquí para usar las tarjetas de la derecha -->
                  <div class="mb-4"></div>

                  <v-btn block color="cyan-accent-2" size="large" class="rounded-pill font-weight-bold h-custom-btn text-black shadow-cyan" @click="createRoom">
                    INICIAR SALA
                  </v-btn>
                </div>

                <v-divider class="mb-8" color="rgba(255,255,255,0.1)"></v-divider>

                <!-- Sección Unirse -->
                <div class="setup-section pa-4 rounded-xl border-light">
                  <div class="d-flex align-center mb-4">
                    <v-icon icon="mdi-key-variant" color="amber-accent-2" class="mr-2"></v-icon>
                    <span class="text-subtitle-1 font-weight-bold text-white">Unirse por Código</span>
                  </div>
                  <v-text-field
                    v-model="roomCode"
                    placeholder="CÓDIGO (EJ: AB12YZ)"
                    variant="solo-filled"
                    bg-color="rgba(255,255,255,0.05)"
                    class="room-code-input mb-4"
                    rounded="pill"
                    maxlength="6"
                    hide-details
                  ></v-text-field>
                  <v-btn block color="amber-accent-2" size="large" class="rounded-pill font-weight-bold text-black h-custom-btn shadow-amber" :disabled="!roomCode || roomCode.length < 6" @click="joinByCode">
                    ACOPLARSE
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
            <v-icon icon="mdi-gamepad-variant" color="cyan-accent-2" class="mr-2"></v-icon>
            Selecciona modalitat
          </h3>
          <v-row dense>
            <v-col v-for="mode in modalities" :key="mode.id" cols="6">
              <v-card
                class="modality-card pa-3 d-flex flex-column align-center justify-center text-center rounded-lg"
                :class="{ 
                  'active-mode': selectedModality === mode.id, 
                  'disabled-mode': !mode.active && multiplayerStore.room && !isHost,
                  'cursor-pointer': mode.active && (!multiplayerStore.room || isHost)
                }"
                @click="mode.active && (!multiplayerStore.room || isHost) ? selectedModality = mode.id : null"
                variant="flat"
              >
                <v-icon :icon="mode.icon" :color="selectedModality === mode.id ? 'cyan-accent-2' : 'grey-darken-1'" size="28" class="mb-2"></v-icon>
                <div class="text-caption font-weight-black line-height-1" :class="selectedModality === mode.id ? 'text-white' : 'text-grey-darken-1'">
                  {{ mode.name }}
                </div>
                <v-chip v-if="!mode.active" size="x-small" color="grey-darken-2" variant="tonal" class="mt-2 text-7px">PROXIMAMENT</v-chip>
              </v-card>
            </v-col>
          </v-row>
        </v-card>

        <!-- Invitaciones -->
        <v-card v-if="multiplayerStore.invitations.length > 0" class="side-panel-card rounded-xl pa-4 mb-6" elevation="0">
          <h3 class="text-subtitle-1 font-weight-bold text-white mb-4 d-flex align-center">
            <v-icon icon="mdi-email-alert" color="orange-accent-2" class="mr-2"></v-icon>
            Llamadas Entrantes ({{ multiplayerStore.invitations.length }})
          </h3>
          <v-list bg-color="transparent">
            <v-list-item v-for="(inv, index) in multiplayerStore.invitations" :key="index" class="px-2 invitation-item mb-2 rounded-lg">
              <div class="d-flex align-center w-100">
                <div class="flex-grow-1">
                  <div class="text-body-2 text-white"><b>{{ inv.from }}</b> solicita tu apoyo</div>
                </div>
                <div class="d-flex gap-2">
                  <v-btn icon="mdi-check" color="success" size="x-small" variant="flat" @click="acceptInvitation(inv, index)"></v-btn>
                  <v-btn icon="mdi-close" color="error" size="x-small" variant="tonal" @click="rejectInvitation(index)"></v-btn>
                </div>
              </div>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- Salas Disponibles (Misiones Públicas) -->
        <v-card v-if="!multiplayerStore.room" class="side-panel-card rounded-xl pa-0 mb-6 overflow-hidden" elevation="8">
          <div class="side-panel-header pa-4 d-flex align-center">
            <v-icon icon="mdi-map-search" color="cyan-accent-2" class="mr-3"></v-icon>
            <h3 class="text-subtitle-1 font-weight-black text-white tracking-widest">RED DE MISIONES</h3>
          </div>
          
          <div class="pa-4">
            <v-list v-if="multiplayerStore.availableRooms.length > 0" bg-color="transparent" class="pa-0">
              <v-fade-transition group>
                <v-list-item v-for="room in multiplayerStore.availableRooms" :key="room.id" class="px-3 py-4 mb-4 mission-card-v3 rounded-xl">
                  <div class="d-flex flex-column w-100">
                    <div class="d-flex align-center justify-space-between mb-3">
                      <div class="d-flex align-center">
                        <div class="mission-status-led mr-2"></div>
                        <div class="text-body-2 font-weight-black text-white">SECTOR {{ room.id }}</div>
                      </div>
                      <div class="d-flex align-center">
                        <v-chip size="x-small" color="cyan-lighten-4" variant="tonal" class="rounded-pill font-weight-bold">
                          {{ room.players.length }}/{{ room.maxPlayers || 4 }} SLOT
                        </v-chip>
                        <v-chip 
                          size="x-small" 
                          :color="room.gameConfig?.mode === 'COOPERATIVE' ? 'cyan-accent-2' : 'orange-accent-2'" 
                          variant="tonal" 
                          class="rounded-pill font-weight-bold ml-2"
                        >
                          {{ room.gameConfig?.mode === 'COOPERATIVE' ? 'COOP' : 'VS' }}
                        </v-chip>
                      </div>
                    </div>

                    <div class="d-flex align-center mb-4">
                    <v-avatar size="32" class="mr-3 border-thin">
                      <v-img :src="getPlayerAvatar(room.host)" cover></v-img>
                    </v-avatar>
                      <div>
                        <div class="text-caption text-grey-lighten-1 line-height-1">COMANDANTE</div>
                        <div class="text-body-2 font-weight-bold text-white">{{ room.host }}</div>
                      </div>
                    </div>

                    <div class="d-flex gap-2">
                      <v-btn 
                        flex-grow-1
                        color="cyan-accent-2" 
                        size="small" 
                        variant="elevated" 
                        class="rounded-pill font-weight-black text-black action-glow-btn" 
                        @click="multiplayerStore.joinRoom(room.id)"
                      >
                        ESTABLECER ENLACE
                      </v-btn>
                      <v-btn
                        v-if="room.host === astroStore.user"
                        icon="mdi-delete-outline"
                        color="red-accent-2"
                        variant="tonal"
                        size="small"
                        class="rounded-circle action-glow-red-small"
                        @click="multiplayerStore.deleteRoom(room.id)"
                      ></v-btn>
                    </div>
                  </div>
                </v-list-item>
              </v-fade-transition>
            </v-list>
            <div v-else class="text-center py-12 empty-discovery rounded-xl">
              <v-icon icon="mdi-wifi-off" size="48" color="rgba(255, 255, 255, 0.05)" class="mb-4"></v-icon>
              <p class="text-caption text-grey-darken-1 font-weight-bold">SIN SEÑALES EN EL SECTOR</p>
            </div>
          </div>
        </v-card>

        <!-- Reclutamiento (Si está en una sala) -->
        <v-card v-if="multiplayerStore.room" class="side-panel-card rounded-xl pa-0 overflow-hidden" elevation="4" @vue:mounted="ensureExplorersFetched">
          <div class="pa-4 border-bottom-light">
            <h3 class="text-subtitle-1 font-weight-bold text-white d-flex align-center">
              <v-icon icon="mdi-account-group" color="cyan-accent-2" class="mr-2"></v-icon>
              Reclutar Tripulación
            </h3>
          </div>
          <v-list bg-color="transparent" class="pa-0 recruit-list" max-height="450px">
            <!-- SECCIÓN AMIGOS -->
            <template v-if="friendsList.length > 0">
              <v-list-subheader class="text-cyan-accent-2 font-weight-bold text-overline pb-0">AMIGOS</v-list-subheader>
              <v-list-item v-for="explorer in friendsList" :key="explorer.user" class="px-4 py-3 recruit-item border-bottom-light">
                <template v-slot:prepend>
                  <v-avatar size="40" class="mr-3 border-light">
                     <v-img :src="getAvatarUrl(explorer.avatar, explorer.user)" cover></v-img>
                  </v-avatar>
                </template>
                <v-list-item-title class="text-body-2 text-white font-weight-bold">{{ explorer.user }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption text-grey-darken-1">
                  Lv. {{ explorer.level }} · {{ explorer.rank }}
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-btn 
                    color="cyan-accent-2" 
                    variant="text" 
                    icon="mdi-bullhorn-outline" 
                    size="small"
                    :disabled="multiplayerStore.room?.players.includes(explorer.user) || (multiplayerStore.room?.players.length >= multiplayerStore.room?.maxPlayers)"
                    @click="multiplayerStore.inviteFriend(explorer.user)"
                  ></v-btn>
                </template>
              </v-list-item>
            </template>

            <!-- SECCIÓN OTROS -->
            <template v-if="otherExplorersList.length > 0">
              <v-list-subheader class="text-grey-lighten-1 font-weight-bold text-overline pb-0 mt-2">POSIBLES TRIPULANTES</v-list-subheader>
              <v-list-item v-for="explorer in otherExplorersList" :key="explorer.user" class="px-4 py-3 recruit-item border-bottom-light">
                <template v-slot:prepend>
                  <v-avatar size="40" class="mr-3 border-light">
                     <v-img :src="getAvatarUrl(explorer.avatar, explorer.user)" cover></v-img>
                  </v-avatar>
                </template>
                <v-list-item-title class="text-body-2 text-white font-weight-bold">{{ explorer.user }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption text-grey-darken-1">
                  Lv. {{ explorer.level }} · {{ explorer.rank }}
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-btn 
                    color="cyan-accent-2" 
                    variant="text" 
                    icon="mdi-bullhorn-outline" 
                    size="small"
                    :disabled="multiplayerStore.room?.players.includes(explorer.user) || (multiplayerStore.room?.players.length >= multiplayerStore.room?.maxPlayers)"
                    @click="multiplayerStore.inviteFriend(explorer.user)"
                  ></v-btn>
                </template>
              </v-list-item>
            </template>
          </v-list>
          <div v-if="friendsList.length === 0 && otherExplorersList.length === 0" class="text-center py-6 text-grey-darken-1">
            <p class="text-caption">Sin tripulantes en el sector.</p>
          </div>
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
import { ref, computed, onMounted, watch, shallowRef } from 'vue';
import { useAstroStore } from '@/stores/astroStore';
import { useMultiplayerStore } from '@/stores/multiplayerStore';

import { availableGameNames, gameComponents } from '@/components/games/gameRegistry';
import MultiplayerScoreSystem from '@/components/games/MultiplayerScoreSystem.vue';
import RouletteOverlay from '@/components/games/RouletteOverlay.vue';
import MatchResultScreen from '@/components/multiplayer/MatchResultScreen.vue';
import SpaceRaceMap from '@/components/multiplayer/SpaceRaceMap.vue';

const availableGames = availableGameNames;

const astroStore = useAstroStore();
const multiplayerStore = useMultiplayerStore();

const snackbar = ref({ show: false, text: '', color: 'success' });
const isPublic = ref(true);
const maxPlayers = ref(4);
const pointsToWin = ref(3);
const roomCode = ref('');
const showRoulette = ref(false);
const activeGameComponent = shallowRef(null);
const multiplayerScoreSystem = ref(null);
const showMatchResult = ref(false);
const finalScores = ref({});
const matchWinnerName = ref(null);
const selectedModality = ref('BATTLE');
const modalities = [
  { id: 'BATTLE', name: 'Batalla Individual', icon: 'mdi-sword-cross', active: true },
  { id: 'COOPERATIVE', name: 'Misión Cooperativa', icon: 'mdi-account-group', active: true },
  { id: 'boss', name: 'Modo Boss', icon: 'mdi-skull', active: false },
  { id: 'torneig', name: 'Torneig', icon: 'mdi-trophy-variant', active: false }
];

watch(() => multiplayerStore.room?.status, (newStatus) => {
  if (newStatus === 'ROULETTE') {
    showRoulette.value = true;
    activeGameComponent.value = null;
  } else if (newStatus === 'PLAYING') {
    showRoulette.value = false;
    const gameName = multiplayerStore.room?.gameConfig?.currentGame;
    if (gameName && gameComponents[gameName]) {
      activeGameComponent.value = gameComponents[gameName];
    }
  } else if (newStatus === 'LOBBY') {
    activeGameComponent.value = null;
    showRoulette.value = false;
    showMatchResult.value = false;
    matchWinnerName.value = null;
    finalScores.value = {};
    multiplayerScoreSystem.value?.resetLocalState();
  } else if (newStatus === 'ROUND_RESULTS') {
    // Apagar la ruleta entre rondes per forçar que la prop canviï de false->true
    // quan arribi el proper ROULETTE, activant el watcher de RouletteOverlay
    showRoulette.value = false;
    activeGameComponent.value = null;
  }
});


// AÑADIDO: Watcher para asegurar que tenemos los datos de todos los jugadores que entran
watch(() => multiplayerStore.room?.players?.length, (newLen, oldLen) => {
  if (newLen > (oldLen || 0)) {
    console.log("🔄 Jugador detectado! Refrescando lista de exploradores...");
    astroStore.fetchAllUsers();
  }
}, { immediate: true });

watch(() => multiplayerStore.room, (newRoom) => {
  if (newRoom && newRoom.gameConfig) {
    maxPlayers.value = newRoom.maxPlayers || 4;
    pointsToWin.value = newRoom.gameConfig.pointsToWin || 3;
    selectedModality.value = newRoom.gameConfig.mode || 'BATTLE';
  }
}, { immediate: true, deep: true });

watch(() => multiplayerStore.error, (newError) => {
  if (newError) {
    showMessage(newError, 'error');
    multiplayerStore.error = null; // Limpiarlo después de mostrarlo
  }
});

const isHost = computed(() => {
  return multiplayerStore.room?.host === astroStore.user;
});

// El HUD del sistema de puntuació és visible durant tota la partida (no solo quan hi ha joc actiu)
// Així el watcher de lastMessage sempre està actiu i pot capturar MATCH_FINISHED correctament
const isInMatch = computed(() => {
  const s = multiplayerStore.room?.status;
  // Treiem 'GAME_OVER' per tal que, en tancar els resultats, ja es pugui veure l'espai central del lobby.
  return s === 'PLAYING' || s === 'ROULETTE' || s === 'ROUND_RESULTS';
});

// Watcher directe de MATCH_FINISHED al Lobby com a mecanisme de seguretat
// El MultiplayerScoreSystem ja ho gestiona, però per si el component no és visible en aquell moment
watch(() => multiplayerStore.lastMessage, (msg) => {
  if (!msg) return;
  if (msg.type === 'ROUND_ENDED_BY_WINNER') {
    activeGameComponent.value = null;
  }
  if (msg.type === 'MATCH_FINISHED') {
    showRoulette.value = false;
    activeGameComponent.value = null;
    // Si el MultiplayerScoreSystem ja ho ha gestionat, no fem res
    if (!showMatchResult.value) {
      matchWinnerName.value = msg.winner ?? null;
      finalScores.value = msg.room?.gameConfig?.scores || {};
      showMatchResult.value = true;
    }
  }
});

const canStartGame = computed(() => {
  const players = multiplayerStore.room?.players?.length || 0;
  if (selectedModality.value === 'COOPERATIVE') {
    // Para carrera espacial, mínimo 2 (si es impar se rellena con bot en server, pero el usuario pidió num par)
    // Interpretamos que si son impares no deja empezar según el mensaje del usuario "siempre va a tener que ser num par"
    return players >= 2 && players % 2 === 0;
  }
  return players >= 2;
});

// Sincronizar modalidad si el host la cambia
watch(selectedModality, (newVal) => {
  if (isHost.value && multiplayerStore.room) {
    multiplayerStore.updateGameConfig({ mode: newVal });
  }
});

// AÑADIDO: Lógica de reclutamiento (Amigos y Otros separados)
const friendsList = computed(() => {
  if (!astroStore.explorers) return [];
  return astroStore.explorers.filter(e => 
    e.user !== astroStore.user && 
    astroStore.friends.includes(e.user)
  );
});

const otherExplorersList = computed(() => {
  if (!astroStore.explorers) return [];
  return astroStore.explorers.filter(e => 
    e.user !== astroStore.user && 
    !astroStore.friends.includes(e.user)
  );
});

const opponentName = computed(() => {
  if (!multiplayerStore.room) return 'Oponente';
  return multiplayerStore.room.players.find(p => p !== astroStore.user) || 'Oponente';
});

// Sincronizar rondas si el host las cambia
watch(pointsToWin, (newVal) => {
  if (isHost.value && multiplayerStore.room) {
    multiplayerStore.updateGameConfig({ pointsToWin: newVal });
  }
});

// Sincronizar jugadores si el host los cambia
watch(maxPlayers, (newVal) => {
  if (isHost.value && multiplayerStore.room) {
    multiplayerStore.updateGameConfig({ maxPlayers: newVal });
  }
});

// Helpers para Avatares
const getAvatarUrl = (avatarName, username) => {
  // 1. Si tenemos un nombre de archivo de astronauta válido
  if (avatarName && (avatarName.includes('.jpg') || avatarName.includes('.png'))) {
    return `/${avatarName.trim()}`;
  }
  
  // 2. Si es un seed o nombre, pero parece un astronauta (por si acaso se guardó mal)
  if (avatarName && avatarName.toLowerCase().startsWith('astronauta')) {
    return `/${avatarName.trim()}`;
  }

  // 3. Si no hay nada, pero tenemos el username, usamos DiceBear como fallback robótico
  if (username) {
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
  }

  // 4. Fallback final absoluto (Astronauta blanco)
  return '/Astronauta_blanc.jpg';
};

const getPlayerAvatar = (username) => {
  if (!username) return '/Astronauta_blanc.jpg';
  
  // Caso 1: Soy yo mismo (usamos datos de sesión frescos)
  if (username === astroStore.user) {
    return getAvatarUrl(astroStore.avatar, username);
  }
  
  // Caso 2: Es otro jugador (buscamos en la lista de exploradores)
  const explorer = astroStore.explorers?.find(e => e.user === username);
  if (explorer) {
    return getAvatarUrl(explorer.avatar, username);
  }
  
  // Caso 3: No lo tenemos en la lista (todavía cargando), usamos DiceBear con su nombre
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
};

const showMessage = (text, color = 'success') => {
  snackbar.value = { show: true, text, color };
};

const createRoom = () => {
  const initialConfig = { 
    pointsToWin: pointsToWin.value,
    mode: selectedModality.value
  };
  multiplayerStore.createRoom(astroStore.user, isPublic.value, maxPlayers.value, initialConfig);
};

const joinByCode = () => {
  if (roomCode.value) {
    multiplayerStore.joinRoom(roomCode.value.toUpperCase());
    roomCode.value = '';
  }
};

const acceptInvitation = (inv, index) => {
  multiplayerStore.joinRoom(inv.roomId);
  multiplayerStore.invitations.splice(index, 1);
  showMessage(`Uniéndote a la sala de ${inv.from}`);
};

const rejectInvitation = (index) => {
  multiplayerStore.invitations.splice(index, 1);
};

const onRouletteFinished = () => {
  // El servidor ara avança automàticament la sala a 'PLAYING' als 4.5s.
  // Ja no enviem setRoomStatus des del client per evitar duplicats (race conditions)
};

const onMatchFinished = ({ winner, scores }) => {
  matchWinnerName.value = winner ?? null;
  finalScores.value = scores || {};
  showMatchResult.value = true;
  activeGameComponent.value = null;
};

const returnToLobby = () => {
  showMatchResult.value = false;
  activeGameComponent.value = null;
  multiplayerScoreSystem.value?.resetLocalState();
  // Avisar al servidor que aquest jugador vol tornar al lobby
  multiplayerStore.returnToLobby();
};

const requestRematch = () => {
  showMatchResult.value = false;
  activeGameComponent.value = null;
  multiplayerScoreSystem.value?.resetLocalState();
  multiplayerStore.startMatch();
};

const localMouse = ref({ x: 0, y: 0 });
let lastMouseMove = 0;
const handleMouseMove = (e) => {
  if (multiplayerStore.room?.gameConfig?.mode !== 'COOPERATIVE') return;
  
  const xPercent = (e.clientX / window.innerWidth) * 100;
  const yPercent = (e.clientY / window.innerHeight) * 100;
  
  localMouse.value = { x: xPercent, y: yPercent };

  const now = Date.now();
  if (now - lastMouseMove < 40) return; // ~25 FPS
  lastMouseMove = now;

  multiplayerStore.sendMouseUpdate(xPercent, yPercent);
};

onMounted(() => {
  // Connexió WebSocket en nextTick per no bloquejar el render inicial
  if (!multiplayerStore.isConnected) {
    multiplayerStore.connect();
  }
  // fetchAllUsers es fa lazy: es crida quan l'usuari obre el panell d'exploradors
  // Evitem carregar-lo aquí per no alentir l'entrada al lobby
  multiplayerStore.fetchAvailableRooms();
});

// Carregar exploradors de forma lazy la primera vegada que calgui
let explorersFetched = false;

const intentStartMatch = () => {
  if (multiplayerStore.room?.status === 'GAME_OVER') {
    showMessage('No se puede iniciar: Espera a que todos los tripulantes regresen a la sala', 'warning');
    return;
  }
  if (!canStartGame.value) return;
  multiplayerStore.startMatch();
};

const ensureExplorersFetched = () => {
  if (!explorersFetched) {
    explorersFetched = true;
    astroStore.fetchAllUsers();
  }
};
</script>

<style scoped>
.lobby-container {
  min-height: 100%;
}

/* Mission Control Panel */
.mission-control-panel {
  background: rgba(10, 25, 41, 0.85) !important;
  backdrop-filter: blur(25px);
  border: 1px solid rgba(0, 229, 255, 0.3) !important;
  box-shadow: 0 0 50px rgba(0, 229, 255, 0.15) !important;
}

.mission-header {
  background: linear-gradient(90deg, rgba(0, 229, 255, 0.1) 0%, rgba(0, 229, 255, 0) 100%);
  border-bottom: 1px solid rgba(0, 229, 255, 0.2);
}

.crew-card {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.crew-card:hover {
  background: rgba(0, 229, 255, 0.05) !important;
  border-color: rgba(0, 229, 255, 0.4) !important;
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
}

.crew-card-empty {
  background: rgba(0, 0, 0, 0.2) !important;
  border: 2px dashed rgba(255, 255, 255, 0.05) !important;
  opacity: 0.6;
}

.player-glow-avatar {
  border: 2px solid rgba(0, 229, 255, 0.4);
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.3);
  padding: 4px;
  background: rgba(0, 0, 0, 0.2);
}

.start-mission-btn {
  letter-spacing: 4px;
  background: linear-gradient(45deg, #ff9800, #ff5722) !important;
  transition: all 0.4s ease;
}

.start-mission-btn:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 0 40px rgba(255, 87, 34, 0.5) !important;
}

/* Side Panel & Mission Cards */
.side-panel-card {
  background: rgba(15, 32, 50, 0.8) !important;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.side-panel-header {
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.mission-card-v3 {
  background: rgba(0, 229, 255, 0.03) !important;
  border: 1px solid rgba(0, 229, 255, 0.1) !important;
  transition: all 0.3s ease;
}

.mission-card-v3:hover {
  border-color: rgba(0, 229, 255, 0.3) !important;
  transform: translateX(4px);
}

.mission-card-v3 :deep(.v-avatar) {
  background: #0a1929;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.mission-status-led {
  width: 8px;
  height: 8px;
  background: #00e5ff;
  border-radius: 50%;
  box-shadow: 0 0 8px #00e5ff;
  animation: led-blink 2s infinite;
}

@keyframes led-blink {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.9); }
}

.action-glow-btn {
  letter-spacing: 2px;
  transition: all 0.3s ease;
}

.action-glow-btn:hover {
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.4) !important;
}

.empty-discovery {
  background: rgba(0, 0, 0, 0.2);
  border: 1px dashed rgba(255, 255, 255, 0.05);
}

/* Setup Panel */
.setup-panel {
  background: rgba(15, 32, 50, 0.85) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 229, 255, 0.2) !important;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.4) !important;
}

.setup-section {
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.3s ease;
}

.setup-section:hover {
  background: rgba(255, 255, 255, 0.04);
}

.room-code-input :deep(input) {
  text-align: center;
  letter-spacing: 6px;
  font-weight: 900;
  font-family: 'Courier New', Courier, monospace;
  font-size: 1.5rem;
  color: #ffca28 !important;
  text-transform: uppercase;
}

.h-custom-btn {
  height: 56px !important;
  letter-spacing: 2px;
}

.shadow-cyan {
  box-shadow: 0 4px 15px rgba(0, 229, 255, 0.2) !important;
}
.shadow-amber {
  box-shadow: 0 4px 15px rgba(255, 202, 40, 0.2) !important;
}

.recruit-list {
  background: rgba(0,0,0,0.1);
}

.recruit-item {
  transition: all 0.2s ease;
}

.recruit-item:hover {
  background: rgba(0, 229, 255, 0.05) !important;
}

.border-light {
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.border-bottom-light {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.tracking-widest {
  letter-spacing: 0.3em;
}

.line-height-1 {
  line-height: 1;
}

.privacy-switch :deep(.v-label) {
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  color: #00e5ff;
  letter-spacing: 1px;
}
/* Avatar Global Styling (Matching profile.vue zoom) */
:deep(.v-avatar .v-img__img),
:deep(.v-avatar img) {
  border-radius: 50%;
  transform: scale(1.4);
  transform-origin: center center;
  object-position: center center;
}

.player-glow-avatar {
  border: 2px solid rgba(0, 229, 255, 0.4);
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.3);
  padding: 0; 
  background: #0a1929; /* Fondo oscuro (Deep Space) para que el astronauta blanco resalte */
  overflow: hidden;
}

.recruit-item :deep(.v-avatar) {
  background: #0a1929;
}

/* Custom Scrollbar */
.custom-scroll::-webkit-scrollbar {
  width: 6px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 229, 255, 0.3);
  border-radius: 10px;
}
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 229, 255, 0.6);
}

.player-limit-select :deep(.v-field) {
  box-shadow: none !important;
}
.player-limit-select :deep(.v-select__selection-text) {
  color: #fff !important;
}

.game-active-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #0b1421;
  z-index: 500;
  display: flex;
  flex-direction: column;
  cursor: none; /* Amaguem el ratolí real per usar els de joc */
}

.game-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
  height: 100%;
  padding-top: 80px; /* Espai pel HUD fixat */
}

.game-hud-container {
  position: fixed;
  top: 10px;
  left: 0;
  width: 100%;
  z-index: 2500;
  pointer-events: none;
}

.hud-main-bar {
  background: rgba(10, 25, 41, 0.95);
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 50px;
  height: 64px;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 229, 255, 0.15);
  pointer-events: auto;
  backdrop-filter: blur(10px);
}

.hud-item {
  min-width: 150px;
}

.hud-text {
  line-height: 1.1;
}

.hud-name {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #00e5ff;
  letter-spacing: 0.05em;
}

.hud-puntos {
  font-size: 1.4rem;
  font-weight: 900;
  color: white;
}

.hud-total {
  font-size: 0.8rem;
  color: #9e9e9e;
  font-weight: 500;
}

.hud-center-unit {
  min-width: 120px;
}

.vs-text {
  font-size: 1.5rem;
  font-weight: 900;
  color: #00e5ff;
  line-height: 1;
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
}

.round-text {
  font-size: 0.65rem;
  font-weight: 800;
  color: #ffca28;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Cursores remotos */
.remote-cursor {
  position: absolute;
  pointer-events: none;
  z-index: 9999;
  transition: all 0.05s linear;
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* El hotspot és la punta superior esquerra del icona */
}

.mouse-icon-shadow {
  filter: drop-shadow(0 2px 5px rgba(0,0,0,0.8));
}

.local-cursor .cursor-tag {
  color: #ffb74d;
  border-color: rgba(255, 183, 77, 0.4);
}

.cursor-tag {
  background: rgba(10, 25, 41, 0.9);
  color: #00e5ff;
  font-size: 10px;
  font-weight: 900;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid rgba(0, 229, 255, 0.4);
  margin-top: 4px;
  white-space: nowrap;
}

/* Configuració mínima a la sala */
.min-setting-select {
  width: 100px;
  font-size: 0.8rem !important;
  font-weight: 700;
  color: white;
}
.min-setting-select :deep(.v-field__input) {
  padding-top: 0;
  padding-bottom: 0;
  min-height: unset;
}
.min-setting-select :deep(.v-select__selection-text) {
  color: #00e5ff !important;
}

/* Minimapa flotante durante el juego */
.game-minimap-layer {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 2000;
  pointer-events: none;
}
.sabotage-notif {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.5rem;
  font-weight: 900;
  text-shadow: 0 0 15px currentColor;
  z-index: 10;
}

.floating-score-enter-active {
  animation: float-up 2s ease-out forwards;
}

@keyframes float-up {
  0% { opacity: 0; transform: translate(-50%, 0) scale(0.5); }
  20% { opacity: 1; transform: translate(-50%, -20px) scale(1.2); }
  80% { opacity: 1; transform: translate(-50%, -60px) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -80px) scale(0.8); }
}

.modality-card {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 90px;
}

.modality-card:hover:not(.disabled-mode) {
  background: rgba(0, 229, 255, 0.05) !important;
  border-color: rgba(0, 229, 255, 0.3) !important;
  transform: translateY(-2px);
}

.active-mode {
  background: rgba(0, 229, 255, 0.1) !important;
  border-color: #00e5ff !important;
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.2);
}

.disabled-mode {
  opacity: 0.6;
  cursor: default !important;
  filter: grayscale(0.8);
}

.text-7px {
  font-size: 8px;
  height: 16px;
}
.action-glow-red {
  box-shadow: 0 0 15px rgba(255, 82, 82, 0.4) !important;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 82, 82, 0.5) !important;
}

.action-glow-red:hover {
  box-shadow: 0 0 25px rgba(255, 82, 82, 0.7) !important;
  transform: translateY(-2px);
  background-color: #FF5252 !important;
  color: white !important;
}

.action-glow-red-small {
  transition: all 0.3s ease;
}

.action-glow-red-small:hover {
  background-color: rgba(255, 82, 82, 0.15) !important;
  color: #FF5252 !important;
  box-shadow: 0 0 10px rgba(255, 82, 82, 0.3) !important;
}
</style>
