<template>
  <div class="wrap">
    <a-card class="auth-card" title="สมัครสมาชิก" :bordered="false">
      <a-form
        :model="form"
        layout="vertical"
        @finish="onSubmit"
        @finishFailed="onFailed"
      >
        <a-form-item
          label="Email"
          name="email"
          :rules="[
            { required: true, message: 'กรอกอีเมล' },
            {
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'กรอกอีเมลให้ถูกต้อง',
            },
          ]"
        >
          <a-input v-model:value="form.email" placeholder="you@example.com" />
        </a-form-item>

        <a-form-item
          label="Password"
          name="password"
          :rules="[
            { required: true, message: 'กรอกรหัสผ่าน' },
            { min: 6, message: 'รหัสผ่านอย่างน้อย 6 ตัว' },
          ]"
        >
          <a-input-password
            v-model:value="form.password"
            placeholder="••••••••"
          />
        </a-form-item>

        <a-button type="primary" html-type="submit" block :loading="loading">
          Register
        </a-button>
      </a-form>

      <div class="muted">
        มีบัญชีแล้ว? <NuxtLink to="/auth/login">เข้าสู่ระบบ</NuxtLink>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { message } from "ant-design-vue";

const form = reactive({
  email: "",
  password: "",
});

const loading = ref(false);

const onFailed = (info) => {
  // จะได้ไม่ “นิ่ง” อีกต่อไป
  console.log("finishFailed:", info);
  message.error("กรอกข้อมูลให้ถูกต้องก่อน");
};

const onSubmit = async () => {
  const supabase = useSupabase();
  try {
    loading.value = true;

    const cleanEmail = (form.email || "")
      .trim()
      .toLowerCase()
      .replace(/\u200B/g, ""); // zero-width space

    const cleanPassword = (form.password || "").trim();

    console.log("email(raw):", JSON.stringify(form.email));
    console.log("email(clean):", JSON.stringify(cleanEmail));

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (error) throw error;

    message.success("สมัครสมาชิกสำเร็จ! ไปหน้า Login ได้เลย");
    navigateTo("/auth/login");
  } catch (e) {
    console.error(e);
    message.error(e?.message || "สมัครไม่สำเร็จ");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.wrap {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;

  /* Background สไตล์เดียวกับ Login */
  background:
    radial-gradient(1200px 600px at 20% 0%, #eaf0ff 0%, transparent 60%),
    radial-gradient(900px 500px at 90% 10%, #e7fff5 0%, transparent 55%),
    linear-gradient(180deg, #f7f8fc 0%, #f1f3f9 100%);
}

/* Card */
.card {
  width: 100%;
  max-width: 420px;
  border-radius: 18px !important;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.10);
  border: 1px solid rgba(0, 0, 0, 0.04);
  overflow: hidden;
  position: relative;
}

/* แถบสีด้านบนให้ดู premium */
.card::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 6px;
  background: linear-gradient(90deg, #1677ff, #52c41a, #9254de);
}

/* Header ของ Card (title) */
:deep(.ant-card-head) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

:deep(.ant-card-head-title) {
  font-weight: 900;
  font-size: 18px;
  letter-spacing: 0.2px;
  padding-top: 10px;
}

/* ฟอร์ม */
:deep(.ant-form-item) {
  margin-bottom: 14px;
}

:deep(.ant-form-item-label > label) {
  font-weight: 700;
}

/* Input / Password ให้ดูนุ่ม */
:deep(.ant-input),
:deep(.ant-input-password) {
  border-radius: 12px !important;
  padding: 10px 12px !important;
}

:deep(.ant-input-affix-wrapper) {
  border-radius: 12px !important;
  padding: 6px 10px !important;
}

/* ปุ่ม Register */
:deep(.ant-btn-primary) {
  height: 44px;
  border-radius: 12px;
  font-weight: 800;
  box-shadow: 0 10px 18px rgba(22, 119, 255, 0.20);
}

:deep(.ant-btn-primary:hover) {
  transform: translateY(-1px);
}

/* Footer */
.muted {
  margin-top: 14px;
  text-align: center;
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
}

.muted :deep(a) {
  font-weight: 800;
  color: #1677ff;
  text-decoration: none;
  margin-left: 6px;
}

.muted :deep(a:hover) {
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 480px) {
  .card {
    max-width: 100%;
  }
}

/* กัน overlay/pointer-events แปลกๆ */
.wrap * {
  pointer-events: auto;
}

</style>
