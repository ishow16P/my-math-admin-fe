<template>
  <NuxtLayout name="admin">
    <div class="p-6 md:p-8 max-w-4xl">
      <NuxtLink to="/submissions" class="text-sm text-indigo-600 hover:text-indigo-700 font-medium mb-4 inline-block">
        ← กลับรายการข้อสอบ
      </NuxtLink>

      <div v-if="loading" class="flex items-center justify-center py-20">
        <Loader2 :size="24" class="animate-spin text-indigo-500" />
      </div>

      <div v-else-if="submission">
        <!-- Header -->
        <div class="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <div class="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div>
              <h1 class="text-lg font-bold text-slate-800">{{ submission.studentId?.name }}</h1>
              <div class="text-sm text-slate-400">
                {{ submission.studentId?.studentId }}
                <span v-if="submission.studentId?.classroom"> — ห้อง {{ submission.studentId.level?.replace('m', '') }}/{{ submission.studentId.classroom }}</span>
                — {{ levelMap[submission.level] }}
              </div>
            </div>
            <span
              class="px-3 py-1 rounded-full text-xs font-medium"
              :class="submission.status === 'graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
            >
              {{ submission.status === 'graded' ? 'ตรวจแล้ว' : 'รอตรวจ' }}
            </span>
          </div>
          <div class="flex items-center gap-4 text-sm text-slate-600">
            <span>คะแนนรวม: <span class="font-bold text-indigo-600 text-lg">{{ computedTotal }}</span><span class="text-slate-400">/30</span></span>
            <span v-if="submission.gradedBy">ตรวจโดย: {{ submission.gradedBy?.name || 'ครู' }}</span>
          </div>
        </div>

        <!-- Answers -->
        <form @submit.prevent="handleGrade" class="space-y-6">
          <div
            v-for="(ans, index) in grades"
            :key="index"
            class="bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <!-- Answer Header -->
            <div class="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 class="font-semibold text-slate-800">ข้อ {{ index + 1 }}</h3>
              <div class="text-sm font-semibold">
                <span class="text-indigo-600">{{ questionScore(index) }}</span>
                <span class="text-slate-400">/10</span>
              </div>
            </div>

            <div class="p-5 space-y-4">
              <!-- Problem -->
              <div class="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <div class="text-xs font-medium text-indigo-500 mb-1">โจทย์</div>
                <div class="text-sm text-slate-800 whitespace-pre-wrap">{{ ans.problemSnapshot }}</div>
                <img v-if="ans.problemImageSnapshot" :src="ans.problemImageSnapshot" alt="โจทย์" class="mt-2 max-w-full rounded-lg" />
              </div>

              <!-- 4 Steps with per-step scoring -->
              <div v-for="step in STEPS" :key="step.key" v-show="ans[step.key]?.text || ans[step.key]?.imageUrl" class="space-y-1">
                <div class="flex items-center justify-between">
                  <div class="text-xs font-semibold text-slate-500">{{ step.label }}</div>
                  <div class="flex items-center gap-1.5">
                    <label :for="`score-${index}-${step.key}`" class="text-xs text-slate-400">คะแนน:</label>
                    <input
                      :id="`score-${index}-${step.key}`"
                      v-model.number="ans[step.key].scoreGiven"
                      type="number"
                      min="0"
                      :max="step.maxScore"
                      @input="clampScore(ans, step)"
                      class="w-16 px-2 py-0.5 border border-slate-200 rounded-lg text-xs text-center"
                    />
                    <span class="text-xs text-slate-400">/{{ step.maxScore }}</span>
                  </div>
                </div>
                <div v-if="ans[step.key]?.text" class="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <MathDisplay :value="ans[step.key].text" />
                </div>
                <img
                  v-if="ans[step.key]?.imageUrl"
                  :src="ans[step.key].imageUrl"
                  alt="ภาพวาด"
                  class="max-w-full rounded-lg border border-slate-200"
                />
              </div>

              <!-- Teacher Comment -->
              <div>
                <label :for="`comment-${index}`" class="block text-xs font-medium text-slate-500 mb-1">ความเห็นต่อข้อนี้</label>
                <input
                  :id="`comment-${index}`"
                  v-model="ans.teacherComment"
                  type="text"
                  placeholder="ความเห็นสำหรับข้อนี้..."
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          <!-- Overall Feedback -->
          <div class="bg-white rounded-xl border border-slate-200 p-5">
            <label for="overall-feedback" class="block text-sm font-semibold text-slate-700 mb-2">Feedback ภาพรวม</label>
            <textarea
              id="overall-feedback"
              v-model="overallFeedback"
              rows="3"
              placeholder="คอมเมนต์รวมถึงนักเรียน..."
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
            />
          </div>

          <div class="flex justify-end">
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
import { CheckCircle2, Loader2 } from 'lucide-vue-next'
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
  try {
    const data = await apiFetch(`/submissions/${route.params.id}`)
    submission.value = data
    overallFeedback.value = data.overallFeedback || ''
    grades.value = data.answers.map((a) => ({
      questionId: a.questionId,
      problemSnapshot: a.problemSnapshot,
      problemImageSnapshot: a.problemImageSnapshot || '',
      step1: { ...(a.step1 || { inputType: 'text', text: '', imageUrl: '' }), scoreGiven: a.step1Score || 0 },
      step2: { ...(a.step2 || { inputType: 'text', text: '', imageUrl: '' }), scoreGiven: a.step2Score || 0 },
      step3: { ...(a.step3 || { inputType: 'text', text: '', imageUrl: '' }), scoreGiven: a.step3Score || 0 },
      step4: { ...(a.step4 || { inputType: 'text', text: '', imageUrl: '' }), scoreGiven: a.step4Score || 0 },
      teacherComment: a.teacherComment || '',
    }))
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
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
