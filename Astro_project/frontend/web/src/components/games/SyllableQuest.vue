<!-- SyllableQuest.vue (Resum de la lògica) -->
<template>
  <v-container class="text-center">
    <v-card class="pa-6 bg-slate-900 border-amber" rounded="xl">
      <div class="text-h4 mb-6">{{ currentWord.text }}</div>
      
      <!-- Representació de les síl·labes (buits a omplir) -->
      <div class="d-flex justify-center gap-4 mb-8">
        <v-avatar
          v-for="n in currentWord.syllables"
          :key="n"
          :color="userSyllables >= n ? 'amber-accent-3' : 'grey-darken-3'"
          size="60"
          class="elevation-4"
        >
          <v-icon v-if="userSyllables >= n">mdi-music-note</v-icon>
        </v-avatar>
      </div>

      <v-btn 
        @click="addSyllable" 
        size="x-large" 
        color="amber-accent-3" 
        icon="mdi-hand-clap"
        class="mb-4"
      ></v-btn>
      
      <p class="text-subtitle-1">Fes un "clic" per cada síl·laba!</p>
      
      <v-btn @click="checkSyllables" color="success" block>Comprovar</v-btn>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
const words = [{ text: 'OR-DI-NA-DOR', syllables: 4 }, { text: 'CA-SA', syllables: 2 }];
const currentWord = ref(words[0]);
const userSyllables = ref(0);

const addSyllable = () => {
  if (userSyllables.value < 6) userSyllables.value++;
  // Idealment: reproduir un so de "percussió" aquí
};

const checkSyllables = () => {
  if (userSyllables.value === currentWord.value.syllables) {
    // Victoria!
  } else {
    userSyllables.value = 0; // Reinicia
  }
};
</script>