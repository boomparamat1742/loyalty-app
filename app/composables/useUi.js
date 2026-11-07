import { App } from "ant-design-vue"

// message / modal ที่ใช้ธีม Purple Dark (ตัว static `message` และ `Modal.confirm` ไม่รับธีมจาก ConfigProvider)
// เรียกใน <script setup> เท่านั้น
export const useUi = () => {
  const { message, modal, notification } = App.useApp()
  return { message, modal, notification }
}
