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
    navigateTo("/customer");
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
    <div class="purchase-shell">
      <!-- Left panel -->
      <section class="purchase-left">
        <div class="left-bubbles">
          <span class="bubble b1" />
          <span class="bubble b2" />
          <span class="bubble b3" />
          <span class="bubble b4" />
        </div>

        <div class="left-content">
          <div class="left-badge">Loyalty</div>

          <h1 class="left-title">Welcome</h1>
          <p class="left-subtitle">
            กรอกข้อมูลการซื้อเพื่อรับแต้มสะสม
            <br />
            100 บาท = 10 แต้ม
          </p>

          <div class="left-kpi">
            <div class="kpi-card">
              <div class="kpi-label">แต้มที่จะได้รับ</div>
              <div class="kpi-value">
                {{ pointsEarned.toLocaleString() }}
                <span class="kpi-unit">แต้ม</span>
              </div>
            </div>

            <div class="kpi-hint">
              ระบบจะบันทึกลงตารางยอดขาย และเพิ่มแต้มให้บัญชีคุณอัตโนมัติ
            </div>
          </div>
        </div>
      </section>

      <!-- Right form -->
      <section class="purchase-right">
        <a-card class="purchase-card" :bordered="false">
          <div class="purchase-head">
            <a-typography-title :level="3" class="purchase-title">
              กรอกข้อมูลการซื้อ
            </a-typography-title>
            <div class="purchase-desc">
              โปรดตรวจสอบอีเมลให้ตรงกับที่สมัครไว้
            </div>
          </div>

          <a-form layout="vertical" :model="form" @finish="save">
            <a-form-item label="Email" required>
              <a-input
                v-model:value="form.email"
                placeholder="email@example.com"
                readonly
              />
            </a-form-item>

            <a-form-item label="สินค้าที่ซื้อ" required>
              <a-input
                v-model:value="form.item_name"
                placeholder="เช่น เคส iPhone / ฟิล์มกันรอย"
              />
            </a-form-item>

            <a-form-item label="ราคา (บาท)" required>
              <a-input-number
                v-model:value="form.amount"
                style="width: 100%"
                :min="1"
              />
            </a-form-item>

            <a-alert
              class="purchase-alert"
              type="info"
              show-icon
              :message="`แต้มที่จะได้รับ: ${pointsEarned.toLocaleString()} แต้ม (100 บาท = 10 แต้ม)`"
            />

            <div class="purchase-actions">
              <a-button class="btn-ghost" @click="navigateTo('/customer')">
                ย้อนกลับ
              </a-button>

              <a-button
                class="btn-primary"
                type="primary"
                html-type="submit"
                :loading="loading"
              >
                บันทึก
              </a-button>
            </div>
          </a-form>
        </a-card>
      </section>
    </div>
  </div>
</template>
<style scoped>
/* Page background */
.purchase-wrap {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px 16px;
  background: #f5f8ff;
}

/* Shell */
.purchase-shell {
  width: 100%;
  max-width: 1100px;
  min-height: 560px;
  border-radius: 22px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 24px 60px rgba(2, 6, 23, 0.12);
}

/* Left panel */
.purchase-left {
  position: relative;
  padding: 34px;
  background:
    radial-gradient(
      900px 520px at 20% 0%,
      rgba(255, 255, 255, 0.28),
      transparent 55%
    ),
    linear-gradient(135deg, #2f7bff 0%, #22c1ff 100%);
  color: #fff;
}

.left-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.left-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.22);
  font-weight: 800;
  letter-spacing: 0.2px;
  margin-bottom: 18px;
}

.left-title {
  margin: 0;
  font-size: 44px;
  font-weight: 950;
  letter-spacing: -0.6px;
  text-shadow: 0 14px 34px rgba(0, 0, 0, 0.18);
}

.left-subtitle {
  margin: 10px 0 0;
  opacity: 0.92;
  font-size: 15px;
  line-height: 1.65;
}

.left-kpi {
  margin-top: 26px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kpi-card {
  border-radius: 16px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8px);
}

.kpi-label {
  opacity: 0.9;
  font-weight: 700;
  font-size: 13px;
}

.kpi-value {
  margin-top: 6px;
  font-weight: 950;
  font-size: 28px;
  letter-spacing: -0.3px;
}

.kpi-unit {
  font-size: 13px;
  font-weight: 800;
  opacity: 0.9;
  margin-left: 8px;
}

.kpi-hint {
  font-size: 13px;
  opacity: 0.88;
  line-height: 1.6;
}

/* Bubble decorations */
.left-bubbles {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.bubble {
  position: absolute;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  filter: blur(0px);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
}

.b1 {
  width: 86px;
  height: 86px;
  top: 28px;
  left: 26px;
  opacity: 0.55;
}

.b2 {
  width: 140px;
  height: 140px;
  top: 90px;
  right: -50px;
  opacity: 0.35;
}

.b3 {
  width: 110px;
  height: 110px;
  bottom: 64px;
  left: 64px;
  opacity: 0.35;
}

.b4 {
  width: 64px;
  height: 64px;
  bottom: 34px;
  right: 70px;
  opacity: 0.45;
}

/* Right panel */
.purchase-right {
  display: grid;
  place-items: center;
  padding: 28px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
}

.purchase-card {
  width: 100%;
  max-width: 460px;
  border-radius: 18px !important;
  border: 1px solid rgba(15, 23, 42, 0.06) !important;
  box-shadow: 0 18px 44px rgba(2, 6, 23, 0.08);
}

.purchase-head {
  margin-bottom: 10px;
}

.purchase-title {
  margin: 0 !important;
  font-weight: 950 !important;
  letter-spacing: -0.3px;
  color: #0f172a !important;
}

.purchase-desc {
  margin-top: 6px;
  font-size: 13px;
  color: rgba(15, 23, 42, 0.62);
}

/* Inputs */
:deep(.ant-form-item-label > label) {
  font-weight: 800;
}

:deep(.ant-input),
:deep(.ant-input-affix-wrapper),
:deep(.ant-input-number) {
  border-radius: 12px !important;
}

:deep(.ant-input) {
  padding: 10px 12px !important;
}

:deep(.ant-input-affix-wrapper) {
  padding: 6px 10px !important;
}

:deep(.ant-input-number) {
  width: 100%;
  padding: 6px 10px !important;
}

/* Alert */
.purchase-alert {
  margin: 6px 0 14px;
  border-radius: 14px;
}

/* Actions */
.purchase-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 6px;
}

.btn-ghost {
  border-radius: 12px;
  height: 42px;
  padding: 0 16px;
}

.btn-primary {
  border-radius: 12px;
  height: 42px;
  padding: 0 18px;
  font-weight: 900;
  box-shadow: 0 12px 26px rgba(47, 123, 255, 0.28);
}

/* Responsive */
@media (max-width: 900px) {
  .purchase-shell {
    grid-template-columns: 1fr;
    min-height: unset;
  }
  .purchase-left {
    padding: 26px 22px;
  }
  .purchase-right {
    padding: 18px;
  }
}

/* กัน pointer-events เพี้ยน */
.purchase-wrap * {
  pointer-events: auto;
}
</style>
