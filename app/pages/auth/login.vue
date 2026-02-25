<template>
  <div class="auth-page">
    <div class="auth-bg-gradient"></div>

    <div class="auth-shell">
      <section class="auth-left">
        <div class="glass-effect"></div>
        <div class="left-content">
          <div class="brand-row">
            <div class="brand-badge-premium">
              <span class="logo-inner">B</span>
            </div>
            <div class="brand-text-group">
              <div class="brand-logo-text">R.BENZ</div>
              <div class="brand-tagline">PURPLE FILM PAED RIOW</div>
            </div>
          </div>

          <div class="brand-showcase">
            <h1 class="main-hero-text">
              สะสมแต้ม <br />
              <span class="text-purple-glow">สิทธิพิเศษ</span> <br />
              สำหรับคุณ
            </h1>
          </div>

          <div class="brand-bottom">
            <h3 class="brand-title-th">R.benz ฟิล์มม่วง แปดริ้ว</h3>
            <p class="brand-sub">สัมผัสประสบการณ์การดูแลมือถือระดับพรีเมียม</p>
          </div>
        </div>
      </section>

      <section class="auth-right">
        <div class="auth-form-container">
          <div class="form-header">
            <h2 class="auth-title">ยินดีต้อนรับกลับมา</h2>
            <p class="auth-subtitle">เข้าสู่ระบบเพื่อจัดการแต้มของคุณ</p>
          </div>

          <a-form
            :model="form"
            layout="vertical"
            @finish="onSubmit"
            class="custom-auth-form"
          >
            <a-form-item
              name="email"
              label="อีเมลผู้ใช้งาน"
              :rules="[{ required: true, message: 'กรุณากรอกอีเมล' }]"
            >
              <a-input
                v-model:value="form.email"
                placeholder="example@mail.com"
                class="premium-input"
              >
                <template #prefix><UserOutlined class="input-icon" /></template>
              </a-input>
            </a-form-item>

            <a-form-item
              name="password"
              label="รหัสผ่าน"
              :rules="[{ required: true, message: 'กรุณากรอกรหัสผ่าน' }]"
            >
              <a-input-password
                v-model:value="form.password"
                placeholder="••••••••"
                class="premium-input"
              >
                <template #prefix><LockOutlined class="input-icon" /></template>
              </a-input-password>
            </a-form-item>

            <div class="forgot-link">
              <a href="#">ลืมรหัสผ่าน?</a>
            </div>

            <a-button
              class="auth-btn-gradient"
              type="primary"
              html-type="submit"
              block
              :loading="loading"
            >
              เข้าสู่ระบบ
            </a-button>
          </a-form>

          <div class="auth-footer">
            ยังไม่มีบัญชีสมาชิก?
            <NuxtLink to="/auth/register" class="register-link"
              >สมัครสมาชิกใหม่</NuxtLink
            >
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { message } from "ant-design-vue";

const loading = ref(false);

const form = reactive({
  email: "",
  password: "",
});

const onSubmit = async () => {
  const supabase = useSupabase();

  try {
    loading.value = true;

    const email = (form.email || "").trim().toLowerCase();
    const password = form.password || "";

    const { data: loginData, error: loginErr } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginErr) throw loginErr;

    const userId = loginData?.user?.id;
    if (!userId) throw new Error("Login failed (no user)");

    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (pErr) throw pErr;

    if (profile?.role === "admin") {
      return navigateTo("/admin");
    }

    return navigateTo("/customer");
  } catch (e) {
    console.error(e);
    message.error(e?.message || "Login ไม่สำเร็จ");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* ===== Layout & Background ===== */
.auth-page {
  min-height: 100vh;
  background: #0f172a; /* พื้นหลังเข้ม */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.auth-bg-gradient {
  position: absolute;
  width: 800px;
  height: 800px;
  background: radial-gradient(
    circle,
    rgba(114, 46, 209, 0.15) 0%,
    transparent 70%
  );
  top: -200px;
  right: -200px;
  z-index: 0;
}

.auth-shell {
  width: min(1100px, 100%);
  min-height: 650px;
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(20px);
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  z-index: 1;
  overflow: hidden;
  box-shadow: 0 50px 100px rgba(0, 0, 0, 0.4);
}

/* ===== Left Panel (Branding) ===== */
.auth-left {
  position: relative;
  padding: 60px;
  background: linear-gradient(
    135deg,
    #1e1b4b 0%,
    #722ed1 100%
  ); /* ไล่สีม่วงเข้มไปม่วงสว่าง */
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.brand-badge-premium {
  width: 60px;
  height: 60px;
  background: #fff;
  border-radius: 18px;
  display: grid;
  place-items: center;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}
.logo-inner {
  font-size: 28px;
  font-weight: 900;
  background: linear-gradient(135deg, #722ed1, #2aa7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-logo-text {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 1px;
  line-height: 1;
}
.brand-tagline {
  font-size: 11px;
  opacity: 0.6;
  letter-spacing: 2px;
  margin-top: 4px;
}

.main-hero-text {
  font-size: 48px;
  font-weight: 950;
  line-height: 1.1;
  margin: 40px 0;
}
.text-purple-glow {
  color: #d8b4fe;
  text-shadow: 0 0 20px rgba(216, 180, 254, 0.5);
}

/* ===== Right Panel (Form) ===== */
.auth-right {
  background: #ffffff;
  padding: 60px 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-form-container {
  width: 100%;
  max-width: 380px;
}
.auth-title {
  font-size: 32px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 8px !important;
}
.auth-subtitle {
  color: #64748b;
  margin-bottom: 32px;
}

/* Premium Inputs */
.premium-input {
  height: 50px !important;
  border-radius: 14px !important;
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  font-size: 15px !important;
}
.premium-input:focus {
  border-color: #722ed1 !important;
  box-shadow: 0 0 0 4px rgba(114, 46, 209, 0.1) !important;
}
.input-icon {
  color: #94a3b8;
  margin-right: 8px;
}

.forgot-link {
  text-align: right;
  margin-bottom: 24px;
}
.forgot-link a {
  color: #722ed1;
  font-weight: 600;
  font-size: 13px;
}

/* Login Button */
.auth-btn-gradient {
  height: 52px !important;
  border-radius: 14px !important;
  font-weight: 800 !important;
  font-size: 16px !important;
  background: linear-gradient(90deg, #722ed1, #3b82f6) !important;
  border: none !important;
  box-shadow: 0 12px 24px rgba(114, 46, 209, 0.3) !important;
  transition: all 0.3s ease !important;
}
.auth-btn-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px rgba(114, 46, 209, 0.4) !important;
}

.auth-footer {
  margin-top: 32px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
}
.register-link {
  color: #722ed1;
  font-weight: 700;
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 900px) {
  .auth-shell {
    grid-template-columns: 1fr;
  }
  .auth-left {
    display: none;
  }
  .auth-right {
    border-radius: 32px;
  }
}
</style>
