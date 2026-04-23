export function useApi() {
  const { $apiFetch } = useNuxtApp()

  function apiFetch(url, options = {}) {
    return $apiFetch(url, options)
  }

  return { apiFetch }
}
