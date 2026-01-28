<template>
  <div class="auth-wrapper">
    <a-card style="max-width: 420px; width: 100%; border-radius: 16px">
      <a-typography-title :level="4">เข้าสู่ระบบ</a-typography-title>

      <a-form :model="form" layout="vertical" @finish="onSubmit">
        <a-form-item
          name="email"
          label="Email"
          :rules="[{ required: true, message: 'กรอกอีเมล' }]"
        >
          <a-input v-model:value="form.email" placeholder="email@example.com" />
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

        <a-button type="primary" html-type="submit" block :loading="loading">
          Login
        </a-button>
      </a-form>

      <div style="margin-top: 12px; text-align: center">
        ยังไม่มีบัญชี?
        <NuxtLink to="/auth/register">สมัครสมาชิก</NuxtLink>
      </div>
    </a-card>
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
.auth-wrapper {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
}

/* กันกรณีโดน overlay ทับ */
.auth-wrapper * {
  pointer-events: auto;
}
</style>
