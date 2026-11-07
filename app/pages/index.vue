<script setup>
import {
  UserAddOutlined,
  ShoppingOutlined,
  GiftOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined,
  MobileOutlined,
  ThunderboltOutlined,
  ArrowRightOutlined,
  CrownOutlined,
} from "@ant-design/icons-vue"

definePageMeta({ layout: "default" })

const supabase = useSupabase()
const rewards = ref([])
const rewardsLoading = ref(true)

onMounted(async () => {
  try {
    const { data } = await supabase
      .from("rewards")
      .select("id,title,points_cost,image_url")
      .eq("is_active", true)
      .gt("stock", 0)
      .order("points_cost", { ascending: true })
      .limit(4)
    rewards.value = data || []
  } finally {
    rewardsLoading.value = false
  }
})

const steps = [
  { icon: UserAddOutlined, title: "สมัครสมาชิกฟรี", text: "ตั้งชื่อผู้ใช้และรหัสผ่าน ไม่ต้องใช้อีเมล ใช้งานผ่านมือถือได้ทันที" },
  { icon: ShoppingOutlined, title: "ซื้อแล้วบันทึกยอด", text: "บันทึกราคาสินค้าที่ซื้อ ระบบคำนวณแต้มให้อัตโนมัติ ทุก 10 บาท รับ 1 แต้ม" },
  { icon: GiftOutlined, title: "แลกของรางวัล", text: "เลือกของรางวัลที่ต้องการ กดแลกได้เอง แล้วแสดงหลักฐานที่หน้าร้าน" },
]

const benefits = [
  { icon: SafetyCertificateOutlined, title: "แต้มปลอดภัย", text: "แต้มคำนวณและเก็บในระบบหลังบ้าน ไม่มีใครแก้ไขได้ตามใจ" },
  { icon: HistoryOutlined, title: "ตรวจสอบได้ทุกรายการ", text: "ดูประวัติการซื้อและการแลกของรางวัลย้อนหลังได้ตลอดเวลา" },
  { icon: ThunderboltOutlined, title: "แต้มเข้าทันที", text: "บันทึกการซื้อเสร็จ แต้มขึ้นในบัญชีทันที ไม่ต้องรอ" },
  { icon: MobileOutlined, title: "ใช้ได้ทุกที่", text: "เปิดผ่านเบราว์เซอร์บนมือถือหรือคอมพิวเตอร์ได้เลย" },
]

const faqs = [
  { q: "สมัครสมาชิกมีค่าใช้จ่ายไหม?", a: "ไม่มีค่าใช้จ่าย ตั้งชื่อผู้ใช้และรหัสผ่านก็เริ่มสะสมแต้มได้ทันที ไม่ต้องใช้อีเมล" },
  { q: "แต้มคิดอย่างไร?", a: "ทุกยอดซื้อ 10 บาท รับ 1 แต้ม (ปัดเศษลง) เช่น ซื้อ 255 บาท ได้ 25 แต้ม" },
  { q: "แลกของรางวัลแล้วรับของอย่างไร?", a: "เมื่อแลกสำเร็จ ระบบจะแสดงหลักฐานการแลก ให้แคปหน้าจอแล้วนำไปแสดงที่หน้าร้านเพื่อรับของรางวัล" },
  { q: "บันทึกการซื้อได้วันละกี่ครั้ง?", a: "สมาชิกบันทึกการซื้อด้วยตัวเองได้สูงสุด 10 รายการต่อวัน" },
  { q: "เคยสมัครด้วยอีเมลไว้แล้ว ต้องสมัครใหม่ไหม?", a: "ไม่ต้อง ใช้อีเมลและรหัสผ่านเดิมเข้าสู่ระบบได้เหมือนเดิม แต้มสะสมยังอยู่ครบ" },
]
</script>

<template>
  <div>
    <!-- HERO -->
    <section class="hero container">
      <div class="hero-copy fade-up">
        <div class="hero-status">
          <span class="pulse-dot"></span>
          <span class="mono">LOYALTY SYSTEM · ONLINE</span>
        </div>
        <h1 class="display hero-title">
          <span class="line">ทุกครั้งที่ดูแลมือถือ</span>
          <span class="line text-gradient">คือแต้มที่สะสมกลับมา</span>
        </h1>
        <p class="hero-lead">
          สมาชิกร้าน R.Benz ฟิล์มม่วง แปดริ้ว สะสมแต้มจากการซื้อฟิล์ม เคส และอุปกรณ์ทุกชิ้น
          แล้วแลกของรางวัลพรีเมียมได้ด้วยตัวเองผ่านมือถือ
        </p>
        <div class="hero-actions">
          <NuxtLink to="/auth/register">
            <a-button type="primary" size="large">
              สมัครสมาชิกฟรี <ArrowRightOutlined />
            </a-button>
          </NuxtLink>
          <NuxtLink to="/auth/login">
            <a-button size="large" class="btn-ghost">เข้าสู่ระบบ</a-button>
          </NuxtLink>
        </div>
        <dl class="hero-facts">
          <div><dt class="num">10฿</dt><dd>= 1 แต้ม</dd></div>
          <div><dt class="num">REAL-TIME</dt><dd>แต้มเข้าบัญชีทันที</dd></div>
          <div><dt class="num">FREE</dt><dd>ไม่มีค่าสมัคร</dd></div>
        </dl>
      </div>

      <div class="hero-visual fade-up fade-up-2" aria-hidden="true">
        <div class="orbit"><span class="orbit-ring"></span></div>
        <div class="member-card">
          <div class="mc-top">
            <span class="mc-brand">R.BENZ<span class="mc-slash">//</span>ID</span>
            <span class="mc-tier"><CrownOutlined /> MEMBER</span>
          </div>
          <div class="mc-chip"><span></span><span></span><span></span></div>
          <div class="mc-label mono">POINTS_BALANCE</div>
          <div class="mc-points num">2,480<span class="mc-cursor">_</span></div>
          <div class="mc-bottom mono">
            <span>PURPLE.FILM</span>
            <span>#1742</span>
          </div>
        </div>
        <div class="float-note note-1">
          <span class="note-icon"><ShoppingOutlined /></span>
          <div>
            <div class="note-title">ฟิล์มกระจก</div>
            <div class="note-sub">฿ 350</div>
          </div>
          <span class="points-plus">+35</span>
        </div>
        <div class="float-note note-2">
          <span class="note-icon"><GiftOutlined /></span>
          <div>
            <div class="note-title">แลกของรางวัลสำเร็จ</div>
            <div class="note-sub">เคสใส Magnetic</div>
          </div>
        </div>
      </div>
    </section>

    <!-- HOW -->
    <section id="how" class="section container">
      <div class="section-head">
        <span class="eyebrow">How it works</span>
        <h2 class="display section-title">สะสมแต้มง่าย ๆ ใน 3 ขั้นตอน</h2>
      </div>
      <ol class="steps">
        <li v-for="(s, i) in steps" :key="s.title" class="step surface">
          <span class="step-no num">STEP_0{{ i + 1 }}</span>
          <span class="icon-tile"><component :is="s.icon" /></span>
          <h3 class="step-title">{{ s.title }}</h3>
          <p class="muted">{{ s.text }}</p>
        </li>
      </ol>
    </section>

    <!-- REWARDS -->
    <section id="rewards" class="section container">
      <div class="section-head section-head-row">
        <div>
          <span class="eyebrow">Rewards</span>
          <h2 class="display section-title">ของรางวัลที่รอคุณอยู่</h2>
        </div>
        <NuxtLink to="/auth/register" class="link-arrow">สมัครเพื่อเริ่มสะสม <ArrowRightOutlined /></NuxtLink>
      </div>

      <div v-if="rewardsLoading" class="reward-grid">
        <div v-for="n in 4" :key="n" class="reward surface"><a-skeleton active /></div>
      </div>
      <div v-else-if="rewards.length" class="reward-grid">
        <article v-for="r in rewards" :key="r.id" class="reward surface">
          <div class="reward-media">
            <img v-if="r.image_url" :src="r.image_url" :alt="r.title" loading="lazy" />
            <GiftOutlined v-else class="reward-placeholder" />
          </div>
          <div class="reward-body">
            <h3 class="reward-title">{{ r.title }}</h3>
            <span class="chip chip-accent num">{{ Number(r.points_cost).toLocaleString() }} แต้ม</span>
          </div>
        </article>
      </div>
      <div v-else class="surface empty-block">ของรางวัลชุดใหม่กำลังจะมา ติดตามได้เร็ว ๆ นี้</div>
    </section>

    <!-- BENEFITS -->
    <section class="section container">
      <div class="benefits surface">
        <div class="benefits-intro">
          <span class="eyebrow">Why members love it</span>
          <h2 class="display section-title">น่าเชื่อถือ<br />ตั้งแต่แต้มแรก</h2>
          <p class="muted">ระบบสมาชิกที่ออกแบบให้โปร่งใส ทุกแต้มมีที่มาและตรวจสอบย้อนหลังได้</p>
        </div>
        <div class="benefit-grid">
          <div v-for="b in benefits" :key="b.title" class="benefit">
            <span class="icon-tile"><component :is="b.icon" /></span>
            <div>
              <h3 class="benefit-title">{{ b.title }}</h3>
              <p class="muted">{{ b.text }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="section container faq-wrap">
      <div class="section-head">
        <span class="eyebrow">FAQ</span>
        <h2 class="display section-title">คำถามที่พบบ่อย</h2>
      </div>
      <a-collapse class="faq" :bordered="false" expand-icon-position="end">
        <a-collapse-panel v-for="(f, i) in faqs" :key="i" :header="f.q">
          <p class="muted">{{ f.a }}</p>
        </a-collapse-panel>
      </a-collapse>
    </section>

    <!-- CTA -->
    <section class="section container">
      <div class="cta">
        <h2 class="display cta-title">พร้อมเริ่มสะสมแต้มแล้วหรือยัง?</h2>
        <p class="cta-sub">สมัครวันนี้ ทุกการซื้อครั้งต่อไปจะเริ่มเป็นแต้มทันที</p>
        <div class="hero-actions cta-actions">
          <NuxtLink to="/auth/register">
            <a-button type="primary" size="large">สมัครสมาชิกฟรี <ArrowRightOutlined /></a-button>
          </NuxtLink>
          <NuxtLink to="/auth/login">
            <a-button size="large" class="btn-ghost">ฉันเป็นสมาชิกแล้ว</a-button>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ---------- hero ---------- */
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  align-items: center;
  gap: 48px;
  padding-top: clamp(48px, 8vw, 96px);
  padding-bottom: clamp(48px, 8vw, 96px);
}
.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.hero-title {
  font-size: clamp(30px, 4.4vw, 58px);
}
/* ไม่ให้ตัดคำภาษาไทยกลางวลี */
.hero-title .line {
  display: block;
  white-space: nowrap;
}
.hero-lead {
  margin: 0;
  max-width: 540px;
  font-size: 17px;
  color: var(--text-2);
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.btn-ghost {
  background: rgba(255, 255, 255, 0.03);
  border-color: var(--border-strong);
}
.hero-facts {
  display: flex;
  gap: 36px;
  margin: 12px 0 0;
  padding-top: 22px;
  border-top: 1px solid var(--border);
}
.hero-status {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  align-self: flex-start;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid var(--border-strong);
  background: rgba(17, 12, 32, 0.7);
  font-size: 11.5px;
  letter-spacing: 0.12em;
  color: var(--text-2);
}
.hero-facts dt {
  font-size: 20px;
  font-weight: 600;
  color: var(--accent);
}
.hero-facts dd {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--text-3);
}

.hero-visual {
  position: relative;
  min-height: 440px;
  display: grid;
  place-items: center;
}
/* วงแหวน HUD */
.orbit {
  position: absolute;
  width: min(440px, 90%);
  aspect-ratio: 1;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: radial-gradient(circle, rgba(139, 92, 246, 0.28), transparent 62%);
}
.orbit::after {
  content: "";
  position: absolute;
  inset: 12%;
  border-radius: 50%;
  border: 1px dashed rgba(34, 211, 238, 0.25);
}
.orbit-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50%;
  border: 1px solid transparent;
  border-top-color: var(--accent);
  border-right-color: rgba(34, 211, 238, 0.3);
  filter: drop-shadow(0 0 6px rgba(34, 211, 238, 0.7));
}
@media (prefers-reduced-motion: no-preference) {
  .orbit-ring {
    animation: spin 9s linear infinite;
  }
  .mc-cursor {
    animation: blink 1.1s steps(1) infinite;
  }
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes blink {
  50% {
    opacity: 0;
  }
}

/* บัตรสมาชิกแบบดิจิทัล */
.member-card {
  position: relative;
  width: min(380px, 88%);
  aspect-ratio: 1.586;
  padding: 22px 24px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  color: var(--text);
  overflow: hidden;
  background:
    linear-gradient(rgba(167, 139, 250, 0.08) 1px, transparent 1px) 0 0 / 22px 22px,
    linear-gradient(90deg, rgba(167, 139, 250, 0.08) 1px, transparent 1px) 0 0 / 22px 22px,
    radial-gradient(circle at 100% 0%, rgba(34, 211, 238, 0.22), transparent 45%),
    linear-gradient(140deg, #2a1259 0%, #160b33 60%, #0c0718 100%);
  border: 1px solid rgba(167, 139, 250, 0.5);
  box-shadow:
    0 0 0 1px rgba(34, 211, 238, 0.15),
    0 0 40px rgba(139, 92, 246, 0.35),
    0 40px 80px -30px rgba(0, 0, 0, 0.9);
  transform: perspective(900px) rotateY(-12deg) rotateX(6deg);
}
.member-card::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, transparent 30%, rgba(255, 255, 255, 0.08) 45%, transparent 60%);
  pointer-events: none;
}
.mc-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mc-brand {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.mc-slash {
  margin: 0 4px;
  color: var(--accent);
}
.mc-tier {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.16em;
  color: var(--accent);
}
.mc-chip {
  display: flex;
  gap: 3px;
  width: 44px;
  height: 32px;
  margin-top: 16px;
  padding: 5px;
  border-radius: 4px;
  border: 1px solid rgba(34, 211, 238, 0.6);
  background: rgba(34, 211, 238, 0.08);
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.35);
}
.mc-chip span {
  flex: 1;
  border-radius: 1px;
  background: rgba(34, 211, 238, 0.5);
}
.mc-label {
  margin-top: auto;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  color: var(--text-3);
}
.mc-points {
  font-size: 36px;
  font-weight: 600;
  line-height: 1.15;
  color: #fff;
  text-shadow: 0 0 18px rgba(139, 92, 246, 0.8);
}
.mc-cursor {
  color: var(--accent);
}
.mc-bottom {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--text-3);
}
.float-note {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(17, 12, 32, 0.9);
  border: 1px solid var(--border-strong);
  box-shadow: var(--shadow), 0 0 20px rgba(139, 92, 246, 0.2);
  backdrop-filter: blur(10px);
}
.note-1 {
  left: 0;
  bottom: 8px;
}
.note-2 {
  right: 0;
  top: 24px;
}
.note-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: var(--accent-soft);
  color: var(--accent);
}
.note-title {
  font-size: 13px;
  font-weight: 600;
}
.note-sub {
  font-size: 12px;
  color: var(--text-3);
}

@media (prefers-reduced-motion: no-preference) {
  .note-1 {
    animation: float 6s ease-in-out infinite;
  }
  .note-2 {
    animation: float 7s ease-in-out infinite reverse;
  }
}
@keyframes float {
  50% {
    transform: translateY(-10px);
  }
}

/* ---------- sections ---------- */
.section {
  padding-top: clamp(48px, 7vw, 88px);
}
.section-head {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 32px;
}
.section-head-row {
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}
.section-head-row > div {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.section-title {
  font-size: clamp(28px, 3.6vw, 40px);
}
.link-arrow {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-weight: 500;
}

.steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}
.step {
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow: hidden;
}
.step-no {
  position: absolute;
  top: 18px;
  right: 22px;
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.1em;
  color: var(--accent);
}
.step-title,
.benefit-title,
.reward-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.step p,
.benefit p {
  margin: 0;
  font-size: 14px;
}

.reward-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}
.reward {
  overflow: hidden;
  padding: 0;
}
.reward .ant-skeleton {
  padding: 20px;
}
.reward-media {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}
.reward-media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.reward:hover .reward-media img {
  transform: scale(1.04);
}
.reward-placeholder {
  font-size: 36px;
  color: var(--text-3);
}
.reward-body {
  padding: 18px 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}
.reward-title {
  font-size: 16px;
}

.benefits {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 40px;
  padding: clamp(28px, 4vw, 48px);
  background:
    radial-gradient(500px 300px at 0% 0%, rgba(124, 58, 237, 0.18), transparent 70%),
    var(--surface);
}
.benefits-intro {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.benefits-intro p {
  margin: 0;
}
.benefit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px;
}
.benefit {
  display: flex;
  gap: 14px;
}
.benefit-title {
  font-size: 16px;
  margin-bottom: 4px;
}

.faq-wrap {
  max-width: 820px;
}
.faq {
  background: transparent;
}
.faq :deep(.ant-collapse-item) {
  margin-bottom: 12px;
  border: 1px solid var(--border) !important;
  border-radius: var(--radius) !important;
  background: var(--surface);
  overflow: hidden;
}
.faq :deep(.ant-collapse-header) {
  padding: 18px 22px !important;
  font-weight: 500;
}
.faq p {
  margin: 0;
}

.cta {
  margin-bottom: clamp(48px, 7vw, 88px);
  padding: clamp(36px, 6vw, 64px) 24px;
  text-align: center;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-strong);
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(rgba(167, 139, 250, 0.07) 1px, transparent 1px) 0 0 / 32px 32px,
    linear-gradient(90deg, rgba(167, 139, 250, 0.07) 1px, transparent 1px) 0 0 / 32px 32px,
    radial-gradient(600px 300px at 50% 0%, rgba(139, 92, 246, 0.35), transparent 70%),
    linear-gradient(180deg, #160b33, #0c0718);
  box-shadow: var(--shadow-glow);
}
.cta-title {
  font-size: clamp(28px, 4vw, 42px);
}
.cta-sub {
  margin: 12px 0 28px;
  color: var(--text-2);
}
.cta-actions {
  justify-content: center;
}

@media (max-width: 960px) {
  .hero {
    grid-template-columns: 1fr;
  }
  .hero-visual {
    min-height: 360px;
  }
  .reward-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .benefits {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 720px) {
  .steps {
    grid-template-columns: 1fr;
  }
  .benefit-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 360px) {
  .hero-title .line {
    white-space: normal;
  }
}
@media (max-width: 480px) {
  .hero-facts {
    gap: 22px;
  }
  .reward-grid {
    grid-template-columns: 1fr;
  }
  .note-1 {
    bottom: 16px;
  }
  .note-2 {
    top: 8px;
  }
}
</style>
