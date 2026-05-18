<template>
  <div class="tournament-full-bracket-container fill-height d-flex flex-column align-center justify-center">
    <!-- Fondo Estelar -->
    <div class="stars-container"><div class="stars"></div><div class="nebula"></div></div>

    <!-- Timer Flotante -->
    <div v-if="countdown > 0" class="countdown-global-overlay" :class="{ 'is-critical': countdown <= 3 }">
      <v-progress-circular :model-value="(countdown / 7) * 100" :color="countdown <= 3 ? 'red-accent-2' : 'cyan-accent-2'" size="90" width="8">
        <span class="timer-number">{{ countdown }}</span>
      </v-progress-circular>
      <div class="timer-label text-center text-caption font-weight-bold text-white mt-1">PROPER DUEL</div>
    </div>

    <!-- Recompensas Flotantes (Top Left) -->
    <div class="prize-pool-overlay">
      <div class="prize-header">RECOMPENSES DEL TORNEIG</div>
      <div class="prize-row"><span class="medal gold">🥇 1r</span> <span class="prize-amount">{{ prizeDistribution.first }} ¢</span></div>
      <div class="prize-row"><span class="medal silver">🥈 2n</span> <span class="prize-amount">{{ prizeDistribution.second }} ¢</span></div>
      <div class="prize-row"><span class="medal bronze">🥉 3r</span> <span class="prize-amount">{{ prizeDistribution.third }} ¢</span></div>
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
        <div v-if="leftR1.length > 0" class="bracket-column r1">
          <div v-for="(match, idx) in leftR1" :key="'l1-'+idx" class="match-box-wrapper">
            <div class="match-card-mini" :class="getMatchStatusClass(match)">
              <div class="p-mini-row" :class="{ 'is-winner': isWinner(match, match?.p1), 'is-loser': isWinner(match, match?.p2), 'can-spectate': match.status === 'PLAYING' }" @click="match.status === 'PLAYING' ? spectateMatch(match, match.p1) : null">
                <v-avatar size="24" class="mr-2 avatar-border">
                  <v-img v-if="match?.p1" :src="getPlayerAvatar(match?.p1)" />
                  <v-icon v-else icon="mdi-help" size="16"></v-icon>
                </v-avatar>
                <span class="p-mini-name">{{ match?.p1 || 'TBD' }}</span>
                <v-icon v-if="isWinner(match, match?.p1)" icon="mdi-crown" size="14" color="amber" class="ml-1" />
              </div>
              <div class="p-mini-row" :class="{ 'is-winner': isWinner(match, match?.p2), 'is-loser': isWinner(match, match?.p1), 'can-spectate': match.status === 'PLAYING' }" @click="match.status === 'PLAYING' ? spectateMatch(match, match.p2) : null">
                <v-avatar size="24" class="mr-2 avatar-border">
                  <v-img v-if="match?.p2 && match.p2 !== 'BYE'" :src="getPlayerAvatar(match?.p2)" />
                  <v-icon v-else icon="mdi-account-off" size="16"></v-icon>
                </v-avatar>
                <span class="p-mini-name">{{ match?.p2 || 'BYE' }}</span>
                <v-icon v-if="isWinner(match, match?.p2)" icon="mdi-crown" size="14" color="amber" class="ml-1" />
              </div>
              
              <!-- Badge de En vivo / Observar -->
              <div v-if="match.status === 'PLAYING'" class="match-live-badge" @click.stop="spectateMatch(match)">
                <span class="pulse-red"></span> LIVE
              </div>
            </div>
            <div class="neon-pipe-to-right"></div>
          </div>
        </div>

        <!-- Ronda 2 (P. ej. Semis si hay 8) -->
        <div v-if="leftR2.length > 0" class="bracket-column r2">
          <div v-for="(match, idx) in leftR2" :key="'l2-'+idx" class="match-box-wrapper">
             <div class="match-card-mini" :class="getMatchStatusClass(match)">
               <div class="p-mini-row" :class="{ 'is-winner': isWinner(match, match?.p1), 'is-loser': isWinner(match, match?.p2), 'can-spectate': match.status === 'PLAYING' }" @click="match.status === 'PLAYING' ? spectateMatch(match, match.p1) : null">
                 <v-avatar size="24" class="mr-2 avatar-border">
                   <v-img v-if="match?.p1" :src="getPlayerAvatar(match?.p1)" />
                   <v-icon v-else icon="mdi-help" size="16"></v-icon>
                 </v-avatar>
                 <span class="p-mini-name">{{ match?.p1 || 'TBD' }}</span>
                 <v-icon v-if="isWinner(match, match?.p1)" icon="mdi-crown" size="14" color="amber" class="ml-1" />
               </div>
               <div class="p-mini-row" :class="{ 'is-winner': isWinner(match, match?.p2), 'is-loser': isWinner(match, match?.p1), 'can-spectate': match.status === 'PLAYING' }" @click="match.status === 'PLAYING' ? spectateMatch(match, match.p2) : null">
                 <v-avatar size="24" class="mr-2 avatar-border">
                   <v-img v-if="match?.p2" :src="getPlayerAvatar(match?.p2)" />
                   <v-icon v-else icon="mdi-help" size="16"></v-icon>
                 </v-avatar>
                 <span class="p-mini-name">{{ match?.p2 || 'TBD' }}</span>
                 <v-icon v-if="isWinner(match, match?.p2)" icon="mdi-crown" size="14" color="amber" class="ml-1" />
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
        <div v-if="rightR2.length > 0" class="bracket-column r2 reverse">
          <div v-for="(match, idx) in rightR2" :key="'r2-'+idx" class="match-box-wrapper">
             <div class="neon-pipe-to-left"></div>
             <div class="match-card-mini" :class="getMatchStatusClass(match)">
               <div class="p-mini-row" :class="{ 'is-winner': isWinner(match, match?.p1), 'is-loser': isWinner(match, match?.p2), 'can-spectate': match.status === 'PLAYING' }" @click="match.status === 'PLAYING' ? spectateMatch(match, match.p1) : null">
                 <v-avatar size="24" class="mr-2 avatar-border">
                   <v-img v-if="match?.p1" :src="getPlayerAvatar(match?.p1)" />
                   <v-icon v-else icon="mdi-help" size="16"></v-icon>
                 </v-avatar>
                 <span class="p-mini-name">{{ match?.p1 || 'TBD' }}</span>
                 <v-icon v-if="isWinner(match, match?.p1)" icon="mdi-crown" size="14" color="amber" class="ml-1" />
               </div>
               <div class="p-mini-row" :class="{ 'is-winner': isWinner(match, match?.p2), 'is-loser': isWinner(match, match?.p1), 'can-spectate': match.status === 'PLAYING' }" @click="match.status === 'PLAYING' ? spectateMatch(match, match.p2) : null">
                 <v-avatar size="24" class="mr-2 avatar-border">
                   <v-img v-if="match?.p2" :src="getPlayerAvatar(match?.p2)" />
                   <v-icon v-else icon="mdi-help" size="16"></v-icon>
                 </v-avatar>
                 <span class="p-mini-name">{{ match?.p2 || 'TBD' }}</span>
                 <v-icon v-if="isWinner(match, match?.p2)" icon="mdi-crown" size="14" color="amber" class="ml-1" />
               </div>
             </div>
          </div>
        </div>

        <!-- Ronda 1 -->
        <div v-if="rightR1.length > 0" class="bracket-column r1 reverse">
          <div v-for="(match, idx) in rightR1" :key="'r1-'+idx" class="match-box-wrapper">
            <div class="neon-pipe-to-left"></div>
            <div class="match-card-mini" :class="getMatchStatusClass(match)">
              <div class="p-mini-row" :class="{ 'is-winner': isWinner(match, match?.p1), 'is-loser': isWinner(match, match?.p2), 'can-spectate': match.status === 'PLAYING' }" @click="match.status === 'PLAYING' ? spectateMatch(match, match.p1) : null">
                <v-avatar size="24" class="mr-2 avatar-border">
                  <v-img v-if="match?.p1" :src="getPlayerAvatar(match?.p1)" />
                  <v-icon v-else icon="mdi-help" size="16"></v-icon>
                </v-avatar>
                <span class="p-mini-name">{{ match?.p1 || 'TBD' }}</span>
                <v-icon v-if="isWinner(match, match?.p1)" icon="mdi-crown" size="14" color="amber" class="ml-1" />
              </div>
              <div class="p-mini-row" :class="{ 'is-winner': isWinner(match, match?.p2), 'is-loser': isWinner(match, match?.p1), 'can-spectate': match.status === 'PLAYING' }" @click="match.status === 'PLAYING' ? spectateMatch(match, match.p2) : null">
                <v-avatar size="24" class="mr-2 avatar-border">
                  <v-img v-if="match?.p2 && match.p2 !== 'BYE'" :src="getPlayerAvatar(match?.p2)" />
                  <v-icon v-else icon="mdi-account-off" size="16"></v-icon>
                </v-avatar>
                <span class="p-mini-name">{{ match?.p2 || 'BYE' }}</span>
                <v-icon v-if="isWinner(match, match?.p2)" icon="mdi-crown" size="14" color="amber" class="ml-1" />
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
import { useMultiplayerStore } from '@/modes/multiplayer/store/multiplayerStore'
import { useAstroStore } from '@/stores/astroStore'

const props = defineProps({ isHost: Boolean })
const emit = defineEmits(['spectate-match'])
const multiplayerStore = useMultiplayerStore()
const astroStore = useAstroStore()

const countdown = ref(0)
let timer = null

const tournament = computed(() => multiplayerStore.room?.gameConfig?.tournament)
const matches = computed(() => tournament.value?.brackets || [])
const currentRound = computed(() => tournament.value?.round || 1)

const prizeDistribution = computed(() => {
  const buyIn = multiplayerStore.room?.gameConfig?.buyIn || 0
  const playersCount = (multiplayerStore.room?.players || []).length
  const totalPool = buyIn * playersCount
  
  return {
    first: Math.floor(totalPool * 0.6),
    second: Math.floor(totalPool * 0.3),
    third: Math.floor(totalPool * 0.1)
  }
})

const totalRounds = computed(() => {
  if (!multiplayerStore.room?.players) return 1
  const playersCount = multiplayerStore.room.players.length
  return Math.ceil(Math.log2(playersCount))
})

// Árbol completo: Repartimos por rondas basándonos en la propiedad .round de cada match
const leftR1 = computed(() => {
  // Solo mostrar matches que NO sean la ronda final
  const r1Matches = matches.value.filter(m => (m.round === 1 || !m.round) && m.round !== totalRounds.value)
  if (tournament.value?.brackets?.length <= 1) return []
  return r1Matches.slice(0, Math.ceil(r1Matches.length / 2))
})
const rightR1 = computed(() => {
  const r1Matches = matches.value.filter(m => (m.round === 1 || !m.round) && m.round !== totalRounds.value)
  if (tournament.value?.brackets?.length <= 1) return []
  return r1Matches.slice(Math.ceil(r1Matches.length / 2))
})

const leftR2 = computed(() => {
  const r2Matches = matches.value.filter(m => m.round === 2 && m.round !== totalRounds.value)
  return r2Matches.slice(0, Math.ceil(r2Matches.length / 2))
})
const rightR2 = computed(() => {
  const r2Matches = matches.value.filter(m => m.round === 2 && m.round !== totalRounds.value)
  return r2Matches.slice(Math.ceil(r2Matches.length / 2))
})

const finalists = computed(() => {
  if (!matches.value.length || !multiplayerStore.room?.players) return [null, null]
  
  const playersCount = multiplayerStore.room.players.length
  const totalRounds = Math.ceil(Math.log2(playersCount))
  
  // La final es el único match de la ronda totalRounds
  const finalMatch = matches.value.find(m => m.round === totalRounds)
  
  if (finalMatch) {
    return [finalMatch.p1, finalMatch.p2]
  }
  
  // Fallback si por alguna razón no se generó el match de la ronda final aún
  return [null, null]
})

const anyMatchWaiting = computed(() => matches.value.some(m => m.status === 'WAITING'))

const isWinner = (match, p) => match?.winner === p && p !== null
const isMyMatch = (match) => match?.p1 === astroStore.user || match?.p2 === astroStore.user

const spectateMatch = (match, player = null) => {
  if (match.status === 'PLAYING') {
    emit('spectate-match', player || match.p1)
  }
}

function getMatchStatusClass(match) {
  if (!match) return 'is-empty'
  if (match.status === 'PLAYING') return 'is-active pulse-border'
  if (match.status === 'FINISHED') return 'is-done'
  return 'is-waiting'
}

function getPlayerAvatar(username) {
  if (!username) return null
  const players = Array.isArray(multiplayerStore.room?.players) ? multiplayerStore.room.players : []
  const player = players.find(p => (p.username || p) === username)
  return player?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`
}

const statusMessage = computed(() => countdown.value > 0 ? 'CALCULANT PROBABILITATS DE VICTÒRIA...' : 'QUE COMENÇI EL DUEL!')

const manualStart = () => {
  multiplayerStore.sendGameAction({ type: 'START_TOURNAMENT_MATCH_MANUAL' })
}

function updateCountdown() {
  if (!tournament.value?.nextMatchStartTime) {
    countdown.value = 0
    return
  }
  const now = Date.now()
  const diff = Math.max(0, Math.ceil((tournament.value.nextMatchStartTime - now) / 1000))
  countdown.value = diff
}

watch(() => multiplayerStore.room?.status, (s) => { if (s === 'PLAYING') countdown.value = 0 })

onMounted(() => {
  updateCountdown()
  timer = setInterval(updateCountdown, 1000)
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

.stars-container { 
  position: absolute; 
  inset: 0; 
  background-image: 
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 100px 100px, 150px 150px, 200px 200px;
  opacity: 0.3; 
}

.countdown-global-overlay {
  position: fixed; top: 80px; right: 40px; z-index: 99999;
  background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(8px);
  padding: 10px; border-radius: 50%; border: 2px solid #00e5ff;
  box-shadow: 0 0 30px rgba(0, 229, 255, 0.3);
}
.timer-number { font-size: 2.5rem; font-weight: 900; color: white; font-style: italic; }

  .f-vs {
    font-size: 2rem;
    font-weight: 900;
    color: rgba(255,255,255,0.2);
    margin: 0 30px;
    font-style: italic;
  }

  .match-live-badge {
    position: absolute;
    top: -10px;
    right: -10px;
    background: #ef4444;
    color: white;
    font-size: 0.7rem;
    font-weight: 900;
    padding: 2px 8px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
    z-index: 10;
    transition: transform 0.2s ease;
  }
  .match-live-badge:hover {
    transform: scale(1.1);
    background: #f87171;
  }
  .pulse-red {
    width: 6px;
    height: 6px;
    background: white;
    border-radius: 50%;
    animation: pulse-animation 1.5s infinite;
  }
  @keyframes pulse-animation {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.5); opacity: 0.5; }
    100% { transform: scale(1); opacity: 1; }
  }

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
  margin-top: 100px;
  z-index: 10;
}

.bracket-wing { display: flex; align-items: center; gap: 0; flex: 1; min-height: 200px; }
.bracket-wing.left { justify-content: flex-end; }
.bracket-wing.right { justify-content: flex-start; }
.bracket-column { display: flex; flex-direction: column; gap: 40px; justify-content: center; flex: 1; padding: 0; align-items: center; }
.match-box-wrapper { display: flex; align-items: center; width: 100%; justify-content: center; position: relative; }

.p-mini-row { display: flex; align-items: center; padding: 4px; font-size: 0.8rem; height: 32px; border-radius: 4px; transition: all 0.2s ease; }
.p-mini-row.can-spectate { cursor: pointer; }
.p-mini-row.can-spectate:hover { background: rgba(0, 229, 255, 0.2); transform: translateX(5px); }
.p-mini-row.is-winner { color: #00e676; font-weight: 900; background: rgba(0, 230, 118, 0.1); }
.p-mini-row.is-loser { opacity: 0.4; filter: grayscale(1); }

.match-card-mini {
  width: 170px;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px 6px;
  transition: all 0.5s ease;
  z-index: 2;
}
.match-card-mini.is-active { border-color: #00e5ff; box-shadow: 0 0 15px #00e5ff66; }
.match-card-mini.is-done { opacity: 0.6; }
.match-card-mini.is-empty { border-style: dashed; opacity: 0.3; }

.mission-control-panel { opacity: 0.4; filter: grayscale(1); }
.p-mini-name { text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; flex: 1; }
.avatar-border { border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(0,0,0,0.3); }

/* --- NEON PIPES (LAS QUE AVANZAN) --- */
.neon-pipe-to-right {
  flex: 1;
  height: 2px;
  background: linear-gradient(to right, #00e5ff, rgba(0, 229, 255, 0.1));
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.5);
}

.neon-pipe-to-left {
  flex: 1;
  height: 2px;
  background: linear-gradient(to left, #00e5ff, rgba(0, 229, 255, 0.1));
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.5);
}

/* Unir líneas verticalmente (Rama Izquierda) */
.bracket-wing.left .bracket-column:not(:last-child) .match-box-wrapper:nth-child(odd):not(:only-child)::after {
  content: ''; position: absolute; right: 0; top: 50%;
  width: 2px; height: calc(50% + 10px);
  background: #00e5ff; box-shadow: 0 0 10px #00e5ff;
}
.bracket-wing.left .bracket-column:not(:last-child) .match-box-wrapper:nth-child(even):not(:only-child)::after {
  content: ''; position: absolute; right: 0; bottom: 50%;
  width: 2px; height: calc(50% + 10px);
  background: #00e5ff; box-shadow: 0 0 10px #00e5ff;
}

/* Unir líneas verticalmente (Rama Derecha) */
.bracket-wing.right .bracket-column:not(:first-child) .match-box-wrapper:nth-child(odd):not(:only-child)::after {
  content: ''; position: absolute; left: 0; top: 50%;
  width: 2px; height: calc(50% + 10px);
  background: #00e5ff; box-shadow: 0 0 10px #00e5ff;
}
.bracket-wing.right .bracket-column:not(:first-child) .match-box-wrapper:nth-child(even):not(:only-child)::after {
  content: ''; position: absolute; left: 0; bottom: 50%;
  width: 2px; height: calc(50% + 10px);
  background: #00e5ff; box-shadow: 0 0 10px #00e5ff;
}

/* --- CENTER --- */
.bracket-center { flex: 0 0 350px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; z-index: 2; }
.trophy-area { position: absolute; top: -110px; }
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

.prize-pool-overlay {
  position: absolute; top: 40px; left: 40px; z-index: 99999;
  width: 250px; background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 229, 255, 0.3); border-radius: 12px; padding: 12px 20px;
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.1);
}
.prize-header { color: #00e5ff; font-weight: 900; text-align: center; font-size: 0.6rem; letter-spacing: 2px; margin-bottom: 10px; }
.prize-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px dashed rgba(255,255,255,0.1); font-size: 0.8rem; font-weight: 700; }
.prize-row:last-child { border-bottom: none; }
.medal.gold { color: #ffca28; }
.medal.silver { color: #e0e0e0; }
.medal.bronze { color: #ff8a65; }
.prize-amount { color: #00e676; font-family: monospace; font-size: 1rem; }

.tournament-footer {
  position: absolute; bottom: 0; width: 100%; background: rgba(0,0,0,0.8);
  padding: 10px; text-align: center; font-size: 0.8rem; font-weight: 700;
}

@keyframes trophy-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } }
@keyframes pulse-border { 0% { border-color: #00e5ff; } 50% { border-color: transparent; } 100% { border-color: #00e5ff; } }
.pulse-border { animation: pulse-border 1.5s infinite; }
</style>
