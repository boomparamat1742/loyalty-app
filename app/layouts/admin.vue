<script setup>
import { message } from "ant-design-vue"

const supabase = useSupabase()
const route = useRoute()
const auth = useAuthStore()

const selected = computed(() => route.path)

const userEmail = computed(() => auth.profile?.email || auth.user?.email || "")
const loadingUser = computed(() => !auth.loaded)

onMounted(async () => {
  // ✅ บังคับโหลด session + profile ก่อน
  if (!auth.loaded) await auth.load()

  // ✅ ถ้าไม่ login -> ไป login
  if (!auth.user) return navigateTo("/auth/login")

  // ✅ ถ้าไม่ใช่ admin -> ไป customer
  if (auth.profile?.role !== "admin") return navigateTo("/customer")
})

const logout = async () => {
  await auth.logout()
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
