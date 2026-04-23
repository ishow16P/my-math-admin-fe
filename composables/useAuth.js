import { useAdminAuthStore } from '~/stores/auth'

export function useAuth() {
  const { $apiFetch } = useNuxtApp()
  const authStore = useAdminAuthStore()

  async function login(email, password) {
    const res = await $apiFetch('/auth/admin/login', {
      method: 'POST',
      body: { email, password },
    })
    authStore.setAuth(res)
    return res
  }

  async function logout() {
    try {
      if (authStore.token) {
        await $apiFetch('/auth/admin/logout', { method: 'POST' })
      }
    } catch { /* best-effort */ }
    authStore.clearAuth()
  }

  return { login, logout }
}
