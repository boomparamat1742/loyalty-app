<script setup>
import dayjs from "dayjs";
import { message, Modal } from "ant-design-vue";
import {
  UnlockOutlined,
  LockOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons-vue";

definePageMeta({ layout: "admin" });

const supabase = useSupabase();
const loading = ref(false);
const admins = ref([]);
const q = ref("");
const modalVisible = ref(false);
const editingId = ref(null);

const formData = reactive({
  email: "",
  password: "",
});

const columns = [
  { title: "Email", dataIndex: "email", key: "email", width: "40%" },
  { title: "Status", dataIndex: "status", key: "status", width: "15%" },
  { title: "Last Login", dataIndex: "last_login", key: "last_login", width: "20%" },
  { title: "Created", dataIndex: "created_at", key: "created_at", width: "15%" },
  { title: "Actions", key: "actions", width: "10%", align: "center" },
];

const fetchAdmins = async () => {
  try {
    loading.value = true;

    let query = supabase
      .from("profiles")
      .select("id,email,role,created_at,last_login")
      .eq("role", "admin")
      .order("created_at", { ascending: false });

    if (q.value.trim()) {
      query = query.ilike("email", `%${q.value.trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    admins.value = (data || []).map((admin) => ({
      ...admin,
      status: admin.last_login ? "Active" : "Inactive",
    }));
  } catch (e) {
    console.error(e);
    message.error(e?.message || "Failed to load admins");
  } finally {
    loading.value = false;
  }
};

onMounted(fetchAdmins);

const formatDate = (date) => {
  return date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "Never";
};

const openAddModal = () => {
  editingId.value = null;
  formData.email = "";
  formData.password = "";
  modalVisible.value = true;
};

const handleAddAdmin = async () => {
  if (!formData.email || !formData.password) {
    message.error("Please fill in all fields");
    return;
  }

  try {
    loading.value = true;

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (authError) throw authError;

    // Update profile to admin role
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", authData.user?.id);

    if (profileError) throw profileError;

    message.success("Admin user created successfully");
    modalVisible.value = false;
    await fetchAdmins();
  } catch (e) {
    console.error(e);
    message.error(e?.message || "Failed to create admin");
  } finally {
    loading.value = false;
  }
};

const revokeAdminAccess = (record) => {
  Modal.confirm({
    title: "Revoke Admin Access",
    content: `Remove admin privileges from ${record.email}?`,
    okText: "Revoke",
    okType: "danger",
    cancelText: "Cancel",
    async onOk() {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ role: "customer" })
          .eq("id", record.id);

        if (error) throw error;

        message.success("Admin access revoked");
        await fetchAdmins();
      } catch (e) {
        console.error(e);
        message.error(e?.message || "Failed to revoke access");
      }
    },
  });
};

const deleteAdmin = (record) => {
  Modal.confirm({
    title: "Delete Admin",
    content: `Delete admin user ${record.email}? This action cannot be undone.`,
    okText: "Delete",
    okType: "danger",
    cancelText: "Cancel",
    async onOk() {
      try {
        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("id", record.id);

        if (error) throw error;

        message.success("Admin user deleted");
        await fetchAdmins();
      } catch (e) {
        console.error(e);
        message.error(e?.message || "Failed to delete admin");
      }
    },
  });
};
</script>

<template>
  <div class="management-container">
    <div class="management-header">
      <div>
        <a-typography-title :level="3" style="margin: 0">
          Admin Management
        </a-typography-title>
        <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px">
          Manage administrator accounts and permissions
        </p>
      </div>

      <a-space>
        <a-input
          v-model:value="q"
          placeholder="Search by email..."
          style="width: 240px"
          :prefix-icon="SearchOutlined"
          allowClear
          @pressEnter="fetchAdmins"
        />
        <a-button @click="fetchAdmins" :loading="loading" :icon="ReloadOutlined">
          Refresh
        </a-button>
        <a-button type="primary" @click="openAddModal" :icon="PlusOutlined">
          Add Admin
        </a-button>
      </a-space>
    </div>

    <!-- Admin List Card -->
    <a-card 
      style="border-radius: 12px; border: 1px solid #e5e7eb" 
      :bordered="false"
      :loading="loading"
    >
      <a-table 
        :columns="columns" 
        :dataSource="admins" 
        rowKey="id"
        :pagination="{ pageSize: 10, total: admins.length }"
        size="middle"
      >
        <!-- Status Column -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'Active' ? 'success' : 'default'">
              {{ record.status }}
            </a-tag>
          </template>

          <!-- Last Login Column -->
          <template v-else-if="column.key === 'last_login'">
            <div style="display: flex; align-items: center; gap: 6px">
              <ClockCircleOutlined style="color: #9ca3af" />
              {{ formatDate(record.last_login) }}
            </div>
          </template>

          <!-- Created Column -->
          <template v-else-if="column.key === 'created_at'">
            {{ formatDate(record.created_at) }}
          </template>

          <!-- Actions Column -->
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-tooltip title="Revoke Admin Access">
                <a-button
                  type="text"
                  danger
                  size="small"
                  :icon="LockOutlined"
                  @click="revokeAdminAccess(record)"
                />
              </a-tooltip>
              <a-tooltip title="Delete User">
                <a-button
                  type="text"
                  danger
                  size="small"
                  :icon="DeleteOutlined"
                  @click="deleteAdmin(record)"
                />
              </a-tooltip>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- Add Admin Modal -->
    <a-modal
      v-model:visible="modalVisible"
      title="Add New Admin"
      @ok="handleAddAdmin"
      @cancel="modalVisible = false"
      okText="Create"
      cancelText="Cancel"
    >
      <a-form layout="vertical">
        <a-form-item label="Email Address">
          <a-input
            v-model:value="formData.email"
            type="email"
            placeholder="admin@example.com"
            size="large"
          />
        </a-form-item>

        <a-form-item label="Password">
          <a-input
            v-model:value="formData.password"
            type="password"
            placeholder="Enter secure password"
            size="large"
          />
        </a-form-item>

        <a-alert
          message="New admin will have full access to the system"
          type="info"
          show-icon
          style="margin-top: 16px"
        />
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.management-container {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 24px;
  min-height: 100vh;
  min-height: 100vh;
  border-radius: 8px;
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .management-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
