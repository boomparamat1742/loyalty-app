<script setup>
import { message } from "ant-design-vue";

definePageMeta({ layout: "admin" });

const supabase = useSupabase();
const me = ref(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return navigateTo("/auth/login");

    const { data: p, error } = await supabase
      .from("profiles")
      .select("email, role")
      .eq("id", user.id)
      .single();

    if (error) throw error;
    me.value = p;
  } catch (e) {
    console.error(e);
    message.error(e?.message || "โหลดข้อมูลไม่สำเร็จ");
  } finally {
    loading.value = false;
  }
});

const logout = async () => {
  await supabase.auth.signOut();
  navigateTo("/auth/login");
};
</script>

<template>
  <div style="padding: 24px">
    <a-space direction="vertical" size="middle" style="width: 100%">
      <div
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        "
      >
        <a-typography-title :level="3" style="margin: 0"
          >Admin Dashboard</a-typography-title
        >
        <a-button danger @click="logout">Logout</a-button>
      </div>

      <a-card style="border-radius: 16px" :loading="loading">
        <a-alert
          v-if="me"
          show-icon
          type="success"
          :message="`Welcome ${me.email} (${me.role})`"
        />
        <a-alert
          v-else
          show-icon
          type="warning"
          message="กำลังโหลดข้อมูลผู้ใช้..."
        />
      </a-card>

      <a-row :gutter="[12, 12]">
        <a-col :xs="24" :md="8">
          <NuxtLink to="/admin/sales">
            <a-card hoverable style="border-radius: 16px">
              <a-typography-title :level="5" style="margin: 0"
                >ยอดขาย</a-typography-title
              >
              <div style="opacity: 0.75; margin-top: 6px">
                รายวัน / เดือน / ปี + กราฟ
              </div>
            </a-card>
          </NuxtLink>
        </a-col>

        <a-col :xs="24" :md="8">
          <NuxtLink to="/admin/rewards">
            <a-card hoverable style="border-radius: 16px">
              <a-typography-title :level="5" style="margin: 0"
                >ของรางวัล</a-typography-title
              >
              <div style="opacity: 0.75; margin-top: 6px">
                เพิ่ม/แก้ไขของรางวัลแลกแต้ม
              </div>
            </a-card>
          </NuxtLink>
        </a-col>

        <a-col :xs="24" :md="8">
          <NuxtLink to="/admin/users">
            <a-card hoverable style="border-radius: 16px">
              <a-typography-title :level="5" style="margin: 0"
                >ผู้ใช้</a-typography-title
              >
              <div style="opacity: 0.75; margin-top: 6px">
                ลูกค้า + เพิ่ม Admin ให้พนักงาน
              </div>
            </a-card>
          </NuxtLink>
        </a-col>
      </a-row>
    </a-space>
  </div>
</template>
