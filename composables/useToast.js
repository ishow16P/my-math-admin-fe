import { ref } from 'vue'

const toasts = ref([])
let nextId = 0

function add(type, message, duration = 4000) {
  const id = ++nextId
  toasts.value.push({ id, type, message })
  setTimeout(() => remove(id), duration)
}

function remove(id) {
  const idx = toasts.value.findIndex((t) => t.id === id)
  if (idx !== -1) toasts.value.splice(idx, 1)
}

export function useToast() {
  return {
    toasts,
    success: (msg) => add('success', msg),
    error: (msg) => add('error', msg),
    info: (msg) => add('info', msg),
    remove,
  }
}
