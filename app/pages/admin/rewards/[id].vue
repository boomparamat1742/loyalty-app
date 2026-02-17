<script setup>
import { message, Modal } from "ant-design-vue";

definePageMeta({ layout: "admin" });

const supabase = useSupabase();
const route = useRoute();

const id = computed(() => String(route.params.id || ""));
const saving = ref(false);
const loadingPage = ref(true);

const form = reactive({
  name: "",
  points_cost: 0,
  stock: 0,
  is_active: true,
  image_url: "",
  description: "",
});

const load = async () => {
  try {
    loadingPage.value = true;

    const { data, error } = await supabase
      .from("rewards")
      .select("title,description,points_cost,stock,is_active,image_url")
      .eq("id", id.value)
      .single();

    if (error) throw error;

    form.name = data?.title || "";
    form.description = data?.description || "";
    form.points_cost = Number(data?.points_cost || 0);
    form.stock = Number(data?.stock || 0);
    form.is_active = !!data?.is_active;
    form.image_url = data?.image_url || "";
  } catch (e) {
    console.error("load reward error:", e);
    message.error(e?.message || "โหลดข้อมูลไม่สำเร็จ");
    navigateTo("/admin/rewards");
  } finally {
    loadingPage.value = false;
  }
};

onMounted(load);

const onFailed = (info) => {
  console.log("finishFailed:", info);
  message.error("กรอกข้อมูลให้ถูกต้องก่อน");
};

const save = async () => {
  console.log("save() called:", JSON.parse(JSON.stringify(form)));

  try {
    const title = (form.name || "").trim();
    if (!title) return message.warning("กรุณากรอกชื่อของรางวัล");

    const payload = {
      title,
      description: (form.description || "").trim() || null,
      points_cost: Number(form.points_cost || 0),
      stock: Number(form.stock || 0),
      is_active: !!form.is_active,
      image_url: (form.image_url || "").trim() || null,
    };

    saving.value = true;

    const { error } = await supabase.from("rewards").update(payload).eq("id", id.value);
    if (error) throw error;

    message.success("บันทึกแล้ว");
    navigateTo("/admin/rewards");
  } catch (e) {
    console.error("save error:", e);
    message.error(e?.message || "บันทึกไม่สำเร็จ");
  } finally {
    saving.value = false;
  }
};

const remove = async () => {
  Modal.confirm({
    title: "ยืนยันลบของรางวัล",
    content: "ต้องการลบรายการนี้ใช่ไหม?",
    okText: "ลบ",
    okType: "danger",
    cancelText: "ยกเลิก",
    async onOk() {
      try {
        const { error } = await supabase.from("rewards").delete().eq("id", id.value);
        if (error) throw error;

        message.success("ลบแล้ว");
        navigateTo("/admin/rewards");
      } catch (e) {
        console.error("delete error:", e);
        message.error(e?.message || "ลบไม่สำเร็จ");
      }
    },
  });
};
</script>

<template>
  <div style="padding: 24px; max-width: 760px">
    <a-typography-title :level="3" style="margin: 0 0 12px">
      แก้ไขของรางวัล
    </a-typography-title>

    <a-card style="border-radius: 16px" :bordered="false" :loading="loadingPage">
      <!-- ✅ สำคัญ: @finish ต้องอยู่ที่ a-form เท่านั้น -->
      <a-form
        layout="vertical"
        :model="form"
        @finish="save"
        @finishFailed="onFailed"
      >
        <a-form-item
          label="ชื่อของรางวัล"
          name="name"
          :rules="[{ required: true, message: 'กรุณากรอกชื่อของรางวัล' }]"
          required
        >
          <a-input v-model:value="form.name" />
        </a-form-item>

        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="12">
            <a-form-item
              label="แต้มที่ใช้"
              name="points_cost"
              :rules="[{ required: true, message: 'กรุณากรอกแต้มที่ใช้' }]"
              required
            >
              <a-input-number v-model:value="form.points_cost" style="width: 100%" :min="0" />
            </a-form-item>
          </a-col>

          <a-col :xs="24" :md="12">
            <a-form-item
              label="จำนวนคงเหลือ"
              name="stock"
              :rules="[{ required: true, message: 'กรุณากรอกจำนวนคงเหลือ' }]"
              required
            >
              <a-input-number v-model:value="form.stock" style="width: 100%" :min="0" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="รูปภาพ (URL)" name="image_url">
          <a-input v-model:value="form.image_url" placeholder="https://..." />
        </a-form-item>

        <div v-if="form.image_url" style="margin: 8px 0 12px">
          <img
            :src="form.image_url"
            alt="preview"
            style="max-width: 240px; border-radius: 12px; border: 1px solid #eee"
          />
        </div>

        <a-form-item label="รายละเอียด" name="description">
          <a-textarea v-model:value="form.description" :rows="4" />
        </a-form-item>

        <a-form-item label="สถานะ" name="is_active">
          <a-switch v-model:checked="form.is_active" />
          <span style="margin-left: 10px; opacity: 0.7">
            {{ form.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน" }}
          </span>
        </a-form-item>

        <a-space>
          <a-button @click="navigateTo('/admin/rewards')">ย้อนกลับ</a-button>
          <a-button danger @click="remove">ลบ</a-button>

          <!-- ✅ สำคัญ: ปุ่ม submit ต้องเป็น html-type="submit" -->
          <a-button type="primary" html-type="submit" :loading="saving">
            บันทึก
          </a-button>
        </a-space>
      </a-form>
    </a-card>
  </div>
</template>
