<script setup>
import dayjs from "dayjs";
import {
  LineChartOutlined,
  GiftOutlined,
  TeamOutlined,
  ArrowRightOutlined,
  WalletOutlined,
  ShoppingOutlined,
  PlusOutlined,
  CheckSquareOutlined,
} from "@ant-design/icons-vue";

definePageMeta({ layout: "admin" });

const supabase = useSupabase();
const auth = useAuthStore();
const { message } = useUi();

const statsLoading = ref(true);
const stats = ref({
  totalUsers: 0,
  totalRewards: 0,
  activeRewards: 0,
  totalSales: 0,
  todaySales: 0,
  todayOrders: 0,
});

const recent = ref([]);
const recentLoading = ref(true);

const fmtTHB = (val) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(val || 0);
const fmtDate = (d) => dayjs(d).format("D MMM · HH:mm");

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return "อรุณสวัสดิ์";
  if (h < 17) return "สวัสดีตอนบ่าย";
  return "สวัสดีตอนเย็น";
});

const loadStatistics = async () => {
  try {
    statsLoading.value = true;
    const startOfToday = dayjs().startOf("day").toISOString();

    const [usersRes, rewardsRes, activeRes, yearlyRes, todayRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
      supabase.from("rewards").select("id", { count: "exact", head: true }),
      supabase.from("rewards").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("v_sales_yearly").select("total_amount"),
      supabase.from("sales").select("amount").gte("created_at", startOfToday),
    ]);

    stats.value.totalUsers = usersRes.count || 0;
    stats.value.totalRewards = rewardsRes.count || 0;
    stats.value.activeRewards = activeRes.count || 0;
    stats.value.totalSales = (yearlyRes.data || []).reduce((s, r) => s + Number(r.total_amount || 0), 0);
    stats.value.todaySales = (todayRes.data || []).reduce((s, r) => s + Number(r.amount || 0), 0);
    stats.value.todayOrders = (todayRes.data || []).length;
  } catch (e) {
    console.error("Failed to load statistics:", e);
    message.error("โหลดสถิติไม่สำเร็จ");
  } finally {
    statsLoading.value = false;
  }
};

const loadRecent = async () => {
  try {
    recentLoading.value = true;
    const { data, error } = await supabase
      .from("sales")
      .select("id, amount, points_earned, note, customer_email, created_at")
      .order("created_at", { ascending: false })
      .limit(8);
    if (error) throw error;
    recent.value = data || [];
  } catch (e) {
    console.error("Failed to load activity:", e);
  } finally {
    recentLoading.value = false;
  }
};

onMounted(() => Promise.all([loadStatistics(), loadRecent()]));

const shortcuts = [
  { to: "/admin/sales/new", icon: PlusOutlined, title: "บันทึกยอดขาย", text: "เพิ่มยอดขายและแต้มให้ลูกค้า" },
  { to: "/admin/sales", icon: LineChartOutlined, title: "รายงานยอดขาย", text: "รายวัน รายเดือน รายปี" },
  { to: "/admin/redemptions", icon: CheckSquareOutlined, title: "การแลกรางวัล", text: "ตรวจรหัสและบันทึกการมอบของ" },
  { to: "/admin/rewards", icon: GiftOutlined, title: "จัดการของรางวัล", text: "สต็อก ราคาแต้ม และรูปภาพ" },
  { to: "/admin/users", icon: TeamOutlined, title: "สมาชิก", text: "รายชื่อและสิทธิ์ผู้ใช้" },
];
</script>

<template>
  <div class="page">
    <PageHeader
      eyebrow="Dashboard"
      :title="`${greeting}`"
      :subtitle="`${memberLabel(auth.profile)} · ${dayjs().format('dddd D MMMM YYYY')}`"
    >
      <template #actions>
        <NuxtLink to="/admin/sales/new">
          <a-button type="primary"><template #icon><PlusOutlined /></template> บันทึกยอดขาย</a-button>
        </NuxtLink>
      </template>
    </PageHeader>

    <div class="stats">
      <StatCard label="ยอดขายวันนี้" :value="fmtTHB(stats.todaySales)" :hint="`${stats.todayOrders} รายการ`" :loading="statsLoading" accent="cyan">
        <template #icon><WalletOutlined /></template>
      </StatCard>
      <StatCard label="ยอดขายสะสมทั้งหมด" :value="fmtTHB(stats.totalSales)" hint="ทุกช่วงเวลา" :loading="statsLoading">
        <template #icon><LineChartOutlined /></template>
      </StatCard>
      <StatCard label="สมาชิกลูกค้า" :value="stats.totalUsers.toLocaleString()" hint="บัญชีที่สมัครแล้ว" :loading="statsLoading">
        <template #icon><TeamOutlined /></template>
      </StatCard>
      <StatCard label="ของรางวัลที่เปิดแลก" :value="`${stats.activeRewards} / ${stats.totalRewards}`" hint="เปิดใช้งาน / ทั้งหมด" :loading="statsLoading">
        <template #icon><GiftOutlined /></template>
      </StatCard>
    </div>

    <div class="split">
      <section class="surface">
        <div class="surface-header">
          <h2 class="surface-title">ยอดขายล่าสุด</h2>
          <NuxtLink to="/admin/sales" class="see-all">ดูทั้งหมด <ArrowRightOutlined /></NuxtLink>
        </div>
        <a-spin :spinning="recentLoading">
          <ul v-if="recent.length" class="feed">
            <li v-for="r in recent" :key="r.id" class="feed-item">
              <span class="tx-icon"><ShoppingOutlined /></span>
              <div class="feed-main">
                <div class="feed-title">{{ r.customer_email || "ลูกค้า" }}</div>
                <div class="subtle feed-sub">{{ r.note || "ยอดขาย" }} · {{ fmtDate(r.created_at) }}</div>
              </div>
              <div class="feed-right">
                <div class="num">฿{{ Number(r.amount).toLocaleString() }}</div>
                <div class="points-plus">+{{ r.points_earned }}</div>
              </div>
            </li>
          </ul>
          <div v-else-if="!recentLoading" class="empty-block">ยังไม่มียอดขาย</div>
        </a-spin>
      </section>

      <section class="shortcuts">
        <NuxtLink v-for="s in shortcuts" :key="s.to" :to="s.to" class="shortcut surface">
          <span class="icon-tile"><component :is="s.icon" /></span>
          <span class="shortcut-text">
            <strong>{{ s.title }}</strong>
            <small class="subtle">{{ s.text }}</small>
          </span>
          <ArrowRightOutlined class="subtle" />
        </NuxtLink>
      </section>
    </div>
  </div>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.split {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}
.see-all {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
}
.feed {
  list-style: none;
  margin: 0;
  padding: 4px 24px 8px;
}
.feed-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
}
.feed-item:last-child {
  border-bottom: 0;
}
.tx-icon {
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 11px;
  background: var(--primary-soft);
  color: var(--lavender);
}
.feed-main {
  flex: 1;
  min-width: 0;
}
.feed-title {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.feed-sub {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.feed-right {
  text-align: right;
  font-size: 14px;
}
.feed-right .points-plus {
  font-size: 12px;
}
.shortcuts {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.shortcut {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  color: var(--text);
  transition: border-color 0.2s, transform 0.2s;
}
.shortcut:hover {
  border-color: var(--border-strong);
  transform: translateX(2px);
}
.shortcut-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.shortcut-text small {
  font-size: 12px;
}

@media (max-width: 1180px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 900px) {
  .split {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 520px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .feed {
    padding: 4px 18px 8px;
  }
}
</style>
