<script setup>
import { useAuthStore } from "~/stores/auth"

const auth = useAuthStore()

onMounted(async () => {
  await auth.init()
})
</script>

<template>
  <NuxtPage />
</template>
