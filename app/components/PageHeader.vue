<script setup>
defineProps({
  eyebrow: { type: String, default: "" },
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
})
</script>

<template>
  <header class="page-header fade-up">
    <div class="page-header-text">
      <span v-if="eyebrow" class="eyebrow">{{ eyebrow }}</span>
      <h1 class="display page-title">{{ title }}</h1>
      <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="page-actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px 24px;
  flex-wrap: wrap;
}
.page-header-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.page-title {
  font-size: clamp(26px, 3.2vw, 34px);
}
.page-subtitle {
  margin: 0;
  color: var(--text-2);
}
.page-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
