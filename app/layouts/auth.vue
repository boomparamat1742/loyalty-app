<script setup>
import { GiftOutlined, SafetyCertificateOutlined, ThunderboltOutlined } from "@ant-design/icons-vue"
</script>

<template>
  <div class="auth">
    <div class="ambient" aria-hidden="true"></div>

    <aside class="auth-showcase">
      <BrandMark />

      <div class="auth-showcase-body">
        <span class="eyebrow">Member Rewards</span>
        <h2 class="display auth-headline">
          ทุกการดูแลมือถือ<br />
          <span class="text-gradient">คือแต้มสะสมของคุณ</span>
        </h2>
        <ul class="auth-points">
          <li><span class="icon-tile"><ThunderboltOutlined /></span>ทุก 10 บาท รับ 1 แต้ม บันทึกได้ทันที</li>
          <li><span class="icon-tile"><GiftOutlined /></span>แลกฟิล์ม เคส และอุปกรณ์พรีเมียม</li>
          <li><span class="icon-tile"><SafetyCertificateOutlined /></span>แต้มคำนวณและเก็บอย่างปลอดภัยในระบบ</li>
        </ul>
      </div>

      <p class="subtle auth-foot">R.Benz ฟิล์มม่วง แปดริ้ว</p>
    </aside>

    <main class="auth-main">
      <div class="auth-mobile-brand"><BrandMark /></div>
      <div class="auth-card surface fade-up">
        <slot />
      </div>
      <NuxtLink to="/" class="auth-back subtle">← กลับหน้าแรก</NuxtLink>
    </main>
  </div>
</template>

<style scoped>
.auth {
  position: relative;
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}
.auth-showcase {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 40px;
  padding: 48px clamp(32px, 5vw, 72px);
  border-right: 1px solid var(--border);
  background:
    radial-gradient(600px 400px at 30% 30%, rgba(124, 58, 237, 0.28), transparent 70%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent);
}
.auth-showcase-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 460px;
}
.auth-headline {
  font-size: clamp(32px, 3.6vw, 46px);
}
.auth-points {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.auth-points li {
  display: flex;
  align-items: center;
  gap: 14px;
  color: var(--text-2);
}
.auth-foot {
  margin: 0;
  font-size: 13px;
}
.auth-main {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 48px 24px;
}
.auth-card {
  width: 100%;
  max-width: 440px;
  padding: 36px 32px;
}
.auth-back {
  font-size: 14px;
}
.auth-mobile-brand {
  display: none;
}

@media (max-width: 900px) {
  .auth {
    grid-template-columns: minmax(0, 1fr);
  }
  .auth-showcase {
    display: none;
  }
  .auth-mobile-brand {
    display: block;
  }
  .auth-main {
    justify-content: flex-start;
    padding-top: 40px;
  }
}
@media (max-width: 480px) {
  .auth-card {
    padding: 28px 20px;
  }
}
</style>
