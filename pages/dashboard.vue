<template>
  <NuxtLayout name="admin">
    <div class="p-6 md:p-8">
      <h1 class="text-xl font-bold text-slate-800 mb-6">แดชบอร์ด</h1>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div v-for="stat in stats" :key="stat.label" class="bg-white rounded-xl border border-slate-200 p-5">
          <div class="flex items-center gap-3">
            <div :class="stat.bgColor" class="w-10 h-10 rounded-lg flex items-center justify-center">
              <component :is="stat.icon" :size="20" :class="stat.textColor" />
            </div>
            <div>
              <div class="text-2xl font-bold text-slate-800">{{ stat.value }}</div>
              <div class="text-xs text-slate-500">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Submissions -->
      <div class="bg-white rounded-xl border border-slate-200">
        <div class="p-4 border-b border-slate-100">
          <h2 class="font-semibold text-slate-800">ข้อสอบที่รอตรวจล่าสุด</h2>
        </div>
        <div v-if="recentSubmissions.length === 0" class="p-8 text-center text-slate-400">
          ไม่มีข้อสอบรอตรวจ
        </div>
        <div v-else class="divide-y divide-slate-100">
          <NuxtLink
            v-for="sub in recentSubmissions"
            :key="sub._id"
            :to="`/submissions/${sub._id}`"
            class="flex items-center justify-between p-4 hover:bg-slate-50 transition"
          >
            <div>
              <div class="font-medium text-slate-800">{{ sub.studentId?.name || 'N/A' }}</div>
              <div class="text-xs text-slate-400">{{ levelMap[sub.level] }} - {{ formatDate(sub.createdAt) }}</div>
            </div>
            <span class="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
              รอตรวจ
            </span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { Users, FileText, ClipboardCheck, CheckCircle2 } from 'lucide-vue-next'
import { useApi } from '~/composables/useApi'

definePageMeta({ middleware: 'auth', layout: false })

const { apiFetch } = useApi()
const levelMap = { m1: 'ม.1', m2: 'ม.2', m3: 'ม.3' }

const stats = ref([
  { label: 'นักเรียน', value: 0, icon: Users, bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
  { label: 'ข้อสอบ', value: 0, icon: FileText, bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
  { label: 'รอตรวจ', value: 0, icon: ClipboardCheck, bgColor: 'bg-amber-100', textColor: 'text-amber-600' },
  { label: 'ตรวจแล้ว', value: 0, icon: CheckCircle2, bgColor: 'bg-emerald-100', textColor: 'text-emerald-600' },
])

const recentSubmissions = ref([])

function formatDate(d) {
  return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  try {
    const [students, questions, submitted, graded] = await Promise.all([
      apiFetch('/students'),
      apiFetch('/questions'),
      apiFetch('/submissions?status=submitted'),
      apiFetch('/submissions?status=graded'),
    ])
    stats.value[0].value = students.length
    stats.value[1].value = questions.length
    stats.value[2].value = submitted.length
    stats.value[3].value = graded.length
    recentSubmissions.value = submitted.slice(0, 5)
  } catch (e) {
    console.error('Dashboard load error:', e)
  }
})
</script>
