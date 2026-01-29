export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()

  const publicPaths = ["/", "/auth/login", "/auth/register"]
  if (publicPaths.includes(to.path)) return

  if (!auth.loaded) await auth.load()

  if (!auth.user) return navigateTo("/auth/login")

  if (to.path.startsWith("/admin") && auth.profile?.role !== "admin") {
    return navigateTo("/customer")
  }
})
