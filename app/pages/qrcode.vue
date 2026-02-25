<template>
  <a-space direction="vertical" align="center">
    <a-qrcode :value="text" />
    <a-input v-model:value="text" placeholder="-" :maxlength="120" />
  </a-space>
</template>

<script setup lang="ts">
import { ref } from "vue";

const text = ref("/customer"); // ✅ ใส่ path ที่มีจริง
</script>
