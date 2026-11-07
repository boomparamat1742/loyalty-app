<script setup>
import dayjs from "dayjs";
import { GiftOutlined, ReloadOutlined, CrownOutlined } from "@ant-design/icons-vue";

definePageMeta({ layout: "customer" });

const supabase = useSupabase();
const auth = useAuthStore();
const { message, modal } = useUi();

const loading = ref(false);
const me = ref(null); // { id, email, points }
const rewards = ref([]);
const redeemingId = ref(null);

const fmtDT = (d) => (d ? dayjs(d).format("D MMM YYYY · HH:mm:ss") : "-");

const loadMe = async () => {
  const { data: u, error: uErr } = await supabase.auth.getUser();
  if (uErr) throw uErr;

  const user = u?.user;
  if (!user) return navigateTo("/auth/login");

  const { data: p, error } = await supabase
    .from("profiles")
    .select("id,email,points")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  me.value = p;
  if (auth.profile) auth.profile.points = p.points;
};

const fetchRewards = async () => {
  const { data, error } = await supabase
    .from("rewards")
    .select("id,title,description,points_cost,stock,is_active,created_at,image_url")
    .eq("is_active", true)
    .gt("stock", 0)
    .order("points_cost", { ascending: true })
    .limit(200);

  if (error) throw error;
  rewards.value = data || [];
};

const init = async () => {
  try {
    loading.value = true;
    await loadMe();
    await fetchRewards();
  } catch (e) {
    console.error(e);
    message.error(e?.message || "โหลดข้อมูลไม่สำเร็จ");
  } finally {
    loading.value = false;
  }
};

onMounted(init);

const myPoints = computed(() => Number(me.value?.points || 0));

const canRedeem = (r) => {
  const cost = Number(r?.points_cost || 0);
  const stock = Number(r?.stock || 0);
  return myPoints.value >= cost && stock > 0 && !!r.is_active;
};

const progress = (r) =>
  Math.min(100, Math.round((myPoints.value / Math.max(1, Number(r.points_cost || 0))) * 100));

const showReceipt = (r, res) => {
  modal.success({
    title: "แลกของรางวัลสำเร็จ",
    okText: "ตกลง",
    width: 460,
    content: h("div", { class: "receipt" }, [
      h(
        "div",
        { class: "receipt-media" },
        r?.image_url ? h("img", { src: r.image_url, alt: "" }) : h(GiftOutlined),
      ),
      h("div", { class: "receipt-body" }, [
        h("div", { class: "receipt-title" }, r?.title || "-"),
        h("div", { class: "receipt-row" }, `ใช้แต้ม ${Number(res?.points_cost || r?.points_cost || 0).toLocaleString()} แต้ม`),
        h("div", { class: "receipt-row" }, `เวลาแลก ${fmtDT(res?.redeemed_at || new Date())}`),
        res?.redemption_id
          ? h("div", { class: "receipt-code" }, [h("span", "รหัสรับของ"), h("strong", `#${String(res.redemption_id).slice(0, 8).toUpperCase()}`)])
          : null,
        h("div", { class: "receipt-note" }, "แสดงรหัสนี้ที่หน้าร้านเพื่อรับของรางวัล (ใช้ได้ครั้งเดียว)"),
      ]),
    ]),
  });
};

const redeem = (r) => {
  if (!me.value?.id || !r?.id) return;

  if (!canRedeem(r)) {
    return message.warning("แต้มไม่พอ หรือของหมด หรือปิดใช้งาน");
  }

  modal.confirm({
    title: "ยืนยันการแลกของรางวัล",
    content: `ใช้ ${Number(r.points_cost).toLocaleString()} แต้ม แลก “${r.title}” ใช่ไหม?`,
    okText: "ยืนยันแลก",
    cancelText: "ยกเลิก",
    async onOk() {
      try {
        redeemingId.value = r.id;

        const { data, error } = await supabase.rpc("redeem_reward", {
          p_reward_id: r.id,
        });

        if (error) throw error;

        const res = Array.isArray(data) ? data[0] : data; // กันรูปแบบ return
        showReceipt(r, res);
      } catch (e) {
        console.error(e);
        message.error(e?.message || "แลกไม่สำเร็จ");
      } finally {
        redeemingId.value = null;
        init();
      }
    },
  });
};
</script>

<template>
  <div class="page">
    <PageHeader
      eyebrow="Rewards"
      title="แลกของรางวัล"
      subtitle="เลือกของรางวัลที่ต้องการ แล้วแสดงหลักฐานการแลกที่หน้าร้าน"
    >
      <template #actions>
        <span class="chip chip-accent num balance"><CrownOutlined /> {{ myPoints.toLocaleString() }} แต้ม</span>
        <a-button :loading="loading" @click="init">
          <template #icon><ReloadOutlined /></template> รีเฟรช
        </a-button>
      </template>
    </PageHeader>

    <div v-if="loading && !rewards.length" class="grid">
      <div v-for="n in 4" :key="n" class="surface surface-pad"><a-skeleton active /></div>
    </div>

    <div v-else-if="rewards.length" class="grid">
      <article
        v-for="r in rewards"
        :key="r.id"
        class="reward surface fade-up"
        :class="{ locked: !canRedeem(r) }"
      >
        <div class="reward-media">
          <img v-if="r.image_url" :src="r.image_url" :alt="r.title" loading="lazy" />
          <GiftOutlined v-else class="reward-placeholder" />
          <span v-if="r.stock <= 5" class="chip chip-danger stock-flag">เหลือ {{ r.stock }} ชิ้น</span>
        </div>

        <div class="reward-body">
          <h3 class="reward-title">{{ r.title }}</h3>
          <p v-if="r.description" class="reward-desc subtle">{{ r.description }}</p>

          <div class="reward-cost">
            <span class="text-accent num cost">{{ Number(r.points_cost || 0).toLocaleString() }}</span>
            <span class="subtle">แต้ม</span>
          </div>

          <div v-if="!canRedeem(r)" class="progress">
            <a-progress :percent="progress(r)" :show-info="false" size="small" stroke-color="#a78bfa" />
            <span class="subtle num">
              ขาดอีก {{ Math.max(0, Number(r.points_cost) - myPoints).toLocaleString() }} แต้ม
            </span>
          </div>

          <a-button
            type="primary"
            block
            size="large"
            :disabled="!canRedeem(r)"
            :loading="redeemingId === r.id"
            @click="redeem(r)"
          >
            {{ canRedeem(r) ? "แลกของรางวัล" : "แต้มยังไม่พอ" }}
          </a-button>
        </div>
      </article>
    </div>

    <div v-else class="surface empty-block">
      ยังไม่มีของรางวัลให้แลกในขณะนี้
    </div>
  </div>
</template>

<style scoped>
.balance {
  padding: 8px 14px;
  font-size: 14px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}
.reward {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.25s, border-color 0.25s;
}
.reward:hover {
  transform: translateY(-3px);
  border-color: var(--border-strong);
}
.reward-media {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}
.reward-media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.locked .reward-media img {
  filter: saturate(0.6) brightness(0.8);
}
.reward-placeholder {
  font-size: 40px;
  color: var(--text-3);
}
.stock-flag {
  position: absolute;
  top: 12px;
  left: 12px;
  backdrop-filter: blur(6px);
}
.reward-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 20px 20px;
}
.reward-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}
.reward-desc {
  margin: 0;
  font-size: 13px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.reward-cost {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: auto;
}
.cost {
  font-family: var(--font-mono);
  font-size: 28px;
  font-weight: 600;
}
.progress {
  display: flex;
  flex-direction: column;
  font-size: 12px;
}
.progress :deep(.ant-progress) {
  margin: 0;
}

/* มือถือ: 2 คอลัมน์ การ์ดกระชับขึ้น */
@media (max-width: 560px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .reward-body {
    padding: 12px 12px 14px;
    gap: 8px;
  }
  .reward-title {
    font-size: 14px;
    line-height: 1.35;
  }
  .reward-desc {
    display: none;
  }
  .cost {
    font-size: 20px;
  }
  .stock-flag {
    top: 8px;
    left: 8px;
    font-size: 10.5px;
    padding: 2px 6px;
  }
  .progress {
    font-size: 11px;
  }
  .reward-body :deep(.ant-btn-lg) {
    height: 40px;
    padding-inline: 8px;
    font-size: 14px;
  }
}
</style>

<style>
/* เนื้อหาใน modal (render นอก component จึงใช้ style แบบ global) */
.receipt {
  display: flex;
  gap: 14px;
  margin-top: 8px;
}
.receipt-media {
  width: 92px;
  height: 92px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 14px;
  overflow: hidden;
  background: var(--surface-3);
  border: 1px solid var(--border);
  color: var(--text-3);
  font-size: 28px;
}
.receipt-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.receipt-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.receipt-title {
  font-weight: 600;
  font-size: 16px;
}
.receipt-row {
  font-size: 13px;
  color: var(--text-2);
}
.receipt-code {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-2);
}
.receipt-code strong {
  font-family: var(--font-mono);
  font-size: 22px;
  letter-spacing: 0.08em;
  color: var(--accent);
  text-shadow: var(--glow-accent);
}
.receipt-note {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--accent);
  background: var(--accent-soft);
  border: 1px solid rgba(34, 211, 238, 0.3);
}
</style>
