<script setup>
import { message } from "ant-design-vue";
import dayjs from "dayjs";
import {
  LineChartOutlined,
  GiftOutlined,
  TeamOutlined,
  ArrowRightOutlined,
  FileProtectOutlined,
  DatabaseOutlined,
  AuditOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons-vue";

definePageMeta({ layout: "admin" });

const supabase = useSupabase();
const me = ref(null);
const loading = ref(true);

// Statistics
const stats = ref({
  totalUsers: 0,
  totalRewards: 0,
  totalSales: 0,
  todaySales: 0,
  activeRewards: 0,
});
const statsLoading = ref(true);

// Recent activity
const recentActivity = ref([]);
const activityLoading = ref(false);

onMounted(async () => {
  try {
    // Load user profile
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

    // Load statistics in parallel
    await Promise.all([
      loadStatistics(),
      loadRecentActivity(),
    ]);
  } catch (e) {
    console.error(e);
    message.error(e?.message || "โหลดข้อมูลไม่สำเร็จ");
  } finally {
    loading.value = false;
  }
});

const loadStatistics = async () => {
  try {
    statsLoading.value = true;

    const [usersRes, rewardsRes, salesRes, activeRewardsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase.from("rewards").select("id", { count: "exact" }),
      supabase.from("sales").select("amount", { count: "exact" }),
      supabase.from("rewards").select("id", { count: "exact" }).eq("is_active", true),
    ]);

    stats.value.totalUsers = usersRes.count || 0;
    stats.value.totalRewards = rewardsRes.count || 0;
    stats.value.activeRewards = activeRewardsRes.count || 0;

    // Calculate total sales and today's sales
    if (salesRes.data) {
      stats.value.totalSales = salesRes.data.reduce((sum, item) => sum + (item.amount || 0), 0);

      const today = dayjs().format("YYYY-MM-DD");
      const todayData = salesRes.data.filter(item => 
        dayjs(item.created_at).format("YYYY-MM-DD") === today
      );
      stats.value.todaySales = todayData.reduce((sum, item) => sum + (item.amount || 0), 0);
    }
  } catch (e) {
    console.error("Failed to load statistics:", e);
  } finally {
    statsLoading.value = false;
  }
};

const loadRecentActivity = async () => {
  try {
    activityLoading.value = true;

    // Load recent sales
    const { data } = await supabase
      .from("sales")
      .select("id, amount, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) {
      recentActivity.value = data.map(item => ({
        ...item,
        type: "sale",
        description: `Sale of ${item.amount}฿`,
      }));
    }
  } catch (e) {
    console.error("Failed to load activity:", e);
  } finally {
    activityLoading.value = false;
  }
};

const logout = async () => {
  await supabase.auth.signOut();
  navigateTo("/auth/login");
};

const formatCurrency = (val) => {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(val);
};

const formatDate = (date) => {
  return dayjs(date).format("DD/MM/YYYY HH:mm");
};
</script>

<template>
  <div class="admin-page">
    <div class="glow-orb orb-1"></div>
    <div class="glow-orb orb-2"></div>

    <div class="admin-shell">
      <!-- Top Bar -->
      <div class="topbar">
        <div class="title-wrap">
          <div class="admin-label">
            <span class="dot"></span> DASHBOARD
          </div>
          <a-typography-title :level="2" class="page-title">
            Admin <span class="text-gradient">Management</span>
          </a-typography-title>
        </div>

        <a-space size="middle">
          <div class="server-status">
            <span class="status-text">System: Online</span>
            <div class="pulse-green"></div>
          </div>
          <a-button class="btn-logout-luxury" @click="logout">
            <template #icon><LogoutOutlined /></template> Logout
          </a-button>
        </a-space>
      </div>

      <!-- Welcome Card -->
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

      <!-- Statistics Cards -->
      <a-row :gutter="[20, 20]" style="margin-top: 24px">
        <a-col :xs="24" :sm="12" :md="6">
          <a-card class="stat-card blue-card" :bordered="false" :loading="statsLoading">
            <template #title>
              <div class="stat-card-title">
                <TeamOutlined /> Total Users
              </div>
            </template>
            <div class="stat-value">{{ stats.totalUsers }}</div>
            <div class="stat-footer">Active members in system</div>
          </a-card>
        </a-col>

        <a-col :xs="24" :sm="12" :md="6">
          <a-card class="stat-card purple-card" :bordered="false" :loading="statsLoading">
            <template #title>
              <div class="stat-card-title">
                <GiftOutlined /> Rewards
              </div>
            </template>
            <div class="stat-value">{{ stats.activeRewards }}/{{ stats.totalRewards }}</div>
            <div class="stat-footer">Active rewards available</div>
          </a-card>
        </a-col>

        <a-col :xs="24" :sm="12" :md="6">
          <a-card class="stat-card green-card" :bordered="false" :loading="statsLoading">
            <template #title>
              <div class="stat-card-title">
                <LineChartOutlined /> Today Sales
              </div>
            </template>
            <div class="stat-value">{{ formatCurrency(stats.todaySales) }}</div>
            <div class="stat-footer">Transactions today</div>
          </a-card>
        </a-col>

        <a-col :xs="24" :sm="12" :md="6">
          <a-card class="stat-card orange-card" :bordered="false" :loading="statsLoading">
            <template #title>
              <div class="stat-card-title">
                <DatabaseOutlined /> Total Sales
              </div>
            </template>
            <div class="stat-value">{{ formatCurrency(stats.totalSales) }}</div>
            <div class="stat-footer">All time revenue</div>
          </a-card>
        </a-col>
      </a-row>

      <!-- Action Cards -->
      <a-row :gutter="[20, 20]" style="margin-top: 24px">
        <a-col :xs="24" :md="8">
          <NuxtLink class="card-link" to="/admin/sales">
            <div class="nav-card-luxury blue-theme">
              <div class="card-inner">
                <div class="icon-box"><LineChartOutlined /></div>
                <div class="card-info">
                  <h3>Sales Analytics</h3>
                  <p><FileProtectOutlined /> Daily & Monthly Reports</p>
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
                  <h3>Reward Management</h3>
                  <p><DatabaseOutlined /> Inventory & Points</p>
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
                  <h3>User Management</h3>
                  <p><AuditOutlined /> Roles & Permissions</p>
                </div>
              </div>
              <div class="card-arrow"><ArrowRightOutlined /></div>
            </div>
          </NuxtLink>
        </a-col>
      </a-row>

      <!-- Recent Activity -->
      <a-card class="glass-main" :bordered="false" style="margin-top: 24px">
        <template #title>
          <div style="color: #1f2937; font-weight: 600; font-size: 14px">
            <AuditOutlined style="margin-right: 8px" /> RECENT ACTIVITY
          </div>
        </template>

        <a-spin :spinning="activityLoading">
          <div v-if="recentActivity.length === 0" class="empty-state">
            <p>No recent activity</p>
          </div>
          <a-list v-else :dataSource="recentActivity" :split="false">
            <template #renderItem="{ item }">
              <a-list-item style="background: rgba(59, 130, 246, 0.02); margin-bottom: 8px; border-radius: 8px; padding: 12px 16px">
                <div style="width: 100%; display: flex; justify-content: space-between; align-items: center">
                  <div>
                    <div style="color: #1f2937; font-weight: 500">{{ item.description }}</div>
                    <div style="color: #6b7280; font-size: 12px; margin-top: 4px">User ID: {{ item.user_id }}</div>
                  </div>
                  <div style="color: #9ca3af; font-size: 12px; white-space: nowrap; margin-left: 16px">
                    {{ formatDate(item.created_at) }}
                  </div>
                </div>
              </a-list-item>
            </template>
          </a-list>
        </a-spin>
      </a-card>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap");

.admin-page {
  min-height: 100vh;
  padding: 40px 24px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
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
  color: #e0e7ff !important;
  margin: 0 !important;
  font-weight: 800 !important;
}

.server-status {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.7);
  padding: 6px 14px;
  border-radius: 10px;
  border: 1px solid rgba(59, 130, 246, 0.3);
}
.status-text {
  color: #4b5563;
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
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.6) !important;
  border-radius: 20px !important;
  margin-top: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
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
  color: #6b7280;
  font-size: 16px;
}
.user-email {
  color: #1f2937;
  font-weight: 700;
}
.role-badge {
  display: inline-block;
  padding: 2px 10px;
  background: rgba(59, 130, 246, 0.1);
  color: #1e40af;
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
  color: #6b7280;
  letter-spacing: 1px;
}
.s-value {
  color: #1f2937;
  font-weight: 800;
  font-size: 14px;
}
.status-active {
  color: #22c55e;
}
.v-divider {
  width: 1px;
  height: 40px;
  background: rgba(59, 130, 246, 0.2);
}

/* Luxury Nav Cards */
.nav-card-luxury {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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
  color: #1f2937;
  margin: 0;
  font-weight: 700;
  font-size: 16px;
}
.card-info p {
  color: #6b7280;
  margin: 0;
  font-size: 12px;
}
.card-arrow {
  color: #9ca3af;
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
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-5px);
  border-color: rgba(59, 130, 246, 0.4);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}
.blue-theme:hover {
  border-color: #3b82f6;
}
.purple-theme:hover {
  border-color: #a855f7;
}
.green-theme:hover {
  border-color: #22c55e;
}

.nav-card-luxury:hover .card-arrow {
  transform: translateX(5px);
  color: #3b82f6;
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

/* Statistics Cards */
.stat-card {
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.6) !important;
  border-radius: 16px !important;
  overflow: hidden !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-card:hover {
  transform: translateY(-5px);
  border-color: rgba(59, 130, 246, 0.4) !important;
  background: rgba(255, 255, 255, 0.95) !important;
}

.stat-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: #1f2937;
  margin: 12px 0 8px 0;
}

.stat-footer {
  font-size: 12px;
  color: #9ca3af;
}

.blue-card .stat-card-title {
  color: #3b82f6;
}
.blue-card:hover {
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.15);
}

.purple-card .stat-card-title {
  color: #a855f7;
}
.purple-card:hover {
  box-shadow: 0 10px 25px rgba(168, 85, 247, 0.15);
}

.green-card .stat-card-title {
  color: #22c55e;
}
.green-card:hover {
  box-shadow: 0 10px 25px rgba(34, 197, 94, 0.15);
}

.orange-card .stat-card-title {
  color: #f97316;
}
.orange-card:hover {
  box-shadow: 0 10px 25px rgba(249, 115, 22, 0.15);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 32px 16px;
  color: #6b7280;
}

/* Card Link */
.card-link {
  text-decoration: none;
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
  .stat-value {
    font-size: 22px;
  }
}
</style>
