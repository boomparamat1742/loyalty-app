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
  <div class="admin-page">
    <div class="admin-shell">
      <!-- Top bar -->
      <div class="topbar">
        <div class="title-wrap">
          <a-typography-title :level="3" class="page-title" style="margin: 0">
            Admin Dashboard
          </a-typography-title>
          <div class="subtitle">ภาพรวมระบบสำหรับผู้ดูแล</div>
        </div>

        <a-button class="btn-logout" danger @click="logout">Logout</a-button>
      </div>

      <!-- Welcome / status -->
      <a-card class="glass" :bordered="false" :loading="loading">
        <div class="welcome-row">
          <div class="welcome-left">
            <div class="badge">ADMIN</div>

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
          </div>

          <div class="welcome-right">
            <div class="stat">
              <div class="stat-label">สถานะ</div>
              <div class="stat-value" :class="{ ok: !!me }">
                {{ me ? "พร้อมใช้งาน" : "กำลังโหลด..." }}
              </div>
            </div>
            <div class="divider" />
            <div class="stat">
              <div class="stat-label">สิทธิ์</div>
              <div class="stat-value">{{ me?.role || "-" }}</div>
            </div>
          </div>
        </div>
      </a-card>

      <!-- Quick cards -->
      <a-row :gutter="[14, 14]" style="margin-top: 14px">
        <a-col :xs="24" :md="8">
          <NuxtLink class="card-link" to="/admin/sales">
            <a-card hoverable class="nav-card nav-blue" :bordered="false">
              <div class="nav-head">
                <div class="nav-icon">฿</div>
                <div>
                  <div class="nav-title">ยอดขาย</div>
                  <div class="nav-desc">รายวัน / เดือน / ปี + กราฟ</div>
                </div>
              </div>
              <div class="nav-foot">ไปที่หน้า ยอดขาย →</div>
            </a-card>
          </NuxtLink>
        </a-col>

        <a-col :xs="24" :md="8">
          <NuxtLink class="card-link" to="/admin/rewards">
            <a-card hoverable class="nav-card nav-purple" :bordered="false">
              <div class="nav-head">
                <div class="nav-icon">🎁</div>
                <div>
                  <div class="nav-title">ของรางวัล</div>
                  <div class="nav-desc">เพิ่ม/แก้ไขของรางวัลแลกแต้ม</div>
                </div>
              </div>
              <div class="nav-foot">ไปที่หน้า ของรางวัล →</div>
            </a-card>
          </NuxtLink>
        </a-col>

        <a-col :xs="24" :md="8">
          <NuxtLink class="card-link" to="/admin/users">
            <a-card hoverable class="nav-card nav-green" :bordered="false">
              <div class="nav-head">
                <div class="nav-icon">👤</div>
                <div>
                  <div class="nav-title">ผู้ใช้</div>
                  <div class="nav-desc">ลูกค้า + เพิ่ม Admin ให้พนักงาน</div>
                </div>
              </div>
              <div class="nav-foot">ไปที่หน้า ผู้ใช้ →</div>
            </a-card>
          </NuxtLink>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<style scoped>
/* ===== Page background ===== */
.admin-page {
  min-height: 100vh;
  padding: 24px;
  background: radial-gradient(
      1200px 600px at 18% 10%,
      rgba(59, 130, 246, 0.18),
      transparent 60%
    ),
    radial-gradient(
      900px 500px at 82% 18%,
      rgba(168, 85, 247, 0.14),
      transparent 55%
    ),
    linear-gradient(180deg, #0b0f14 0%, #0a0d11 100%);
}

/* container */
.admin-shell {
  max-width: 1180px;
  margin: 0 auto;
}

/* ===== Topbar ===== */
.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.page-title {
  color: rgba(255, 255, 255, 0.92);
  letter-spacing: 0.2px;
}

.subtitle {
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.55);
  font-size: 13px;
}

.btn-logout {
  border-radius: 12px;
  height: 40px;
}

/* ===== Glass card ===== */
.glass {
  border-radius: 18px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.06),
    rgba(255, 255, 255, 0.03)
  );
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
}

/* welcome layout */
.welcome-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.welcome-left {
  min-width: 280px;
  flex: 1;
}

.badge {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  margin-bottom: 10px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 0.6px;
  color: rgba(255, 255, 255, 0.92);
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.45), rgba(168, 85, 247, 0.35));
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.welcome-right {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.stat {
  min-width: 120px;
}
.stat-label {
  color: rgba(255, 255, 255, 0.55);
  font-size: 12px;
  margin-bottom: 4px;
}
.stat-value {
  color: rgba(255, 255, 255, 0.92);
  font-weight: 800;
}
.stat-value.ok {
  color: rgba(34, 197, 94, 0.95);
}
.divider {
  width: 1px;
  height: 34px;
  background: rgba(255, 255, 255, 0.1);
}

/* ===== Nav cards ===== */
.card-link {
  display: block;
  text-decoration: none;
}

.nav-card {
  border-radius: 18px;
  min-height: 130px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 16px 55px rgba(0, 0, 0, 0.45);
  overflow: hidden;
  position: relative;
}

.nav-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.55);
}

.nav-head {
  display: flex;
  gap: 12px;
  align-items: center;
}

.nav-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: 900;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.nav-title {
  font-weight: 900;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.93);
  margin-bottom: 2px;
}

.nav-desc {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.nav-foot {
  margin-top: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.75);
}

/* gradients */
.nav-blue {
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.22),
    rgba(255, 255, 255, 0.03)
  );
  border: 1px solid rgba(59, 130, 246, 0.18);
}

.nav-purple {
  background: linear-gradient(
    135deg,
    rgba(168, 85, 247, 0.2),
    rgba(255, 255, 255, 0.03)
  );
  border: 1px solid rgba(168, 85, 247, 0.16);
}

.nav-green {
  background: linear-gradient(
    135deg,
    rgba(34, 197, 94, 0.16),
    rgba(255, 255, 255, 0.03)
  );
  border: 1px solid rgba(34, 197, 94, 0.14);
}

/* ✅ ปรับสี typography ของ ant ให้เข้ากับ dark (เฉพาะในหน้านี้) */
:deep(.ant-card-body) {
  color: rgba(255, 255, 255, 0.92);
}
:deep(.ant-alert-message) {
  font-weight: 700;
}
</style>
