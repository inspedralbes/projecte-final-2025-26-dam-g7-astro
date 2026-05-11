<template>
  <v-menu offset-y transition="slide-y-transition">
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind="props"
        variant="text"
        class="lang-minimal-btn"
        rounded="lg"
      >
        <span class="text-white text-caption font-weight-bold opacity-70 mr-1">{{ currentLangCode }}</span>
        <v-icon icon="mdi-chevron-down" size="14" color="white" class="opacity-50"></v-icon>
      </v-btn>
    </template>

    <v-list class="glass-menu-v3 pa-2 mt-2" elevation="24">
      <v-list-item
        v-for="lang in languageList"
        :key="lang.value"
        @click="changeLanguage(lang.value)"
        :class="{ 'active-lang-v3': locale === lang.value }"
        class="rounded-lg mb-1 lang-item-v3"
      >
        <v-list-item-title class="text-white font-weight-bold text-caption text-center">
          {{ lang.flag }} - {{ $t(lang.labelKey).toUpperCase() }}
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
.lang-minimal-btn {
  background: rgba(255, 255, 255, 0.05) !important;
  min-width: 0 !important;
  height: 36px !important;
  padding: 0 12px !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.lang-minimal-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

.glass-menu-v3 {
  background: rgba(5, 5, 10, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px !important;
  min-width: 140px;
}

.lang-item-v3 {
  transition: all 0.2s ease;
}

.lang-item-v3:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}

.active-lang-v3 {
  background: rgba(0, 242, 255, 0.1) !important;
  color: #00f2ff !important;
}

.opacity-70 { opacity: 0.7; }
.opacity-50 { opacity: 0.5; }
</style>
