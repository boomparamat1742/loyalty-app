<script setup>
const supabase = useSupabase()
const profile = ref(null)

onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  const user = data.user
  if (!user) return

  const { data: p } = await supabase
    .from("profiles")
    .select("email, points, role")
    .eq("id", user.id)
    .single()

  profile.value = p
})

const logout = async () => {
  await supabase.auth.signOut()
  navigateTo("/auth/login")
}
</script>

<template>
  <div style="padding: 24px">
    <a-typography-title :level="3">Customer Dashboard</a-typography-title>

    <a-card style="max-width: 520px; border-radius: 16px">
      <p><b>Email:</b> {{ profile?.email }}</p>
      <p><b>Points:</b> {{ profile?.points }}</p>
      <p><b>Role:</b> {{ profile?.role }}</p>

      <a-button danger @click="logout">Logout</a-button>
    </a-card>
  </div>
</template>
