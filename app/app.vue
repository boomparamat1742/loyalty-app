<script setup>
import { App as AntApp, ConfigProvider, theme } from "ant-design-vue"
import thTH from "ant-design-vue/es/locale/th_TH"
import dayjs from "dayjs"
import "dayjs/locale/th"
import { useAuthStore } from "~/stores/auth"

dayjs.locale("th")

const auth = useAuthStore()

// ธีม Purple Dark ของ Ant Design (ใช้คู่กับ assets/css/main.css)
const antTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: "#8b5cf6",
    colorInfo: "#8b5cf6",
    colorSuccess: "#34d399",
    colorWarning: "#fbbf24",
    colorError: "#f87171",
    colorLink: "#c4b5fd",
    colorBgBase: "#07050f",
    colorBgContainer: "#110c20",
    colorBgElevated: "#171029",
    colorBorder: "rgba(167, 139, 250, 0.22)",
    colorBorderSecondary: "rgba(167, 139, 250, 0.12)",
    colorText: "#ede9fe",
    colorTextSecondary: "#a9a1c7",
    colorTextTertiary: "#6f6890",
    borderRadius: 8,
    borderRadiusLG: 10,
    borderRadiusSM: 6,
    fontFamily: '"IBM Plex Sans Thai", system-ui, -apple-system, "Segoe UI", sans-serif',
    fontSize: 15,
    controlHeight: 40,
  },
  components: {
    Layout: { bodyBg: "transparent", headerBg: "transparent", siderBg: "transparent" },
    Menu: {
      itemBg: "transparent",
      itemSelectedBg: "rgba(139, 92, 246, 0.16)",
      itemSelectedColor: "#f3eeff",
      itemHoverBg: "rgba(255, 255, 255, 0.04)",
      itemColor: "#b9aed6",
      itemBorderRadius: 6,
    },
    Card: { colorBgContainer: "#110c20" },
    Table: { colorBgContainer: "transparent", headerBg: "rgba(167,139,250,0.04)" },
    Switch: { colorPrimary: "#8b5cf6", colorPrimaryHover: "#a78bfa" },
    Progress: { defaultColor: "#22d3ee" },
  },
}

onMounted(async () => {
  await auth.load()
})
</script>

<template>
  <ConfigProvider :theme="antTheme" :locale="thTH">
    <AntApp>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </AntApp>
  </ConfigProvider>
</template>
