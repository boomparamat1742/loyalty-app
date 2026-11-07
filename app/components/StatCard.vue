<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: "-" },
  hint: { type: String, default: "" },
  loading: { type: Boolean, default: false },
  accent: { type: String, default: "violet" }, // violet | cyan
})
</script>

<template>
  <div class="stat surface" :class="{ 'stat-accent': accent !== 'violet' }">
    <div class="stat-top">
      <span class="stat-label">{{ label }}</span>
      <span v-if="$slots.icon" class="stat-icon"><slot name="icon" /></span>
    </div>
    <a-skeleton v-if="loading" active :paragraph="false" :title="{ width: '60%' }" />
    <div v-else class="stat-value num">{{ value }}</div>
    <div v-if="hint" class="stat-hint">{{ hint }}</div>
  </div>
</template>

<style scoped>
.stat {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  overflow: hidden;
}
.stat::after {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(196, 167, 255, 0.5), transparent);
}
.stat-accent::after {
  background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.55), transparent);
}
.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.stat-label {
  font-size: 13px;
  color: var(--text-2);
}
.stat-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--primary-soft);
  color: var(--lavender);
  font-size: 16px;
}
.stat-accent .stat-icon {
  background: var(--accent-soft);
  color: var(--accent);
}
.stat-value {
  font-size: clamp(22px, 2.4vw, 28px);
  font-weight: 600;
  color: var(--text);
  line-height: 1.2;
  word-break: break-word;
}
.stat-accent .stat-value {
  color: var(--accent);
}
.stat-hint {
  font-size: 12px;
  color: var(--text-3);
}

@media (max-width: 520px) {
  .stat {
    padding: 16px;
    gap: 8px;
  }
  .stat-icon {
    display: none;
  }
  .stat-value {
    font-size: 20px;
  }
}
</style>
