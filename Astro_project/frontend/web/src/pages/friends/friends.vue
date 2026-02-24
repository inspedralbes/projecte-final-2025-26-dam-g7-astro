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
      <v-col v-for="friend in filteredFriends" :key="friend.user" cols="12" xl="4" lg="6" md="12">
        <v-card class="friend-card rounded-xl pa-4" elevation="0">
          <div class="d-flex align-center">
            <v-avatar size="64" color="rgba(0, 229, 255, 0.1)" class="mr-4 border-avatar">
              <v-img v-if="friend.avatar" :src="friend.avatar" alt="Avatar"></v-img>
              <span v-else class="text-h5 text-cyan-accent-2 font-weight-bold">{{ friend.user.charAt(0).toUpperCase()
                }}</span>
            </v-avatar>

            <div class="flex-grow-1">
              <h2 class="text-h6 font-weight-bold text-white mb-1">{{ friend.user }}</h2>

              <div class="d-flex align-center flex-wrap gap-2">
                <v-chip size="small" color="cyan-accent-2" variant="tonal" class="font-weight-bold">
                  Nivel {{ friend.level || 1 }}
                </v-chip>

                <v-chip v-if="friend.mascot" size="small" color="amber-accent-3" variant="tonal"
                  class="font-weight-bold">
                  <v-icon start icon="mdi-paw" size="x-small"></v-icon>
                  {{ formatMascotName(friend.mascot) }}
                </v-chip>

                <v-chip v-if="isFriend(friend.user)" size="small" color="success" variant="flat"
                  class="font-weight-bold text-white">
                  Tripulación
                </v-chip>
              </div>
            </div>
          </div>

          <v-divider class="my-4 border-opacity-25" color="white"></v-divider>

          <v-card-actions class="pa-0">
            <template v-if="isFriend(friend.user)">
              <v-btn icon color="error" variant="tonal" class="rounded-lg mr-2" @click="removeFriend(friend.user)">
                <v-icon icon="mdi-trash-can-outline"></v-icon>
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn color="cyan-accent-2" variant="outlined" class="rounded-lg px-4 mr-2">
                <v-icon start icon="mdi-message-outline"></v-icon>
                Chatear
              </v-btn>
              <v-btn color="primary" variant="elevated" class="rounded-lg px-4">
                <v-icon start icon="mdi-sword-cross"></v-icon>
                Desafiar
              </v-btn>
            </template>

            <template v-else>
              <v-spacer></v-spacer>
              <v-btn color="success" variant="elevated" class="rounded-lg px-4" @click="addFriend(friend.user)">
                <v-icon start icon="mdi-account-plus"></v-icon>
                Reclutar
              </v-btn>
            </template>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <div v-else class="text-center py-10">
      <v-icon icon="mdi-account-search-outline" size="64" color="grey-lighten-1" class="mb-4"></v-icon>
      <h3 v-if="searchQuery" class="text-h6 text-grey-lighten-1">No encontramos exploradores con ese nombre.</h3>
      <h3 v-else class="text-h6 text-grey-lighten-1">Tu tripulación está vacía. ¡Busca nuevos reclutas!</h3>
    </div>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAstroStore } from '@/stores/astroStore';

const astroStore = useAstroStore();
// Traemos explorers (todos los usuarios) y friends (mis amigos) del store
const { explorers, friends } = storeToRefs(astroStore);

const loading = ref(true);
const searchQuery = ref('');

// --- DEFINICIÓN DEL SNACKBAR (Faltaba esto) ---
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});

// Función auxiliar para mostrar mensajes
const showMessage = (text, color = 'success') => {
  snackbar.value = {
    show: true,
    text: text,
    color: color
  };
};

// --- LÓGICA DE FILTRADO ---
const filteredFriends = computed(() => {
  const allUsers = Array.isArray(explorers.value) ? explorers.value : [];

  // Excluirse a uno mismo de la lista
  const allExceptMe = allUsers.filter(f => {
    return f.user && f.user.toLowerCase() !== (astroStore.user?.toLowerCase() || '');
  });

  // Si hay texto en el buscador, filtramos por nombre
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    return allExceptMe.filter(f => f.user.toLowerCase().includes(query));
  }

  // Si NO hay búsqueda, mostramos primero a mis amigos y luego al resto (o solo amigos si prefieres)
  // Aquí devolvemos TODOS para que puedas agregar gente nueva, ordenando amigos primero.
  return allExceptMe.sort((a, b) => {
    const aIsFriend = isFriend(a.user);
    const bIsFriend = isFriend(b.user);
    // Amigos primero
    return (aIsFriend === bIsFriend) ? 0 : aIsFriend ? -1 : 1;
  });
});

// Verifica si un usuario está en mi lista de amigos (usando el Store)
const isFriend = (username) => {
  if (!username) return false;
  // friends.value es un array de strings (nombres de usuario)
  return Array.isArray(friends.value) && friends.value.includes(username);
};

// Formatea el nombre de la mascota para evitar errores
const formatMascotName = (mascotData) => {
  if (typeof mascotData === 'object' && mascotData !== null) {
    return mascotData.name || 'Mascota';
  }
  return mascotData || 'Mascota';
};

// --- CARGA DE DATOS ---
const fetchFriends = async () => {
  loading.value = true;
  try {
    // Carga todos los usuarios
    await astroStore.fetchAllUsers();
    // Carga mis estadísticas (donde viene mi lista de amigos)
    await astroStore.fetchUserStats();
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

// --- ACCIONES (Añadir / Eliminar) ---
const removeFriend = async (friendName) => {
  // Llamada al backend a través del Store
  const result = await astroStore.removeFriendAction(friendName);
  
  // Como removeFriendAction en el store (paso anterior) no retornaba nada explícito en éxito
  // asumimos éxito si no hay error, o ajustamos el store. 
  // Pero para feedback visual rápido:
  showMessage(`${friendName} ha abandonado la tripulación.`, 'warning');
  
  // Refrescamos stats para asegurar consistencia
  await astroStore.fetchUserStats(); 
};

const addFriend = async (friendName) => {
  if (isFriend(friendName)) return;

  const result = await astroStore.addFriendAction(friendName);
  
  if (result && result.success) {
    showMessage(`¡${friendName} reclutado con éxito!`);
  } else {
    showMessage(result?.message || "Error al añadir recluta", "error");
  }
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
