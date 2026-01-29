<script setup>
import dayjs from "dayjs";
import { message } from "ant-design-vue";

definePageMeta({ layout: "admin" });

const supabase = useSupabase();

const tab = ref("daily"); // daily | monthly | yearly
const loading = ref(false);
const rows = ref([]);

// ช่วงเวลา filter (ไม่ group)
const range = computed(() => {
  const now = dayjs();

  if (tab.value === "daily") {
    // วันนี้
    return {
      from: now.startOf("day").toISOString(),
      to: now.endOf("day").toISOString(),
      label: now.format("DD/MM/YYYY"),
    };
  }

  if (tab.value === "monthly") {
    // เดือนนี้
    return {
      from: now.startOf("month").toISOString(),
      to: now.endOf("month").toISOString(),
      label: now.format("MM/YYYY"),
    };
  }

  // ปีนี้
  return {
    from: now.startOf("year").toISOString(),
    to: now.endOf("year").toISOString(),
    label: now.format("YYYY"),
  };
});

const fmtDateTime = (d) => (d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "-");

const fetchData = async () => {
  try {
    loading.value = true;

    // ✅ ดึงจาก sales แบบไม่ group
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

watch(tab, fetchData, { immediate: true });

// KPI จากรายการจริง (ไม่ group)
const kpiAmount = computed(() =>
  rows.value.reduce((s, r) => s + Number(r.amount || 0), 0)
);
const kpiOrders = computed(() => rows.value.length);
const kpiPoints = computed(() =>
  rows.value.reduce((s, r) => s + Number(r.points_earned || 0), 0)
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
</script>

<template>
  <div style="padding: 24px">
    <div
      style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      "
    >
      <a-typography-title :level="3" style="margin: 0">ยอดขาย</a-typography-title>

      <a-space>
        <a-button @click="fetchData" :loading="loading">Refresh</a-button>
      </a-space>
    </div>

    <a-space style="margin: 12px 0" wrap>
      <a-segmented
        v-model:value="tab"
        :options="[
          { label: 'รายวัน (วันนี้)', value: 'daily' },
          { label: 'รายเดือน (เดือนนี้)', value: 'monthly' },
          { label: 'รายปี (ปีนี้)', value: 'yearly' },
        ]"
      />
      <NuxtLink to="/admin/sales/new">
        <a-button type="primary">+ เพิ่มยอดขาย</a-button>
      </NuxtLink>
    </a-space>

    <a-alert
      show-icon
      type="info"
      :message="`ช่วงที่แสดง: ${range.label} | จำนวนรายการ: ${kpiOrders}`"
      style="margin-bottom: 12px"
    />

    <a-row :gutter="[12, 12]" style="margin-bottom: 12px">
      <a-col :xs="24" :md="8">
        <a-card style="border-radius: 16px" :loading="loading">
          <div style="opacity: 0.7">ยอดขายรวม</div>
          <div style="font-size: 24px; font-weight: 800">
            {{ kpiAmount.toLocaleString() }}
          </div>
        </a-card>
      </a-col>

      <a-col :xs="24" :md="8">
        <a-card style="border-radius: 16px" :loading="loading">
          <div style="opacity: 0.7">จำนวนบิล</div>
          <div style="font-size: 24px; font-weight: 800">
            {{ kpiOrders.toLocaleString() }}
          </div>
        </a-card>
      </a-col>

      <a-col :xs="24" :md="8">
        <a-card style="border-radius: 16px" :loading="loading">
          <div style="opacity: 0.7">แต้มรวมที่ให้</div>
          <div style="font-size: 24px; font-weight: 800">
            {{ kpiPoints.toLocaleString() }}
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-card style="border-radius: 16px; margin-bottom: 12px" :loading="loading">
      <VChart :option="chartOption" style="height: 360px" />
    </a-card>

    <a-card style="border-radius: 16px" :loading="loading" title="รายการยอดขาย (ไม่รวมกลุ่ม)">
      <a-table
        :dataSource="rows"
        rowKey="id"
        :pagination="{ pageSize: 10 }"
      >
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
