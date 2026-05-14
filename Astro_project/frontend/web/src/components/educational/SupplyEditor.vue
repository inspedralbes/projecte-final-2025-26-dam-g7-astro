<template>
  <div class="supply-editor">
    <!-- SELECCIÓ DE JOC -->
    <div v-if="!selectedGame">
      <h3 class="text-h4 font-weight-black text-white mb-6">{{ $t('educational.supplyEditorPage.selectGame') }}</h3>
      <v-row>
        <v-col
          v-for="game in games"
          :key="game.id"
          cols="12"
          lg="4"
          sm="6"
        >
          <v-card class="game-select-card pa-6 text-center" @click="selectGame(game)">
            <v-icon class="mb-4" color="cyan-accent-3" :icon="game.icon" size="64" />
            <h4 class="text-h6 font-weight-bold text-white">{{ game.name }}</h4>
            <p class="text-caption text-grey-lighten-1">{{ game.description }}</p>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- GESTIÓ DEL JOC SELECCIONAT -->
    <div v-else>
      <div class="d-flex align-center mb-6 ga-4 flex-wrap">
        <v-btn color="white" icon="mdi-arrow-left" variant="tonal" @click="selectedGame = null" />
        <h3 class="text-h4 font-weight-black text-white">{{ $t('educational.supplyEditorPage.editorTitle', { game: selectedGame.name }) }}</h3>

        <!-- Filtre per Profe (Només per a CENTRES) -->
        <v-select
          v-if="astroStore.role === 'CENTER'"
          v-model="teacherFilter"
          class="max-w-xs ml-4"
          density="compact"
          hide-details
          :items="teacherOptions"
          :label="$t('educational.supplyEditorPage.filterByTeacher')"
          variant="solo-filled"
        />

        <v-spacer />
        <v-btn color="orange-accent-3" prepend-icon="mdi-plus" @click="openNewSetDialog">{{ $t('educational.supplyEditorPage.newExercise') }}</v-btn>
      </div>

      <!-- LLISTA DE SETS EXISTENTS PER AQUEST JOC -->
      <v-row>
        <!-- Card Especial: Default (Sempre visible o seleccionable) -->
        <v-col cols="12" lg="4" sm="6">
          <v-card class="supply-card default-card" :class="{ 'active-set': !hasActiveCustomSet }">
            <div class="d-flex justify-space-between align-start mb-2">
              <h4 class="text-h6 font-weight-bold">{{ $t('educational.supplyEditorPage.defaultContent') }}</h4>
              <v-chip v-if="!hasActiveCustomSet" color="green" size="x-small">{{ $t('educational.supplyEditorPage.active') }}</v-chip>
            </div>
            <p class="text-caption text-grey mb-4">{{ $t('educational.supplyEditorPage.defaultDesc') }}</p>
            <v-btn
              block
              :color="!hasActiveCustomSet ? 'grey' : 'cyan'"
              :disabled="!hasActiveCustomSet"
              size="small"
              @click="activateDefault"
            >
              {{ !hasActiveCustomSet ? $t('educational.supplyEditorPage.alreadyActive') : $t('educational.supplyEditorPage.backToDefault') }}
            </v-btn>
          </v-card>
        </v-col>

        <v-col
          v-for="set in filteredSets"
          :key="set._id"
          cols="12"
          lg="4"
          sm="6"
        >
          <v-card class="supply-card" :class="{ 'active-set': set.active }">
            <div class="d-flex justify-space-between align-start mb-2">
              <div>
                <h4 class="text-h6 font-weight-bold">{{ set.name }}</h4>
                <div v-if="astroStore.role === 'CENTER'" class="text-caption text-cyan-accent-1">{{ $t('educational.supplyEditorPage.author', { name: set.ownerId }) }}</div>
              </div>
              <v-chip v-if="set.active" color="green" size="x-small">{{ $t('educational.supplyEditorPage.active') }}</v-chip>
            </div>
            <p class="text-caption text-grey mb-4">{{ $t('educational.supplyEditorPage.wordsConfigured', { count: set.content.length }) }}</p>
            <div class="d-flex ga-2">
              <v-btn :color="set.active ? 'grey' : 'cyan'" flex-grow-1 size="small" @click="activateSet(set)">
                {{ set.active ? $t('educational.supplyEditorPage.deactivate') : $t('educational.supplyEditorPage.activateForClass') }}
              </v-btn>
              <v-btn
                color="amber"
                icon="mdi-pencil"
                size="x-small"
                variant="text"
                @click="editSet(set)"
              />
              <v-btn
                color="red-lighten-1"
                icon="mdi-delete"
                size="x-small"
                variant="text"
                @click="deleteSet(set._id)"
              />
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- DIÀLEG DE CREACIÓ/EDICIÓ -->
    <v-dialog v-model="showDialog" fullscreen transition="dialog-bottom-transition">
      <v-card class="editor-fullscreen">
        <v-toolbar color="cyan-darken-4">
          <v-btn icon="mdi-close" @click="showDialog = false" />
          <v-toolbar-title>{{ editingId ? $t('educational.supplyEditorPage.editTitle', { game: selectedGame?.name }) : $t('educational.supplyEditorPage.newTitle', { game: selectedGame?.name }) }}</v-toolbar-title>
          <v-spacer />
          <v-btn class="mr-2" color="cyan-lighten-4" prepend-icon="mdi-download" variant="outlined" @click="exportExercise">
            {{ $t('educational.supplyEditorPage.exportJSON') }}
          </v-btn>
          <v-btn class="mr-4" color="cyan-lighten-4" prepend-icon="mdi-upload" variant="outlined" @click="triggerImport">
            {{ $t('educational.supplyEditorPage.importJSON') }}
          </v-btn>
          <v-btn color="orange-accent-3" :disabled="!isExerciseValid" variant="flat" @click="saveExercise">{{ $t('educational.supplyEditorPage.saveChanges') }}</v-btn>
        </v-toolbar>

        <input
          ref="importFile"
          accept=".json"
          style="display: none"
          type="file"
          @change="handleImport"
        />

        <v-container class="pa-8 bg-editor fill-height align-start" fluid>
          <v-row class="fill-height">
            <!-- FASE 1: BANC DE PARAULES -->
            <v-col class="d-flex flex-column" cols="12" md="6">
              <div class="d-flex align-center justify-space-between mb-4">
                <h4 class="text-h5 font-weight-bold text-cyan-accent-2">{{ $t('educational.supplyEditorPage.wordBankTitle') }}</h4>
                <v-btn color="cyan-accent-4" size="small" @click="addWordToBank">{{ $t('educational.supplyEditorPage.addWord') }}</v-btn>
              </div>

              <v-text-field
                v-model="wordBankSearch"
                class="mb-4 search-input-compact search-input-bank"
                clearable
                density="compact"
                hide-details
                :placeholder="$t('educational.supplyEditorPage.searchPlaceholder')"
                prepend-inner-icon="mdi-magnify"
                variant="solo-filled"
              />

              <v-card class="bank-area flex-grow-1 pa-4 overflow-y-auto" variant="outlined">
                <div v-for="item in filteredWordBank" :key="item.__editorId" class="d-flex ga-2 mb-3 align-center bank-item pa-2 rounded-lg">
                  <v-icon color="grey" icon="mdi-drag-variant" />
                  <div class="flex-grow-1 d-flex flex-column ga-2">
                    <div
                      v-for="field in currentGameFields"
                      :key="field.key"
                      class="d-flex align-center ga-2"
                    >
                      <v-text-field
                        v-model="item[field.key]"
                        class="flex-grow-1"
                        density="compact"
                        hide-details
                        :label="field.label"
                        :placeholder="field.type === 'list' ? $t('educational.supplyEditorPage.listPlaceholder') : undefined"
                        :type="field.type === 'number' ? 'number' : 'text'"
                        variant="solo-filled"
                      />
                      <v-tooltip v-if="field.help" location="top">
                        <template #activator="{ props: tooltipProps }">
                          <v-btn
                            v-bind="tooltipProps"
                            color="cyan-accent-2"
                            density="comfortable"
                            icon="mdi-help-circle-outline"
                            size="x-small"
                            variant="text"
                          />
                        </template>
                        <span>{{ field.help }}</span>
                      </v-tooltip>
                    </div>
                  </div>
                  <v-btn
                    color="red"
                    icon="mdi-delete"
                    size="x-small"
                    variant="text"
                    @click="removeFromBank(item)"
                  />
                  <v-btn color="cyan" icon="mdi-arrow-right-bold" size="small" @click="moveToExercise(item)" />
                </div>
              </v-card>
            </v-col>

            <!-- FASE 2: CONSTRUCTOR D'EXERCICI -->
            <v-col class="d-flex flex-column" cols="12" md="6">
              <div class="mb-4">
                <h4 class="text-h5 font-weight-bold text-orange-accent-2">{{ $t('educational.supplyEditorPage.configExerciseTitle') }}</h4>
                <v-text-field
                  v-model="exerciseName"
                  class="mt-2"
                  color="orange-accent-2"
                  :label="$t('educational.supplyEditorPage.exerciseNameLabel')"
                  variant="underlined"
                />

                <v-text-field
                  v-model="exerciseSearch"
                  class="mt-2 search-input-compact"
                  clearable
                  density="compact"
                  hide-details
                  :placeholder="$t('educational.supplyEditorPage.exerciseSearchPlaceholder')"
                  prepend-inner-icon="mdi-magnify"
                  variant="solo-filled"
                />

                <!-- Si és centre, pot triar per a quin professor és aquest set (si és nou) -->
                <v-select
                  v-if="astroStore.role === 'CENTER' && !editingId"
                  v-model="targetOwner"
                  class="mt-2"
                  :items="teacherOptions.filter(o => o.value !== 'all')"
                  :label="$t('educational.supplyEditorPage.assignToTeacher')"
                  variant="outlined"
                />
              </div>

              <v-card class="exercise-area flex-grow-1 pa-4 overflow-y-auto" variant="outlined">
                <draggable
                  v-if="!isExerciseSearchActive"
                  v-model="exerciseContent"
                  class="d-flex flex-column ga-2"
                  ghost-class="ghost-card"
                  item-key="__editorId"
                >
                  <template #item="{ element, index }">
                    <div class="d-flex align-center pa-3 bg-white-5 rounded-lg border-orange">
                      <v-chip class="mr-3" color="orange" size="small">{{ index + 1 }}</v-chip>
                      <div class="flex-grow-1">
                        <div class="text-subtitle-1 font-weight-bold">{{ formatItemTitle(element) }}</div>
                        <div v-if="formatItemSubtitle(element)" class="text-caption text-grey">{{ formatItemSubtitle(element) }}</div>
                      </div>
                      <v-btn
                        color="grey"
                        icon="mdi-close"
                        size="x-small"
                        variant="text"
                        @click="removeFromExercise(element)"
                      />
                    </div>
                  </template>
                </draggable>

                <div v-else class="d-flex flex-column ga-2">
                  <div
                    v-for="(element, index) in filteredExerciseContent"
                    :key="element.__editorId"
                    class="d-flex align-center pa-3 bg-white-5 rounded-lg border-orange"
                  >
                    <v-chip class="mr-3" color="orange" size="small">{{ index + 1 }}</v-chip>
                    <div class="flex-grow-1">
                      <div class="text-subtitle-1 font-weight-bold">{{ formatItemTitle(element) }}</div>
                      <div v-if="formatItemSubtitle(element)" class="text-caption text-grey">{{ formatItemSubtitle(element) }}</div>
                    </div>
                    <v-btn
                      color="grey"
                      icon="mdi-close"
                      size="x-small"
                      variant="text"
                      @click="removeFromExercise(element)"
                    />
                  </div>
                  <div v-if="filteredExerciseContent.length === 0" class="text-caption text-grey text-center py-4">
                    {{ $t('educational.supplyEditorPage.noResults') }}
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import draggable from 'vuedraggable'
  import { useAstroStore } from '@/stores/astroStore'
  import { useGroupStore } from '@/stores/groupStore'

  const { t } = useI18n()
  const astroStore = useAstroStore()
  const groupStore = useGroupStore()

  const games = computed(() => [
    { id: 'WordConstruction', name: t('educational.supplyEditorPage.games.WordConstruction.name'), icon: 'mdi-hammer-wrench', description: t('educational.supplyEditorPage.games.WordConstruction.desc') },
    { id: 'SyllableQuest', name: t('educational.supplyEditorPage.games.SyllableQuest.name'), icon: 'mdi-dots-horizontal', description: t('educational.supplyEditorPage.games.SyllableQuest.desc') },
    { id: 'SpelledRosco', name: t('educational.supplyEditorPage.games.SpelledRosco.name'), icon: 'mdi-alpha-a-circle', description: t('educational.supplyEditorPage.games.SpelledRosco.desc') },
    { id: 'RhymeSquad', name: t('educational.supplyEditorPage.games.RhymeSquad.name'), icon: 'mdi-music-note', description: t('educational.supplyEditorPage.games.RhymeSquad.desc') },
    { id: 'RadarScan', name: t('educational.supplyEditorPage.games.RadarScan.name'), icon: 'mdi-radar', description: t('educational.supplyEditorPage.games.RadarScan.desc') },
    { id: 'RadioSignal', name: t('educational.supplyEditorPage.games.RadioSignal.name'), icon: 'mdi-radio-tower', description: t('educational.supplyEditorPage.games.RadioSignal.desc') },
    { id: 'SymmetryBreaker', name: t('educational.supplyEditorPage.games.SymmetryBreaker.name'), icon: 'mdi-target-variant', description: t('educational.supplyEditorPage.games.SymmetryBreaker.desc') },
  ])

  const selectedGame = ref(null)
  const showDialog = ref(false)
  const teacherFilter = ref('all')
  const targetOwner = ref(astroStore.user)
  let editorItemId = 0

  // Editor State
  const exerciseName = ref('')
  const wordBank = ref([])
  const exerciseContent = ref([])
  const editingId = ref(null)
  const importFile = ref(null)

  // Filtres de cerca
  const wordBankSearch = ref('')
  const exerciseSearch = ref('')

  const gameSchemas = computed(() => ({
    WordConstruction: {
      contentType: 'object',
      primaryKey: 'word',
      fields: [
        { key: 'word', labelKey: 'educational.supplyEditorPage.wordLabel', helpKey: 'educational.supplyEditorPage.fieldHelp.word', type: 'text', required: true },
        { key: 'hint', labelKey: 'educational.supplyEditorPage.hintLabel', helpKey: 'educational.supplyEditorPage.fieldHelp.hint', type: 'text', required: false },
      ],
    },
    SyllableQuest: {
      contentType: 'object',
      primaryKey: 'text',
      fields: [
        { key: 'text', labelKey: 'educational.supplyEditorPage.fieldLabels.text', helpKey: 'educational.supplyEditorPage.fieldHelp.text', type: 'text', required: true },
        { key: 'syllables', labelKey: 'educational.supplyEditorPage.fieldLabels.syllables', helpKey: 'educational.supplyEditorPage.fieldHelp.syllables', type: 'number', required: true },
      ],
    },
    SpelledRosco: {
      contentType: 'object',
      primaryKey: 'answer',
      fields: [
        { key: 'char', labelKey: 'educational.supplyEditorPage.fieldLabels.char', helpKey: 'educational.supplyEditorPage.fieldHelp.char', type: 'text', required: true },
        { key: 'question', labelKey: 'educational.supplyEditorPage.fieldLabels.question', helpKey: 'educational.supplyEditorPage.fieldHelp.question', type: 'text', required: true },
        { key: 'answer', labelKey: 'educational.supplyEditorPage.fieldLabels.answer', helpKey: 'educational.supplyEditorPage.fieldHelp.answer', type: 'text', required: true },
      ],
    },
    RhymeSquad: {
      contentType: 'object',
      primaryKey: 'word',
      fields: [
        { key: 'word', labelKey: 'educational.supplyEditorPage.wordLabel', helpKey: 'educational.supplyEditorPage.fieldHelp.word', type: 'text', required: true },
        { key: 'ending', labelKey: 'educational.supplyEditorPage.fieldLabels.ending', helpKey: 'educational.supplyEditorPage.fieldHelp.ending', type: 'text', required: true },
        { key: 'rhymes', labelKey: 'educational.supplyEditorPage.fieldLabels.rhymes', helpKey: 'educational.supplyEditorPage.fieldHelp.rhymes', type: 'list', required: true },
        { key: 'fakes', labelKey: 'educational.supplyEditorPage.fieldLabels.fakes', helpKey: 'educational.supplyEditorPage.fieldHelp.fakes', type: 'list', required: true },
      ],
    },
    RadarScan: {
      contentType: 'object',
      primaryKey: 'target',
      fields: [
        {
          key: 'distractor',
          labelKey: 'educational.supplyEditorPage.fieldLabels.distractor',
          helpKey: 'educational.supplyEditorPage.fieldHelp.distractor',
          type: 'text',
          required: true,
        },
        { key: 'target', labelKey: 'educational.supplyEditorPage.fieldLabels.target', helpKey: 'educational.supplyEditorPage.fieldHelp.target', type: 'text', required: true },
        { key: 'grid', labelKey: 'educational.supplyEditorPage.fieldLabels.grid', helpKey: 'educational.supplyEditorPage.fieldHelp.grid', type: 'number', required: true },
        { key: 'tunnel', labelKey: 'educational.supplyEditorPage.fieldLabels.tunnel', helpKey: 'educational.supplyEditorPage.fieldHelp.tunnel', type: 'number', required: true },
      ],
    },
    RadioSignal: {
      contentType: 'string',
      primaryKey: 'phrase',
      fields: [
        { key: 'phrase', labelKey: 'educational.supplyEditorPage.fieldLabels.phrase', helpKey: 'educational.supplyEditorPage.fieldHelp.phrase', type: 'text', required: true },
      ],
    },
    SymmetryBreaker: {
      contentType: 'object',
      primaryKey: 'target',
      fields: [
        { key: 'target', labelKey: 'educational.supplyEditorPage.fieldLabels.target', helpKey: 'educational.supplyEditorPage.fieldHelp.target', type: 'text', required: true },
        { key: 'decoys', labelKey: 'educational.supplyEditorPage.fieldLabels.decoys', helpKey: 'educational.supplyEditorPage.fieldHelp.decoys', type: 'list', required: true },
      ],
    },
  }))

  const currentGameId = computed(() => selectedGame.value?.id || 'WordConstruction')
  const currentGameSchema = computed(() => gameSchemas.value[currentGameId.value] || gameSchemas.value.WordConstruction)
  const currentGameFields = computed(() => currentGameSchema.value.fields.map(field => ({
    ...field,
    label: field.labelKey ? t(field.labelKey) : field.key,
    help: field.helpKey ? t(field.helpKey) : '',
  })))

  function parseCommaList (value) {
    if (Array.isArray(value)) {
      return value.map(v => String(v).trim()).filter(Boolean)
    }
    return String(value || '')
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)
  }

  function toText (value) {
    if (value === null || value === undefined) return ''
    return String(value)
  }

  function createEditorItem (rawItem = null) {
    const schema = currentGameSchema.value
    let source = rawItem || {}
    if (schema.contentType === 'string') {
      const firstFieldKey = schema.fields[0].key
      const scalarValue = (rawItem && typeof rawItem === 'object')
        ? (rawItem[firstFieldKey] ?? rawItem.text ?? '')
        : rawItem
      source = { [firstFieldKey]: scalarValue }
    }
    const item = { __editorId: `editor-${editorItemId++}` }

    for (const field of schema.fields) {
      const rawValue = source[field.key]
      if (field.type === 'list') {
        item[field.key] = Array.isArray(rawValue) ? rawValue.join(', ') : toText(rawValue)
      } else {
        item[field.key] = rawValue ?? ''
      }
    }

    return item
  }

  function cloneEditorItem (item) {
    const copy = {}
    for (const field of currentGameFields.value) {
      copy[field.key] = item[field.key]
    }
    return createEditorItem(copy)
  }

  function toSaveValue (item, field) {
    const rawValue = item[field.key]
    if (field.type === 'list') return parseCommaList(rawValue)
    if (field.type === 'number') {
      const parsed = Number(rawValue)
      return Number.isFinite(parsed) ? parsed : 0
    }
    return toText(rawValue).trim()
  }

  function toSaveItem (item) {
    const schema = currentGameSchema.value
    if (schema.contentType === 'string') {
      return toText(item[schema.fields[0].key]).trim()
    }
    const payload = {}
    for (const field of schema.fields) {
      payload[field.key] = toSaveValue(item, field)
    }
    return payload
  }

  function fieldHasValue (item, field) {
    const value = item[field.key]
    if (field.type === 'list') return parseCommaList(value).length > 0
    if (field.type === 'number') return Number.isFinite(Number(value))
    return toText(value).trim().length > 0
  }

  function isItemValid (item) {
    return currentGameFields.value.every(field => (field.required ? fieldHasValue(item, field) : true))
  }

  function getPrimaryValue (item) {
    const primaryField = currentGameFields.value.find(field => field.key === currentGameSchema.value.primaryKey) || currentGameFields.value[0]
    if (!primaryField) return ''
    if (primaryField.type === 'list') return parseCommaList(item[primaryField.key]).join(',').toLowerCase()
    return toText(item[primaryField.key]).trim().toLowerCase()
  }

  function getItemSearchText (item) {
    return currentGameFields.value
      .map(field => {
        if (field.type === 'list') return parseCommaList(item[field.key]).join(' ')
        return toText(item[field.key])
      })
      .join(' ')
      .toLowerCase()
  }

  function formatItemTitle (item) {
    const primaryField = currentGameFields.value.find(field => field.key === currentGameSchema.value.primaryKey) || currentGameFields.value[0]
    if (!primaryField) return ''
    if (primaryField.type === 'list') return parseCommaList(item[primaryField.key]).join(', ')
    return toText(item[primaryField.key]).trim()
  }

  function formatItemSubtitle (item) {
    const primaryKey = currentGameSchema.value.primaryKey
    const parts = currentGameFields.value
      .filter(field => field.key !== primaryKey)
      .map(field => {
        if (field.type === 'list') {
          const values = parseCommaList(item[field.key])
          return values.length > 0 ? `${field.label}: ${values.join(', ')}` : ''
        }
        const value = toText(item[field.key]).trim()
        return value ? `${field.label}: ${value}` : ''
      })
      .filter(Boolean)
    return parts.join(' • ')
  }

  function parseContentToEditorItems (content = []) {
    return (Array.isArray(content) ? content : [])
      .map(entry => createEditorItem(entry))
  }

  function exportExercise () {
    const data = {
      name: exerciseName.value,
      content: exerciseContent.value
        .filter(isItemValid)
        .map(toSaveItem),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${exerciseName.value || 'exercici'}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  function triggerImport () {
    importFile.value.click()
  }

  function handleImport (event) {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (data.name) exerciseName.value = data.name
        if (Array.isArray(data.content)) {
          const parsed = parseContentToEditorItems(data.content)
          exerciseContent.value = [...parsed]
          wordBank.value = [...parsed]
        }
      } catch (err) {
        console.error('Error al llegir el fitxer JSON:', err)
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const filteredWordBank = computed(() => {
    if (!wordBankSearch.value.trim()) return wordBank.value
    const query = wordBankSearch.value.toLowerCase().trim()
    return wordBank.value.filter(item => getItemSearchText(item).includes(query))
  })

  const normalizedExerciseSearch = computed(() => exerciseSearch.value.trim().toLowerCase())

  const isExerciseSearchActive = computed(() => normalizedExerciseSearch.value.length > 0)

  const filteredExerciseContent = computed(() => {
    if (!isExerciseSearchActive.value) return exerciseContent.value

    return exerciseContent.value.filter(item => getItemSearchText(item).includes(normalizedExerciseSearch.value))
  })

  const teacherOptions = computed(() => {
    const options = [{ title: t('educational.supplyEditorPage.allTeachers'), value: 'all' }]
    for (const m of groupStore.members) {
      options.push({ title: m.username, value: m.username })
    }
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

  function selectGame (game) {
    selectedGame.value = game
    refreshSupplies()
  }

  async function refreshSupplies () {
    await (astroStore.role === 'CENTER' ? groupStore.fetchCenterSupplies(astroStore.user) : groupStore.fetchSupplySets(astroStore.user))
  }

  function openNewSetDialog () {
    editingId.value = null
    exerciseName.value = ''
    wordBank.value = [createEditorItem()]
    exerciseContent.value = []
    targetOwner.value = teacherFilter.value === 'all' ? astroStore.user : teacherFilter.value
    showDialog.value = true
  }

  function editSet (set) {
    editingId.value = set._id
    exerciseName.value = set.name
    const parsed = parseContentToEditorItems(set.content)
    exerciseContent.value = [...parsed]
    wordBank.value = [...parsed]
    showDialog.value = true
  }

  async function saveExercise () {
    const normalizedContent = exerciseContent.value.map(toSaveItem)

    const payload = {
      ownerId: targetOwner.value || astroStore.user,
      gameId: selectedGame.value.id,
      name: exerciseName.value,
      type: 'words',
      content: normalizedContent,
    }

    // Si és edició, hauríem de tenir una ruta PUT o passar l'ID
    // Per simplicitat, si hi ha editingId, podríem esborrar i crear, o modificar groupStore
    const result = await groupStore.saveSupplySet(payload)
    if (result.success) {
      showDialog.value = false
      refreshSupplies()
    } else {
      console.error('Error guardant set educatiu:', result)
    }
  }

  async function activateSet (set) {
    // El centre activa per al professor que és owner del set
    await groupStore.activateSupplySet(set._id, set.ownerId, selectedGame.value.id)
    refreshSupplies()
  }

  async function activateDefault () {
    // Per tornar a default, cal desactivar tots els sets del profe actual (o tots els del filtre si som centre)
    const target = (astroStore.role === 'CENTER' && teacherFilter.value !== 'all') ? teacherFilter.value : astroStore.user
    // El backend desactiva si activem un id que no existeix o fem una ruta especial
    // Farem servir un truc: activem un ID inexistent per "netejar"
    await groupStore.activateSupplySet('none', target, selectedGame.value.id)
    refreshSupplies()
  }

  async function deleteSet (id) {
    if (confirm(t('educational.supplyEditorPage.deleteConfirm'))) {
      await groupStore.deleteSupplySet(id)
      refreshSupplies()
    }
  }

  const addWordToBank = () => wordBank.value.push(createEditorItem())

  function removeFromBank (item) {
    const index = wordBank.value.indexOf(item)
    if (index !== -1) wordBank.value.splice(index, 1)
  }

  function moveToExercise (item) {
    if (!isItemValid(item)) return

    const primary = getPrimaryValue(item)
    const exists = primary && exerciseContent.value.some(e => getPrimaryValue(e) === primary)
    if (exists) return

    exerciseContent.value.push(cloneEditorItem(item))
  }

  function removeFromExercise (item) {
    const index = exerciseContent.value.indexOf(item)
    if (index !== -1) exerciseContent.value.splice(index, 1)
  }

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

.search-input-compact {
  width: 100%;
}

.search-input-bank {
  max-width: none !important;
}

.search-input-compact :deep(.v-input__control) {
  min-height: 38px !important;
}

.search-input-compact :deep(.v-field__input) {
  min-height: 38px !important;
  height: 38px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  padding-inline: 10px !important;
  align-items: center;
}

.search-input-compact :deep(.v-field) {
  min-height: 38px !important;
  height: 38px !important;
  border-radius: 8px !important;
}

.search-input-compact :deep(.v-field__field) {
  min-height: 38px !important;
}

.search-input-compact :deep(.v-field__prepend-inner),
.search-input-compact :deep(.v-field__append-inner),
.search-input-compact :deep(.v-field__clearable) {
  height: 38px !important;
  display: flex !important;
  align-items: center !important;
  padding-top: 0 !important;
}
</style>
