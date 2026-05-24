import { reactive } from 'vue'

const state = reactive({
  visible: false,
  title: '',
  message: '',
  confirmLabel: 'ยืนยัน',
  confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
  danger: true,
  resolve: null,
})

export function useConfirm() {
  function confirm({ title = 'ยืนยัน', message = '', confirmLabel = 'ยืนยัน', danger = true } = {}) {
    state.title = title
    state.message = message
    state.confirmLabel = confirmLabel
    state.danger = danger
    state.confirmClass = danger
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
    state.visible = true
    return new Promise((resolve) => {
      state.resolve = resolve
    })
  }

  function onConfirm() {
    state.visible = false
    state.resolve?.(true)
  }

  function onCancel() {
    state.visible = false
    state.resolve?.(false)
  }

  return { state, confirm, onConfirm, onCancel }
}
