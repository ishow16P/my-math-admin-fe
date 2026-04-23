<template>
  <NuxtLayout name="admin">
    <div class="p-6 md:p-8">
      <h1 class="text-xl font-bold text-slate-800 mb-6">ตรวจข้อสอบ</h1>

      <!-- Filters -->
      <div class="flex flex-wrap gap-2 mb-4">
        <button
          v-for="s in ['all', 'submitted', 'graded']"
          :key="s"
          @click="filterStatus = s"
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition"
          :class="filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'"
        >
          {{ statusLabel[s] }}
        </button>
      </div>

      <!-- List -->
      <div class="space-y-3">
        <NuxtLink
          v-for="sub in filteredSubs"
          :key="sub._id"
          :to="`/submissions/${sub._id}`"
          class="block bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-slate-800">{{ sub.studentId?.name || 'N/A' }}</div>
              <div class="text-xs text-slate-400">
                {{ sub.studentId?.studentId }} - {{ levelMap[sub.level] }} - {{ formatDate(sub.createdAt) }}
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div v-if="sub.status === 'graded'" class="text-lg font-bold text-indigo-600">
                {{ sub.totalScore }}
              </div>
              <span
                class="px-2.5 py-1 rounded-full text-xs font-medium"
                :class="sub.status === 'graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
              >
                {{ sub.status === 'graded' ? 'ตรวจแล้ว' : 'รอตรวจ' }}
              </span>
            </div>
          </div>
        </NuxtLink>

        <div v-if="filteredSubs.length === 0" class="text-center py-12 text-slate-400">
          ไม่พบข้อสอบ
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { useApi } from '~/composables/useApi'

definePageMeta({ middleware: 'auth', layout: false })

const { apiFetch } = useApi()
const levelMap = { m1: 'ม.1', m2: 'ม.2', m3: 'ม.3' }
const statusLabel = { all: 'ทั้งหมด', submitted: 'รอตรวจ', graded: 'ตรวจแล้ว' }

const submissions = ref([])
const filterStatus = ref('all')

const filteredSubs = computed(() => {
  if (filterStatus.value === 'all') return submissions.value
  return submissions.value.filter((s) => s.status === filterStatus.value)
})

function formatDate(d) {
  return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  submissions.value = await apiFetch('/submissions')
})
</script>
