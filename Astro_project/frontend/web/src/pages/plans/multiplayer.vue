<template>
    <v-container fluid class="fill-height d-flex flex-column justify-center align-center">
        <h1 class="text-h2 mb-6 font-weight-bold tracking-wide">{{ $t('multiplayer.title') }}</h1>
        <p class="text-h5 mb-10 text-grey-lighten-1">{{ $t('multiplayer.description') }}</p>
        <v-btn to="/" color="cyan-accent-3" variant="outlined" rounded="xl" size="large">
            {{ $t('multiplayer.backButton') }}
        </v-btn>
    </v-container>
</template>

<script setup>
</script>

<style scoped>
.tracking-wide {
    letter-spacing: 2px;
    background: linear-gradient(to right, #00e5ff, #2979ff);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
</style>