<script setup>
import { message } from "ant-design-vue";

const supabase = useSupabase();

const loading = ref(true);
const me = ref(null); // { email, role }

const loadMe = async () => {
  try {
    loading.value = true;

    const { data: u } = await supabase.auth.getUser();
    const user = u?.user;

    if (!user) {
      me.value = null;
      return;
    }

    const { data: p, error } = await supabase
      .from("profiles")
      .select("email, role")
      .eq("id", user.id)
      .single();

    if (error) throw error;
    me.value = p;
  } catch (e) {
    console.error(e);
    me.value = null;
  } finally {
    loading.value = false;
  }
};

onMounted(loadMe);

const goDashboard = async () => {
  if (!me.value?.role) return navigateTo("/auth/login");
  if (me.value.role === "admin") return navigateTo("/admin");
  return navigateTo("/customer");
};

const logout = async () => {
  await supabase.auth.signOut();
  message.success("ออกจากระบบแล้ว");
  me.value = null;
  navigateTo("/auth/login");
};
</script>

<template>
  <div class="home-wrap">
    <div class="home-container">
      <!-- Hero -->
      <a-card class="home-hero" :bordered="false">
        <div class="home-hero-inner">
          <!-- Left -->
          <div class="home-left">
            <a-space direction="vertical" :size="6">
              <a-typography-title :level="2" class="home-title">
                Loyalty App
              </a-typography-title>
              <a-typography-text type="secondary" class="home-subtitle">
                ระบบสะสมแต้มร้านขายเคสและฟิล์ม
              </a-typography-text>
            </a-space>

            <div class="home-actions">
              <NuxtLink to="/auth/login">
                <a-button type="primary" size="large">เข้าสู่ระบบ</a-button>
              </NuxtLink>

              <NuxtLink to="/auth/register">
                <a-button size="large">สมัครสมาชิก</a-button>
              </NuxtLink>

              <a-button
                size="large"
                :loading="loading"
                @click="goDashboard"
                v-if="!loading"
              >
                ไปหน้าใช้งาน
              </a-button>
            </div>

            <div class="home-status">
              <a-skeleton
                v-if="loading"
                :paragraph="{ rows: 1 }"
                :title="false"
                active
              />
              <a-alert
                v-else-if="me?.email"
                show-icon
                type="success"
                :message="`เข้าสู่ระบบแล้ว: ${me.email} (${me.role})`"
              />
              <a-alert
                v-else
                show-icon
                type="info"
                message="ยังไม่ได้เข้าสู่ระบบ"
              />
            </div>
          </div>
        </div>
      </a-card>

      <div class="home-footer">
        © {{ new Date().getFullYear() }} Loyalty App
      </div>
    </div>
  </div>
</template>
