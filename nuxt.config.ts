// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@pinia/nuxt"],
  // SPA: session ของ Supabase อยู่ใน localStorage และ Ant Design โหลดฝั่ง browser
  // render บน server จึงได้หน้าที่ไม่ตรงกับ browser (ปุ่ม/การ์ดหาย)
  ssr: false,
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      htmlAttrs: { lang: "th" },
      title: "R.Benz Rewards — ฟิล์มม่วง แปดริ้ว",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#07050f" },
        {
          name: "description",
          content: "สะสมแต้มทุกการซื้อฟิล์มและเคสที่ R.Benz ฟิล์มม่วง แปดริ้ว แลกของรางวัลพรีเมียมได้ทันที",
        },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap",
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
})
