<template>
  <div
    style="
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    "
  >
    <a-space direction="vertical" align="center" :size="24">
      <a-qrcode :value="text" :size="300" />

      <a-input
        v-model:value="text"
        placeholder="กรอกข้อความที่นี่"
        :maxlength="500"
        style="width: 300px"
      />
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const text = ref("https://r-benz.app/"); // ✅ ใส่ path ที่มีจริง
</script>
