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
      <div class="flex gap-2 mb-5 flex-wrap">
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
      <div v-if="loading" class="flex justify-center py-12">
        <Loader2 :size="24" class="animate-spin text-indigo-400" />
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="q in questions"
          :key="q._id"
          class="bg-white rounded-xl border border-slate-200 p-5"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <!-- Badges -->
              <div class="flex items-center gap-2 mb-2">
                <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                  {{ levelMap[q.level] }}
                </span>
              </div>
              <!-- Problem -->
              <p class="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{{ q.problemText }}</p>
              <!-- Reference Solution -->
              <div class="mt-2 pt-2 border-t border-slate-100">
                <span class="text-xs text-slate-400">เฉลย: </span>
                <span class="text-xs text-slate-600">{{ q.referenceSolution }}</span>
              </div>
            </div>
            <!-- Actions -->
            <div class="flex items-center gap-1 flex-shrink-0">
              <button @click="openModal(q)" class="p-2 rounded-lg hover:bg-indigo-50 transition" title="แก้ไข">
                <Pencil :size="14" class="text-indigo-400" />
              </button>
              <button @click="handleDelete(q._id)" class="p-2 rounded-lg hover:bg-red-50 transition" title="ซ่อน">
                <Trash2 :size="14" class="text-red-400" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="questions.length === 0" class="py-16 text-center text-slate-400 text-sm">
          ยังไม่มีข้อสอบในระดับนี้
        </div>
        <PaginationBar v-if="total > 0" v-model="currentPage" :total="total" />
      </div>

      <!-- Modal -->
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showModal = false" />
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">

          <!-- Modal Header -->
          <div class="px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
            <h2 class="text-base font-semibold text-slate-800">
              {{ editingId ? 'แก้ไขข้อสอบ' : 'เพิ่มข้อสอบ' }}
            </h2>
          </div>

          <!-- Modal Body (scrollable) -->
          <div class="overflow-y-auto flex-1 px-6 py-5">
            <form id="question-form" @submit.prevent="handleSave" class="space-y-5">

              <!-- ระดับชั้น -->
              <div>
                <label for="q-level" class="block text-sm font-medium text-slate-700 mb-1.5">ระดับชั้น</label>
                <select id="q-level" v-model="form.level" required
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300">
                  <option v-for="lvl in availableLevels" :key="lvl" :value="lvl">{{ levelMap[lvl] }}</option>
                </select>
              </div>

              <!-- โจทย์ -->
              <div>
                <label for="q-problem" class="block text-sm font-medium text-slate-700 mb-1.5">
                  โจทย์ <span class="text-red-500">*</span>
                </label>
                <textarea
                  id="q-problem"
                  v-model="form.problemText"
                  rows="3"
                  placeholder="ระบุข้อความโจทย์..."
                  @input="errors.problemText = ''"
                  :class="[
                    'w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-1 placeholder:text-slate-300',
                    errors.problemText
                      ? 'border-red-400 focus:ring-red-300 bg-red-50'
                      : 'border-slate-200 focus:ring-indigo-300'
                  ]"
                />
                <p v-if="errors.problemText" class="mt-1 text-xs text-red-500">{{ errors.problemText }}</p>
              </div>

              <!-- รูปภาพประกอบ -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">
                  รูปภาพประกอบ
                  <span class="text-slate-400 font-normal">(ถ้ามี)</span>
                </label>

                <!-- Preview -->
                <div v-if="form.problemImageUrl" class="mb-2 relative inline-block">
                  <img :src="form.problemImageUrl" alt="รูปภาพประกอบ" class="max-h-40 rounded-lg border border-slate-200 object-contain" />
                  <button
                    type="button"
                    @click="form.problemImageUrl = ''"
                    class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                  >
                    <X :size="11" />
                  </button>
                </div>

                <!-- Upload button -->
                <div>
                  <label
                    :class="[
                      'inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition',
                      imageUploading
                        ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600'
                    ]"
                  >
                    <Loader2 v-if="imageUploading" :size="14" class="animate-spin" />
                    <ImageIcon v-else :size="14" />
                    {{ imageUploading ? 'กำลังอัปโหลด...' : form.problemImageUrl ? 'เปลี่ยนรูป' : 'อัปโหลดรูปภาพ' }}
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      :disabled="imageUploading"
                      @change="handleImageUpload"
                    />
                  </label>
                  <span class="ml-2 text-xs text-slate-400">ไฟล์ไม่เกิน 5MB</span>
                </div>
              </div>

              <!-- เฉลย -->
              <div>
                <label for="q-solution" class="block text-sm font-medium text-slate-700 mb-1.5">
                  แนวทางเฉลย
                  <span class="text-slate-400 font-normal">(ถ้ามี)</span>
                </label>
                <textarea
                  id="q-solution"
                  v-model="form.referenceSolution"
                  rows="2"
                  placeholder="ระบุแนวทางการเฉลย..."
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder:text-slate-300"
                />
              </div>

              <!-- คำตอบ -->
              <div>
                <label for="q-answer" class="block text-sm font-medium text-slate-700 mb-1.5">
                  คำตอบ
                  <span class="text-slate-400 font-normal">(ถ้ามี)</span>
                </label>
                <input id="q-answer" v-model="form.answer" type="text"
                  placeholder="ระบุคำตอบ..."
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder:text-slate-300" />
              </div>

              <!-- ข้อเสนอแนะ -->
              <div class="pt-1">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-baseline gap-2">
                    <span class="text-sm font-medium text-slate-700">ข้อเสนอแนะ</span>
                    <span class="text-xs text-slate-400">(ข้อเสนอแนะที่ใช้งานบ่อย)</span>
                  </div>
                  <span v-if="form.quickFeedbacks.length > 0" class="text-xs text-slate-400 mt-0.5">{{ form.quickFeedbacks.length }} รายการ</span>
                </div>

                <!-- Existing feedbacks -->
                <div v-if="form.quickFeedbacks.length > 0" class="border border-slate-200 rounded-lg overflow-hidden mb-3">
                  <div
                    v-for="(fb, idx) in form.quickFeedbacks"
                    :key="idx"
                    class="flex items-center gap-3 px-3 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 group"
                  >
                    <span class="text-xs text-slate-400 w-4 flex-shrink-0 text-center">{{ idx + 1 }}</span>
                    <span class="flex-1 text-sm text-slate-700 leading-relaxed">{{ fb }}</span>
                    <button
                      type="button"
                      @click="removeQuickFeedback(idx)"
                      class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition flex-shrink-0"
                    >
                      <X :size="13" class="text-red-400" />
                    </button>
                  </div>
                </div>

                <!-- Add new feedback -->
                <div class="flex gap-2">
                  <input
                    v-model="newFeedbackText"
                    type="text"
                    placeholder="พิมพ์ข้อเสนอแนะที่ต้องการเพิ่ม..."
                    class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder:text-slate-300"
                    @keydown.enter.prevent="addQuickFeedback"
                  />
                  <button
                    type="button"
                    @click="addQuickFeedback"
                    class="px-3 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Plus :size="14" />
                    เพิ่ม
                  </button>
                </div>
              </div>

            </form>
          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 flex-shrink-0">
            <button type="button" @click="showModal = false"
              class="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
              ยกเลิก
            </button>
            <button type="submit" form="question-form"
              class="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition">
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { Plus, Pencil, Trash2, X, ImageIcon, Loader2 } from 'lucide-vue-next'

import { useApi } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import { useConfirm } from '~/composables/useConfirm'
import { useAdminAuthStore } from '~/stores/auth'

definePageMeta({ middleware: 'auth', layout: false })

const { apiFetch } = useApi()
const { success: toastSuccess, error: toastError } = useToast()
const { confirm } = useConfirm()
const auth = useAdminAuthStore()
const levelMap = { m1: 'ม.1', m2: 'ม.2', m3: 'ม.3' }

const PER_PAGE = 10
const questions = ref([])
const total = ref(0)
const loading = ref(false)
const filterLevel = ref('all')
const currentPage = ref(1)
const showModal = ref(false)
const editingId = ref(null)
const form = reactive({
  level: 'm1',
  problemText: '',
  problemImageUrl: '',
  referenceSolution: '',
  answer: '',
  quickFeedbacks: [],
})
const newFeedbackText = ref('')
const imageUploading = ref(false)
const errors = reactive({ problemText: '' })

function validate() {
  errors.problemText = form.problemText.trim() ? '' : 'กรุณาระบุข้อความโจทย์'
  return !errors.problemText
}

async function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    toastError('ไฟล์ใหญ่เกิน 5MB กรุณาเลือกไฟล์ขนาดเล็กกว่านี้')
    event.target.value = ''
    return
  }
  imageUploading.value = true
  try {
    const fd = new FormData()
    fd.append('image', file)
    const data = await apiFetch('/upload/question-image', { method: 'POST', body: fd })
    form.problemImageUrl = data.url
  } catch (e) {
    toastError(e?.data?.message || 'อัปโหลดรูปไม่สำเร็จ')
  } finally {
    imageUploading.value = false
    event.target.value = ''
  }
}

function addQuickFeedback() {
  const text = newFeedbackText.value.trim()
  if (!text) return
  form.quickFeedbacks.push(text)
  newFeedbackText.value = ''
}

function removeQuickFeedback(index) {
  form.quickFeedbacks.splice(index, 1)
}

const availableLevels = computed(() => {
  if (auth.isSuperAdmin) return ['m1', 'm2', 'm3']
  return auth.managedLevels || []
})


function openModal(q = null) {
  if (q) {
    editingId.value = q._id
    form.level = q.level
    form.problemText = q.problemText
    form.problemImageUrl = q.problemImageUrl || ''
    form.referenceSolution = q.referenceSolution
    form.answer = q.answer || ''
    form.quickFeedbacks = [...(q.quickFeedbacks || [])]
  } else {
    editingId.value = null
    form.level = availableLevels.value[0] || 'm1'
    form.problemText = ''
    form.problemImageUrl = ''
    form.referenceSolution = ''
    form.answer = ''
    form.quickFeedbacks = []
  }
  newFeedbackText.value = ''
  errors.problemText = ''
  imageUploading.value = false
  showModal.value = true
}

async function handleSave() {
  if (!validate()) return
  try {
    const body = { ...form, quickFeedbacks: [...form.quickFeedbacks] }
    if (editingId.value) {
      await apiFetch(`/questions/${editingId.value}`, { method: 'PUT', body })
      toastSuccess('แก้ไขข้อสอบเรียบร้อยแล้ว')
    } else {
      await apiFetch('/questions', { method: 'POST', body })
      toastSuccess('เพิ่มข้อสอบเรียบร้อยแล้ว')
    }
    showModal.value = false
    await loadQuestions()
  } catch (e) {
    toastError(e?.data?.message || 'เกิดข้อผิดพลาด')
  }
}

async function handleDelete(id) {
  const ok = await confirm({ title: 'ลบข้อสอบ', message: 'ต้องการลบข้อสอบนี้? การลบไม่สามารถย้อนกลับได้', confirmLabel: 'ลบเลย', danger: true })
  if (!ok) return
  try {
    await apiFetch(`/questions/${id}`, { method: 'DELETE' })
    toastSuccess('ลบข้อสอบเรียบร้อยแล้ว')
    await loadQuestions()
  } catch (e) {
    toastError(e?.data?.message || 'เกิดข้อผิดพลาด')
  }
}

async function loadQuestions() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: currentPage.value, limit: PER_PAGE })
    if (filterLevel.value !== 'all') params.append('level', filterLevel.value)
    const res = await apiFetch(`/questions?${params}`)
    questions.value = res.data
    total.value = res.pagination.total
  } catch (e) {
    toastError(e?.data?.message || 'ไม่สามารถโหลดข้อสอบได้')
  } finally {
    loading.value = false
  }
}

function resetAndLoad() {
  if (currentPage.value !== 1) {
    currentPage.value = 1
  } else {
    loadQuestions()
  }
}

watch(currentPage, loadQuestions)
watch(filterLevel, resetAndLoad)

onMounted(loadQuestions)
</script>
