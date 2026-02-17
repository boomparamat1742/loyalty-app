<script setup>
import { message } from "ant-design-vue";

definePageMeta({ layout: "admin" });

const supabase = useSupabase();
const loading = ref(false);
const uploading = ref(false);

const form = reactive({
  name: "",
  points_cost: 0,
  stock: 0,
  is_active: true,
  image_url: "",
  description: "",
});

// ✅ ตรวจไฟล์ก่อนอัปโหลด
const beforeUpload = (file) => {
  const okType = file?.type?.startsWith("image/");
  if (!okType) {
    message.error("กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น");
    return false;
  }
  const okSize = file.size / 1024 / 1024 <= 3;
  if (!okSize) {
    message.error("รูปภาพต้องไม่เกิน 3MB");
    return false;
  }
  return true;
};

// ✅ อัปโหลดขึ้น Supabase Storage bucket: rewards
const customUpload = async ({ file, onSuccess, onError }) => {
  try {
    if (!beforeUpload(file)) return;

    uploading.value = true;

    const { data: u, error: uErr } = await supabase.auth.getUser();
    if (uErr) throw uErr;

    const userId = u?.user?.id || "anon";
    const safeName = (file.name || "image").replace(/[^\w.\-]+/g, "_");
    const path = `${userId}/${Date.now()}_${safeName}`;

    const { error: upErr } = await supabase.storage
      .from("reward-images")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/*",
      });

    if (upErr) throw upErr;

    // ถ้า bucket เป็น public จะใช้ public url ได้ทันที
    const { data: pub } = supabase.storage
      .from("reward-images")
      .getPublicUrl(path);

    form.image_url = pub?.publicUrl || "";
    message.success("อัปโหลดรูปภาพแล้ว");

    onSuccess?.({ path });
  } catch (e) {
    console.error(e);
    message.error(e?.message || "อัปโหลดไม่สำเร็จ");
    onError?.(e);
  } finally {
    uploading.value = false;
  }
};

const clearImage = () => {
  form.image_url = "";
  message.success("ลบรูปออกจากฟอร์มแล้ว");
};

const onFailed = (info) => {
  console.log("finishFailed:", info);
  message.error("กรอกข้อมูลให้ถูกต้องก่อน");
};

const save = async () => {
  console.log("save() called", JSON.parse(JSON.stringify(form)));

  try {
    if (!form.name.trim()) return message.warning("กรุณากรอกชื่อของรางวัล");
    if (Number(form.points_cost) < 0)
      return message.warning("แต้มที่ใช้ต้องไม่ติดลบ");
    if (Number(form.stock) < 0)
      return message.warning("จำนวนคงเหลือต้องไม่ติดลบ");

    loading.value = true;

    const { data: u, error: uErr } = await supabase.auth.getUser();
    if (uErr) throw uErr;

    const userId = u?.user?.id || null;

    const payload = {
      title: form.name.trim(), // ✅ ตรง schema
      description: form.description?.trim() || null,
      points_cost: Number(form.points_cost || 0),
      stock: Number(form.stock || 0),
      is_active: !!form.is_active,
      image_url: form.image_url || null, // ✅ ตอนนี้ column มีแล้ว
    };

    console.log("insert payload:", payload);

    // ✅ สำคัญ: ขอ return data มาด้วย จะได้รู้ว่า insert สำเร็จจริง
    const { data, error } = await supabase
      .from("rewards")
      .insert(payload)
      .select("id")
      .single();

    if (error) throw error;

    console.log("insert ok:", data);

    message.success("บันทึกแล้ว");
    await navigateTo("/admin/rewards");
  } catch (e) {
    console.error("save error:", e);
    message.error(e?.message || "บันทึกไม่สำเร็จ");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div style="padding: 24px; max-width: 760px">
    <a-typography-title :level="3" style="margin: 0 0 12px">
      เพิ่มของรางวัล
    </a-typography-title>

    <a-card style="border-radius: 16px" :bordered="false">
      <a-form
        layout="vertical"
        :model="form"
        @finish="save"
        @finishFailed="onFailed"
      >
        <a-form-item label="ชื่อของรางวัล" required>
          <a-input
            v-model:value="form.name"
            placeholder="เช่น เคส iPhone / ฟิล์มกันรอย"
          />
        </a-form-item>

        <a-row :gutter="[12, 12]">
          <a-col :xs="24" :md="12">
            <a-form-item label="แต้มที่ใช้" required>
              <a-input-number
                v-model:value="form.points_cost"
                style="width: 100%"
                :min="0"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="จำนวนคงเหลือ" required>
              <a-input-number
                v-model:value="form.stock"
                style="width: 100%"
                :min="0"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- ✅ อัปโหลดรูป -->
        <a-form-item label="รูปภาพอัปโหลด">
          <a-space direction="vertical" style="width: 100%">
            <a-upload :showUploadList="false" :customRequest="customUpload">
              <a-button :loading="uploading">
                {{ form.image_url ? "เปลี่ยนรูปภาพ" : "เลือกไฟล์รูปภาพ" }}
              </a-button>
            </a-upload>

            <a-alert
              v-if="form.image_url"
              type="success"
              show-icon
              message="อัปโหลดแล้ว"
              :description="form.image_url"
            />

            <div
              v-if="form.image_url"
              style="
                display: flex;
                gap: 12px;
                align-items: flex-start;
                flex-wrap: wrap;
              "
            >
              <img
                :src="form.image_url"
                alt="preview"
                style="
                  max-width: 240px;
                  border-radius: 12px;
                  border: 1px solid #eee;
                "
              />
              <a-button danger @click="clearImage">ลบรูป</a-button>
            </div>

            <a-typography-text type="secondary">
              รองรับไฟล์รูปภาพเท่านั้น และขนาดไม่เกิน 3MB
            </a-typography-text>
          </a-space>
        </a-form-item>

        <!-- ✅ ยังให้ใส่ URL เองได้ (คงของเดิมไว้) -->
        <a-form-item label="รูปภาพ (URL)">
          <a-input v-model:value="form.image_url" placeholder="https://..." />
        </a-form-item>

        <a-form-item label="รายละเอียด">
          <a-textarea
            v-model:value="form.description"
            :rows="4"
            placeholder="รายละเอียดของรางวัล (ไม่บังคับ)"
          />
        </a-form-item>

        <a-form-item label="สถานะ">
          <a-switch v-model:checked="form.is_active" />
          <span style="margin-left: 10px; opacity: 0.7">
            {{ form.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน" }}
          </span>
        </a-form-item>

        <a-space>
          <a-button @click="navigateTo('/admin/rewards')">ย้อนกลับ</a-button>
          <a-button type="primary" html-type="submit" :loading="loading">
            บันทึก
          </a-button>
        </a-space>
      </a-form>
    </a-card>
  </div>
</template>
