<template>
  <div class="wrap">
    <div class="glow-sphere sphere-1"></div>
    <div class="glow-sphere sphere-2"></div>

    <a-card class="auth-card" :bordered="false">
      <div class="auth-card-header">
        <div class="auth-badge">JOIN US</div>
        <h2 class="auth-card-title">สมัครสมาชิกใหม่</h2>
        <p class="auth-card-subtitle">เพื่อรับสิทธิพิเศษและสะสมแต้มกับเรา</p>
      </div>

      <a-form
        :model="form"
        layout="vertical"
        @finish="onSubmit"
        @finishFailed="onFailed"
        class="premium-form"
      >
        <a-form-item
          label="อีเมล (Email)"
          name="email"
          :rules="[
            { required: true, message: 'กรุณากรอกอีเมล' },
            {
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'รูปแบบอีเมลไม่ถูกต้อง',
            },
          ]"
        >
          <a-input
            v-model:value="form.email"
            placeholder="you@example.com"
            class="custom-input"
          >
            <template #prefix><MailOutlined class="icon-muted" /></template>
          </a-input>
        </a-form-item>

        <a-form-item
          label="รหัสผ่าน (Password)"
          name="password"
          :rules="[
            { required: true, message: 'กรุณากรอกรหัสผ่าน' },
            { min: 6, message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' },
          ]"
        >
          <a-input-password
            v-model:value="form.password"
            placeholder="••••••••"
            class="custom-input"
          >
            <template #prefix><LockOutlined class="icon-muted" /></template>
          </a-input-password>
        </a-form-item>

        <div class="terms-text">
          การกดลงทะเบียนแสดงว่าคุณยอมรับ <a href="#">ข้อตกลงและเงื่อนไข</a>
        </div>

        <a-button
          class="btn-register-glow"
          type="primary"
          html-type="submit"
          block
          :loading="loading"
        >
          สร้างบัญชีสมาชิก
        </a-button>
      </a-form>

      <div class="muted-footer">
        มีบัญชีอยู่แล้ว?
        <NuxtLink to="/auth/login" class="login-link"
          >เข้าสู่ระบบที่นี่</NuxtLink
        >
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
/* ===== Layout & Animated Background ===== */
.wrap {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #0b0f1a; /* พื้นหลังสีเข้มลึกแบบ High-end */
  position: relative;
  overflow: hidden;
}

.glow-sphere {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  filter: blur(100px);
  z-index: 0;
  opacity: 0.25;
}
.sphere-1 {
  background: radial-gradient(circle, #722ed1, #3b82f6);
  top: -150px;
  left: -150px;
}
.sphere-2 {
  background: radial-gradient(circle, #f472b6, #722ed1);
  bottom: -150px;
  right: -150px;
}

/* ===== Glass Card ===== */
.auth-card {
  width: 100%;
  max-width: 440px;
  z-index: 1;
  border-radius: 32px !important;
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(25px);
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.4);
}

.auth-card-header {
  text-align: center;
  margin-bottom: 30px;
}

.auth-badge {
  display: inline-block;
  background: rgba(114, 46, 209, 0.2);
  color: #d8b4fe;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.5px;
  margin-bottom: 16px;
  border: 1px solid rgba(114, 46, 209, 0.3);
}

.auth-card-title {
  font-size: 28px;
  font-weight: 900;
  color: #ffffff;
  margin: 0;
}

.auth-card-subtitle {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  margin-top: 8px;
}

/* ===== Form & Inputs ===== */
:deep(.ant-form-item-label > label) {
  color: rgba(255, 255, 255, 0.85) !important;
  font-weight: 600;
}

.custom-input {
  height: 48px !important;
  border-radius: 14px !important;
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: white !important;
}

:deep(.ant-input) {
  background: transparent !important;
  color: white !important;
}

:deep(.ant-input::placeholder) {
  color: rgba(255, 255, 255, 0.3) !important;
}

.icon-muted {
  color: rgba(255, 255, 255, 0.4);
}

.terms-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  margin-bottom: 24px;
  text-align: center;
}

.terms-text a {
  color: #d8b4fe;
  text-decoration: underline;
}

/* ===== Button Glow ===== */
.btn-register-glow {
  height: 52px !important;
  border-radius: 16px !important;
  font-weight: 800 !important;
  font-size: 16px !important;
  background: linear-gradient(90deg, #722ed1, #1890ff) !important;
  border: none !important;
  box-shadow: 0 10px 30px rgba(114, 46, 209, 0.4) !important;
  transition: all 0.3s ease;
}

.btn-register-glow:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 35px rgba(114, 46, 209, 0.6) !important;
  filter: brightness(1.1);
}

/* ===== Footer ===== */
.muted-footer {
  margin-top: 32px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.login-link {
  font-weight: 800;
  color: #ffffff;
  margin-left: 4px;
  text-decoration: none;
  border-bottom: 2px solid #722ed1;
}

.login-link:hover {
  color: #d8b4fe;
}

/* Responsive */
@media (max-width: 480px) {
  .auth-card {
    padding: 10px;
  }
}
</style>
