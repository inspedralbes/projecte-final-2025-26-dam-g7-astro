<template>
  <v-container fluid class="lobby-container py-8 px-6">
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
        <v-card v-if="multiplayerStore.room" class="mission-control-panel rounded-xl overflow-hidden" elevation="12">
          <div class="mission-header pa-6 d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon icon="mdi-shield-star" color="cyan-accent-2" size="36" class="mr-4"></v-icon>
              <div>
                <div class="text-overline text-cyan-accent-2 line-height-1">Misión en curso</div>
                <h2 class="text-h4 font-weight-black text-white tracking-widest">SALA {{ multiplayerStore.room.id }}</h2>
              </div>
            </div>
            <v-btn color="error" variant="tonal" rounded="pill" size="small" @click="multiplayerStore.leaveRoom()" class="px-6 font-weight-bold">
              <v-icon icon="mdi-logout" start></v-icon>
              Abortar
            </v-btn>
          </div>

          <div class="pa-8">
            <div class="d-flex align-center mb-8">
              <h3 class="text-h6 text-white font-weight-bold mr-4">Tripulación Actual</h3>
              <v-divider class="flex-grow-1 border-opacity-25" color="cyan-lighten-4"></v-divider>
            </div>

            <v-row>
              <v-col v-for="player in multiplayerStore.room.players" :key="player" cols="12" sm="6" md="4">
                <v-card class="crew-card pa-4 rounded-xl text-center" variant="outlined">
                  <v-badge
                    :icon="player === multiplayerStore.room.host ? 'mdi-crown' : ''"
                    color="amber-accent-2"
                    location="top right"
                    overlap
                    :content="player === multiplayerStore.room.host ? '' : null"
                  >
                    <v-avatar size="80" class="mb-3 player-glow-avatar">
                      <v-img src="https://api.dicebear.com/7.x/bottts/svg?seed=pau" alt="Avatar"></v-img>
                    </v-avatar>
                  </v-badge>
                  <div class="text-h6 font-weight-bold text-white mb-1">{{ player }}</div>
                  <v-chip v-if="player === multiplayerStore.room.host" color="amber-accent-2" size="x-small" variant="flat" class="text-black font-weight-black px-3">
                    COMANDANTE
                  </v-chip>
                  <v-chip v-else color="cyan-accent-1" size="x-small" variant="tonal" class="font-weight-bold px-3">
                    EXPLORADOR
                  </v-chip>
                </v-card>
              </v-col>

              <!-- Huecos Vacíos -->
              <v-col v-for="n in (4 - (multiplayerStore.room.players?.length || 0))" :key="'empty-' + n" cols="12" sm="6" md="4">
                <v-card class="crew-card-empty pa-4 rounded-xl d-flex flex-column align-center justify-center" variant="dashed">
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
                :disabled="(multiplayerStore.room?.players?.length || 0) < 2"
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
          <v-card class="setup-panel pa-8 rounded-xl" elevation="6">
            <v-row>
              <v-col cols="12" md="6" class="border-right-light">
                <div class="text-center pa-4">
                  <v-icon icon="mdi-rocket-launch-outline" size="64" color="cyan-accent-2" class="mb-4"></v-icon>
                  <h3 class="text-h5 font-weight-black text-white mb-2">Crear Nueva Misión</h3>
                  <p class="text-body-2 text-grey-lighten-1 mb-6">Inicia tu propia expedición y recluta a tu equipo.</p>
                  
                  <div class="d-flex align-center justify-center mb-6">
                    <v-switch
                      v-model="isPublic"
                      color="cyan-accent-2"
                      :label="isPublic ? 'Misión Pública (Todos pueden verla)' : 'Misión Privada (Solo con código)'"
                      hide-details
                      inset
                    ></v-switch>
                  </div>

                  <v-btn block color="cyan-accent-2" size="large" class="rounded-pill font-weight-bold h-custom-btn" @click="createRoom">
                    <v-icon icon="mdi-plus" start></v-icon>
                    Iniciar Sala
                  </v-btn>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="text-center pa-4">
                  <v-icon icon="mdi-key-variant" size="64" color="amber-accent-2" class="mb-4"></v-icon>
                  <h3 class="text-h5 font-weight-black text-white mb-2">Unirse por Código</h3>
                  <p class="text-body-2 text-grey-lighten-1 mb-6">Ingresa el código de 6 dígitos que te enviaron para unirte.</p>
                  
                  <v-text-field
                    v-model="roomCode"
                    placeholder="INTRODUCE EL CÓDIGO (EJ: AB12YZ)"
                    variant="solo-filled"
                    bg-color="rgba(255,255,255,0.05)"
                    class="room-code-input mb-4"
                    rounded="pill"
                    maxlength="6"
                    hide-details
                  ></v-text-field>

                  <v-btn block color="amber-accent-2" size="large" class="rounded-pill font-weight-bold text-black h-custom-btn" :disabled="!roomCode || roomCode.length < 6" @click="joinByCode">
                    <v-icon icon="mdi-login-variant" start></v-icon>
                    Acoplarse a Sala
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card>
        </div>
      </v-col>

      <!-- Panel Lateral -->
      <v-col cols="12" md="4">
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
                      <v-chip size="x-small" color="cyan-lighten-4" variant="tonal" class="rounded-pill font-weight-bold">
                        {{ room.players.length }}/4 SLOT
                      </v-chip>
                    </div>

                    <div class="d-flex align-center mb-4">
                      <v-avatar size="32" class="mr-3 border-thin">
                        <v-img :src="`https://api.dicebear.com/7.x/bottts/svg?seed=${room.host}`"></v-img>
                      </v-avatar>
                      <div>
                        <div class="text-caption text-grey-lighten-1 line-height-1">COMANDANTE</div>
                        <div class="text-body-2 font-weight-bold text-white">{{ room.host }}</div>
                      </div>
                    </div>

                    <v-btn 
                      block 
                      color="cyan-accent-2" 
                      size="small" 
                      variant="elevated" 
                      class="rounded-pill font-weight-black text-black action-glow-btn" 
                      @click="multiplayerStore.joinRoom(room.id)"
                    >
                      ESTABLECER ENLACE
                    </v-btn>
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
        <v-card v-if="multiplayerStore.room" class="side-panel-card rounded-xl pa-4" elevation="0">
          <h3 class="text-subtitle-1 font-weight-bold text-white mb-4 d-flex align-center">
            <v-icon icon="mdi-account-group" color="cyan-accent-2" class="mr-2"></v-icon>
            Reclutar Tripulación
          </h3>
          <v-list v-if="friends.length > 0" bg-color="transparent" class="pa-0">
            <v-list-item v-for="friend in friends" :key="friend" class="px-2 py-2 mb-1 recruit-item rounded-lg">
              <template v-slot:prepend>
                <v-avatar size="32" class="mr-3">
                   <v-img :src="`https://api.dicebear.com/7.x/bottts/svg?seed=${friend}`"></v-img>
                </v-avatar>
              </template>
              <v-list-item-title class="text-body-2 text-white font-weight-bold">{{ friend }}</v-list-item-title>
              <template v-slot:append>
                <v-btn color="cyan-accent-2" variant="text" size="small" icon="mdi-bullhorn" @click="multiplayerStore.inviteFriend(friend)"></v-btn>
              </template>
            </v-list-item>
          </v-list>
          <div v-else class="text-center py-4 text-grey-darken-1">
            <p class="text-caption">Sin exploradores disponibles.</p>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAstroStore } from '@/stores/astroStore';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { storeToRefs } from 'pinia';

const astroStore = useAstroStore();
const multiplayerStore = useMultiplayerStore();
const { friends } = storeToRefs(astroStore);

const snackbar = ref({ show: false, text: '', color: 'success' });
const isPublic = ref(true);
const roomCode = ref('');

const isHost = computed(() => {
  return multiplayerStore.room?.host === astroStore.user;
});

const showMessage = (text, color = 'success') => {
  snackbar.value = { show: true, text, color };
};

const createRoom = () => {
  multiplayerStore.createRoom(astroStore.user, isPublic.value);
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

onMounted(() => {
  if (!multiplayerStore.isConnected) {
    multiplayerStore.connect();
  }
  astroStore.fetchUserStats();
  multiplayerStore.fetchAvailableRooms();
});
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
  background: rgba(0, 229, 255, 0.08) !important;
  border-color: rgba(0, 229, 255, 0.3) !important;
  transform: translateX(4px);
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
  background: rgba(15, 32, 50, 0.7) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
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
  height: 60px !important;
  letter-spacing: 2px;
}

.recruit-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
}

.recruit-item:hover {
  background: rgba(0, 229, 255, 0.05);
  border-color: rgba(0, 229, 255, 0.2);
}

.tracking-widest {
  letter-spacing: 0.3em;
}

.line-height-1 {
  line-height: 1;
}
</style>
