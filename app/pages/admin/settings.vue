<script setup>
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  CrownOutlined,
  DatabaseOutlined,
  CloudDownloadOutlined,
} from "@ant-design/icons-vue";

definePageMeta({ layout: "admin" });

// หน้านี้แสดงข้อมูลจริงของระบบ (อ่านอย่างเดียว)
// กติกาแต้มกำหนดไว้ใน database: database/2026-11-07_secure_points.sql
const supabase = useSupabase();
const config = useRuntimeConfig();

const checking = ref(false);
const status = ref({ ok: null, latency: 0, error: "" });

const projectHost = computed(() => {
  try {
    return new URL(config.public.supabaseUrl).host;
  } catch {
    return "-";
  }
});

const checkConnection = async () => {
  checking.value = true;
  const started = performance.now();
  try {
    const { error } = await supabase.from("rewards").select("id", { count: "exact", head: true });
    if (error) throw error;
    status.value = { ok: true, latency: Math.round(performance.now() - started), error: "" };
  } catch (e) {
    status.value = { ok: false, latency: 0, error: e?.message || "เชื่อมต่อไม่สำเร็จ" };
  } finally {
    checking.value = false;
  }
};

onMounted(checkConnection);

const rules = [
  { label: "อัตราการได้แต้ม", value: "10 บาท = 1 แต้ม", note: "ปัดเศษลง คำนวณโดย database ทุกครั้ง" },
  { label: "ลูกค้าบันทึกการซื้อเอง", value: "สูงสุด 10 รายการ / วัน", note: "นับตามวันในเวลาประเทศไทย" },
  { label: "ยอดเงินต่อรายการ", value: "ไม่จำกัด", note: "ต้องมากกว่า 0 บาท" },
  { label: "การแก้แต้มและสิทธิ์", value: "เฉพาะผู้ดูแลระบบ", note: "ลูกค้าแก้ไขแต้มหรือ role ของตัวเองไม่ได้" },
];
</script>

<template>
  <div class="page">
    <PageHeader eyebrow="System" title="ข้อมูลระบบ" subtitle="สถานะการเชื่อมต่อ กติกาแต้ม และการสำรองข้อมูล" />

    <div class="grid">
      <section class="surface">
        <div class="surface-header">
          <h2 class="surface-title"><DatabaseOutlined /> การเชื่อมต่อฐานข้อมูล</h2>
          <a-button size="small" :loading="checking" @click="checkConnection">
            <template #icon><ReloadOutlined /></template> ตรวจสอบ
          </a-button>
        </div>
        <div class="surface-pad status">
          <div class="status-main">
            <CheckCircleOutlined v-if="status.ok" class="ok" />
            <CloseCircleOutlined v-else-if="status.ok === false" class="bad" />
            <a-spin v-else size="small" />
            <div>
              <div class="status-title">
                {{ status.ok ? "เชื่อมต่อปกติ" : status.ok === false ? "เชื่อมต่อไม่ได้" : "กำลังตรวจสอบ..." }}
              </div>
              <div class="subtle status-sub">
                {{ status.ok ? `ตอบกลับใน ${status.latency} ms` : status.error }}
              </div>
            </div>
          </div>
          <dl class="kv">
            <div><dt class="subtle">ผู้ให้บริการ</dt><dd>Supabase</dd></div>
            <div><dt class="subtle">โปรเจกต์</dt><dd class="mono">{{ projectHost }}</dd></div>
          </dl>
        </div>
      </section>

      <section class="surface">
        <div class="surface-header">
          <h2 class="surface-title"><CloudDownloadOutlined /> การสำรองข้อมูล</h2>
        </div>
        <div class="surface-pad backup">
          <p class="muted">
            สำรองข้อมูลทั้งหมด (ตาราง ข้อมูลสมาชิก และรูปของรางวัล) ลงเครื่อง
            ด้วยคำสั่งนี้ในโฟลเดอร์โปรเจกต์
          </p>
          <code class="cmd">bash scripts/backup-db.sh</code>
          <p class="subtle small">ไฟล์จะอยู่ใน <span class="mono">backups/</span> แนะนำให้ทำอย่างน้อยสัปดาห์ละครั้ง และเก็บสำเนาไว้นอกเครื่อง</p>
        </div>
      </section>
    </div>

    <section class="surface">
      <div class="surface-header">
        <h2 class="surface-title"><CrownOutlined /> กติกาแต้ม</h2>
        <span class="subtle small">กำหนดใน database · แก้ไขผ่านหน้านี้ไม่ได้</span>
      </div>
      <ul class="rules">
        <li v-for="r in rules" :key="r.label">
          <div>
            <div class="rule-label">{{ r.label }}</div>
            <div class="subtle small">{{ r.note }}</div>
          </div>
          <span class="chip">{{ r.value }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}
.surface-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.status {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.status-main {
  display: flex;
  align-items: center;
  gap: 14px;
}
.status-main .anticon {
  font-size: 28px;
}
.ok {
  color: var(--success);
}
.bad {
  color: var(--danger);
}
.status-title {
  font-weight: 600;
}
.status-sub,
.small {
  font-size: 13px;
}
.kv {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.kv div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}
.kv dd {
  margin: 0;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mono {
  font-family: var(--font-mono);
  font-size: 13px;
}
.backup p {
  margin: 0;
}
.cmd {
  display: block;
  margin: 14px 0;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--lavender);
  font-family: var(--font-mono);
  font-size: 13px;
  overflow-x: auto;
}
.rules {
  list-style: none;
  margin: 0;
  padding: 4px 24px;
}
.rules li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border);
}
.rules li:last-child {
  border-bottom: 0;
}
.rule-label {
  font-weight: 500;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 520px) {
  .rules {
    padding: 4px 18px;
  }
  .rules li {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
