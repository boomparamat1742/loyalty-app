<template>
  <div class="auth-page">
    <div class="auth-shell">
      <!-- Left -->
      <section class="auth-left">
        <div class="brand-row">
          <div class="brand-badge">B</div>

          <!-- ✅ โลโก้ใหญ่ -->
          <div class="brand-logo-text">R.benz purple film, Paed Riow.</div>
        </div>

        <div class="brand-bottom">
          <h3 class="brand-title-th">R.benz ฟิล์มม่วง แปดริ้ว</h3>
          <p class="brand-sub">ระบบสะสมแต้มร้านขายเคสและฟิล์ม</p>
        </div>
      </section>

      <!-- Right -->
      <section class="auth-right">
        <a-card class="auth-card" :bordered="false">
          <a-typography-title class="auth-title" :level="4"
            >เข้าสู่ระบบ</a-typography-title
          >

          <!-- ✅ โค้ด form / v-model / @finish ใช้ของเดิมได้เลย -->
          <a-form :model="form" layout="vertical" @finish="onSubmit">
            <a-form-item
              name="email"
              label="Email"
              :rules="[{ required: true, message: 'กรอกอีเมล' }]"
            >
              <a-input
                v-model:value="form.email"
                placeholder="email@example.com"
              />
            </a-form-item>

            <a-form-item
              name="password"
              label="Password"
              :rules="[{ required: true, message: 'กรอกรหัสผ่าน' }]"
            >
              <a-input-password
                v-model:value="form.password"
                placeholder="รหัสผ่าน"
              />
            </a-form-item>

            <a-button
              class="auth-btn"
              type="primary"
              html-type="submit"
              block
              :loading="loading"
            >
              Login
            </a-button>
          </a-form>

          <div class="auth-muted">
            ยังไม่มีบัญชี? <NuxtLink to="/auth/register">สมัครสมาชิก</NuxtLink>
          </div>
        </a-card>
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
/* ===== Page Layout ===== */
.auth-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #eef3f8 0%, #e7edf4 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 16px;
}

.auth-shell {
  width: min(1120px, 100%);
  min-height: 640px;
  border-radius: 26px;
  background: #f7f9fc;
  box-shadow: 0 30px 70px rgba(15, 23, 42, 0.12);
  overflow: hidden;
  display: grid;
  grid-template-columns: 1.15fr 1fr;
}

/* Responsive */
@media (max-width: 980px) {
  .auth-shell {
    grid-template-columns: 1fr;
    min-height: unset;
  }
  .auth-left {
    display: none;
  }
}

/* ===== Left Panel ===== */
.auth-left {
  position: relative;
  padding: 34px 34px;
  color: #fff;
  background: linear-gradient(135deg, #6aaeff 0%, #2f8dff 55%, #2aa7ff 100%);
  display: flex;
  align-items: center;  
}

.auth-left::before {
  content: "";
  position: absolute;
  inset: -40%;
  background: radial-gradient(
    circle at 30% 20%,
    rgba(255, 255, 255, 0.18),
    transparent 55%
  );
  transform: rotate(8deg);
}

.auth-left::after {
  content: "";
  position: absolute;
  left: -10%;
  right: -10%;
  top: 40%;
  height: 120px;
  background: rgba(255, 255, 255, 0.08);
  transform: skewY(-6deg);
}

.brand-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-badge {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.18);
  display: grid;
  place-items: center;
  font-weight: 900;
  font-size: 22px;
  letter-spacing: 0.4px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
}

.brand-logo-text {
  font-weight: 900;
  font-size: 25px; /* ✅ โลโก้ใหญ่ */
  line-height: 1.15;
  letter-spacing: 0.2px;
  text-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
}

.brand-bottom {
  position: absolute;
  left: 34px;
  right: 34px;
  bottom: 28px;
  z-index: 1;
}

.brand-title-th {
  font-size: 26px;
  font-weight: 900;
  margin: 0 0 8px;
}

.brand-sub {
  opacity: 0.9;
  margin: 0;
}

/* ===== Right Panel ===== */
.auth-right {
  display: grid;
  place-items: center;
  padding: 34px 18px;
}

.auth-card {
  width: min(460px, 92%);
  border-radius: 22px;
  padding: 22px 22px 16px;
  background: #fff;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.1);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.auth-title {
  margin: 6px 0 18px !important;
  text-align: center;
  font-weight: 900 !important;
}

/* Input style (Ant Design Vue) */
.auth-card :deep(.ant-input),
.auth-card :deep(.ant-input-affix-wrapper) {
  border-radius: 999px !important;
  padding: 10px 14px !important;
  background: #eef7f3 !important; /* โทนเขียวอ่อนแบบตัวอย่าง */
  border-color: rgba(15, 23, 42, 0.08) !important;
  box-shadow: none !important;
}

.auth-card :deep(.ant-input::placeholder) {
  color: rgba(15, 23, 42, 0.35);
}

.auth-card :deep(.ant-form-item-label > label) {
  font-weight: 700;
}

/* Primary button */
.auth-btn {
  height: 46px;
  border-radius: 999px !important;
  font-weight: 800 !important;
  box-shadow: 0 14px 24px rgba(47, 141, 255, 0.28);
}

/* Bottom text */
.auth-muted {
  margin-top: 14px;
  text-align: center;
  opacity: 0.78;
}
</style>
