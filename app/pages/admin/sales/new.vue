<script setup>
import { message } from "ant-design-vue";

definePageMeta({ layout: "admin" });

const supabase = useSupabase();
const loading = ref(false);

const customers = ref([]); // [{id,email}]
const loadingCustomers = ref(false);

const POINT_RATE = 10;
const calcPoints = (amount) => Math.floor((Number(amount) || 0) / POINT_RATE);

const form = reactive({
  customer_id: null,
  amount: null,
  note: "",
});

const loadCustomers = async () => {
  try {
    loadingCustomers.value = true;
    const { data: u } = await supabase.auth.getUser();
    const user = u?.user;
    if (!user) return navigateTo("/auth/login");

    // เช็ค role admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") return navigateTo("/customer");

    // โหลดลูกค้า (เอา role = 'customer' ถ้าคุณมี role นี้)
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,role")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    // กรองเอาเฉพาะ customer (ถ้าคุณยังไม่ได้แยก role ก็เอาออกได้)
    customers.value = (data || []).filter((x) => x.role !== "admin");
  } catch (e) {
    console.error(e);
    message.error(e?.message || "โหลดรายชื่อลูกค้าไม่สำเร็จ");
  } finally {
    loadingCustomers.value = false;
  }
};

onMounted(loadCustomers);

const save = async () => {
  try {
    loading.value = true;

    const { data: u } = await supabase.auth.getUser();
    const user = u?.user;
    if (!user) return navigateTo("/auth/login");

    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (pErr) throw pErr;
    if (profile?.role !== "admin") return navigateTo("/customer");

    // if (!form.customer_id) return message.warning("กรุณาเลือกลูกค้า");
    if (!form.amount || Number(form.amount) <= 0)
      return message.warning("กรุณากรอกยอดขาย (มากกว่า 0)");

    const payload = {
      customer_id: user.id,
      amount: Number(form.amount),
      points_earned: calcPoints(form.amount), // ✅ ชื่อตรง DB
      note: form.note?.trim() || null,
      created_by: user.id, // ✅ ชื่อตรง DB
    };

    const { error } = await supabase.from("sales").insert(payload);
    if (error) throw error;

    message.success("เพิ่มยอดขายสำเร็จ");
    navigateTo("/admin/sales");
  } catch (e) {
    console.error(e);
    message.error(e?.message || "บันทึกไม่สำเร็จ");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div style="padding: 16px; max-width: 640px">
    <a-typography-title :level="3" style="margin: 0 0 12px">
      เพิ่มยอดขาย
    </a-typography-title>

    <a-card style="border-radius: 16px">
      <a-form layout="vertical">
        <a-form-item label="วันที่ขาย">
          <a-date-picker
            v-model:value="form.sold_at"
            valueFormat="YYYY-MM-DD"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="ยอดขาย (บาท)">
          <a-input-number
            v-model:value="form.amount"
            style="width: 100%"
            :min="0"
            :step="10"
          />
          <div style="margin-top: 6px; opacity: 0.75">
            คำนวณแต้มอัตโนมัติ: <b>{{ calcPoints(form.amount) }}</b> แต้ม ({{
              POINT_RATE
            }}
            บาท = 1 แต้ม)
          </div>
        </a-form-item>

        <a-form-item label="หมายเหตุ (ไม่บังคับ)">
          <a-input
            v-model:value="form.note"
            placeholder="เช่น ขายเคส + ฟิล์ม"
          />
        </a-form-item>

        <a-space>
          <a-button @click="$router.back()">ย้อนกลับ</a-button>
          <a-button type="primary" :loading="loading" @click="save">
            บันทึก
          </a-button>
        </a-space>
      </a-form>
    </a-card>
  </div>
</template>
