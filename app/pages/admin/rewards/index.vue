<script setup>
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  GiftOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  InboxOutlined,
  CrownOutlined,
} from "@ant-design/icons-vue";

definePageMeta({ layout: "admin" });

const supabase = useSupabase();
const { message, modal } = useUi();

const loading = ref(false);
const rows = ref([]);
const q = ref("");

const fetchRewards = async () => {
  try {
    loading.value = true;

    let query = supabase
      .from("rewards")
      .select("id,title,description,points_cost,stock,is_active,created_at,image_url")
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

const stats = computed(() => ({
  total: rows.value.length,
  active: rows.value.filter((r) => r.is_active).length,
  totalStock: rows.value.reduce((sum, r) => sum + (r.stock || 0), 0),
  avgPointsCost: Math.round(
    rows.value.reduce((sum, r) => sum + (r.points_cost || 0), 0) / (rows.value.length || 1),
  ),
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
    message.success(next ? "เปิดให้แลกแล้ว" : "ปิดการแลกแล้ว");
  } catch (e) {
    console.error(e);
    message.error(e?.message || "อัปเดตสถานะไม่สำเร็จ");
  }
};

const removeReward = (record) => {
  modal.confirm({
    title: "ลบของรางวัลนี้?",
    content: `“${record.title}” จะถูกลบถาวร และย้อนกลับไม่ได้`,
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

const stockChip = (stock) => {
  if (stock === 0) return { cls: "chip-danger", label: "หมด" };
  if (stock < 5) return { cls: "chip-accent", label: `เหลือ ${stock}` };
  return { cls: "chip-success", label: `${stock} ชิ้น` };
};
</script>

<template>
  <div class="page">
    <PageHeader eyebrow="Rewards" title="ของรางวัล" subtitle="จัดการรายการ สต็อก และแต้มที่ใช้แลก">
      <template #actions>
        <NuxtLink to="/admin/rewards/new">
          <a-button type="primary"><template #icon><PlusOutlined /></template> เพิ่มของรางวัล</a-button>
        </NuxtLink>
      </template>
    </PageHeader>

    <div class="stats">
      <StatCard label="ของรางวัลทั้งหมด" :value="stats.total" :loading="loading">
        <template #icon><GiftOutlined /></template>
      </StatCard>
      <StatCard label="เปิดให้แลก" :value="stats.active" :loading="loading">
        <template #icon><CheckCircleOutlined /></template>
      </StatCard>
      <StatCard label="สต็อกรวม" :value="stats.totalStock.toLocaleString()" :loading="loading">
        <template #icon><InboxOutlined /></template>
      </StatCard>
      <StatCard label="แต้มเฉลี่ยต่อชิ้น" :value="stats.avgPointsCost.toLocaleString()" :loading="loading" accent="cyan">
        <template #icon><CrownOutlined /></template>
      </StatCard>
    </div>

    <div class="toolbar">
      <a-input
        v-model:value="q"
        placeholder="ค้นหาชื่อของรางวัล แล้วกด Enter"
        allow-clear
        class="search"
        @pressEnter="fetchRewards"
        @change="(e) => !e.target.value && fetchRewards()"
      >
        <template #prefix><SearchOutlined class="subtle" /></template>
      </a-input>
    </div>

    <div v-if="loading && !rows.length" class="grid">
      <div v-for="n in 4" :key="n" class="surface surface-pad"><a-skeleton active /></div>
    </div>

    <div v-else-if="rows.length" class="grid">
      <article v-for="item in rows" :key="item.id" class="item surface" :class="{ inactive: !item.is_active }">
        <div class="item-media">
          <img v-if="item.image_url" :src="item.image_url" :alt="item.title" loading="lazy" />
          <GiftOutlined v-else class="item-placeholder" />
          <span class="chip item-stock" :class="stockChip(item.stock).cls">{{ stockChip(item.stock).label }}</span>
        </div>

        <div class="item-body">
          <h3 class="item-title">{{ item.title }}</h3>
          <div class="item-cost">
            <span class="text-accent num">{{ Number(item.points_cost).toLocaleString() }}</span>
            <span class="subtle">แต้ม</span>
          </div>

          <div class="item-toggle">
            <span :class="item.is_active ? 'muted' : 'subtle'">{{ item.is_active ? "เปิดให้แลก" : "ปิดการแลก" }}</span>
            <a-switch :checked="item.is_active" size="small" @change="() => toggleActive(item)" />
          </div>

          <div class="item-actions">
            <NuxtLink :to="`/admin/rewards/${item.id}`" class="grow">
              <a-button block><template #icon><EditOutlined /></template> แก้ไข</a-button>
            </NuxtLink>
            <a-tooltip title="ลบ">
              <a-button danger aria-label="ลบของรางวัล" @click="removeReward(item)">
                <template #icon><DeleteOutlined /></template>
              </a-button>
            </a-tooltip>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="surface empty-block">
      <p>{{ q ? "ไม่พบของรางวัลที่ค้นหา" : "ยังไม่มีของรางวัล" }}</p>
      <NuxtLink v-if="!q" to="/admin/rewards/new">
        <a-button type="primary"><template #icon><PlusOutlined /></template> เพิ่มของรางวัลแรก</a-button>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
.toolbar {
  display: flex;
  gap: 12px;
}
.search {
  max-width: 360px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}
.item {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.item.inactive .item-media img {
  filter: grayscale(0.7) brightness(0.7);
}
.item-media {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}
.item-media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.item-placeholder {
  font-size: 36px;
  color: var(--text-3);
}
.item-stock {
  position: absolute;
  top: 12px;
  right: 12px;
  backdrop-filter: blur(6px);
}
.item-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px 18px;
}
.item-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.item-cost {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.item-cost .text-accent {
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 600;
}
.item-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  font-size: 13px;
  margin-top: auto;
}
.item-actions {
  display: flex;
  gap: 8px;
}
.grow {
  flex: 1;
}
.empty-block p {
  margin: 0 0 16px;
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
  .search {
    max-width: none;
  }
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .item-body {
    padding: 12px;
    gap: 10px;
  }
  .item-title {
    font-size: 14px;
    line-height: 1.35;
  }
  .item-cost .text-accent {
    font-size: 20px;
  }
  .item-stock {
    top: 8px;
    right: 8px;
    font-size: 10.5px;
    padding: 2px 6px;
  }
  .item-toggle {
    padding: 8px 10px;
    font-size: 12px;
  }
}
</style>
