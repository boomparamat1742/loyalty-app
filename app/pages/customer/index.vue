<script setup>
import dayjs from "dayjs";
import { message } from "ant-design-vue";

definePageMeta({ layout: "customer" });

const supabase = useSupabase();

const loading = ref(false);
const me = ref(null); // profile
const rows = ref([]); // sales list

const fmt = (d) => (d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "-");

const load = async () => {
  try {
    loading.value = true;

    const { data: u, error: uErr } = await supabase.auth.getUser();
    if (uErr) throw uErr;

    const user = u?.user;
    if (!user) return navigateTo("/auth/login");

    // profile (points)
    const { data: p, error: pErr } = await supabase
      .from("profiles")
      .select("id,email,role,points")
      .eq("id", user.id)
      .single();

    if (pErr) throw pErr;
    me.value = p;

    // sales ของตัวเอง
    const { data: s, error: sErr } = await supabase
      .from("sales")
      .select("id, amount, points_earned, note, created_at")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (sErr) throw sErr;
    rows.value = s || [];
    console.log("rows", rows);
  } catch (e) {
    console.error(e);
    message.error(e?.message || "โหลดข้อมูลไม่สำเร็จ");
  } finally {
    loading.value = false;
  }
};

onMounted(load);

const goPurchase = () => navigateTo("/customer/purchase");
const gorewards = () => navigateTo("/customer/rewards");
const logout = async () => {
  await supabase.auth.signOut();
  navigateTo("/auth/login");
};
const displayName = computed(() => {
  if (!me.value?.email) return "Member";
  return me.value.email.split("@")[0];
});
</script>

<template>
  <div class="dashboard-wrap">
    <div class="glow-bg"></div>

    <div class="dashboard-content">
      <div class="header-banner">
        <div class="user-info">
          <a-typography-title :level="2" class="text-gradient">
            สวัสดี
            <span class="text-gradient">{{ displayName }}</span>
          </a-typography-title>
          <div class="status-badge"><CrownFilled /> Premium Member</div>
        </div>

        <a-space size="middle" class="header-actions">
          <a-button @click="load" :loading="loading" class="btn-glass">
            <template #icon><ReloadOutlined /></template> Refresh
          </a-button>
          <a-button type="primary" danger @click="logout" class="btn-logout">
            <LogoutOutlined /> ออกจากระบบ
          </a-button>
        </a-space>
      </div>

      <a-row :gutter="[24, 24]">
        <a-col :xs="24" :lg="8">
          <div class="points-card-premium">
            <div class="card-overlay"></div>
            <div class="card-content">
              <span class="label">TOTAL BALANCE</span>
              <div class="points-display">
                <span class="points-num">{{
                  Number(me?.points || 0).toLocaleString()
                }}</span>
                <span class="points-unit">PTS</span>
              </div>
              <div class="card-footer-info">
                <span>{{ me?.email }}</span>
                <div class="chip-icon"><ThunderboltFilled /></div>
              </div>
            </div>
          </div>

          <div class="quick-actions">
            <a-button
              type="primary"
              block
              size="large"
              @click="goPurchase"
              class="btn-action-primary"
            >
              <ShoppingCartOutlined /> เพิ่มรายการซื้อฟิล์ม
            </a-button>
            <a-button
              block
              size="large"
              @click="gorewards"
              class="btn-action-primary"
            >
              <GiftOutlined /> แลกของรางวัลสุดพิเศษ
            </a-button>
          </div>
        </a-col>

        <a-col :xs="24" :lg="16">
          <a-card
            class="table-card"
            :bordered="false"
            title="ประวัติการทำรายการล่าสุด"
          >
            <template #extra>
              <span class="text-dim">Latest 10 transactions</span>
            </template>

            <a-table
              :dataSource="rows"
              rowKey="id"
              :pagination="{ pageSize: 5 }"
              class="custom-table"
              :loading="loading"
            >
              <a-table-column title="วันที่ทำรายการ" dataIndex="created_at">
                <template #default="{ text }">
                  <span class="date-text">{{
                    dayjs(text).format("DD MMM YYYY")
                  }}</span>
                </template>
              </a-table-column>

              <a-table-column title="รายการสินค้า" dataIndex="note">
                <template #default="{ text }">
                  <span class="note-text">{{ text || "ฟิล์ม/เคส" }}</span>
                </template>
              </a-table-column>

              <a-table-column title="ยอดชำระ" dataIndex="amount" align="right">
                <template #default="{ text }">
                  <span class="amount-text"
                    >฿{{ Number(text).toLocaleString() }}</span
                  >
                </template>
              </a-table-column>

              <a-table-column
                title="แต้มที่ได้รับ"
                dataIndex="points_earned"
                align="right"
              >
                <template #default="{ text }">
                  <div class="points-earned-tag">+{{ text }}</div>
                </template>
              </a-table-column>
            </a-table>

            <a-empty
              v-if="!loading && rows.length === 0"
              description="ไม่พบประวัติการซื้อ"
            />
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>
<style scoped>
.dashboard-wrap {
  min-height: 100vh;
  background: #080101;
  padding: 40px 24px;
  position: relative;
  overflow: hidden;
}

.glow-bg {
  position: absolute;
  top: 0;
  right: 0;
  width: 600px;
  height: 600px;
  background: radial-gradient(
    circle,
    rgba(114, 46, 209, 0.1) 0%,
    transparent 70%
  );
  z-index: 0;
}

.dashboard-content {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* Header */
.header-banner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.welcome-text {
  color: #fff !important;
  margin: 0 !important;
  font-weight: 800 !important;
}

.text-gradient {
  background: linear-gradient(90deg, #b37feb, #1890ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(250, 173, 20, 0.1);
  color: #faad14;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 12px;
  margin-top: 8px;
  border: 1px solid rgba(250, 173, 20, 0.2);
}

/* Premium Points Card */
.points-card-premium {
  background: linear-gradient(135deg, #722ed1 0%, #1890ff 100%);
  border-radius: 24px;
  padding: 32px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  margin-bottom: 24px;
}

.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url("https://www.transparenttextures.com/patterns/carbon-fibre.png");
  opacity: 0.1;
}

.points-card-premium .label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  letter-spacing: 2px;
}

.points-display {
  margin: 16px 0;
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.points-num {
  color: #fff;
  font-size: 48px;
  font-weight: 900;
  line-height: 1;
}

.points-unit {
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
}

.card-footer-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  margin-top: 20px;
}

.chip-icon {
  font-size: 20px;
  color: #fff;
  opacity: 0.8;
}

/* Actions */
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-action-primary {
  height: 56px !important;
  border-radius: 16px !important;
  background: #722ed1 !important;
  border: none !important;
  font-weight: 700 !important;
  box-shadow: 0 10px 20px rgba(114, 46, 209, 0.3) !important;
}

.btn-action-secondary {
  height: 56px !important;
  border-radius: 16px !important;
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
  font-weight: 700 !important;
}

.btn-action-secondary:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: #1890ff !important;
}

/* Table Card */
.table-card {
  background: rgba(15, 23, 42, 0.6) !important;
  backdrop-filter: blur(20px);
  border-radius: 24px !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  color: #fff !important;
}

:deep(.ant-card-head-title) {
  color: #fff !important;
  font-weight: 700;
}

.text-dim {
  color: #64748b;
  font-size: 12px;
}

/* Table Styling */
.custom-table :deep(.ant-table) {
  background: transparent !important;
  color: #fff;
}

.custom-table :deep(.ant-table-thead > tr > th) {
  background: rgba(255, 255, 255, 0.02) !important;
  color: #94a3b8 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
}

.custom-table :deep(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
}

.custom-table :deep(.ant-table-tbody > tr:hover > td) {
  background: rgba(255, 255, 255, 0.02) !important;
}

.date-text {
  color: #94a3b8;
}
.note-text {
  color: #e2e8f0;
  font-weight: 500;
}
.amount-text {
  color: #fff;
  font-weight: 600;
}

.points-earned-tag {
  display: inline-block;
  color: #52c41a;
  background: rgba(82, 196, 26, 0.1);
  padding: 2px 10px;
  border-radius: 6px;
  font-weight: 700;
}

.btn-glass {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #94a3b8 !important;
}

.btn-logout {
  border-radius: 10px !important;
}

@media (max-width: 768px) {
  .header-banner {
    flex-direction: column;
    gap: 20px;
  }
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
