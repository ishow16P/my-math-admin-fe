<template>
  <NuxtLayout name="admin">
    <div class="p-6 md:p-8 max-w-3xl">
      <NuxtLink to="/submissions" class="text-sm text-indigo-600 hover:text-indigo-700 font-medium mb-5 inline-flex items-center gap-1">
        ← กลับรายการข้อสอบ
      </NuxtLink>

      <div v-if="loading" class="flex items-center justify-center py-20">
        <Loader2 :size="24" class="animate-spin text-indigo-500" />
      </div>

      <div v-else-if="submission" class="space-y-5">
        <!-- Header Card -->
        <div class="bg-white rounded-xl border border-slate-200 p-5">
          <div class="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 class="text-base font-bold text-slate-800">{{ submission.studentId?.name }}</h1>
              <div class="text-sm text-slate-400 mt-0.5">
                รหัส {{ submission.studentId?.studentId }}
                <span v-if="submission.studentId?.classroom"> · ห้อง {{ submission.studentId.level?.replace('m', '') }}/{{ submission.studentId.classroom }}</span>
                · {{ levelMap[submission.level] }}
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="text-right">
                <div class="text-2xl font-bold text-indigo-600">{{ computedTotal }}<span class="text-sm font-normal text-slate-400">/30</span></div>
                <div class="text-xs text-slate-400">คะแนนรวม</div>
              </div>
              <span
                class="px-3 py-1 rounded-full text-xs font-medium"
                :class="submission.status === 'graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
              >
                {{ submission.status === 'graded' ? 'ตรวจแล้ว' : 'รอตรวจ' }}
              </span>
            </div>
          </div>
          <div v-if="submission.gradedBy" class="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
            ตรวจโดย {{ submission.gradedBy?.name || 'ครู' }}
          </div>
        </div>

        <!-- Answer Cards -->
        <form @submit.prevent="handleGrade" class="space-y-5">
          <div
            v-for="(ans, index) in grades"
            :key="index"
            class="bg-white rounded-xl border border-slate-200"
          >
            <!-- Question Header -->
            <div class="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between rounded-t-xl">
              <span class="font-semibold text-slate-700 text-sm">ข้อ {{ index + 1 }}</span>
              <div class="flex items-center gap-1.5">
                <span class="text-lg font-bold text-indigo-600">{{ questionScore(index) }}</span>
                <span class="text-sm text-slate-400">/ 10 คะแนน</span>
              </div>
            </div>

            <div class="p-5 space-y-5">
              <!-- Problem -->
              <div class="rounded-lg bg-indigo-50 border border-indigo-100 p-4">
                <div class="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-2">โจทย์</div>
                <div class="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{{ ans.problemSnapshot }}</div>
                <img v-if="ans.problemImageSnapshot" :src="ans.problemImageSnapshot" alt="โจทย์" class="mt-3 max-w-full rounded-lg" />
              </div>

              <!-- Steps -->
              <div class="space-y-4">
                <div
                  v-for="step in STEPS"
                  :key="step.key"
                  v-show="ans[step.key]?.text || ans[step.key]?.imageUrl"
                  class="rounded-lg border border-slate-200"
                >
                  <!-- Step Header: label + score -->
                  <div class="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200 rounded-t-lg">
                    <span class="text-xs font-semibold text-slate-600">{{ step.label }}</span>
                    <div class="flex items-center gap-1.5">
                      <label :for="`score-${index}-${step.key}`" class="text-xs text-slate-400">คะแนน</label>
                      <input
                        :id="`score-${index}-${step.key}`"
                        v-model.number="ans[step.key].scoreGiven"
                        type="number"
                        min="0"
                        :max="step.maxScore"
                        @input="clampScore(ans, step)"
                        class="w-14 px-2 py-0.5 border border-slate-200 rounded-md text-sm text-center font-semibold text-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                      <span class="text-xs text-slate-400">/ {{ step.maxScore }}</span>
                    </div>
                  </div>

                  <div class="p-4 space-y-3">
                    <!-- Student Answer -->
                    <div>
                      <div class="text-xs text-slate-400 mb-1.5">คำตอบนักเรียน</div>
                      <div v-if="ans[step.key]?.text" class="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                        <MathDisplay :value="ans[step.key].text" />
                      </div>
                      <img
                        v-if="ans[step.key]?.imageUrl"
                        :src="ans[step.key].imageUrl"
                        alt="ภาพวาด"
                        class="max-w-full rounded-lg border border-slate-200"
                      />
                    </div>

                    <!-- Teacher Feedback -->
                    <div>
                      <div class="flex items-center justify-between mb-1.5">
                        <label :for="`feedback-${index}-${step.key}`" class="text-xs font-medium text-slate-500">
                          ข้อเสนอแนะขั้นที่ {{ step.key.replace('step', '') }}
                        </label>
                        <div v-if="ans.stepFeedbacks?.[step.key]?.length > 0" class="relative">
                          <button
                            type="button"
                            @click.stop="toggleDropdown(`${index}-${step.key}`)"
                            class="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 bg-white text-xs text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition"
                          >
                            <Zap :size="11" />
                            ข้อเสนอแนะ
                            <ChevronDown
                              :size="11"
                              class="transition-transform"
                              :class="openDropdown === `${index}-${step.key}` ? 'rotate-180' : ''"
                            />
                          </button>
                          <div
                            v-if="openDropdown === `${index}-${step.key}`"
                            @click.stop
                            class="absolute right-0 top-full mt-1 z-50 w-72 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
                          >
                            <div class="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500">ข้อเสนอแนะที่ใช้งานบ่อย</div>
                            <div class="max-h-48 overflow-y-auto">
                              <button
                                v-for="(fb, fi) in ans.stepFeedbacks[step.key]"
                                :key="fi"
                                type="button"
                                @click="appendQuickFeedback(ans, step.key, fb)"
                                class="w-full text-left px-3 py-2.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border-b border-slate-100 last:border-0 transition leading-relaxed"
                              >
                                {{ fb }}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <textarea
                        :id="`feedback-${index}-${step.key}`"
                        v-model="ans[step.key].feedback"
                        rows="1"
                        :placeholder="`ระบุข้อเสนอแนะสำหรับขั้นที่ ${step.key.replace('step', '')}...`"
                        class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Overall comment for this question -->
              <div class="pt-1">
                <div class="flex items-center justify-between mb-1.5">
                  <label :for="`comment-${index}`" class="text-xs font-medium text-slate-500">ข้อเสนอแนะภาพรวมต่อข้อนี้</label>
                  <div v-if="allStepFeedbacks(ans).length > 0" class="relative">
                    <button
                      type="button"
                      @click.stop="toggleDropdown(`${index}-comment`)"
                      class="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 bg-white text-xs text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition"
                    >
                      <Zap :size="11" />
                      ข้อเสนอแนะ
                      <ChevronDown :size="11" class="transition-transform" :class="openDropdown === `${index}-comment` ? 'rotate-180' : ''" />
                    </button>
                    <div
                      v-if="openDropdown === `${index}-comment`"
                      @click.stop
                      class="absolute right-0 top-full mt-1 z-50 w-72 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
                    >
                      <div class="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500">ข้อเสนอแนะที่ใช้งานบ่อย</div>
                      <div class="max-h-48 overflow-y-auto">
                        <button
                          v-for="(fb, fi) in allStepFeedbacks(ans)"
                          :key="fi"
                          type="button"
                          @click="appendToComment(ans, fb)"
                          class="w-full text-left px-3 py-2.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border-b border-slate-100 last:border-0 transition leading-relaxed"
                        >{{ fb }}</button>
                      </div>
                    </div>
                  </div>
                </div>
                <textarea
                  :id="`comment-${index}`"
                  v-model="ans.teacherComment"
                  rows="2"
                  placeholder="เช่น เข้าใจปัญหาถูกต้อง แต่ขาดการตรวจสอบคำตอบ"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder:text-slate-300"
                />
              </div>
            </div>
          </div>

          <!-- Overall Feedback -->
          <div class="bg-white rounded-xl border border-slate-200 p-5">
            <label for="overall-feedback" class="block text-sm font-semibold text-slate-700 mb-1">ข้อเสนอแนะภาพรวม</label>
            <p class="text-xs text-slate-400 mb-2">นักเรียนจะเห็นข้อความนี้ในหน้าผลการสอบ</p>
            <textarea
              id="overall-feedback"
              v-model="overallFeedback"
              rows="3"
              placeholder="เช่น ทำได้ดีในภาพรวม ควรพัฒนาทักษะการตรวจสอบคำตอบให้มากยิ่งขึ้น"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder:text-slate-300"
            />
          </div>

          <div class="flex justify-end pb-4">
            <button
              type="submit"
              :disabled="saving"
              class="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
            >
              <CheckCircle2 :size="16" />
              {{ saving ? 'กำลังบันทึก...' : 'บันทึกการตรวจ' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { CheckCircle2, Loader2, ChevronDown, Zap } from 'lucide-vue-next'
import MathDisplay from '~/components/MathDisplay.vue'
import { useApi } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

definePageMeta({ middleware: 'auth', layout: false })

const route = useRoute()
const router = useRouter()
const { apiFetch } = useApi()
const { success: toastSuccess, error: toastError } = useToast()
const levelMap = { m1: 'ม.1', m2: 'ม.2', m3: 'ม.3' }

const STEPS = [
  { key: 'step1', label: 'ขั้นที่ 1: ทำความเข้าใจปัญหา', maxScore: 2 },
  { key: 'step2', label: 'ขั้นที่ 2: วางแผนแก้ปัญหา', maxScore: 2 },
  { key: 'step3', label: 'ขั้นที่ 3: ดำเนินการตามแผน', maxScore: 4 },
  { key: 'step4', label: 'ขั้นที่ 4: ตรวจสอบกระบวนการ', maxScore: 2 },
]

const submission = ref(null)
const loading = ref(true)
const saving = ref(false)
const overallFeedback = ref('')
const grades = ref([])
const openDropdown = ref(null)

function toggleDropdown(key) {
  openDropdown.value = openDropdown.value === key ? null : key
}

function closeDropdown() {
  openDropdown.value = null
}

function appendQuickFeedback(ans, stepKey, text) {
  const current = (ans[stepKey].feedback || '').trimEnd()
  ans[stepKey].feedback = current ? `${current}\n${text}` : text
  openDropdown.value = null
}

function appendToComment(ans, text) {
  const current = (ans.teacherComment || '').trimEnd()
  ans.teacherComment = current ? `${current}\n${text}` : text
  openDropdown.value = null
}

function allStepFeedbacks(ans) {
  const sf = ans.stepFeedbacks || {}
  return [...new Set(['step1', 'step2', 'step3', 'step4'].flatMap((s) => sf[s] || []))]
}

function clampScore(ans, step) {
  const val = ans[step.key].scoreGiven
  if (val < 0) ans[step.key].scoreGiven = 0
  else if (val > step.maxScore) ans[step.key].scoreGiven = step.maxScore
}

function questionScore(index) {
  const ans = grades.value[index]
  if (!ans) return 0
  return STEPS.reduce((sum, step) => sum + (ans[step.key]?.scoreGiven || 0), 0)
}

const computedTotal = computed(() => {
  return grades.value.reduce((sum, _, i) => sum + questionScore(i), 0)
})

onMounted(async () => {
  document.addEventListener('click', closeDropdown)
  try {
    const data = await apiFetch(`/submissions/${route.params.id}`)
    submission.value = data
    overallFeedback.value = data.overallFeedback || ''
    grades.value = data.answers.map((a) => ({
      questionId: a.questionId,
      problemSnapshot: a.problemSnapshot,
      problemImageSnapshot: a.problemImageSnapshot || '',
      stepFeedbacks: a.stepFeedbacks || {},
      step1: { ...(a.step1 || { inputType: 'text', text: '', imageUrl: '' }), scoreGiven: a.step1Score || 0, feedback: a.step1Feedback || '' },
      step2: { ...(a.step2 || { inputType: 'text', text: '', imageUrl: '' }), scoreGiven: a.step2Score || 0, feedback: a.step2Feedback || '' },
      step3: { ...(a.step3 || { inputType: 'text', text: '', imageUrl: '' }), scoreGiven: a.step3Score || 0, feedback: a.step3Feedback || '' },
      step4: { ...(a.step4 || { inputType: 'text', text: '', imageUrl: '' }), scoreGiven: a.step4Score || 0, feedback: a.step4Feedback || '' },
      teacherComment: a.teacherComment || '',
    }))
  } catch (e) {
    toastError(e?.data?.message || "ไม่สามารถโหลดข้อมูลการส่งได้")
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})

async function handleGrade() {
  saving.value = true
  try {
    await apiFetch(`/submissions/${route.params.id}/grade`, {
      method: 'PUT',
      body: {
        answers: grades.value.map((g, i) => ({
          questionId: g.questionId,
          scoreGiven: questionScore(i),
          step1Score: g.step1.scoreGiven,
          step2Score: g.step2.scoreGiven,
          step3Score: g.step3.scoreGiven,
          step4Score: g.step4.scoreGiven,
          step1Feedback: g.step1.feedback,
          step2Feedback: g.step2.feedback,
          step3Feedback: g.step3.feedback,
          step4Feedback: g.step4.feedback,
          teacherComment: g.teacherComment,
        })),
        overallFeedback: overallFeedback.value,
        maxScore: 30,
      },
    })
    toastSuccess('บันทึกการตรวจเรียบร้อยแล้ว!')
    await router.push('/submissions')
  } catch (e) {
    toastError(e?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
  } finally {
    saving.value = false
  }
}
</script>
