<script setup>
import {
  ShoppingOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons-vue";

definePageMeta({ layout: "customer" });

const supabase = useSupabase();
const auth = useAuthStore();
const { message } = useUi();

const loading = ref(false);
const me = ref(null); // {id,email,points}
const lastResult = ref(null);

const form = reactive({
  item_name: "",
  amount: null,
});

// แสดงแต้มที่จะได้ล่วงหน้าเท่านั้น แต้มจริงคำนวณใน database (points_for_amount): 10 บาท = 1 แต้ม
const pointsEarned = computed(() => {
  const amt = Number(form.amount || 0);
  return Math.floor(amt / 10);
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

    if (!form.item_name.trim())
      return message.warning("กรุณากรอกสินค้าที่ซื้อ");
    if (!form.amount || Number(form.amount) <= 0)
      return message.warning("กรุณากรอกราคาให้ถูกต้อง");

    loading.value = true;

    // database บันทึกยอดซื้อ คำนวณแต้ม และเพิ่มแต้มให้เอง (ลูกค้าแก้แต้มตรงๆ ไม่ได้)
    const { data, error } = await supabase.rpc("record_purchase", {
      p_amount: Number(form.amount),
      p_note: form.item_name.trim(),
    });
    if (error) throw error;

    me.value.points = data.points;
    if (auth.profile) auth.profile.points = data.points;
    lastResult.value = { item: form.item_name.trim(), points: data.points_earned };
    message.success(`บันทึกการซื้อแล้ว ได้รับ ${data.points_earned} แต้ม`);

    form.item_name = "";
    form.amount = null;
  } catch (e) {
    console.error(e);
    message.error(e?.message || "บันทึกไม่สำเร็จ");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="page">
    <PageHeader
      eyebrow="Record purchase"
      title="บันทึกการซื้อ"
      subtitle="กรอกสินค้าและราคาที่ชำระจริง ระบบจะคำนวณและเพิ่มแต้มให้ทันที"
    />

    <div class="purchase">
      <section class="surface surface-pad fade-up fade-up-2">
        <a-form layout="vertical" :model="form" requiredMark="optional" @finish="save">
          <a-form-item label="สินค้า / รุ่นโทรศัพท์" name="item_name" required>
            <a-input
              v-model:value="form.item_name"
              size="large"
              placeholder="เช่น ฟิล์มกระจก iPhone 15 Pro Max"
              :maxlength="120"
            >
              <template #prefix><ShoppingOutlined class="subtle" /></template>
            </a-input>
          </a-form-item>

          <a-form-item label="ราคาที่ชำระจริง (บาท)" name="amount" required>
            <a-input-number
              v-model:value="form.amount"
              size="large"
              :min="1"
              :precision="2"
              style="width: 100%"
              placeholder="0.00"
              :formatter="(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
              :parser="(value) => value.replace(/,/g, '')"
            >
              <template #prefix><span class="subtle">฿</span></template>
            </a-input-number>
          </a-form-item>

          <div class="form-actions">
            <NuxtLink to="/customer">
              <a-button size="large">ยกเลิก</a-button>
            </NuxtLink>
            <a-button type="primary" html-type="submit" size="large" :loading="loading">
              ยืนยันและรับแต้ม
            </a-button>
          </div>
        </a-form>
      </section>

      <aside class="preview fade-up fade-up-3">
        <div class="preview-card">
          <span class="eyebrow">คุณจะได้รับ</span>
          <div class="preview-points num">
            +{{ pointsEarned.toLocaleString() }}
            <span>แต้ม</span>
          </div>
          <div class="hairline"></div>
          <dl class="preview-rows">
            <div>
              <dt class="subtle">แต้มปัจจุบัน</dt>
              <dd class="num">{{ Number(me?.points || 0).toLocaleString() }}</dd>
            </div>
            <div>
              <dt class="subtle">หลังบันทึก</dt>
              <dd class="num text-accent">
                {{ (Number(me?.points || 0) + pointsEarned).toLocaleString() }}
              </dd>
            </div>
          </dl>
        </div>

        <a-alert
          v-if="lastResult"
          type="success"
          show-icon
          :message="`บันทึก “${lastResult.item}” แล้ว`"
          :description="`ได้รับ ${lastResult.points.toLocaleString()} แต้ม`"
          closable
          @close="lastResult = null"
        />

        <div class="note surface">
          <p><InfoCircleOutlined /> ทุกยอดซื้อ 10 บาท รับ 1 แต้ม (ปัดเศษลง) บันทึกได้สูงสุด 10 รายการต่อวัน</p>
          <p><SafetyCertificateOutlined /> แต้มคำนวณโดยระบบหลังบ้าน และตรวจสอบย้อนหลังได้ทุกรายการ</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.purchase {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 24px;
  align-items: start;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}
.preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.preview-card {
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
.preview-points {
  font-family: var(--font-mono);
  font-weight: 600;
  text-shadow: var(--glow-accent);
  font-size: 52px;
  line-height: 1;
  color: var(--accent);
}
.preview-points span {
  font-family: var(--font-sans);
  font-size: 16px;
  color: var(--text-2);
}
.preview-rows {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.preview-rows div {
  display: flex;
  justify-content: space-between;
}
.preview-rows dd {
  margin: 0;
  font-weight: 600;
}
.note {
  padding: 16px 18px;
  font-size: 13px;
  color: var(--text-2);
}
.note p {
  margin: 0;
  display: flex;
  gap: 8px;
}
.note p + p {
  margin-top: 8px;
}
.note :deep(.anticon) {
  margin-top: 4px;
  color: var(--lavender);
}

@media (max-width: 900px) {
  .purchase {
    grid-template-columns: minmax(0, 1fr);
  }
  .preview-card {
    padding: 18px 20px;
    gap: 10px;
  }
  .preview-points {
    font-size: 40px;
  }
}
@media (max-width: 480px) {
  .form-actions {
    flex-direction: column-reverse;
  }
  .form-actions :deep(.ant-btn),
  .form-actions a {
    width: 100%;
  }
}
</style>
