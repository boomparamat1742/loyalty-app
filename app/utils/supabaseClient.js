import { createClient } from "@supabase/supabase-js"

export const createSupabaseClient = () => {
  const config = useRuntimeConfig()
  return createClient(config.public.supabaseUrl, config.public.supabaseAnonKey)
}
