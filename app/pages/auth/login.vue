<script setup>
import { UserOutlined, LockOutlined } from "@ant-design/icons-vue";

definePageMeta({ layout: "auth" });

const { message } = useUi();
const loading = ref(false);

const form = reactive({
  loginId: "", // username หรืออีเมล
  password: "",
});

const onSubmit = async () => {
  const supabase = useSupabase();

  try {
    loading.value = true;

    // มี @ = อีเมล (ลูกค้าเดิม) ไม่มี = username
    const email = loginIdToEmail(form.loginId);
    const password = form.password || "";

    const { data: loginData, error: loginErr } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginErr) throw loginErr;

    if (!loginData?.user?.id) throw new Error("Login failed (no user)");

    // อัปเดต store ทันที ให้ middleware รู้ว่า login แล้วและเป็น role อะไร
    const auth = useAuthStore();
    auth.session = loginData.session;
    auth.user = loginData.user;
    const profile = await auth.fetchProfile();

    if (profile?.role === "admin") {
      return navigateTo("/admin");
    }

    return navigateTo("/customer");
  } catch (e) {
    console.error(e);
    message.error(
      e?.message === "Invalid login credentials"
        ? "ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง"
        : e?.message || "เข้าสู่ระบบไม่สำเร็จ",
    );
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="form-head">
    <span class="eyebrow">Welcome back</span>
    <h1 class="display form-title">เข้าสู่ระบบสมาชิก</h1>
    <p class="muted">ดูแต้มสะสม บันทึกการซื้อ และแลกของรางวัล</p>
  </div>

  <a-form :model="form" layout="vertical" requiredMark="optional" @finish="onSubmit">
    <a-form-item
      name="loginId"
      label="ชื่อผู้ใช้ หรือ อีเมล"
      extra="สมาชิกที่สมัครด้วยอีเมล ใช้อีเมลเดิมเข้าสู่ระบบได้"
      :rules="[{ required: true, message: 'กรุณากรอกชื่อผู้ใช้หรืออีเมล' }]"
    >
      <a-input
        v-model:value="form.loginId"
        size="large"
        autocomplete="username"
        autocapitalize="none"
        spellcheck="false"
        placeholder="username หรือ you@example.com"
      >
        <template #prefix><UserOutlined class="subtle" /></template>
      </a-input>
    </a-form-item>

    <a-form-item
      name="password"
      label="รหัสผ่าน"
      :rules="[{ required: true, message: 'กรุณากรอกรหัสผ่าน' }]"
    >
      <a-input-password
        v-model:value="form.password"
        size="large"
        autocomplete="current-password"
        placeholder="รหัสผ่านของคุณ"
      >
        <template #prefix><LockOutlined class="subtle" /></template>
      </a-input-password>
    </a-form-item>

    <a-button type="primary" html-type="submit" size="large" block :loading="loading">
      เข้าสู่ระบบ
    </a-button>
  </a-form>

  <p class="form-foot muted">
    ยังไม่เป็นสมาชิก?
    <NuxtLink to="/auth/register">สมัครสมาชิกฟรี</NuxtLink>
  </p>
</template>

<style scoped>
.form-head {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 28px;
}
.form-head p {
  margin: 0;
}
.form-title {
  font-size: 30px;
}
.form-foot {
  margin: 24px 0 0;
  text-align: center;
  font-size: 14px;
}
.form-foot a {
  font-weight: 600;
}
</style>
