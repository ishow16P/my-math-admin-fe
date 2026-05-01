<template>
  <NuxtLayout name="admin">
    <div class="p-6 md:p-8">
      <h1 class="text-xl font-bold text-slate-800 mb-6">พัฒนาการนักเรียน</h1>

      <!-- Search Student -->
      <div class="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex-1">
            <label for="progress-level" class="block text-sm font-medium text-slate-700 mb-1">เลือกระดับ</label>
            <select id="progress-level" v-model="filterLevel" @change="loadStudents" :class="filterControlClass">
              <option value="">-- ทุกระดับ --</option>
              <option v-for="lvl in availableLevels" :key="lvl" :value="lvl">{{ levelMap[lvl] }}</option>
            </select>
          </div>
          <div class="flex-1">
            <label for="progress-classroom" class="block text-sm font-medium text-slate-700 mb-1">เลขห้อง</label>
            <input id="progress-classroom" v-model.number="filterClassroom" @change="loadStudents" type="number" min="1" placeholder="เช่น 3" :class="filterControlClass" />
          </div>
          <div class="flex-1">
            <label for="progress-student" class="block text-sm font-medium text-slate-700 mb-1">นักเรียน</label>
            <select id="progress-student" v-model="selectedStudentId" :class="filterControlClass">
              <option value="">-- เลือกนักเรียน --</option>
              <option v-for="s in students" :key="s._id" :value="s._id">{{ s.name }} ({{ s.studentId }})</option>
            </select>
          </div>
          <div class="flex items-end">
            <button
              @click="loadProgress"
              :disabled="!selectedStudentId || loadingProgress"
              class="h-10 px-4 inline-flex items-center justify-center bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
            >
              ดูพัฒนาการ
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loadingProgress" class="flex items-center justify-center py-12">
        <Loader2 :size="24" class="animate-spin text-indigo-500" />
      </div>

      <!-- Progress Data -->
      <div v-else-if="progress" class="space-y-6">
        <!-- Student Info -->
        <div class="bg-white rounded-xl border border-slate-200 p-5">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <User :size="24" class="text-indigo-600" />
            </div>
            <div>
              <div class="font-semibold text-slate-800">{{ progress.student?.name }}</div>
              <div class="text-sm text-slate-400">{{ progress.student?.studentId }} — {{ progress.student?.classroom ? `${progress.student.level?.replace('m', '')}/${progress.student.classroom}` : levelMap[progress.student?.level] }}</div>
            </div>
          </div>
        </div>

        <!-- First vs Latest comparison -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="bg-white rounded-xl border border-slate-200 p-5">
            <div class="text-xs font-semibold text-slate-400 uppercase mb-3">ครั้งแรก</div>
            <template v-if="progress.first">
              <div class="text-3xl font-bold text-slate-800 mb-1">
                {{ progress.first.totalScore }}<span class="text-lg text-slate-400">/{{ progress.first.maxScore }}</span>
              </div>
              <div class="text-sm text-slate-500">{{ formatDate(progress.first.createdAt) }}</div>
            </template>
            <div v-else class="text-slate-400 text-sm">ยังไม่มีข้อมูล</div>
          </div>

          <div class="bg-white rounded-xl border border-indigo-200 p-5">
            <div class="text-xs font-semibold text-indigo-400 uppercase mb-3">ล่าสุด</div>
            <template v-if="progress.latest">
              <div class="text-3xl font-bold text-indigo-600 mb-1">
                {{ progress.latest.totalScore }}<span class="text-lg text-slate-400">/{{ progress.latest.maxScore }}</span>
              </div>
              <div class="text-sm text-slate-500">{{ formatDate(progress.latest.createdAt) }}</div>
              <div v-if="progress.first && progress.latest._id !== progress.first._id" class="mt-2">
                <span
                  class="text-sm font-semibold"
                  :class="scoreDiff >= 0 ? 'text-emerald-600' : 'text-red-500'"
                >
                  {{ scoreDiff >= 0 ? '▲' : '▼' }} {{ Math.abs(scoreDiff).toFixed(1) }}%
                </span>
              </div>
            </template>
            <div v-else class="text-slate-400 text-sm">ยังไม่มีข้อมูล</div>
          </div>
        </div>

        <!-- Score History Chart -->
        <div v-if="progress.history?.length > 1" class="bg-white rounded-xl border border-slate-200 p-5">
          <h3 class="text-sm font-semibold text-slate-700 mb-4">กราฟพัฒนาการ</h3>
          <Line :data="chartData" :options="chartOptions" />
        </div>

        <!-- History Table -->
        <div v-if="progress.history?.length > 0" class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="text-left px-4 py-3 font-medium">ครั้งที่</th>
                <th class="text-left px-4 py-3 font-medium">วันที่สอบ</th>
                <th class="text-left px-4 py-3 font-medium">คะแนน</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(h, i) in progress.history" :key="h._id" class="hover:bg-slate-50">
                <td class="px-4 py-3 text-slate-500">{{ i + 1 }}</td>
                <td class="px-4 py-3 text-slate-600">{{ formatDate(h.createdAt) }}</td>
                <td class="px-4 py-3 font-semibold text-indigo-600">{{ h.totalScore }}/{{ h.maxScore }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { Loader2, User } from 'lucide-vue-next'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { useApi } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import { useAdminAuthStore } from '~/stores/auth'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

definePageMeta({ middleware: 'auth', layout: false })

const { apiFetch } = useApi()
const { error: toastError } = useToast()
const auth = useAdminAuthStore()
const levelMap = { m1: 'ม.1', m2: 'ม.2', m3: 'ม.3' }

/** ให้ select/input สูงเท่ากันทุกเบราว์เซอร์ */
const filterControlClass =
  'w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400'

const availableLevels = computed(() => {
  if (auth.isSuperAdmin) return ['m1', 'm2', 'm3']
  return auth.managedLevels || []
})

const filterLevel = ref('')
const filterClassroom = ref(null)
const selectedStudentId = ref('')
const students = ref([])
const progress = ref(null)
const loadingProgress = ref(false)

async function loadStudents() {
  try {
    const params = new URLSearchParams()
    if (filterLevel.value) params.append('level', filterLevel.value)
    if (filterClassroom.value) params.append('classroom', filterClassroom.value)
    students.value = await apiFetch(`/students?${params}`)
    selectedStudentId.value = ''
    progress.value = null
  } catch {}
}

async function loadProgress() {
  if (!selectedStudentId.value) return
  loadingProgress.value = true
  try {
    progress.value = await apiFetch(`/analytics/student/${selectedStudentId.value}/progress`)
  } catch (e) {
    toastError(e?.data?.message || 'เกิดข้อผิดพลาด')
  } finally {
    loadingProgress.value = false
  }
}

const scoreDiff = computed(() => {
  if (!progress.value?.first || !progress.value?.latest) return 0
  const f = (progress.value.first.totalScore / (progress.value.first.maxScore || 1)) * 100
  const l = (progress.value.latest.totalScore / (progress.value.latest.maxScore || 1)) * 100
  return l - f
})

const chartData = computed(() => {
  const history = progress.value?.history || []
  return {
    labels: history.map((_, i) => `ครั้งที่ ${i + 1}`),
    datasets: [{
      label: 'คะแนน (%)',
      data: history.map((h) => h.maxScore ? Math.round((h.totalScore / h.maxScore) * 100) : 0),
      borderColor: '#6366f1',
      backgroundColor: '#e0e7ff',
      tension: 0.3,
      fill: true,
    }],
  }
})

const chartOptions = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    y: { min: 0, max: 100, ticks: { callback: (v) => v + '%' } },
  },
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

onMounted(loadStudents)
</script>
