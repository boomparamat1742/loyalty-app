<script setup>
import { UserOutlined, LockOutlined, SafetyOutlined } from "@ant-design/icons-vue";

definePageMeta({ layout: "auth" });

const { message } = useUi();

const form = reactive({
  username: "",
  password: "",
  confirm: "",
});

const loading = ref(false);

const usernameRules = [
  { required: true, message: "กรุณาตั้งชื่อผู้ใช้" },
  {
    validator: (_rule, value) =>
      !value || USERNAME_PATTERN.test(normalizeUsername(value))
        ? Promise.resolve()
        : Promise.reject("ใช้ได้เฉพาะ a-z, 0-9, _ และ . ยาว 3–20 ตัว"),
  },
];

const confirmRules = [
  { required: true, message: "กรุณายืนยันรหัสผ่าน" },
  {
    validator: (_rule, value) =>
      !value || value === form.password ? Promise.resolve() : Promise.reject("รหัสผ่านไม่ตรงกัน"),
  },
];

const onSubmit = async () => {
  const supabase = useSupabase();
  try {
    loading.value = true;

    const username = normalizeUsername(form.username);
    const password = (form.password || "").trim();

    // Supabase ต้องมีอีเมล จึงใช้อีเมลภายในที่สร้างจาก username (ดู utils/username.js)
    const { data, error } = await supabase.auth.signUp({
      email: usernameToEmail(username),
      password,
      options: { data: { username } },
    });

    if (error) throw error;

    // ต้องปิด "Confirm email" ใน Supabase ไม่อย่างนั้นจะไม่มี session (อีเมลภายในรับลิงก์ยืนยันไม่ได้)
    if (!data?.session) {
      throw new Error("ระบบยังตั้งค่าให้ยืนยันอีเมลอยู่ กรุณาติดต่อร้านค้า");
    }

    const auth = useAuthStore();
    auth.session = data.session;
    auth.user = data.user;
    await auth.fetchProfile().catch(() => null);

    message.success(`ยินดีต้อนรับ ${username}!`);
    navigateTo("/customer");
  } catch (e) {
    console.error(e);
    const msg = e?.message || "";
    message.error(
      msg === "User already registered" || msg.includes("Database error saving new user")
        ? "ชื่อผู้ใช้นี้ถูกใช้แล้ว กรุณาเลือกชื่ออื่น"
        : msg || "สมัครไม่สำเร็จ",
    );
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="form-head">
    <span class="eyebrow">Join the club</span>
    <h1 class="display form-title">สมัครสมาชิกฟรี</h1>
    <p class="muted">ตั้งชื่อผู้ใช้และรหัสผ่าน ไม่ต้องใช้อีเมล</p>
  </div>

  <a-form :model="form" layout="vertical" requiredMark="optional" @finish="onSubmit">
    <a-form-item
      label="ชื่อผู้ใช้"
      name="username"
      extra="a-z, 0-9, _ และ . ยาว 3–20 ตัว · เปลี่ยนภายหลังไม่ได้"
      :rules="usernameRules"
    >
      <a-input
        v-model:value="form.username"
        size="large"
        autocomplete="username"
        autocapitalize="none"
        spellcheck="false"
        :maxlength="20"
        placeholder="เช่น somchai_99"
        @blur="form.username = normalizeUsername(form.username)"
      >
        <template #prefix><UserOutlined class="subtle" /></template>
      </a-input>
    </a-form-item>

    <a-form-item
      label="รหัสผ่าน"
      name="password"
      :rules="[
        { required: true, message: 'กรุณากรอกรหัสผ่าน' },
        { min: 6, message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' },
      ]"
    >
      <a-input-password
        v-model:value="form.password"
        size="large"
        autocomplete="new-password"
        placeholder="อย่างน้อย 6 ตัวอักษร"
      >
        <template #prefix><LockOutlined class="subtle" /></template>
      </a-input-password>
    </a-form-item>

    <a-form-item label="ยืนยันรหัสผ่าน" name="confirm" :dependencies="['password']" :rules="confirmRules">
      <a-input-password
        v-model:value="form.confirm"
        size="large"
        autocomplete="new-password"
        placeholder="กรอกรหัสผ่านอีกครั้ง"
      >
        <template #prefix><SafetyOutlined class="subtle" /></template>
      </a-input-password>
    </a-form-item>

    <a-button type="primary" html-type="submit" size="large" block :loading="loading">
      สร้างบัญชีสมาชิก
    </a-button>
  </a-form>

  <p class="form-hint subtle">จดชื่อผู้ใช้และรหัสผ่านไว้ให้ดี หากลืมรหัสผ่าน ติดต่อร้านเพื่อขอรีเซ็ต</p>

  <p class="form-foot muted">
    เป็นสมาชิกอยู่แล้ว?
    <NuxtLink to="/auth/login">เข้าสู่ระบบ</NuxtLink>
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
.form-hint {
  margin: 16px 0 0;
  font-size: 12.5px;
  text-align: center;
}
.form-foot {
  margin: 12px 0 0;
  text-align: center;
  font-size: 14px;
}
.form-foot a {
  font-weight: 600;
}
</style>
