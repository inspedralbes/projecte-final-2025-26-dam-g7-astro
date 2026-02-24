<template>
  <v-container fluid class="friends-container py-8 px-6">
    <div class="mb-10">
      <div class="d-flex align-center justify-center mb-6">
        <v-icon icon="mdi-account-group" size="x-large" color="cyan-accent-2" class="mr-4"></v-icon>
        <h1 class="text-h4 font-weight-bold text-white tracking-wide">Amigos</h1>
      </div>

      <v-text-field v-model="searchQuery" label="Buscar exploradores..." prepend-inner-icon="mdi-magnify" variant="solo"
        bg-color="rgba(255, 255, 255, 0.05)" class="search-bar w-100" hide-details rounded="xl"
        clearable></v-text-field>
    </div>

    <div v-if="loading" class="d-flex justify-center align-center py-10">
      <v-progress-circular indeterminate color="cyan-accent-2" size="64"></v-progress-circular>
    </div>

    <v-row v-else-if="filteredFriends.length > 0">
      <v-col v-for="friend in filteredFriends" :key="friend.name" cols="12" xl="4" lg="6" md="12">
        <v-card class="friend-card rounded-xl pa-4" elevation="0">
          <div class="d-flex align-center">
            <v-avatar size="64" color="rgba(0, 229, 255, 0.1)" class="mr-4 border-avatar">
              <v-icon icon="mdi-account" color="cyan-accent-2" size="large"></v-icon>
            </v-avatar>
            <div class="flex-grow-1">
              <h2 class="text-h6 font-weight-bold text-white mb-1">{{ friend.name }}</h2>
              <div class="d-flex align-center flex-wrap gap-2">
                <v-chip size="small" color="cyan-accent-2" variant="tonal" class="font-weight-bold">
                  Nivel {{ friend.level }}
                </v-chip>
                <v-chip v-if="friend.pet" size="small" color="amber-accent-3" variant="tonal" class="font-weight-bold">
                  <v-icon start :icon="friend.pet.icon" size="x-small"></v-icon>
                  {{ friend.pet.name }}
                </v-chip>
                <v-chip v-if="isFriend(friend.name)" size="small" color="success" variant="flat"
                  class="font-weight-bold text-white">
                  Amigo
                </v-chip>
              </div>
            </div>
          </div>

          <v-divider class="my-4 border-opacity-25" color="white"></v-divider>

          <v-card-actions class="pa-0">
            <template v-if="isFriend(friend.name)">
              <v-btn icon color="error" variant="tonal" class="rounded-lg mr-2" @click="removeFriend(friend)">
                <v-icon icon="mdi-trash-can-outline"></v-icon>
                <v-tooltip activator="parent" location="top">Eliminar amigo</v-tooltip>
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn color="cyan-accent-2" variant="outlined" class="rounded-lg px-4 mr-2"
                @click="chatWithFriend(friend)">
                <v-icon start icon="mdi-message-outline"></v-icon>
                Chatear
              </v-btn>
              <v-btn color="primary" variant="elevated" class="rounded-lg px-4" @click="inviteToChallenge(friend)">
                <v-icon start icon="mdi-sword-cross"></v-icon>
                Desafiar
              </v-btn>
            </template>
            <template v-else>
              <v-spacer></v-spacer>
              <v-btn color="success" variant="elevated" class="rounded-lg px-4" @click="addFriend(friend)">
                <v-icon start icon="mdi-account-plus"></v-icon>
                Añadir Amigo
              </v-btn>
            </template>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <div v-else class="text-center py-10">
      <v-icon icon="mdi-account-search-outline" size="64" color="grey-lighten-1" class="mb-4"></v-icon>
      <h3 v-if="searchQuery" class="text-h6 text-grey-lighten-1">No se encontró ningún explorador con ese nombre.</h3>
      <h3 v-else class="text-h6 text-grey-lighten-1">Aún no tienes amigos en tu lista de tripulación.</h3>
    </div>

    <!-- Simple feedback snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAstroStore } from '@/stores/astroStore';

const astroStore = useAstroStore();
const friends = ref([]);
const loading = ref(true);
const searchQuery = ref('');

// Lista "mock" de amigos para esta fase de desarrollo
const myFriendNames = ref(['kim']);

const filteredFriends = computed(() => {
  // Filtrar al usuario actual para que no aparezca en su propia búsqueda
  const allExceptMe = friends.value.filter(f => f.name.toLowerCase() !== (astroStore.user?.toLowerCase() || ''));

  if (!searchQuery.value) {
    // Si no hay búsqueda, mostramos solo a nuestros amigos (excluyéndome)
    return allExceptMe.filter(f => myFriendNames.value.includes(f.name.toLowerCase()));
  }
  // Si hay búsqueda, buscamos en toda la base de datos (excluyéndome)
  const query = searchQuery.value.toLowerCase();
  return allExceptMe.filter(f => f.name.toLowerCase().includes(query));
});

const isFriend = (name) => {
  return myFriendNames.value.includes(name.toLowerCase());
};

const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});

const showMessage = (text, color = 'success') => {
  snackbar.value.text = text;
  snackbar.value.color = color;
  snackbar.value.show = true;
};

const fetchFriends = async () => {
  loading.value = true;
  try {
    const data = await astroStore.fetchAllUsers();
    // Mostramos todos los usuarios como pidió el usuario
    friends.value = data || [];
    if (friends.value.length === 0) {
      console.warn("No se encontraron usuarios en la base de datos.");
    }
  } catch (error) {
    console.error("Error al cargar amigos:", error);
    showMessage("No se pudieron cargar los usuarios", "error");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchFriends();
});

const removeFriend = (friend) => {
  myFriendNames.value = myFriendNames.value.filter(name => name !== friend.name.toLowerCase());
  showMessage(`${friend.name} ha sido eliminado de tu lista de amigos.`, 'error');
};

const addFriend = (friend) => {
  if (!myFriendNames.value.includes(friend.name.toLowerCase())) {
    myFriendNames.value.push(friend.name.toLowerCase());
    showMessage(`${friend.name} se ha añadido a tu lista de amigos.`, 'success');
  }
};

const chatWithFriend = (friend) => {
  showMessage(`Abriendo chat con ${friend.name}...`);
};

const inviteToChallenge = (friend) => {
  showMessage(`Invitación a desafío enviada a ${friend.name}!`);
};
</script>

<style scoped>
.friends-container {
  min-height: 100%;
}

.tracking-wide {
  letter-spacing: 0.1em;
}

.max-width-300 {
  max-width: 300px;
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
</style>
