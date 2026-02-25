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
      .replace(/\u200B/g, "");

    const cleanPassword = (form.password || "").trim();

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
/* ===== Premium Background ===== */
.wrap {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px 16px;
  position: relative;
  overflow: hidden;

  background: #ffffff;
}

/* soft blobs */
.wrap::before,
.wrap::after {
  content: "";
  position: absolute;
  width: 560px;
  height: 560px;
  border-radius: 999px;
  filter: blur(70px);
  opacity: 0.35;
  pointer-events: none;
}
.wrap::before {
  left: -220px;
  top: -220px;
  background: radial-gradient(circle at 30% 30%, #60a5fa, #2563eb);
}
.wrap::after {
  right: -240px;
  bottom: -240px;
  background: radial-gradient(circle at 30% 30%, #a78bfa, #7c3aed);
}

/* subtle grid */
.wrap :deep(*) {
  pointer-events: auto;
}

/* ===== Card (Glass Premium) ===== */
.auth-card {
  width: 100%;
  max-width: 420px;

  border-radius: 22px !important;
  overflow: hidden;
  position: relative;

  background: rgba(255, 255, 255, 0.78) !important;
  border: 1px solid rgba(17, 24, 39, 0.1) !important;
  box-shadow:
    0 26px 60px rgba(0, 0, 0, 0.1),
    0 10px 24px rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(14px);
}

/* gradient top bar */
.auth-card::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 7px;
  background: linear-gradient(90deg, #2563eb, #7c3aed, #22c55e);
}

/* little badge in corner */
.auth-card::after {
  position: absolute;
  right: 14px;
  top: 14px;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.3px;
  padding: 6px 10px;
  border-radius: 999px;
  color: rgba(17, 24, 39, 0.75);
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(17, 24, 39, 0.1);
}

/* ===== Card Header ===== */
:deep(.ant-card-head) {
  border-bottom: 1px solid rgba(17, 24, 39, 0.08) !important;
  padding-top: 12px;
}

:deep(.ant-card-head-title) {
  font-weight: 950;
  font-size: 20px;
  letter-spacing: -0.2px;
  color: #0b1220;
  padding-top: 10px;
}

/* ===== Form spacing ===== */
:deep(.ant-card-body) {
  padding: 18px 18px 16px;
}

:deep(.ant-form-item) {
  margin-bottom: 14px;
}

:deep(.ant-form-item-label > label) {
  font-weight: 800;
  color: rgba(17, 24, 39, 0.78);
}

/* ===== Inputs (soft + premium) ===== */
:deep(.ant-input),
:deep(.ant-input-affix-wrapper) {
  border-radius: 14px !important;
  padding: 10px 12px !important;
  border: 1px solid rgba(17, 24, 39, 0.12) !important;
  background: rgba(255, 255, 255, 0.75) !important;
  transition:
    box-shadow 0.18s ease,
    transform 0.18s ease,
    border-color 0.18s ease;
}

:deep(.ant-input-affix-wrapper:hover),
:deep(.ant-input:hover) {
  border-color: rgba(37, 99, 235, 0.35) !important;
}

:deep(.ant-input-affix-wrapper-focused),
:deep(.ant-input:focus) {
  border-color: rgba(37, 99, 235, 0.55) !important;
  box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.12) !important;
  transform: translateY(-1px);
}

/* Password icon */
:deep(.ant-input-password-icon) {
  color: rgba(17, 24, 39, 0.45) !important;
}

/* ===== Primary Button ===== */
:deep(.ant-btn-primary) {
  height: 46px;
  border-radius: 14px;
  font-weight: 900;
  letter-spacing: 0.2px;

  background: linear-gradient(90deg, #2563eb, #7c3aed) !important;
  border: none !important;
  box-shadow: 0 16px 32px rgba(37, 99, 235, 0.22);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    filter 0.18s ease;
}

:deep(.ant-btn-primary:hover) {
  transform: translateY(-1px);
  filter: brightness(1.02);
  box-shadow: 0 18px 36px rgba(37, 99, 235, 0.28);
}

:deep(.ant-btn-primary:active) {
  transform: translateY(0px);
}

/* ===== Footer link ===== */
.muted {
  margin-top: 14px;
  text-align: center;
  color: rgba(17, 24, 39, 0.65);
  font-size: 14px;
}

.muted :deep(a) {
  font-weight: 900;
  color: #2563eb;
  text-decoration: none;
  margin-left: 6px;
}

.muted :deep(a:hover) {
  text-decoration: underline;
}

/* ===== Mobile ===== */
@media (max-width: 480px) {
  :deep(.ant-card-body) {
    padding: 16px;
  }
  .auth-card::after {
    display: none;
  }
}
</style>
