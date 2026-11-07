<script setup>
import dayjs from "dayjs";
import {
  LockOutlined,
  PlusOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons-vue";

definePageMeta({ layout: "admin" });

const supabase = useSupabase();
const auth = useAuthStore();
const { message, modal } = useUi();

const loading = ref(false);
const saving = ref(false);
const admins = ref([]);
const modalOpen = ref(false);

const formData = reactive({
  email: "",
});

const columns = [
  { title: "ผู้ดูแลระบบ", key: "email" },
  { title: "สถานะ", key: "status", width: 140 },
  { title: "เข้าสู่ระบบล่าสุด", key: "last_sign_in_at", width: 200 },
  { title: "เพิ่มเมื่อ", key: "created_at", width: 150 },
  { title: "", key: "actions", align: "right", width: 80 },
];

const fetchAdmins = async () => {
  try {
    loading.value = true;

    // ดึงจากฟังก์ชันใน database เพราะเวลา login ล่าสุดอยู่ใน auth.users
    const { data, error } = await supabase.rpc("admin_list_admins");
    if (error) throw error;

    admins.value = data || [];
  } catch (e) {
    console.error(e);
    message.error(e?.message || "โหลดรายชื่อผู้ดูแลไม่สำเร็จ");
  } finally {
    loading.value = false;
  }
};

onMounted(fetchAdmins);

const fmtDate = (d) => (d ? dayjs(d).format("D MMM YYYY · HH:mm") : "ยังไม่เคยเข้าใช้");
const isRecent = (d) => d && dayjs().diff(dayjs(d), "day") <= 30;

const openAddModal = () => {
  formData.email = "";
  modalOpen.value = true;
};

// เลื่อนสมาชิกที่สมัครไว้แล้วเป็น admin
// (ไม่สร้างบัญชีใหม่ที่นี่ เพราะ signUp จะทำให้ admin ที่ใช้งานอยู่หลุดไปเป็นบัญชีใหม่)
const handleAddAdmin = async () => {
  const loginId = formData.email.trim().toLowerCase();
  if (!loginId) {
    message.error("กรุณากรอกชื่อผู้ใช้หรืออีเมล");
    return;
  }

  try {
    saving.value = true;

    const { data: member, error: findError } = await supabase
      .from("profiles")
      .select("id,role")
      .eq(loginId.includes("@") ? "email" : "username", loginId)
      .maybeSingle();

    if (findError) throw findError;
    if (!member) {
      message.error("ไม่พบสมาชิกนี้ ให้สมัครสมาชิกก่อน");
      return;
    }
    if (member.role === "admin") {
      message.info("บัญชีนี้เป็นผู้ดูแลระบบอยู่แล้ว");
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", member.id);

    if (profileError) throw profileError;

    message.success("เพิ่มผู้ดูแลระบบแล้ว");
    modalOpen.value = false;
    await fetchAdmins();
  } catch (e) {
    console.error(e);
    message.error(e?.message || "เพิ่มผู้ดูแลไม่สำเร็จ");
  } finally {
    saving.value = false;
  }
};

const revokeAdminAccess = (record) => {
  if (record.id === auth.user?.id) {
    message.warning("ไม่สามารถถอดสิทธิ์ของตัวเองได้");
    return;
  }

  modal.confirm({
    title: "ถอดสิทธิ์ผู้ดูแลระบบ?",
    content: `${memberLabel(record)} จะกลับเป็นลูกค้าทั่วไป`,
    okText: "ถอดสิทธิ์",
    okType: "danger",
    cancelText: "ยกเลิก",
    async onOk() {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ role: "customer" })
          .eq("id", record.id);

        if (error) throw error;

        message.success("ถอดสิทธิ์แล้ว");
        await fetchAdmins();
      } catch (e) {
        console.error(e);
        message.error(e?.message || "ถอดสิทธิ์ไม่สำเร็จ");
      }
    },
  });
};

const isMobile = useIsMobile();
</script>

<template>
  <div class="page">
    <PageHeader eyebrow="Access control" title="ผู้ดูแลระบบ" subtitle="บัญชีที่เข้าถึงหน้าจัดการทั้งหมดได้">
      <template #actions>
        <a-button :loading="loading" @click="fetchAdmins">
          <template #icon><ReloadOutlined /></template> รีเฟรช
        </a-button>
        <a-button type="primary" @click="openAddModal">
          <template #icon><PlusOutlined /></template> เพิ่มผู้ดูแล
        </a-button>
      </template>
    </PageHeader>

    <section class="surface">
      <a-spin v-if="isMobile" :spinning="loading">
        <ul v-if="admins.length" class="m-list">
          <li v-for="r in admins" :key="r.id" class="m-item">
            <div class="m-head">
              <span class="avatar">{{ (memberLabel(r) || "?").charAt(0).toUpperCase() }}</span>
              <span class="m-title">{{ memberLabel(r) }}</span>
              <span v-if="r.id === auth.user?.id" class="chip chip-muted">คุณ</span>
            </div>
            <div class="m-meta">
              <span class="chip" :class="isRecent(r.last_sign_in_at) ? 'chip-success' : 'chip-muted'">
                {{ isRecent(r.last_sign_in_at) ? "ใช้งานอยู่" : "ไม่ได้ใช้งาน" }}
              </span>
              <span>เข้าใช้ล่าสุด {{ fmtDate(r.last_sign_in_at) }}</span>
            </div>
            <div v-if="r.id !== auth.user?.id" class="m-actions">
              <a-button danger @click="revokeAdminAccess(r)">
                <template #icon><LockOutlined /></template> ถอดสิทธิ์ผู้ดูแล
              </a-button>
            </div>
          </li>
        </ul>
        <div v-else-if="!loading" class="empty-block">ยังไม่มีผู้ดูแลระบบ</div>
      </a-spin>
      <a-table
        v-else
        :dataSource="admins"
        :columns="columns"
        rowKey="id"
        :loading="loading"
        :pagination="{ pageSize: 10, hideOnSinglePage: true }"
        :scroll="{ x: 680 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'email'">
            <div class="member">
              <span class="avatar">{{ (memberLabel(record) || "?").charAt(0).toUpperCase() }}</span>
              <span class="member-email">{{ memberLabel(record) }}</span>
              <span v-if="record.id === auth.user?.id" class="chip chip-muted">คุณ</span>
            </div>
          </template>

          <template v-else-if="column.key === 'status'">
            <span class="chip" :class="isRecent(record.last_sign_in_at) ? 'chip-success' : 'chip-muted'">
              {{ isRecent(record.last_sign_in_at) ? "ใช้งานอยู่" : "ไม่ได้ใช้งาน" }}
            </span>
          </template>

          <template v-else-if="column.key === 'last_sign_in_at'">
            <span class="muted"><ClockCircleOutlined /> {{ fmtDate(record.last_sign_in_at) }}</span>
          </template>

          <template v-else-if="column.key === 'created_at'">
            <span class="muted">{{ dayjs(record.created_at).format("D MMM YYYY") }}</span>
          </template>

          <template v-else-if="column.key === 'actions'">
            <a-tooltip title="ถอดสิทธิ์ผู้ดูแล">
              <a-button
                type="text"
                danger
                aria-label="ถอดสิทธิ์ผู้ดูแล"
                :disabled="record.id === auth.user?.id"
                @click="revokeAdminAccess(record)"
              >
                <template #icon><LockOutlined /></template>
              </a-button>
            </a-tooltip>
          </template>
        </template>
      </a-table>
    </section>

    <a-modal
      v-model:open="modalOpen"
      title="เพิ่มผู้ดูแลระบบ"
      okText="ให้สิทธิ์ผู้ดูแล"
      cancelText="ยกเลิก"
      :confirmLoading="saving"
      @ok="handleAddAdmin"
    >
      <a-form layout="vertical" @submit.prevent="handleAddAdmin">
        <a-form-item label="ชื่อผู้ใช้ หรือ อีเมลของสมาชิก">
          <a-input v-model:value="formData.email" size="large" autocapitalize="none" placeholder="username หรือ member@example.com" />
        </a-form-item>
      </a-form>
      <div class="notice">
        <InfoCircleOutlined />
        <span>บุคคลนั้นต้องสมัครสมาชิกก่อน และจะเข้าถึงหน้าจัดการทั้งหมดได้หลังได้รับสิทธิ์</span>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.member {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.avatar {
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--grad-primary);
  color: #fff;
  font-weight: 600;
  font-size: 13px;
}
.member-email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.notice {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13px;
  color: var(--text-2);
  background: var(--primary-soft);
  border: 1px solid var(--border-strong);
}
.notice :deep(.anticon) {
  margin-top: 3px;
  color: var(--lavender);
}
</style>
