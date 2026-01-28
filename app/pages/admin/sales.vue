<script setup>
import dayjs from "dayjs"
import { message } from "ant-design-vue"

definePageMeta({ layout: "admin" })

const supabase = useSupabase()

const tab = ref("daily") // daily | monthly | yearly
const loading = ref(false)
const rows = ref([])

const viewName = computed(() => {
  if (tab.value === "daily") return "v_sales_daily"
  if (tab.value === "monthly") return "v_sales_monthly"
  return "v_sales_yearly"
})

const fmtPeriod = (p) => {
  if (!p) return "-"
  if (tab.value === "daily") return dayjs(p).format("DD/MM/YYYY")
  if (tab.value === "monthly") return dayjs(p).format("MM/YYYY")
  return dayjs(p).format("YYYY")
}

const fetchData = async () => {
  try {
    loading.value = true

    const { data, error } = await supabase
      .from(viewName.value)
      .select("period,total_amount,total_points,orders")
      .order("period", { ascending: true })
      .limit(60)

    if (error) throw error
    rows.value = data || []
  } catch (e) {
    console.error(e)
    message.error(e?.message || "โหลดข้อมูลยอดขายไม่สำเร็จ")
  } finally {
    loading.value = false
  }
}

watch(tab, fetchData, { immediate: true })

const kpiAmount = computed(() =>
  rows.value.reduce((s, r) => s + Number(r.total_amount || 0), 0)
)
const kpiOrders = computed(() =>
  rows.value.reduce((s, r) => s + Number(r.orders || 0), 0)
)
const kpiPoints = computed(() =>
  rows.value.reduce((s, r) => s + Number(r.total_points || 0), 0)
)

const chartOption = computed(() => {
  const x = rows.value.map((r) => fmtPeriod(r.period))
  const y = rows.value.map((r) => Number(r.total_amount || 0))

  return {
    title: { text: "กราฟยอดขาย (บาท)" },
    tooltip: { trigger: "axis" },
    grid: { left: 44, right: 18, top: 54, bottom: 44 },
    xAxis: { type: "category", data: x },
    yAxis: { type: "value" },
    series: [{ type: "line", data: y, smooth: true }],
  }
})
</script>

<template>
  <div style="padding: 24px">
    <div style="display:flex; justify-content:space-between; align-items:center; gap:12px">
      <a-typography-title :level="3" style="margin:0">ยอดขาย</a-typography-title>
      <a-space>
        <a-button @click="fetchData" :loading="loading">Refresh</a-button>
      </a-space>
    </div>

    <a-space style="margin: 12px 0" wrap>
      <a-segmented
        v-model:value="tab"
        :options="[
          { label: 'รายวัน', value: 'daily' },
          { label: 'รายเดือน', value: 'monthly' },
          { label: 'รายปี', value: 'yearly' }
        ]"
      />
      <NuxtLink to="/admin/sales/new">
        <a-button type="primary">+ เพิ่มยอดขาย</a-button>
      </NuxtLink>
    </a-space>

    <a-row :gutter="[12, 12]" style="margin-bottom: 12px">
      <a-col :xs="24" :md="8">
        <a-card style="border-radius: 16px" :loading="loading">
          <div style="opacity:.7">ยอดขายรวม</div>
          <div style="font-size: 24px; font-weight: 800">
            {{ kpiAmount.toLocaleString() }}
          </div>
        </a-card>
      </a-col>

      <a-col :xs="24" :md="8">
        <a-card style="border-radius: 16px" :loading="loading">
          <div style="opacity:.7">จำนวนบิล</div>
          <div style="font-size: 24px; font-weight: 800">
            {{ kpiOrders.toLocaleString() }}
          </div>
        </a-card>
      </a-col>

      <a-col :xs="24" :md="8">
        <a-card style="border-radius: 16px" :loading="loading">
          <div style="opacity:.7">แต้มรวมที่ให้</div>
          <div style="font-size: 24px; font-weight: 800">
            {{ kpiPoints.toLocaleString() }}
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-card style="border-radius: 16px; margin-bottom: 12px" :loading="loading">
      <VChart :option="chartOption" style="height: 360px" />
    </a-card>

    <a-card style="border-radius: 16px" :loading="loading">
      <a-table
        :dataSource="rows"
        :rowKey="(r) => r.period"
        :pagination="{ pageSize: 10 }"
      >
        <a-table-column title="ช่วงเวลา" :customRender="({ record }) => fmtPeriod(record.period)" />
        <a-table-column title="ยอดขาย" dataIndex="total_amount" />
        <a-table-column title="แต้มที่ให้" dataIndex="total_points" />
        <a-table-column title="จำนวนบิล" dataIndex="orders" />
      </a-table>

      <a-empty
        v-if="!loading && rows.length === 0"
        description="ยังไม่มีข้อมูลยอดขาย (กด “เพิ่มยอดขาย” เพื่อเริ่ม)"
        style="margin-top: 12px"
      />
    </a-card>
  </div>
</template>
