<template>
  <div class="wrap">
    <a-card class="card" title="สมัครสมาชิก">
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.card {
  width: 380px;
  border-radius: 16px;
}
.muted {
  margin-top: 12px;
  opacity: 0.75;
  text-align: center;
}
</style>
