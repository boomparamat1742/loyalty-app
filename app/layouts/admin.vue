<script setup>
import { message } from "ant-design-vue"
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  GiftOutlined,
  UsersOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
} from "@ant-design/icons-vue"

const supabase = useSupabase()
const route = useRoute()
const auth = useAuthStore()

const selected = computed(() => route.path)
const collapsed = ref(false)

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

const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}
</script>


<template>
  <a-layout style="min-height: 100vh; background: #f5f5f5">
    <!-- Sidebar -->
    <a-layout-sider 
      :width="220" 
      :collapsed="collapsed"
      :collapsedWidth="80"
      collapsible
      style="background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.06)"
    >
      <div class="logo-section">
        <div v-if="!collapsed" class="logo-text">Loyalty Admin</div>
        <div v-else class="logo-icon">A</div>
      </div>

      <a-menu 
        mode="inline" 
        :selectedKeys="[selected]"
        :inlineCollapsed="collapsed"
        :inlineIndent="16"
      >
        <a-menu-item key="/admin">
          <template #icon>
            <DashboardOutlined />
          </template>
          <NuxtLink to="/admin" style="text-decoration: none">
            Dashboard
          </NuxtLink>
        </a-menu-item>

        <a-menu-item key="/admin/sales">
          <template #icon>
            <ShoppingCartOutlined />
          </template>
          <NuxtLink to="/admin/sales" style="text-decoration: none">
            Sales Analytics
          </NuxtLink>
        </a-menu-item>

        <a-menu-item key="/admin/rewards">
          <template #icon>
            <GiftOutlined />
          </template>
          <NuxtLink to="/admin/rewards" style="text-decoration: none">
            Rewards
          </NuxtLink>
        </a-menu-item>

        <a-menu-item key="/admin/users">
          <template #icon>
            <UsersOutlined />
          </template>
          <NuxtLink to="/admin/users" style="text-decoration: none">
            Users
          </NuxtLink>
        </a-menu-item>

        <a-divider style="margin: 8px 0" />

        <a-menu-item key="/admin/management">
          <template #icon>
            <SettingOutlined />
          </template>
          <NuxtLink to="/admin/management" style="text-decoration: none">
            Admin Management
          </NuxtLink>
        </a-menu-item>

        <a-menu-item key="/admin/settings">
          <template #icon>
            <SettingOutlined />
          </template>
          <NuxtLink to="/admin/settings" style="text-decoration: none">
            Settings
          </NuxtLink>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <!-- Header -->
      <a-layout-header class="admin-header">
        <div class="header-left">
          <a-button 
            type="text" 
            :icon="collapsed ? MenuUnfoldOutlined : MenuFoldOutlined"
            @click="toggleSidebar"
            class="toggle-button"
          />
          <span class="page-breadcrumb">{{ route.meta.title || 'Admin' }}</span>
        </div>

        <a-space class="header-right">
          <div class="user-status">
            <span v-if="!loadingUser && userEmail" class="user-email">
              {{ userEmail }}
            </span>
            <div class="status-dot"></div>
          </div>

          <a-dropdown>
            <template #overlay>
              <a-menu @click="logout">
                <a-menu-item key="logout">
                  <template #icon>
                    <LogoutOutlined />
                  </template>
                  Logout
                </a-menu-item>
              </a-menu>
            </template>
            <a-button type="text" class="user-menu-button">
              <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #3b82f6, #a855f7); display: grid; place-items: center; color: #fff; font-size: 14px; font-weight: 600">
                {{ userEmail?.charAt(0).toUpperCase() || 'U' }}
              </div>
            </a-button>
          </a-dropdown>
        </a-space>
      </a-layout-header>

      <!-- Content -->
      <a-layout-content class="admin-content">
        <slot />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.logo-section {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
}

.logo-text {
  font-weight: 800;
  font-size: 16px;
  color: #1f2937;
  letter-spacing: -0.5px;
}

.logo-icon {
  font-weight: 800;
  font-size: 20px;
  color: #3b82f6;
}

:deep(.ant-menu) {
  border-right: none;
}

:deep(.ant-menu-item) {
  margin-top: 4px;
  margin-bottom: 4px;
  height: 40px;
  line-height: 40px;
  border-radius: 8px;
  margin-left: 8px;
  margin-right: 8px;
}

:deep(.ant-menu-item-selected) {
  background-color: #f0f9ff !important;
  color: #3b82f6 !important;
}

:deep(.ant-menu-item-selected::before) {
  display: none;
}

:deep(.ant-menu-item:hover),
:deep(.ant-menu-item-selected) {
  color: #3b82f6 !important;
}

.admin-header {
  background: #fff !important;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid #f0f0f0;
  height: 64px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-button {
  font-size: 18px;
  color: #1f2937;
  padding: 4px 8px;
}

.page-breadcrumb {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
  text-transform: capitalize;
}

.user-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
}

.user-email {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
}

.user-menu-button {
  padding: 0 !important;
  min-width: 32px;
  height: 32px;
  border-radius: 8px;
}

.admin-content {
  background: #f5f5f5;
  padding: 24px;
  min-height: calc(100vh - 64px);
}

@media (max-width: 768px) {
  .admin-header {
    padding: 0 16px;
  }
  
  .page-breadcrumb {
    display: none;
  }
}
</style>

