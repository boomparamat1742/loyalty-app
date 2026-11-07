import { defineStore } from "pinia"

const getSb = () => {
  const sb = useSupabase()
  if (!sb) throw new Error("Supabase plugin not initialized ($supabase is undefined)")
  return sb
}

let loadPromise = null

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    session: null,
    profile: null, // { id, email, role, points } จากตาราง profiles
    loaded: false,
  }),

  getters: {
    isAdmin: (state) => state.profile?.role === "admin",
  },

  actions: {
    // โหลด session + profile ครั้งเดียว (เรียกซ้ำได้ จะรอผลเดิม)
    load() {
      if (!loadPromise) loadPromise = this._load()
      return loadPromise
    },

    async _load() {
      const supabase = getSb()

      const { data } = await supabase.auth.getSession()
      this.session = data.session
      this.user = data.session?.user || null
      if (this.user) await this.fetchProfile()

      // ห้ามเรียก supabase แบบ await ใน callback นี้ (supabase-js จะค้าง)
      // ให้ล้าง profile ไว้ แล้ว ensureProfile() จะโหลดใหม่ตอนต้องใช้
      supabase.auth.onAuthStateChange((_event, session) => {
        const nextUser = session?.user || null
        if (nextUser?.id !== this.user?.id) this.profile = null
        this.session = session
        this.user = nextUser
      })

      this.loaded = true
    },

    async fetchProfile() {
      if (!this.user) {
        this.profile = null
        return null
      }
      const { data, error } = await getSb()
        .from("profiles")
        .select("id,email,username,role,points")
        .eq("id", this.user.id)
        .single()
      if (error) throw error
      this.profile = data
      return data
    },

    async ensureProfile() {
      if (this.user && this.profile?.id !== this.user.id) await this.fetchProfile()
      return this.profile
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
      this.profile = null
      navigateTo("/auth/login")
    },
  },
})
