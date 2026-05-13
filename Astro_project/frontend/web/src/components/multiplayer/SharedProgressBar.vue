<template>
  <div class="race-progress-container">
    <div class="race-track">
      <!-- Barra de conexión -->
      <div class="track-line" />
      <div class="track-line-fill" :style="{ width: localProgress + '%' }" />

      <!-- Avatar Local -->
      <div 
        class="player-icon local-player" 
        :style="{ left: localProgress + '%' }"
      >
        <v-avatar size="36" class="avatar-glow-local">
          <v-img :src="localAvatar" />
        </v-avatar>
        <div class="player-label">{{ localName }}</div>
      </div>

      <!-- Avatar Partner -->
      <div 
        class="player-icon partner-player" 
        :style="{ left: partnerProgress + '%' }"
      >
        <v-avatar size="32" class="avatar-glow-partner">
          <v-img :src="partnerAvatar" />
        </v-avatar>
        <div class="player-label">{{ partnerName }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
  const props = defineProps({
    localProgress: {
      type: Number,
      default: 0,
    },
    partnerProgress: {
      type: Number,
      default: 0,
    },
    localAvatar: String,
    partnerAvatar: String,
    localName: String,
    partnerName: String,
  })
</script>

<style scoped>
.race-progress-container {
  width: 100%;
  padding: 40px 60px 20px;
  background: transparent;
  border-radius: 20px;
}

.race-track {
  height: 4px;
  position: relative;
  width: 100%;
}

.track-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
}

.track-line-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #00e5ff, #00b0ff);
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.game-milestone {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.milestone-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid #0f172a;
  z-index: 2;
  transition: all 0.3s ease;
}

.milestone-dot.completed {
  background: #00e5ff;
  box-shadow: 0 0 10px #00e5ff;
  transform: scale(1.2);
}

.milestone-label {
  margin-top: 10px;
  font-size: 8px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 900;
  letter-spacing: 1px;
}

.player-icon {
  position: absolute;
  top: 0;
  transform: translate(-50%, -100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: -10px;
  transition: left 1s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
}

.avatar-glow-local {
  border: 2px solid #00e5ff;
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.5);
}

.avatar-glow-partner {
  border: 2px solid #ff5252;
  box-shadow: 0 0 15px rgba(255, 82, 82, 0.5);
}

.player-label {
  font-size: 9px;
  font-weight: 900;
  color: #fff;
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 6px;
  border-radius: 10px;
  margin-top: 4px;
}

.partner-player {
  z-index: 9;
  margin-top: 25px; /* Separar un poco los iconos */
}

.partner-player .player-label {
  color: #ff5252;
}
</style>
