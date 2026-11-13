<script setup>
import { CloudUploadOutlined, DeleteOutlined, GiftOutlined, SwapOutlined } from "@ant-design/icons-vue";

// ฟอร์มของรางวัล ใช้ร่วมกันทั้งหน้าเพิ่มและหน้าแก้ไข
const props = defineProps({
  initial: { type: Object, default: () => ({}) },
  submitting: { type: Boolean, default: false },
  submitText: { type: String, default: "บันทึก" },
})
const emit = defineEmits(["submit", "cancel"])

const supabase = useSupabase()
const { message } = useUi()
const uploading = ref(false)

const form = reactive({
  name: "",
  description: "",
  points_cost: 100,
  stock: 10,
  is_active: true,
  image_url: "",
})

watch(
  () => props.initial,
  (v) => Object.assign(form, v || {}),
  { immediate: true, deep: true },
)

// ต้องตรงกับ allowed_mime_types ของ bucket reward-images
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"]

const beforeUpload = (file) => {
  if (!IMAGE_TYPES.includes(file?.type)) {
    message.error("รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP")
    return false
  }
  if (file.size / 1024 / 1024 > 3) {
    message.error("รูปภาพต้องไม่เกิน 3MB")
    return false
  }
  return true
}

// อัปโหลดขึ้น Supabase Storage bucket: reward-images
const customUpload = async ({ file, onSuccess, onError }) => {
  try {
    if (!beforeUpload(file)) return

    uploading.value = true

    const { data: u, error: uErr } = await supabase.auth.getUser()
    if (uErr) throw uErr

    const userId = u?.user?.id || "anon"
    const safeName = (file.name || "image").replace(/[^\w.\-]+/g, "_")
    const path = `${userId}/${Date.now()}_${safeName}`

    const { error: upErr } = await supabase.storage
      .from("reward-images")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/*",
      })
    if (upErr) throw upErr

    const { data: pub } = supabase.storage.from("reward-images").getPublicUrl(path)
    form.image_url = pub?.publicUrl || ""
    message.success("อัปโหลดรูปภาพแล้ว")
    onSuccess?.({ path })
  } catch (e) {
    console.error(e)
    message.error(e?.message || "อัปโหลดไม่สำเร็จ")
    onError?.(e)
  } finally {
    uploading.value = false
  }
}

const submit = () => {
  const title = (form.name || "").trim()
  if (!title) return message.warning("กรุณากรอกชื่อของรางวัล")
  if (!(Number(form.points_cost) > 0)) return message.warning("แต้มที่ใช้ต้องมากกว่า 0")
  if (Number(form.stock) < 0) return message.warning("จำนวนคงเหลือต้องไม่ติดลบ")

  emit("submit", {
    title,
    description: (form.description || "").trim() || null,
    points_cost: Number(form.points_cost),
    stock: Number(form.stock || 0),
    is_active: !!form.is_active,
    image_url: (form.image_url || "").trim() || null,
  })
}
</script>

<template>
  <div class="reward-form">
    <a-form :model="form" layout="vertical" requiredMark="optional" class="fields" @finish="submit">
      <section class="surface surface-pad">
        <h2 class="section-title">ข้อมูลของรางวัล</h2>

        <a-form-item label="ชื่อของรางวัล" required>
          <a-input v-model:value="form.name" size="large" :maxlength="120" placeholder="เช่น เคสใส Magnetic" />
        </a-form-item>

        <a-form-item label="รายละเอียด">
          <a-textarea
            v-model:value="form.description"
            :rows="3"
            :maxlength="300"
            show-count
            placeholder="รุ่นที่รองรับ สี หรือเงื่อนไขการรับของรางวัล"
          />
        </a-form-item>

        <div class="row">
          <a-form-item label="แต้มที่ใช้แลก" required extra="จำนวนแต้มที่ลูกค้าต้องใช้">
            <a-input-number v-model:value="form.points_cost" size="large" :min="1" :precision="0" style="width: 100%" />
          </a-form-item>
          <a-form-item label="จำนวนคงเหลือ" required extra="ลดลงอัตโนมัติเมื่อมีการแลก">
            <a-input-number v-model:value="form.stock" size="large" :min="0" :precision="0" style="width: 100%" />
          </a-form-item>
        </div>

        <div class="switch-row">
          <div>
            <div class="switch-title">เปิดให้แลก</div>
            <div class="subtle switch-sub">ปิดไว้หากยังไม่ต้องการให้ลูกค้าเห็น</div>
          </div>
          <a-switch v-model:checked="form.is_active" />
        </div>
      </section>

      <section class="surface surface-pad">
        <h2 class="section-title">รูปภาพ</h2>

        <a-upload-dragger
          v-if="!form.image_url"
          :showUploadList="false"
          :customRequest="customUpload"
          accept="image/png,image/jpeg,image/webp"
          class="dropzone"
        >
          <p class="drop-icon"><CloudUploadOutlined /></p>
          <p class="drop-title">{{ uploading ? "กำลังอัปโหลด..." : "ลากรูปมาวาง หรือคลิกเพื่อเลือกไฟล์" }}</p>
          <p class="subtle drop-hint">JPG, PNG, WEBP · ไม่เกิน 3MB</p>
        </a-upload-dragger>

        <div v-else class="image-preview">
          <img :src="form.image_url" alt="รูปของรางวัล" />
          <div class="image-actions">
            <a-upload :showUploadList="false" :customRequest="customUpload" accept="image/png,image/jpeg,image/webp">
              <a-button :loading="uploading"><template #icon><SwapOutlined /></template> เปลี่ยนรูป</a-button>
            </a-upload>
            <a-button danger @click="form.image_url = ''"><template #icon><DeleteOutlined /></template> นำออก</a-button>
          </div>
        </div>

        <a-form-item label="หรือใส่ลิงก์รูปภาพ" class="url-field">
          <a-input v-model:value="form.image_url" placeholder="https://..." allow-clear />
        </a-form-item>
      </section>

      <div class="form-actions">
        <a-button size="large" @click="emit('cancel')">ยกเลิก</a-button>
        <a-button type="primary" size="large" html-type="submit" :loading="submitting" :disabled="uploading">
          {{ submitText }}
        </a-button>
      </div>
    </a-form>

    <aside class="preview">
      <span class="eyebrow">ตัวอย่างที่ลูกค้าเห็น</span>
      <article class="preview-card surface">
        <div class="preview-media">
          <img v-if="form.image_url" :src="form.image_url" alt="" />
          <GiftOutlined v-else class="preview-placeholder" />
          <span v-if="!form.is_active" class="chip chip-muted preview-flag">ปิดการแลก</span>
        </div>
        <div class="preview-body">
          <h3>{{ form.name || "ชื่อของรางวัล" }}</h3>
          <p v-if="form.description" class="subtle">{{ form.description }}</p>
          <div class="preview-cost">
            <span class="text-accent num">{{ Number(form.points_cost || 0).toLocaleString() }}</span>
            <span class="subtle">แต้ม · เหลือ {{ Number(form.stock || 0).toLocaleString() }} ชิ้น</span>
          </div>
        </div>
      </article>
    </aside>
  </div>
</template>

<style scoped>
.reward-form {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 0.6fr);
  gap: 24px;
  align-items: start;
}
.fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.section-title {
  margin: 0 0 18px;
  font-size: 16px;
  font-weight: 600;
}
.row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.02);
}
.switch-title {
  font-weight: 500;
}
.switch-sub {
  font-size: 12px;
}
.dropzone :deep(.ant-upload-drag) {
  background: rgba(255, 255, 255, 0.02);
  border-color: var(--border-strong);
  border-radius: 14px;
}
.drop-icon {
  font-size: 32px;
  color: var(--lavender);
  margin: 0 0 8px;
}
.drop-title {
  margin: 0;
  font-weight: 500;
}
.drop-hint {
  margin: 4px 0 0;
  font-size: 12px;
}
.image-preview {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}
.image-preview img {
  width: 140px;
  height: 140px;
  object-fit: cover;
  border-radius: 14px;
  border: 1px solid var(--border);
}
.image-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.url-field {
  margin: 18px 0 0;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.preview {
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.preview-card {
  overflow: hidden;
}
.preview-media {
  position: relative;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}
.preview-media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.preview-placeholder {
  font-size: 40px;
  color: var(--text-3);
}
.preview-flag {
  position: absolute;
  top: 12px;
  left: 12px;
}
.preview-body {
  padding: 18px 20px 20px;
}
.preview-body h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}
.preview-body p {
  margin: 6px 0 0;
  font-size: 13px;
}
.preview-cost {
  margin-top: 12px;
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.preview-cost .text-accent {
  font-family: var(--font-mono);
  font-size: 26px;
  font-weight: 600;
}

@media (max-width: 960px) {
  .reward-form {
    grid-template-columns: minmax(0, 1fr);
  }
  .preview {
    position: static;
    max-width: 340px;
  }
}
@media (max-width: 520px) {
  .row {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }
}
</style>
