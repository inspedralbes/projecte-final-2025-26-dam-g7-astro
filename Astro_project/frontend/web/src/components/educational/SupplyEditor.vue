
<template>
  <div class="supply-editor">
    <!-- SELECCIÓ DE JOC -->
    <div v-if="!selectedGame">
      <h3 class="text-h4 font-weight-black text-white mb-6">SELECCIONA UN JOC</h3>
      <v-row>
        <v-col v-for="game in games" :key="game.id" cols="12" sm="6" lg="4">
          <v-card class="game-select-card pa-6 text-center" @click="selectGame(game)">
            <v-icon :icon="game.icon" size="64" color="cyan-accent-3" class="mb-4"></v-icon>
            <h4 class="text-h6 font-weight-bold text-white">{{ game.name }}</h4>
            <p class="text-caption text-grey-lighten-1">{{ game.description }}</p>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- GESTIÓ DEL JOC SELECCIONAT -->
    <div v-else>
      <div class="d-flex align-center mb-6 ga-4 flex-wrap">
        <v-btn icon="mdi-arrow-left" variant="tonal" color="white" @click="selectedGame = null"></v-btn>
        <h3 class="text-h4 font-weight-black text-white">EDITOR: {{ selectedGame.name }}</h3>
        
        <!-- Filtre per Profe (Només per a CENTRES) -->
        <v-select
          v-if="astroStore.role === 'CENTER'"
          v-model="teacherFilter"
          :items="teacherOptions"
          label="Filtrar per Professor"
          density="compact"
          hide-details
          class="max-w-xs ml-4"
          variant="solo-filled"
        ></v-select>

        <v-spacer></v-spacer>
        <v-btn color="orange-accent-3" prepend-icon="mdi-plus" @click="openNewSetDialog">NOU EXERCICI</v-btn>
      </div>

      <!-- LLISTA DE SETS EXISTENTS PER AQUEST JOC -->
      <v-row>
        <!-- Card Especial: Default (Sempre visible o seleccionable) -->
        <v-col cols="12" sm="6" lg="4">
          <v-card class="supply-card default-card" :class="{ 'active-set': !hasActiveCustomSet }">
             <div class="d-flex justify-space-between align-start mb-2">
              <h4 class="text-h6 font-weight-bold">Contingut per Defecte</h4>
              <v-chip v-if="!hasActiveCustomSet" color="green" size="x-small">ACTIU</v-chip>
            </div>
            <p class="text-caption text-grey mb-4">Usa les paraules prefab del sistema (Astronàutica, Tech, etc.).</p>
            <v-btn block size="small" :color="!hasActiveCustomSet ? 'grey' : 'cyan'" @click="activateDefault" :disabled="!hasActiveCustomSet">
                {{ !hasActiveCustomSet ? 'JA ESTÀ ACTIU' : 'TORNAR A PREDETERMINAT' }}
            </v-btn>
          </v-card>
        </v-col>

        <v-col v-for="set in filteredSets" :key="set._id" cols="12" sm="6" lg="4">
          <v-card class="supply-card" :class="{ 'active-set': set.active }">
            <div class="d-flex justify-space-between align-start mb-2">
              <div>
                <h4 class="text-h6 font-weight-bold">{{ set.name }}</h4>
                <div class="text-caption text-cyan-accent-1" v-if="astroStore.role === 'CENTER'">Autor: {{ set.ownerId }}</div>
              </div>
              <v-chip v-if="set.active" color="green" size="x-small">ACTIU</v-chip>
            </div>
            <p class="text-caption text-grey mb-4">{{ set.content.length }} paraules configurades.</p>
            <div class="d-flex ga-2">
              <v-btn flex-grow-1 size="small" :color="set.active ? 'grey' : 'cyan'" @click="activateSet(set)">
                {{ set.active ? 'DESACTIVAR' : 'ACTIVAR PER CLASE' }}
              </v-btn>
              <v-btn icon="mdi-pencil" size="x-small" color="amber" variant="text" @click="editSet(set)"></v-btn>
              <v-btn icon="mdi-delete" size="x-small" color="red-lighten-1" variant="text" @click="deleteSet(set._id)"></v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- DIÀLEG DE CREACIÓ/EDICIÓ -->
    <v-dialog v-model="showDialog" fullscreen transition="dialog-bottom-transition">
      <v-card class="editor-fullscreen">
        <v-toolbar color="cyan-darken-4">
          <v-btn icon="mdi-close" @click="showDialog = false"></v-btn>
          <v-toolbar-title>{{ editingId ? 'EDITAR' : 'NOU' }} EXERCICI: {{ selectedGame?.name }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn variant="flat" color="orange-accent-3" @click="saveExercise" :disabled="!isExerciseValid">GUARDAR CANVIS</v-btn>
        </v-toolbar>

        <v-container fluid class="pa-8 bg-editor fill-height align-start">
          <v-row class="fill-height">
            <!-- FASE 1: BANC DE PARAULES -->
            <v-col cols="12" md="6" class="d-flex flex-column">
              <div class="d-flex align-center justify-space-between mb-4">
                <h4 class="text-h5 font-weight-bold text-cyan-accent-2">1. BANC DE PARAULES</h4>
                <v-btn size="small" color="cyan-accent-4" @click="addWordToBank">AFEGIR PARAULA</v-btn>
              </div>
              
              <v-card class="bank-area flex-grow-1 pa-4 overflow-y-auto" variant="outlined">
                <div v-for="(item, idx) in wordBank" :key="idx" class="d-flex ga-2 mb-3 align-center bank-item pa-2 rounded-lg">
                   <v-icon icon="mdi-drag-variant" color="grey"></v-icon>
                   <v-text-field v-model="item.word" label="Paraula" density="compact" hide-details variant="solo-filled"></v-text-field>
                   <v-text-field v-model="item.hint" label="Pista" density="compact" hide-details variant="solo-filled"></v-text-field>
                   <v-btn icon="mdi-delete" size="x-small" color="red" variant="text" @click="wordBank.splice(idx, 1)"></v-btn>
                   <v-btn icon="mdi-arrow-right-bold" color="cyan" size="small" @click="moveToExercise(item)"></v-btn>
                </div>
              </v-card>
            </v-col>

            <!-- FASE 2: CONSTRUCTOR D'EXERCICI -->
            <v-col cols="12" md="6" class="d-flex flex-column">
              <div class="mb-4">
                <h4 class="text-h5 font-weight-bold text-orange-accent-2">2. CONFIGURACIÓ DE L'EXERCICI</h4>
                <v-text-field v-model="exerciseName" label="Nom de l'exercici" variant="underlined" color="orange-accent-2" class="mt-2"></v-text-field>
                
                <!-- Si és centre, pot triar per a quin professor és aquest set (si és nou) -->
                <v-select
                  v-if="astroStore.role === 'CENTER' && !editingId"
                  v-model="targetOwner"
                  :items="teacherOptions.filter(o => o.value !== 'all')"
                  label="Assignar a Professor"
                  variant="outlined"
                  class="mt-2"
                ></v-select>
              </div>

              <v-card class="exercise-area flex-grow-1 pa-4 overflow-y-auto" variant="outlined">
                <draggable v-model="exerciseContent" item-key="word" class="d-flex flex-column ga-2" ghost-class="ghost-card">
                  <template #item="{ element, index }">
                    <div class="d-flex align-center pa-3 bg-white-5 rounded-lg border-orange">
                      <v-chip color="orange" size="small" class="mr-3">{{ index + 1 }}</v-chip>
                      <div class="flex-grow-1">
                        <div class="text-subtitle-1 font-weight-bold">{{ element.word }}</div>
                        <div class="text-caption text-grey">{{ element.hint }}</div>
                      </div>
                      <v-btn icon="mdi-close" size="x-small" color="grey" variant="text" @click="removeFromExercise(index)"></v-btn>
                    </div>
                  </template>
                </draggable>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import draggable from 'vuedraggable'
import { useAstroStore } from '@/stores/astroStore'
import { useGroupStore } from '@/stores/groupStore'

const astroStore = useAstroStore()
const groupStore = useGroupStore()

const games = [
  { id: 'WordConstruction', name: 'Word Construction', icon: 'mdi-hammer-wrench', description: 'Construir paraules desordenades.' },
  { id: 'SyllableQuest', name: 'Syllable Quest', icon: 'mdi-dots-horizontal', description: 'Dividir en síl·labes.' },
  { id: 'SpelledRosco', name: 'Spelled Rosco', icon: 'mdi-alpha-a-circle', description: 'Endevinar per lletres.' },
  { id: 'RhymeSquad', name: 'Rhyme Squad', icon: 'mdi-music-note', description: 'Trobar rimes.' }
]

const selectedGame = ref(null)
const showDialog = ref(false)
const teacherFilter = ref('all')
const targetOwner = ref(astroStore.user)

// Editor State
const exerciseName = ref('')
const wordBank = ref([])
const exerciseContent = ref([])
const editingId = ref(null)

const teacherOptions = computed(() => {
  const options = [{ title: 'Tots els Profes', value: 'all' }]
  groupStore.members.forEach(m => {
    options.push({ title: m.username, value: m.username })
  })
  return options
})

const filteredSets = computed(() => {
  if (!selectedGame.value) return []
  let sets = groupStore.supplySets.filter(s => s.gameId === selectedGame.value.id)
  if (teacherFilter.value !== 'all') {
    sets = sets.filter(s => s.ownerId === teacherFilter.value)
  }
  return sets
})

const hasActiveCustomSet = computed(() => {
  return filteredSets.value.some(s => s.active)
})

const isExerciseValid = computed(() => exerciseName.value.trim().length > 0 && exerciseContent.value.length > 0)

const selectGame = (game) => {
  selectedGame.value = game
  refreshSupplies()
}

const refreshSupplies = async () => {
  if (astroStore.role === 'CENTER') {
    await groupStore.fetchCenterSupplies(astroStore.user)
  } else {
    await groupStore.fetchSupplySets(astroStore.user)
  }
}

const openNewSetDialog = () => {
  editingId.value = null
  exerciseName.value = ''
  wordBank.value = [{ word: '', hint: '' }]
  exerciseContent.value = []
  targetOwner.value = teacherFilter.value !== 'all' ? teacherFilter.value : astroStore.user
  showDialog.value = true
}

const editSet = (set) => {
  editingId.value = set._id
  exerciseName.value = set.name
  exerciseContent.value = [...set.content]
  wordBank.value = [...set.content] // Opcional: carregar les mateixes al banc
  showDialog.value = true
}

const saveExercise = async () => {
  const payload = {
    ownerId: editingId.value ? undefined : targetOwner.value, // El backend hauria de mantenir l'owner si s'edita
    gameId: selectedGame.value.id,
    name: exerciseName.value,
    type: 'words',
    content: exerciseContent.value
  }

  // Si és edició, hauríem de tenir una ruta PUT o passar l'ID
  // Per simplicitat, si hi ha editingId, podríem esborrar i crear, o modificar groupStore
  const result = await groupStore.saveSupplySet(payload)
  if (result.success) {
    showDialog.value = false
    refreshSupplies()
  }
}

const activateSet = async (set) => {
  // El centre activa per al professor que és owner del set
  await groupStore.activateSupplySet(set._id, set.ownerId, selectedGame.value.id)
  refreshSupplies()
}

const activateDefault = async () => {
    // Per tornar a default, cal desactivar tots els sets del profe actual (o tots els del filtre si som centre)
    const target = (astroStore.role === 'CENTER' && teacherFilter.value !== 'all') ? teacherFilter.value : astroStore.user
    // El backend desactiva si activem un id que no existeix o fem una ruta especial
    // Farem servir un truc: activem un ID inexistent per "netejar"
    await groupStore.activateSupplySet('none', target, selectedGame.value.id)
    refreshSupplies()
}

const deleteSet = async (id) => {
    if (confirm('Eliminar aquest exercici?')) {
        await groupStore.deleteSupplySet(id)
        refreshSupplies()
    }
}

const addWordToBank = () => wordBank.value.push({ word: '', hint: '' })
const moveToExercise = (item) => item.word.trim() !== '' && exerciseContent.value.push({ ...item })
const removeFromExercise = (index) => exerciseContent.value.splice(index, 1)

onMounted(() => {
    if (astroStore.role === 'CENTER') groupStore.fetchMembers(astroStore.user)
})
</script>

<style scoped>
.game-select-card {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(0, 242, 255, 0.1);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.game-select-card:hover {
  background: rgba(0, 242, 255, 0.1) !important;
  transform: translateY(-5px);
  border-color: #00f2ff;
}
.supply-card {
  background: rgba(255, 255, 255, 0.05) !important;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.default-card {
  border-style: dashed;
}
.active-set {
  border-color: #00e676;
  background: rgba(0, 230, 118, 0.05) !important;
}
.editor-fullscreen { background: #020617 !important; }
.bg-editor { background: radial-gradient(circle at top right, #0f172a, #020617); }
.bank-area, .exercise-area {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 400px;
}
.bank-item { background: rgba(255, 255, 255, 0.05); transition: background 0.2s; }
.bank-item:hover { background: rgba(255, 255, 255, 0.08); }
.bg-white-5 { background: rgba(255, 255, 255, 0.05); }
.border-orange { border: 1px solid rgba(255, 171, 0, 0.2); }
.ghost-card { opacity: 0.5; background: #ffab00 !important; }
.max-w-xs { max-width: 250px; }
</style>
