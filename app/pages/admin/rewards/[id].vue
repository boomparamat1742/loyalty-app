<script setup>
import { message, Modal } from "ant-design-vue";

definePageMeta({ layout: "admin" });

const supabase = useSupabase();
const route = useRoute();

const id = computed(() => String(route.params.id || ""));
const saving = ref(false);
const loadingPage = ref(true);
const uploading = ref(false);

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

<style scoped>
.reward-management {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 32px 16px;
}

.header-section {
  max-width: 1000px;
  margin: 0 auto 32px;
  padding: 40px 32px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.header-content {
  text-align: left;
}

.header-subtitle {
  margin: 8px 0 0;
  color: #94a3b8;
  font-size: 16px;
  font-weight: 500;
}

.form-container {
  max-width: 1000px;
  margin: 0 auto;
}

.form-section {
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transition: box-shadow 0.3s ease;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.15);
}

.form-section:hover {
  box-shadow: 0 12px 48px rgba(59, 130, 246, 0.15);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #e0e7ff;
}

.section-icon {
  font-size: 20px;
}

.custom-input,
.custom-textarea {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.custom-input:focus,
.custom-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.field-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #9ca3af;
  font-style: italic;
}

/* Image Upload Styling */
.image-upload-wrapper {
  width: 100%;
}

.url-input-wrapper {
  padding: 0;
  background: transparent;
  border-radius: 8px;
  border: none;
  margin-bottom: 24px;
}

.preview-container {
  width: 100%;
}

.preview-card {
  position: relative;
  width: 100%;
  max-width: 300px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
}

.preview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.preview-image {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 12px;
}

/* Status Toggle */
.status-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f3f4f6;
  border-radius: 8px;
  width: fit-content;
}

.status-text {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 32px;
  margin-bottom: 32px;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
}

.action-buttons :deep(.ant-button) {
  border-radius: 8px;
  font-weight: 500;
  height: 40px;
  transition: all 0.3s ease;
}

.action-buttons :deep(.ant-btn-primary) {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  min-width: 160px;
}

.action-buttons :deep(.ant-btn-primary:hover) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.action-buttons :deep(.ant-button:not(.ant-btn-primary)) {
  border: 1px solid #d1d5db;
}

.action-buttons :deep(.ant-btn-dangerous) {
  border-color: #feca57;
  color: #ef4444;
}

.action-buttons :deep(.ant-btn-dangerous:hover) {
  background-color: #fee2e2;
  border-color: #ef4444;
}

/* Responsive Design */
@media (max-width: 768px) {
  .reward-management {
    padding: 16px 12px;
  }

  .header-section {
    padding: 24px 20px;
    margin-bottom: 20px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 8px;
  }

  .action-buttons :deep(.ant-button) {
    width: 100%;
  }

  .preview-card {
    max-width: 100%;
  }
}

/* Ant Design Form Item Customization */
:deep(.ant-form-item-label > label) {
  font-weight: 600;
  color: #1f2937;
}

:deep(.ant-form-item-label > label::after) {
  content: "";
}

:deep(.ant-form-item-required::before) {
  content: "" !important;
}

:deep(.ant-form-item-required > label::after) {
  content: " *";
  color: #ef4444;
  margin-left: 4px;
}

/* Alert Customization */
:deep(.ant-alert) {
  border-radius: 8px;
  border: none;
  background: #d1fae5;
  color: #065f46;
  padding: 12px 16px;
}

:deep(.ant-alert-icon) {
  color: #10b981;
}

/* Switch Customization */
:deep(.ant-switch-checked) {
  background-color: #10b981;
}

/* Input Number Customization */
:deep(.ant-input-number) {
  border-radius: 8px;
}

/* Skeleton Loading */
:deep(.ant-skeleton) {
  padding: 24px;
  background: white;
  border-radius: 12px;
  margin-bottom: 24px;
}

/* Popconfirm Customization */
:deep(.ant-popover) {
  border-radius: 8px;
}
</style>

<template>
  <div class="reward-management">
    <!-- Skeleton Loading -->
    <div v-if="loadingPage" style="max-width: 1000px; margin: 0 auto">
      <a-skeleton active :paragraph="{ rows: 12 }" />
    </div>

    <!-- Main Content -->
    <template v-else>
      <!-- Header Section -->
      <div class="header-section">
        <div class="header-content">
          <a-typography-title :level="2" style="margin: 0; color: #1f2937">
            ✏️ แก้ไขของรางวัล
          </a-typography-title>
          <p class="header-subtitle">
            อัปเดทข้อมูลรางวัลและจัดการสต็อก
          </p>
        </div>
      </div>

      <!-- Main Form -->
      <div class="form-container">
        <a-form
          layout="vertical"
          :model="form"
          @finish="save"
          @finishFailed="onFailed"
        >
          <!-- 📋 Section 1: Basic Information -->
          <a-card class="form-section" :bordered="false">
            <template #title>
              <div class="section-header">
                <span class="section-icon">📋</span>
                <span>ข้อมูลพื้นฐาน</span>
              </div>
            </template>

            <a-form-item
              label="ชื่อของรางวัล"
              name="name"
              :rules="[{ required: true, message: 'กรุณากรอกชื่อของรางวัล' }]"
              required
            >
              <a-input
                v-model:value="form.name"
                placeholder="เช่น เคส iPhone 15 / ฟิล์มกันรอยแบบนิ่ม"
                size="large"
                class="custom-input"
              />
            </a-form-item>

            <a-row :gutter="[24, 12]">
              <a-col :xs="24" :md="12">
                <a-form-item
                  label="แต้มที่ใช้"
                  name="points_cost"
                  :rules="[{ required: true, message: 'กรุณากรอกแต้มที่ใช้' }]"
                  required
                >
                  <a-input-number
                    v-model:value="form.points_cost"
                    size="large"
                    style="width: 100%"
                    :min="0"
                    placeholder="เช่น 500"
                    class="custom-input"
                  />
                  <p class="field-hint">จำนวนแต้มที่ลูกค้าต้องใช้เพื่อได้รางวัลนี้</p>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="12">
                <a-form-item
                  label="จำนวนคงเหลือ"
                  name="stock"
                  :rules="[{ required: true, message: 'กรุณากรอกจำนวนคงเหลือ' }]"
                  required
                >
                  <a-input-number
                    v-model:value="form.stock"
                    size="large"
                    style="width: 100%"
                    :min="0"
                    placeholder="เช่น 100"
                    class="custom-input"
                  />
                  <p class="field-hint">จำนวนรางวัลที่มีให้บริการ</p>
                </a-form-item>
              </a-col>
            </a-row>
          </a-card>

          <!-- 🖼️ Section 2: Image -->
          <a-card class="form-section" :bordered="false">
            <template #title>
              <div class="section-header">
                <span class="section-icon">🖼️</span>
                <span>รูปภาพสินค้า</span>
              </div>
            </template>

            <div class="image-upload-wrapper">
              <a-space direction="vertical" style="width: 100%">
                <!-- Upload Area -->
                <div class="upload-area" v-if="!form.image_url">
                  <a-upload :showUploadList="false" :customRequest="customUpload">
                    <div class="upload-zone">
                      <div class="upload-icon">📤</div>
                      <p class="upload-title">
                        {{
                          uploading
                            ? "กำลังอัปโหลด..."
                            : "ลากรูปภาพมาที่นี่ หรือคลิกเพื่อเลือก"
                        }}
                      </p>
                      <p class="upload-hint">
                        รองรับ JPG, PNG, GIF • ขนาดไม่เกิน 3MB
                      </p>
                      <a-button
                        type="primary"
                        size="large"
                        :loading="uploading"
                        style="margin-top: 8px"
                      >
                        เลือกรูปภาพ
                      </a-button>
                    </div>
                  </a-upload>
                </div>

                <!-- Image Preview -->
                <div v-if="form.image_url" class="preview-container">
                  <div class="preview-card">
                    <img
                      :src="form.image_url"
                      alt="preview"
                      class="preview-image"
                    />
                    <div class="preview-overlay">
                      <a-space>
                        <a-upload :showUploadList="false" :customRequest="customUpload">
                          <a-button
                            type="text"
                            style="color: black"
                            :loading="uploading"
                          >
                            ✏️ เปลี่ยน
                          </a-button>
                        </a-upload>
                        <a-button
                          danger
                          type="text"
                          style="color: black"
                          @click="clearImage"
                        >
                          🗑️ ลบ
                        </a-button>
                      </a-space>
                    </div>
                  </div>

                  <a-alert
                    type="success"
                    show-icon
                    message="อัปโหลดรูปภาพแล้ว"
                    style="margin-top: 12px"
                    closable
                  />
                </div>

                <!-- Manual URL Input -->
                <div class="url-input-wrapper">
                  <a-typography-text type="secondary">
                    หรือใส่ URL รูปภาพโดยตรง
                  </a-typography-text>
                  <a-input
                    v-model:value="form.image_url"
                    placeholder="https://example.com/image.jpg"
                    size="large"
                    class="custom-input"
                    style="margin-top: 8px"
                  />
                </div>
              </a-space>
            </div>
          </a-card>

          <!-- 📝 Section 3: Additional Details -->
          <a-card class="form-section" :bordered="false">
            <template #title>
              <div class="section-header">
                <span class="section-icon">📝</span>
                <span>รายละเอียดเพิ่มเติม</span>
              </div>
            </template>

            <a-form-item label="รายละเอียด" name="description">
              <a-textarea
                v-model:value="form.description"
                :rows="4"
                size="large"
                placeholder="บรรยายรายละเอียดของรางวัล เช่น สี ขนาด วัสดุ ฯลฯ (ไม่บังคับ)"
                class="custom-textarea"
                show-count
                :maxlength="500"
              />
            </a-form-item>

            <a-form-item label="สถานะการใช้งาน" name="is_active">
              <div class="status-toggle">
                <a-switch v-model:checked="form.is_active" />
                <span class="status-text">
                  {{
                    form.is_active
                      ? "✅ เปิดใช้งาน"
                      : "⏸️ ปิดใช้งาน"
                  }}
                </span>
              </div>
              <p class="field-hint" style="margin-top: 8px">
                {{
                  form.is_active
                    ? "รางวัลนี้จะแสดงให้ลูกค้าเห็นในแอปพลิเคชัน"
                    : "รางวัลนี้จะซ่อนไว้และลูกค้าไม่สามารถเลือกได้"
                }}
              </p>
            </a-form-item>
          </a-card>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <a-button size="large" @click="navigateTo('/admin/rewards')">
              ← ย้อนกลับ
            </a-button>

            <div style="flex: 1"></div>

            <a-popconfirm
              title="ยืนยันการลบ"
              description="ต้องการลบรายการนี้ใช่ไหม? การกระทำนี้ไม่สามารถยกเลิกได้"
              ok-text="ลบเลย"
              cancel-text="ยกเลิก"
              ok-button-props="{ danger: true }"
              @confirm="remove"
            >
              <a-button danger size="large" type="default">
                🗑️ ลบรางวัล
              </a-button>
            </a-popconfirm>

            <a-button
              type="primary"
              size="large"
              html-type="submit"
              :loading="saving"
            >
              💾 บันทึกการเปลี่ยนแปลง
            </a-button>
          </div>
        </a-form>
      </div>
    </template>
  </div>
</template>
