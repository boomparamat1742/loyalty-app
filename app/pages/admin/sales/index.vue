<script setup>
import dayjs from "dayjs";
import { message } from "ant-design-vue";
import { ReloadOutlined, PlusOutlined } from "@ant-design/icons-vue";

definePageMeta({ layout: "admin" });

const supabase = useSupabase();

const tab = ref("daily"); // daily | monthly | yearly | custom
const loading = ref(false);
const rows = ref([]);

// ✅ custom range state (ค่าเริ่มต้น = วันนี้)
const customRange = ref([dayjs().startOf("day"), dayjs().endOf("day")]);

// ช่วงเวลา filter (ไม่ group)
const range = computed(() => {
  const now = dayjs();

  if (tab.value === "daily") {
    return {
      from: now.startOf("day").toISOString(),
      to: now.endOf("day").toISOString(),
      label: now.format("DD/MM/YYYY"),
    };
  }

  if (tab.value === "monthly") {
    return {
      from: now.startOf("month").toISOString(),
      to: now.endOf("month").toISOString(),
      label: now.format("MM/YYYY"),
    };
  }

  if (tab.value === "yearly") {
    return {
      from: now.startOf("year").toISOString(),
      to: now.endOf("year").toISOString(),
      label: now.format("YYYY"),
    };
  }

  // ✅ custom (ระหว่างวันที่)
  const [start, end] = customRange.value || [];
  return {
    from: (start || now).startOf("day").toISOString(),
    to: (end || now).endOf("day").toISOString(),
    label:
      start && end
        ? `${start.format("DD/MM/YYYY")} - ${end.format("DD/MM/YYYY")}`
        : "-",
  };
});

const fmtDateTime = (d) => (d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "-");

const fetchData = async () => {
  try {
    loading.value = true;

    const { data, error } = await supabase
      .from("sales")
      .select("id, amount, points_earned, note, created_at")
      .gte("created_at", range.value.from)
      .lte("created_at", range.value.to)
      .order("created_at", { ascending: true })
      .limit(500);

    if (error) throw error;
    rows.value = data || [];
  } catch (e) {
    console.error(e);
    message.error(e?.message || "โหลดข้อมูลยอดขายไม่สำเร็จ");
  } finally {
    loading.value = false;
  }
};

// ✅ เปลี่ยน tab แล้วดึงใหม่
watch(tab, fetchData, { immediate: true });

// ✅ เปลี่ยน customRange แล้วดึงใหม่ เฉพาะตอนเลือก custom
watch(customRange, () => {
  if (tab.value === "custom") fetchData();
});

// KPI จากรายการจริง (ไม่ group)
const kpiAmount = computed(() =>
  rows.value.reduce((s, r) => s + Number(r.amount || 0), 0),
);
const kpiOrders = computed(() => rows.value.length);
const kpiPoints = computed(() =>
  rows.value.reduce((s, r) => s + Number(r.points_earned || 0), 0),
);
const kpiAvgOrder = computed(() =>
  kpiOrders.value ? kpiAmount.value / kpiOrders.value : 0,
);

// กราฟจากรายการจริง (X=เวลา, Y=ยอดขาย)
const chartOption = computed(() => {
  const x = rows.value.map((r) => dayjs(r.created_at).format("DD/MM HH:mm"));
  const y = rows.value.map((r) => Number(r.amount || 0));

  return {
    title: { text: `กราฟยอดขาย (รายการ) - ${range.value.label}` },
    tooltip: { trigger: "axis" },
    grid: { left: 44, right: 18, top: 54, bottom: 44 },
    xAxis: { type: "category", data: x, axisLabel: { rotate: 30 } },
    yAxis: { type: "value" },
    series: [{ type: "line", data: y, smooth: true }],
  };
});

// ✅ helper: สลับไป custom เมื่อเลือกช่วง
const onPickRange = (vals) => {
  // vals = [dayjs, dayjs] หรือ null
  if (!vals || !vals[0] || !vals[1]) return;
  tab.value = "custom";
};
</script>

<template>
  <div class="dashboard-container">
    <div class="dashboard-topbar">
      <div>
        <a-typography-title :level="3" class="title">ยอดขาย</a-typography-title>
        <div class="subtitle">แดชบอร์ดสรุปยอดขาย และตัวชี้วัดสำคัญ</div>
      </div>

      <a-space>
        <NuxtLink to="/admin">
          <a-button type="primary">กลับเมนูหลัก</a-button>
        </NuxtLink>
        <a-button @click="fetchData" :loading="loading">Refresh</a-button>
      </a-space>
    </div>

    <a-space class="dashboard-filters" wrap>
      <a-segmented
        v-model:value="tab"
        :options="[
          { label: 'รายวัน (วันนี้)', value: 'daily' },
          { label: 'รายเดือน (เดือนนี้)', value: 'monthly' },
          { label: 'รายปี (ปีนี้)', value: 'yearly' },
          { label: 'ระหว่างวันที่', value: 'custom' },
        ]"
      />

      <a-space>
        <a-range-picker
          v-model:value="customRange"
          format="DD/MM/YYYY"
          @change="onPickRange"
          :allowClear="false"
        />
      </a-space>
<!-- 
      <NuxtLink to="/admin/sales/new">
        <a-button type="primary">+ เพิ่มยอดขาย</a-button>
      </NuxtLink> -->
    </a-space>

    <a-card class="dashboard-summary-card">
      <div class="summary-content">
        <div class="summary-header">
          <div class="summary-badge">📊</div>
          <div>
            <a-typography-title :level="2" class="summary-title">Sales Dashboard</a-typography-title>
            <a-typography-text type="secondary" class="summary-subtitle">
              📅 {{ range.label }} • 📦 {{ kpiOrders.toLocaleString() }} รายการ
            </a-typography-text>
          </div>
        </div>
        <div class="summary-divider"></div>
        <a-space class="summary-actions">
          <a-button type="default" @click="fetchData" :loading="loading" class="refresh-btn">
            <template #icon><ReloadOutlined /></template>
            Refresh
          </a-button>
          <NuxtLink to="/admin/sales/new">
            <a-button type="primary" class="add-btn">
              <template #icon><PlusOutlined /></template>
              เพิ่มยอดขาย
            </a-button>
          </NuxtLink>
        </a-space>
      </div>
    </a-card>

    <a-row :gutter="[12, 12]" class="kpi-row">
      <a-col :xs="24" :sm="12" :md="6">
        <a-card class="kpi-card" :loading="loading">
          <div class="kpi-label">ยอดขายรวม</div>
          <div class="kpi-value">{{ kpiAmount.toLocaleString() }}</div>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :md="6">
        <a-card class="kpi-card" :loading="loading">
          <div class="kpi-label">จำนวนบิล</div>
          <div class="kpi-value">{{ kpiOrders.toLocaleString() }}</div>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :md="6">
        <a-card class="kpi-card" :loading="loading">
          <div class="kpi-label">แต้มรวมที่ให้</div>
          <div class="kpi-value">{{ kpiPoints.toLocaleString() }}</div>
        </a-card>
      </a-col>

      <a-col :xs="24" :sm="12" :md="6">
        <a-card class="kpi-card" :loading="loading">
          <div class="kpi-label">เฉลี่ยต่อบิล</div>
          <div class="kpi-value">{{ kpiAvgOrder.toFixed(2).toLocaleString() }}</div>
        </a-card>
      </a-col>
    </a-row>

    <a-card class="chart-card" :loading="loading">
      <VChart :option="chartOption" class="chart-widget" />
    </a-card>

    <a-card
      class="table-card"
      :loading="loading"
      title="รายการยอดขาย (ไม่รวมกลุ่ม)"
    >
      <a-table :dataSource="rows" rowKey="id" :pagination="{ pageSize: 10 }">
        <a-table-column
          title="เวลา"
          :customRender="({ record }) => fmtDateTime(record.created_at)"
        />
        <a-table-column title="ยอดขาย (บาท)" dataIndex="amount" />
        <a-table-column title="แต้มที่ให้" dataIndex="points_earned" />
        <a-table-column title="หมายเหตุ" dataIndex="note" />
      </a-table>

      <a-empty
        v-if="!loading && rows.length === 0"
        description="ยังไม่มีข้อมูลยอดขายในช่วงนี้"
        style="margin-top: 12px"
      />
    </a-card>
  </div>
</template>

<style scoped>
.dashboard-container {
  padding: 24px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  min-height: 100vh;
}

.dashboard-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 24px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.dashboard-topbar .title {
  margin: 0;
  color: #e0e7ff;
  font-weight: 700;
}

.dashboard-topbar .subtitle {
  color: #94a3b8;
  font-size: 0.9rem;
  margin: 6px 0 0;
  font-weight: 500;
}

.dashboard-filters {
  margin: 0 0 24px 0;
  width: 100%;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 20px;
  padding: 16px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.dashboard-summary-card {
  border-radius: 20px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 247, 251, 0.95) 100%);
  border: 2px solid rgba(102, 126, 234, 0.15);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.dashboard-summary-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.summary-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  padding: 4px 0;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.summary-badge {
  font-size: 36px;
  line-height: 1;
}

.summary-title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.summary-subtitle {
  font-size: 0.95rem;
  color: #667eea;
  font-weight: 600;
  margin-top: 6px;
  letter-spacing: 0.3px;
}

.summary-divider {
  width: 2px;
  height: 50px;
  background: linear-gradient(180deg, rgba(102, 126, 234, 0) 0%, rgba(102, 126, 234, 0.3) 50%, rgba(102, 126, 234, 0) 100%);
}

.summary-actions {
  display: flex;
  gap: 12px;
}

.refresh-btn,
.add-btn {
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.refresh-btn {
  border: 2px solid rgba(102, 126, 234, 0.2);
  color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.refresh-btn:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.15);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
}

.add-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.add-btn:hover {
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  transform: translateY(-2px);
}

.kpi-card {
  border-radius: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  background: white;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.kpi-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px 0 0 20px;
}

.kpi-card:nth-child(1)::before {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.kpi-card:nth-child(2)::before {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.kpi-card:nth-child(3)::before {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.kpi-card:nth-child(4)::before {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.kpi-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border-color: rgba(102, 126, 234, 0.1);
}

.kpi-label {
  opacity: 0.65;
  margin-bottom: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #8c93a5;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kpi-value {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.chart-card,
.table-card {
  border-radius: 20px;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.chart-widget {
  height: 380px;
  width: 100%;
}

.a-table {
  border-radius: 16px;
}

.kpi-row {
  margin-bottom: 12px;
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 12px;
    min-height: auto;
  }

  .dashboard-topbar {
    flex-direction: column;
    align-items: flex-start;
    padding: 16px;
    gap: 12px;
    margin-bottom: 16px;
  }

  .dashboard-topbar .title {
    font-size: 20px;
  }

  .dashboard-topbar .subtitle {
    font-size: 0.8rem;
  }

  .dashboard-filters {
    padding: 12px;
    gap: 8px;
    margin-bottom: 16px;
  }

  .dashboard-summary-card {
    margin-bottom: 16px;
  }

  .summary-content {
    flex-direction: column;
    gap: 12px;
    padding: 12px 0;
  }

  .summary-header {
    gap: 12px;
    width: 100%;
  }

  .summary-badge {
    font-size: 28px;
  }

  .summary-title {
    font-size: 20px;
  }

  .summary-subtitle {
    font-size: 0.8rem;
  }

  .summary-divider {
    display: none;
  }

  .summary-actions {
    width: 100%;
    flex-direction: column;
  }

  .refresh-btn,
  .add-btn {
    width: 100%;
  }

  .kpi-value {
    font-size: 20px;
  }

  .kpi-label {
    font-size: 0.75rem;
    margin-bottom: 8px;
  }

  .chart-card,
  .table-card {
    margin-bottom: 16px;
    border-radius: 16px;
  }

  .chart-widget {
    height: 280px;
  }
}

@media (max-width: 600px) {
  .dashboard-container {
    padding: 8px;
  }

  .dashboard-topbar {
    padding: 12px;
    margin-bottom: 12px;
  }

  .dashboard-filters {
    padding: 10px;
    flex-direction: column;
    align-items: stretch;
  }

  .dashboard-filters :deep(.ant-space) {
    width: 100%;
  }

  .dashboard-filters :deep(.ant-segmented) {
    width: 100%;
  }

  .dashboard-summary-card {
    margin-bottom: 12px;
  }

  .summary-title {
    font-size: 18px;
  }

  .summary-subtitle {
    font-size: 0.75rem;
  }

  .refresh-btn,
  .add-btn {
    font-size: 0.85rem;
    padding: 6px 12px;
  }

  .kpi-value {
    font-size: 18px;
  }

  .kpi-label {
    font-size: 0.7rem;
  }

  .kpi-card {
    border-radius: 16px;
  }

  .chart-widget {
    height: 240px;
  }

  .a-table {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .dashboard-container {
    padding: 6px;
  }

  .dashboard-topbar {
    padding: 10px;
  }

  .dashboard-topbar .title {
    font-size: 18px;
  }

  .dashboard-filters {
    padding: 8px;
    gap: 6px;
  }

  .summary-title {
    font-size: 16px;
  }

  .summary-badge {
    font-size: 24px;
  }

  .summary-subtitle {
    font-size: 0.7rem;
  }

  .kpi-value {
    font-size: 16px;
  }

  .kpi-label {
    font-size: 0.65rem;
    margin-bottom: 6px;
  }

  .kpi-card::before {
    width: 3px;
  }

  .chart-widget {
    height: 200px;
  }

  .a-table {
    font-size: 0.75rem;
  }

  .refresh-btn,
  .add-btn {
    font-size: 0.75rem;
  }
}
</style>
