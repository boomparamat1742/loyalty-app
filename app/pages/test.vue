<script setup>
import { supabase } from "~/utils/supabaseClient"

onMounted(async () => {
  const { data, error } = await supabase.auth.getSession()
  console.log("session:", data, error)
})
</script>

<template>
  <div>Open DevTools Console (F12)</div>
</template>
