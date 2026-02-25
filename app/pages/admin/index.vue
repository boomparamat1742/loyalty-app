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
    <div class="glow-orb orb-1"></div>
    <div class="glow-orb orb-2"></div>

    <div class="admin-shell">
      <div class="topbar">
        <div class="title-wrap">
          <div class="admin-label">
            <span class="dot"></span> SYSTEM OVERVIEW
          </div>
          <a-typography-title :level="2" class="page-title">
            Admin <span class="text-gradient">Control Panel</span>
          </a-typography-title>
        </div>

        <a-space size="middle">
          <div class="server-status">
            <span class="status-text">Network: Online</span>
            <div class="pulse-green"></div>
          </div>
          <a-button class="btn-logout-luxury" @click="logout">
            <template #icon><LogoutOutlined /></template> Logout
          </a-button>
        </a-space>
      </div>

      <a-card class="glass-main" :bordered="false">
        <div class="welcome-container">
          <div class="welcome-profile">
            <div class="avatar-glow">
              <UserOutlined />
            </div>
            <div class="profile-details">
              <div v-if="me" class="user-greeting">
                ยินดีต้อนรับคุณ, <span class="user-email">{{ me.email }}</span>
              </div>
              <a-skeleton-input v-else active size="small" />
              <div class="role-badge">{{ me?.role || "Fetching..." }}</div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-item">
              <span class="s-label">SYSTEM STATUS</span>
              <span class="s-value status-active">ACTIVE</span>
            </div>
            <div class="v-divider"></div>
            <div class="stat-item">
              <span class="s-label">DATABASE</span>
              <span class="s-value">CONNECTED</span>
            </div>
          </div>
        </div>
      </a-card>

      <a-row :gutter="[20, 20]" style="margin-top: 24px">
        <a-col :xs="24" :md="8">
          <NuxtLink class="card-link" to="/admin/sales">
            <div class="nav-card-luxury blue-theme">
              <div class="card-inner">
                <div class="icon-box"><LineChartOutlined /></div>
                <div class="card-info">
                  <h3>ยอดขายรวม</h3>
                  <p>Daily & Monthly Report</p>
                </div>
              </div>
              <div class="card-arrow"><ArrowRightOutlined /></div>
            </div>
          </NuxtLink>
        </a-col>

        <a-col :xs="24" :md="8">
          <NuxtLink class="card-link" to="/admin/rewards">
            <div class="nav-card-luxury purple-theme">
              <div class="card-inner">
                <div class="icon-box"><GiftOutlined /></div>
                <div class="card-info">
                  <h3>จัดการของรางวัล</h3>
                  <p>Inventory & Points</p>
                </div>
              </div>
              <div class="card-arrow"><ArrowRightOutlined /></div>
            </div>
          </NuxtLink>
        </a-col>

        <a-col :xs="24" :md="8">
          <NuxtLink class="card-link" to="/admin/users">
            <div class="nav-card-luxury green-theme">
              <div class="card-inner">
                <div class="icon-box"><TeamOutlined /></div>
                <div class="card-info">
                  <h3>สมาชิกทั้งหมด</h3>
                  <p>User Management</p>
                </div>
              </div>
              <div class="card-arrow"><ArrowRightOutlined /></div>
            </div>
          </NuxtLink>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap");

.admin-page {
  min-height: 100vh;
  padding: 40px 24px;
  background: #020617; /* Deepest blue */
  font-family: "Plus Jakarta Sans", sans-serif;
  position: relative;
  overflow: hidden;
}

/* Background Blobs */
.glow-orb {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  filter: blur(120px);
  z-index: 0;
  opacity: 0.15;
}
.orb-1 {
  background: #3b82f6;
  top: -10%;
  left: -10%;
}
.orb-2 {
  background: #a855f7;
  bottom: -10%;
  right: -10%;
}

.admin-shell {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* Topbar */
.admin-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  letter-spacing: 2px;
  color: #64748b;
  margin-bottom: 8px;
}
.dot {
  width: 6px;
  height: 6px;
  background: #3b82f6;
  border-radius: 50%;
  box-shadow: 0 0 10px #3b82f6;
}

.text-gradient {
  background: linear-gradient(90deg, #3b82f6, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
}

.page-title {
  color: #fff !important;
  margin: 0 !important;
  font-weight: 800 !important;
}

.server-status {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.05);
  padding: 6px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.status-text {
  color: #94a3b8;
  font-size: 12px;
}
.pulse-green {
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}

/* Glass Main Card */
.glass-main {
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 24px !important;
  margin-top: 24px;
}

.welcome-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.welcome-profile {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-glow {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #3b82f6, #a855f7);
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-size: 24px;
  color: #fff;
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
}

.user-greeting {
  color: #94a3b8;
  font-size: 16px;
}
.user-email {
  color: #fff;
  font-weight: 700;
}
.role-badge {
  display: inline-block;
  padding: 2px 10px;
  background: rgba(168, 85, 247, 0.2);
  color: #d8b4fe;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 800;
  margin-top: 6px;
  text-transform: uppercase;
}

.stats-grid {
  display: flex;
  align-items: center;
  gap: 30px;
}
.stat-item {
  display: flex;
  flex-direction: column;
}
.s-label {
  font-size: 10px;
  color: #64748b;
  letter-spacing: 1px;
}
.s-value {
  color: #fff;
  font-weight: 800;
  font-size: 14px;
}
.status-active {
  color: #22c55e;
}
.v-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
}

/* Luxury Nav Cards */
.nav-card-luxury {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.card-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}
.icon-box {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 20px;
  color: #fff;
}

.card-info h3 {
  color: #fff;
  margin: 0;
  font-weight: 700;
  font-size: 16px;
}
.card-info p {
  color: #64748b;
  margin: 0;
  font-size: 12px;
}
.card-arrow {
  color: #64748b;
  font-size: 18px;
  transition: 0.3s;
}

/* Theme Colors */
.blue-theme .icon-box {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}
.purple-theme .icon-box {
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
}
.green-theme .icon-box {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

/* Hover Effects */
.nav-card-luxury:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-5px);
  border-color: rgba(255, 255, 255, 0.2);
}
.blue-theme:hover {
  box-shadow: 0 15px 30px rgba(59, 130, 246, 0.15);
}
.purple-theme:hover {
  box-shadow: 0 15px 30px rgba(168, 85, 247, 0.15);
}
.green-theme:hover {
  box-shadow: 0 15px 30px rgba(34, 197, 94, 0.15);
}

.nav-card-luxury:hover .card-arrow {
  transform: translateX(5px);
  color: #fff;
}

.btn-logout-luxury {
  background: rgba(239, 44, 44, 0.1) !important;
  color: #f87171 !important;
  border: 1px solid rgba(239, 44, 44, 0.2) !important;
  border-radius: 12px !important;
  height: 42px !important;
  font-weight: 600 !important;
}
.btn-logout-luxury:hover {
  background: #ef4444 !important;
  color: #fff !important;
}

@media (max-width: 768px) {
  .welcome-container {
    flex-direction: column;
    align-items: flex-start;
  }
  .stats-grid {
    width: 100%;
    justify-content: space-between;
    margin-top: 20px;
  }
}
</style>
