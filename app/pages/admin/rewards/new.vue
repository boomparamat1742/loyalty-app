<script setup>
definePageMeta({ layout: "admin" });

const supabase = useSupabase();
const { message } = useUi();
const saving = ref(false);

const save = async (payload) => {
  try {
    saving.value = true;

    const { error } = await supabase.from("rewards").insert(payload).select("id").single();
    if (error) throw error;

    message.success("เพิ่มของรางวัลแล้ว");
    await navigateTo("/admin/rewards");
  } catch (e) {
    console.error("save error:", e);
    message.error(e?.message || "บันทึกไม่สำเร็จ");
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="page">
    <PageHeader eyebrow="New reward" title="เพิ่มของรางวัล" subtitle="สร้างของรางวัลใหม่ให้ลูกค้าใช้แต้มแลก" />
    <RewardForm
      :submitting="saving"
      submit-text="เพิ่มของรางวัล"
      @submit="save"
      @cancel="navigateTo('/admin/rewards')"
    />
  </div>
</template>
