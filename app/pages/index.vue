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
    <div class="home-container">
      <a-card class="home-hero" :bordered="false">
        <div class="home-hero-inner">
          <div class="home-left">
            <!-- <div class="brand-tag">Premium Experience</div> -->
            <a-typography-title :level="1" class="home-title">
              <span class="text-gradient">R.Benz ฟิล์มม่วง แปดริ้ว</span>
            </a-typography-title>
            <p class="home-subtitle">
              ยกระดับร้านขายเคสและฟิล์มของคุณด้วยระบบสะสมแต้มอัจฉริยะ
              <br />ซื้อง่าย สะสมไว แลกรับสิทธิพิเศษได้ทันที
            </p>

            <div class="home-actions">
              <NuxtLink to="/auth/login">
                <a-button type="primary" size="large" class="btn-main">
                  <template #icon><RocketOutlined /></template>
                  เข้าสู่ระบบ
                </a-button>
              </NuxtLink>

              <NuxtLink to="/auth/register">
                <a-button size="large" class="btn-sub"> สมัครสมาชิก </a-button>
              </NuxtLink>
            </div>

            <div class="mini-features">
              <div class="feature-item">
                <ThunderboltOutlined /> <span>สะสมแต้มไว</span>
              </div>
              <div class="feature-item">
                <GiftOutlined /> <span>แลกของรางวัล</span>
              </div>
            </div>
          </div>

          <div class="home-right">
            <div class="hero-circle-decoration"></div>
            <div class="icon-floating">
              <GiftOutlined />
            </div>
          </div>
        </div>
      </a-card>

      <div class="home-footer">
        © {{ new Date().getFullYear() }} • <strong>Loyalty App</strong> System
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== Page Background ===== */
.home-wrap {
  min-height: 100vh;
  background:
    radial-gradient(at 0% 0%, rgba(24, 144, 255, 0.05) 0px, transparent 50%),
    radial-gradient(
      at 100% 100%,
      rgba(24, 144, 255, 0.05) 0px,
      transparent 50%
    ),
    #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.home-container {
  width: 100%;
  max-width: 1000px;
}

/* ===== Hero Card (Glassmorphism) ===== */
.home-hero {
  border-radius: 32px !important;
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 1) !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.home-hero-inner {
  padding: 60px;
  display: flex;
  gap: 40px;
  align-items: center;
}

/* ===== Left Side Styling ===== */
.brand-tag {
  display: inline-block;
  padding: 4px 12px;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 16px;
  letter-spacing: 1px;
}

.home-title {
  margin-top: 0 !important;
  font-size: 48px !important;
  font-weight: 850 !important;
  letter-spacing: -1px;
  color: #1e293b !important;
}

.text-gradient {
  background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.home-subtitle {
  font-size: 18px;
  line-height: 1.7;
  color: #64748b;
  margin-bottom: 32px;
  max-width: 480px;
}

/* ===== Actions & Buttons ===== */
.home-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 40px;
}

.btn-main {
  height: 54px !important;
  padding: 0 32px !important;
  border-radius: 16px !important;
  font-weight: 600 !important;
  font-size: 16px !important;
  box-shadow: 0 10px 20px rgba(24, 144, 255, 0.25) !important;
}

.btn-sub {
  height: 54px !important;
  padding: 0 32px !important;
  border-radius: 16px !important;
  font-weight: 600 !important;
  background: transparent !important;
  border: 2px solid #e2e8f0 !important;
}

.btn-sub:hover {
  border-color: #1890ff !important;
  color: #1890ff !important;
}

/* ===== Mini Features ===== */
.mini-features {
  display: flex;
  gap: 24px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 14px;
}

.feature-item .anticon {
  color: #1890ff;
  font-size: 18px;
}

/* ===== Right Side (Visual) ===== */
.home-right {
  flex: 1;
  display: flex;
  justify-content: center;
  position: relative;
}

.hero-circle-decoration {
  width: 280px;
  height: 280px;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%);
  border-radius: 50%;
  position: relative;
}

.icon-floating {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 100px;
  color: #1890ff;
  filter: drop-shadow(0 20px 30px rgba(24, 144, 255, 0.3));
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translate(-50%, -55%);
  }
  50% {
    transform: translate(-50%, -45%);
  }
}

/* ===== Footer ===== */
.home-footer {
  text-align: center;
  margin-top: 32px;
  color: #94a3b8;
}

/* ===== Mobile Adjustments ===== */
@media (max-width: 850px) {
  .home-hero-inner {
    flex-direction: column;
    text-align: center;
    padding: 40px 24px;
  }
  .home-right {
    display: none; /* ซ่อนรูปขวาในมือถือเพื่อความกระชับ */
  }
  .home-subtitle {
    margin-left: auto;
    margin-right: auto;
  }
  .home-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .mini-features {
    justify-content: center;
  }
}
</style>
