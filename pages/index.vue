<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-4">
          <GraduationCap :size="32" class="text-indigo-600" />
        </div>
        <h1 class="text-2xl font-bold text-slate-800">My Math Admin</h1>
        <p class="text-slate-500 mt-1">ระบบจัดการข้อสอบสำหรับคุณครู</p>
      </div>

      <div class="bg-white rounded-2xl shadow-lg p-8">
        <h2 class="text-lg font-semibold text-slate-800 mb-6">เข้าสู่ระบบ</h2>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">อีเมล</label>
            <div class="relative">
              <Mail :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                v-model="form.email"
                type="email"
                placeholder="teacher@mymath.com"
                required
                class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition placeholder:text-slate-300"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">รหัสผ่าน</label>
            <div class="relative">
              <Lock :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                v-model="form.password"
                type="password"
                placeholder="กรอกรหัสผ่าน"
                required
                class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition placeholder:text-slate-300"
              />
            </div>
          </div>

          <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
            <AlertTriangle :size="16" />
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Loader2 v-if="loading" :size="16" class="animate-spin" />
            <LogIn v-else :size="16" />
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { GraduationCap, Mail, Lock, LogIn, Loader2, AlertTriangle } from 'lucide-vue-next'
import { useAdminAuthStore } from '~/stores/auth'

const auth = useAdminAuthStore()
const { login } = useAuth()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await login(form.email, form.password)
    router.push('/dashboard')
  } catch (e) {
    error.value = e?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (auth.isLoggedIn) router.push('/dashboard')
})
</script>
