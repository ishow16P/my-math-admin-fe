<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-4">
          <GraduationCap :size="32" class="text-indigo-600" />
        </div>
        <h1 class="text-2xl font-bold text-slate-800">Math Exam Admin</h1>
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
                @input="errors.email = ''"
                :class="[
                  'w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition placeholder:text-slate-300',
                  errors.email
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-slate-200 focus:ring-indigo-300 focus:border-indigo-300'
                ]"
              />
            </div>
            <p v-if="errors.email" class="mt-1 text-xs text-red-500">{{ errors.email }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">รหัสผ่าน</label>
            <div class="relative">
              <Lock :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="กรอกรหัสผ่าน"
                @input="errors.password = ''"
                :class="[
                  'w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition placeholder:text-slate-300',
                  errors.password
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-slate-200 focus:ring-indigo-300 focus:border-indigo-300'
                ]"
              />
              <button
                type="button"
                tabindex="-1"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                @click="showPassword = !showPassword"
              >
                <Eye v-if="!showPassword" :size="16" />
                <EyeOff v-else :size="16" />
              </button>
            </div>
            <p v-if="errors.password" class="mt-1 text-xs text-red-500">{{ errors.password }}</p>
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
import { AlertTriangle, Eye, EyeOff, GraduationCap, Loader2, Lock, LogIn, Mail } from 'lucide-vue-next'
import { useAdminAuthStore } from '~/stores/auth'

const auth = useAdminAuthStore()
const { login } = useAuth()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
const errors = reactive({ email: '', password: '' })

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate() {
  if (!form.email.trim()) {
    errors.email = 'กรุณากรอกอีเมล'
  } else if (!emailRegex.test(form.email.trim())) {
    errors.email = 'รูปแบบอีเมลไม่ถูกต้อง'
  } else {
    errors.email = ''
  }
  errors.password = form.password ? '' : 'กรุณากรอกรหัสผ่าน'
  return !errors.email && !errors.password
}

async function handleLogin() {
  error.value = ''
  if (!validate()) return
  loading.value = true
  try {
    await login(form.email, form.password)
    router.push('/dashboard')
  } catch (e) {
    const status = e?.status ?? e?.response?.status
    if (status === 401 || status === 400) {
      error.value = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
    } else {
      error.value = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (auth.isLoggedIn) router.push('/dashboard')
})
</script>
