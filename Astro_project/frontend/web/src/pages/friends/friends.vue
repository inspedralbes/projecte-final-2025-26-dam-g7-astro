<template>
  <v-container fluid class="friends-container py-8 px-6">
    <div class="mb-8">
      <div class="d-flex align-center justify-center mb-6">
        <v-icon icon="mdi-account-group" size="x-large" color="cyan-accent-2" class="mr-4"></v-icon>
        <h1 class="text-h4 font-weight-bold text-white tracking-wide">Tripulación</h1>
      </div>

      <v-tabs v-model="tab" align-tabs="center" color="cyan-accent-2" bg-color="transparent" class="mb-6">
        <v-tab value="friends">Mis Amigos</v-tab>
        <v-tab value="search">Buscar Amigos</v-tab>
        <v-tab value="requests">
          Solicitudes
          <v-chip v-if="friendRequests && friendRequests.length > 0" color="error" size="small" class="ml-2 font-weight-bold">
            {{ friendRequests.length }}
          </v-chip>
        </v-tab>
      </v-tabs>
    </div>

    <v-window v-model="tab" class="bg-transparent" :touch="false">
      <!-- PESTAÑA: MIS AMIGOS -->
      <v-window-item value="friends">
        <v-text-field v-model="searchQuery" label="Buscar en mi tripulación..." prepend-inner-icon="mdi-magnify" variant="solo"
          bg-color="rgba(255, 255, 255, 0.05)" class="search-bar w-100 mb-6" hide-details rounded="xl"
          clearable></v-text-field>

        <div v-if="loading" class="d-flex justify-center align-center py-10">
          <v-progress-circular indeterminate color="cyan-accent-2" size="64"></v-progress-circular>
        </div>

        <v-row v-else-if="myFriendsList.length > 0">
          <v-col v-for="friend in myFriendsList" :key="friend.user" cols="12" xl="4" lg="4" md="6" sm="12">
            <v-card class="friend-card rounded-xl pa-4 d-flex flex-column h-100" elevation="0">
              <div class="d-flex align-center mb-4">
                <div
                  style="position: relative;"
                  class="mr-4 clickable-profile"
                  role="button"
                  tabindex="0"
                  @click="openProfile(friend)"
                  @keydown.enter="openProfile(friend)"
                  @keydown.space.prevent="openProfile(friend)"
                >
                  <v-avatar size="64" color="rgba(0, 229, 255, 0.1)" class="border-avatar">
                    <v-img v-if="friend.avatar" :src="getAvatarUrl(friend.avatar)" alt="Avatar" cover></v-img>
                    <span v-else class="text-h5 text-cyan-accent-2 font-weight-bold">{{ friend.user.charAt(0).toUpperCase() }}</span>
                  </v-avatar>
                  <v-avatar v-if="friend.mascot" size="28" class="friend-mascot-badge shadow-lg">
                    <v-img :src="getAvatarUrl(friend.mascot)" cover></v-img>
                  </v-avatar>
                </div>

                <div class="flex-grow-1">
                  <h2
                    class="text-h6 font-weight-bold text-white mb-1 clickable-profile clickable-name"
                    role="button"
                    tabindex="0"
                    @click="openProfile(friend)"
                    @keydown.enter="openProfile(friend)"
                    @keydown.space.prevent="openProfile(friend)"
                  >
                    {{ friend.user }}
                  </h2>
                  <div class="d-flex align-center flex-wrap gap-2">
                    <v-chip size="small" color="cyan-accent-2" variant="tonal" class="font-weight-bold">
                      Nivel {{ friend.level || 1 }}
                    </v-chip>
                  </div>
                </div>
              </div>

              <!-- Medallas del amigo -->
              <div class="achievements-mini-grid mb-4 mt-auto">
                <div v-for="i in 3" :key="i" class="achievement-slot">
                  <Medal v-if="getAchievement(friend.selectedAchievements?.[i - 1])"
                    :type="getAchievement(friend.selectedAchievements[i - 1]).type"
                    :icon="getAchievement(friend.selectedAchievements[i - 1]).icon" 
                    :scale="0.3"
                    :icon-size="48" />
                  <div v-else class="empty-slot-indicator"></div>
                </div>
              </div>

              <v-divider class="my-3 border-opacity-25" color="white"></v-divider>

              <v-card-actions class="pa-0 mt-auto">
                <v-btn icon color="error" variant="tonal" class="rounded-lg mr-2" @click="removeFriend(friend.user)">
                  <v-icon icon="mdi-trash-can-outline"></v-icon>
                </v-btn>
                <v-btn color="cyan-accent-2" variant="tonal" class="rounded-lg px-2 mr-2 flex-grow-1 text-caption font-weight-bold" @click="startChat(friend)">
                  <v-icon start icon="mdi-message-text-outline"></v-icon>
                  Enviar mensaje
                </v-btn>
                <v-btn color="primary" variant="elevated" class="rounded-lg px-2 flex-grow-1 text-caption font-weight-bold">
                  <v-icon start icon="mdi-sword-cross"></v-icon>
                  Desafiar
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <div v-else class="text-center py-10">
          <v-icon icon="mdi-account-search-outline" size="64" color="grey-lighten-1" class="mb-4"></v-icon>
          <h3 v-if="searchQuery" class="text-h6 text-grey-lighten-1">No tienes amigos que coincidan con la búsqueda.</h3>
          <h3 v-else class="text-h6 text-grey-lighten-1">Tu tripulación está vacía. ¡Busca nuevos reclutas!</h3>
        </div>
      </v-window-item>

      <!-- PESTAÑA: BUSCAR AMIGOS -->
      <v-window-item value="search">
        <div class="d-flex justify-space-between align-center mb-6 px-2">
          <v-text-field v-model="searchExploreQuery" label="Buscar exploradores en la galaxia..." prepend-inner-icon="mdi-magnify" variant="solo"
            bg-color="rgba(255, 255, 255, 0.05)" class="search-bar flex-grow-1 mr-4" hide-details rounded="xl"
            clearable density="comfortable" @update:model-value="reloadRandomExplorers"></v-text-field>

          <v-btn color="cyan-accent-2" variant="elevated" prepend-icon="mdi-refresh" class="rounded-pill font-weight-bold" @click="reloadRandomExplorers" :loading="reloading">
            Buscar Otros
          </v-btn>
        </div>

        <div v-if="loading || reloading" class="d-flex justify-center align-center py-10">
          <v-progress-circular indeterminate color="cyan-accent-2" size="64"></v-progress-circular>
        </div>

        <v-row v-else-if="randomExplorers.length > 0">
          <v-col v-for="explorer in randomExplorers" :key="explorer.user" cols="12" xl="4" lg="4" md="6" sm="12">
            <v-card class="friend-card rounded-xl pa-4 d-flex flex-column h-100" elevation="0">
              <div class="d-flex align-center mb-4">
                <div
                  style="position: relative;"
                  class="mr-4 clickable-profile"
                  role="button"
                  tabindex="0"
                  @click="openProfile(explorer)"
                  @keydown.enter="openProfile(explorer)"
                  @keydown.space.prevent="openProfile(explorer)"
                >
                  <v-avatar size="64" color="rgba(0, 229, 255, 0.1)" class="border-avatar">
                    <v-img v-if="explorer.avatar" :src="getAvatarUrl(explorer.avatar)" alt="Avatar" cover></v-img>
                    <span v-else class="text-h5 text-cyan-accent-2 font-weight-bold">{{ explorer.user.charAt(0).toUpperCase() }}</span>
                  </v-avatar>
                  <v-avatar v-if="explorer.mascot" size="28" class="friend-mascot-badge shadow-lg">
                    <v-img :src="getAvatarUrl(explorer.mascot)" cover></v-img>
                  </v-avatar>
                </div>

                <div class="flex-grow-1">
                  <h2
                    class="text-h6 font-weight-bold text-white mb-1 clickable-profile clickable-name"
                    role="button"
                    tabindex="0"
                    @click="openProfile(explorer)"
                    @keydown.enter="openProfile(explorer)"
                    @keydown.space.prevent="openProfile(explorer)"
                  >
                    {{ explorer.user }}
                  </h2>
                  <div class="d-flex align-center flex-wrap gap-2">
                    <v-chip size="small" color="cyan-accent-2" variant="tonal" class="font-weight-bold">
                      Nivel {{ explorer.level || 1 }}
                    </v-chip>
                  </div>
                </div>
              </div>

              <!-- Medallas del explorador -->
              <div class="achievements-mini-grid mb-4 mt-auto">
                <div v-for="i in 3" :key="i" class="achievement-slot">
                  <Medal v-if="getAchievement(explorer.selectedAchievements?.[i - 1])"
                    :type="getAchievement(explorer.selectedAchievements[i - 1]).type"
                    :icon="getAchievement(explorer.selectedAchievements[i - 1]).icon" 
                    :scale="0.32"
                    :icon-size="48" />
                  <div v-else class="empty-slot-indicator"></div>
                </div>
              </div>

              <v-divider class="my-3 border-opacity-25" color="white"></v-divider>

              <v-card-actions class="pa-0 mt-auto">
                <v-btn color="cyan-accent-2" variant="tonal" class="rounded-lg px-4 mr-2 flex-grow-1 text-caption font-weight-bold" @click="openProfile(explorer)">
                  <v-icon start icon="mdi-account-eye"></v-icon>
                  Ver Perfil
                </v-btn>
                <v-btn color="success" variant="elevated" :disabled="hasSentRequest(explorer.user)" class="rounded-lg px-4 flex-grow-1 text-caption font-weight-bold" @click="sendRequest(explorer.user)">
                  <v-icon start :icon="hasSentRequest(explorer.user) ? 'mdi-check' : 'mdi-account-plus'"></v-icon>
                  {{ hasSentRequest(explorer.user) ? 'Enviada' : 'Reclutar' }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <div v-else-if="!loading && !reloading" class="text-center py-10">
          <v-icon icon="mdi-telescope" size="64" color="grey-lighten-1" class="mb-4"></v-icon>
          <h3 class="text-h6 text-grey-lighten-1">No hay más exploradores por la galaxia ahora mismo.</h3>
        </div>
      </v-window-item>

      <!-- PESTAÑA: SOLICITUDES -->
      <v-window-item value="requests">
        <div v-if="loading" class="d-flex justify-center align-center py-10">
          <v-progress-circular indeterminate color="cyan-accent-2" size="64"></v-progress-circular>
        </div>

        <v-row v-else-if="requestsList.length > 0">
          <v-col v-for="requester in requestsList" :key="requester.user" cols="12" xl="4" lg="4" md="6" sm="12">
            <v-card class="friend-card rounded-xl pa-4 d-flex flex-column h-100" elevation="0">
              <div class="d-flex align-center mb-4">
                <div
                  style="position: relative;"
                  class="mr-4 clickable-profile"
                  role="button"
                  tabindex="0"
                  @click="openProfile(requester)"
                  @keydown.enter="openProfile(requester)"
                  @keydown.space.prevent="openProfile(requester)"
                >
                  <v-avatar size="64" color="rgba(0, 229, 255, 0.1)" class="border-avatar">
                    <v-img v-if="requester.avatar" :src="getAvatarUrl(requester.avatar)" alt="Avatar" cover></v-img>
                    <span v-else class="text-h5 text-cyan-accent-2 font-weight-bold">{{ requester.user.charAt(0).toUpperCase() }}</span>
                  </v-avatar>
                  <v-avatar v-if="requester.mascot" size="28" class="friend-mascot-badge shadow-lg">
                    <v-img :src="getAvatarUrl(requester.mascot)" cover></v-img>
                  </v-avatar>
                </div>

                <div class="flex-grow-1">
                  <h2
                    class="text-h6 font-weight-bold text-white mb-1 clickable-profile clickable-name"
                    role="button"
                    tabindex="0"
                    @click="openProfile(requester)"
                    @keydown.enter="openProfile(requester)"
                    @keydown.space.prevent="openProfile(requester)"
                  >
                    {{ requester.user }}
                  </h2>
                  <div class="d-flex align-center flex-wrap gap-2">
                    <v-chip size="small" color="cyan-accent-2" variant="tonal" class="font-weight-bold">
                      Nivel {{ requester.level || 1 }}
                    </v-chip>
                  </div>
                </div>
              </div>

              <!-- Medallas del solicitante -->
              <div class="achievements-mini-grid mb-4 mt-auto">
                <div v-for="i in 3" :key="i" class="achievement-slot">
                  <Medal v-if="getAchievement(requester.selectedAchievements?.[i - 1])"
                    :type="getAchievement(requester.selectedAchievements[i - 1]).type"
                    :icon="getAchievement(requester.selectedAchievements[i - 1]).icon" 
                    :scale="0.32"
                    :icon-size="48" />
                  <div v-else class="empty-slot-indicator"></div>
                </div>
              </div>

              <v-divider class="my-3 border-opacity-25" color="white"></v-divider>

              <v-card-actions class="pa-0 mt-auto">
                <v-btn color="error" variant="tonal" class="rounded-lg px-2 mr-2 flex-grow-1 text-caption font-weight-bold" @click="rejectRequest(requester.user)">
                  <v-icon start icon="mdi-close"></v-icon>
                  Rechazar
                </v-btn>
                <v-btn color="success" variant="elevated" class="rounded-lg px-2 flex-grow-1 text-caption font-weight-bold" @click="acceptRequest(requester.user)">
                  <v-icon start icon="mdi-check"></v-icon>
                  Aceptar
                </v-btn>
                <v-btn color="cyan-accent-2" variant="tonal" class="rounded-lg px-2 ml-2 flex-grow-1 text-caption font-weight-bold" @click="openProfile(requester)">
                  <v-icon start icon="mdi-account-eye"></v-icon>
                  Ver Perfil
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <div v-else class="text-center py-10">
          <v-icon icon="mdi-email-open-outline" size="64" color="grey-lighten-1" class="mb-4"></v-icon>
          <h3 class="text-h6 text-grey-lighten-1">No tienes solicitudes pendientes.</h3>
        </div>
      </v-window-item>
    </v-window>

    <!-- PROFILE DIALOG -->
    <v-dialog v-model="profileDialog.show" max-width="450">
      <v-card class="glass-popup pa-6 text-center rounded-xl border-cyan">
        <div class="d-flex justify-end w-100">
          <v-btn icon="mdi-close" variant="text" color="grey" @click="profileDialog.show = false"></v-btn>
        </div>
        
        <div class="position-relative mb-6 d-flex justify-center">
          <div style="position: relative;">
            <v-avatar size="120" class="profile-dialog-avatar bg-black">
              <v-img v-if="profileDialog.user?.avatar" :src="getAvatarUrl(profileDialog.user.avatar)" cover></v-img>
              <span v-else class="text-h2 text-cyan-accent-2 font-weight-bold">{{ profileDialog.user?.user?.charAt(0).toUpperCase() }}</span>
            </v-avatar>
            <v-avatar v-if="profileDialog.user?.mascot" size="50" class="profile-dialog-mascot shadow-lg">
              <v-img :src="getAvatarUrl(profileDialog.user?.mascot)" cover></v-img>
            </v-avatar>
          </div>
        </div>

        <h2 class="text-h4 font-weight-black text-white mb-1">{{ profileDialog.user?.user }}</h2>
        <div class="text-cyan-accent-2 font-weight-bold text-subtitle-1 mb-4">Nivel {{ profileDialog.user?.level || 1 }} - {{ profileDialog.user?.rank || 'Explorador' }}</div>
        
        <v-divider class="my-4 border-opacity-25" color="white"></v-divider>
        
        <h3 class="text-overline font-weight-black text-grey-lighten-1 mb-4">LOGROS ACTIVOS</h3>
        <div class="d-flex justify-center gap-4 mb-6">
           <div v-for="i in 3" :key="i" class="achievement-display-box">
             <Medal v-if="getAchievement(profileDialog.user?.selectedAchievements?.[i - 1])"
              :type="getAchievement(profileDialog.user.selectedAchievements[i - 1]).type"
              :icon="getAchievement(profileDialog.user.selectedAchievements[i - 1]).icon" 
              :scale="0.5"
              :icon-size="48" />
             <v-icon v-else icon="mdi-plus" color="grey-darken-3" size="24"></v-icon>
           </div>
        </div>

        <v-btn v-if="!isFriend(profileDialog.user?.user) && profileDialog.user?.user !== astroStore.user" 
          color="success" block size="large" :disabled="hasSentRequest(profileDialog.user?.user)" class="rounded-lg font-weight-bold" 
          @click="sendRequest(profileDialog.user?.user); profileDialog.show = false;">
          <v-icon start :icon="hasSentRequest(profileDialog.user?.user) ? 'mdi-check' : 'mdi-account-plus'"></v-icon>
          {{ hasSentRequest(profileDialog.user?.user) ? 'Solicitud Enviada a ' + profileDialog.user?.user : 'Reclutar a ' + profileDialog.user?.user }}
        </v-btn>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAstroStore } from '@/stores/astroStore';
import { ACHIEVEMENTS } from '@/constants/achievements';
import Medal from '@/components/achievements/Medal.vue';

const astroStore = useAstroStore();
const { explorers, friends, friendRequests } = storeToRefs(astroStore);

const loading = ref(true);
const reloading = ref(false);
const searchQuery = ref('');
const searchExploreQuery = ref('');
const tab = ref('friends');
const randomExplorers = ref([]);
const sentRequests = ref([]); // Store users to whom we've sent requests this session

const profileDialog = ref({
  show: false,
  user: null
});

const openProfile = (userObj) => {
  profileDialog.value.user = userObj;
  profileDialog.value.show = true;
};

const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});

const showMessage = (text, color = 'success') => {
  snackbar.value = {
    show: true,
    text: text,
    color: color
  };
};

const getAchievement = (id) => {
  if (id === null || id === undefined) return null;
  return ACHIEVEMENTS.find(a => a.id === Number(id));
};

const getAvatarUrl = (avatarStr) => {
  if (!avatarStr) return '';
  // Si ya empieza con /, devolver tal cual, si no, poner barra
  return avatarStr.startsWith('/') ? avatarStr : `/${avatarStr}`;
};

const formatMascotName = (mascotData) => {
  if (typeof mascotData === 'object' && mascotData !== null) {
    return mascotData.name || 'Mascota';
  }
  let baseName = mascotData || 'Mascota';
  return baseName.replace(/\.[^/.]+$/, "");
};

const isFriend = (username) => {
  if (!username) return false;
  return Array.isArray(friends.value) && friends.value.includes(username);
};

// Mis amigos (filtrados y ordenados)
const myFriendsList = computed(() => {
  const allUsers = Array.isArray(explorers.value) ? explorers.value : [];
  
  let myFriends = allUsers.filter(f => isFriend(f.user) && f.user !== astroStore.user);

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    myFriends = myFriends.filter(f => f.user.toLowerCase().includes(query));
  }

  return myFriends;
});

// Solicitudes recibidas
const requestsList = computed(() => {
  const allUsers = Array.isArray(explorers.value) ? explorers.value : [];
  return allUsers.filter(f => friendRequests.value?.includes(f.user));
});

// Función para cargar exploradores aleatorios
const reloadRandomExplorers = () => {
  reloading.value = true;
  
  setTimeout(() => { // Pequeño timeout visual
    const allUsers = Array.isArray(explorers.value) ? explorers.value : [];
    
    // Filtrar: ni yo, ni mis amigos actuales
    let eligibleExplorers = allUsers.filter(f => {
      return f.user !== astroStore.user && !isFriend(f.user);
    });

    if (searchExploreQuery.value) {
      const q = searchExploreQuery.value.toLowerCase();
      eligibleExplorers = eligibleExplorers.filter(f => f.user.toLowerCase().includes(q));
    }

    // Shuffle simple (Fisher-Yates o similar)
    const shuffled = [...eligibleExplorers].sort(() => 0.5 - Math.random());
    
    // Tomar 10
    randomExplorers.value = shuffled.slice(0, 10);
    reloading.value = false;
  }, 400);
};

const fetchFriends = async () => {
  loading.value = true;
  try {
    await astroStore.fetchAllUsers();
    await astroStore.fetchUserStats();
    reloadRandomExplorers(); // Llenar la pestaña de búsqueda al iniciar
  } catch (error) {
    console.error("Error cargando tripulación:", error);
    showMessage("Error de conexión con la flota", "error");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchFriends();
});

const removeFriend = async (friendName) => {
  await astroStore.removeFriendAction(friendName);
  showMessage(`${friendName} ha abandonado la tripulación.`, 'warning');
  await astroStore.fetchUserStats(); 
  // Recargar aleatorios por si queremos que ese amigo vuelva a aparecer en "buscar"
  if (tab.value === 'search') reloadRandomExplorers();
};

const addFriend = async (friendName) => {
  // Función mantenida por compatibilidad si se usaba internamente
  if (isFriend(friendName)) return;
  const result = await astroStore.addFriendAction(friendName);
  if (result?.success) {
    showMessage(`¡${friendName} reclutado con éxito!`);
  }
};

const hasSentRequest = (username) => {
  return sentRequests.value.includes(username);
};

const sendRequest = async (friendName) => {
  if (isFriend(friendName)) return;
  const result = await astroStore.sendFriendRequest(friendName);
  
  if (result && result.success) {
    showMessage(`Solicitud enviada a ${friendName}`);
    sentRequests.value.push(friendName);
  } else {
    showMessage(result?.message || "Error al enviar solicitud", "error");
  }
};

const startChat = (friendObj) => {
  showMessage(`Chat con ${friendObj.user} disponible pronto`, 'info');
};

const acceptRequest = async (requesterName) => {
  const result = await astroStore.acceptFriendRequest(requesterName);
  if (result?.success) {
    showMessage(`Has aceptado a ${requesterName} en tu tripulación`);
    await astroStore.fetchUserStats();
  } else {
    showMessage(result?.message || "Error al aceptar solicitud", "error");
  }
};

const rejectRequest = async (requesterName) => {
  const result = await astroStore.rejectFriendRequest(requesterName);
  if (result?.success) {
    showMessage(`Has rechazado a ${requesterName}`);
  } else {
    showMessage("Error al rechazar solicitud", "error");
  }
};
</script>

<style scoped>
.friends-container {
  min-height: 100vh;
}

.tracking-wide {
  letter-spacing: 0.1em;
}

.friend-card {
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  transition: all 0.3s ease;
}

.friend-card:hover {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(0, 229, 255, 0.3) !important;
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4) !important;
}

.border-avatar {
  border: 1px solid rgba(0, 229, 255, 0.2);
}

.clickable-profile {
  cursor: pointer;
}

.clickable-profile:focus-visible {
  outline: 2px solid rgba(0, 229, 255, 0.8);
  outline-offset: 2px;
  border-radius: 8px;
}

.clickable-name {
  display: inline-block;
}

.search-bar :deep(input) {
  color: white !important;
  caret-color: white !important;
}

.search-bar :deep(input::placeholder) {
  color: rgba(255, 255, 255, 0.75) !important;
  opacity: 1;
}

.search-bar :deep(.v-label) {
  color: rgba(255, 255, 255, 0.75) !important;
}

.search-bar :deep(.v-field__prepend-inner .v-icon) {
  color: rgba(255, 255, 255, 0.75) !important;
}

.bg-transparent {
  background-color: transparent !important;
}

.achievements-mini-grid {
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
  height: 60px; /* Para mantener consistencia si no hay medallas */
  margin-top: 10px;
}

.achievement-slot {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: visible; /* Prevents ribbons from getting chopped */
  position: relative;
}

/* Ajuste específico para centrar la medalla cuando está reducida con CSS scale */
.achievement-slot :deep(.medal-container) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.35) !important;
  margin: 0 !important;
  z-index: 2;
}

.empty-slot-indicator {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
}

.glass-popup {
  background: rgba(15, 17, 23, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.border-cyan {
  border: 1px solid rgba(0, 229, 255, 0.3) !important;
}

.profile-dialog-avatar {
  border: 4px solid rgba(0, 229, 255, 0.4);
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.2);
}

.profile-dialog-mascot {
  position: absolute;
  bottom: -5px;
  right: -10px;
  border: 3px solid #1a1d26;
  background: white;
}

.friend-mascot-badge {
  position: absolute;
  bottom: -2px;
  right: -5px;
  border: 2px solid #1a1d26;
  background: white;
}

.gap-4 {
  gap: 16px;
}

.achievement-display-box {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  background: #242835;
  position: relative;
  overflow: visible;
}

.achievement-display-box :deep(.medal-container) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.5) !important;
  margin: 0 !important;
  z-index: 2;
}
</style>
