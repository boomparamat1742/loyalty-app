<script setup>
import dayjs from "dayjs";
import {
  ReloadOutlined,
  PlusOutlined,
  WalletOutlined,
  FileTextOutlined,
  CrownOutlined,
  CalculatorOutlined,
} from "@ant-design/icons-vue";

definePageMeta({ layout: "admin" });

const supabase = useSupabase();
const { message } = useUi();

const tab = ref("daily"); // daily | monthly | yearly | custom
const loading = ref(false);
const rows = ref([]);

// custom range state (ค่าเริ่มต้น = วันนี้)
const customRange = ref([dayjs().startOf("day"), dayjs().endOf("day")]);

// ช่วงเวลา filter (ไม่ group)
const range = computed(() => {
  const now = dayjs();

  if (tab.value === "daily") {
    return {
      from: now.startOf("day").toISOString(),
      to: now.endOf("day").toISOString(),
      label: now.format("D MMMM YYYY"),
    };
  }

  if (tab.value === "monthly") {
    return {
      from: now.startOf("month").toISOString(),
      to: now.endOf("month").toISOString(),
      label: now.format("MMMM YYYY"),
    };
  }

  if (tab.value === "yearly") {
    return {
      from: now.startOf("year").toISOString(),
      to: now.endOf("year").toISOString(),
      label: now.format("YYYY"),
    };
  }

  const [start, end] = customRange.value || [];
  return {
    from: (start || now).startOf("day").toISOString(),
    to: (end || now).endOf("day").toISOString(),
    label:
      start && end
        ? `${start.format("D MMM YYYY")} – ${end.format("D MMM YYYY")}`
        : "-",
  };
});

const fmtDateTime = (d) => (d ? dayjs(d).format("D MMM YYYY · HH:mm") : "-");
const fmtTHB = (v) => `฿${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const fetchData = async () => {
  try {
    loading.value = true;

    const { data, error } = await supabase
      .from("sales")
      .select("id, amount, points_earned, note, customer_email, created_at")
      .gte("created_at", range.value.from)
      .lte("created_at", range.value.to)
      .order("created_at", { ascending: true })
      .limit(1000);

    if (error) throw error;
    rows.value = data || [];
  } catch (e) {
    console.error(e);
    message.error(e?.message || "โหลดข้อมูลยอดขายไม่สำเร็จ");
  } finally {
    loading.value = false;
  }
};

watch(tab, fetchData, { immediate: true });

watch(customRange, () => {
  if (tab.value === "custom") fetchData();
});

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
  const x = rows.value.map((r) => dayjs(r.created_at).format("D MMM HH:mm"));
  const y = rows.value.map((r) => Number(r.amount || 0));
  const axisText = "#8478a6";

  return {
    backgroundColor: "transparent",
    textStyle: { fontFamily: "IBM Plex Sans Thai, sans-serif" },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#1c1433",
      borderColor: "rgba(196,167,255,0.24)",
      textStyle: { color: "#f3eeff" },
      valueFormatter: (v) => fmtTHB(v),
    },
    grid: { left: 56, right: 20, top: 24, bottom: 44 },
    xAxis: {
      type: "category",
      data: x,
      axisLine: { lineStyle: { color: "rgba(196,167,255,0.18)" } },
      axisLabel: { color: axisText, hideOverlap: true },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: axisText },
      splitLine: { lineStyle: { color: "rgba(196,167,255,0.08)" } },
    },
    series: [
      {
        type: "line",
        name: "ยอดขาย",
        data: y,
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 2.5, color: "#a78bfa" },
        itemStyle: { color: "#c4b5fd", borderColor: "#7c3aed" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(139,92,246,0.35)" },
              { offset: 1, color: "rgba(139,92,246,0)" },
            ],
          },
        },
      },
    ],
  };
});

const columns = [
  { title: "เวลา", key: "created_at", width: 190 },
  { title: "ลูกค้า", key: "customer" },
  { title: "รายการ", key: "note" },
  { title: "ยอดขาย", key: "amount", align: "right" },
  { title: "แต้ม", key: "points", align: "right", width: 100 },
];

const tableRows = computed(() => [...rows.value].reverse());

// มือถือ: แสดงเป็นการ์ดทีละ 20 รายการ
const isMobile = useIsMobile();
const mobileLimit = ref(20);
watch(rows, () => (mobileLimit.value = 20));

const onPickRange = (vals) => {
  if (!vals || !vals[0] || !vals[1]) return;
  tab.value = "custom";
};
</script>

<template>
  <div class="page">
    <PageHeader eyebrow="Sales" title="ยอดขาย" :subtitle="`สรุปยอดขายและแต้มที่ให้ · ${range.label}`">
      <template #actions>
        <a-button :loading="loading" @click="fetchData">
          <template #icon><ReloadOutlined /></template> รีเฟรช
        </a-button>
        <NuxtLink to="/admin/sales/new">
          <a-button type="primary"><template #icon><PlusOutlined /></template> บันทึกยอดขาย</a-button>
        </NuxtLink>
      </template>
    </PageHeader>

    <div class="filters">
      <a-segmented
        v-model:value="tab"
        :options="[
          { label: 'วันนี้', value: 'daily' },
          { label: 'เดือนนี้', value: 'monthly' },
          { label: 'ปีนี้', value: 'yearly' },
          { label: 'กำหนดเอง', value: 'custom' },
        ]"
      />
      <a-range-picker
        v-model:value="customRange"
        format="DD/MM/YYYY"
        :allowClear="false"
        @change="onPickRange"
      />
    </div>

    <div class="stats">
      <StatCard label="ยอดขายรวม" :value="fmtTHB(kpiAmount)" :loading="loading" accent="cyan">
        <template #icon><WalletOutlined /></template>
      </StatCard>
      <StatCard label="จำนวนบิล" :value="kpiOrders.toLocaleString()" :loading="loading">
        <template #icon><FileTextOutlined /></template>
      </StatCard>
      <StatCard label="แต้มที่ให้" :value="kpiPoints.toLocaleString()" :loading="loading">
        <template #icon><CrownOutlined /></template>
      </StatCard>
      <StatCard label="เฉลี่ยต่อบิล" :value="fmtTHB(kpiAvgOrder)" :loading="loading">
        <template #icon><CalculatorOutlined /></template>
      </StatCard>
    </div>

    <section class="surface">
      <div class="surface-header">
        <h2 class="surface-title">แนวโน้มยอดขาย</h2>
        <span class="subtle">{{ range.label }}</span>
      </div>
      <div class="chart-wrap">
        <a-spin :spinning="loading">
          <VChart v-if="rows.length" :option="chartOption" class="chart" autoresize />
          <div v-else class="empty-block">ยังไม่มียอดขายในช่วงนี้</div>
        </a-spin>
      </div>
    </section>

    <section class="surface">
      <div class="surface-header">
        <h2 class="surface-title">รายการยอดขาย</h2>
        <span class="subtle num">{{ kpiOrders.toLocaleString() }} รายการ</span>
      </div>
      <a-spin v-if="isMobile" :spinning="loading">
        <ul v-if="tableRows.length" class="m-list">
          <li v-for="r in tableRows.slice(0, mobileLimit)" :key="r.id" class="m-item">
            <div class="m-head">
              <span class="m-title">{{ r.customer_email || "-" }}</span>
              <span class="num">{{ fmtTHB(r.amount) }}</span>
            </div>
            <div class="m-meta">
              <span>{{ fmtDateTime(r.created_at) }}</span>
              <span v-if="r.note">{{ r.note }}</span>
              <span class="points-plus">+{{ r.points_earned }} แต้ม</span>
            </div>
          </li>
        </ul>
        <div v-else-if="!loading" class="empty-block">ยังไม่มีข้อมูลยอดขายในช่วงนี้</div>
        <div v-if="tableRows.length > mobileLimit" class="m-more">
          <a-button block @click="mobileLimit += 20">ดูเพิ่ม ({{ tableRows.length - mobileLimit }} รายการ)</a-button>
        </div>
      </a-spin>
      <a-table
        v-else
        :dataSource="tableRows"
        :columns="columns"
        rowKey="id"
        :loading="loading"
        :pagination="{ pageSize: 10, hideOnSinglePage: true }"
        :scroll="{ x: 720 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'created_at'">
            <span class="muted">{{ fmtDateTime(record.created_at) }}</span>
          </template>
          <template v-else-if="column.key === 'customer'">
            {{ record.customer_email || "-" }}
          </template>
          <template v-else-if="column.key === 'note'">
            <span class="muted">{{ record.note || "-" }}</span>
          </template>
          <template v-else-if="column.key === 'amount'">
            <span class="num">{{ fmtTHB(record.amount) }}</span>
          </template>
          <template v-else-if="column.key === 'points'">
            <span class="points-plus">+{{ record.points_earned }}</span>
          </template>
        </template>
        <template #emptyText>
          <div class="empty-block">ยังไม่มีข้อมูลยอดขายในช่วงนี้</div>
        </template>
      </a-table>
    </section>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.chart-wrap {
  padding: 8px 12px 12px;
}
.chart {
  height: 340px;
  width: 100%;
}

@media (max-width: 1180px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 520px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .chart {
    height: 260px;
  }
}
</style>
