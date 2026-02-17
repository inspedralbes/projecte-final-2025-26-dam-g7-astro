<template>
  <!-- Empty template as we redirect in the script -->
</template>

<script setup>
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const router = useRouter()

onMounted(() => {
  router.push('/menu')
})
</script>
