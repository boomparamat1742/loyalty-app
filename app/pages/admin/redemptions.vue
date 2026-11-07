<script setup>
import dayjs from "dayjs";
import {
  ReloadOutlined,
  SearchOutlined,
  GiftOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
} from "@ant-design/icons-vue";

definePageMeta({ layout: "admin" });

const supabase = useSupabase();
const { message, modal } = useUi();

const loading = ref(false);
const rows = ref([]);
const statusFilter = ref("pending");
const q = ref("");
const counts = ref({ pending: 0, fulfilledToday: 0, total: 0 });
const fulfillingId = ref(null);

const fmt = (d) => (d ? dayjs(d).format("D MMM YYYY · HH:mm") : "-");

const columns = [
  { title: "รหัส", key: "code", width: 120 },
  { title: "ของรางวัล", key: "reward" },
  { title: "สมาชิก", key: "customer" },
  { title: "แต้ม", key: "points", align: "right", width: 100 },
  { title: "แลกเมื่อ", key: "redeemed_at", width: 180 },
  { title: "สถานะ", key: "status", width: 200 },
  { title: "", key: "action", align: "right", width: 140 },
];

const loadCounts = async () => {
  const startOfToday = dayjs().startOf("day").toISOString();
  const [pending, today, total] = await Promise.all([
    supabase.from("redemptions").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("redemptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "fulfilled")
      .gte("fulfilled_at", startOfToday),
    supabase.from("redemptions").select("id", { count: "exact", head: true }),
  ]);
  counts.value = {
    pending: pending.count || 0,
    fulfilledToday: today.count || 0,
    total: total.count || 0,
  };
};

const fetchRows = async () => {
  try {
    loading.value = true;
    let query = supabase
      .from("redemptions")
      .select(
        "id, code, reward_title, reward_image_url, points_cost, redeemed_at, status, fulfilled_at, customer:profiles!redemptions_customer_id_fkey(username, email)",
      )
      .order("redeemed_at", { ascending: statusFilter.value === "pending" })
      .limit(500);
    if (statusFilter.value !== "all") query = query.eq("status", statusFilter.value);

    const { data, error } = await query;
    if (error) throw error;
    rows.value = data || [];
    await loadCounts();
  } catch (e) {
    console.error(e);
    message.error(e?.message || "โหลดรายการแลกรางวัลไม่สำเร็จ");
  } finally {
    loading.value = false;
  }
};

watch(statusFilter, fetchRows, { immediate: true });

// ค้นด้วยรหัสอ้างอิง (จากหน้าจอหลักฐานของลูกค้า) ชื่อสมาชิก หรือชื่อของรางวัล
const filtered = computed(() => {
  const keyword = q.value.trim().toLowerCase();
  if (!keyword) return rows.value;
  return rows.value.filter(
    (r) =>
      r.code.toLowerCase().includes(keyword) ||
      memberLabel(r.customer).toLowerCase().includes(keyword) ||
      (r.reward_title || "").toLowerCase().includes(keyword),
  );
});

const fulfill = (record) => {
  modal.confirm({
    title: `มอบของรางวัล #${record.code}?`,
    content: `“${record.reward_title}” ให้ ${memberLabel(record.customer) || "สมาชิก"} · ตรวจรหัสบนหน้าจอลูกค้าให้ตรงก่อนกดยืนยัน`,
    okText: "มอบของแล้ว",
    cancelText: "ยกเลิก",
    async onOk() {
      try {
        fulfillingId.value = record.id;
        const { data, error } = await supabase.rpc("admin_fulfill_redemption", {
          p_redemption_id: record.id,
        });
        if (error) throw error;
        record.status = data.status;
        record.fulfilled_at = data.fulfilled_at;
        message.success(`บันทึกการมอบของ #${record.code} แล้ว`);
        if (statusFilter.value === "pending") rows.value = rows.value.filter((r) => r.id !== record.id);
        loadCounts();
      } catch (e) {
        console.error(e);
        message.error(e?.message || "บันทึกไม่สำเร็จ");
        fetchRows();
      } finally {
        fulfillingId.value = null;
      }
    },
  });
};

// มือถือ: แสดงเป็นการ์ดทีละ 20 รายการ
const isMobile = useIsMobile();
const mobileLimit = ref(20);
watch(filtered, () => (mobileLimit.value = 20));
</script>

<template>
  <div class="page">
    <PageHeader
      eyebrow="Redemptions"
      title="การแลกรางวัล"
      subtitle="ตรวจรหัสจากหน้าจอลูกค้า แล้วบันทึกการมอบของ"
    >
      <template #actions>
        <a-button :loading="loading" @click="fetchRows">
          <template #icon><ReloadOutlined /></template> รีเฟรช
        </a-button>
      </template>
    </PageHeader>

    <div class="stats">
      <StatCard label="รอมอบของ" :value="counts.pending.toLocaleString()" hint="ลูกค้าแลกแล้ว ยังไม่ได้รับของ" accent="cyan">
        <template #icon><ClockCircleOutlined /></template>
      </StatCard>
      <StatCard label="มอบของวันนี้" :value="counts.fulfilledToday.toLocaleString()">
        <template #icon><CheckCircleOutlined /></template>
      </StatCard>
      <StatCard label="การแลกทั้งหมด" :value="counts.total.toLocaleString()">
        <template #icon><HistoryOutlined /></template>
      </StatCard>
    </div>

    <section class="surface">
      <div class="surface-header toolbar">
        <a-segmented
          v-model:value="statusFilter"
          :options="[
            { label: 'รอมอบของ', value: 'pending' },
            { label: 'มอบแล้ว', value: 'fulfilled' },
            { label: 'ทั้งหมด', value: 'all' },
          ]"
        />
        <a-input v-model:value="q" placeholder="รหัสอ้างอิง เช่น 4E04BB12 หรือชื่อสมาชิก" allow-clear class="search">
          <template #prefix><SearchOutlined class="subtle" /></template>
        </a-input>
      </div>

      <a-spin v-if="isMobile" :spinning="loading">
        <ul v-if="filtered.length" class="m-list">
          <li v-for="r in filtered.slice(0, mobileLimit)" :key="r.id" class="m-item">
            <div class="m-head">
              <span class="thumb">
                <img v-if="r.reward_image_url" :src="r.reward_image_url" alt="" />
                <GiftOutlined v-else />
              </span>
              <span class="m-title">{{ r.reward_title }}</span>
              <span class="code mono">#{{ r.code }}</span>
            </div>
            <div class="m-meta">
              <span>{{ memberLabel(r.customer) || "-" }}</span>
              <span class="num">{{ Number(r.points_cost).toLocaleString() }} แต้ม</span>
              <span>{{ fmt(r.redeemed_at) }}</span>
            </div>
            <div class="m-meta">
              <span v-if="r.status === 'fulfilled'" class="chip chip-success">มอบแล้ว · {{ fmt(r.fulfilled_at) }}</span>
              <span v-else class="chip chip-accent">รอมอบของ</span>
            </div>
            <div v-if="r.status === 'pending'" class="m-actions">
              <a-button type="primary" :loading="fulfillingId === r.id" @click="fulfill(r)">มอบของแล้ว</a-button>
            </div>
          </li>
        </ul>
        <div v-else-if="!loading" class="empty-block">
          {{ q ? "ไม่พบรายการที่ค้นหา" : statusFilter === "pending" ? "ไม่มีรายการที่รอมอบของ" : "ยังไม่มีการแลกรางวัล" }}
        </div>
        <div v-if="filtered.length > mobileLimit" class="m-more">
          <a-button block @click="mobileLimit += 20">ดูเพิ่ม ({{ filtered.length - mobileLimit }} รายการ)</a-button>
        </div>
      </a-spin>
      <a-table
        v-else
        :dataSource="filtered"
        :columns="columns"
        rowKey="id"
        :loading="loading"
        :pagination="{ pageSize: 12, hideOnSinglePage: true }"
        :scroll="{ x: 960 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'code'">
            <span class="code mono">#{{ record.code }}</span>
          </template>
          <template v-else-if="column.key === 'reward'">
            <div class="reward">
              <span class="thumb">
                <img v-if="record.reward_image_url" :src="record.reward_image_url" alt="" />
                <GiftOutlined v-else />
              </span>
              <span class="reward-title">{{ record.reward_title }}</span>
            </div>
          </template>
          <template v-else-if="column.key === 'customer'">
            {{ memberLabel(record.customer) || "-" }}
          </template>
          <template v-else-if="column.key === 'points'">
            <span class="num muted">{{ Number(record.points_cost).toLocaleString() }}</span>
          </template>
          <template v-else-if="column.key === 'redeemed_at'">
            <span class="muted">{{ fmt(record.redeemed_at) }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <div v-if="record.status === 'fulfilled'" class="status">
              <span class="chip chip-success">มอบแล้ว</span>
              <span class="subtle small">{{ fmt(record.fulfilled_at) }}</span>
            </div>
            <span v-else class="chip chip-accent">รอมอบของ</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button
              v-if="record.status === 'pending'"
              type="primary"
              size="small"
              :loading="fulfillingId === record.id"
              @click="fulfill(record)"
            >
              มอบของแล้ว
            </a-button>
          </template>
        </template>
        <template #emptyText>
          <div class="empty-block">
            {{ q ? "ไม่พบรายการที่ค้นหา" : statusFilter === "pending" ? "ไม่มีรายการที่รอมอบของ" : "ยังไม่มีการแลกรางวัล" }}
          </div>
        </template>
      </a-table>
    </section>
  </div>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.toolbar {
  flex-wrap: wrap;
}
.search {
  max-width: 340px;
}
.code {
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--accent);
}
.reward {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.thumb {
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 6px;
  overflow: hidden;
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-3);
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.reward-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.status {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}
.small {
  font-size: 12px;
}

@media (max-width: 900px) {
  .stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
}
@media (max-width: 560px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .stats > :last-child {
    grid-column: span 2;
  }
  .search {
    max-width: none;
    width: 100%;
  }
}
</style>
