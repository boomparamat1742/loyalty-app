<script setup>
import dayjs from "dayjs";
import {
  SearchOutlined,
  ReloadOutlined,
  TeamOutlined,
  SafetyOutlined,
  CrownOutlined,
  KeyOutlined,
  CopyOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons-vue";

definePageMeta({ layout: "admin" });

const supabase = useSupabase();
const auth = useAuthStore();
const { message, modal } = useUi();

const loading = ref(false);
const rows = ref([]);
const q = ref("");
const roleFilter = ref("all");

const fmtDate = (d) => (d ? dayjs(d).format("D MMM YYYY") : "-");

const columns = [
  { title: "สมาชิก", key: "email" },
  { title: "สิทธิ์", key: "role", width: 130 },
  { title: "แต้มคงเหลือ", key: "points", align: "right", width: 140 },
  { title: "สมัครเมื่อ", key: "created_at", width: 150 },
  { title: "", key: "action", align: "right", width: 300 },
];

const fetchUsers = async () => {
  try {
    loading.value = true;
    let query = supabase
      .from("profiles")
      .select("id,email,username,role,points,created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    // ค้นได้ทั้งอีเมลและ username (ตัดอักขระที่ใช้ในตัวกรองของ PostgREST ออก)
    const keyword = q.value.trim().replace(/[,()%*]/g, "");
    if (keyword) query = query.or(`email.ilike.%${keyword}%,username.ilike.%${keyword}%`);
    const { data, error } = await query;
    if (error) throw error;
    rows.value = data || [];
  } catch (e) {
    console.error(e);
    message.error(e?.message || "โหลดผู้ใช้ไม่สำเร็จ");
  } finally {
    loading.value = false;
  }
};

onMounted(fetchUsers);

const filtered = computed(() =>
  roleFilter.value === "all" ? rows.value : rows.value.filter((r) => r.role === roleFilter.value),
);
const counts = computed(() => ({
  all: rows.value.length,
  customer: rows.value.filter((r) => r.role === "customer").length,
  admin: rows.value.filter((r) => r.role === "admin").length,
}));
const totalPoints = computed(() =>
  rows.value.filter((r) => r.role === "customer").reduce((s, r) => s + Number(r.points || 0), 0),
);

const setRole = (record, nextRole) => {
  if (!record?.id) return;
  if (record.id === auth.user?.id) return message.warning("ห้ามเปลี่ยนสิทธิ์ของตัวเอง");

  const toAdmin = nextRole === "admin";
  modal.confirm({
    title: toAdmin ? "ตั้งเป็นผู้ดูแลระบบ?" : "ถอดสิทธิ์ผู้ดูแลระบบ?",
    content: toAdmin
      ? `${memberLabel(record)} จะเข้าถึงหน้าจัดการทั้งหมดได้`
      : `${memberLabel(record)} จะกลับเป็นลูกค้าทั่วไป`,
    okText: "ยืนยัน",
    cancelText: "ยกเลิก",
    okType: toAdmin ? "primary" : "danger",
    async onOk() {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ role: nextRole })
          .eq("id", record.id);
        if (error) throw error;
        record.role = nextRole;
        message.success("อัปเดตสิทธิ์แล้ว");
      } catch (e) {
        console.error(e);
        message.error(e?.message || "อัปเดตสิทธิ์ไม่สำเร็จ");
      }
    },
  });
};

// ---------- รีเซ็ตรหัสผ่าน (database function admin_reset_password) ----------
const resetOpen = ref(false);
const resetTarget = ref(null);
const resetPassword = ref("");
const resetting = ref(false);
const resetDone = ref(false);

// ตัด 0/O, 1/l/I ออก ให้อ่านบอกลูกค้าได้ไม่สับสน
const PASSWORD_CHARS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
const generatePassword = (length = 8) => {
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (b) => PASSWORD_CHARS[b % PASSWORD_CHARS.length]).join("");
};

const canReset = (record) => record.role === "customer" && record.id !== auth.user?.id;

const openReset = (record) => {
  resetTarget.value = record;
  resetPassword.value = generatePassword();
  resetDone.value = false;
  resetOpen.value = true;
};

const submitReset = async () => {
  const password = resetPassword.value.trim();
  if (password.length < 6) return message.warning("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");

  try {
    resetting.value = true;
    const { error } = await supabase.rpc("admin_reset_password", {
      p_user_id: resetTarget.value.id,
      p_new_password: password,
    });
    if (error) throw error;
    resetPassword.value = password;
    resetDone.value = true;
  } catch (e) {
    console.error(e);
    message.error(e?.message || "รีเซ็ตรหัสผ่านไม่สำเร็จ");
  } finally {
    resetting.value = false;
  }
};

const copyPassword = async () => {
  try {
    await navigator.clipboard.writeText(resetPassword.value);
    message.success("คัดลอกรหัสผ่านแล้ว");
  } catch {
    message.warning("คัดลอกไม่สำเร็จ กรุณาจดรหัสผ่านด้วยตัวเอง");
  }
};

const closeReset = () => {
  resetOpen.value = false;
  resetPassword.value = "";
  resetTarget.value = null;
};

// มือถือ: แสดงเป็นการ์ดทีละ 20 รายการ
const isMobile = useIsMobile();
const mobileLimit = ref(20);
watch(filtered, () => (mobileLimit.value = 20));
</script>

<template>
  <div class="page">
    <PageHeader eyebrow="Members" title="สมาชิก" subtitle="รายชื่อลูกค้า แต้มคงเหลือ และสิทธิ์การใช้งาน">
      <template #actions>
        <a-button :loading="loading" @click="fetchUsers">
          <template #icon><ReloadOutlined /></template> รีเฟรช
        </a-button>
      </template>
    </PageHeader>

    <div class="stats">
      <StatCard label="ลูกค้าทั้งหมด" :value="counts.customer.toLocaleString()" :loading="loading">
        <template #icon><TeamOutlined /></template>
      </StatCard>
      <StatCard label="ผู้ดูแลระบบ" :value="counts.admin.toLocaleString()" :loading="loading">
        <template #icon><SafetyOutlined /></template>
      </StatCard>
      <StatCard label="แต้มคงค้างในระบบ" :value="totalPoints.toLocaleString()" hint="รวมแต้มของลูกค้าทุกคน" :loading="loading" accent="cyan">
        <template #icon><CrownOutlined /></template>
      </StatCard>
    </div>

    <section class="surface">
      <div class="surface-header toolbar">
        <a-segmented
          v-model:value="roleFilter"
          :options="[
            { label: `ทั้งหมด (${counts.all})`, value: 'all' },
            { label: `ลูกค้า (${counts.customer})`, value: 'customer' },
            { label: `ผู้ดูแล (${counts.admin})`, value: 'admin' },
          ]"
        />
        <a-input
          v-model:value="q"
          placeholder="ค้นหาชื่อผู้ใช้หรืออีเมล แล้วกด Enter"
          allow-clear
          class="search"
          @pressEnter="fetchUsers"
          @change="(e) => !e.target.value && fetchUsers()"
        >
          <template #prefix><SearchOutlined class="subtle" /></template>
        </a-input>
      </div>

      <a-spin v-if="isMobile" :spinning="loading">
        <ul v-if="filtered.length" class="m-list">
          <li v-for="r in filtered.slice(0, mobileLimit)" :key="r.id" class="m-item">
            <div class="m-head">
              <span class="avatar">{{ (memberLabel(r) || "?").charAt(0).toUpperCase() }}</span>
              <span class="m-title">{{ memberLabel(r) }}</span>
              <span class="num" :class="{ 'text-accent': r.points > 0 }">{{ Number(r.points || 0).toLocaleString() }}</span>
            </div>
            <div class="m-meta">
              <span class="chip" :class="r.role === 'admin' ? '' : 'chip-muted'">{{ r.role === "admin" ? "ผู้ดูแล" : "ลูกค้า" }}</span>
              <span class="chip chip-muted">{{ r.username ? "username" : "อีเมล" }}</span>
              <span v-if="r.id === auth.user?.id" class="chip chip-muted">คุณ</span>
              <span>สมัคร {{ fmtDate(r.created_at) }}</span>
            </div>
            <div v-if="r.id !== auth.user?.id" class="m-actions">
              <a-button v-if="canReset(r)" @click="openReset(r)">
                <template #icon><KeyOutlined /></template> รีเซ็ตรหัสผ่าน
              </a-button>
              <a-button :danger="r.role === 'admin'" @click="setRole(r, r.role === 'admin' ? 'customer' : 'admin')">
                {{ r.role === "admin" ? "ถอดสิทธิ์ผู้ดูแล" : "ตั้งเป็นผู้ดูแล" }}
              </a-button>
            </div>
          </li>
        </ul>
        <div v-else-if="!loading" class="empty-block">ไม่พบสมาชิก</div>
        <div v-if="filtered.length > mobileLimit" class="m-more">
          <a-button block @click="mobileLimit += 20">ดูเพิ่ม ({{ filtered.length - mobileLimit }} คน)</a-button>
        </div>
      </a-spin>
      <a-table
        v-else
        :dataSource="filtered"
        :columns="columns"
        rowKey="id"
        :loading="loading"
        :pagination="{ pageSize: 12, hideOnSinglePage: true }"
        :scroll="{ x: 720 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'email'">
            <div class="member">
              <span class="avatar">{{ (memberLabel(record) || "?").charAt(0).toUpperCase() }}</span>
              <span class="member-email">{{ memberLabel(record) }}</span>
              <span class="chip chip-muted">{{ record.username ? "username" : "อีเมล" }}</span>
              <span v-if="record.id === auth.user?.id" class="chip chip-muted">คุณ</span>
            </div>
          </template>
          <template v-else-if="column.key === 'role'">
            <span class="chip" :class="record.role === 'admin' ? '' : 'chip-muted'">
              {{ record.role === "admin" ? "ผู้ดูแล" : "ลูกค้า" }}
            </span>
          </template>
          <template v-else-if="column.key === 'points'">
            <span class="num" :class="{ 'text-accent': record.points > 0 }">{{ Number(record.points || 0).toLocaleString() }}</span>
          </template>
          <template v-else-if="column.key === 'created_at'">
            <span class="muted">{{ fmtDate(record.created_at) }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <div class="row-actions">
              <a-button v-if="canReset(record)" size="small" @click="openReset(record)">
                <template #icon><KeyOutlined /></template> รีเซ็ตรหัสผ่าน
              </a-button>
              <a-button
                size="small"
                :danger="record.role === 'admin'"
                :disabled="record.id === auth.user?.id"
                @click="setRole(record, record.role === 'admin' ? 'customer' : 'admin')"
              >
                {{ record.role === "admin" ? "ถอดสิทธิ์ผู้ดูแล" : "ตั้งเป็นผู้ดูแล" }}
              </a-button>
            </div>
          </template>
        </template>
        <template #emptyText>
          <div class="empty-block">ไม่พบสมาชิก</div>
        </template>
      </a-table>
    </section>

    <a-modal
      :open="resetOpen"
      :title="resetDone ? 'ตั้งรหัสผ่านใหม่แล้ว' : 'รีเซ็ตรหัสผ่าน'"
      :maskClosable="!resetting"
      :closable="!resetting"
      :footer="null"
      @cancel="closeReset"
    >
      <template v-if="resetTarget">
        <div class="reset-member">
          <span class="avatar">{{ (memberLabel(resetTarget) || "?").charAt(0).toUpperCase() }}</span>
          <div>
            <div class="member-email">{{ memberLabel(resetTarget) }}</div>
            <div class="subtle reset-sub">
              เข้าสู่ระบบด้วย{{ resetTarget.username ? "ชื่อผู้ใช้" : "อีเมล" }}นี้
            </div>
          </div>
        </div>

        <!-- ขั้นที่ 1: ตั้งรหัสใหม่ -->
        <template v-if="!resetDone">
          <a-form layout="vertical" @submit.prevent="submitReset">
            <a-form-item label="รหัสผ่านใหม่" extra="อย่างน้อย 6 ตัวอักษร · ระบบสุ่มให้แล้ว แก้เองได้">
              <div class="pw-row">
                <a-input v-model:value="resetPassword" size="large" class="mono" :maxlength="72" />
                <a-tooltip title="สุ่มรหัสใหม่">
                  <a-button size="large" aria-label="สุ่มรหัสใหม่" @click="resetPassword = generatePassword()">
                    <template #icon><ThunderboltOutlined /></template>
                  </a-button>
                </a-tooltip>
              </div>
            </a-form-item>
          </a-form>
          <p class="subtle reset-note">
            ลูกค้าจะถูกออกจากระบบทุกอุปกรณ์ และต้องใช้รหัสใหม่นี้เข้าสู่ระบบ
          </p>
          <div class="reset-actions">
            <a-button :disabled="resetting" @click="closeReset">ยกเลิก</a-button>
            <a-button type="primary" :loading="resetting" @click="submitReset">ตั้งรหัสผ่านใหม่</a-button>
          </div>
        </template>

        <!-- ขั้นที่ 2: แสดงรหัสให้แจ้งลูกค้า -->
        <template v-else>
          <div class="pw-result">
            <span class="eyebrow">New password</span>
            <div class="pw-value mono">{{ resetPassword }}</div>
          </div>
          <p class="subtle reset-note">
            แจ้งรหัสนี้ให้ลูกค้าโดยตรง ระบบจะไม่แสดงรหัสนี้อีกหลังปิดหน้าต่าง
          </p>
          <div class="reset-actions">
            <a-button @click="copyPassword"><template #icon><CopyOutlined /></template> คัดลอก</a-button>
            <a-button type="primary" @click="closeReset">เสร็จสิ้น</a-button>
          </div>
        </template>
      </template>
    </a-modal>
  </div>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.toolbar {
  flex-wrap: wrap;
}
.search {
  max-width: 300px;
}
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
  background: var(--primary-soft);
  color: var(--lavender);
  font-weight: 600;
  font-size: 13px;
}
.member-email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row-actions {
  display: inline-flex;
  gap: 8px;
}
.reset-member {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  margin: 12px 0 20px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: rgba(167, 139, 250, 0.04);
}
.reset-sub,
.reset-note {
  font-size: 12.5px;
}
.reset-note {
  margin: 0 0 20px;
}
.pw-row {
  display: flex;
  gap: 8px;
}
.pw-result {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px;
  margin-bottom: 12px;
  border-radius: 8px;
  border: 1px solid rgba(34, 211, 238, 0.4);
  background: var(--accent-soft);
}
.pw-value {
  font-size: 26px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--accent);
  text-shadow: var(--glow-accent);
  word-break: break-all;
}
.reset-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 900px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .stats > :last-child {
    grid-column: span 2;
  }
}
@media (max-width: 560px) {
  .search {
    max-width: none;
    width: 100%;
  }
}
</style>
