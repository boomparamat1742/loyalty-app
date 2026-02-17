<script setup>
import dayjs from "dayjs";
import { message, Modal } from "ant-design-vue";

definePageMeta({ layout: "admin" });

const supabase = useSupabase();

const loading = ref(false);
const rows = ref([]);
const q = ref("");

const fetchRewards = async () => {
  try {
    loading.value = true;

    let query = supabase
      .from("rewards")
      .select("id,title,points_cost,stock,is_active,created_at,image_url")
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

const fmtDate = (d) => (d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "-");

const toggleActive = async (record) => {
  try {
    const next = !record.is_active;

    const { error } = await supabase
      .from("rewards")
      .update({ is_active: next })
      .eq("id", record.id);

    if (error) throw error;

    record.is_active = next;
    message.success("อัปเดตสถานะแล้ว");
  } catch (e) {
    console.error(e);
    message.error(e?.message || "อัปเดตสถานะไม่สำเร็จ");
  }
};

const removeReward = async (record) => {
  Modal.confirm({
    title: "ยืนยันลบของรางวัล",
    content: `ต้องการลบ “${record.title}” ใช่ไหม?`,
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
      <a-typography-title :level="3" style="margin: 0"
        >ของรางวัล</a-typography-title
      >

      <a-space>
        <NuxtLink to="/admin">
          <a-button type="primary">กลับเมนูหลัก</a-button>
        </NuxtLink>
        <a-input
          v-model:value="q"
          placeholder="ค้นหาชื่อของรางวัล..."
          style="width: 260px"
          allowClear
          @pressEnter="fetchRewards"
        />
        <a-button @click="fetchRewards" :loading="loading">Refresh</a-button>
        <NuxtLink to="/admin/rewards/new">
          <a-button type="primary">+ เพิ่มของรางวัล</a-button>
        </NuxtLink>
      </a-space>
    </div>

    <a-card
      style="border-radius: 16px; margin-top: 12px"
      :loading="loading"
      :bordered="false"
    >
      <a-table :dataSource="rows" rowKey="id" :pagination="{ pageSize: 10 }">
        <a-table-column title="รูป" dataIndex="image_url" width="90" />
        <a-table-column title="ชื่อของรางวัล" dataIndex="title" />
        <a-table-column title="แต้มที่ใช้" dataIndex="points_cost" />
        <a-table-column title="คงเหลือ" dataIndex="stock" />
        <a-table-column title="สถานะ" dataIndex="is_active" width="110" />
        <a-table-column title="สร้างเมื่อ" dataIndex="created_at" width="170" />
        <a-table-column title="จัดการ" key="actions" width="160" />

        <!-- ✅ Render cell แบบถูกต้อง (ไม่ใช้ JSX) -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'image_url'">
            <div
              style="
                width: 64px;
                height: 64px;
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid #eee;
                background: #fafafa;
              "
            >
              <img
                v-if="record.image_url"
                :src="record.image_url"
                alt="reward"
                style="width: 100%; height: 100%; object-fit: cover"
              />
            </div>
          </template>

          <template v-else-if="column.dataIndex === 'is_active'">
            <a-switch
              :checked="record.is_active"
              @change="() => toggleActive(record)"
            />
          </template>

          <template v-else-if="column.dataIndex === 'created_at'">
            {{ fmtDate(record.created_at) }}
          </template>

          <template v-else-if="column.key === 'actions'">
            <a-space>
              <NuxtLink :to="`/admin/rewards/${record.id}`">
                <a-button size="small">แก้ไข</a-button>
              </NuxtLink>
              <a-button size="small" danger @click="removeReward(record)"
                >ลบ</a-button
              >
            </a-space>
          </template>
        </template>
      </a-table>

      <a-empty
        v-if="!loading && rows.length === 0"
        description="ยังไม่มีของรางวัล (กด “เพิ่มของรางวัล” เพื่อเริ่ม)"
        style="margin-top: 12px"
      />
    </a-card>
  </div>
</template>
