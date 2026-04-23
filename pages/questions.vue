<template>
  <NuxtLayout name="admin">
    <div class="p-6 md:p-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-bold text-slate-800">จัดการข้อสอบ</h1>
        <button
          @click="openModal()"
          class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          <Plus :size="16" />
          เพิ่มข้อสอบ
        </button>
      </div>

      <!-- Filter -->
      <div class="flex gap-2 mb-4 flex-wrap">
        <button
          v-for="lvl in ['all', ...availableLevels]"
          :key="lvl"
          @click="filterLevel = lvl"
          class="px-3 py-1.5 rounded-lg text-sm font-medium transition"
          :class="filterLevel === lvl ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'"
        >
          {{ lvl === 'all' ? 'ทั้งหมด' : levelMap[lvl] }}
        </button>
      </div>

      <!-- Questions List -->
      <div class="space-y-3">
        <div
          v-for="q in filteredQuestions"
          :key="q._id"
          class="bg-white rounded-xl border border-slate-200 p-4"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                  {{ levelMap[q.level] }}
                </span>
                <span v-if="!q.isActive" class="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                  ซ่อนอยู่
                </span>
              </div>
              <p class="text-sm text-slate-800 whitespace-pre-wrap">{{ q.problemText }}</p>
              <p class="text-xs text-slate-400 mt-1">เฉลย: {{ q.referenceSolution }}</p>
            </div>
            <div class="flex items-center gap-1">
              <button @click="openModal(q)" class="p-2 rounded-lg hover:bg-slate-100 transition">
                <Pencil :size="14" class="text-slate-400" />
              </button>
              <button @click="handleDelete(q._id)" class="p-2 rounded-lg hover:bg-red-50 transition">
                <Trash2 :size="14" class="text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal -->
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/30" @click="showModal = false" />
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">
            {{ editingId ? 'แก้ไขข้อสอบ' : 'เพิ่มข้อสอบ' }}
          </h2>

          <form @submit.prevent="handleSave" class="space-y-4">
            <div>
              <label for="q-level" class="block text-sm font-medium text-slate-700 mb-1">ระดับชั้น</label>
              <select id="q-level" v-model="form.level" required class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option v-for="lvl in availableLevels" :key="lvl" :value="lvl">{{ levelMap[lvl] }}</option>
              </select>
            </div>

            <div>
              <label for="q-problem" class="block text-sm font-medium text-slate-700 mb-1">โจทย์</label>
              <textarea id="q-problem" v-model="form.problemText" required rows="3"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none" />
            </div>

            <div>
              <label for="q-image-url" class="block text-sm font-medium text-slate-700 mb-1">URL รูปภาพ (ถ้ามี)</label>
              <input id="q-image-url" v-model="form.problemImageUrl" type="text"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>

            <div>
              <label for="q-solution" class="block text-sm font-medium text-slate-700 mb-1">เฉลย/แนวทาง</label>
              <textarea id="q-solution" v-model="form.referenceSolution" required rows="2"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none" />
            </div>

            <div>
              <label for="q-answer" class="block text-sm font-medium text-slate-700 mb-1">คำตอบ</label>
              <input id="q-answer" v-model="form.answer" type="text"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button type="button" @click="showModal = false"
                class="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                ยกเลิก
              </button>
              <button type="submit"
                class="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                บันทึก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { Plus, Pencil, Trash2 } from 'lucide-vue-next'
import { useApi } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import { useConfirm } from '~/composables/useConfirm'
import { useAdminAuthStore } from '~/stores/auth'

definePageMeta({ middleware: 'auth', layout: false })

const { apiFetch } = useApi()
const { error: toastError } = useToast()
const { confirm } = useConfirm()
const auth = useAdminAuthStore()
const levelMap = { m1: 'ม.1', m2: 'ม.2', m3: 'ม.3' }

const questions = ref([])
const filterLevel = ref('all')
const showModal = ref(false)
const editingId = ref(null)
const form = reactive({
  level: 'm1',
  problemText: '',
  problemImageUrl: '',
  referenceSolution: '',
  answer: '',
})

// สำหรับ teacher แสดงเฉพาะระดับที่จัดการ
const availableLevels = computed(() => {
  if (auth.isSuperAdmin) return ['m1', 'm2', 'm3']
  return auth.managedLevels || []
})

const filteredQuestions = computed(() => {
  const byLevel = filterLevel.value === 'all' ? questions.value : questions.value.filter((q) => q.level === filterLevel.value)
  if (!auth.isSuperAdmin && auth.managedLevels?.length > 0) {
    return byLevel.filter((q) => auth.managedLevels.includes(q.level))
  }
  return byLevel
})

function openModal(q = null) {
  if (q) {
    editingId.value = q._id
    form.level = q.level
    form.problemText = q.problemText
    form.problemImageUrl = q.problemImageUrl || ''
    form.referenceSolution = q.referenceSolution
    form.answer = q.answer || ''
  } else {
    editingId.value = null
    form.level = 'm1'
    form.problemText = ''
    form.problemImageUrl = ''
    form.referenceSolution = ''
    form.answer = ''
  }
  showModal.value = true
}

async function handleSave() {
  try {
    if (editingId.value) {
      await apiFetch(`/questions/${editingId.value}`, { method: 'PUT', body: { ...form } })
    } else {
      await apiFetch('/questions', { method: 'POST', body: { ...form } })
    }
    showModal.value = false
    await loadQuestions()
  } catch (e) {
    toastError(e?.data?.message || 'เกิดข้อผิดพลาด')
  }
}

async function handleDelete(id) {
  const ok = await confirm({ title: 'ซ่อนข้อสอบ', message: 'ต้องการซ่อนข้อสอบนี้? (สามารถเปิดใช้งานใหม่ได้ภายหลัง)', confirmLabel: 'ซ่อน', danger: false })
  if (!ok) return
  try {
    await apiFetch(`/questions/${id}`, { method: 'DELETE' })
    await loadQuestions()
  } catch (e) {
    toastError(e?.data?.message || 'เกิดข้อผิดพลาด')
  }
}

async function loadQuestions() {
  questions.value = await apiFetch('/questions')
}

onMounted(loadQuestions)
</script>
