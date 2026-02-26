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
        <v-card v-if="multiplayerStore.room" class="mission-control-panel rounded-xl overflow-hidden d-flex flex-column" elevation="12" style="max-height: 80vh;">
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

          <div class="pa-8 flex-grow-1 overflow-y-auto custom-scroll">
            <div class="d-flex align-center mb-8">
              <h3 class="text-h6 text-white font-weight-bold mr-4">Tripulación Actual (<span class="text-cyan-accent-2">{{ multiplayerStore.room?.players?.length || 0 }}</span> / {{ multiplayerStore.room?.maxPlayers || 4 }})</h3>
              <v-divider class="flex-grow-1 border-opacity-25" color="cyan-lighten-4"></v-divider>
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
                  
                  <div class="mb-6">
                     <div class="text-caption text-cyan-accent-2 font-weight-bold mb-2 tracking-widest">TAMAÑO DE LA NAVE MÁX.</div>
                     <v-select
                        v-model="maxPlayers"
                        :items="[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]"
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
                  </div>

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
                        {{ room.players.length }}/{{ room.maxPlayers || 4 }} SLOT
                      </v-chip>
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
        <v-card v-if="multiplayerStore.room" class="side-panel-card rounded-xl pa-0 overflow-hidden" elevation="4">
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

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAstroStore } from '@/stores/astroStore';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { storeToRefs } from 'pinia';

const astroStore = useAstroStore();
const multiplayerStore = useMultiplayerStore();
const { friends } = storeToRefs(astroStore);

const snackbar = ref({ show: false, text: '', color: 'success' });
const isPublic = ref(true);
const maxPlayers = ref(4);
const roomCode = ref('');

watch(() => multiplayerStore.error, (newError) => {
  if (newError) {
    showMessage(newError, 'error');
    multiplayerStore.error = null; // Limpiarlo después de mostrarlo
  }
});

const isHost = computed(() => {
  return multiplayerStore.room?.host === astroStore.user;
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

// Helpers para Avatares
const getAvatarUrl = (avatar, user) => {
  // Si el avatar es un archivo local válido (los JPG de astronautas)
  if (avatar && (avatar.includes('.jpg') || avatar.includes('.png'))) {
    return `/${avatar}`;
  }
  // Si no hay avatar o es un seed de texto, usamos DiceBear (o podrías usar Astronauta_blanc.jpg si prefieres)
  if (user) {
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${user}`;
  }
  return '/Astronauta_blanc.jpg'; // Último recurso
};

const getPlayerAvatar = (username) => {
  if (username === astroStore.user) {
    return getAvatarUrl(astroStore.avatar, username);
  }
  const explorer = astroStore.explorers.find(e => e.user === username);
  return getAvatarUrl(explorer?.avatar, username);
};

const showMessage = (text, color = 'success') => {
  snackbar.value = { show: true, text, color };
};

const createRoom = () => {
  multiplayerStore.createRoom(astroStore.user, isPublic.value, maxPlayers.value);
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
  astroStore.fetchAllUsers(); // Cargar todos los exploradores para reclutar
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
:deep(.v-avatar .v-img__img) {
  border-radius: 50%;
  transform: scale(1.4);
  transform-origin: center center;
  object-position: center center;
}

.player-glow-avatar {
  border: 2px solid rgba(0, 229, 255, 0.4);
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.3);
  padding: 0; /* Quitamos padding para que el zoom funcione bien */
  background: white; /* Fondo blanco para que el avatar resalte si es transparente */
  overflow: hidden;
}

.recruit-item :deep(.v-avatar) {
  background: white;
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
</style>
