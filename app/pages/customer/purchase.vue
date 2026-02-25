<script setup>
import { message } from "ant-design-vue";

definePageMeta({ layout: "customer" });

const supabase = useSupabase();

const loading = ref(false);
const me = ref(null); // {id,email,points}

const form = reactive({
  email: "",
  item_name: "",
  amount: null,
});

// 100 บาท = 10 แต้ม => amount * 0.1 ปัดลง
const pointsEarned = computed(() => {
  const amt = Number(form.amount || 0);
  return Math.floor(amt * 0.1);
});

const loadMe = async () => {
  const { data: u } = await supabase.auth.getUser();
  const user = u?.user;
  if (!user) return navigateTo("/auth/login");

  const { data: p, error } = await supabase
    .from("profiles")
    .select("id,email,points")
    .eq("id", user.id)
    .single();

  if (error) throw error;

  me.value = p;
  form.email = p?.email || "";
};

onMounted(() => {
  loadMe().catch((e) => {
    console.error(e);
    message.error(e?.message || "โหลดผู้ใช้ไม่สำเร็จ");
  });
});

const save = async () => {
  try {
    if (!me.value?.id) return;

    if (!form.email.trim()) return message.warning("กรุณากรอกอีเมล");
    if (!form.item_name.trim())
      return message.warning("กรุณากรอกสินค้าที่ซื้อ");
    if (!form.amount || Number(form.amount) <= 0)
      return message.warning("กรุณากรอกราคาให้ถูกต้อง");

    // กันกรอกอีเมลไม่ตรงกับที่สมัคร
    if (
      form.email.trim().toLowerCase() !== (me.value.email || "").toLowerCase()
    ) {
      return message.error("อีเมลต้องตรงกับอีเมลที่สมัครไว้");
    }

    loading.value = true;

    const payloadSale = {
      customer_id: me.value.id,
      customer_email: me.value.email,
      amount: Number(form.amount),
      points_earned: pointsEarned.value,
      note: form.item_name.trim(), // เผื่อหน้า admin ใช้ note อยู่แล้ว
    };

    // 1) insert sales
    const { error: sErr } = await supabase.from("sales").insert(payloadSale);
    if (sErr) throw sErr;

    // 2) update points ใน profiles (เพิ่มแต้ม)
    const nextPoints =
      Number(me.value.points || 0) + Number(pointsEarned.value || 0);

    const { error: pErr } = await supabase
      .from("profiles")
      .update({ points: nextPoints })
      .eq("id", me.value.id);

    if (pErr) throw pErr;

    message.success("บันทึกการซื้อแล้ว");

    // reset form
    form.item_name = "";
    form.amount = null;

    // กลับ dashboard
    // navigateTo("/customer");
  } catch (e) {
    console.error(e);
    message.error(e?.message || "บันทึกไม่สำเร็จ");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="purchase-wrap">
    <div class="neon-orb orb-purple"></div>
    <div class="neon-orb orb-blue"></div>

    <div class="purchase-shell">
      <section class="purchase-left">
        <div class="glass-overlay"></div>
        <div class="left-content">
          <div class="left-badge">
            <span class="pulse-dot"></span>
            SYSTEM ONLINE
          </div>

          <h2 class="left-title">
            สะสมแต้ม <br /><span class="text-highlight">รายการซื้อ</span>
          </h2>
          <p class="left-subtitle">
            ทุกการใช้จ่ายมีความหมาย <br />
            <span class="rate-tag">100 THB = 10 PTS</span>
          </p>

          <div class="left-kpi">
            <div class="kpi-card-advanced">
              <div class="kpi-header">
                <ThunderboltFilled class="icon-energy" />
                <span>ESTIMATED POINTS</span>
              </div>
              <div class="kpi-main">
                <span class="kpi-value-big">{{
                  pointsEarned.toLocaleString()
                }}</span>
                <span class="kpi-suffix">POINTS</span>
              </div>
              <div class="kpi-progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: (pointsEarned % 100) + '%' }"
                ></div>
              </div>
            </div>

            <div class="security-note">
              <SafetyCertificateFilled />
              บันทึกข้อมูลผ่านระบบเข้ารหัสความปลอดภัยสูง
            </div>
          </div>
        </div>
      </section>

      <section class="purchase-right">
        <div class="form-container">
          <div class="purchase-head">
            <h2 class="form-title">Transaction Details</h2>
            <p class="form-subtitle">กรุณาระบุรายละเอียดสินค้าและราคา</p>
          </div>

          <a-form
            layout="vertical"
            :model="form"
            @finish="save"
            class="custom-form"
          >
            <a-form-item label="บัญชีผู้ใช้งาน">
              <a-input
                v-model:value="form.email"
                placeholder="email@example.com"
                readonly
                class="input-readonly"
              >
                <template #prefix
                  ><UserOutlined style="color: #722ed1"
                /></template>
              </a-input>
            </a-form-item>

            <a-form-item label="ชื่อสินค้า / รุ่นโทรศัพท์" required>
              <a-input
                v-model:value="form.item_name"
                placeholder="เช่น เคส iPhone 15 Pro Max หรือ ฟิล์ม"
                class="input-premium"
              />
            </a-form-item>

            <a-form-item label="ราคาชำระจริง (บาท)" required>
              <a-input-number
                v-model:value="form.amount"
                :min="1"
                class="input-number-premium"
                :formatter="
                  (value) => `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                "
                :parser="(value) => value.replace(/\฿\s?|(,*)/g, '')"
              />
            </a-form-item>

            <div class="point-preview-box">
              <div class="preview-label">คุณจะได้รับแต้มสะสม</div>
              <div class="preview-value">
                + {{ pointsEarned.toLocaleString() }} <span>PTS</span>
              </div>
            </div>

            <div class="purchase-actions">
              <a-button class="btn-back" @click="navigateTo('/customer')">
                ยกเลิก
              </a-button>

              <a-button
                class="btn-submit-glow"
                type="primary"
                html-type="submit"
                :loading="loading"
              >
                ยืนยันรายการซื้อ
              </a-button>
            </div>
          </a-form>
        </div>
      </section>
    </div>
  </div>
</template>
<style scoped>
.purchase-wrap {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 40px 20px;
  background: #020617; /* พื้นหลังเข้มแบบพรีเมียม */
  position: relative;
  overflow: hidden;
}

/* Neon Background Decor */
.neon-orb {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.15;
  z-index: 0;
}
.orb-purple {
  background: #722ed1;
  top: -100px;
  left: -100px;
}
.orb-blue {
  background: #1890ff;
  bottom: -100px;
  right: -100px;
}

.purchase-shell {
  width: 100%;
  max-width: 1050px;
  min-height: 600px;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 50px 100px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

/* Left Panel */
.purchase-left {
  position: relative;
  padding: 60px;
  background: linear-gradient(135deg, #1e1b4b 0%, #722ed1 100%);
  color: #fff;
  display: flex;
  align-items: center;
}

.text-highlight {
  color: #00d2ff;
  text-shadow: 0 0 15px rgba(0, 210, 255, 0.5);
}

.left-badge {
  background: rgba(0, 0, 0, 0.3);
  padding: 6px 16px;
  border-radius: 100px;
  font-size: 11px;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.pulse-dot {
  width: 6px;
  height: 6px;
  background: #00ff88;
  border-radius: 50%;
  box-shadow: 0 0 10px #00ff88;
  animation: pulse 2s infinite;
}

.left-title {
  font-size: 48px;
  font-weight: 900;
  margin: 24px 0;
  line-height: 1;
  color: #fff;
}

.rate-tag {
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 12px;
  border-radius: 8px;
  font-weight: 700;
  color: #00d2ff;
}

.kpi-card-advanced {
  background: rgba(0, 0, 0, 0.25);
  padding: 24px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 30px;
}

.kpi-header {
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.icon-energy {
  color: #fadb14;
}

.kpi-value-big {
  font-size: 56px;
  font-weight: 900;
  line-height: 1;
}

.kpi-suffix {
  font-size: 14px;
  margin-left: 10px;
  color: #94a3b8;
}

/* Right Panel */
.purchase-right {
  padding: 60px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0;
  color: #0f172a;
}

.form-subtitle {
  color: #64748b;
  margin-bottom: 32px;
}

.input-premium,
.input-readonly {
  height: 50px !important;
  border-radius: 12px !important;
  font-size: 16px !important;
  border: 1px solid #e2e8f0 !important;
}

.input-number-premium {
  width: 100% !important;
  height: 50px !important;
  border-radius: 12px !important;
  display: flex;
  align-items: center;
  font-size: 18px !important;
  font-weight: 700 !important;
}

.point-preview-box {
  background: #f8fafc;
  border: 2px dashed #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  margin: 24px 0;
}

.preview-value {
  font-size: 32px;
  font-weight: 900;
  color: #722ed1;
}

.preview-value span {
  font-size: 14px;
  color: #64748b;
}

/* Buttons */
.btn-submit-glow {
  height: 54px !important;
  border-radius: 16px !important;
  font-weight: 700 !important;
  font-size: 16px !important;
  background: linear-gradient(90deg, #722ed1, #1890ff) !important;
  border: none !important;
  box-shadow: 0 10px 25px rgba(114, 46, 209, 0.3) !important;
  flex: 1;
}

.btn-back {
  height: 54px !important;
  border-radius: 16px !important;
  border: 1px solid #e2e8f0 !important;
  color: #64748b !important;
  width: 100px;
}

.purchase-actions {
  display: flex;
  gap: 16px;
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

@media (max-width: 900px) {
  .purchase-shell {
    grid-template-columns: 1fr;
  }
  .purchase-left {
    display: none;
  } /* ซ่อนพาเนลซ้ายในมือถือเพื่อความคล่องตัว */
  .purchase-right {
    padding: 40px 24px;
  }
}
</style>
