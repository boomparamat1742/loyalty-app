import { defineStore } from "pinia"

const getSb = () => {
  const sb = useSupabase()
  if (!sb) throw new Error("Supabase plugin not initialized ($supabase is undefined)")
  return sb
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    session: null,
    loading: true,
  }),

  actions: {
    async init() {
      const supabase = getSb()

      const { data } = await supabase.auth.getSession()
      this.session = data.session
      this.user = data.session?.user || null
      this.loading = false

      supabase.auth.onAuthStateChange((_event, session) => {
        this.session = session
        this.user = session?.user || null
      })
    },

    async login(email, password) {
      const supabase = getSb()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    },

    async register(email, password) {
      const supabase = getSb()
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
    },

    async logout() {
      const supabase = getSb()
      await supabase.auth.signOut()
      this.user = null
      this.session = null
      navigateTo("/auth/login")
    },
  },
})
