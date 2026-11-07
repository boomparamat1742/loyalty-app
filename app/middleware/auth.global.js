// ตรวจสิทธิ์ทุกหน้า: ต้อง login ก่อน และหน้า /admin ต้องเป็น admin
// ข้อมูลจริงยังมี RLS ใน database ป้องกันอีกชั้น ส่วนนี้กันไม่ให้เปิดหน้าที่ไม่มีสิทธิ์
const PUBLIC_PATHS = ["/", "/auth/login", "/auth/register", "/qrcode"]

export default defineNuxtRouteMiddleware(async (to) => {
  // session เก็บใน localStorage ฝั่ง server จึงไม่รู้ว่าใคร login ให้ตรวจฝั่ง browser
  if (import.meta.server) return

  const auth = useAuthStore()
  if (!auth.loaded) await auth.load()

  if (PUBLIC_PATHS.includes(to.path)) return

  if (!auth.user) return navigateTo("/auth/login")

  if (to.path.startsWith("/admin")) {
    await auth.ensureProfile().catch(() => null)
    if (!auth.isAdmin) return navigateTo("/customer")
  }
})
