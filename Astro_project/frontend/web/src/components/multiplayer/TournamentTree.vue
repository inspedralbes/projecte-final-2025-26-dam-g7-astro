<template>
  <div class="tournament-full-bracket-container fill-height d-flex flex-column align-center justify-center">
    <!-- Fondo Estelar -->
    <div class="stars-container"><div class="stars"></div><div class="nebula"></div></div>

    <!-- Timer Flotante -->
    <div v-if="countdown > 0" class="countdown-global-overlay">
      <v-progress-circular :model-value="(countdown / 15) * 100" color="cyan-accent-2" size="90" width="8">
        <span class="timer-number">{{ countdown }}</span>
      </v-progress-circular>
    </div>

    <!-- Cabecera -->
    <div class="tournament-header text-center mb-8">
      <h1 class="champions-title italic">CHAMPIONS <span class="text-cyan-accent-2 font-weight-black">LEAGUE</span></h1>
      <div class="ronda-pill mt-1"><span class="glow-text">LIVE TOURNAMENT TREE</span></div>
    </div>

    <!-- EL ÁRBOL COMPLETO (Estilo UEFA) -->
    <div class="bracket-mega-wrapper">
      
      <!-- ALA IZQUIERDA: Rondas Previas -->
      <div class="bracket-wing left">
        <!-- Ronda 1 (P. ej. Vuitens) -->
        <div class="bracket-column r1">
          <div v-for="(match, idx) in leftR1" :key="'l1-'+idx" class="match-box-wrapper">
            <div class="match-card-mini" :class="getMatchStatusClass(match)">
              <div class="p-mini-row" :class="{ 'is-winner': isWinner(match, match?.p1) }">
                <span class="p-mini-name">{{ match?.p1 || 'TBD' }}</span>
              </div>
              <div class="p-mini-row" :class="{ 'is-winner': isWinner(match, match?.p2) }">
                <span class="p-mini-name">{{ match?.p2 || 'BYE' }}</span>
              </div>
            </div>
            <div class="neon-pipe-to-right"></div>
          </div>
        </div>

        <!-- Ronda 2 (P. ej. Semis si hay 8) -->
        <div class="bracket-column r2">
          <div v-for="(match, idx) in leftR2" :key="'l2-'+idx" class="match-box-wrapper">
             <div class="match-card-mini" :class="getMatchStatusClass(match)">
               <div class="p-mini-row" :class="{ 'is-winner': isWinner(match, match?.p1) }">
                 <span class="p-mini-name">{{ match?.p1 || 'TBD' }}</span>
               </div>
               <div class="p-mini-row" :class="{ 'is-winner': isWinner(match, match?.p2) }">
                 <span class="p-mini-name">{{ match?.p2 || 'TBD' }}</span>
               </div>
             </div>
             <div class="neon-pipe-to-right"></div>
          </div>
        </div>
      </div>

      <!-- CENTRO: GRAN FINAL -->
      <div class="bracket-center">
        <div class="trophy-area">
          <v-icon icon="mdi-trophy" size="80" color="amber-accent-2" class="trophy-glow-icon" />
        </div>
        
        <div class="final-card-pro">
          <div class="final-header">GRAN FINAL</div>
          <div class="final-duelist-area">
             <div class="f-duelist">
                <v-avatar size="50" class="f-avatar" :class="{ 'empty': !finalists[0] }">
                  <v-img v-if="finalists[0]" :src="getPlayerAvatar(finalists[0])" />
                  <span v-else class="q-mark">?</span>
                </v-avatar>
                <div class="f-name">{{ finalists[0] || 'TBD' }}</div>
             </div>
             <div class="f-vs">VS</div>
             <div class="f-duelist">
                <v-avatar size="50" class="f-avatar" :class="{ 'empty': !finalists[1] }">
                  <v-img v-if="finalists[1]" :src="getPlayerAvatar(finalists[1])" />
                  <span v-else class="q-mark">?</span>
                </v-avatar>
                <div class="f-name">{{ finalists[1] || 'TBD' }}</div>
             </div>
          </div>

          <v-btn
            v-if="isHost && countdown === 0 && anyMatchWaiting"
            color="orange-accent-3"
            class="mt-4 w-100 font-weight-black rounded-pill launch-anim"
            @click="manualStart"
          >
            LLANÇAR DUEL
          </v-btn>
        </div>
      </div>

      <!-- ALA DERECHA: Rondas Previas -->
      <div class="bracket-wing right">
        <!-- Ronda 2 -->
        <div class="bracket-column r2 reverse">
          <div v-for="(match, idx) in rightR2" :key="'r2-'+idx" class="match-box-wrapper">
             <div class="neon-pipe-to-left"></div>
             <div class="match-card-mini" :class="getMatchStatusClass(match)">
               <div class="p-mini-row" :class="{ 'is-winner': isWinner(match, match?.p1) }">
                 <span class="p-mini-name">{{ match?.p1 || 'TBD' }}</span>
               </div>
               <div class="p-mini-row" :class="{ 'is-winner': isWinner(match, match?.p2) }">
                 <span class="p-mini-name">{{ match?.p2 || 'TBD' }}</span>
               </div>
             </div>
          </div>
        </div>

        <!-- Ronda 1 -->
        <div class="bracket-column r1 reverse">
          <div v-for="(match, idx) in rightR1" :key="'r1-'+idx" class="match-box-wrapper">
            <div class="neon-pipe-to-left"></div>
            <div class="match-card-mini" :class="getMatchStatusClass(match)">
              <div class="p-mini-row" :class="{ 'is-winner': isWinner(match, match?.p1) }">
                <span class="p-mini-name">{{ match?.p1 || 'TBD' }}</span>
              </div>
              <div class="p-mini-row" :class="{ 'is-winner': isWinner(match, match?.p2) }">
                <span class="p-mini-name">{{ match?.p2 || 'BYE' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div class="tournament-footer">{{ statusMessage }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useMultiplayerStore } from '../../stores/multiplayerStore'
import { useAstroStore } from '../../stores/astroStore'

const props = defineProps({ isHost: Boolean })
const multiplayerStore = useMultiplayerStore()
const astroStore = useAstroStore()

const countdown = ref(15)
let timer = null

const tournament = computed(() => multiplayerStore.room?.gameConfig?.tournament)
const matches = computed(() => tournament.value?.brackets || [])
const currentRound = computed(() => tournament.value?.round || 1)

// Simulamos el árbol completo para visualización
// En un sistema real, el servidor mandaría el histórico. Aquí lo repartimos por rondas.
const leftR1 = computed(() => currentRound.value === 1 ? matches.value.slice(0, Math.ceil(matches.value.length/2)) : [])
const rightR1 = computed(() => currentRound.value === 1 ? matches.value.slice(Math.ceil(matches.value.length/2)) : [])

const leftR2 = computed(() => currentRound.value === 2 ? matches.value.slice(0, Math.ceil(matches.value.length/2)) : [])
const rightR2 = computed(() => currentRound.value === 2 ? matches.value.slice(Math.ceil(matches.value.length/2)) : [])

const finalists = computed(() => {
  if (currentRound.value >= 3 || matches.value.length === 1) {
    const m = matches.value[0]
    return [m?.p1, m?.p2]
  }
  return [null, null]
})

const anyMatchWaiting = computed(() => matches.value.some(m => m.status === 'WAITING'))

const isWinner = (match, p) => match?.winner === p && p !== null
const isMyMatch = (match) => match?.p1 === astroStore.user || match?.p2 === astroStore.user

function getMatchStatusClass(match) {
  if (!match) return 'is-empty'
  if (match.status === 'PLAYING') return 'is-active pulse-border'
  if (match.status === 'FINISHED') return 'is-done'
  return 'is-waiting'
}

function getPlayerAvatar(username) {
  if (!username) return null
  const player = multiplayerStore.room?.players?.find(p => (p.username || p) === username)
  return player?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`
}

const statusMessage = computed(() => countdown.value > 0 ? 'CALCULANT PROBABILITATS DE VICTÒRIA...' : 'QUE COMENÇI EL DUEL!')

const manualStart = () => {
  multiplayerStore.sendGameAction({ type: 'START_TOURNAMENT_MATCH_MANUAL' })
}

watch(() => multiplayerStore.room?.status, (s) => { if (s === 'PLAYING') countdown.value = 0 })

onMounted(() => {
  timer = setInterval(() => { if (countdown.value > 0) countdown.value-- }, 1000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.tournament-full-bracket-container {
  background: #020617;
  color: white;
  width: 100vw !important;
  height: 100vh !important;
  position: relative;
  overflow: hidden;
  font-family: 'Outfit', sans-serif;
}

.stars-container { position: absolute; inset: 0; background: url('https://www.transparenttextures.com/patterns/stardust.png'); opacity: 0.1; }

.countdown-global-overlay {
  position: fixed; top: 80px; right: 40px; z-index: 99999;
  background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(8px);
  padding: 10px; border-radius: 50%; border: 2px solid #00e5ff;
  box-shadow: 0 0 30px rgba(0, 229, 255, 0.3);
}
.timer-number { font-size: 2.5rem; font-weight: 900; color: white; font-style: italic; }

.champions-title { font-size: 2rem; text-shadow: 0 0 15px rgba(0, 229, 255, 0.4); }
.ronda-pill { background: rgba(0, 229, 255, 0.1); border: 1px solid rgba(0, 229, 255, 0.3); padding: 4px 20px; border-radius: 100px; }
.glow-text { font-size: 0.6rem; font-weight: 800; color: #00e5ff; letter-spacing: 3px; }

/* --- BRACKET LAYOUT --- */
.bracket-mega-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1600px;
  padding: 0 20px;
  z-index: 10;
}

.bracket-wing { display: flex; align-items: center; gap: 40px; flex: 1; }
.bracket-column { display: flex; flex-direction: column; gap: 20px; justify-content: center; }

.match-box-wrapper { display: flex; align-items: center; position: relative; }

.match-card-mini {
  width: 140px;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 4px;
  transition: all 0.5s ease;
}
.match-card-mini.is-active { border-color: #00e5ff; box-shadow: 0 0 15px #00e5ff66; }
.match-card-mini.is-done { opacity: 0.6; }
.match-card-mini.is-empty { border-style: dashed; opacity: 0.3; }

.p-mini-row { display: flex; align-items: center; padding: 2px 6px; font-size: 0.6rem; height: 20px; }
.p-mini-row.is-winner { color: #00e676; font-weight: 900; }
.p-mini-name { text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* --- NEON PIPES (LAS QUE AVANZAN) --- */
.neon-pipe-to-right { height: 2px; width: 40px; background: #00e5ff; box-shadow: 0 0 10px #00e5ff; }
.neon-pipe-to-left { height: 2px; width: 40px; background: #00e5ff; box-shadow: 0 0 10px #00e5ff; }

/* --- CENTER --- */
.bracket-center { flex: 0 0 350px; display: flex; flex-direction: column; align-items: center; }
.trophy-area { margin-bottom: 20px; }
.trophy-glow-icon { filter: drop-shadow(0 0 20px #ffca28); animation: trophy-pulse 3s infinite; }

.final-card-pro {
  width: 100%; background: rgba(15, 23, 42, 0.95);
  border: 2px solid #ffca28; border-radius: 20px; padding: 20px;
  box-shadow: 0 0 40px rgba(255, 202, 40, 0.2);
}
.final-header { color: #ffca28; font-weight: 900; text-align: center; font-size: 0.7rem; letter-spacing: 4px; margin-bottom: 20px; }
.final-duelist-area { display: flex; align-items: center; justify-content: space-around; }
.f-avatar { border: 2px solid #ffca28; background: #0f172a; }
.f-avatar.empty { border-style: dashed; opacity: 0.3; }
.q-mark { font-size: 2rem; color: #ffca28; font-weight: 900; }
.f-name { margin-top: 10px; font-size: 0.8rem; font-weight: 900; text-align: center; }
.f-vs { font-style: italic; opacity: 0.4; font-weight: 900; }

.tournament-footer {
  position: absolute; bottom: 0; width: 100%; background: rgba(0,0,0,0.8);
  padding: 10px; text-align: center; font-size: 0.8rem; font-weight: 700;
}

@keyframes trophy-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } }
@keyframes pulse-border { 0% { border-color: #00e5ff; } 50% { border-color: transparent; } 100% { border-color: #00e5ff; } }
.pulse-border { animation: pulse-border 1.5s infinite; }
</style>
