<script setup>
import { message } from "ant-design-vue";
import {
  UserOutlined,
  DollarOutlined,
  EditOutlined,
  CalendarOutlined,
} from "@ant-design/icons-vue";

definePageMeta({ layout: "admin" });

const supabase = useSupabase();
const router = useRouter();
const loading = ref(false);
const customers = ref([]);
const loadingCustomers = ref(false);

const POINT_RATE = 10;
const calcPoints = (amount) => Math.floor((Number(amount) || 0) / POINT_RATE);

const form = reactive({
  customer_id: null,
  amount: null,
  note: "",
  sold_at: new Date().toISOString().split("T")[0], // Default วันนี้
});

// โหลดรายชื่อลูกค้า
const loadCustomers = async () => {
  try {
    loadingCustomers.value = true;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, role")
      .eq("role", "customer") // กรองเฉพาะลูกค้า
      .order("email", { ascending: true });

    if (error) throw error;
    customers.value = data || [];
  } catch (e) {
    message.error("โหลดรายชื่อลูกค้าไม่สำเร็จ");
  } finally {
    loadingCustomers.value = false;
  }
};

onMounted(loadCustomers);

const save = async () => {
  if (!form.customer_id) return message.warning("กรุณาเลือกลูกค้า");
  if (!form.amount || form.amount <= 0)
    return message.warning("กรุณากรอกยอดขายที่ถูกต้อง");

  try {
    loading.value = true;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      customer_id: form.customer_id,
      amount: Number(form.amount),
      points_earned: calcPoints(form.amount),
      note: form.note?.trim() || null,
      created_by: user.id,
      created_at: form.sold_at, // ใช้ค่าจาก DatePicker
    };

    const { error } = await supabase.from("sales").insert(payload);
    if (error) throw error;

    message.success("บันทึกยอดขายและเพิ่มแต้มเรียบร้อยแล้ว");
    router.push("/admin/sales");
  } catch (e) {
    message.error(e.message || "บันทึกไม่สำเร็จ");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="new-sale-page">
    <div class="bg-aura aura-purple"></div>
    <div class="bg-aura aura-blue"></div>

    <div class="form-shell">
      <div class="header-section">
        <a-button class="btn-back" @click="$router.back()" shape="circle">
          <template #icon><ArrowLeftOutlined /></template>
        </a-button>
        <div class="header-text">
          <h2 class="title">NEW TRANSACTION</h2>
          <p class="subtitle">ระบบบันทึกยอดขายและคำนวณแต้มอัจฉริยะ</p>
        </div>
      </div>

      <a-card class="glass-form-card" :bordered="false">
        <a-form layout="vertical" class="premium-form">
          <div class="form-group-label"><UserOutlined /> ข้อมูลลูกค้า</div>
          <a-form-item label="ระบุอีเมลลูกค้า">
            <a-select
              v-model:value="form.customer_id"
              show-search
              placeholder="ค้นหาลูกค้า..."
              :loading="loadingCustomers"
              class="premium-select"
            >
              <template #suffixIcon><SearchOutlined /></template>
              <a-select-option v-for="c in customers" :key="c.id" :value="c.id">
                <div class="customer-option">
                  <UserOutlined /> <span>{{ c.email }}</span>
                </div>
              </a-select-option>
            </a-select>
          </a-form-item>

          <div class="form-group-label">
            <DollarOutlined /> รายละเอียดการขาย
          </div>
          <a-row :gutter="20">
            <a-col :xs="24" :sm="12">
              <a-form-item label="วันที่ทำรายการ">
                <a-date-picker
                  v-model:value="form.sold_at"
                  valueFormat="YYYY-MM-DD"
                  class="premium-input"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item label="ยอดขายรวม (บาท)">
                <a-input-number
                  v-model:value="form.amount"
                  class="premium-input-number"
                  :min="0"
                  :step="10"
                  placeholder="0.00"
                  style="width: 100%"
                  :formatter="
                    (value) =>
                      `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  "
                  :parser="(value) => value.replace(/\฿\s?|(,*)/g, '')"
                />
              </a-form-item>
            </a-col>
          </a-row>

          <div
            class="calculator-panel"
            :class="{ 'has-value': form.amount > 0 }"
          >
            <div class="calc-glow"></div>
            <div class="calc-content">
              <span class="calc-label">ESTIMATED REWARD</span>
              <div class="calc-main">
                <span class="calc-num">{{ calcPoints(form.amount) }}</span>
                <span class="calc-unit">PTS</span>
              </div>
              <div class="calc-footer">10 THB = 1 POINT SYSTEM</div>
            </div>
          </div>

          <a-form-item label="บันทึกช่วยจำ (Notes)">
            <a-textarea
              v-model:value="form.note"
              placeholder="เช่น ฟิล์มม่วง iPhone 15 Pro Max..."
              :rows="3"
              class="premium-input-area"
            />
          </a-form-item>

          <div class="action-footer">
            <a-button
              type="primary"
              class="btn-save-sale"
              :loading="loading"
              @click="save"
              block
            >
              <template #icon><ThunderboltFilled /></template>
              บันทึกยอดขาย
            </a-button>
          </div>
        </a-form>
      </a-card>
    </div>
  </div>
</template>
<style scoped>
/* ===== 🌌 Layout & High-Tech Background ===== */
.new-sale-page {
  min-height: 100vh;
  background: #050810; /* พื้นหลังมืดลึก */
  padding: 60px 20px;
  display: flex;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.bg-aura {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.15;
  z-index: 0;
}
.aura-purple {
  top: -100px;
  right: -100px;
  background: #722ed1;
}
.aura-blue {
  bottom: -100px;
  left: -100px;
  background: #1890ff;
}

.form-shell {
  width: 100%;
  max-width: 600px;
  z-index: 1;
}

/* ===== 🏷️ Header Style ===== */
.header-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 40px;
}
.btn-back {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.btn-back:hover {
  background: rgba(114, 46, 209, 0.2) !important;
  border-color: #722ed1 !important;
  transform: scale(1.1);
}
.title {
  color: #fff !important;
  margin: 0 !important;
  font-weight: 900;
  font-size: 28px;
  letter-spacing: 2px;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
}
.subtitle {
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* ===== 💎 Glassmorphism Card ===== */
.glass-form-card {
  background: rgba(15, 23, 42, 0.6) !important;
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 32px !important;
  padding: 24px;
  box-shadow:
    0 40px 100px rgba(0, 0, 0, 0.6),
    inset 0 0 20px rgba(255, 255, 255, 0.02);
}

.form-group-label {
  color: #d8b4fe;
  font-weight: 800;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 25px 0 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ===== ⌨️ Premium Inputs ===== */
:deep(.ant-form-item-label > label) {
  color: rgba(255, 255, 255, 0.8) !important;
  font-weight: 500;
  font-size: 14px;
}

.premium-input,
.premium-select :deep(.ant-select-selector),
.premium-input-number,
.premium-input-area {
  background: rgba(0, 0, 0, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 16px !important;
  color: #ffffff !important;
  min-height: 50px !important;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* ปรับสีตัวเลขใน InputNumber */
:deep(.ant-input-number-input),
:deep(.ant-select-selection-item),
:deep(.ant-picker-input > input) {
  color: #fff !important;
  font-weight: 600 !important;
}

.premium-input:hover,
.premium-select:hover :deep(.ant-select-selector),
.premium-input-number:hover {
  border-color: rgba(114, 46, 209, 0.6) !important;
  box-shadow: 0 0 15px rgba(114, 46, 209, 0.2) !important;
}

/* ===== 🔋 Calculator Panel (High-Tech Display) ===== */
.calculator-panel {
  position: relative;
  background: rgba(114, 46, 209, 0.05);
  border-radius: 24px;
  padding: 30px;
  margin: 30px 0;
  border: 1px solid rgba(114, 46, 209, 0.15);
  overflow: hidden;
  transition: all 0.5s ease;
}
.calculator-panel.has-value {
  background: rgba(114, 46, 209, 0.12);
  border-color: rgba(114, 46, 209, 0.4);
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}
.calc-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  background: #722ed1;
  filter: blur(60px);
  opacity: 0.2;
  transform: translate(-50%, -50%);
}
.calc-content {
  position: relative;
  z-index: 1;
  text-align: center;
}
.calc-label {
  color: #d8b4fe;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 3px;
}
.calc-main {
  margin: 10px 0;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 10px;
}
.calc-num {
  color: #fff;
  font-size: 56px;
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 0 30px rgba(114, 46, 209, 0.5);
}
.calc-unit {
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  opacity: 0.6;
}
.calc-footer {
  color: rgba(255, 255, 255, 0.3);
  font-size: 10px;
  letter-spacing: 1px;
}

/* ===== ⚡ Action Button (Neon Gradient) ===== */
.btn-save-sale {
  height: 60px !important;
  border-radius: 20px !important;
  font-weight: 800 !important;
  font-size: 16px !important;
  letter-spacing: 2px !important;
  background: linear-gradient(135deg, #722ed1 0%, #3b82f6 100%) !important;
  border: none !important;
  box-shadow: 0 20px 40px rgba(114, 46, 209, 0.4) !important;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
}
.btn-save-sale:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 25px 50px rgba(114, 46, 209, 0.6) !important;
  filter: brightness(1.2);
}
.btn-save-sale:active {
  transform: scale(0.98);
}
</style>
