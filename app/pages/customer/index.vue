<script setup>
import dayjs from "dayjs";
import {
  ShoppingOutlined,
  GiftOutlined,
  ReloadOutlined,
  CrownOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons-vue";

definePageMeta({ layout: "customer" });

const supabase = useSupabase();
const auth = useAuthStore();
const { message } = useUi();

const loading = ref(false);
const me = ref(null); // profile
const rows = ref([]); // sales list
const redemptions = ref([]);
const tab = ref("sales");

const fmt = (d) => (d ? dayjs(d).format("D MMM YYYY · HH:mm") : "-");

const load = async () => {
  try {
    loading.value = true;

    const { data: u, error: uErr } = await supabase.auth.getUser();
    if (uErr) throw uErr;

    const user = u?.user;
    if (!user) return navigateTo("/auth/login");

    const [p, s, r] = await Promise.all([
      supabase.from("profiles").select("id,email,username,role,points").eq("id", user.id).single(),
      supabase
        .from("sales")
        .select("id, amount, points_earned, note, created_at")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("redemptions")
        .select("id, reward_title, reward_image_url, points_cost, redeemed_at")
        .eq("customer_id", user.id)
        .order("redeemed_at", { ascending: false })
        .limit(50),
    ]);

    if (p.error) throw p.error;
    if (s.error) throw s.error;

    me.value = p.data;
    auth.profile = p.data;
    rows.value = s.data || [];
    redemptions.value = r.data || [];
  } catch (e) {
    console.error(e);
    message.error(e?.message || "โหลดข้อมูลไม่สำเร็จ");
  } finally {
    loading.value = false;
  }
};

onMounted(load);

const displayName = computed(() => {
  if (me.value?.username) return me.value.username;
  if (!me.value?.email) return "สมาชิก";
  return me.value.email.split("@")[0];
});

const totalSpent = computed(() =>
  rows.value.reduce((sum, r) => sum + Number(r.amount || 0), 0),
);
const totalEarned = computed(() =>
  rows.value.reduce((sum, r) => sum + Number(r.points_earned || 0), 0),
);
</script>

<template>
  <div class="page">
    <PageHeader
      eyebrow="Member Overview"
      :title="`สวัสดี, ${displayName}`"
      subtitle="ภาพรวมแต้มสะสมและประวัติของคุณ"
    >
      <template #actions>
        <a-button :loading="loading" @click="load">
          <template #icon><ReloadOutlined /></template> รีเฟรช
        </a-button>
      </template>
    </PageHeader>

    <div class="overview">
      <!-- membership card -->
      <section class="card-col fade-up fade-up-2">
        <div class="member-card">
          <div class="mc-top">
            <span class="mc-brand">R.BENZ<span class="accent-slash">//</span>ID</span>
            <span class="mc-tier"><CrownOutlined /> MEMBER</span>
          </div>
          <div class="mc-label">POINTS_BALANCE · แต้มคงเหลือ</div>
          <a-skeleton v-if="loading && !me" active :paragraph="false" />
          <div v-else class="mc-points num">
            {{ Number(me?.points || 0).toLocaleString() }}
            <span>แต้ม</span>
          </div>
          <div class="mc-bottom">
            <span class="mc-email">{{ memberLabel(me) }}</span>
            <span>ฟิล์มม่วง แปดริ้ว</span>
          </div>
        </div>

        <div class="actions">
          <NuxtLink to="/customer/purchase" class="action surface">
            <span class="icon-tile"><ShoppingOutlined /></span>
            <span class="action-text">
              <strong>บันทึกการซื้อ</strong>
              <small class="subtle">ทุก 10 บาท รับ 1 แต้ม</small>
            </span>
            <ArrowRightOutlined class="subtle" />
          </NuxtLink>
          <NuxtLink to="/customer/rewards" class="action surface">
            <span class="icon-tile"><GiftOutlined /></span>
            <span class="action-text">
              <strong>แลกของรางวัล</strong>
              <small class="subtle">ใช้แต้มแลกสินค้าพรีเมียม</small>
            </span>
            <ArrowRightOutlined class="subtle" />
          </NuxtLink>
        </div>
      </section>

      <!-- history -->
      <section class="history surface fade-up fade-up-3">
        <div class="history-stats">
          <div>
            <span class="subtle">ยอดซื้อสะสม</span>
            <strong class="num">฿{{ totalSpent.toLocaleString() }}</strong>
          </div>
          <div>
            <span class="subtle">แต้มที่ได้รับ</span>
            <strong class="num text-accent">+{{ totalEarned.toLocaleString() }}</strong>
          </div>
          <div>
            <span class="subtle">แลกของรางวัล</span>
            <strong class="num">{{ redemptions.length.toLocaleString() }} ครั้ง</strong>
          </div>
        </div>

        <div class="history-body">
          <a-segmented
            v-model:value="tab"
            :options="[
              { label: 'ประวัติการซื้อ', value: 'sales' },
              { label: 'ประวัติการแลก', value: 'redemptions' },
            ]"
          />

          <a-spin :spinning="loading">
            <ul v-if="tab === 'sales' && rows.length" class="tx-list">
              <li v-for="r in rows" :key="r.id" class="tx">
                <span class="tx-icon"><ShoppingOutlined /></span>
                <div class="tx-main">
                  <div class="tx-title">{{ r.note || "ฟิล์ม / เคส" }}</div>
                  <div class="tx-sub subtle">{{ fmt(r.created_at) }}</div>
                </div>
                <div class="tx-right">
                  <div class="num">฿{{ Number(r.amount).toLocaleString() }}</div>
                  <div class="points-plus">+{{ r.points_earned }} แต้ม</div>
                </div>
              </li>
            </ul>

            <ul v-else-if="tab === 'redemptions' && redemptions.length" class="tx-list">
              <li v-for="r in redemptions" :key="r.id" class="tx">
                <span class="tx-icon tx-thumb">
                  <img v-if="r.reward_image_url" :src="r.reward_image_url" alt="" />
                  <GiftOutlined v-else />
                </span>
                <div class="tx-main">
                  <div class="tx-title">{{ r.reward_title }}</div>
                  <div class="tx-sub subtle">{{ fmt(r.redeemed_at) }}</div>
                </div>
                <div class="tx-right">
                  <div class="num tx-minus">−{{ Number(r.points_cost).toLocaleString() }} แต้ม</div>
                </div>
              </li>
            </ul>

            <div v-else-if="!loading" class="empty-block">
              {{ tab === "sales" ? "ยังไม่มีประวัติการซื้อ" : "ยังไม่มีประวัติการแลกของรางวัล" }}
            </div>
          </a-spin>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.overview {
  display: grid;
  grid-template-columns: minmax(0, 380px) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}
.card-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.member-card {
  position: relative;
  aspect-ratio: 1.586;
  padding: 22px 24px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  color: var(--text);
  overflow: hidden;
  background:
    linear-gradient(rgba(167, 139, 250, 0.08) 1px, transparent 1px) 0 0 / 22px 22px,
    linear-gradient(90deg, rgba(167, 139, 250, 0.08) 1px, transparent 1px) 0 0 / 22px 22px,
    radial-gradient(circle at 100% 0%, rgba(34, 211, 238, 0.22), transparent 45%),
    linear-gradient(140deg, #2a1259 0%, #160b33 60%, #0c0718 100%);
  border: 1px solid rgba(167, 139, 250, 0.5);
  box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.15), 0 0 40px rgba(139, 92, 246, 0.3), 0 30px 70px -30px rgba(0, 0, 0, 0.9);
}
.mc-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mc-brand {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.accent-slash {
  margin: 0 4px;
  color: var(--accent);
}
.mc-tier {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.18em;
  color: var(--accent);
}
.mc-label {
  margin-top: auto;
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  color: var(--text-3);
}
.mc-points {
  font-family: var(--font-mono);
  font-size: 38px;
  font-weight: 600;
  line-height: 1.15;
  color: #fff;
  text-shadow: 0 0 18px rgba(139, 92, 246, 0.8);
}
.mc-points span {
  font-family: var(--font-sans);
  font-size: 14px;
  opacity: 0.75;
}
.mc-bottom {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  font-size: 12px;
  opacity: 0.75;
}
.mc-email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.action {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  color: var(--text);
  transition: border-color 0.2s, transform 0.2s;
}
.action:hover {
  border-color: var(--border-strong);
  transform: translateY(-1px);
}
.action-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.action-text small {
  font-size: 12px;
}

.history-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-bottom: 1px solid var(--border);
}
.history-stats > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px 24px;
}
.history-stats > div + div {
  border-left: 1px solid var(--border);
}
.history-stats span {
  font-size: 13px;
}
.history-stats strong {
  font-size: 22px;
  font-weight: 600;
}
.history-body {
  padding: 20px 24px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tx-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 520px;
  overflow-y: auto;
}
.tx {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
}
.tx:last-child {
  border-bottom: 0;
}
.tx-icon {
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--primary-soft);
  color: var(--lavender);
  overflow: hidden;
}
.tx-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.tx-main {
  flex: 1;
  min-width: 0;
}
.tx-title {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tx-sub {
  font-size: 12px;
}
.tx-right {
  text-align: right;
  font-size: 14px;
}
.tx-right .points-plus {
  font-size: 12px;
}
.tx-minus {
  color: var(--lavender);
  font-weight: 600;
}

@media (max-width: 960px) {
  .overview {
    grid-template-columns: 1fr;
  }
  .card-col {
    max-width: 460px;
    width: 100%;
  }
}
@media (max-width: 560px) {
  .history-stats > div {
    padding: 14px;
  }
  .history-stats strong {
    font-size: 17px;
  }
  .history-body {
    padding: 16px 16px 8px;
  }
}
</style>
