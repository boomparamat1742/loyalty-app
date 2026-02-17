<script setup>
definePageMeta({ layout: "default" });
</script>
<template>
  <div class="home-wrap">
    <div class="home-container">
      <a-card class="home-hero" :bordered="false">
        <div class="home-hero-inner">
          <div class="home-left">
            <a-space direction="vertical" :size="6">
              <a-typography-title :level="2" class="home-title">
                Loyalty App
              </a-typography-title>
              <a-typography-text type="secondary" class="home-subtitle">
                ระบบสะสมแต้มร้านขายเคสและฟิล์ม
              </a-typography-text>
            </a-space>

            <div class="home-actions">
              <NuxtLink to="/auth/login">
                <a-button type="primary" size="large"> เข้าสู่ระบบ </a-button>
              </NuxtLink>

              <NuxtLink to="/auth/register">
                <a-button size="large"> สมัครสมาชิก </a-button>
              </NuxtLink>
            </div>
          </div>
        </div>
      </a-card>

      <div class="home-footer">
        © {{ new Date().getFullYear() }} Loyalty App
      </div>
    </div>
  </div>
</template>
<style scoped>
/* ===== Page ===== */
.home-wrap {
  min-height: 100vh;
  background: #f5f7fb;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 16px;
}

.home-container {
  width: 100%;
  max-width: 980px;
}

/* ===== Hero Card ===== */
.home-hero {
  border-radius: 20px !important;
  background: #ffffff !important;
  border: 1px solid #e5e7eb !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.home-hero-inner {
  padding: 28px;
  display: flex;
  gap: 18px;
  align-items: stretch;
}

/* ===== Left ===== */
.home-left {
  width: 100%;
  min-width: 260px;
}

.home-title {
  margin: 0 !important;
  font-weight: 900 !important;
  letter-spacing: -0.3px;
  color: #111827 !important;
}

.home-subtitle {
  font-size: 15px;
  color: #6b7280 !important;
}

/* ===== Actions ===== */
.home-actions {
  margin-top: 18px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.home-actions :deep(.ant-btn) {
  border-radius: 12px;
  height: 42px;
  padding: 0 16px;
}

.home-actions :deep(.ant-btn-primary) {
  box-shadow: 0 10px 22px rgba(24, 144, 255, 0.25);
}

/* ===== Status ===== */
.home-status {
  margin-top: 16px;
}

.home-status :deep(.ant-alert) {
  border-radius: 14px;
  border: 1px solid #e5e7eb;
}

/* ===== Footer ===== */
.home-footer {
  text-align: center;
  margin-top: 18px;
  color: #9ca3af;
  font-size: 13px;
}

/* ===== Responsive ===== */
@media (max-width: 640px) {
  .home-hero-inner {
    padding: 18px;
  }
  .home-actions :deep(.ant-btn) {
    width: 100%;
    justify-content: center;
  }
}
</style>
