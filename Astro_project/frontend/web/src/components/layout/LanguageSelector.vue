<template>
  <v-menu offset-y transition="slide-y-transition">
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind="props"
        variant="outlined"
        color="cyan-accent-2"
        class="language-btn glass-effect px-4"
        rounded="xl"
      >
        <v-icon start icon="mdi-translate" size="small"></v-icon>
        <span class="font-weight-bold">{{ currentLangCode }}</span>
        <v-icon end icon="mdi-chevron-down" size="small"></v-icon>
      </v-btn>
    </template>

    <v-list class="glass-menu pa-2 mt-2" elevation="12">
      <v-list-item
        v-for="lang in languageList"
        :key="lang.value"
        @click="changeLanguage(lang.value)"
        :class="{ 'active-lang': locale === lang.value }"
        class="rounded-lg mb-1 lang-item"
      >
        <template v-slot:prepend>
          <span class="mr-3 lang-code-badge">{{ lang.flag }}</span>
        </template>
        <v-list-item-title class="text-white font-weight-medium">
          {{ $t(lang.labelKey) }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const languageList = [
  { labelKey: 'languages.es', value: 'es', flag: 'ES' },
  { labelKey: 'languages.ca', value: 'ca', flag: 'CA' },
  { labelKey: 'languages.en', value: 'en', flag: 'EN' }
]

const currentLangCode = computed(() => {
  return locale.value.toUpperCase()
})

const changeLanguage = (newLang) => {
  locale.value = newLang
  localStorage.setItem('astro_language', newLang)
}
</script>

<style scoped>
.glass-effect {
  background: rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 229, 255, 0.3) !important;
  transition: all 0.3s ease;
}

.glass-effect:hover {
  background: rgba(0, 229, 255, 0.1) !important;
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.2) !important;
}

.glass-menu {
  background: rgba(15, 15, 26, 0.95) !important;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 180px;
}

.lang-item {
  transition: background 0.2s ease;
}

.lang-item:hover {
  background: rgba(255, 255, 255, 0.05) !important;
}

.active-lang {
  background: rgba(0, 229, 255, 0.15) !important;
  border-left: 3px solid #00e5ff !important;
}

.lang-code-badge {
  font-family: 'Roboto Mono', monospace;
  font-weight: 800;
  font-size: 0.7rem;
  color: #00e5ff;
  background: rgba(0, 229, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  min-width: 32px;
  display: inline-block;
  text-align: center;
  border: 1px solid rgba(0, 229, 255, 0.3);
}
</style>
