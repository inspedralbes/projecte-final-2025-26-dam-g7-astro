<template>
  <v-container fluid class="pa-0 main-container">
    <!-- Navbar (Simplified & Professional) -->
    <v-app-bar flat color="transparent" class="px-8 mt-4">
        <div class="d-flex align-center">
            <h2 class="text-h4 font-weight-black text-white tracking-tighter">ASTRO</h2>
        </div>
      <v-spacer></v-spacer>
      <v-btn variant="text" to="/login" class="text-white mx-2 font-weight-bold">
        LOGIN
      </v-btn>
      <v-btn variant="flat" to="/register" color="primary" class="mx-2 px-6 rounded-pill font-weight-black">
        UNIRSE
      </v-btn>
    </v-app-bar>

    <!-- Hero Section -->
    <section class="hero-section d-flex align-center justify-center text-center">
      <!-- Background Elements for Depth -->
      <div class="background-glow"></div>
      
      <div class="content-wrapper px-4">
        <div class="system-status mb-6">
            <span class="pulse-dot"></span>
            SYSTEM ONLINE: NEURAL TRAINING INTERFACE
        </div>
        
        <h1 class="hero-title mb-4">
          PROYECTO <span class="primary-gradient-text">ASTRO</span>
        </h1>
        
        <p class="hero-subtitle mb-10 mx-auto">
          Plataforma de entrenamiento neurocognitivo de alto rendimiento.<br>
          Optimiza tu capacidad de procesamiento visual y agilidad mental.
        </p>

        <div class="d-flex flex-column flex-sm-row justify-center align-center gap-4">
            <v-btn size="x-large" color="primary" variant="flat" class="action-button px-12 py-6 rounded-lg"
              :to="isLoggedIn ? '/singleplayer' : '/register'">
              {{ isLoggedIn ? 'CONTINUAR MISIÓN' : 'INICIAR ENTRENAMIENTO' }}
              <v-icon end icon="mdi-chevron-right" class="ms-2"></v-icon>
            </v-btn>
            
            <v-btn size="x-large" variant="outlined" color="white" class="action-button px-12 py-6 rounded-lg ml-sm-4 mt-4 mt-sm-0">
                SABER MÁS
            </v-btn>
        </div>
      </div>
    </section>

    <!-- Visual Footer Decoration -->
    <div class="footer-decoration">
        <div class="line"></div>
        <div class="status-codes d-flex justify-space-between px-10">
            <span>TX_READY: 0x44FF2</span>
            <span>OS_ASTRO_KERNEL: LOADED</span>
            <span>NEURAL_LINK: ACTIVE</span>
        </div>
    </div>
  </v-container>
</template>

<script setup>
import { computed } from 'vue';

const isLoggedIn = computed(() => {
  return !!localStorage.getItem('user-session');
});
</script>

<style scoped>
.main-container {
  background: #05050a;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.hero-section {
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

.background-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle at center, rgba(112, 0, 255, 0.15) 0%, transparent 70%);
  pointer-events: none;
  z-index: -1;
}

.system-status {
    font-family: 'Rajdhani', sans-serif;
    font-size: 0.8rem;
    letter-spacing: 3px;
    color: #00f2ff;
    font-weight: 700;
    display: flex;
    align-center: center;
    justify-content: center;
    gap: 10px;
}

.pulse-dot {
    width: 8px;
    height: 8px;
    background: #00f2ff;
    border-radius: 50%;
    box-shadow: 0 0 10px #00f2ff;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 0.4; }
    50% { opacity: 1; }
    100% { opacity: 0.4; }
}

.hero-title {
  font-size: clamp(3rem, 10vw, 6rem);
  font-weight: 900;
  line-height: 1;
  text-transform: uppercase;
  color: white;
}

.primary-gradient-text {
  background: linear-gradient(to right, #00f2ff, #7000ff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 15px rgba(0, 242, 255, 0.3));
}

.hero-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.6);
  max-width: 700px;
  line-height: 1.6;
  font-family: 'Inter', sans-serif;
  text-transform: none;
  letter-spacing: 0;
}

.action-button {
    font-family: 'Rajdhani', sans-serif;
    font-weight: 800;
    letter-spacing: 2px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0, 242, 255, 0.2);
}

.footer-decoration {
    position: absolute;
    bottom: 30px;
    width: 100%;
}

.footer-decoration .line {
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1), transparent);
    margin-bottom: 15px;
}

.status-codes {
    font-family: 'monospace';
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.2);
    letter-spacing: 2px;
}

.tracking-tighter {
    letter-spacing: -2px;
}
</style>