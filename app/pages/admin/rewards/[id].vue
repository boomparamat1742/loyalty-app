<script setup>
import { DeleteOutlined } from "@ant-design/icons-vue";

definePageMeta({ layout: "admin" });

const supabase = useSupabase();
const route = useRoute();
const { message, modal } = useUi();

const id = computed(() => String(route.params.id || ""));
const saving = ref(false);
const loadingPage = ref(true);
const initial = ref(null);

const load = async () => {
  try {
    loadingPage.value = true;

    const { data, error } = await supabase
      .from("rewards")
      .select("title,description,points_cost,stock,is_active,image_url")
      .eq("id", id.value)
      .single();

    if (error) throw error;

    initial.value = {
      name: data?.title || "",
      description: data?.description || "",
      points_cost: Number(data?.points_cost || 0),
      stock: Number(data?.stock || 0),
      is_active: !!data?.is_active,
      image_url: data?.image_url || "",
    };
  } catch (e) {
    console.error("load reward error:", e);
    message.error(e?.message || "โหลดข้อมูลไม่สำเร็จ");
    navigateTo("/admin/rewards");
  } finally {
    loadingPage.value = false;
  }
};

onMounted(load);

const save = async (payload) => {
  try {
    saving.value = true;

    const { error } = await supabase.from("rewards").update(payload).eq("id", id.value);
    if (error) throw error;

    message.success("บันทึกแล้ว");
    navigateTo("/admin/rewards");
  } catch (e) {
    console.error("save error:", e);
    message.error(e?.message || "บันทึกไม่สำเร็จ");
  } finally {
    saving.value = false;
  }
};

const remove = () => {
  modal.confirm({
    title: "ลบของรางวัลนี้?",
    content: `“${initial.value?.name}” จะถูกลบถาวร และย้อนกลับไม่ได้`,
    okText: "ลบ",
    okType: "danger",
    cancelText: "ยกเลิก",
    async onOk() {
      try {
        const { error } = await supabase.from("rewards").delete().eq("id", id.value);
        if (error) throw error;

        message.success("ลบแล้ว");
        navigateTo("/admin/rewards");
      } catch (e) {
        console.error("delete error:", e);
        message.error(e?.message || "ลบไม่สำเร็จ");
      }
    },
  });
};
</script>

<template>
  <div class="page">
    <PageHeader eyebrow="Edit reward" title="แก้ไขของรางวัล" :subtitle="initial?.name || ''">
      <template #actions>
        <a-button danger :disabled="loadingPage" @click="remove">
          <template #icon><DeleteOutlined /></template> ลบของรางวัล
        </a-button>
      </template>
    </PageHeader>

    <div v-if="loadingPage" class="surface surface-pad"><a-skeleton active :paragraph="{ rows: 6 }" /></div>
    <RewardForm
      v-else
      :initial="initial"
      :submitting="saving"
      submit-text="บันทึกการแก้ไข"
      @submit="save"
      @cancel="navigateTo('/admin/rewards')"
    />
  </div>
</template>
