<script setup>
const auth = useAuthStore()
const year = new Date().getFullYear()
const accountLink = computed(() => (auth.isAdmin ? "/admin" : "/customer"))
</script>

<template>
  <div class="site">
    <div class="ambient" aria-hidden="true"></div>

    <header class="site-header">
      <div class="container site-header-inner">
        <BrandMark />

        <nav class="site-nav" aria-label="เมนูหลัก">
          <a href="/#how">วิธีสะสมแต้ม</a>
          <a href="/#rewards">ของรางวัล</a>
          <a href="/#faq">คำถามที่พบบ่อย</a>
        </nav>

        <div class="site-cta">
          <template v-if="auth.user">
            <NuxtLink :to="accountLink">
              <a-button type="primary">บัญชีของฉัน</a-button>
            </NuxtLink>
          </template>
          <template v-else>
            <NuxtLink to="/auth/login" class="site-login">เข้าสู่ระบบ</NuxtLink>
            <NuxtLink to="/auth/register">
              <a-button type="primary">สมัครสมาชิก</a-button>
            </NuxtLink>
          </template>
        </div>
      </div>
    </header>

    <main class="site-main">
      <slot />
    </main>

    <footer class="site-footer">
      <div class="container site-footer-inner">
        <div class="site-footer-brand">
          <BrandMark />
          <p class="subtle">ระบบสมาชิกและสะสมแต้มของร้าน R.Benz ฟิล์มม่วง แปดริ้ว</p>
        </div>
        <div class="site-footer-links">
          <NuxtLink to="/auth/login">เข้าสู่ระบบ</NuxtLink>
          <NuxtLink to="/auth/register">สมัครสมาชิก</NuxtLink>
          <a href="/#faq">คำถามที่พบบ่อย</a>
        </div>
      </div>
      <div class="container site-copy subtle">© {{ year }} R.Benz ฟิล์มม่วง แปดริ้ว</div>
    </footer>
  </div>
</template>

<style scoped>
.site {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(16px);
  background: rgba(7, 5, 15, 0.72);
  border-bottom: 1px solid var(--border);
}
.site-header-inner {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.site-nav {
  display: flex;
  gap: 32px;
}
.site-nav a {
  color: var(--text-2);
  font-size: 14px;
  transition: color 0.2s;
}
.site-nav a:hover {
  color: var(--text);
}
.site-cta {
  display: flex;
  align-items: center;
  gap: 18px;
}
.site-login {
  color: var(--text);
  font-size: 14px;
  font-weight: 500;
}
.site-main {
  position: relative;
  z-index: 1;
  flex: 1;
}
.site-footer {
  position: relative;
  z-index: 1;
  border-top: 1px solid var(--border);
  padding: 48px 0 28px;
  background: rgba(0, 0, 0, 0.2);
}
.site-footer-inner {
  display: flex;
  justify-content: space-between;
  gap: 32px;
  flex-wrap: wrap;
}
.site-footer-brand p {
  margin: 14px 0 0;
  max-width: 340px;
  font-size: 14px;
}
.site-footer-links {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
  align-items: flex-start;
}
.site-footer-links a {
  color: var(--text-2);
  font-size: 14px;
}
.site-footer-links a:hover {
  color: var(--text);
}
.site-copy {
  margin-top: 32px;
  font-size: 13px;
}

@media (max-width: 860px) {
  .site-nav {
    display: none;
  }
}
@media (max-width: 480px) {
  .site-login {
    display: none;
  }
}
</style>
