<template>
  <v-container fluid class="pa-0 main-scroll-container">
    <!-- Navbar -->
    <v-app-bar flat color="transparent" class="px-6">
      <v-spacer></v-spacer>
      <v-btn variant="text" to="/login" class="text-white mx-2">
        Iniciar sesión
      </v-btn>
      <v-btn variant="outlined" to="/register" color="primary" class="mx-2">
        Registrarse
      </v-btn>
    </v-app-bar>

    <!-- Hero Section -->
    <section class="hero-section d-flex align-center justify-center text-center px-4">
      <div class="content-wrapper">
        <h1 class="text-h2 font-weight-bold mb-4 primary-gradient-text">
          PROYECTO ASTRO
        </h1>
        <p class="text-h5 mb-6 text-grey-lighten-1 mx-auto" style="max-width: 800px;">
          Plataforma de entrenamiento visual y neurocognitivo de alto rendimiento.
          Agilidad lectora y decodificación sin límites.
        </p>
        <v-btn size="x-large" color="primary" variant="elevated" class="start-button px-10 mt-4" to="/singleplayer">
          INICIAR MISIÓN
          <v-icon end icon="mdi-rocket-launch-outline" class="ms-2"></v-icon>
        </v-btn>
      </div>
    </section>
  </v-container>
</template>


<style scoped>
.main-scroll-container {
  background: #000000;
  min-height: 100vh;
}

.hero-section {
  min-height: 90vh;
  position: relative;
  overflow: hidden;
}

.primary-gradient-text {
  background: linear-gradient(45deg, #00f2ff, #7000ff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.start-button {
  border-radius: 4px;
  font-weight: bold;
  letter-spacing: 2px;
  transition: all 0.4s ease;
}

.start-button:hover {
  filter: brightness(1.2);
  box-shadow: 0 0 20px rgba(0, 242, 255, 0.4) !important;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-section .content-wrapper {
  animation: fadeIn 1.5s ease-out;
}
</style>
