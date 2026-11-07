<script setup>
defineProps({
  to: { type: String, default: "/" },
  compact: { type: Boolean, default: false },
  caption: { type: String, default: "ฟิล์มม่วง แปดริ้ว" },
})
</script>

<template>
  <NuxtLink :to="to" class="brand" :aria-label="'R.Benz ' + caption">
    <span class="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 32 32" width="20" height="20">
        <path d="M16 3 28 10v12L16 29 4 22V10z" fill="none" stroke="currentColor" stroke-width="1.6" />
        <path d="M16 9 22 12.5v7L16 23l-6-3.5v-7z" fill="currentColor" opacity=".85" />
      </svg>
    </span>
    <span v-if="!compact" class="brand-text">
      <span class="brand-name">R.Benz</span>
      <span class="brand-caption">{{ caption }}</span>
    </span>
  </NuxtLink>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--text);
}
.brand-mark {
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #fff;
  background: var(--grad-primary);
  box-shadow: var(--shadow-glow), inset 0 1px 0 rgba(255, 255, 255, 0.25);
}
.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.brand-name {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.06em;
}
.brand-caption {
  font-family: var(--font-mono);
  margin-top: 3px;
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--text-3);
}
</style>
