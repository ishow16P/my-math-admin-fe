<template>
  <NuxtLayout name="admin">
    <div class="p-6 md:p-8">
      <div class="mb-6">
        <h1 class="text-xl font-bold text-slate-800">ตั้งค่าการสอบ</h1>
        <p class="text-sm text-slate-500 mt-1">เปิด/ปิดรอบสอบ และกำหนดข้อสอบแต่ละรอบต่อระดับชั้น</p>
      </div>

      <!-- Level Tabs -->
      <div class="flex gap-2 mb-6">
        <button
          v-for="lvl in availableLevels"
          :key="lvl"
          @click="selectLevel(lvl)"
          class="px-4 py-2 rounded-lg text-sm font-medium transition"
          :class="activeLevel === lvl
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'"
        >
          {{ levelMap[lvl] }}
        </button>
      </div>

      <div v-if="pageLoading" class="flex justify-center py-16">
        <Loader2 :size="24" class="animate-spin text-indigo-400" />
      </div>

      <div v-else-if="config" class="space-y-4">

        <!-- Session cards -->
        <div
          v-for="session in SESSIONS"
          :key="session.type"
          class="bg-white rounded-2xl border overflow-hidden transition-colors duration-200"
          :class="expandedSessions.includes(session.type) ? 'border-indigo-200 shadow-md' : 'border-slate-200'"
        >
          <!-- Session header row -->
          <div class="flex items-center gap-3 p-4 sm:p-5">

            <!-- Icon -->
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" :class="session.color">
              <component :is="session.icon" :size="20" />
            </div>

            <!-- Info + status badge -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-sm font-semibold text-slate-800 leading-tight">{{ session.label }}</p>
                <!-- Status badge -->
                <template v-if="session.type === 'pre_test' || session.type === 'post_test'">
                  <span class="text-xs px-2 py-0.5 rounded-full"
                    :class="savedPrePostIds.length === 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">
                    {{ savedPrePostIds.length === 2 ? 'กำหนดข้อแล้ว' : 'ยังไม่กำหนดข้อ' }}
                  </span>
                </template>
                <template v-else>
                  <span v-if="savedSessionQuestions[session.type]"
                    class="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    กำหนดข้อแล้ว
                  </span>
                  <span v-else class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
                    สุ่มอัตโนมัติ
                  </span>
                </template>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">{{ session.questionCount }} ข้อ &bull; {{ session.durationLabel }}</p>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 sm:gap-3 shrink-0">

              <!-- "กำหนดข้อสอบ" / "ดูข้อสอบ" button -->
              <button
                @click="toggleExpand(session.type)"
                class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                :class="expandedSessions.includes(session.type)
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'"
              >
                <component :is="session.type === 'post_test' ? Eye : Settings" :size="12" />
                {{ session.type === 'post_test' ? 'ดูข้อสอบ' : 'กำหนดข้อสอบ' }}
                <ChevronDown
                  :size="12"
                  class="transition-transform duration-200"
                  :class="expandedSessions.includes(session.type) ? 'rotate-180' : ''"
                />
              </button>

              <!-- Mobile: icon only -->
              <button
                @click="toggleExpand(session.type)"
                class="sm:hidden p-1.5 rounded-lg border transition-all"
                :class="expandedSessions.includes(session.type)
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'text-indigo-500 border-indigo-200 hover:bg-indigo-50'"
                :title="expandedSessions.includes(session.type) ? 'ซ่อน' : session.type === 'post_test' ? 'ดูข้อสอบ' : 'กำหนดข้อสอบ'"
              >
                <component :is="session.type === 'post_test' ? Eye : Settings" :size="14" />
              </button>

              <!-- Toggle switch -->
              <button
                @click="toggleSession(session.type)"
                class="flex items-center gap-1.5"
              >
                <span class="text-xs font-medium transition hidden sm:inline"
                  :class="localSessions[session.type]?.isOpen ? 'text-indigo-600' : 'text-slate-400'">
                  {{ localSessions[session.type]?.isOpen ? 'เปิด' : 'ปิด' }}
                </span>
                <div class="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200"
                  :class="localSessions[session.type]?.isOpen ? 'bg-indigo-600' : 'bg-slate-200'">
                  <span
                    class="inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200"
                    :class="localSessions[session.type]?.isOpen ? 'translate-x-5' : 'translate-x-0'"
                  />
                </div>
              </button>
            </div>
          </div>


          <!-- Expanded body -->
          <div v-if="expandedSessions.includes(session.type)" class="border-t border-slate-100 p-5 bg-slate-50/60">

            <!-- Pre-test: ordered 2-question picker -->
            <template v-if="session.type === 'pre_test'">

              <!-- Order preview -->
              <div class="flex gap-2 mb-4">
                <div v-for="n in 2" :key="n"
                  class="flex-1 flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-all"
                  :class="selectedPrePostIds[n-1]
                    ? 'border-indigo-200 bg-white'
                    : 'border-dashed border-slate-200 bg-transparent'"
                >
                  <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    :class="selectedPrePostIds[n-1] ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'">
                    {{ n }}
                  </span>
                  <p v-if="selectedPrePostIds[n-1]" class="text-slate-700 text-xs line-clamp-1 flex-1">
                    {{ prePostPool.find(q => q._id === selectedPrePostIds[n-1])?.problemText }}
                  </p>
                  <p v-else class="text-slate-400 text-xs flex-1">ข้อที่ {{ n }} (ยังไม่เลือก)</p>
                  <button v-if="selectedPrePostIds[n-1]"
                    @click="togglePrePostQuestion(selectedPrePostIds[n-1])"
                    class="shrink-0 text-slate-300 hover:text-red-400 transition">
                    <X :size="13" />
                  </button>
                </div>
              </div>

              <p class="text-xs text-slate-400 mb-2">คลิกเลือกข้อสอบตามลำดับที่ต้องการ</p>

              <div v-if="questionsLoading" class="flex justify-center py-6">
                <Loader2 :size="18" class="animate-spin text-indigo-400" />
              </div>
              <div v-else-if="prePostPool.length === 0" class="py-6 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                ยังไม่มีข้อสอบประเภท Pre/Post test — ตั้งค่า "ใช้ในรอบ" ในเมนูจัดการข้อสอบ
              </div>
              <div v-else class="space-y-2 max-h-64 overflow-y-auto pr-1">
                <button
                  v-for="q in prePostPool"
                  :key="q._id"
                  @click="togglePrePostQuestion(q._id)"
                  :disabled="!selectedPrePostIds.includes(q._id) && selectedPrePostIds.length >= 2"
                  class="w-full text-left p-3 rounded-xl border transition-all text-sm"
                  :class="selectedPrePostIds.includes(q._id)
                    ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-300'
                    : selectedPrePostIds.length >= 2
                      ? 'border-slate-100 opacity-40 cursor-not-allowed'
                      : 'border-slate-200 hover:border-indigo-200 hover:bg-white'"
                >
                  <div class="flex items-start gap-3">
                    <!-- Order number badge or empty circle -->
                    <div class="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition text-xs font-bold"
                      :class="selectedPrePostIds.includes(q._id)
                        ? 'bg-indigo-600 text-white'
                        : 'border-2 border-slate-300 text-transparent'">
                      {{ selectedPrePostIds.indexOf(q._id) + 1 || '' }}
                    </div>
                    <p class="text-slate-700 leading-relaxed line-clamp-2">{{ q.problemText }}</p>
                  </div>
                </button>
              </div>
              <div class="mt-3 flex justify-end">
                <button @click="savePrePostQuestions"
                  :disabled="selectedPrePostIds.length !== 2 || savingPrePost"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50">
                  <Loader2 v-if="savingPrePost" :size="13" class="animate-spin" />
                  <Save v-else :size="13" />
                  บันทึก
                </button>
              </div>
            </template>

            <!-- Post-test: info + preview -->
            <template v-else-if="session.type === 'post_test'">
              <div class="flex items-start gap-2 text-sm text-slate-600 mb-3">
                <Info :size="15" class="text-indigo-400 mt-0.5 shrink-0" />
                <p>Post-test ใช้ข้อเดียวกับ Pre-test อัตโนมัติ — กำหนดข้อได้ที่การ์ด "ทดสอบก่อนเรียน"</p>
              </div>
              <div v-if="prePostSelectedQuestions.length > 0" class="space-y-2">
                <div v-for="q in prePostSelectedQuestions" :key="q._id"
                  class="p-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 line-clamp-2">
                  {{ q.problemText }}
                </div>
              </div>
              <p v-else class="text-xs text-amber-600">ยังไม่ได้กำหนดข้อสอบใน Pre-test</p>
            </template>

            <!-- In-class 1/2/3: single question picker -->
            <template v-else>
              <div class="flex items-center justify-between mb-3">
                <p class="text-xs font-medium text-slate-500">
                  เลือก 1 ข้อ — ถ้าไม่เลือก ระบบจะสุ่มให้อัตโนมัติ
                </p>
                <button v-if="getSessionQuestionId(session.type)"
                  @click="clearSessionQuestion(session.type)"
                  class="text-xs text-red-500 hover:text-red-600 transition">
                  ล้างค่า (กลับไปสุ่ม)
                </button>
              </div>
              <div v-if="questionsLoading" class="flex justify-center py-6">
                <Loader2 :size="18" class="animate-spin text-indigo-400" />
              </div>
              <div v-else-if="inClassPool.length === 0" class="py-6 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                ยังไม่มีข้อสอบประเภท In-class — ตั้งค่า "ใช้ในรอบ" ในเมนูจัดการข้อสอบ
              </div>
              <div v-else class="space-y-2 max-h-72 overflow-y-auto pr-1">
                <button
                  v-for="q in inClassPool"
                  :key="q._id"
                  @click="setSessionQuestion(session.type, q._id)"
                  class="w-full text-left p-3 rounded-xl border transition-all text-sm"
                  :class="getSessionQuestionId(session.type) === q._id
                    ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-300'
                    : 'border-slate-200 hover:border-indigo-200 hover:bg-white'"
                >
                  <div class="flex items-start gap-3">
                    <!-- Radio style dot -->
                    <div class="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition"
                      :class="getSessionQuestionId(session.type) === q._id ? 'border-indigo-600' : 'border-slate-300'">
                      <div v-if="getSessionQuestionId(session.type) === q._id"
                        class="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    </div>
                    <p class="text-slate-700 leading-relaxed line-clamp-2">{{ q.problemText }}</p>
                  </div>
                </button>
              </div>
              <div class="mt-3 flex justify-end">
                <button @click="saveSessionQuestion(session.type)"
                  :disabled="savingSessionType === session.type"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50">
                  <Loader2 v-if="savingSessionType === session.type" :size="13" class="animate-spin" />
                  <Save v-else :size="13" />
                  บันทึก
                </button>
              </div>
            </template>

          </div>
        </div>


      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import {
  Loader2, Save, Check, ChevronDown, Settings, Eye, X,
  ClipboardList, PenLine, FileCheck, Info,
} from 'lucide-vue-next'
import { useAdminAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

definePageMeta({ middleware: 'auth' })

const auth = useAdminAuthStore()
const { apiFetch } = useApi()
const { success: toastSuccess, error: toastError } = useToast()

const levelMap = { m1: 'ม.1', m2: 'ม.2', m3: 'ม.3' }

const SESSIONS = [
  { type: 'pre_test',   label: 'แบบทดสอบก่อนเรียน',         questionCount: 2, durationLabel: '40 นาที', color: 'bg-blue-100 text-blue-600',      icon: ClipboardList },
  { type: 'in_class_1', label: 'แบบทดสอบท้ายคาบ ครั้งที่ 1', questionCount: 1, durationLabel: '20 นาที', color: 'bg-violet-100 text-violet-600',  icon: PenLine },
  { type: 'in_class_2', label: 'แบบทดสอบท้ายคาบ ครั้งที่ 2', questionCount: 1, durationLabel: '20 นาที', color: 'bg-purple-100 text-purple-600',  icon: PenLine },
  { type: 'in_class_3', label: 'แบบทดสอบท้ายคาบ ครั้งที่ 3', questionCount: 1, durationLabel: '20 นาที', color: 'bg-fuchsia-100 text-fuchsia-600', icon: PenLine },
  { type: 'post_test',  label: 'แบบทดสอบหลังเรียน',          questionCount: 2, durationLabel: '40 นาที', color: 'bg-emerald-100 text-emerald-600', icon: FileCheck },
]

const availableLevels = computed(() => {
  if (auth.isSuperAdmin) return ['m1', 'm2', 'm3']
  return auth.managedLevels || []
})

const activeLevel = ref(availableLevels.value[0] || 'm1')
const pageLoading = ref(false)
const questionsLoading = ref(false)
const savingSessions = ref(false)
const savingPrePost = ref(false)
const savingSessionType = ref(null)

const config = ref(null)
const questionPool = ref([])
const localSessions = ref({})
const selectedPrePostIds = ref([])
const expandedSessions = ref([])

// สถานะที่บันทึกจริงใน DB แล้ว (ใช้แสดง status badge)
const savedPrePostIds = ref([])
const savedSessionQuestions = ref({})

const prePostPool = computed(() =>
  questionPool.value.filter((q) => q.pool === 'pre_post' || q.pool === 'any')
)
const inClassPool = computed(() =>
  questionPool.value.filter((q) => q.pool === 'in_class' || q.pool === 'any')
)
const prePostSelectedQuestions = computed(() =>
  prePostPool.value.filter((q) => selectedPrePostIds.value.includes(q._id))
)

// ดึง questionId จาก session (รองรับทั้ง ObjectId string และ populated object)
function getSessionQuestionId(sessionType) {
  const val = localSessions.value[sessionType]?.questionId
  if (!val) return null
  return val?._id || val
}

async function selectLevel(lvl) {
  activeLevel.value = lvl
  expandedSessions.value = []
  await loadConfig()
}

async function loadConfig() {
  pageLoading.value = true
  try {
    const res = await apiFetch(`/exam-config/${activeLevel.value}`)
    config.value = res.config
    localSessions.value = JSON.parse(JSON.stringify(res.config.sessions))
    selectedPrePostIds.value = (res.config.prePostQuestionIds || []).map((q) => q._id || q)
    savedPrePostIds.value = [...selectedPrePostIds.value]
    savedSessionQuestions.value = {
      in_class_1: res.config.sessions.in_class_1?.questionId?._id || res.config.sessions.in_class_1?.questionId || null,
      in_class_2: res.config.sessions.in_class_2?.questionId?._id || res.config.sessions.in_class_2?.questionId || null,
      in_class_3: res.config.sessions.in_class_3?.questionId?._id || res.config.sessions.in_class_3?.questionId || null,
    }
  } catch (e) {
    toastError(e?.data?.message || 'ไม่สามารถโหลด config ได้')
  } finally {
    pageLoading.value = false
  }
  await loadQuestions()
}

async function loadQuestions() {
  questionsLoading.value = true
  try {
    const res = await apiFetch(`/questions?level=${activeLevel.value}&page=1&limit=100`)
    questionPool.value = res.data
  } catch {
    questionPool.value = []
  } finally {
    questionsLoading.value = false
  }
}

function toggleExpand(type) {
  const idx = expandedSessions.value.indexOf(type)
  if (idx >= 0) expandedSessions.value.splice(idx, 1)
  else expandedSessions.value.push(type)
}

async function toggleSession(type) {
  localSessions.value[type].isOpen = !localSessions.value[type].isOpen
  await saveSessions()
}

function togglePrePostQuestion(id) {
  const idx = selectedPrePostIds.value.indexOf(id)
  if (idx >= 0) selectedPrePostIds.value.splice(idx, 1)
  else if (selectedPrePostIds.value.length < 2) selectedPrePostIds.value.push(id)
}

function setSessionQuestion(sessionType, id) {
  const current = getSessionQuestionId(sessionType)
  // คลิกข้อเดิม = deselect (กลับไปสุ่ม)
  localSessions.value[sessionType].questionId = current === id ? null : id
}

function clearSessionQuestion(sessionType) {
  localSessions.value[sessionType].questionId = null
}

async function saveSessions() {
  savingSessions.value = true
  try {
    await apiFetch(`/exam-config/${activeLevel.value}/sessions`, {
      method: 'PUT',
      body: { sessions: localSessions.value },
    })
    toastSuccess('บันทึกการตั้งค่ารอบสอบเรียบร้อย')
  } catch (e) {
    toastError(e?.data?.message || 'เกิดข้อผิดพลาด')
  } finally {
    savingSessions.value = false
  }
}

async function savePrePostQuestions() {
  savingPrePost.value = true
  try {
    await apiFetch(`/exam-config/${activeLevel.value}/pre-post-questions`, {
      method: 'PUT',
      body: { questionIds: selectedPrePostIds.value },
    })
    savedPrePostIds.value = [...selectedPrePostIds.value]
    toastSuccess('บันทึกข้อสอบก่อน/หลังเรียนเรียบร้อย')
  } catch (e) {
    toastError(e?.data?.message || 'เกิดข้อผิดพลาด')
  } finally {
    savingPrePost.value = false
  }
}

async function saveSessionQuestion(sessionType) {
  savingSessionType.value = sessionType
  try {
    const questionId = getSessionQuestionId(sessionType) || null
    await apiFetch(`/exam-config/${activeLevel.value}/session-question`, {
      method: 'PUT',
      body: { sessionType, questionId },
    })
    savedSessionQuestions.value[sessionType] = getSessionQuestionId(sessionType)
    toastSuccess('บันทึกข้อสอบเรียบร้อย')
  } catch (e) {
    toastError(e?.data?.message || 'เกิดข้อผิดพลาด')
  } finally {
    savingSessionType.value = null
  }
}

onMounted(loadConfig)
</script>
