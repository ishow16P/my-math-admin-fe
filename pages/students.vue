<template>
  <NuxtLayout name="admin">
    <div class="p-6 md:p-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-xl font-bold text-slate-800">จัดการนักเรียน</h1>
        <button
          @click="openModal()"
          class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          <Plus :size="16" />
          เพิ่มนักเรียน
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

      <!-- Table -->
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-500">
            <tr>
              <th class="text-left px-4 py-3 font-medium">รหัส</th>
              <th class="text-left px-4 py-3 font-medium">ชื่อ</th>
              <th class="text-left px-4 py-3 font-medium">ระดับ</th>
              <th class="text-left px-4 py-3 font-medium">ห้อง</th>
              <th class="text-right px-4 py-3 font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="s in filteredStudents" :key="s._id" class="hover:bg-slate-50">
              <td class="px-4 py-3 font-mono text-slate-600">{{ s.studentId }}</td>
              <td class="px-4 py-3 text-slate-800">{{ s.name }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                  {{ levelMap[s.level] }}
                </span>
              </td>
              <td class="px-4 py-3 text-slate-500 text-sm">{{ s.classroom ? `${s.level.replace('m', '')}/${s.classroom}` : '-' }}</td>
              <td class="px-4 py-3 text-right">
                <button @click="openModal(s)" class="p-1.5 rounded hover:bg-slate-100 transition">
                  <Pencil :size="14" class="text-slate-400" />
                </button>
                <button @click="handleDelete(s._id)" class="p-1.5 rounded hover:bg-red-50 transition ml-1">
                  <Trash2 :size="14" class="text-red-400" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="filteredStudents.length === 0" class="p-8 text-center text-slate-400">
          ไม่พบนักเรียน
        </div>
      </div>

      <!-- Modal -->
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="showModal = false" />
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">

          <!-- Header -->
          <div class="px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
            <h2 class="text-base font-semibold text-slate-800">
              {{ editingId ? 'แก้ไขนักเรียน' : 'เพิ่มนักเรียน' }}
            </h2>
          </div>

          <!-- Body -->
          <div class="overflow-y-auto flex-1 px-6 py-5">
            <form id="student-form" @submit.prevent="handleSave" class="space-y-4">

              <!-- รหัสนักเรียน -->
              <div>
                <label for="s-id" class="block text-sm font-medium text-slate-700 mb-1.5">
                  รหัสนักเรียน <span v-if="!editingId" class="text-red-500">*</span>
                </label>
                <input
                  id="s-id"
                  v-model="form.studentId"
                  type="text"
                  :disabled="!!editingId"
                  placeholder="ระบุรหัสนักเรียน..."
                  @input="errors.studentId = ''"
                  :class="[
                    'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-400',
                    errors.studentId
                      ? 'border-red-400 focus:ring-red-300 bg-red-50'
                      : 'border-slate-200 focus:ring-indigo-300'
                  ]"
                />
                <p v-if="errors.studentId" class="mt-1 text-xs text-red-500">{{ errors.studentId }}</p>
              </div>

              <!-- ชื่อ-นามสกุล -->
              <div>
                <label for="s-name" class="block text-sm font-medium text-slate-700 mb-1.5">
                  ชื่อ-นามสกุล <span class="text-red-500">*</span>
                </label>
                <input
                  id="s-name"
                  v-model="form.name"
                  type="text"
                  placeholder="ระบุชื่อ-นามสกุล..."
                  @input="errors.name = ''"
                  :class="[
                    'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 placeholder:text-slate-300',
                    errors.name
                      ? 'border-red-400 focus:ring-red-300 bg-red-50'
                      : 'border-slate-200 focus:ring-indigo-300'
                  ]"
                />
                <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
              </div>

              <!-- ระดับชั้น -->
              <div>
                <label for="s-level" class="block text-sm font-medium text-slate-700 mb-1.5">ระดับชั้น</label>
                <select
                  id="s-level"
                  v-model="form.level"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300"
                >
                  <option v-for="lvl in availableLevels" :key="lvl" :value="lvl">{{ levelMap[lvl] }}</option>
                </select>
              </div>

              <!-- เลขห้อง -->
              <div>
                <label for="s-classroom" class="block text-sm font-medium text-slate-700 mb-1.5">
                  เลขห้อง <span class="text-slate-400 font-normal">(ถ้ามี)</span>
                </label>
                <input
                  id="s-classroom"
                  v-model.number="form.classroom"
                  type="number"
                  min="1"
                  placeholder="เช่น 3"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder:text-slate-300"
                />
              </div>

              <!-- รหัสผ่าน -->
              <div>
                <label for="s-password" class="block text-sm font-medium text-slate-700 mb-1.5">
                  {{ editingId ? 'รหัสผ่านใหม่' : 'รหัสผ่าน' }}
                  <span v-if="!editingId" class="text-red-500">*</span>
                  <span v-else class="text-slate-400 font-normal">(เว้นว่างถ้าไม่เปลี่ยน)</span>
                </label>
                <input
                  id="s-password"
                  v-model="form.password"
                  type="password"
                  placeholder="ระบุรหัสผ่าน..."
                  @input="errors.password = ''"
                  :class="[
                    'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 placeholder:text-slate-300',
                    errors.password
                      ? 'border-red-400 focus:ring-red-300 bg-red-50'
                      : 'border-slate-200 focus:ring-indigo-300'
                  ]"
                />
                <p v-if="errors.password" class="mt-1 text-xs text-red-500">{{ errors.password }}</p>
              </div>

            </form>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 flex-shrink-0">
            <button type="button" @click="showModal = false"
              class="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
              ยกเลิก
            </button>
            <button type="submit" form="student-form"
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
import { Plus, Pencil, Trash2 } from 'lucide-vue-next'
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

const students = ref([])
const filterLevel = ref('all')
const showModal = ref(false)
const editingId = ref(null)
const form = reactive({ studentId: '', name: '', level: 'm1', classroom: null, password: '' })
const errors = reactive({ studentId: '', name: '', password: '' })

function validate() {
  errors.studentId = (!editingId.value && !form.studentId.trim()) ? 'กรุณาระบุรหัสนักเรียน' : ''
  errors.name = form.name.trim() ? '' : 'กรุณาระบุชื่อ-นามสกุล'
  errors.password = (!editingId.value && !form.password) ? 'กรุณาระบุรหัสผ่าน' : ''
  return !errors.studentId && !errors.name && !errors.password
}

const availableLevels = computed(() => {
  if (auth.isSuperAdmin) return ['m1', 'm2', 'm3']
  return auth.managedLevels || []
})

const filteredStudents = computed(() => {
  const byLevel = filterLevel.value === 'all' ? students.value : students.value.filter((s) => s.level === filterLevel.value)
  if (!auth.isSuperAdmin && auth.managedLevels?.length > 0) {
    return byLevel.filter((s) => auth.managedLevels.includes(s.level))
  }
  return byLevel
})

function openModal(s = null) {
  if (s) {
    editingId.value = s._id
    form.studentId = s.studentId
    form.name = s.name
    form.level = s.level
    form.classroom = s.classroom ?? null
    form.password = ''
  } else {
    editingId.value = null
    form.studentId = ''
    form.name = ''
    form.level = availableLevels.value[0] || 'm1'
    form.classroom = null
    form.password = ''
  }
  errors.studentId = ''
  errors.name = ''
  errors.password = ''
  showModal.value = true
}

async function handleSave() {
  if (!validate()) return
  try {
    const body = { ...form }
    if (editingId.value && !body.password) delete body.password
    if (editingId.value) {
      await apiFetch(`/students/${editingId.value}`, { method: 'PUT', body })
      toastSuccess('แก้ไขข้อมูลนักเรียนเรียบร้อยแล้ว')
    } else {
      await apiFetch('/students', { method: 'POST', body })
      toastSuccess('เพิ่มนักเรียนเรียบร้อยแล้ว')
    }
    showModal.value = false
    await loadStudents()
  } catch (e) {
    toastError(e?.data?.message || 'เกิดข้อผิดพลาด')
  }
}

async function handleDelete(id) {
  const ok = await confirm({ title: 'ลบนักเรียน', message: 'ต้องการลบนักเรียนนี้ออกจากระบบ?', confirmLabel: 'ลบเลย' })
  if (!ok) return
  try {
    await apiFetch(`/students/${id}`, { method: 'DELETE' })
    toastSuccess('ลบนักเรียนเรียบร้อยแล้ว')
    await loadStudents()
  } catch (e) {
    toastError(e?.data?.message || 'เกิดข้อผิดพลาด')
  }
}

async function loadStudents() {
  students.value = await apiFetch('/students')
}

onMounted(loadStudents)
</script>
