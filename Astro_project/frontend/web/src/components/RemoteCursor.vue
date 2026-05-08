<template>
  <div
    class="remote-cursor-wrapper"
    :style="{ transform: `translate(${x}px, ${y}px)` }"
  >
    <div class="remote-cursor-content">
      <svg
        fill="none"
        height="30"
        viewBox="0 0 28 30"
        width="28"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2.5 2.5L10.5 27.5L13.5 17.5L23.5 14.5L2.5 2.5Z"
          :fill="color"
          stroke="#0F172A"
          stroke-linejoin="round"
          stroke-width="2"
        />
      </svg>
      <div class="cursor-label" :style="{ backgroundColor: color }">
        {{ username.substring(0, 5) }}
      </div>
    </div>
  </div>
</template>

<script setup>
  defineProps({
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    username: { type: String, default: 'Companion' },
    color: { type: String, default: '#ff4444' },
  })
</script>

<style scoped>
.remote-cursor-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 9999;
  will-change: transform;
}

.remote-cursor-content {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: flex-start;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
}

.cursor-label {
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 12px;
  margin-left: 4px;
  white-space: nowrap;
}
</style>
