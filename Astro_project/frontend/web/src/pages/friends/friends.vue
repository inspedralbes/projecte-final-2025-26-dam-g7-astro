º<template>
  <v-container fluid class="friends-container py-8 px-6">
    <div class="mb-8">
      <div class="d-flex align-center justify-center mb-6">
        <v-icon icon="mdi-account-group" size="48" color="cyan-accent-2" class="mr-4"></v-icon>
        <h1 class="text-h2 font-weight-bold text-white tracking-wide">{{ $t('friends.title') }}</h1>
      </div>

      <v-tabs v-model="tab" align-tabs="center" color="cyan-accent-2" bg-color="transparent" class="mb-6 custom-tabs">
        <v-tab value="friends" class="text-uppercase font-weight-bold px-8">{{ $t('friends.tabs.myFriends') }}</v-tab>
        <v-tab value="search" class="text-uppercase font-weight-bold px-8">{{ $t('friends.tabs.search') }}</v-tab>
        <v-tab value="requests" class="text-uppercase font-weight-bold px-8">
          {{ $t('friends.tabs.requests') }}
          <v-chip v-if="friendRequests && friendRequests.length > 0" color="error" size="x-small"
            class="ml-2 font-weight-black">
            {{ friendRequests.length }}
          </v-chip>
        </v-tab>
      </v-tabs>
    </div>

    <v-window v-model="tab" class="bg-transparent" :touch="false">
      <!-- PESTAÑA: MIS AMIGOS -->
      <v-window-item value="friends">
        <v-text-field v-model="searchQuery" :placeholder="$t('friends.searchBar1')" prepend-inner-icon="mdi-magnify"
          variant="solo" bg-color="rgba(13, 25, 48, 0.4)" class="search-bar w-100 mb-8" hide-details rounded="xl"
          clearable></v-text-field>

        <div v-if="loading" class="d-flex justify-center align-center py-10">
          <v-progress-circular indeterminate color="cyan-accent-2" size="64" width="6"></v-progress-circular>
        </div>

        <v-row v-else-if="myFriendsList.length > 0">
          <v-col v-for="friend in myFriendsList" :key="friend.user" cols="12" xl="3" lg="4" md="6">
            <v-card class="friend-card detailed-card h-100" variant="flat">
              <!-- Top Banner / Header -->
              <div class="card-header-gradient" :class="getRankClass(friend.level)"></div>

              <div class="card-body pa-5 pt-2">
                <div class="d-flex align-start justify-space-between mb-2">
                  <div class="avatar-container mt-n12">
                    <div class="avatar-ring" :class="getRankClass(friend.level)">
                      <v-avatar size="84" color="#0a192f" class="main-avatar">
                        <v-img v-if="friend.avatar" :src="getAvatarUrl(friend.avatar, friend.user)" cover></v-img>
                        <span v-else class="text-h4 text-cyan-accent-2 font-weight-bold">{{
                          friend.user.charAt(0).toUpperCase() }}</span>
                      </v-avatar>
                    </div>
                  </div>

                  <div class="text-right">
                    <div class="text-overline text-cyan-accent-1 lh-1 mb-1">{{ $t('friends.level', {
                      level: friend.level
                      || 1 }) }}</div>
                    <div class="xp-mini-bar">
                      <v-progress-linear :model-value="65" color="cyan-accent-2" height="4" rounded></v-progress-linear>
                    </div>
                  </div>
                </div>

                <div class="mb-4">
                  <h2 class="text-h5 font-weight-black text-white mb-1 name-title">{{ friend.user }}</h2>
                  <v-chip :class="['rank-chip-mini font-weight-black', getRankClass(friend.level)]" size="x-small">
                    {{ friend.selectedTitle ? t('shopItems.' + getTitleKey(friend.selectedTitle) + '.name') : getRankName(friend.level) }}
                  </v-chip>
                </div>

                <!-- Achievements Mini Showcase -->
                <div class="section-label-mini mb-2">{{ $t('friends.activeAchievements') }}</div>
                <div class="achievements-showcase mb-6">
                  <div v-for="i in 3" :key="i" class="mini-medal-slot">
                    <Medal v-if="getAchievement(friend.selectedAchievements?.[i - 1])"
                      :type="getAchievement(friend.selectedAchievements[i - 1]).type"
                      :icon="getAchievement(friend.selectedAchievements[i - 1]).icon" :scale="0.25" />
                    <v-icon v-else icon="mdi-shield-outline" color="rgba(255,255,255,0.05)" size="20"></v-icon>
                  </div>
                </div>

                <v-divider class="mb-4 border-opacity-10" color="white"></v-divider>

                <div class="d-flex flex-column gap-2">
                  <v-btn color="primary" variant="elevated" block class="font-weight-bold rounded-lg h-large"
                    :loading="challengeCooldowns[friend.user]" :disabled="challengeCooldowns[friend.user]"
                    @click="challengeFriend(friend.user)">
                    <v-icon start icon="mdi-sword-cross" size="18"></v-icon>
                    {{ $t('friends.challenge') }}
                  </v-btn>
                  <div class="d-flex gap-2">
                    <v-badge :model-value="!!chatStore.unreadCounts[friend.user]" color="error"
                      :content="chatStore.unreadCounts[friend.user] > 9 ? '9+' : chatStore.unreadCounts[friend.user]"
                      floating class="flex-grow-1 msg-badge">
                    <v-btn color="cyan-accent-2" variant="tonal" class="flex-grow-1 font-weight-bold rounded-lg h-large"
                        @click="startChat(friend)">
                        <v-icon start icon="mdi-message-text-outline" size="18"></v-icon>
                        {{ $t('friends.chat') }}
                      </v-btn>
                    </v-badge>
                    <v-btn color="error" variant="tonal" class="px-0 rounded-lg h-large" style="min-width: 48px"
                      @click="removeFriend(friend.user)">
                      <v-icon icon="mdi-account-minus-outline" size="20"></v-icon>
                    </v-btn>
                  </div>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <div v-else class="text-center py-16">
          <v-icon icon="mdi-account-search-outline" size="80" color="blue-grey-darken-3" class="mb-4"></v-icon>
          <h3 v-if="searchQuery" class="text-h5 text-grey">{{ $t('friends.noSearchMatch') }}</h3>
          <h3 v-else class="text-h5 text-grey">{{ $t('friends.emptyCrew') }}</h3>
        </div>
      </v-window-item>

      <!-- PESTAÑA: EXPLORAR GALAXIA -->
      <v-window-item value="search">
        <div class="d-flex flex-column flex-sm-row gap-4 mb-8">
          <v-text-field v-model="searchExploreQuery" :placeholder="$t('friends.searchExplore')"
            prepend-inner-icon="mdi-radar" variant="solo" bg-color="rgba(13, 25, 48, 0.4)"
            class="search-bar flex-grow-1" hide-details rounded="xl" clearable
            @update:model-value="reloadRandomExplorers"></v-text-field>

          <v-btn color="cyan-accent-2" variant="elevated" prepend-icon="mdi-refresh" height="56"
            class="rounded-pill px-8 font-weight-bold" @click="reloadRandomExplorers" :loading="reloading">
            {{ $t('friends.searchOthersBtn') }}
          </v-btn>
        </div>

        <div v-if="loading || reloading" class="d-flex justify-center align-center py-16">
          <v-progress-circular indeterminate color="cyan-accent-3" size="80" width="8"></v-progress-circular>
        </div>

        <v-row v-else-if="randomExplorers.length > 0">
          <v-col v-for="explorer in randomExplorers" :key="explorer.user" cols="12" xl="3" lg="4" md="6">
            <v-card class="friend-card explorer-card detailed-card h-100" variant="flat">
              <div class="card-header-gradient" :class="getRankClass(explorer.level)"></div>

              <div class="card-body pa-5 pt-2">
                <div class="d-flex align-start justify-space-between mb-2">
                  <div class="avatar-container mt-n12">
                    <div class="avatar-ring" :class="getRankClass(explorer.level)">
                      <v-avatar size="84" color="#0a192f" class="main-avatar">
                        <v-img v-if="explorer.avatar" :src="getAvatarUrl(explorer.avatar, explorer.user)" cover></v-img>
                        <span v-else class="text-h4 text-cyan-accent-2 font-weight-bold">{{
                          explorer.user.charAt(0).toUpperCase() }}</span>
                      </v-avatar>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-overline text-cyan-accent-1 lh-1 mb-1">
                      {{ $t('friends.level', { level: explorer.level || 1 }) }}
                    </div>
                    <div class="xp-mini-bar">
                      <v-progress-linear :model-value="Math.random() * 100" color="cyan-accent-2" height="4" rounded></v-progress-linear>
                    </div>
                  </div>
                </div>

                <div class="mb-4">
                  <h2 class="text-h5 font-weight-black text-white mb-1 name-title">{{ explorer.user }}</h2>
                  <v-chip :class="['rank-chip-mini font-weight-black', getRankClass(explorer.level)]" size="x-small">
                    {{ explorer.selectedTitle ? t('shopItems.' + getTitleKey(explorer.selectedTitle) + '.name') : getRankName(explorer.level) }}
                  </v-chip>
                </div>

                <!-- Achievements Mini Showcase -->
                <div class="section-label-mini mb-2">{{ $t('friends.activeAchievements') }}</div>
                <div class="achievements-showcase mb-6">
                  <div v-for="i in 3" :key="i" class="mini-medal-slot">
                    <Medal v-if="getAchievement(explorer.selectedAchievements?.[i - 1])"
                      :type="getAchievement(explorer.selectedAchievements[i - 1]).type"
                      :icon="getAchievement(explorer.selectedAchievements[i - 1]).icon" :scale="0.25" />
                    <v-icon v-else icon="mdi-shield-outline" color="rgba(255,255,255,0.05)" size="20"></v-icon>
                  </div>
                </div>

                <v-divider class="mb-4 border-opacity-10" color="white"></v-divider>

                <div class="d-flex gap-3">
                  <v-btn color="white" variant="tonal" class="flex-grow-1 font-weight-bold rounded-lg h-large"
                    @click="openProfile(explorer)">
                    {{ $t('friends.viewProfile') }}
                  </v-btn>
                  <v-btn color="success" variant="elevated" :disabled="hasSentRequest(explorer.user)"
                    class="flex-grow-1 font-weight-bold rounded-lg h-large" @click="sendRequest(explorer.user)">
                    <v-icon start :icon="hasSentRequest(explorer.user) ? 'mdi-check' : 'mdi-plus-thick'"></v-icon>
                    {{ hasSentRequest(explorer.user) ? $t('friends.sentReq') : $t('friends.recruit') }}
                  </v-btn>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <div v-else class="text-center py-16">
          <v-icon icon="mdi-satellite-variant" size="80" color="blue-grey-darken-3" class="mb-4"></v-icon>
          <h3 class="text-h5 text-grey">{{ $t('friends.noExplorers') }}</h3>
        </div>
      </v-window-item>

      <!-- PESTAÑA: SOLICITUDES -->
      <v-window-item value="requests">
        <div v-if="loading" class="d-flex justify-center align-center py-16">
          <v-progress-circular indeterminate color="cyan-accent-3" size="80" width="8"></v-progress-circular>
        </div>

        <v-row v-else-if="requestsList.length > 0">
          <v-col v-for="requester in requestsList" :key="requester.user" cols="12" xl="3" lg="4" md="6">
            <v-card class="friend-card request-card detailed-card h-100" variant="flat">
              <div class="card-header-gradient bg-requests"></div>

              <div class="card-body pa-5 pt-2">
                <div class="avatar-container mt-n12 mb-4">
                  <div class="avatar-ring ring-requests">
                    <v-avatar size="84" color="#0a192f" class="main-avatar">
                      <v-img v-if="requester.avatar" :src="getAvatarUrl(requester.avatar, requester.user)"
                        cover></v-img>
                      <span v-else class="text-h4 text-cyan-accent-2 font-weight-bold">{{
                        requester.user.charAt(0).toUpperCase() }}</span>
                    </v-avatar>
                  </div>
                </div>

                <div class="mb-6">
                  <h2 class="text-h5 font-weight-black text-white mb-1 name-title">{{ requester.user }}</h2>
                  <div class="d-flex align-center gap-2">
                    <v-chip :class="['rank-chip-mini font-weight-black', getRankClass(requester.level)]" size="x-small">
                      {{ requester.selectedTitle ? t('shopItems.' + getTitleKey(requester.selectedTitle) + '.name') : getRankName(requester.level) }}
                    </v-chip>
                    <div class="text-overline text-cyan-accent-1 lh-1 mb-1">
                      {{ $t('friends.level', { level: requester.level || 1 }) }}
                    </div>
                    <div class="xp-mini-bar">
                      <v-progress-linear :model-value="Math.random() * 100" color="cyan-accent-2" height="4" rounded></v-progress-linear>
                    </div>
                  </div>
                </div>

                <v-divider class="mb-4 border-opacity-10" color="white"></v-divider>

                <div class="d-flex flex-column gap-2">
                  <div class="d-flex gap-2">
                    <v-btn color="success" variant="elevated" class="flex-grow-1 font-weight-bold rounded-lg h-large"
                      @click="acceptRequest(requester.user)">
                      {{ $t('friends.accept') }}
                    </v-btn>
                    <v-btn color="error" variant="tonal" class="flex-grow-1 font-weight-bold rounded-lg h-large"
                      @click="rejectRequest(requester.user)">
                      {{ $t('friends.reject') }}
                    </v-btn>
                  </div>
                  <v-btn color="white" variant="text" block class="text-caption font-weight-black"
                    @click="openProfile(requester)">
                    {{ $t('friends.viewProfile') }}
                  </v-btn>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <div v-else class="text-center py-16">
          <v-icon icon="mdi-inbox-outline" size="80" color="blue-grey-darken-3" class="mb-4"></v-icon>
          <h3 class="text-h5 text-grey">{{ $t('friends.noReqs') }}</h3>
        </div>
      </v-window-item>
    </v-window>

    <!-- PROFILE DIALOG (EXPEDIENTE) -->
    <v-dialog v-model="profileDialog.show" max-width="480">
      <v-card class="expediente-card pa-8 rounded-xl">
        <div class="d-flex justify-end mb-n4">
          <v-btn icon="mdi-close" variant="text" color="white" size="small" @click="profileDialog.show = false"></v-btn>
        </div>

        <div class="text-center">
          <div class="position-relative mb-6 d-inline-block">
            <div class="avatar-ring-large" :class="getRankClass(profileDialog.user?.level)">
              <v-avatar size="140" class="main-avatar bg-black">
                <v-img v-if="profileDialog.user?.avatar"
                  :src="getAvatarUrl(profileDialog.user.avatar, profileDialog.user.user)" cover></v-img>
                <span v-else class="text-h1 text-cyan-accent-2 font-weight-bold">{{
                  profileDialog.user?.user?.charAt(0).toUpperCase() }}</span>
              </v-avatar>
            </div>
          </div>

          <h2 class="text-h3 font-weight-black text-white mb-1">{{ profileDialog.user?.user }}</h2>
          <div class="mb-6">
            <v-chip :class="['rank-chip font-weight-black px-6', getRankClass(profileDialog.user?.level)]" size="large">
              {{ profileDialog.user?.selectedTitle ? t('shopItems.' + getTitleKey(profileDialog.user?.selectedTitle) + '.name') : getRankName(profileDialog.user?.level) }}
            </v-chip>
            <div class="mt-2 text-overline text-cyan-accent-1">{{ $t('friends.level', {
              level: profileDialog.user?.level || 1 }) }}</div>
          </div>

          <v-row class="bg-black-semi pa-4 rounded-lg mb-8" no-gutters>
            <v-col cols="6" class="border-right-dim">
              <div class="text-overline text-grey">{{ $t('profile.levelLabel') }}</div>
              <div class="text-h5 text-white font-weight-bold">{{ profileDialog.user?.level || 1 }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-overline text-grey">{{ $t('profile.seniorityLabel') }}</div>
              <div class="text-h5 text-white font-weight-bold">{{ $t('profile.systemValue') }}</div>
            </v-col>
          </v-row>

          <div class="section-label-mini mb-4">{{ $t('friends.activeAchievements') }}</div>
          <div class="d-flex justify-center gap-6 mb-8">
            <div v-for="i in 3" :key="i" class="achievement-display-slot">
              <Medal v-if="getAchievement(profileDialog.user?.selectedAchievements?.[i - 1])"
                :type="getAchievement(profileDialog.user.selectedAchievements[i - 1]).type"
                :icon="getAchievement(profileDialog.user.selectedAchievements[i - 1]).icon" :scale="0.45" />
              <v-icon v-else icon="mdi-lock-outline" color="rgba(255,255,255,0.05)" size="32"></v-icon>
            </div>
          </div>

          <v-btn v-if="!isFriend(profileDialog.user?.user) && profileDialog.user?.user !== astroStore.user"
            color="success" block size="x-large" :disabled="hasSentRequest(profileDialog.user?.user)"
            class="rounded-lg font-weight-black action-btn-glow"
            @click="sendRequest(profileDialog.user?.user); profileDialog.show = false;">
            <v-icon start :icon="hasSentRequest(profileDialog.user?.user) ? 'mdi-check' : 'mdi-account-plus'"></v-icon>
            {{ hasSentRequest(profileDialog.user?.user) ? $t('friends.sentReq') : $t('friends.recruit') }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" class="custom-snackbar">
      <div class="d-flex align-center">
        <v-icon :icon="snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'" class="mr-3"></v-icon>
        <span class="font-weight-bold">{{ snackbar.text }}</span>
      </div>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAstroStore } from '@/stores/astroStore';
import { useChatStore } from '@/stores/chatStore';
import { useMultiplayerStore } from '@/stores/multiplayerStore';
import { ACHIEVEMENTS } from '@/constants/achievements';
import Medal from '@/components/achievements/Medal.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const astroStore = useAstroStore();
const chatStore = useChatStore();
const multiplayerStore = useMultiplayerStore();
const { explorers, friends, friendRequests } = storeToRefs(astroStore);

const loading = ref(true);
const reloading = ref(false);
const searchQuery = ref('');
const searchExploreQuery = ref('');
const tab = ref('friends');
const randomExplorers = ref([]);
const sentRequests = ref([]);
const challengeCooldowns = ref({}); // Cooldowns por amigo

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

const ALL_TITLES = [
  { id: 105, name: 'El Imparable', key: 'titleUnstoppable' },
  { id: 106, name: 'Leyenda Galáctica', key: 'titleLegend' },
  { id: 107, name: 'Destructor de Asteroides', key: 'titleDestroyer' }
];

function getTitleKey(titleName) {
  if (!titleName) return '';
  const cleanName = titleName.replace('Título: ', '');
  const title = ALL_TITLES.find(t => t.name === cleanName);
  return title ? title.key : '';
}

const getAchievement = (id) => {
  if (id === null || id === undefined) return null;
  return ACHIEVEMENTS.find(a => a.id === Number(id));
};

const getAvatarUrl = (avatarStr, username) => {
  if (!avatarStr || typeof avatarStr !== 'string') {
    if (username && username !== '[object Object]') {
      return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;
    }
    return '/Astronauta_blanc.jpg';
  }
  return avatarStr.startsWith('/') ? avatarStr : `/${avatarStr}`;
};

const isFriend = (username) => {
  if (!username) return false;
  return Array.isArray(friends.value) && friends.value.includes(username);
};

// Rangos dinámicos (Cada 10 niveles)
const getRankName = (level = 1) => {
  const index = Math.min(Math.floor((level - 1) / 10), 14);
  return t(`ranks.${index}`);
};

const getRankClass = (level = 1) => {
  if (level <= 10) return 'rank-tier-1'; // Cadete
  if (level <= 30) return 'rank-tier-2'; // Explorador/Navegante
  if (level <= 60) return 'rank-tier-3'; // Capitán/Comandante/Almirante
  if (level <= 100) return 'rank-tier-4'; // Centinela/Guardián/Forjador/Maestro
  if (level <= 130) return 'rank-tier-5'; // Arconte/Soberano/Arquitecto
  return 'rank-tier-6'; // Deidad/Omnisciente
};

const myFriendsList = computed(() => {
  const allUsers = Array.isArray(explorers.value) ? explorers.value : [];
  let myFriends = allUsers.filter(f => isFriend(f.user) && f.user !== astroStore.user);
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    myFriends = myFriends.filter(f => f.user.toLowerCase().includes(query));
  }
  return myFriends;
});

const requestsList = computed(() => {
  const allUsers = Array.isArray(explorers.value) ? explorers.value : [];
  return allUsers.filter(f => friendRequests.value?.includes(f.user));
});

const reloadRandomExplorers = () => {
  reloading.value = true;
  setTimeout(() => {
    const allUsers = Array.isArray(explorers.value) ? explorers.value : [];
    let eligibleExplorers = allUsers.filter(f => f.user !== astroStore.user && !isFriend(f.user));
    if (searchExploreQuery.value) {
      const q = searchExploreQuery.value.toLowerCase();
      eligibleExplorers = eligibleExplorers.filter(f => f.user.toLowerCase().includes(q));
    }
    const shuffled = [...eligibleExplorers].sort(() => 0.5 - Math.random());
    randomExplorers.value = shuffled.slice(0, 12);
    reloading.value = false;
  }, 600);
};

const fetchFriends = async () => {
  loading.value = true;
  try {
    await astroStore.fetchAllUsers();
    await astroStore.fetchUserStats();
    reloadRandomExplorers();
  } catch (error) {
    console.error("Error cargando tripulación:", error);
    showMessage("Error de sincronización con la flota", "error");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchFriends();
});

const removeFriend = async (friendName) => {
  await astroStore.removeFriendAction(friendName);
  showMessage(`${friendName} ha abandonado la tripulación.`, 'error');
  await astroStore.fetchUserStats();
};

const hasSentRequest = (username) => {
  return sentRequests.value.includes(username);
};

const sendRequest = async (friendName) => {
  if (isFriend(friendName)) return;
  const result = await astroStore.sendFriendRequest(friendName);
  if (result && result.success) {
    showMessage(t('friends.sent', { name: friendName }));
    sentRequests.value.push(friendName);
  } else {
    showMessage(result?.message || t('friends.errSendReq'), "error");
  }
};

const startChat = (friendObj) => {
  chatStore.openChat(friendObj);
};

const challengeFriend = async (friendName) => {
  if (challengeCooldowns.value[friendName]) return;

  showMessage(`Conectando con la flota para desafiar a ${friendName}...`, 'info');

  // Activar cooldown
  challengeCooldowns.value[friendName] = true;

  const success = await multiplayerStore.sendChallenge(friendName);

  if (success) {
    showMessage(`¡Desafío enviado a ${friendName}! Prepárate.`);
  } else {
    showMessage(`Error: No se pudo enviar el desafío a ${friendName}. Verifica tu conexión.`, 'error');
    // Si falla, podrías quitar el cooldown, pero mejor dejarlo un poco para evitar spam
  }

  // Desactivar cooldown tras 3 segundos
  setTimeout(() => {
    challengeCooldowns.value[friendName] = false;
  }, 3000);
};

const acceptRequest = async (requesterName) => {
  const result = await astroStore.acceptFriendRequest(requesterName);
  if (result?.success) {
    showMessage(`¡${requesterName} se ha unido a la tripulación!`);
    await astroStore.fetchUserStats();
  } else {
    showMessage(result?.message || t('friends.errAccept'), "error");
  }
};

const rejectRequest = async (requesterName) => {
  const result = await astroStore.rejectFriendRequest(requesterName);
  if (result?.success) {
    showMessage(`Has rechazado la solicitud de ${requesterName}`, 'warning');
  } else {
    showMessage(t('friends.errReject'), "error");
  }
};
</script>

<style scoped>
.friends-container {
  min-height: 100vh;
  background: radial-gradient(circle at top center, #0a192f 0%, #020617 100%);
}

.tracking-wide {
  letter-spacing: 0.2em;
}

.tracking-widest {
  letter-spacing: 0.4em;
}

.custom-tabs :deep(.v-tab) {
  letter-spacing: 2px;
  font-size: 0.9rem;
  opacity: 0.6;
}

.custom-tabs :deep(.v-tab--selected) {
  opacity: 1;
}

.custom-tabs :deep(.v-tabs-slider) {
  height: 3px !important;
  border-radius: 4px 4px 0 0;
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.8);
}

/* Card Styling */
.detailed-card {
  background: rgba(13, 25, 48, 0.5) !important;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  border-radius: 24px !important;
  overflow: hidden !important;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.detailed-card:hover {
  transform: translateY(-8px);
  background: rgba(13, 25, 48, 0.8) !important;
  border-color: rgba(0, 229, 255, 0.2) !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
}

.card-header-gradient {
  height: 80px;
  width: 100%;
}

/* Estilos de Rangos Dinámicos */
.rank-chip {
  text-transform: uppercase;
  letter-spacing: 1px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

/* Tier 1: Básico */
.rank-tier-1 {
  background: linear-gradient(135deg, #78909c, #455a64) !important;
  color: white !important;
}

/* Tier 2: Avanzado (Cyan) */
.rank-tier-2 {
  background: linear-gradient(135deg, #00acc1, #006064) !important;
  color: white !important;
  border: 1px solid rgba(0, 255, 255, 0.3) !important;
}

/* Tier 3: Superior (Púrpura) */
.rank-tier-3 {
  background: linear-gradient(135deg, #8e24aa, #4a148c) !important;
  color: white !important;
  border: 1px solid rgba(255, 0, 255, 0.4) !important;
  box-shadow: 0 0 10px rgba(142, 36, 170, 0.3);
}

/* Tier 4: Élite (Dorado/Naranja) */
.rank-tier-4 {
  background: linear-gradient(135deg, #ff9800, #e65100) !important;
  color: white !important;
  border: 2px solid rgba(255, 255, 0, 0.5) !important;
  box-shadow: 0 0 15px rgba(255, 152, 0, 0.4);
  font-weight: 900 !important;
}

/* Tier 5: Maestro (Carmesí/Oscuro) */
.rank-tier-5 {
  background: linear-gradient(135deg, #c62828, #1a237e) !important;
  color: white !important;
  border: 2px solid #ff1744 !important;
  box-shadow: 0 0 20px rgba(255, 23, 68, 0.5);
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}

/* Tier 6: Legendario (Cósmico animado) */
.rank-tier-6 {
  background: linear-gradient(270deg, #6200ea, #00b0ff, #d500f9) !important;
  background-size: 400% 400% !important;
  animation: cosmic-bg 10s ease infinite !important;
  color: white !important;
  border: 2px solid rgba(255, 255, 255, 0.6) !important;
  box-shadow: 0 0 25px rgba(213, 0, 249, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.3);
  font-weight: 900 !important;
}

@keyframes cosmic-bg {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

.rank-chip-mini {
  font-size: 0.65rem !important;
  height: 20px !important;
  padding: 0 8px !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 4px !important;
  max-width: 140px;
}

.rank-chip-mini :deep(.v-chip__content) {
  display: block !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.avatar-container {
  position: relative;
  display: inline-block;
}

.avatar-ring {
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-requests {
  background: #4caf50;
}

.main-avatar {
  border: 3px solid #0a192f;
}

.mascot-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  border: 2px solid #0a192f;
  background: #1e293b;
}

.name-title {
  letter-spacing: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.section-label-mini {
  font-size: 0.65rem;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.3);
  letter-spacing: 2px;
}

.achievements-showcase {
  display: flex;
  gap: 8px;
  background: rgba(0, 0, 0, 0.2);
  padding: 8px;
  border-radius: 12px;
  justify-content: space-around;
}

.mini-medal-slot {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.mini-medal-slot :deep(.medal-container) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.25) !important;
  pointer-events: none;
}

.action-btn {
  letter-spacing: 1px;
  font-size: 0.75rem;
}

/* Search Bar Customization */
.search-bar :deep(.v-field) {
  border-radius: 16px !important;
  border: 1px solid rgba(0, 242, 255, 0.1) !important;
}

/* Expediente (Profile Dialog) */
.expediente-card {
  background: linear-gradient(135deg, #0a192f 0%, #050a14 100%) !important;
  border: 1px solid rgba(0, 229, 255, 0.2);
  box-shadow: 0 0 50px rgba(0, 229, 255, 0.1);
}

.avatar-ring-large {
  padding: 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mascot-badge-large {
  position: absolute;
  bottom: 0;
  right: 0;
  border: 4px solid #0a192f;
  background: #1e293b;
}

.bg-black-semi {
  background: rgba(0, 0, 0, 0.4);
}

.border-right-dim {
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.achievement-display-slot {
  width: 90px;
  height: 90px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.achievement-display-slot :deep(.medal-container) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.45) !important;
}

.action-btn-glow {
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.3);
}

.lh-1 {
  line-height: 1;
}

.gap-2 {
  gap: 8px;
}

.gap-3 {
  gap: 12px;
}

.h-large {
  height: 48px !important;
}

.gap-4 {
  gap: 16px;
}

.gap-6 {
  gap: 24px;
}

/* Transitions */
.v-window-item-active {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Badge de mensajes no leídos */
.msg-badge :deep(.v-badge__badge) {
  font-size: 0.6rem !important;
  font-weight: 900 !important;
  min-width: 18px !important;
  height: 18px !important;
  padding: 0 4px !important;
  animation: badge-pulse 1.8s ease-in-out infinite;
  box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5);
}

@keyframes badge-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6);
  }

  60% {
    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}
</style>
