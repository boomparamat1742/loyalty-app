<script setup>
import dayjs from "dayjs";
import { message, Modal } from "ant-design-vue";

definePageMeta({ layout: "admin" });

const supabase = useSupabase();
const loading = ref(false);
const rows = ref([]);
const q = ref("");
const meId = ref(null);

const fmtDate = (d) => (d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "-");
const roleColor = (role) => (role === "admin" ? "red" : "blue");
const roleLabel = (role) => (role === "admin" ? "Admin" : "Customer");

const columns = [
  { title: "อีเมล", dataIndex: "email", key: "email" },
  { title: "สิทธิ์", dataIndex: "role", key: "role" },
  { title: "สร้างเมื่อ", dataIndex: "created_at", key: "created_at" },
  { title: "จัดการ", key: "action" },
];

const loadMe = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  meId.value = data?.user?.id || null;
};

const fetchUsers = async () => {
  try {
    loading.value = true;

    let query = supabase
      .from("profiles")
      .select("id,email,role,created_at")
      .order("created_at", { ascending: false })
      .limit(300);

    const keyword = q.value.trim();
    if (keyword) query = query.ilike("email", `%${keyword}%`);

    const { data, error } = await query;
    if (error) throw error;

    rows.value = data || [];
    console.log("users:", rows.value); // ✅ debug
  } catch (e) {
    console.error(e);
    message.error(e?.message || "โหลดผู้ใช้ไม่สำเร็จ");
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  try {
    await loadMe();
    await fetchUsers();
  } catch (e) {
    console.error(e);
    message.error(e?.message || "โหลดข้อมูลไม่สำเร็จ");
  }
});

const setRole = async (record, nextRole) => {
  try {
    if (!record?.id) return;
    if (record.id === meId.value)
      return message.warning("ห้ามเปลี่ยนสิทธิ์ของตัวเอง");

    const roleText = nextRole === "admin" ? "Admin" : "Customer";

    Modal.confirm({
      title: "ยืนยันเปลี่ยนสิทธิ์ผู้ใช้",
      content: `ต้องการเปลี่ยน “${record.email || record.id}” เป็น ${roleText} ใช่ไหม?`,
      okText: "ยืนยัน",
      cancelText: "ยกเลิก",
      async onOk() {
        loading.value = true;

        const { error } = await supabase
          .from("profiles")
          .update({ role: nextRole })
          .eq("id", record.id);

        if (error) throw error;

        record.role = nextRole;
        message.success("อัปเดตสิทธิ์แล้ว");
      },
    });
  } catch (e) {
    console.error(e);
    message.error(e?.message || "อัปเดตสิทธิ์ไม่สำเร็จ");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="users-page">
    <div class="users-topbar">
      <div class="users-title">
        <a-typography-title :level="3" style="margin: 0"
          >ผู้ใช้</a-typography-title
        >
        <div class="users-sub">ลูกค้า + เพิ่ม Admin ให้พนักงาน</div>
      </div>

      <div class="users-actions">
        <a-input
          v-model:value="q"
          placeholder="ค้นหาอีเมล..."
          class="users-search"
          allowClear
          @pressEnter="fetchUsers"
        />
        <a-button class="btn-soft" @click="fetchUsers" :loading="loading"
          >Refresh</a-button
        >
      </div>
    </div>

    <a-card class="users-card" :bordered="false" :loading="loading">
      <a-table
        class="users-table"
        :dataSource="rows"
        :columns="columns"
        rowKey="id"
        :pagination="{ pageSize: 10 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'role'">
            <a-tag :color="roleColor(record.role)" class="role-tag">
              {{ roleLabel(record.role) }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'created_at'">
            <span class="muted">{{ fmtDate(record.created_at) }}</span>
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button
                size="small"
                class="btn-role"
                :disabled="record.id === meId"
                @click="
                  setRole(
                    record,
                    record.role === 'admin' ? 'customer' : 'admin',
                  )
                "
              >
                {{
                  record.role === "admin"
                    ? "ตั้งเป็น Customer"
                    : "ตั้งเป็น Admin"
                }}
              </a-button>

              <a-tag v-if="record.id === meId" class="me-tag">คุณ</a-tag>
            </a-space>
          </template>
        </template>
      </a-table>

      <a-empty
        v-if="!loading && rows.length === 0"
        description="ไม่พบผู้ใช้"
        style="margin-top: 12px"
      />
    </a-card>
  </div>
</template>
<style scoped>
.users-page {
  padding: 24px;
  min-height: calc(100vh - 64px);
  background: #f5f7fb;
}

/* ===== Topbar ===== */
.users-topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.users-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.users-sub {
  color: #6b7280;
  font-size: 13px;
}

/* ===== Actions ===== */
.users-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.users-search {
  width: 280px;
  border-radius: 10px !important;
}

/* ===== Card ===== */
.users-card {
  border-radius: 16px;
  background: #ffffff !important;
  border: 1px solid #e5e7eb !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
}

/* ===== Table ===== */
.users-table :deep(.ant-table) {
  background: transparent;
}

.users-table :deep(.ant-table-thead > tr > th) {
  background: #f9fafb !important;
  color: #111827 !important;
  font-weight: 600;
  border-bottom: 1px solid #e5e7eb !important;
}

.users-table :deep(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid #f0f0f0 !important;
}

.users-table :deep(.ant-table-tbody > tr:hover > td) {
  background: #f3f6ff !important;
}

.muted {
  color: #6b7280;
}

/* ===== Role Tag ===== */
.role-tag {
  border-radius: 999px;
  font-weight: 600;
}

/* ===== Buttons ===== */
.btn-soft {
  border-radius: 10px;
}

.btn-role {
  border-radius: 999px;
  height: 32px;
  padding: 0 14px;
}

/* ===== Badge for self ===== */
.me-tag {
  border-radius: 999px;
  padding: 2px 10px;
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  color: #1890ff;
  font-weight: 600;
}

/* ===== Pagination ===== */
.users-page :deep(.ant-pagination-item) {
  border-radius: 8px;
}
</style>
