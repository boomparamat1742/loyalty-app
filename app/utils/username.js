// สมัครด้วย Username: Supabase Auth ต้องมีอีเมล จึงสร้างอีเมลภายในจาก username
// .invalid เป็นโดเมนสงวน (RFC 2606) ไม่มีวันมีอยู่จริง อีเมลจึงไม่ถูกส่งออกไปไหน
// ถ้าเปลี่ยนค่านี้ ผู้ใช้ที่สมัครด้วย username ไปแล้วจะ login ไม่ได้
export const USERNAME_EMAIL_DOMAIN = "rbenz-member.invalid"

// ตรงกับ constraint profiles_username_format ใน database
export const USERNAME_PATTERN = /^[a-z0-9_.]{3,20}$/

export const normalizeUsername = (value) => (value || "").trim().toLowerCase()

export const usernameToEmail = (username) => `${normalizeUsername(username)}@${USERNAME_EMAIL_DOMAIN}`

// ช่อง login รับได้ทั้ง username และอีเมล (ลูกค้าเดิมที่สมัครด้วยอีเมล)
export const loginIdToEmail = (value) => {
  const id = (value || "").trim().toLowerCase()
  return id.includes("@") ? id : usernameToEmail(id)
}

// แปลงอีเมลภายในกลับเป็น username (อีเมลจริงคืนค่าเดิม)
export const emailToLabel = (email) => {
  const value = email || ""
  const suffix = `@${USERNAME_EMAIL_DOMAIN}`
  return value.endsWith(suffix) ? value.slice(0, -suffix.length) : value
}

// ชื่อที่ใช้แสดงของสมาชิก: username ถ้ามี ไม่งั้นใช้อีเมล
export const memberLabel = (profile, fallbackEmail = "") =>
  profile?.username || profile?.email || emailToLabel(fallbackEmail)
