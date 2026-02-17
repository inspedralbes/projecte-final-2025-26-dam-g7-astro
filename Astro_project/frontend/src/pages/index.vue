<template>
  <v-container class="fill-height d-flex align-center justify-center text-center">
    <div class="hero-section">
      <h1 class="text-h2 font-weight-bold mb-4 primary-gradient-text">
        BIENVENIDO A ASTRO
      </h1>
      <p class="text-h5 mb-10 text-grey-lighten-1 mx-auto" style="max-width: 700px;">
        Embárcate en una experiencia espacial única donde la exploración y la gestión se encuentran.
        Prepárate para liderar tu propia misión interestelar.
      </p>

      <v-btn size="x-large" color="primary" variant="elevated" class="start-button px-10" to="/menu" elevation="10">
        INICIAR MISIÓN
        <v-icon end icon="mdi-rocket-launch-outline" class="ms-2"></v-icon>
      </v-btn>
    </div>
  </v-container>
</template>

<script setup>
// No redirection logic needed here anymore as this is our landing page
</script>

<style scoped>
.hero-section {
  animation: fadeIn 1.2s ease-out;
}

.primary-gradient-text {
  background: linear-gradient(45deg, #00f2ff, #7000ff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 2px;
}

.start-button {
  border-radius: 30px;
  font-weight: bold;
  letter-spacing: 1px;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.start-button:hover {
  transform: scale(1.1) translateY(-5px);
  box-shadow: 0 0 25px rgba(0, 242, 255, 0.5) !important;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
