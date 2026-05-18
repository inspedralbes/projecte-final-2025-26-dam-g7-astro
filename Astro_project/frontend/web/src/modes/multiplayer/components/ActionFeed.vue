<template>
  <div class="action-feed-container pa-4 rounded-xl border-light">
    <div class="text-overline text-grey-lighten-1 mb-2 d-flex align-center">
      <v-icon size="14" class="mr-1">mdi-message-text-clock</v-icon>
      FEED DE ACCIONES
    </div>
    <div ref="feedList" class="feed-list">
      <transition-group name="list">
        <div v-for="item in feed" :key="item.id" class="feed-item mb-2 pa-2 rounded-lg" :class="item.type">
          <span class="timestamp mr-2">{{ item.time }}</span>
          <span class="message">{{ item.message }}</span>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useMultiplayerStore } from '@/modes/multiplayer/store/multiplayerStore'

const multiplayerStore = useMultiplayerStore()
const feed = ref([])
const feedList = ref(null)

let idCounter = 0

watch(() => multiplayerStore.lastMessage, (msg) => {
  if (msg && msg.type === 'ACTION_FEED_UPDATE') {
    const now = new Date()
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
    
    let msgType = 'hero-msg'
    if (msg.message.includes('JEFE') || msg.message.includes('Jefe')) msgType = 'boss-msg'
    if (msg.message.includes('caído') || msg.message.includes('ELIMINADO')) msgType = 'eliminated-msg'

    feed.value.unshift({
      id: idCounter++,
      time: timeStr,
      message: msg.message,
      type: msgType
    })

    // Mantener solo los últimos 10
    if (feed.value.length > 10) {
      feed.value.pop()
    }
  }

  if (msg && msg.type === 'HERO_ELIMINATED') {
    const now = new Date()
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
    
    feed.value.unshift({
      id: idCounter++,
      time: timeStr,
      message: `💔 ¡EL HÉROE ${msg.user} HA CAÍDO EN COMBATE!`,
      type: 'eliminated-msg'
    })
  }
})
</script>

<style scoped>
.action-feed-container {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(0, 229, 255, 0.2);
  height: 200px;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
}

.feed-list {
  flex-grow: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.feed-item {
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  border-left: 3px solid #00e5ff;
}

.boss-msg {
  border-left-color: #ff1744;
  background: rgba(255, 23, 68, 0.1);
}

.hero-msg {
  border-left-color: #00e5ff;
  background: rgba(0, 229, 255, 0.1);
}

.eliminated-msg {
  border-left-color: #ff5252;
  background: rgba(255, 82, 82, 0.2);
  font-weight: bold;
}

.timestamp {
  color: #00e5ff;
  font-family: monospace;
  font-weight: bold;
}

.message {
  color: #fff;
}

.list-enter-active, .list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>

