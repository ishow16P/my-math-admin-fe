import { useAdminAuthStore } from '~/stores/auth'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  let refreshPromise = null

  function getAuthHeaders() {
    const { token } = useAdminAuthStore(nuxtApp.$pinia)
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async function doSilentRefresh() {
    const auth = useAdminAuthStore(nuxtApp.$pinia)
    if (!auth.refreshToken) return false

    if (!refreshPromise) {
      refreshPromise = $fetch('/auth/refresh', {
        baseURL: config.public.apiBase,
        method: 'POST',
        body: { refreshToken: auth.refreshToken },
      }).finally(() => { refreshPromise = null })
    }

    const result = await refreshPromise
    auth.token = result.accessToken
    auth.refreshToken = result.refreshToken
    return true
  }

  async function apiFetch(url, opts = {}) {
    const options = {
      baseURL: config.public.apiBase,
      ...opts,
      headers: {
        ...getAuthHeaders(),
        ...opts.headers,
      },
    }

    try {
      return await $fetch(url, options)
    } catch (error) {
      if (error?.status !== 401) throw error
      if (!import.meta.client) throw error

      const auth = useAdminAuthStore(nuxtApp.$pinia)

      if (!auth.refreshToken) {
        auth.clearAuth()
        await nuxtApp.runWithContext(() => navigateTo('/', { replace: true }))
        throw error
      }

      try {
        await doSilentRefresh()

        return await $fetch(url, {
          ...options,
          headers: {
            ...getAuthHeaders(),
            ...opts.headers,
          },
        })
      } catch {
        auth.clearAuth()
        await nuxtApp.runWithContext(() => navigateTo('/', { replace: true }))
        throw error
      }
    }
  }

  return {
    provide: { apiFetch },
  }
})
