export default defineNuxtRouteMiddleware(async (to) => {
  const publicPages = ["/", "/auth/login", "/auth/register"]
  if (publicPages.includes(to.path)) return

  const supabase = useSupabase()

  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData.session?.user

  if (!user) {
    return navigateTo("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile) {
    return navigateTo("/auth/login")
  }

  if (to.path.startsWith("/admin") && profile.role !== "admin") {
    return navigateTo("/customer")
  }
})
