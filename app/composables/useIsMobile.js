// true เมื่อจอแคบ (สมาร์ทโฟน) ใช้สลับตารางเป็นการ์ดรายการ
export const useIsMobile = (query = "(max-width: 640px)") => {
  const isMobile = ref(false)
  let mql

  const update = () => (isMobile.value = mql.matches)

  onMounted(() => {
    mql = window.matchMedia(query)
    update()
    mql.addEventListener("change", update)
  })

  onBeforeUnmount(() => mql?.removeEventListener("change", update))

  return isMobile
}
