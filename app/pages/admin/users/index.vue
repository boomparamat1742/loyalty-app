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
const deleteUser = async (record) => {
  try {
    if (!record?.id) return;

    if (record.id === meId.value) return message.warning("ห้ามลบตัวเอง");

    Modal.confirm({
      title: "ยืนยันลบผู้ใช้",
      content: `ต้องการลบ ${record.email} ใช่หรือไม่ ?`,
      okText: "ลบ",
      okType: "danger",
      cancelText: "ยกเลิก",

      async onOk() {
        loading.value = true;

        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("id", record.id);

        if (error) throw error;

        rows.value = rows.value.filter((u) => u.id !== record.id);

        message.success("ลบผู้ใช้แล้ว");
      },
    });
  } catch (e) {
    console.error(e);
    message.error(e?.message || "ลบผู้ใช้ไม่สำเร็จ");
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
        <NuxtLink to="/admin">
          <a-button type="primary">กลับเมนูหลัก</a-button>
        </NuxtLink>
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
              <a-button
                danger
                size="small"
                class="btn-role"
                :disabled="record.id === meId"
                @click="deleteUser(record)"
              >
                ลบผู้ใช้
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
/* ===== Global ===== */
.users-page {
  padding: 28px 32px;
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

/* ===== Topbar ===== */
.users-topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}

.users-title {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.users-title :deep(.ant-typography) {
  color: #0f172a !important;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.users-sub {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

/* ===== Actions ===== */
.users-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.users-search {
  width: 300px !important;
  border-radius: 12px !important;
  border: 2px solid #e2e8f0 !important;
  transition: all 0.3s ease !important;
}

.users-search:hover {
  border-color: #cbd5e1 !important;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06) !important;
}

.users-search:focus {
  border-color: #1e40af !important;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1) !important;
}

/* ===== Card ===== */
.users-card {
  border-radius: 18px !important;
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  overflow: hidden;
}

.users-card:hover {
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.08);
}

/* ===== Table ===== */
.users-table :deep(.ant-table) {
  background: transparent;
  font-size: 14px;
}

.users-table :deep(.ant-table-thead > tr > th) {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
  color: #0f172a !important;
  font-weight: 700;
  border-bottom: 2px solid #e2e8f0 !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 16px 12px !important;
}

.users-table :deep(.ant-table-tbody > tr) {
  transition: all 0.2s ease;
}

.users-table :deep(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid #f1f5f9 !important;
  padding: 14px 12px !important;
  color: #334155;
}

.users-table :deep(.ant-table-tbody > tr:hover > td) {
  background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%) !important;
}

.users-table :deep(.ant-table-row-selected > td) {
  background: #eff6ff !important;
}

/* ===== Table Row Animation ===== */
.users-table :deep(.ant-table-tbody > tr) {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.muted {
  color: #94a3b8;
  font-size: 13px;
}

/* ===== Role Tag ===== */
.role-tag {
  border-radius: 999px;
  font-weight: 700;
  padding: 4px 12px;
  border: none;
  font-size: 12px;
  letter-spacing: 0.3px;
}

/* ===== Buttons ===== */
.btn-soft {
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  background: #ffffff;
  color: #334155;
  font-weight: 600;
  transition: all 0.25s ease;
}

.btn-soft:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.btn-role {
  border-radius: 10px;
  height: 36px;
  padding: 0 16px;
  font-weight: 600;
  transition: all 0.25s ease;
  border: 1.5px solid #e2e8f0;
}

.btn-role:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.btn-role:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== Badge for self ===== */
.me-tag {
  border-radius: 8px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%);
  border: 1.5px solid #7dd3fc;
  color: #0369a1;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.3px;
}

/* ===== Pagination ===== */
.users-page :deep(.ant-pagination-item) {
  border-radius: 8px;
  border: 1.5px solid #e2e8f0;
  transition: all 0.25s ease;
}

.users-page :deep(.ant-pagination-item-active) {
  border-color: #1e40af !important;
  background: #eff6ff !important;
}

.users-page :deep(.ant-pagination-item:hover:not(.ant-pagination-item-active)) {
  border-color: #cbd5e1;
  color: #1e40af;
}

.users-page :deep(.ant-pagination-item-link) {
  border-radius: 8px;
  border: 1.5px solid #e2e8f0;
  transition: all 0.25s ease;
}

.users-page :deep(.ant-pagination-item-link:hover) {
  border-color: #cbd5e1;
  color: #1e40af;
}

/* ===== Empty State ===== */
.users-page :deep(.ant-empty) {
  padding: 40px 20px;
}

.users-page :deep(.ant-empty-description) {
  color: #94a3b8;
  font-size: 14px;
}

/* ===== Loading ===== */
.users-page :deep(.ant-spin-spinning) {
  color: #1e40af;
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  .users-page {
    padding: 20px 16px;
  }

  .users-topbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .users-actions {
    flex-direction: column;
  }

  .users-search {
    width: 100% !important;
  }

  .users-title {
    order: -1;
  }
}
</style>
