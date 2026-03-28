<script setup>
import dayjs from "dayjs";
import { message, Modal } from "ant-design-vue";
import { DeleteOutlined, EditOutlined, PlusOutlined, AppstoreOutlined } from "@ant-design/icons-vue";

definePageMeta({ layout: "admin" });

const supabase = useSupabase();

const loading = ref(false);
const rows = ref([]);
const q = ref("");

const fetchRewards = async () => {
  try {
    loading.value = true;

    let query = supabase
      .from("rewards")
      .select("id,title,points_cost,stock,is_active,created_at,image_url")
      .order("created_at", { ascending: false })
      .limit(200);

    if (q.value.trim()) query = query.ilike("title", `%${q.value.trim()}%`);

    const { data, error } = await query;
    if (error) throw error;

    rows.value = data || [];
  } catch (e) {
    console.error(e);
    message.error(e?.message || "โหลดของรางวัลไม่สำเร็จ");
  } finally {
    loading.value = false;
  }
};

onMounted(fetchRewards);

const fmtDate = (d) => (d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "-");

// คำนวณสถิติ
const stats = computed(() => ({
  total: rows.value.length,
  active: rows.value.filter(r => r.is_active).length,
  totalStock: rows.value.reduce((sum, r) => sum + (r.stock || 0), 0),
  avgPointsCost: Math.round(rows.value.reduce((sum, r) => sum + (r.points_cost || 0), 0) / (rows.value.length || 1))
}));

const toggleActive = async (record) => {
  try {
    const next = !record.is_active;

    const { error } = await supabase
      .from("rewards")
      .update({ is_active: next })
      .eq("id", record.id);

    if (error) throw error;

    record.is_active = next;
    message.success("อัปเดตสถานะแล้ว");
  } catch (e) {
    console.error(e);
    message.error(e?.message || "อัปเดตสถานะไม่สำเร็จ");
  }
};

const removeReward = async (record) => {
  Modal.confirm({
    title: "ยืนยันลบของรางวัล",
    content: `ต้องการลบ "${record.title}" ใช่ไหม?`,
    okText: "ลบ",
    okType: "danger",
    cancelText: "ยกเลิก",
    async onOk() {
      try {
        const { error } = await supabase
          .from("rewards")
          .delete()
          .eq("id", record.id);
        if (error) throw error;

        rows.value = rows.value.filter((x) => x.id !== record.id);
        message.success("ลบแล้ว");
      } catch (e) {
        console.error(e);
        message.error(e?.message || "ลบไม่สำเร็จ");
      }
    },
  });
};

// ตรวจสอบระดับสต็อก
const getStockStatus = (stock) => {
  if (stock === 0) return { status: "empty", color: "#ff4d4f", label: "หมด", bg: "#fff1f0" };
  if (stock < 5) return { status: "low", color: "#faad14", label: "น้อย", bg: "#fffbe6" };
  return { status: "normal", color: "#52c41a", label: "เพียงพอ", bg: "#f6ffed" };
};
</script>

<template>
  <div class="rewards-container">
    <!-- Hero Header with Gradient -->
    <div class="hero-header">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">🎁 จัดการของรางวัล</h1>
          <p class="hero-subtitle">สร้าง แก้ไข และค้นหาของรางวัลในระบบ</p>
        </div>
        <NuxtLink to="/admin" class="back-link">
          <a-button type="text">← กลับเมนูหลัก</a-button>
        </NuxtLink>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-section">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="12" :md="6">
          <div class="stat-card stat-card-blue">
            <div class="stat-icon">📦</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">ของรางวัลทั้งหมด</div>
            </div>
          </div>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6">
          <div class="stat-card stat-card-green">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.active }}</div>
              <div class="stat-label">ของรางวัลที่ใช้งาน</div>
            </div>
          </div>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6">
          <div class="stat-card stat-card-purple">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalStock }}</div>
              <div class="stat-label">คงเหลือทั้งหมด</div>
            </div>
          </div>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6">
          <div class="stat-card stat-card-orange">
            <div class="stat-icon">💎</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.avgPointsCost }}</div>
              <div class="stat-label">แต้มเฉลี่ยต่อชิ้น</div>
            </div>
          </div>
        </a-col>
      </a-row>
    </div>

    <!-- Toolbar and Controls -->
    <div class="toolbar">
      <div class="search-box">
        <a-input-search
          v-model:value="q"
          placeholder="🔍 ค้นหาชื่อของรางวัล..."
          allowClear
          @pressEnter="fetchRewards"
          class="search-input"
        />
        <a-button @click="fetchRewards" :loading="loading" class="refresh-btn">
          🔄 รีเฟรช
        </a-button>
      </div>

      <div class="view-controls">
        <NuxtLink to="/admin/rewards/new">
          <a-button type="primary" size="large" class="add-btn">
            <PlusOutlined /> เพิ่มของรางวัล
          </a-button>
        </NuxtLink>
      </div>
    </div>

    <!-- Grid View (Cards) -->
    <div class="grid-view">
      <a-spin :spinning="loading">
        <a-empty
          v-if="!loading && rows.length === 0"
          description="ยังไม่มีของรางวัล"
          style="margin-top: 60px; margin-bottom: 60px"
        >
          <template #default>
            <div style="text-align: center">
              <p style="color: #999; margin-bottom: 16px">กด "เพิ่มของรางวัล" เพื่อเริ่มต้น</p>
              <NuxtLink to="/admin/rewards/new">
                <a-button type="primary" size="large">
                  <PlusOutlined /> เพิ่มของรางวัลแรก
                </a-button>
              </NuxtLink>
            </div>
          </template>
        </a-empty>

        <a-row v-else :gutter="[20, 20]" class="rewards-grid">
          <a-col v-for="item in rows" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
            <div class="reward-card" :class="{ 'reward-card-inactive': !item.is_active }">
              <!-- Image Section -->
              <div class="reward-image-container">
                <div v-if="item.image_url" class="reward-image">
                  <img :src="item.image_url" alt="reward" />
                </div>
                <div v-else class="reward-image reward-image-placeholder">
                  <span>🎁</span>
                </div>
                
                <!-- Status Badge -->
                <div class="status-badge" :class="item.is_active ? 'active' : 'inactive'">
                  {{ item.is_active ? "ใช้งาน" : "ปิดใช้" }}
                </div>

                <!-- Stock Status -->
                <div 
                  class="stock-status-badge"
                  :style="{ backgroundColor: getStockStatus(item.stock).bg, borderColor: getStockStatus(item.stock).color }"
                >
                  <span :style="{ color: getStockStatus(item.stock).color }">
                    {{ getStockStatus(item.stock).label }} • {{ item.stock }} ชิ้น
                  </span>
                </div>
              </div>

              <!-- Content Section -->
              <div class="reward-content">
                <h3 class="reward-title">{{ item.title }}</h3>
                
                <div class="reward-meta">
                  <div class="meta-item">
                    <span class="meta-label">แต้ม</span>
                    <span class="meta-value">{{ item.points_cost }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">สร้างเมื่อ</span>
                    <span class="meta-value meta-date">{{ fmtDate(item.created_at).split(" ")[0] }}</span>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="reward-actions">
                  <NuxtLink :to="`/admin/rewards/${item.id}`" style="flex: 1">
                    <a-button type="primary" block>
                      <EditOutlined /> แก้ไข
                    </a-button>
                  </NuxtLink>
                  <a-button danger block @click="removeReward(item)">
                    <DeleteOutlined />
                  </a-button>
                </div>

                <!-- Toggle Active -->
                <div class="toggle-section">
                  <span class="toggle-label">สถานะ:</span>
                  <a-switch
                    :checked="item.is_active"
                    @change="() => toggleActive(item)"
                    class="status-toggle"
                  />
                </div>
              </div>
            </div>
          </a-col>
        </a-row>
      </a-spin>
    </div>
  </div>
</template>

<style scoped lang="css">
.rewards-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fb 0%, #f0f2f5 100%);
}

/* Hero Header */
.hero-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 24px;
  border-radius: 0 0 24px 24px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.hero-text {
  flex: 1;
  min-width: 300px;
}

.hero-title {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
}

.hero-subtitle {
  margin: 8px 0 0 0;
  font-size: 16px;
  opacity: 0.9;
}

.back-link :deep() .ant-btn {
  color: white;
}

.back-link :deep() .ant-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* Statistics Section */
.stats-section {
  padding: 24px;
  max-width: 1400px;
  margin: -30px auto 0;
  position: relative;
  z-index: 10;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-radius: 16px;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: default;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  font-size: 32px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #8c8c8c;
}

.stat-card-blue {
  border-left: 4px solid #1890ff;
}

.stat-card-green {
  border-left: 4px solid #52c41a;
}

.stat-card-purple {
  border-left: 4px solid #722ed1;
}

.stat-card-orange {
  border-left: 4px solid #fa8c16;
}

/* Toolbar */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: white;
  margin: 24px 24px 0 24px;
  border-radius: 12px 12px 0 0;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  gap: 8px;
  flex: 1;
  min-width: 300px;
}

.search-input {
  min-width: 300px;
}

.search-input :deep() .ant-input {
  border-radius: 8px;
  padding: 8px 12px;
}

.refresh-btn {
  border-radius: 8px;
}

.view-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.add-btn {
  border-radius: 8px;
  padding: 0 24px;
}

/* Grid View */
.grid-view {
  padding: 0 24px 24px 24px;
}

.rewards-grid {
  background: white;
  border-radius: 0 0 12px 12px;
  padding: 24px;
  margin: 0;
}

.reward-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.reward-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.reward-card-inactive {
  opacity: 0.7;
}

.reward-image-container {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f7fb 0%, #f0f2f5 100%);
}

.reward-image {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.reward-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.reward-card:hover .reward-image img {
  transform: scale(1.08);
}

.reward-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  background: linear-gradient(135deg, #ede7f6 0%, #f3e5f5 100%);
}

.status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 5;
}

.status-badge.active {
  background-color: #f6ffed;
  color: #52c41a;
  border: 1px solid #52c41a;
}

.status-badge.inactive {
  background-color: #fff1f0;
  color: #ff4d4f;
  border: 1px solid #ff4d4f;
}

.stock-status-badge {
  position: absolute;
  bottom: 12px;
  left: 12px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1.5px solid;
  z-index: 5;
}

.reward-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.reward-title {
  font-size: 16px;
  font-weight: 700;
  color: #262626;
  margin: 0 0 12px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 36px;
}

.reward-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.meta-value {
  font-size: 14px;
  font-weight: 700;
  color: #262626;
}

.meta-date {
  color: #595959;
  font-weight: 500;
}

.reward-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.reward-actions :deep() a {
  flex: 1;
}

.reward-actions :deep() .ant-btn {
  border-radius: 6px;
  height: 32px;
  font-weight: 600;
  font-size: 13px;
}

.reward-actions :deep() .ant-btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.toggle-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.toggle-label {
  font-size: 13px;
  font-weight: 600;
  color: #8c8c8c;
}

.status-toggle :deep() .ant-switch {
  min-width: 44px;
}

/* Table View */
.table-view {
  padding: 0 24px 24px 24px;
  min-height: 500px;
}

.table-card {
  border-radius: 12px;
  background: white;
  min-height: 400px;
}

.table-card :deep() .ant-card-body {
  padding: 16px;
}

.table-card :deep() .ant-table {
  background: white;
}

.table-card :deep() .ant-table-wrapper {
  background: white;
}

.table-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.table-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.table-image-placeholder {
  font-size: 28px;
  line-height: 1;
}

.stock-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid;
  white-space: nowrap;
}

/* Responsive */
@media (max-width: 1024px) {
  .rewards-grid {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .hero-header {
    padding: 24px 16px;
  }

  .hero-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .hero-title {
    font-size: 24px;
  }

  .hero-subtitle {
    font-size: 14px;
  }

  .stats-section {
    padding: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-icon {
    font-size: 24px;
  }

  .stat-value {
    font-size: 22px;
  }

  .stat-label {
    font-size: 12px;
  }

  .toolbar {
    padding: 12px;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .search-box {
    width: 100%;
    flex-direction: column;
  }

  .search-input {
    width: 100%;
  }

  .refresh-btn {
    width: 100%;
  }

  .view-controls {
    width: 100%;
    justify-content: space-between;
  }

  .add-btn {
    width: 100%;
  }

  .rewards-grid {
    padding: 12px;
  }

  .reward-card {
    flex-direction: row;
  }

  .reward-image-container {
    width: 100px;
    height: 100px;
    min-width: 100px;
    border-radius: 8px 0 0 8px;
  }

  .reward-content {
    padding: 12px;
  }

  .reward-title {
    font-size: 14px;
    margin-bottom: 8px;
  }

  .reward-meta {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 8px;
    padding-bottom: 8px;
  }

  .meta-label {
    font-size: 10px;
  }

  .meta-value {
    font-size: 12px;
  }

  .reward-actions {
    gap: 6px;
    margin-bottom: 8px;
  }

  .reward-actions :deep() .ant-btn {
    height: 28px;
    font-size: 12px;
  }

  .toggle-section {
    padding-top: 8px;
    border-top: 1px solid #f0f0f0;
  }

  .toggle-label {
    font-size: 11px;
  }

  .grid-view {
    padding: 0 12px 16px 12px;
  }
}

@media (max-width: 640px) {
  .hero-header {
    padding: 20px 12px;
  }

  .hero-title {
    font-size: 22px;
  }

  .hero-subtitle {
    font-size: 13px;
    margin: 4px 0 0 0;
  }

  .back-link :deep() .ant-btn {
    font-size: 12px;
    padding: 4px 12px;
  }

  .stats-section {
    margin: -20px auto 0;
    padding: 8px;
  }

  .stat-card {
    padding: 12px;
    gap: 12px;
  }

  .stat-icon {
    font-size: 20px;
  }

  .stat-content {
    flex: 1;
  }

  .stat-value {
    font-size: 18px;
    margin-bottom: 2px;
  }

  .stat-label {
    font-size: 11px;
  }

  .toolbar {
    padding: 10px;
    margin: 12px 12px 0 12px;
    border-radius: 8px 8px 0 0;
  }

  .search-box {
    gap: 6px;
  }

  .search-input :deep() .ant-input {
    padding: 6px 10px;
    font-size: 13px;
  }

  .refresh-btn {
    padding: 4px 12px;
    font-size: 12px;
  }

  .add-btn {
    padding: 0 16px;
    height: 36px;
    font-size: 12px;
  }

  .add-btn :deep() .ant-btn {
    line-height: 36px;
  }

  .rewards-grid {
    gap: 12px;
    padding: 12px;
    border-radius: 0 0 8px 8px;
  }

  .reward-card {
    border-radius: 8px;
  }

  .reward-image-container {
    width: 80px;
    height: 80px;
  }

  .reward-image-placeholder {
    font-size: 36px;
  }

  .status-badge {
    top: 8px;
    right: 8px;
    padding: 3px 8px;
    font-size: 10px;
  }

  .stock-status-badge {
    bottom: 8px;
    left: 8px;
    padding: 4px 8px;
    font-size: 10px;
  }

  .stock-status-badge span {
    font-size: 10px;
  }

  .reward-content {
    padding: 10px;
  }

  .reward-title {
    font-size: 13px;
    margin-bottom: 6px;
    min-height: 26px;
  }

  .reward-meta {
    margin-bottom: 6px;
    padding-bottom: 6px;
    gap: 6px;
  }

  .meta-label {
    font-size: 9px;
  }

  .meta-value {
    font-size: 11px;
  }

  .reward-actions {
    flex-direction: column;
    gap: 4px;
    margin-bottom: 6px;
  }

  .reward-actions :deep() a {
    flex: 1;
  }

  .reward-actions :deep() .ant-btn {
    height: 26px;
    font-size: 11px;
    padding: 0 8px;
  }

  .toggle-section {
    padding-top: 6px;
  }

  .toggle-label {
    font-size: 10px;
  }

  .status-toggle :deep() .ant-switch {
    min-width: 38px;
  }

  .grid-view {
    padding: 0 12px 12px 12px;
  }
}

@media (max-width: 480px) {
  .rewards-container {
    min-height: 100vh;
  }

  .hero-header {
    padding: 16px 10px;
    border-radius: 0 0 16px 16px;
  }

  .hero-content {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    max-width: 100%;
  }

  .hero-text {
    min-width: 0;
  }

  .hero-title {
    font-size: 20px;
    line-height: 1.1;
  }

  .hero-subtitle {
    font-size: 12px;
    margin: 2px 0 0 0;
  }

  .back-link {
    width: 100%;
  }

  .back-link :deep() .ant-btn {
    width: 100%;
    text-align: center;
    font-size: 12px;
    padding: 4px;
  }

  .stats-section {
    margin: -16px auto 0;
    padding: 6px;
  }

  .stat-card {
    padding: 10px;
    gap: 10px;
  }

  .stat-icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  .stat-value {
    font-size: 16px;
    margin-bottom: 0;
  }

  .stat-label {
    font-size: 10px;
    line-height: 1.2;
  }

  .toolbar {
    padding: 8px;
    margin: 8px 10px 0 10px;
    border-radius: 6px 6px 0 0;
    gap: 8px;
  }

  .search-box {
    flex-direction: column;
    gap: 6px;
    min-width: auto;
  }

  .search-input {
    min-width: auto;
  }

  .search-input :deep() .ant-input {
    padding: 6px 8px;
    font-size: 12px;
  }

  .refresh-btn {
    width: 100%;
    padding: 6px;
    font-size: 11px;
  }

  .view-controls {
    width: 100%;
    gap: 8px;
  }

  .add-btn {
    width: 100%;
    padding: 0;
    height: 34px;
    font-size: 11px;
  }

  .add-btn :deep() .ant-btn {
    height: 34px;
    line-height: 34px;
  }

  .grid-view {
    padding: 0 10px 10px 10px;
  }

  .rewards-grid {
    gap: 10px;
    padding: 10px;
    border-radius: 0 0 6px 6px;
  }

  .reward-card {
    border-radius: 8px;
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.08);
  }

  .reward-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  .reward-image-container {
    width: 70px;
    height: 70px;
    min-width: 70px;
  }

  .reward-image-placeholder {
    font-size: 32px;
  }

  .status-badge {
    top: 6px;
    right: 6px;
    padding: 2px 6px;
    font-size: 9px;
    border-radius: 12px;
  }

  .stock-status-badge {
    bottom: 6px;
    left: 6px;
    padding: 3px 6px;
    font-size: 9px;
    border-radius: 6px;
  }

  .stock-status-badge span {
    font-size: 9px;
  }

  .reward-content {
    padding: 8px;
  }

  .reward-title {
    font-size: 12px;
    margin-bottom: 4px;
    min-height: 24px;
    -webkit-line-clamp: 1;
  }

  .reward-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 4px;
    padding-bottom: 4px;
  }

  .meta-item {
    display: flex;
    justify-content: space-between;
    gap: 4px;
  }

  .meta-label {
    font-size: 8px;
    flex-shrink: 0;
  }

  .meta-value {
    font-size: 10px;
    text-align: right;
  }

  .reward-actions {
    flex-direction: column;
    gap: 4px;
    margin-bottom: 4px;
  }

  .reward-actions :deep() .ant-btn {
    height: 24px;
    font-size: 10px;
    padding: 0 6px;
    white-space: nowrap;
  }

  .toggle-section {
    padding-top: 4px;
    gap: 8px;
  }

  .toggle-label {
    font-size: 9px;
    flex-shrink: 0;
  }

  .status-toggle :deep() .ant-switch {
    min-width: 36px;
  }
}

@media (max-width: 360px) {
  .hero-title {
    font-size: 18px;
  }

  .hero-subtitle {
    font-size: 11px;
  }

  .stat-card {
    padding: 8px;
  }

  .stat-value {
    font-size: 14px;
  }

  .stat-label {
    font-size: 9px;
  }

  .search-input :deep() .ant-input {
    font-size: 11px;
  }

  .reward-title {
    font-size: 11px;
  }

  .meta-label {
    font-size: 7px;
  }

  .meta-value {
    font-size: 9px;
  }

  .reward-actions :deep() .ant-btn {
    font-size: 9px;
    height: 22px;
  }
}
</style>
