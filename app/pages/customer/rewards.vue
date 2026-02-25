<script setup>
import dayjs from "dayjs";
import { message, Modal } from "ant-design-vue";

definePageMeta({ layout: "customer" });

const supabase = useSupabase();

const loading = ref(false);
const me = ref(null); // { id, email, points }
const rewards = ref([]);
const redeemingId = ref(null);

const fmtDT = (d) => (d ? dayjs(d).format("DD/MM/YYYY HH:mm:ss") : "-");

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
};

const fetchRewards = async () => {
  const { data, error } = await supabase
    .from("rewards")
    .select("id,title,points_cost,stock,is_active,created_at,image_url")
    .eq("is_active", true)
    .gt("stock", 0)
    .order("created_at", { ascending: false })
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

const canRedeem = (r) => {
  const myPoints = Number(me.value?.points || 0);
  const cost = Number(r?.points_cost || 0);
  const stock = Number(r?.stock || 0);
  return myPoints >= cost && stock > 0 && !!r.is_active;
};

const redeem = async (r) => {
  try {
    if (!me.value?.id) return;
    if (!r?.id) return;

    if (!canRedeem(r)) {
      return message.warning("แต้มไม่พอ หรือของหมด หรือปิดใช้งาน");
    }

    redeemingId.value = r.id;

    const { data, error } = await supabase.rpc("redeem_reward", {
      p_reward_id: r.id,
    });

    if (error) throw error;

    const res = Array.isArray(data) ? data[0] : data; // กันรูปแบบ return
    // const redeemedAt = res?.redeemed_at || new Date().toISOString();

    // อัปเดตแต้มในหน้า (เร็ว)
    me.value.points = Number(res?.points_after ?? me.value.points);

    // อัปเดต stock ในหน้า (เร็ว)
    const idx = rewards.value.findIndex((x) => x.id === r.id);
    if (idx >= 0) {
      rewards.value[idx].stock = Math.max(
        0,
        Number(rewards.value[idx].stock || 0) - 1,
      );
      if (rewards.value[idx].stock === 0) rewards.value.splice(idx, 1);
    }
    const redeemedAt = res?.redeemed_at || new Date();

    Modal.success({
      title: "แลกสำเร็จ",
      okText: "ตกลง",
      content: h("div", { style: "display:flex; gap:12px;" }, [
        h(
          "div",
          {
            style: `
        width:92px;
        height:92px;
        border-radius:14px;
        overflow:hidden;
        border:1px solid #eee;
        background:#fafafa;
        flex:0 0 auto;
      `,
          },
          res?.image_url
            ? h("img", {
                src: res.image_url,
                style: "width:100%; height:100%; object-fit:cover;",
              })
            : h(
                "div",
                {
                  style:
                    "display:flex; align-items:center; justify-content:center; height:100%; color:#999;",
                },
                "no image",
              ),
        ),

        h("div", { style: "flex:1;" }, [
          h(
            "div",
            {
              style: "font-weight:900; font-size:16px; margin-bottom:6px;",
            },
            res?.reward_title || r?.title || "-",
          ),

          h(
            "div",
            { style: "opacity:.8; margin-bottom:6px;" },
            `แต้มที่ใช้: ${Number(res?.points_cost || r?.points_cost || 0).toLocaleString()}`,
          ),

          h(
            "div",
            { style: "opacity:.8; margin-bottom:10px;" },
            `วันที่/เวลาแลก: ${fmtDT(redeemedAt)}`,
          ),

          h(
            "div",
            {
              style: `
          padding:10px 12px;
          border-radius:12px;
          background:#f6ffed;
          border:1px solid #b7eb8f;
          font-weight:700;
        `,
            },
            "กรุณาแคปหน้าจอเพื่อเป็นหลักฐานไปแจ้งที่หน้าร้าน",
          ),
        ]),
      ]),
    });
  } catch (e) {
    console.error(e);
    message.error(e?.message || "แลกไม่สำเร็จ");
  } finally {
    redeemingId.value = null;
  }
};
</script>

<template>
  <div class="c-wrap">
    <div class="bg-glow"></div>

    <div class="c-head">
      <div>
        <a-typography-title :level="2" class="main-title">
          <span class="gradient-text">REWARD</span> EXCHANGE
        </a-typography-title>
        <div class="c-sub">
          <span class="label">MY POINTS:</span>
          <span class="points-value">{{
            Number(me?.points || 0).toLocaleString()
          }}</span>
        </div>
      </div>

      <a-space size="middle">
        <NuxtLink to="/customer">
          <a-button class="btn-secondary">กลับสู่หน้าหลัก</a-button>
        </NuxtLink>
        <a-button @click="init" :loading="loading" class="btn-refresh">
          <template #icon><ReloadOutlined /></template>
          Refresh
        </a-button>
      </a-space>
    </div>

    <div class="card-container" :class="{ 'is-loading': loading }">
      <a-row :gutter="[24, 24]">
        <a-col
          v-for="r in rewards"
          :key="r.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <div class="reward-card" :class="{ 'out-of-stock': !canRedeem(r) }">
            <div class="thumb">
              <img v-if="r.image_url" :src="r.image_url" alt="reward" />
              <div v-else class="thumb-empty">NO IMAGE</div>
              <div v-if="r.stock <= 5 && r.stock > 0" class="badge-low-stock">
                LIMITED
              </div>
            </div>

            <div class="meta">
              <div class="title">{{ r.title }}</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">COST</span>
                  <span class="value">{{
                    Number(r.points_cost || 0).toLocaleString()
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="label">STOCK</span>
                  <span class="value">{{
                    Number(r.stock || 0).toLocaleString()
                  }}</span>
                </div>
              </div>
            </div>

            <a-button
              type="primary"
              block
              class="redeem-btn"
              :disabled="!canRedeem(r)"
              :loading="redeemingId === r.id"
              @click="redeem(r)"
            >
              {{ canRedeem(r) ? "แลกของรางวัล" : "แต้มไม่พอ" }}
            </a-button>

            <div v-if="!canRedeem(r)" class="status-hint">
              {{
                Number(me?.points || 0) < Number(r.points_cost || 0)
                  ? "แต้มไม่พอแลกของรางวัล"
                  : "Out of Stock"
              }}
            </div>
          </div>
        </a-col>
      </a-row>

      <a-empty v-if="!loading && rewards.length === 0" />
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap");

.c-wrap {
  padding: 40px 24px;
  min-height: 100vh;
  background: #ffffff; /* พื้นหลังเข้มแบบไฮเทค */
  font-family: "Inter", sans-serif;
  position: relative;
  overflow: hidden;
}

/* เอฟเฟกต์แสงฟุ้งข้างหลัง */
.bg-glow {
  position: absolute;
  top: -10%;
  right: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(
    circle,
    rgba(24, 144, 255, 0.15) 0%,
    rgba(0, 0, 0, 0) 70%
  );
  z-index: 0;
}

.c-head {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.gradient-text {
  background: linear-gradient(90deg, #1890ff, #722ed1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 900;
}

.main-title {
  color: #474646 !important;
  letter-spacing: -1px;
}

.c-sub {
  background: rgba(255, 255, 255, 0.05);
  padding: 8px 16px;
  border-left: 3px solid #1890ff;
  border-radius: 4px;
}

.points-value {
  color: #2a4805;
  font-size: 18px;
  font-weight: 700;
  margin-left: 8px;
}

/* Reward Card Style */
.reward-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.reward-card:hover {
  transform: translateY(-10px);
  border-color: rgba(24, 144, 255, 0.5);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(24, 144, 255, 0.1);
}

.thumb {
  width: 100%;
  height: 180px;
  border-radius: 18px;
  overflow: hidden;
  position: relative;
  background: #1a1f2e;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.reward-card:hover .thumb img {
  transform: scale(1.1);
}

.badge-low-stock {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #ff4d4f;
  color: white;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 1px;
}

.meta {
  margin: 20px 0;
}

.title {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
  height: 44px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item .label {
  font-size: 10px;
  color: #ffffff;
  letter-spacing: 1px;
}

.info-item .value {
  color: #fff;
  font-weight: 600;
  font-size: 15px;
}

/* Button Styling */
.redeem-btn {
  height: 48px;
  border-radius: 14px;
  font-weight: 700;
  background: linear-gradient(90deg, #1890ff, #0050b3);
  border: none;
  box-shadow: 0 4px 15px rgba(24, 144, 255, 0.3);
}

.redeem-btn:hover:not(:disabled) {
  background: linear-gradient(90deg, #40a9ff, #096dd9);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.5);
}

.redeem-btn:disabled {
  background: rgba(255, 255, 255, 0.05);
  color: #434343;
}

.status-hint {
  text-align: center;
  margin-top: 12px;
  color: #ff4d4f;
  font-size: 12px;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 576px) {
  .c-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
