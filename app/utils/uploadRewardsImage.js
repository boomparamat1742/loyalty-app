export const uploadRewardsImage = async (supabase, file) => {
  // สร้าง path: rewards/<userId>/<timestamp>_<filename>
  const { data: u } = await supabase.auth.getUser()
  const userId = u?.user?.id || "anon"

  const ext = (file.name.split(".").pop() || "png").toLowerCase()
  const safeName = file.name.replace(/[^\w.\-]+/g, "_")
  const path = `${userId}/${Date.now()}_${safeName}`

  const { error: upErr } = await supabase.storage
    .from("reward-images")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || `image/${ext}`,
    })

  if (upErr) throw upErr

  // ถ้า bucket public
  const { data } = supabase.storage.from("reward-images").getPublicUrl(path)
  return { publicUrl: data.publicUrl, path }
}
