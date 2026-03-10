<script setup>
import {
  RocketOutlined,
  GiftOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons-vue";
definePageMeta({ layout: "default" });
</script>

<template>
  <div class="home-wrap">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>

    <div class="home-container">
      <a-card class="home-hero" :bordered="false">
        <div class="home-hero-inner">
          <div class="home-left">
            <div class="brand-badge">
              <span class="dot"></span> NEXT-GEN LOYALTY
            </div>

            <a-typography-title :level="1" class="home-title">
              <span class="text-white">R.Benz</span>
              <span class="text-gradient"> ฟิล์มม่วง แปดริ้ว</span>
            </a-typography-title>

            <p class="home-subtitle">
              สัมผัสประสบการณ์การดูแลสมาร์ทโฟนที่เหนือระดับ
              ด้วยระบบสะสมแต้มอัจฉริยะที่ออกแบบมาเพื่อคุณโดยเฉพาะ
            </p>

            <div
              class="home-actions"
              style="display: flex; gap: 16px; align-items: center"
            >
              <NuxtLink to="/auth/login">
                <a-button
                  type="primary"
                  size="large"
                  class="btn-main glow-button"
                >
                  <template #icon><RocketOutlined /></template>
                  เริ่มต้นใช้งาน
                </a-button>
              </NuxtLink>

              <NuxtLink to="/auth/register">
                <a-button size="large" class="btn-sub">
                  สมัครสมาชิกใหม่
                </a-button>
              </NuxtLink>
            </div>

            <div class="feature-row">
              <div class="f-pill"><ThunderboltFilled /> Fast Points</div>
              <div class="f-pill"><CrownFilled /> Exclusive Reward</div>
              <div class="f-pill"><SafetyCertificateFilled /> Secure</div>
            </div>
          </div>

          <div class="home-right">
            <div class="visual-container">
              <div class="tech-ring"></div>
              <div class="tech-ring-inner"></div>
              <div class="floating-card">
                <div class="card-glass">
                  <div class="card-chip"></div>
                  <div class="card-number">**** **** 8888</div>
                  <div class="card-name">LOYALTY MEMBER</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </a-card>

      <div class="home-footer">
        <span class="footer-link">Privacy Policy</span>
        <span class="separator">•</span>
        <span>© {{ new Date().getFullYear() }} R.BENZ SYSTEM</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap");

.home-wrap {
  min-height: 100vh;
  background: #020617; /* พื้นหลังเกือบดำแบบลึก */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: "Plus Jakarta Sans", sans-serif;
  overflow: hidden;
  position: relative;
}

/* Background Blobs */
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  opacity: 0.4;
}
.blob-1 {
  width: 400px;
  height: 400px;
  background: #722ed1;
  top: -100px;
  left: -100px;
}
.blob-2 {
  width: 300px;
  height: 300px;
  background: #1890ff;
  bottom: -50px;
  right: -50px;
}
.blob-3 {
  width: 250px;
  height: 250px;
  background: #f759ab;
  top: 40%;
  left: 30%;
}

.home-container {
  width: 100%;
  max-width: 1100px;
  position: relative;
  z-index: 1;
}

/* Hero Card */
.home-hero {
  border-radius: 40px !important;
  background: rgba(15, 23, 42, 0.6) !important;
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5);
}

.home-hero-inner {
  padding: 80px;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 60px;
  align-items: center;
}

/* Typography & Content */
.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(114, 46, 209, 0.15);
  border: 1px solid rgba(114, 46, 209, 0.3);
  color: #b37feb;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  margin-bottom: 24px;
}

.brand-badge .dot {
  width: 6px;
  height: 6px;
  background: #722ed1;
  border-radius: 50%;
  box-shadow: 0 0 10px #722ed1;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.home-title {
  font-size: 56px !important;
  line-height: 1.1 !important;
  margin-bottom: 24px !important;
}

.text-white {
  color: #ffffff !important;
}
.text-gradient {
  background: linear-gradient(135deg, #b37feb 0%, #1890ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.home-subtitle {
  color: #94a3b8;
  font-size: 18px;
  line-height: 1.8;
  margin-bottom: 40px;
}

/* Actions */
.btn-main {
  height: 60px !important;
  padding: 0 40px !important;
  border-radius: 20px !important;
  font-weight: 700 !important;
  font-size: 18px !important;
  background: linear-gradient(135deg, #722ed1 0%, #1890ff 100%) !important;
  border: none !important;
}

.glow-button:hover {
  box-shadow: 0 0 30px rgba(114, 46, 209, 0.5) !important;
  transform: translateY(-2px);
}

.btn-sub {
  height: 60px !important;
  padding: 0 40px !important;
  border-radius: 20px !important;
  color: #fff !important;
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.btn-sub:hover {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: #722ed1 !important;
}

/* Feature Pills */
.feature-row {
  display: flex;
  gap: 12px;
  margin-top: 40px;
}

.f-pill {
  background: rgba(255, 255, 255, 0.03);
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 13px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Right Side - Visuals */
.visual-container {
  position: relative;
  height: 300px;
  display: grid;
  place-items: center;
}

.tech-ring {
  position: absolute;
  width: 280px;
  height: 280px;
  border: 2px dashed rgba(114, 46, 209, 0.3);
  border-radius: 50%;
  animation: rotate 20s linear infinite;
}

.card-glass {
  width: 240px;
  height: 150px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 20px;
  position: relative;
  transform: rotate(-10deg);
  box-shadow: 20px 20px 50px rgba(0, 0, 0, 0.3);
  animation: float 6s ease-in-out infinite;
}

.card-chip {
  width: 40px;
  height: 30px;
  background: linear-gradient(135deg, #ffd700 0%, #b8860b 100%);
  border-radius: 6px;
  margin-bottom: 20px;
}

.card-number {
  color: #fff;
  letter-spacing: 2px;
  font-size: 14px;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(-10deg);
  }
  50% {
    transform: translateY(-20px) rotate(-5deg);
  }
}

/* Footer */
.home-footer {
  text-align: center;
  margin-top: 40px;
  color: #475569;
  font-size: 14px;
}

.footer-link:hover {
  color: #722ed1;
  cursor: pointer;
}
.separator {
  margin: 0 12px;
}

/* Responsive */
@media (max-width: 992px) {
  .home-hero-inner {
    grid-template-columns: 1fr;
    padding: 60px 30px;
    text-align: center;
  }
  .home-left {
    order: 1;
  }
  .home-right {
    display: none;
  }
  .home-title {
    font-size: 42px !important;
  }
  .home-actions {
    flex-direction: column;
  }
  .feature-row {
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>
