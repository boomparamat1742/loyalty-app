<script setup>
import { message } from "ant-design-vue"

const supabase = useSupabase()
const route = useRoute()

const selected = computed(() => route.path)

const userEmail = ref("")
const loadingUser = ref(true)

const loadUser = async () => {
  try {
    loadingUser.value = true
    const { data } = await supabase.auth.getUser()
    userEmail.value = data?.user?.email || ""
  } finally {
    loadingUser.value = false
  }
}

onMounted(loadUser)

const logout = async () => {
  await supabase.auth.signOut()
  message.success("ออกจากระบบแล้ว")
  navigateTo("/auth/login")
}
</script>

<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider width="220" style="background:#fff">
      <div style="padding:16px; font-weight:800">Loyalty Admin</div>

      <a-menu mode="inline" :selectedKeys="[selected]">
        <a-menu-item key="/admin">
          <NuxtLink to="/admin">Dashboard</NuxtLink>
        </a-menu-item>
        <a-menu-item key="/admin/sales">
          <NuxtLink to="/admin/sales">ยอดขาย</NuxtLink>
        </a-menu-item>
        <a-menu-item key="/admin/rewards">
          <NuxtLink to="/admin/rewards">ของรางวัล</NuxtLink>
        </a-menu-item>
        <a-menu-item key="/admin/users">
          <NuxtLink to="/admin/users">ผู้ใช้</NuxtLink>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <!-- ✅ Top bar -->
      <a-layout-header
        style="background:#fff; padding:0 16px; display:flex; align-items:center; justify-content:space-between;"
      >
        <div style="font-weight:700">Admin</div>

        <a-space>
          <span style="opacity:.75" v-if="!loadingUser && userEmail">
            {{ userEmail }}
          </span>

          <!-- ถ้ายังไม่ได้ login ให้โชว์ปุ่ม Login -->
          <NuxtLink v-if="!loadingUser && !userEmail" to="/auth/login">
            <a-button type="primary">Login</a-button>
          </NuxtLink>

          <!-- ถ้า login แล้ว โชว์ Logout -->
          <a-button v-if="!loadingUser && userEmail" danger @click="logout">
            Logout
          </a-button>
        </a-space>
      </a-layout-header>

      <a-layout-content style="background:#f5f5f5">
        <slot />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>
