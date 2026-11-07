<script setup>
import dayjs from "dayjs";
import { ArrowLeftOutlined, UserOutlined } from "@ant-design/icons-vue";

definePageMeta({ layout: "admin" });

const supabase = useSupabase();
const router = useRouter();
const { message } = useUi();

const loading = ref(false);
const customers = ref([]);
const loadingCustomers = ref(false);

const POINT_RATE = 10;
// แสดงผลล่วงหน้าเท่านั้น database คำนวณแต้มจริงตอนบันทึก
const calcPoints = (amount) => Math.floor((Number(amount) || 0) / POINT_RATE);

const form = reactive({
  customer_id: null,
  amount: null,
  note: "",
  sold_at: dayjs().format("YYYY-MM-DD"),
});

const selectedCustomer = computed(() => customers.value.find((c) => c.id === form.customer_id));

const loadCustomers = async () => {
  try {
    loadingCustomers.value = true;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, username, role, points")
      .eq("role", "customer")
      .order("created_at", { ascending: false });

    if (error) throw error;
    customers.value = data || [];
  } catch (e) {
    message.error("โหลดรายชื่อลูกค้าไม่สำเร็จ");
  } finally {
    loadingCustomers.value = false;
  }
};

onMounted(loadCustomers);

const filterOption = (input, option) =>
  String(option?.label || "").toLowerCase().includes(input.toLowerCase());

const save = async () => {
  if (!form.customer_id) return message.warning("กรุณาเลือกลูกค้า");
  if (!form.amount || form.amount <= 0)
    return message.warning("กรุณากรอกยอดขายที่ถูกต้อง");

  try {
    loading.value = true;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ใช้วันที่ที่เลือก + เวลาปัจจุบัน
    const now = dayjs();
    const soldAt = dayjs(form.sold_at).hour(now.hour()).minute(now.minute()).second(now.second());

    const payload = {
      customer_id: form.customer_id,
      amount: Number(form.amount),
      points_earned: calcPoints(form.amount),
      note: form.note?.trim() || null,
      created_by: user.id,
      created_at: soldAt.toISOString(),
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
  <div class="page">
    <PageHeader eyebrow="New sale" title="บันทึกยอดขาย" subtitle="เพิ่มยอดขายให้ลูกค้า ระบบจะเพิ่มแต้มเข้าบัญชีลูกค้าอัตโนมัติ">
      <template #actions>
        <a-button @click="router.back()"><template #icon><ArrowLeftOutlined /></template> ย้อนกลับ</a-button>
      </template>
    </PageHeader>

    <div class="layout">
      <section class="surface surface-pad">
        <a-form layout="vertical" requiredMark="optional" @finish="save">
          <a-form-item label="ลูกค้า" required>
            <a-select
              v-model:value="form.customer_id"
              show-search
              size="large"
              placeholder="ค้นหาด้วยชื่อผู้ใช้หรืออีเมล"
              :loading="loadingCustomers"
              :filter-option="filterOption"
              :options="customers.map((c) => ({ value: c.id, label: memberLabel(c) }))"
            >
              <template #suffixIcon><UserOutlined /></template>
            </a-select>
          </a-form-item>

          <div class="row">
            <a-form-item label="วันที่ขาย" required>
              <a-date-picker
                v-model:value="form.sold_at"
                valueFormat="YYYY-MM-DD"
                format="D MMM YYYY"
                size="large"
                :allowClear="false"
                style="width: 100%"
              />
            </a-form-item>

            <a-form-item label="ยอดขาย (บาท)" required>
              <a-input-number
                v-model:value="form.amount"
                size="large"
                :min="0"
                :precision="2"
                style="width: 100%"
                placeholder="0.00"
                :formatter="(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                :parser="(value) => value.replace(/,/g, '')"
              >
                <template #prefix><span class="subtle">฿</span></template>
              </a-input-number>
            </a-form-item>
          </div>

          <a-form-item label="รายการสินค้า / หมายเหตุ">
            <a-textarea
              v-model:value="form.note"
              placeholder="เช่น ฟิล์มม่วง iPhone 15 Pro Max"
              :rows="3"
              :maxlength="200"
              show-count
            />
          </a-form-item>

          <div class="form-actions">
            <a-button size="large" @click="router.back()">ยกเลิก</a-button>
            <a-button type="primary" size="large" html-type="submit" :loading="loading">
              บันทึกยอดขาย
            </a-button>
          </div>
        </a-form>
      </section>

      <aside class="summary">
        <div class="summary-card">
          <span class="eyebrow">ลูกค้าจะได้รับ</span>
          <div class="summary-points num">+{{ calcPoints(form.amount).toLocaleString() }} <span>แต้ม</span></div>
          <div class="hairline"></div>
          <dl>
            <div>
              <dt class="subtle">ลูกค้า</dt>
              <dd>{{ memberLabel(selectedCustomer) || "—" }}</dd>
            </div>
            <div>
              <dt class="subtle">แต้มปัจจุบัน</dt>
              <dd class="num">{{ selectedCustomer ? Number(selectedCustomer.points || 0).toLocaleString() : "—" }}</dd>
            </div>
            <div>
              <dt class="subtle">อัตรา</dt>
              <dd>10 บาท = 1 แต้ม</dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 0.7fr);
  gap: 24px;
  align-items: start;
}
.row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.summary-card {
  position: sticky;
  top: 24px;
  padding: 26px;
  border-radius: var(--radius);
  border: 1px solid var(--border-strong);
  background:
    linear-gradient(rgba(167, 139, 250, 0.07) 1px, transparent 1px) 0 0 / 24px 24px,
    linear-gradient(90deg, rgba(167, 139, 250, 0.07) 1px, transparent 1px) 0 0 / 24px 24px,
    radial-gradient(400px 220px at 100% 0%, rgba(34, 211, 238, 0.16), transparent 70%),
    linear-gradient(160deg, #1f0f45, #0f0a1f);
  box-shadow: var(--shadow-glow);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.summary-points {
  font-family: var(--font-mono);
  font-weight: 600;
  text-shadow: var(--glow-accent);
  font-size: 48px;
  line-height: 1;
  color: var(--accent);
}
.summary-points span {
  font-family: var(--font-sans);
  font-size: 16px;
  color: var(--text-2);
}
dl {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
dl div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
dd {
  margin: 0;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .summary-card {
    position: static;
    padding: 18px 20px;
  }
  .summary-points {
    font-size: 40px;
  }
}
@media (max-width: 520px) {
  .row {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }
}
</style>
