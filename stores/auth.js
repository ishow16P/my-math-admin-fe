import { defineStore } from 'pinia'

export const useAdminAuthStore = defineStore('adminAuth', {
  state: () => ({
    token: null,
    refreshToken: null,
    email: null,
    name: null,
    role: null,
    managedLevels: [],
  }),

  getters: {
    isLoggedIn: (state) => !!state.refreshToken,
    isSuperAdmin: (state) => state.role === 'superadmin',
    canManageLevel: (state) => (level) => {
      if (state.role === 'superadmin') return true
      return state.managedLevels?.includes(level)
    },
  },

  actions: {
    setAuth({ accessToken, refreshToken, admin }) {
      this.token = accessToken
      this.refreshToken = refreshToken
      this.email = admin.email
      this.name = admin.name
      this.role = admin.role
      this.managedLevels = admin.managedLevels || []
    },
    clearAuth() {
      this.$reset()
    },
  },

  persist: {
    pick: ['refreshToken', 'email', 'name', 'role', 'managedLevels'],
  },
})
