import { useAdminAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return

  const auth = useAdminAuthStore()
  if (!auth.isLoggedIn) {
    return navigateTo('/')
  }
})
