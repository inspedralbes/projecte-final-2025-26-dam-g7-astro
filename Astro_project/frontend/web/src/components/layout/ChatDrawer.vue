<template>
  <!-- Overlay oscuro al abrir el chat en móvil -->
  <Teleport to="body">
    <Transition name="chat-overlay">
      <div v-if="chatStore.isOpen" class="chat-overlay" @click="chatStore.closeChat()" />
    </Transition>

    <!-- Panel del Chat -->
    <Transition name="chat-drawer">
      <div v-if="chatStore.isOpen" :aria-label="$t('chat.title')" class="chat-drawer" role="dialog">

        <!-- ── HEADER ──────────────────────────────────────── -->
        <div class="chat-header">
          <div class="chat-header-left">
            <div class="friend-avatar-wrap">
              <v-avatar class="friend-avatar" color="#0a192f" size="40">
                <v-img
                  v-if="activeFriend?.avatar"
                  cover
                  :src="getAvatarUrl(activeFriend.avatar)"
                />
                <span v-else class="avatar-initial">
                  {{ activeFriend?.user?.charAt(0).toUpperCase() }}
                </span>
              </v-avatar>
              <span class="online-dot" :title="$t('chat.online')" />
            </div>
            <div class="friend-info">
              <div class="friend-name">{{ activeFriend?.user }}</div>
              <div class="friend-status">{{ $t('chat.privateChannel') }}</div>
            </div>
          </div>

          <button class="close-btn" :title="$t('chat.close')" @click="chatStore.closeChat()">
            <v-icon icon="mdi-close" size="20" />
          </button>
        </div>

        <!-- ── MENSAJES ───────────────────────────────────── -->
        <div ref="messagesContainer" class="chat-messages">
          <!-- Estado vacío -->
          <div v-if="chatStore.activeMessages.length === 0" class="chat-empty">
            <v-icon color="rgba(0,229,255,0.3)" icon="mdi-satellite-variant" size="48" />
            <p class="chat-empty-text">{{ $t('chat.emptyTitle') }}<br>{{ $t('chat.emptySubtitle') }}</p>
          </div>

          <!-- Burbujas de mensajes -->
          <template v-else>
            <div
              v-for="(msg, index) in chatStore.activeMessages"
              :key="index"
              class="msg-row"
              :class="{ 'msg-row--mine': msg.from === myUser }"
            >
              <!-- Avatar del amigo (solo en mensajes del amigo) -->
              <v-avatar
                v-if="msg.from !== myUser"
                class="msg-avatar"
                color="#0a192f"
                size="28"
              >
                <v-img
                  v-if="activeFriend?.avatar"
                  cover
                  :src="getAvatarUrl(activeFriend.avatar)"
                />
                <span v-else class="msg-avatar-initial">
                  {{ activeFriend?.user?.charAt(0).toUpperCase() }}
                </span>
              </v-avatar>

              <div class="msg-bubble-wrap">
                <!-- Mensaje de Desafío Especial -->
                <div v-if="msg.msgType === 'challenge'" class="challenge-msg-card">
                  <div class="challenge-msg-header">
                    <v-icon class="mr-2" color="cyan-accent-2" icon="mdi-sword-cross" size="18" />
                    <span>{{ $t('chat.duelTitle') }}</span>
                  </div>
                  <div class="challenge-msg-body">
                    {{ msg.content }}
                  </div>
                  <div v-if="msg.from !== myUser" class="challenge-msg-actions">
                    <template v-if="isLastChallenge(index) && msg.status === 'pending'">
                      <button class="chat-challenge-btn chat-challenge-btn--accept" @click="respondToChallenge(msg.from, true)">
                        <v-icon class="mr-1" icon="mdi-check" size="14" />
                        {{ $t('chat.accept') }}
                      </button>
                      <button class="chat-challenge-btn chat-challenge-btn--decline" @click="respondToChallenge(msg.from, false)">
                        <v-icon class="mr-1" icon="mdi-close" size="14" />
                        {{ $t('chat.decline') }}
                      </button>
                    </template>
                    <div v-else-if="msg.status === 'accepted'" class="challenge-msg-result challenge-msg-result--accepted">
                      <v-icon class="mr-1" icon="mdi-check-circle" size="14" />
                      {{ $t('chat.duelAccepted') }}
                    </div>
                    <div v-else-if="msg.status === 'rejected'" class="challenge-msg-result challenge-msg-result--rejected">
                      <v-icon class="mr-1" icon="mdi-close-circle" size="14" />
                      {{ $t('chat.duelRejected') }}
                    </div>
                    <div v-else class="challenge-msg-expired">
                      <v-icon class="mr-1" icon="mdi-history" size="14" />
                      {{ $t('chat.duelExpired') }}
                    </div>
                  </div>
                  <div v-else class="challenge-msg-status">
                    <span v-if="msg.status === 'accepted'" class="status-accepted">{{ $t('chat.duelAccepted') }}</span>
                    <span v-else-if="msg.status === 'rejected'" class="status-rejected">{{ $t('chat.duelRejected') }}</span>
                    <span v-else-if="msg.status === 'expired'" class="expired-text">{{ $t('chat.duelExpired') }}</span>
                    <span v-else-if="isLastChallenge(index)">Invitación enviada...</span>
                    <span v-else class="expired-text">{{ $t('chat.duelExpired') }}</span>
                  </div>
                </div>

                 <!-- Mensaje de Resultado de Desafío -->
                <div v-else-if="msg.msgType === 'challenge-result'" class="challenge-result-msg-card" :class="{ 'challenge-result-msg-card--accepted': msg.content.includes('aceptado'), 'challenge-result-msg-card--rejected': msg.content.includes('rechazado') }">
                  <div class="challenge-result-header">
                    <v-icon class="mr-2" :color="msg.content.includes('aceptado') ? 'success' : 'error'" :icon="msg.content.includes('aceptado') ? 'mdi-sword-cross' : 'mdi-close-circle'" size="16" />
                    <span>{{ msg.content.includes('aceptado') ? 'DESAFÍO ACEPTADO' : 'DESAFÍO RECHAZADO' }}</span>
                  </div>
                  <div class="challenge-result-body">
                    {{ msg.content }}
                  </div>
                </div>

                <!-- Mensaje de Texto Normal -->
                <div
                  v-else
                  class="msg-bubble"
                  :class="msg.from === myUser ? 'msg-bubble--mine' : 'msg-bubble--theirs'"
                >
                  {{ msg.content }}
                </div>
                <div class="msg-time">{{ formatTime(msg.at) }}</div>
              </div>
            </div>
          </template>

          <!-- Indicador de escritura (placeholder) -->
          <div v-if="isTyping" class="msg-row">
            <div class="typing-indicator">
              <span /><span /><span />
            </div>
          </div>
        </div>

        <!-- ── INPUT ─────────────────────────────────────── -->
        <div class="chat-input-area">
          <div class="chat-input-wrap">
            <textarea
              ref="inputRef"
              v-model="inputText"
              class="chat-input"
              :placeholder="$t('chat.placeholder')"
              rows="1"
              @input="autoResize"
              @keydown.enter.exact.prevent="sendMessage"
            />
            <button
              class="send-btn"
              :class="{ 'send-btn--active': inputText.trim() }"
              :disabled="!inputText.trim()"
              :title="$t('chat.send')"
              @click="sendMessage"
            >
              <v-icon icon="mdi-send" size="18" />
            </button>
          </div>
          <div class="input-hint">{{ $t('chat.hint') }}</div>
        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
  import { computed, nextTick, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useChatStore } from '@/stores/chatStore'
  import { useMultiplayerStore } from '@/stores/multiplayerStore'
  import { useSessionStore } from '@/stores/sessionStore'

  const { t, locale } = useI18n()
  const chatStore = useChatStore()
  const sessionStore = useSessionStore()
  const multiplayerStore = useMultiplayerStore()

  const myUser = computed(() => sessionStore.user)
  const activeFriend = computed(() => chatStore.activeFriend)

  const inputText = ref('')
  const messagesContainer = ref(null)
  const inputRef = ref(null)
  const isTyping = ref(false)

  function respondToChallenge (from, accepted) {
    multiplayerStore.respondToChallenge(from, accepted)
  }

  function isLastChallenge (index) {
    const messages = chatStore.activeMessages
    for (let i = messages.length - 1; i > index; i--) {
      if (messages[i].msgType === 'challenge') return false
    }
    return true
  }

  /* ── Helpers ─────────────────────────────────────────────── */

  function getAvatarUrl (avatarStr) {
    if (!avatarStr) return ''
    return avatarStr.startsWith('/') ? avatarStr : `/${avatarStr}`
  }

  function formatTime (isoString) {
    if (!isoString) return ''
    const date = new Date(isoString)
    const localeStr = locale.value === 'en' ? 'en-US' : (locale.value === 'ca' ? 'ca-ES' : 'es-ES')
    return date.toLocaleTimeString(localeStr, { hour: '2-digit', minute: '2-digit' })
  }

  function autoResize () {
    const el = inputRef.value
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  /* ── Enviar mensaje ───────────────────────────────────────── */

  function sendMessage () {
    const text = inputText.value.trim()
    if (!text) return
    chatStore.sendMessage(text)
    inputText.value = ''
    nextTick(() => {
      if (inputRef.value) {
        inputRef.value.style.height = 'auto'
        inputRef.value.focus()
      }
    })
  }

  /* ── Auto-scroll al último mensaje ───────────────────────── */

  function scrollToBottom (smooth = true) {
    nextTick(() => {
      const el = messagesContainer.value
      if (!el) return
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'instant' })
    })
  }

  // Scroll cuando llegan mensajes nuevos
  watch(
    () => chatStore.activeMessages.length,
    (newLen, oldLen) => {
      if (newLen !== oldLen) scrollToBottom(newLen > oldLen)
    },
  )

  // Scroll inmediato al abrir el chat
  watch(
    () => chatStore.isOpen,
    open => {
      if (open) {
        scrollToBottom(false)
        nextTick(() => inputRef.value?.focus())
      }
    },
  )

  // Scroll al recibir historial
  watch(
    () => chatStore.activeMessages,
    () => scrollToBottom(false),
    { deep: false },
  )
</script>

<style scoped>
.chat-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  z-index: 1200;
  pointer-events: auto;
}

.chat-drawer {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 380px;
  max-width: 100vw;
  z-index: 1201;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #0a1628 0%, #050b18 100%);
  border-left: 1px solid rgba(0, 229, 255, 0.15);
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.8), -2px 0 0 rgba(0, 229, 255, 0.05);
  backdrop-filter: blur(20px);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.chat-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.friend-avatar-wrap {
  position: relative;
}

.friend-avatar {
  border: 2px solid rgba(0, 229, 255, 0.4);
}

.online-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background: #4caf50;
  border-radius: 50%;
  border: 2px solid #0a1628;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
  50%       { box-shadow: 0 0 0 5px rgba(76, 175, 80, 0); }
}

.avatar-initial,
.msg-avatar-initial {
  font-size: 1rem;
  font-weight: 700;
  color: #00e5ff;
}

.friend-info {
  display: flex;
  flex-direction: column;
}

.friend-name {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: #ffffff;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.friend-status {
  font-size: 0.65rem;
  color: rgba(0, 229, 255, 0.6);
  letter-spacing: 0.5px;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}

.close-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scroll-behavior: smooth;
}

.chat-messages::-webkit-scrollbar { width: 4px; }
.chat-messages::-webkit-scrollbar-track { background: transparent; }
.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(0, 229, 255, 0.15);
  border-radius: 10px;
}

.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  opacity: 0.6;
  margin: auto;
  text-align: center;
}

.chat-empty-text {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.6;
  font-family: 'Rajdhani', sans-serif;
  letter-spacing: 1px;
}

.msg-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  animation: msgIn 0.25s ease-out;
}

.msg-row--mine {
  flex-direction: row-reverse;
}

@keyframes msgIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.msg-avatar {
  flex-shrink: 0;
  border: 1px solid rgba(0, 229, 255, 0.2);
}

.msg-bubble-wrap {
  display: flex;
  flex-direction: column;
  max-width: 72%;
  gap: 3px;
}

.msg-row--mine .msg-bubble-wrap {
  align-items: flex-end;
}

.msg-bubble {
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 0.9rem;
  line-height: 1.4;
  word-break: break-word;
  white-space: pre-wrap;
}

.msg-bubble--mine {
  background: linear-gradient(135deg, #00acc1, #0097a7);
  color: #ffffff;
  border-bottom-right-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 172, 193, 0.3);
}

.msg-bubble--theirs {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  border-bottom-left-radius: 4px;
}

.msg-time {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.25);
  letter-spacing: 0.5px;
  padding: 0 4px;
}

.challenge-msg-card {
  background: rgba(0, 229, 255, 0.05);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 12px;
  padding: 12px;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.challenge-msg-header {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 800;
  font-size: 0.7rem;
  color: #00e5ff;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
}

.challenge-msg-body {
  font-size: 0.85rem;
  color: white;
  font-weight: 500;
}

.challenge-msg-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.chat-challenge-btn {
  flex: 1;
  height: 32px;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 0.65rem;
  letter-spacing: 0.5px;
}

.chat-challenge-btn--accept {
  background: #4caf50;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.chat-challenge-btn--accept:hover {
  background: #66bb6a;
  transform: translateY(-1px);
}

.chat-challenge-btn--decline {
  background: #f44336;
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
}

.chat-challenge-btn--decline:hover {
  background: #ef5350;
  transform: translateY(-1px);
}

.challenge-msg-status {
  font-size: 0.7rem;
  color: rgba(0, 229, 255, 0.5);
  font-style: italic;
  text-align: right;
}

.challenge-msg-expired {
  flex: 1;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.3);
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 0.65rem;
  letter-spacing: 1px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.challenge-msg-result {
  flex: 1;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 800;
  font-size: 0.7rem;
  letter-spacing: 1px;
  border-radius: 6px;
  text-transform: uppercase;
}

.challenge-msg-result--accepted {
  background: rgba(76, 175, 80, 0.15);
  color: #4caf50;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.challenge-msg-result--rejected {
  background: rgba(244, 67, 54, 0.15);
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.status-accepted { color: #4caf50; font-weight: bold; }
.status-rejected { color: #f44336; font-weight: bold; }

.expired-text {
  color: rgba(255, 255, 255, 0.2);
  text-decoration: line-through;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 18px;
  border-bottom-left-radius: 4px;
  width: fit-content;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  background: rgba(0, 229, 255, 0.5);
  border-radius: 50%;
  animation: typing-bounce 1.2s infinite;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30%           { transform: translateY(-6px); opacity: 1; }
}

.chat-input-area {
  padding: 12px 16px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.chat-input-wrap {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 10px 12px;
  transition: border-color 0.2s;
}

.chat-input-wrap:focus-within {
  border-color: rgba(0, 229, 255, 0.35);
  box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.06);
}

.chat-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: #ffffff;
  font-size: 0.9rem;
  line-height: 1.4;
  resize: none;
  max-height: 120px;
  overflow-y: auto;
  font-family: 'Inter', sans-serif;
}

.chat-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
  font-style: italic;
}

.send-btn {
  background: rgba(0, 229, 255, 0.08);
  border: 1px solid rgba(0, 229, 255, 0.15);
  color: rgba(0, 229, 255, 0.4);
  border-radius: 10px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}

.send-btn--active {
  background: linear-gradient(135deg, #00acc1, #0097a7);
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 4px 15px rgba(0, 172, 193, 0.4);
}

.input-hint {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.2);
  margin-top: 6px;
  text-align: center;
  letter-spacing: 0.5px;
}

.challenge-result-msg-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 10px 14px;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  backdrop-filter: blur(10px);
}

.challenge-result-msg-card--accepted {
  border: 1px solid rgba(76, 175, 80, 0.3);
  background: rgba(76, 175, 80, 0.05);
}

.challenge-result-msg-card--rejected {
  border: 1px solid rgba(244, 67, 54, 0.3);
  background: rgba(244, 67, 54, 0.05);
}

.challenge-result-header {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 800;
  font-size: 0.75rem;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
}

.challenge-result-msg-card--accepted .challenge-result-header {
  color: #4caf50;
}

.challenge-result-msg-card--rejected .challenge-result-header {
  color: #f44336;
}

.challenge-result-body {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

/* Transiciones */
.chat-drawer-enter-active, .chat-drawer-leave-active { transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.chat-drawer-enter-from, .chat-drawer-leave-to { transform: translateX(100%); }

.chat-overlay-enter-active, .chat-overlay-leave-active { transition: opacity 0.4s; }
.chat-overlay-enter-from, .chat-overlay-leave-to { opacity: 0; }
</style>
