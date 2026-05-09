<template>
  <v-container class="fill-height d-flex flex-column align-center justify-center game-container opendyslexic">

    <!-- Capçalera -->
    <v-card class="mb-4 pa-4 bg-deep-purple-darken-4 elevation-10" max-width="800" rounded="xl" width="100%">
      <div class="d-flex justify-space-between align-center">
        <div>
          <h2 class="text-h5 font-weight-bold text-cyan-accent-2">🚀 Rosco Estelar <span v-if="props.isMultiplayer && subRole" class="text-caption text-uppercase">({{ subRole }})</span></h2>
          <div class="text-caption text-grey-lighten-2">
            <span>Puntuació: {{ score }}</span>
            <span class="mx-2">|</span>
            <span :class="{ 'text-red-accent-2': timeLeft <= 15 }">Temps: {{ timeLeft }}s</span>
          </div>
        </div>
        <div class="d-flex align-center gap-4">
          <v-chip
            v-for="(l, i) in roscoLetters"
            :key="i"
            class="mx-1 font-weight-bold"
            :color="getChipColor(l)"
            label
            size="small"
          >
            {{ l.char }}
          </v-chip>
          <v-btn color="grey" icon="mdi-close" variant="text" @click="emitExit" />
        </div>
      </div>
    </v-card>

    <!-- Joc Principal -->
    <v-row v-if="!gameFinished" class="w-100 d-flex justify-center align-center" no-gutters>

      <!-- Estrella -->
      <v-col class="d-flex justify-center align-center position-relative star-col mb-8 mb-md-0" cols="12" md="6">
        <div class="star-wrapper">
          <svg class="star-svg" viewBox="0 0 400 400">
            <!-- Polígons d'il·luminació interior (Puntes) -->
            <polygon
              v-for="(points, i) in tipPolygons"
              :key="'tip-'+i"
              class="star-tip-fill"
              :class="{ 'tip-glowing': isTipGlowing(i) }"
              :points="points"
            />

            <!-- Línies del contorn -->
            <line
              v-for="(seg, i) in starSegments"
              :key="'line-'+i"
              class="star-line"
              :class="{ 'line-glowing': isSegmentGlowing(i) }"
              :x1="seg.x1"
              :x2="seg.x2"
              :y1="seg.y1"
              :y2="seg.y2"
            />

            <g v-if="rocketAnimating" class="rocket-trail-group">
              <circle :cx="rocketPos.x" :cy="rocketPos.y" fill="url(#rocketGlow)" r="6" />
              <circle
                v-for="(p, i) in trailParticles"
                :key="'trail-'+i"
                :cx="p.x"
                :cy="p.y"
                :fill="p.color"
                :opacity="p.opacity"
                :r="p.r"
              />
            </g>
            <defs>
              <radialGradient id="rocketGlow">
                <stop offset="0%" stop-color="#00e5ff" stop-opacity="1" />
                <stop offset="50%" stop-color="#00b8d4" stop-opacity="0.6" />
                <stop offset="100%" stop-color="#0097a7" stop-opacity="0" />
              </radialGradient>
              <radialGradient id="tipGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.6" />
                <stop offset="100%" stop-color="#00e5ff" stop-opacity="0" />
              </radialGradient>
            </defs>
          </svg>

          <div
            v-for="(letter, index) in roscoLetters"
            :key="index"
            class="star-node elevation-8"
            :class="getBubbleClass(letter, index)"
            :style="getStarNodeStyle(index)"
          >
            <span class="node-letter">{{ letter.char }}</span>
            <div v-if="index === currentIndex && !gameFinished" class="node-pulse" />
          </div>

          <div class="star-center">
            <div class="text-h2 font-weight-black center-letter">{{ currentLetter.char }}</div>
          </div>
        </div>
      </v-col>

      <!-- Panell de Pregunta i Resposta -->
      <v-col class="px-md-8" cols="12" md="6">
        <v-card border class="pa-6 bg-grey-darken-4 elevation-5" rounded="xl">
          <div class="mb-4 text-center">
            <!-- RENDERIZADO CONDICIONAL DE PISTA -->
            <template v-if="isTranslator">
              <v-chip class="mb-2 font-weight-bold" color="amber" label>Jeroglífics Alienígenes</v-chip>
              <div class="hieroglyph-internal-container d-flex justify-center gap-4 pa-4">
                <div v-for="(emoji, index) in (currentLetter.hieroglyphs || ['❓','❓','❓'])" :key="index" class="hieroglyph-box elevation-10">
                  <span class="emoji-text">{{ emoji }}</span>
                </div>
              </div>
            </template>
            <template v-else-if="isSender">
              <v-chip class="mb-2 font-weight-bold" color="light-blue" label>La Paraula és...</v-chip>
              <p class="text-h4 text-cyan-accent-2 font-weight-black mb-4">{{ currentLetter.answer }}</p>

              <!-- TEXT-BASED HINT INPUT (Sustituye Emoji Picker) -->
              <v-card class="pa-4 bg-grey-darken-3 rounded-lg elevation-4">
                <div class="text-caption text-grey-lighten-1 mb-2">ESCRIU UNA PISTA (ANTI-TRAMPES ACTIVAT)</div>
                <v-text-field
                  v-model="textHint"
                  bg-color="grey-darken-4"
                  class="mb-3 hint-text-field"
                  density="comfortable"
                  hide-details
                  placeholder="Escriu una pista..."
                  prepend-inner-icon="mdi-chat-processing"
                  rounded="lg"
                  variant="solo-filled"
                  @keydown.enter="sendTextHint"
                />
                <v-btn
                  block
                  class="text-black font-weight-bold"
                  color="cyan-accent-3"
                  :disabled="!textHint.trim()"
                  @click="sendTextHint"
                >
                  ENVIAR PISTA
                </v-btn>
              </v-card>
            </template>
            <template v-else-if="isGuesser">
              <v-chip class="mb-2 font-weight-bold" color="cyan" label>Endevina!</v-chip>

              <!-- Pistas inteligentes (Categoría y Tipo) -->
              <div class="d-flex justify-center gap-2 mb-4">
                <v-chip class="font-weight-black elevation-2" color="amber-darken-3" size="small" variant="flat">
                  <v-icon icon="mdi-tag" size="14" start />
                  {{ currentHints.category }}
                </v-chip>
                <v-chip class="font-weight-black elevation-2" color="indigo-accent-2" size="small" variant="flat">
                  <v-icon icon="mdi-shape" size="14" start />
                  {{ currentHints.type }}
                </v-chip>
              </div>

              <!-- EMOJI HISTORY INTEGRADO -->
              <div class="emoji-history-internal pa-4 rounded-xl elevation-5 bg-deep-purple-darken-4 border-cyan">
                <div class="text-caption text-cyan-accent-2 mb-2 font-weight-bold">PISTES DEL COMPANY</div>
                <div class="d-flex flex-wrap gap-2 justify-center min-chat-bubble-internal">
                  <div
                    v-for="(emoji, index) in multiplayerStore.partnerEmojis"
                    :key="index"
                    class="emoji-item-internal animate-pop-in"
                  >
                    <span class="text-h3">{{ emoji }}</span>
                  </div>
                  <div v-if="!multiplayerStore.partnerEmojis || multiplayerStore.partnerEmojis.length === 0" class="text-body-2 text-grey italic">
                    Esperant pistes...
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <v-chip class="mb-2 font-weight-bold" color="cyan" label>Definició</v-chip>
              <p class="text-h6 text-white">{{ currentLetter.question }}</p>
            </template>
          </div>

          <v-divider class="mb-6 border-opacity-25" />

          <div class="text-center mb-4">
            <p class="text-overline text-grey-lighten-1 mb-2">
              <span v-if="isTranslator">EL TEU COMPANY ESTÀ ESCRIVINT...</span>
              <span v-else-if="isSender">ENVIA PISTES AMB EMOJIS!</span>
              <span v-else>ESCRIU LA PARAULA</span>
            </p>

            <!-- INPUT CONDICIONAL -->
            <v-text-field
              v-if="!isTranslator && !isSender"
              v-model="rawInput"
              autofocus
              bg-color="#263238"
              class="mb-4 spelling-input"
              color="cyan-accent-3"
              density="comfortable"
              hide-details
              placeholder="Escriu aquí..."
              variant="outlined"
              @input="onTyping"
              @keydown.enter="checkAnswer"
            />

            <!-- GHOST TEXT PARA EL TRADUCTOR -->
            <div v-else-if="isTranslator" class="ghost-text-container mb-4 pa-4 rounded-lg">
              <span class="text-h4 text-cyan-accent-2 font-weight-black">{{ multiplayerStore.partnerText || '...' }}</span>
              <div v-if="multiplayerStore.partnerText" class="typing-indicator mt-2">
                <v-progress-linear color="cyan" height="2" indeterminate />
              </div>
            </div>

            <div v-if="!isTranslator && !isSender" class="d-flex justify-center gap-4 mb-4">
              <v-btn
                class="px-4"
                color="orange-accent-3"
                size="x-large"
                variant="tonal"
                @click="pasapalabra"
              >
                Pasapalabra
              </v-btn>
            </div>

            <v-btn
              v-if="!isTranslator && !isSender"
              block
              class="font-weight-bold text-white elevation-4"
              color="success"
              :disabled="rawInput.length === 0"
              rounded="lg"
              size="large"
              @click="checkAnswer"
            >
              Confirmar
            </v-btn>

            <v-btn
              v-if="!isTranslator && !isSender"
              class="mt-2"
              color="red-accent-2"
              size="small"
              variant="text"
              @click="clearInput"
            >
              Esborrar tot
            </v-btn>

            <div v-if="isTranslator" class="text-body-2 text-grey-lighten-1">
              Guia al teu company! Ell no veu els jeroglífics.
            </div>
            <div v-if="isSender" class="text-body-2 text-grey-lighten-1">
              El teu company no sap la paraula. Ajuda'l amb emojis!
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Pantalla Final (només en single player) -->
    <v-card
      v-else-if="!isMultiplayer"
      class="pa-8 text-center bg-grey-darken-4 border-cyan"
      max-width="500"
      rounded="xl"
      width="100%"
    >
      <v-icon class="mb-4" color="cyan-accent-2" icon="mdi-school" size="80" />
      <h2 class="text-h4 text-white mb-2">Rosco Completat!</h2>
      <div class="d-flex justify-space-around my-6">
        <div class="text-center">
          <div class="text-h3 text-success font-weight-bold">{{ correctCount }}</div>
          <div class="text-caption">Encerts</div>
        </div>
        <div class="text-center">
          <div class="text-h3 text-error font-weight-bold">{{ incorrectCount }}</div>
          <div class="text-caption">Errors</div>
        </div>
      </div>
      <p class="text-h5 text-white mb-2">Puntuació Final: {{ score }}</p>
      <p class="text-subtitle-1 text-grey-lighten-1 mb-1">Temps Restant: {{ timeLeft }}s</p>
      <p class="text-h6 text-cyan-accent-2 mb-6">Recompensa: {{ finalReward }}</p>

      <v-btn
        class="text-black font-weight-bold"
        color="cyan-accent-3"
        rounded="pill"
        size="large"
        variant="flat"
        @click="emitExit"
      >
        Obtenir Recompensa
      </v-btn>
    </v-card>

    <v-snackbar v-model="showFeedback" :color="feedbackColor" location="top" timeout="2000">
      {{ feedbackMessage }}
    </v-snackbar>

  </v-container>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
  import { EMOJI_CATEGORIES, EMOJI_LIBRARY } from '@/constants/emojis'
  import { useAstroStore } from '@/stores/astroStore'
  import { useMultiplayerStore } from '@/stores/multiplayerStore'
  import { isValidHint } from '@/utils/hintValidator'
  import { getWordCategory, getWordType } from '@/utils/roscoHints'

  const multiplayerStore = useMultiplayerStore()
  const astroStore = useAstroStore()

  const emojiSearch = ref('')
  const selectedEmojiCategory = ref('faces')
  const textHint = ref('')

  // Pistas inteligentes para el modo cooperativo
  const currentHints = reactive({
    category: '',
    type: '',
  })

  function throttle (func, limit) {
    let lastRan
    let lastFunc
    return function (...args) {
      if (lastRan) {
        clearTimeout(lastFunc)
        lastFunc = setTimeout(function () {
          if ((Date.now() - lastRan) >= limit) {
            func(...args)
            lastRan = Date.now()
          }
        }, limit - (Date.now() - lastRan))
      } else {
        func(...args)
        lastRan = Date.now()
      }
    }
  }

  const props = defineProps({
    isMultiplayer: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['game-over'])

  // Roles asimétricos
  const subRole = computed(() => multiplayerStore.subRole)
  const isHost = computed(() => multiplayerStore.room?.host === astroStore.user)
  const isTranslator = computed(() => props.isMultiplayer && subRole.value === 'translator')
  const isSender = computed(() => props.isMultiplayer && subRole.value === 'sender')
  const isGuesser = computed(() => props.isMultiplayer && subRole.value === 'guesser')

  const filteredEmojiList = computed(() => {
    const search = emojiSearch.value?.trim().toLowerCase()
    if (search) {
      return EMOJI_LIBRARY
        .filter(e => e.tags.toLowerCase().includes(search))
        .map(e => e.char)
    }
    return EMOJI_LIBRARY
      .filter(e => e.category === selectedEmojiCategory.value)
      .map(e => e.char)
  })

  const sendEmoji = throttle(emoji => {
    multiplayerStore.sendEmojiClue(emoji)
    emojiSearch.value = ''
  }, 500)

  function sendTextHint () {
    const hint = textHint.value?.trim()
    if (!hint) return

    if (!isValidHint(hint, currentLetter.value.answer)) {
      feedbackMessage.value = '❌ TRAMPA DETECTADA! No pots enviar la paraula o variants.'
      feedbackColor.value = 'error'
      showFeedback.value = true
      textHint.value = ''
      return
    }

    multiplayerStore.sendGameAction({
      type: 'PARTNER_EMOJI',
      emoji: hint,
    })
    textHint.value = ''
  }

  const allLettersData = [
    { char: 'A', question: 'Cos rocallós que orbita al voltant del Sol.', answer: 'ASTEROIDE', hieroglyphs: ['☄️', '🪨', '🌌'] },
    { char: 'C', question: 'Astre de gel i pols amb una cua lluminosa.', answer: 'COMETA', hieroglyphs: ['☄️', '❄️', '✨'] },
    { char: 'E', question: 'Esfera de gas que emet llum i calor.', answer: 'ESTRELLA', hieroglyphs: ['⭐', '🔥', '✨'] },
    { char: 'G', question: 'Sistema enorme d\'estrelles units per la gravetat.', answer: 'GALAXIA', hieroglyphs: ['🌀', '🌌', '✨'] },
    { char: 'N', question: 'Núvol de gas on neixen noves estrelles.', answer: 'NEBULOSA', hieroglyphs: ['☁️', '🌈', '👶'] },
    { char: 'P', question: 'Cos celest que orbita una estrella.', answer: 'PLANETA', hieroglyphs: ['🌍', '💫', '☀️'] },
    { char: 'S', question: 'L\'estrella central del nostre sistema.', answer: 'SOL', hieroglyphs: ['☀️', '🔥', '🦁'] },
    { char: 'T', question: 'Instrument per observar objectes llunyans a l\'espai.', answer: 'TELESCOPI', hieroglyphs: ['🔭', '👁️', '🌌'] },
    { char: 'U', question: 'Tot el que existeix: matèria, energia, espai i temps.', answer: 'UNIVERS', hieroglyphs: ['🌌', '♾️', '⚛️'] },
    { char: 'O', question: 'Trajectòria corba d\'un objecte a l\'espai.', answer: 'ORBITA', hieroglyphs: ['🔄', '🌍', '🌌'] },
    { char: 'G', question: 'Felí domèstic molt independent i juganer.', answer: 'GAT', hieroglyphs: ['🐱', '🏠', '🧶'] },
    { char: 'A', question: 'Au rapinyaire de gran envergadura, símbol de llibertat.', answer: 'AGUILA', hieroglyphs: ['🦅', '🏔️', '🗽'] },
    { char: 'D', question: 'Mamífer marí molt intel·ligent que viu en grups.', answer: 'DOLFI', hieroglyphs: ['🐬', '🌊', '🧠'] },
    { char: 'E', question: 'El mamífer terrestre més gran del món.', answer: 'ELEFANT', hieroglyphs: ['🐘', '🌳', '🐘'] },
    { char: 'L', question: 'Gran felí conegut com el rei de la selva.', answer: 'LLEO', hieroglyphs: ['🦁', '👑', '🌿'] },
    { char: 'T', question: 'Rèptil amb closca dura que es mou lentament.', answer: 'TORTUGA', hieroglyphs: ['🐢', '🐚', '🐌'] },
    { char: 'C', question: 'Animal amb vuit tentacles que viu al fons del mar.', answer: 'CRANC', hieroglyphs: ['🦀', '🐚', '🏖️'] },
    { char: 'L', question: 'Ocell tropical de colors vius que pot imitar sons.', answer: 'LLORO', hieroglyphs: ['🦜', '🌴', '🗣️'] },
    { char: 'A', question: 'La unitat bàsica de la matèria.', answer: 'ATOM', hieroglyphs: ['⚛️', '🔬', '1️⃣'] },
    { char: 'C', question: 'Unitat bàsica dels éssers vius.', answer: 'CELULA', hieroglyphs: ['🧬', '🔬', '🥚'] },
    { char: 'G', question: 'Força que atrau els objectes cap al centre de la Terra.', answer: 'GRAVETAT', hieroglyphs: ['🍎', '⬇️', '🌍'] },
    { char: 'O', question: 'Gas esencial per a la respiració dels éssers vius.', answer: 'OXIGEN', hieroglyphs: ['💨', '🫁', '🌳'] },
    { char: 'H', question: 'L\'element químic més lleuger de l\'univers.', answer: 'HIDROGEN', hieroglyphs: ['🎈', '1️⃣', '💧'] },
    { char: 'E', question: 'Capacitat per fer un treball o produir un canvi.', answer: 'ENERGIA', hieroglyphs: ['⚡', '🔋', '🔥'] },
    { char: 'M', question: 'Aparell que fa que les coses petites es vegin grans.', answer: 'MICROSCOPI', hieroglyphs: ['🔬', '👁️', '🤏'] },
    { char: 'V', question: 'Rapidesa amb què un objecte canvia de posició.', answer: 'VELOCITAT', hieroglyphs: ['🏃', '💨', '⏱️'] },
    { char: 'M', question: 'Gran massa d\'aigua salada que cobreix la Terra.', answer: 'MAR', hieroglyphs: ['🌊', '⛵', '🧂'] },
    { char: 'V', question: 'Muntanya que pot fer erupció amb lava.', answer: 'VOLCA', hieroglyphs: ['🌋', '🔥', '🏔️'] },
    { char: 'R', question: 'Corrent natural d\'aigua que desemboca al mar.', answer: 'RIU', hieroglyphs: ['💧', '🏞️', '🐟'] },
    { char: 'I', question: 'Porció de terra envoltada d\'aigua per tots els costats.', answer: 'ILLA', hieroglyphs: ['🏝️', '🌊', '🌴'] },
    { char: 'D', question: 'Zona àrida amb molt poques precipitacions.', answer: 'DESERT', hieroglyphs: ['🏜️', '☀️', '🌵'] },
    { char: 'S', question: 'Gran extensió de bosc tropical amb molta biodiversitat.', answer: 'SELVA', hieroglyphs: ['🌳', '🐒', '🦜'] },
    { char: 'L', question: 'Massa d\'aigua dolça envoltada de terra.', answer: 'LLAC', hieroglyphs: ['💧', '🌲', '🦢'] },
    { char: 'P', question: 'Fruita allargada i groga molt energètica.', answer: 'PLATAN', hieroglyphs: ['🍌', '🟡', '🐒'] },
    { char: 'T', question: 'Fruita vermella molt usada en amanides i salses.', answer: 'TOMAQUET', hieroglyphs: ['🍅', '🥗', '🍝'] },
    { char: 'F', question: 'Preparat comestible fet amb llet coagulada.', answer: 'FORMATGE', hieroglyphs: ['🧀', '🧀', '🐭'] },
    { char: 'X', question: 'Dolç elaborat amb cacau.', answer: 'XOCOLATA', hieroglyphs: ['🍫', '🍫', '😋'] },
    { char: 'P', question: 'Plat italià amb base de massa, tomàquet i formatge.', answer: 'PIZZA', hieroglyphs: ['🍕', '🇮🇹', '🍕'] },
    { char: 'M', question: 'Producte dolç que fan las abelles.', answer: 'MEL', hieroglyphs: ['🍯', '🐝', '🍯'] },
    { char: 'P', question: 'Fruita vermella o verda que creix als arbres.', answer: 'POMA', hieroglyphs: ['🍎', '🍏', '🌳'] },
    { char: 'F', question: 'Esport d\'equip amb una pilota rodona i porteries.', answer: 'FUTBOL', hieroglyphs: ['⚽', '🥅', '🏟️'] },
    { char: 'B', question: 'Esport on es llança una pilota a una cistella.', answer: 'BASQUET', hieroglyphs: ['🏀', '🗑️', '🏀'] },
    { char: 'N', question: 'Esport aquàtic on es fan braçades a la piscina.', answer: 'NATACIO', hieroglyphs: ['🏊', '🌊', '🏊'] },
    { char: 'T', question: 'Esport de raqueta amb una pilota sobre una xarxa.', answer: 'TENNIS', hieroglyphs: ['🎾', '🏸', '🎾'] },
    { char: 'C', question: 'Esport on es pedala amb dues rodes.', answer: 'CICLISME', hieroglyphs: ['🚴', '🚲', '🚴'] },
    { char: 'R', question: 'Esport d\'equip amb una pilota ovalada.', answer: 'RUGBY', hieroglyphs: ['🏉', '🏉', '🏟️'] },
    { char: 'E', question: 'Esport d\'hivern on es llisca per la neu.', answer: 'ESQUI', hieroglyphs: ['⛷️', '❄️', '🏔️'] },
    { char: 'R', question: 'Màquina programable que pot fer tasques automàtiques.', answer: 'ROBOT', hieroglyphs: ['🤖', '⚙️', '⚡'] },
    { char: 'I', question: 'Xarxa global que connecta ordinadors de tot el món.', answer: 'INTERNET', hieroglyphs: ['🌐', '💻', '📶'] },
    { char: 'P', question: 'Acció de crear instruccions perquè un ordinador faci una tasca.', answer: 'PROGRAMAR', hieroglyphs: ['💻', '⌨️', '📜'] },
    { char: 'W', question: 'Lloc a internet on pots consultar informació.', answer: 'WEB', hieroglyphs: ['🕸️', '💻', '🔍'] },
    { char: 'D', question: 'Informació emmagatzemada en sistemes informàtics.', answer: 'DADES', hieroglyphs: ['📊', '📁', '💾'] },
    { char: 'S', question: 'Dispositiu electrònic de butxaca amb pantalla tàctil.', answer: 'SMARTPHONE', hieroglyphs: ['📱', '🤳', '📲'] },
    { char: 'B', question: 'Gran extensió de terreny cobert d\'arbres.', answer: 'BOSC', hieroglyphs: ['🌲', '🌳', '🦌'] },
    { char: 'F', question: 'Part de la planta que sol ser de colors i atrau insectes.', answer: 'FLOR', hieroglyphs: ['🌸', '🐝', '💐'] },
    { char: 'A', question: 'Planta gran amb tronc llenyós i branques.', answer: 'ARBRE', hieroglyphs: ['🌳', '🪵', '🍃'] },
    { char: 'P', question: 'Precipitació d\'aigua que cau dels núvols.', answer: 'PLUJA', hieroglyphs: ['🌧️', '☔', '💧'] },
    { char: 'N', question: 'Massa visible de gotes d\'aigua al cer.', answer: 'NUVOL', hieroglyphs: ['☁️', '☁️', '🌈'] },
    { char: 'L', question: 'Font natural de llum que ve del Sol.', answer: 'LLUM', hieroglyphs: ['💡', '☀️', '🔦'] },
    { char: 'V', question: 'Moviment de l\'aire a l\'atmosfera.', answer: 'VENT', hieroglyphs: ['🌬️', '🍃', '🪁'] },
    { char: 'C', question: 'Edifici fortificat medieval amb torres i muralles.', answer: 'CASTELL', hieroglyphs: ['🏰', '🛡️', '👑'] },
    { char: 'M', question: 'Lloc on s\'exposen obres d\'art i objectes històrics.', answer: 'MUSEU', hieroglyphs: ['🏛️', '🖼️', '🗿'] },
    { char: 'L', question: 'Conjunt de signes escrits que serveix per comunicar-se.', answer: 'LLENGUA', hieroglyphs: ['👅', '🗣️', '📜'] },
    { char: 'G', question: 'Instrument de cordes molt popular en el rock.', answer: 'GUITARRA', hieroglyphs: ['🎸', '🎶', '🤘'] },
    { char: 'P', question: 'Instrument de tecles blanques i negres.', answer: 'PIANO', hieroglyphs: ['🎹', '🎶', '🎹'] },
    { char: 'B', question: 'Instrument de percussió que es toca amb baquetes.', answer: 'BATERIA', hieroglyphs: ['🥁', '🎶', '🥁'] },
    { char: 'F', question: 'Instrument de vent de fusta amb forats.', answer: 'FLAUTA', hieroglyphs: ['🎶', '🌬️', '🦯'] },
    { char: 'M', question: 'Art de combinar sons de forma agradable.', answer: 'MUSICA', hieroglyphs: ['🎶', '🎼', '🎧'] },
  ]

  const STAR_CENTER = 200
  const STAR_RADIUS = 150
  const INNER_RADIUS = 60

  const starPoints = Array.from({ length: 10 }, (_, i) => {
    const angle = (i * 36 - 90) * (Math.PI / 180)
    const r = i % 2 === 0 ? STAR_RADIUS : INNER_RADIUS
    return { x: STAR_CENTER + Math.cos(angle) * r, y: STAR_CENTER + Math.sin(angle) * r }
  })

  const letterPositions = [0, 2, 4, 6, 8]

  const starSegments = computed(() => starPoints.map((point, i) => ({
    x1: point.x, y1: point.y,
    x2: starPoints[(i + 1) % 10].x, y2: starPoints[(i + 1) % 10].y,
  })))

  const tipPolygons = computed(() => letterPositions.map(pos => {
    const pPrev = starPoints[(pos - 1 + 10) % 10], pCurr = starPoints[pos], pNext = starPoints[(pos + 1) % 10], pCenter = { x: STAR_CENTER, y: STAR_CENTER }
    return `${pCenter.x},${pCenter.y} ${pPrev.x},${pPrev.y} ${pCurr.x},${pCurr.y} ${pNext.x},${pNext.y}`
  }))

  const roscoLetters = ref([]), currentIndex = ref(0), rawInput = ref(''), gameFinished = ref(false), score = ref(0), showFeedback = ref(false), feedbackMessage = ref(''), feedbackColor = ref('info'), isChecking = ref(false), totalTime = 120, timeLeft = ref(totalTime), attempts = ref(0), rocketAnimating = ref(false), rocketPos = reactive({ x: 0, y: 0 }), trailParticles = ref([]), visitedSegments = ref(new Set())
  let timerInterval = null

  const currentLetter = computed(() => roscoLetters.value.length ? roscoLetters.value[currentIndex.value] : { char: '?', question: '', hieroglyphs: [] })
  watch(() => currentLetter.value, newLetter => { if (newLetter?.answer) { currentHints.category = getWordCategory(newLetter.answer); currentHints.type = getWordType(newLetter.answer) } }, { immediate: true })
  const correctCount = computed(() => roscoLetters.value.filter(l => l.status === 'correct').length), incorrectCount = computed(() => roscoLetters.value.filter(l => l.status === 'incorrect').length), finalReward = computed(() => score.value + timeLeft.value)
  function normalize (str) { return str.toUpperCase().trim().replace(/\s/g, '').normalize('NFD').replace(/[\u0300-\u036F]/g, '') }

  function initRosco (force = false) {
    if (props.isMultiplayer && multiplayerStore.room?.gameConfig?.roscoData && !force) {
      const teamId = multiplayerStore.room?.gameConfig?.teams[astroStore.user], data = multiplayerStore.room?.gameConfig?.roscoData[teamId] || multiplayerStore.room?.gameConfig?.roscoData.default
      if (data && (!roscoLetters.value.length || force)) roscoLetters.value = data.map(l => ({ ...l, status: 'pending' }))
    } else if (!roscoLetters.value.length || force) {
      if (isHost.value) {
        const shuffled = [...allLettersData].sort(() => Math.random() - 0.5), data = shuffled.slice(0, 5).map(l => ({ ...l, status: 'pending' }))
        roscoLetters.value = data
        currentIndex.value = 0
        rocketPos.x = starPoints[0].x
        rocketPos.y = starPoints[0].y
        if (props.isMultiplayer) {
          multiplayerStore.sendGameAction({ type: 'ROSCO_SYNC', data })
          multiplayerStore.sendGameAction({ type: 'INDEX_SYNC', index: 0 })
        }
      } else {
        // El no-host pide sincronización si todavía no tiene datos
        multiplayerStore.sendGameAction({ type: 'REQUEST_ROSCO_SYNC' })
      }
    }
  }

  onMounted(() => { initRosco(); startTimer() })
  watch(() => multiplayerStore.room, () => initRosco(), { deep: true })
  const emitTyping = throttle(text => { if (props.isMultiplayer && !isTranslator.value && !isSender.value) multiplayerStore.sendGameAction({ type: 'TYPING_SYNC', text }) }, 150)
  function onTyping () { emitTyping(rawInput.value) }

  watch(() => multiplayerStore.lastMessage, msg => {
    if (!msg) return
    if (msg.type === 'ROUND_ENDED_BY_WINNER') { gameFinished.value = true; emitExit() }
    if (msg.type === 'GAME_ACTION' && msg.action?.type === 'ADVANCE_LETTER' && (isSender.value || isTranslator.value)) {
      roscoLetters.value[msg.action.index].status = msg.action.status; score.value = msg.action.score; 
      if (msg.action.status === 'correct') {
        timeLeft.value = Math.min(timeLeft.value + 20, 999);
      }
      advanceTurn()
    }
    if (msg.type === 'GAME_ACTION' && msg.action?.type === 'ROSCO_SYNC' && !isHost.value) { 
      roscoLetters.value = msg.action.data; 
      currentIndex.value = 0;
      rocketPos.x = starPoints[0].x;
      rocketPos.y = starPoints[0].y;
    }
    
    if (msg.type === 'GAME_ROLES_SWAPPED') {
      feedbackMessage.value = '¡CAMBIO DE ROLES!'; feedbackColor.value = 'warning'; showFeedback.value = true
      setTimeout(() => showFeedback.value = false, 2000)
    }

    if (msg.type === 'GAME_ACTION') {
      if (msg.action?.type === 'TIME_SYNC' && !isHost.value) {
        timeLeft.value = msg.action.timeLeft
        if (timeLeft.value <= 0) finishGame()
      }
      if (msg.action?.type === 'SCORE_UPDATE' && !isHost.value) score.value = msg.action.score
      if (msg.action?.type === 'REQUEST_ROSCO_SYNC' && isHost.value) {
        multiplayerStore.sendGameAction({ type: 'ROSCO_SYNC', data: roscoLetters.value })
      }
      // Sincronizar avance de letra para todo el equipo (pistas, cohete, etc.)
      if (msg.action?.type === 'ADVANCE_LETTER' && msg.from !== astroStore.user) {
        roscoLetters.value[msg.action.index].status = msg.action.status;
        if (msg.action.status === 'correct' && isHost.value) {
           timeLeft.value = Math.min(timeLeft.value + 20, 999);
           score.value += 100;
        }
        if (isHost.value) advanceTurn();
      }
      if (msg.action?.type === 'INDEX_SYNC' && !isHost.value) {
        const nextIdx = msg.action.index;
        const prevIdx = currentIndex.value;
        visitedSegments.value.add(prevIdx);
        animateRocket(prevIdx, nextIdx).then(() => {
          currentIndex.value = nextIdx;
          rawInput.value = '';
        });
      }
      if (msg.action?.type === 'ROSCO_ROUND_END') {
        feedbackMessage.value = '¡NIVELL COMPLETAT! GENERANT NOVES LLETRES...';
        feedbackColor.value = 'success';
        showFeedback.value = true;
        setTimeout(() => showFeedback.value = false, 2800);
      }
    }
  })

  watch(score, newScore => { if (props.isMultiplayer && isHost.value) multiplayerStore.sendGameAction({ type: 'SCORE_UPDATE', score: newScore }) })
  onUnmounted(() => { if (timerInterval) clearInterval(timerInterval) })
  function clearInput () { rawInput.value = ''; onTyping() }

  function animateRocket (fromIdx, toIdx) {
    return new Promise(resolve => {
      if (document.hidden) return resolve()
      const startPointIdx = letterPositions[fromIdx], endPointIdx = letterPositions[toIdx], path = []
      let curr = startPointIdx; while (curr !== endPointIdx) { curr = (curr + 1) % 10; path.push(starPoints[curr]) }
      rocketAnimating.value = true; trailParticles.value = []
      const durationPerStep = 200, animateStep = stepIdx => {
        if (stepIdx >= path.length) { setTimeout(() => { rocketAnimating.value = false; trailParticles.value = []; resolve() }, 50); return }
        const from = stepIdx === 0 ? starPoints[startPointIdx] : path[stepIdx - 1], to = path[stepIdx], startTime = Date.now()
        const animate = () => {
          const elapsed = Date.now() - startTime, progress = Math.min(elapsed / durationPerStep, 1)
          rocketPos.x = from.x + (to.x - from.x) * progress; rocketPos.y = from.y + (to.y - from.y) * progress
          if (progress < 1) {
            trailParticles.value.push({ x: rocketPos.x + (Math.random() - 0.5) * 8, y: rocketPos.y + (Math.random() - 0.5) * 8, r: Math.random() * 3 + 1, color: '#00e5ff', opacity: 1 })
            if (trailParticles.value.length > 20) trailParticles.value.shift()
            requestAnimationFrame(animate)
          } else animateStep(stepIdx + 1)
        }; requestAnimationFrame(animate)
      }; animateStep(0)
    })
  }

  function isTipGlowing (tipIdx) { return roscoLetters.value[tipIdx]?.status === 'correct' }
  function isSegmentGlowing (segIdx) { return roscoLetters.value.some((l, i) => l.status === 'correct' && (segIdx === i * 2 || segIdx === (i * 2 - 1 + 10) % 10)) }

  async function checkAnswer () {
    if (!rawInput.value.trim() || isChecking.value || isTranslator.value || isSender.value) return
    isChecking.value = true
    const userAnswer = normalize(rawInput.value), correctAnswer = normalize(currentLetter.value.answer)
    if (userAnswer === correctAnswer) {
      roscoLetters.value[currentIndex.value].status = 'correct'; score.value += 100; attempts.value = 0; feedbackMessage.value = 'Correcte!'; feedbackColor.value = 'success'
      timeLeft.value = Math.min(timeLeft.value + 20, 999);
      showFeedback.value = true; syncAndAdvance('correct')
    } else {
      attempts.value++
      if (attempts.value >= 3) {
        roscoLetters.value[currentIndex.value].status = 'incorrect';
        attempts.value = 0;
        feedbackMessage.value = `Incorrecte! Era "${currentLetter.value.answer}"`;
        feedbackColor.value = 'error';
        showFeedback.value = true;
        syncAndAdvance('incorrect');
      } else {
        feedbackMessage.value = `Incorrecte! ${attempts.value}/3`;
        feedbackColor.value = 'warning';
        showFeedback.value = true;
        isChecking.value = false;
        setTimeout(() => showFeedback.value = false, 1000);
      }
    }
  }

  function syncAndAdvance (status) {
    if (props.isMultiplayer) {
      multiplayerStore.sendGameAction({ type: 'ADVANCE_LETTER', index: currentIndex.value, status, score: score.value })
      setTimeout(async () => { 
        showFeedback.value = false; rawInput.value = ''; onTyping(); 
        if (isHost.value) await advanceTurn(); 
        isChecking.value = false 
      }, 1200)
    } else {
      setTimeout(async () => { showFeedback.value = false; rawInput.value = ''; await advanceTurn(); isChecking.value = false }, 1200)
    }
  }

  function pasapalabra () {
    if (isChecking.value || isTranslator.value || isSender.value) return
    rawInput.value = ''; attempts.value = 0; onTyping()
    if (props.isMultiplayer) {
      multiplayerStore.sendGameAction({ type: 'ADVANCE_LETTER', index: currentIndex.value, status: 'pending', score: score.value })
      if (isHost.value) advanceTurn()
    } else {
      advanceTurn()
    }
  }

  async function advanceTurn () {
    if (gameFinished.value || !roscoLetters.value.length) return
    const prevIndex = currentIndex.value; let nextIdx = -1
    for (let i = currentIndex.value + 1; i < roscoLetters.value.length; i++) if (roscoLetters.value[i].status === 'pending') { nextIdx = i; break }
    if (nextIdx === -1) for (let i = 0; i < currentIndex.value; i++) if (roscoLetters.value[i].status === 'pending') { nextIdx = i; break }
    if (nextIdx === -1) {
      if (timeLeft.value > 0) {
        if (!props.isMultiplayer || isHost.value) {
          if (props.isMultiplayer) multiplayerStore.sendGameAction({ type: 'ROSCO_ROUND_END' });
          feedbackMessage.value = '¡NIVELL COMPLETAT! GENERANT NOVES LLETRES...';
          feedbackColor.value = 'success';
          showFeedback.value = true;
          setTimeout(() => {
            showFeedback.value = false;
            initRosco(true);
          }, 3000);
        }
      } else {
        finishGame()
      }
    }
    else { 
      visitedSegments.value.add(prevIndex); 
      if (props.isMultiplayer && isHost.value) {
        multiplayerStore.sendGameAction({ type: 'INDEX_SYNC', index: nextIdx })
      }
      await animateRocket(prevIndex, nextIdx); 
      currentIndex.value = nextIdx 
    }
  }

  function finishGame (silent = false) {
    if (gameFinished.value) return
    if (props.isMultiplayer && !silent) { if (timerInterval) clearInterval(timerInterval); multiplayerStore.submitRoundResult(); return }
    gameFinished.value = true; if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
  }

  function startTimer () {
    if (timerInterval) clearInterval(timerInterval)
    let lastTick = Date.now()
    timerInterval = setInterval(() => {
      if (gameFinished.value) return
      if (!props.isMultiplayer || isHost.value) {
        const now = Date.now()
        const delta = Math.floor((now - lastTick) / 1000)
        if (delta >= 1) {
          timeLeft.value = Math.max(0, timeLeft.value - delta)
          lastTick += delta * 1000
          
          if (props.isMultiplayer && isHost.value) {
            multiplayerStore.sendGameAction({ type: 'TIME_SYNC', timeLeft: timeLeft.value })
          }

          if (timeLeft.value === 0) finishGame()
        }
      }
    }, 500)
  }

  function emitExit () { emit('game-over', finalReward.value) }
  function getBubbleClass (letter, index) { if (index === currentIndex.value && !gameFinished.value) return 'node-current'; if (letter.status === 'correct') return 'node-correct'; if (letter.status === 'incorrect') return 'node-incorrect'; return 'node-pending' }
  function getStarNodeStyle (index) { const point = starPoints[letterPositions[index]]; return { left: `${(point.x / 400) * 100}%`, top: `${(point.y / 400) * 100}%` } }
  function getChipColor (letter) { if (letter.status === 'correct') return 'success'; if (letter.status === 'incorrect') return 'error'; return 'grey' }
</script>

<style scoped>
.game-container { background-color: #0b0f19; }
.hide-cursor { cursor: none; }
.opendyslexic { font-family: 'OpenDyslexic', sans-serif !important; }
.star-col { min-height: 420px; }
.star-wrapper { position: relative; width: 400px; height: 400px; }
.star-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
.star-line { stroke: rgba(0, 229, 255, 0.4); stroke-width: 2.5; stroke-linecap: round; transition: all 0.5s ease; }
.star-line.line-glowing { stroke: #00e5ff; stroke-width: 6; filter: drop-shadow(0 0 12px rgba(0, 229, 255, 0.9)); opacity: 1; }
.star-tip-fill { fill: #00e5ff; opacity: 0; transition: opacity 0.8s ease; pointer-events: none; }
.star-tip-fill.tip-glowing { opacity: 0.6; filter: blur(2px) drop-shadow(0 0 15px rgba(0, 229, 255, 0.8)); }
.star-node { position: absolute; width: 60px; height: 60px; border-radius: 50%; display: flex; justify-content: center; align-items: center; z-index: 10; transform: translate(-50%, -50%); transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); border: 3px solid rgba(255, 255, 255, 0.2); }
.node-letter { font-size: 1.5rem; font-weight: 900; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.5); z-index: 2; }
.node-pending { background: linear-gradient(145deg, #1e3a5f, #0d1b30); box-shadow: 0 4px 15px rgba(30, 58, 95, 0.5); border-color: rgba(100, 180, 255, 0.3); }
.node-current { background: linear-gradient(145deg, #00e5ff, #0097a7); box-shadow: 0 0 30px rgba(0, 229, 255, 0.6), 0 0 60px rgba(0, 229, 255, 0.2); border-color: #80DEEA; animation: node-float 2s ease-in-out infinite; width: 70px; height: 70px; }
.node-current .node-letter { color: #0b0f19; }
.node-correct { background: linear-gradient(145deg, #43a047, #1b5e20); box-shadow: 0 0 20px rgba(76, 175, 80, 0.6); border-color: #69f0ae; }
.node-incorrect { background: linear-gradient(145deg, #e53935, #b71c1c); box-shadow: 0 0 20px rgba(244, 67, 54, 0.6); border-color: #ff8a80; }
.node-pulse { position: absolute; top: -8px; left: -8px; right: -8px; bottom: -8px; border-radius: 50%; border: 2px solid #00e5ff; animation: pulse-ring 1.5s ease-out infinite; z-index: 0; }
@keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.5); opacity: 0; } }
@keyframes node-float { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, calc(-50% - 6px)) scale(1.05); } }
.star-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100px; height: 100px; display: flex; flex-direction: column; justify-content: center; align-items: center; background: radial-gradient(circle, rgba(0, 229, 255, 0.2) 0%, rgba(5, 5, 20, 1) 90%); border: 3px solid rgba(0, 229, 255, 0.5); border-radius: 50%; box-shadow: 0 0 40px rgba(0, 229, 255, 0.3); z-index: 5; }
.center-letter { color: #00e5ff; text-shadow: 0 0 15px rgba(0, 229, 255, 0.6); line-height: 1; font-size: 2rem !important; }
.rocket-trail-group circle { transition: all 0.05s linear; }
.spelling-input :deep(.v-field__input) { color: #00e5ff !important; font-size: 1.3rem; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; font-family: 'OpenDyslexic', sans-serif !important; }
.ghost-text-container { background: rgba(0, 229, 255, 0.05); border: 2px dashed rgba(0, 229, 255, 0.3); min-height: 80px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
.typing-indicator { width: 60%; opacity: 0.7; }
.hieroglyph-internal-container { perspective: 1000px; }
.hieroglyph-box { width: 60px; height: 60px; background: linear-gradient(135deg, #263238 0%, #102027 100%); border: 2px solid #00e5ff; border-radius: 12px; display: flex; justify-content: center; align-items: center; }
.emoji-text { font-size: 2rem; }
.emoji-grid-internal { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; max-height: 250px; overflow-y: auto; padding-right: 4px; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.1); }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 229, 255, 0.3); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 229, 255, 0.5); }
.emoji-btn-internal { width: 40px; height: 40px; }
.emoji-history-internal { min-height: 80px; border: 2px solid rgba(0, 229, 255, 0.3); background: rgba(49, 27, 146, 0.4); }
.min-chat-bubble-internal { min-height: 50px; align-items: center; }
.emoji-item-internal { background: rgba(255, 255, 255, 0.1); padding: 2px; border-radius: 8px; }
.emoji-tabs :deep(.v-slide-group__content) { justify-content: center; }
.emoji-tabs :deep(.v-tab) { min-width: 44px; padding: 0; }
@keyframes pop-in { 0% { transform: scale(0); opacity: 0; } 80% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
.animate-pop-in { animation: pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
</style>
