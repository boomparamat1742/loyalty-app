<script setup>
import {
  AppstoreOutlined,
  ShoppingOutlined,
  GiftOutlined,
  LogoutOutlined,
  CrownOutlined,
} from "@ant-design/icons-vue"

const auth = useAuthStore()
const route = useRoute()

const links = [
  { to: "/customer", label: "ภาพรวม", icon: AppstoreOutlined },
  { to: "/customer/purchase", label: "บันทึกการซื้อ", icon: ShoppingOutlined },
  { to: "/customer/rewards", label: "แลกของรางวัล", icon: GiftOutlined },
]

const isActive = (to) => route.path === to
const points = computed(() => Number(auth.profile?.points || 0).toLocaleString())
const label = computed(() => memberLabel(auth.profile, auth.user?.email))
const initial = computed(() => (label.value || "M").charAt(0).toUpperCase())

onMounted(() => {
  auth.ensureProfile().catch(() => null)
})
</script>

<template>
  <div class="member">
    <div class="ambient" aria-hidden="true"></div>

    <header class="member-header">
      <div class="container member-header-inner">
        <BrandMark to="/customer" />

        <nav class="member-nav" aria-label="เมนูสมาชิก">
          <NuxtLink
            v-for="l in links"
            :key="l.to"
            :to="l.to"
            class="member-link"
            :class="{ active: isActive(l.to) }"
          >
            <component :is="l.icon" /> {{ l.label }}
          </NuxtLink>
        </nav>

        <div class="member-right">
          <span class="chip chip-accent num" title="แต้มสะสม"><CrownOutlined /> {{ points }} แต้ม</span>

          <a-dropdown placement="bottomRight" :trigger="['click']">
            <button class="avatar" type="button" aria-label="เมนูบัญชี">{{ initial }}</button>
            <template #overlay>
              <a-menu>
                <a-menu-item key="email" disabled>{{ label }}</a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout" @click="auth.logout()">
                  <LogoutOutlined /> ออกจากระบบ
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </div>
    </header>

    <main class="container member-main">
      <slot />
    </main>

    <nav class="tabbar" aria-label="เมนูสมาชิก">
      <NuxtLink
        v-for="l in links"
        :key="l.to"
        :to="l.to"
        class="tab"
        :class="{ active: isActive(l.to) }"
      >
        <component :is="l.icon" class="tab-icon" />
        <span>{{ l.label }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
.member {
  position: relative;
  min-height: 100vh;
}
.member-header {
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(16px);
  background: rgba(7, 5, 15, 0.75);
  border-bottom: 1px solid var(--border);
}
.member-header-inner {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.member-nav {
  display: flex;
  gap: 6px;
  padding: 4px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.02);
}
.member-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-2);
  transition: background 0.2s, color 0.2s;
}
.member-link:hover {
  color: var(--text);
}
.member-link.active {
  color: var(--text);
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.22), rgba(34, 211, 238, 0.06));
  box-shadow: inset 0 0 0 1px var(--border-strong);
}
.member-link.active :deep(.anticon) {
  color: var(--accent);
}
.member-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.avatar {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  border: 1px solid var(--border-strong);
  background: var(--grad-primary);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.member-main {
  position: relative;
  z-index: 1;
  padding-top: 36px;
  padding-bottom: 64px;
}
.tabbar {
  display: none;
}

@media (max-width: 860px) {
  .member-nav {
    display: none;
  }
  .member-main {
    padding-top: 24px;
    padding-bottom: 104px;
  }
  .tabbar {
    position: fixed;
    z-index: 30;
    left: 12px;
    right: 12px;
    bottom: 12px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    padding: 6px;
    border-radius: 18px;
    border: 1px solid var(--border-strong);
    background: rgba(17, 12, 32, 0.92);
    backdrop-filter: blur(16px);
    box-shadow: var(--shadow);
  }
  .tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 4px;
    border-radius: 12px;
    font-size: 12px;
    color: var(--text-3);
  }
  .tab-icon {
    font-size: 18px;
  }
  .tab.active {
    color: var(--text);
    background: var(--primary-soft);
  }
}
@media (max-width: 420px) {
  .member-right .chip {
    padding: 4px 8px;
  }
}
</style>
