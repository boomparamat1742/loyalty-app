<script setup>
import dayjs from "dayjs";
import { message } from "ant-design-vue";

definePageMeta({ layout: "customer" });

const supabase = useSupabase();

const loading = ref(false);
const me = ref(null); // profile
const rows = ref([]); // sales list

const fmt = (d) => (d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "-");

const load = async () => {
  try {
    loading.value = true;

    const { data: u, error: uErr } = await supabase.auth.getUser();
    if (uErr) throw uErr;

    const user = u?.user;
    if (!user) return navigateTo("/auth/login");

    // profile (points)
    const { data: p, error: pErr } = await supabase
      .from("profiles")
      .select("id,email,role,points")
      .eq("id", user.id)
      .single();

    if (pErr) throw pErr;
    me.value = p;

    // sales ของตัวเอง
    const { data: s, error: sErr } = await supabase
      .from("sales")
      .select("id, amount, points_earned, note, created_at")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (sErr) throw sErr;
    rows.value = s || [];
    console.log("rows", rows);
  } catch (e) {
    console.error(e);
    message.error(e?.message || "โหลดข้อมูลไม่สำเร็จ");
  } finally {
    loading.value = false;
  }
};

onMounted(load);

const goPurchase = () => navigateTo("/customer/purchase");
</script>

<template>
  <div style="padding: 24px">
    <div
      style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      "
    >
      <a-typography-title :level="3" style="margin: 0"
        >Customer</a-typography-title
      >
      <a-space>
        <a-button @click="load" :loading="loading">Refresh</a-button>
        <a-button type="primary" @click="goPurchase">+ กรอกการซื้อ</a-button>
      </a-space>
    </div>

    <a-row :gutter="[12, 12]" style="margin-top: 12px">
      <a-col :xs="24" :md="8">
        <a-card :loading="loading" style="border-radius: 16px">
          <div style="opacity: 0.7">แต้มสะสม</div>
          <div style="font-size: 32px; font-weight: 900">
            {{ Number(me?.points || 0).toLocaleString() }}
          </div>
          <div style="opacity: 0.6; margin-top: 6px">
            {{ me?.email || "-" }}
          </div>
        </a-card>
      </a-col>

      <a-col :xs="24" :md="16">
        <a-card
          :loading="loading"
          style="border-radius: 16px"
          title="รายการที่ซื้อล่าสุด"
        >
          <a-table
            :dataSource="rows"
            rowKey="id"
            :pagination="{ pageSize: 10 }"
          >
            <!-- <a-table-column title="เวลา">
              <template #bodyCell="{ record }">{{
                fmt(record.created_at)
              }}</template>
            </a-table-column>

            <a-table-column title="สินค้า">
              <template #bodyCell="{ record }">
                {{ record.note || "-" }}
              </template>
            </a-table-column> -->

            <a-table-column title="วันที่" dataIndex="created_at">
              <template #default="{ text }">
                {{ dayjs(text).format("DD/MM/YYYY") }}
              </template>
            </a-table-column>
            <a-table-column title="สินค้า" dataIndex="note" />
            <a-table-column title="ราคา (บาท)" dataIndex="amount" />
            <a-table-column title="แต้ม" dataIndex="points_earned" />
          </a-table>

          <a-empty
            v-if="!loading && rows.length === 0"
            description="ยังไม่มีรายการซื้อ"
            style="margin-top: 12px"
          />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>
