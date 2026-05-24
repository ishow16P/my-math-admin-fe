<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6">
    <div class="text-center max-w-sm">
      <div class="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Search :size="36" class="text-indigo-500" />
      </div>
      <h1 class="text-6xl font-black text-slate-200 mb-2">{{ error?.statusCode || 404 }}</h1>
      <h2 class="text-xl font-bold text-slate-700 mb-2">
        {{ error?.statusCode === 403 ? 'ไม่มีสิทธิ์เข้าถึง' : 'ไม่พบหน้านี้' }}
      </h2>
      <p class="text-sm text-slate-400 mb-8">
        {{ error?.statusCode === 403
          ? 'บัญชีของคุณไม่มีสิทธิ์เข้าถึงส่วนนี้'
          : 'หน้าที่คุณกำลังมองหาไม่มีอยู่ในระบบ' }}
      </p>
      <button @click="handleError" class="text-sm text-indigo-600 underline underline-offset-4 hover:text-indigo-800 transition">
        กลับหน้าหลัก
      </button>
    </div>
  </div>
</template>

<script setup>
import { Search } from 'lucide-vue-next'

defineProps({ error: Object })

function handleError() {
  clearError({ redirect: '/' }).catch(() => {
    window.location.href = '/'
  })
}
</script>
