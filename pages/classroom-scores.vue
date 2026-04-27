<template>
  <NuxtLayout name="admin">
    <div class="p-6 md:p-8">
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 class="text-xl font-bold text-slate-800">คะแนนรายห้อง</h1>
      </div>

      <!-- Filter -->
      <div class="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div class="flex flex-wrap gap-3">
          <div class="flex-1 min-w-[140px]">
            <label for="filter-level" class="block text-sm font-medium text-slate-700 mb-1">ระดับ</label>
            <select id="filter-level" v-model="filterLevel" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
              <option v-for="lvl in availableLevels" :key="lvl" :value="lvl">{{ levelMap[lvl] }}</option>
            </select>
          </div>
          <div class="flex-1 min-w-[140px]">
            <label for="filter-classroom" class="block text-sm font-medium text-slate-700 mb-1">เลขห้อง (ไม่บังคับ)</label>
            <input id="filter-classroom" v-model.number="filterClassroom" type="number" min="1" placeholder="เช่น 3" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div class="flex items-end gap-2">
            <button
              @click="loadScores"
              :disabled="loading"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
            >
              โหลด
            </button>
            <button
              @click="exportCSV"
              :disabled="!scores.length"
              class="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              <Download :size="14" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <Loader2 :size="24" class="animate-spin text-indigo-500" />
      </div>

      <!-- Table -->
      <div v-else-if="scores.length > 0" class="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-500">
            <tr>
              <th class="text-left px-4 py-3 font-medium">ลำดับ</th>
              <th class="text-left px-4 py-3 font-medium">รหัส</th>
              <th class="text-left px-4 py-3 font-medium">ชื่อ-นามสกุล</th>
              <th class="text-left px-4 py-3 font-medium">ระดับ</th>
              <th class="text-left px-4 py-3 font-medium">ห้อง</th>
              <th class="text-center px-4 py-3 font-medium">สอบ (ครั้ง)</th>
              <th class="text-center px-4 py-3 font-medium">คะแนนครั้งแรก</th>
              <th class="text-center px-4 py-3 font-medium">คะแนนล่าสุด</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="(s, i) in scores" :key="s._id" class="hover:bg-slate-50">
              <td class="px-4 py-3 text-slate-400">{{ i + 1 }}</td>
              <td class="px-4 py-3 font-mono text-slate-600">{{ s.studentId }}</td>
              <td class="px-4 py-3 text-slate-800">{{ s.name }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                  {{ levelMap[s.level] }}
                </span>
              </td>
              <td class="px-4 py-3 text-slate-500">{{ s.classroom ? `${s.level.replace('m', '')}/${s.classroom}` : '-' }}</td>
              <td class="px-4 py-3 text-center text-slate-600">{{ s.submissions.length }}</td>
              <td class="px-4 py-3 text-center">
                <span v-if="s.submissions[0]" class="font-semibold text-slate-700">
                  {{ s.submissions[0].totalScore }}/{{ s.submissions[0].maxScore }}
                </span>
                <span v-else class="text-slate-300">-</span>
              </td>
              <td class="px-4 py-3 text-center">
                <span
                  v-if="s.submissions.length > 0"
                  class="font-semibold"
                  :class="getScoreColor(s)"
                >
                  {{ s.submissions[s.submissions.length - 1].totalScore }}/{{ s.submissions[s.submissions.length - 1].maxScore }}
                </span>
                <span v-else class="text-slate-300">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="searched" class="text-center py-12 text-slate-400">
        ไม่พบข้อมูลสำหรับเงื่อนไขที่เลือก
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { Loader2, Download } from 'lucide-vue-next'
import { useApi } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import { useAdminAuthStore } from '~/stores/auth'

definePageMeta({ middleware: 'auth', layout: false })

const { apiFetch } = useApi()
const { error: toastError } = useToast()
const auth = useAdminAuthStore()
const levelMap = { m1: 'ม.1', m2: 'ม.2', m3: 'ม.3' }

const availableLevels = computed(() => {
  if (auth.isSuperAdmin) return ['m1', 'm2', 'm3']
  return auth.managedLevels || []
})

const filterLevel = ref(availableLevels.value[0] || 'm1')
const filterClassroom = ref(null)
const scores = ref([])
const loading = ref(false)
const searched = ref(false)

async function loadScores() {
  loading.value = true
  searched.value = false
  try {
    const params = new URLSearchParams({ level: filterLevel.value })
    if (filterClassroom.value) params.append('classroom', filterClassroom.value)
    scores.value = await apiFetch(`/analytics/classroom?${params}`)
    searched.value = true
  } catch (e) {
    toastError(e?.data?.message || 'เกิดข้อผิดพลาด')
  } finally {
    loading.value = false
  }
}

async function exportCSV() {
  const config = useRuntimeConfig()
  const params = new URLSearchParams({ level: filterLevel.value })
  if (filterClassroom.value) params.append('classroom', filterClassroom.value)

  try {
    const response = await fetch(
      `${config.public.apiBase}/analytics/classroom/export?${params}`,
      { headers: { Authorization: `Bearer ${auth.token}` } },
    )
    if (!response.ok) {
      toastError('ไม่สามารถ export ได้ กรุณาลองใหม่')
      return
    }
    const blob = await response.blob()
    const classroomSuffix = filterClassroom.value ? `-room${filterClassroom.value}` : ''
    const filename = `classroom-scores-${filterLevel.value}${classroomSuffix}.csv`
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch {
    toastError('ไม่สามารถ export ได้ กรุณาลองใหม่')
  }
}

function getScoreColor(s) {
  if (!s.submissions.length || !s.submissions[0]) return 'text-slate-500'
  const first = s.submissions[0]
  const last = s.submissions[s.submissions.length - 1]
  const firstPct = first.maxScore ? first.totalScore / first.maxScore : 0
  const lastPct = last.maxScore ? last.totalScore / last.maxScore : 0
  if (lastPct > firstPct) return 'text-emerald-600'
  if (lastPct < firstPct) return 'text-red-500'
  return 'text-slate-700'
}
</script>
