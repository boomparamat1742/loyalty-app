<script setup>
import {
  DashboardOutlined,
  LineChartOutlined,
  GiftOutlined,
  TeamOutlined,
  SafetyOutlined,
  CheckSquareOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuOutlined,
} from "@ant-design/icons-vue"

// การตรวจสิทธิ์ admin อยู่ใน middleware/auth.global.js
const auth = useAuthStore()
const route = useRoute()
const drawerOpen = ref(false)

const groups = [
  {
    label: "ภาพรวม",
    items: [
      { to: "/admin", label: "แดชบอร์ด", icon: DashboardOutlined, exact: true },
      { to: "/admin/sales", label: "ยอดขาย", icon: LineChartOutlined },
      { to: "/admin/rewards", label: "ของรางวัล", icon: GiftOutlined },
      { to: "/admin/redemptions", label: "การแลกรางวัล", icon: CheckSquareOutlined },
      { to: "/admin/users", label: "สมาชิก", icon: TeamOutlined },
    ],
  },
  {
    label: "ระบบ",
    items: [
      { to: "/admin/management", label: "ผู้ดูแลระบบ", icon: SafetyOutlined },
      { to: "/admin/settings", label: "ข้อมูลระบบ", icon: SettingOutlined },
    ],
  },
]

const isActive = (item) => (item.exact ? route.path === item.to : route.path.startsWith(item.to))
const email = computed(() => memberLabel(auth.profile, auth.user?.email))
const initial = computed(() => (email.value || "A").charAt(0).toUpperCase())

watch(() => route.path, () => (drawerOpen.value = false))
</script>

<template>
  <div class="console">
    <div class="ambient" aria-hidden="true"></div>

    <aside class="sidebar">
      <div class="sidebar-brand"><BrandMark to="/admin" caption="Admin Console" /></div>

      <nav class="sidebar-nav" aria-label="เมนูผู้ดูแล">
        <div v-for="g in groups" :key="g.label" class="nav-group">
          <div class="nav-group-label">{{ g.label }}</div>
          <NuxtLink
            v-for="item in g.items"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            :class="{ active: isActive(item) }"
          >
            <component :is="item.icon" class="nav-icon" />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </div>
      </nav>

      <div class="sidebar-user">
        <div class="user-avatar">{{ initial }}</div>
        <div class="user-meta">
          <div class="user-email" :title="email">{{ email }}</div>
          <div class="user-role">ผู้ดูแลระบบ</div>
        </div>
        <a-tooltip title="ออกจากระบบ">
          <a-button type="text" class="user-logout" aria-label="ออกจากระบบ" @click="auth.logout()">
            <LogoutOutlined />
          </a-button>
        </a-tooltip>
      </div>
    </aside>

    <div class="console-body">
      <header class="mobile-bar">
        <a-button type="text" aria-label="เปิดเมนู" @click="drawerOpen = true"><MenuOutlined /></a-button>
        <BrandMark to="/admin" caption="Admin Console" />
        <span />
      </header>

      <main class="console-main">
        <slot />
      </main>
    </div>

    <a-drawer
      v-model:open="drawerOpen"
      placement="left"
      :width="280"
      :closable="false"
      :body-style="{ padding: 0, background: 'var(--bg-2)' }"
    >
      <div class="drawer">
        <div class="sidebar-brand"><BrandMark to="/admin" caption="Admin Console" /></div>
        <nav class="sidebar-nav">
          <div v-for="g in groups" :key="g.label" class="nav-group">
            <div class="nav-group-label">{{ g.label }}</div>
            <NuxtLink
              v-for="item in g.items"
              :key="item.to"
              :to="item.to"
              class="nav-item"
              :class="{ active: isActive(item) }"
            >
              <component :is="item.icon" class="nav-icon" />
              <span>{{ item.label }}</span>
            </NuxtLink>
          </div>
        </nav>
        <div class="sidebar-user">
          <div class="user-avatar">{{ initial }}</div>
          <div class="user-meta">
            <div class="user-email">{{ email }}</div>
            <div class="user-role">ผู้ดูแลระบบ</div>
          </div>
          <a-button type="text" class="user-logout" aria-label="ออกจากระบบ" @click="auth.logout()">
            <LogoutOutlined />
          </a-button>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<style scoped>
.console {
  position: relative;
  min-height: 100vh;
  display: flex;
}
.sidebar {
  position: sticky;
  top: 0;
  z-index: 2;
  height: 100vh;
  width: 260px;
  flex: 0 0 260px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(124, 58, 237, 0.08), transparent 40%), var(--bg-2);
}
.sidebar-brand {
  padding: 22px 22px 18px;
  border-bottom: 1px solid var(--border);
}
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.nav-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.nav-group-label {
  padding: 0 12px 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.12em;
  color: var(--text-3);
}
.nav-group-label::before {
  content: "// ";
  color: var(--accent);
}
.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  color: var(--text-2);
  font-size: 14px;
  transition: background 0.2s, color 0.2s;
}
.nav-item:hover {
  color: var(--text);
  background: rgba(255, 255, 255, 0.04);
}
.nav-item.active {
  color: var(--text);
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.2), rgba(34, 211, 238, 0.04));
  box-shadow: inset 0 0 0 1px var(--border-strong);
}
.nav-item.active::before {
  content: "";
  position: absolute;
  left: -14px;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent);
}
.nav-icon {
  font-size: 16px;
}
.nav-item.active .nav-icon {
  color: var(--accent);
}
.sidebar-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-top: 1px solid var(--border);
}
.user-avatar {
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--grad-primary);
  color: #fff;
  font-weight: 600;
}
.user-meta {
  flex: 1;
  min-width: 0;
}
.user-email {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-role {
  font-size: 12px;
  color: var(--text-3);
}
.user-logout {
  color: var(--text-2);
}
.console-body {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
}
.console-main {
  max-width: 1280px;
  margin: 0 auto;
  padding: 36px clamp(16px, 3vw, 40px) 64px;
}
.mobile-bar {
  display: none;
}
.drawer {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

@media (max-width: 1024px) {
  .sidebar {
    display: none;
  }
  .mobile-bar {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    padding: 0 12px;
    border-bottom: 1px solid var(--border);
    background: rgba(7, 5, 15, 0.8);
    backdrop-filter: blur(16px);
  }
  .console-main {
    padding-top: 24px;
  }
}
</style>
