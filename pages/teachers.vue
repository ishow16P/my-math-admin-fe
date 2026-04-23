<template>
  <NuxtLayout name="admin">
    <div class="p-6 md:p-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-xl font-bold text-slate-800">จัดการครู</h1>
          <p class="text-sm text-slate-400 mt-0.5">เฉพาะ Superadmin เท่านั้น</p>
        </div>
        <button
          @click="openModal()"
          class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          <Plus :size="16" />
          เพิ่มครู
        </button>
      </div>

      <!-- Teachers List -->
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-500">
            <tr>
              <th class="text-left px-4 py-3 font-medium">ชื่อ</th>
              <th class="text-left px-4 py-3 font-medium">อีเมล</th>
              <th class="text-left px-4 py-3 font-medium">ระดับที่ดูแล</th>
              <th class="text-right px-4 py-3 font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="t in teachers" :key="t._id" class="hover:bg-slate-50">
              <td class="px-4 py-3 text-slate-800 font-medium">{{ t.name }}</td>
              <td class="px-4 py-3 text-slate-500">{{ t.email }}</td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="lvl in (t.managedLevels || [])"
                    :key="lvl"
                    class="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700"
                  >
                    {{ levelMap[lvl] }}
                  </span>
                  <span v-if="!t.managedLevels?.length" class="text-xs text-slate-400">ไม่มี</span>
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <button @click="openModal(t)" class="p-1.5 rounded hover:bg-slate-100 transition">
                  <Pencil :size="14" class="text-slate-400" />
                </button>
                <button @click="handleDelete(t._id)" class="p-1.5 rounded hover:bg-red-50 transition ml-1">
                  <Trash2 :size="14" class="text-red-400" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="teachers.length === 0 && !loading" class="p-8 text-center text-slate-400">
          ยังไม่มีครู
        </div>
      </div>

      <!-- Modal -->
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/30" @click="showModal = false" />
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">
            {{ editingId ? 'แก้ไขครู' : 'เพิ่มครู' }}
          </h2>

          <form @submit.prevent="handleSave" class="space-y-4">
            <div>
              <label for="t-name" class="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล</label>
              <input id="t-name" v-model="form.name" type="text" required
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <label for="t-email" class="block text-sm font-medium text-slate-700 mb-1">อีเมล</label>
              <input id="t-email" v-model="form.email" type="email" required :disabled="!!editingId"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50" />
            </div>
            <div>
              <label for="t-password" class="block text-sm font-medium text-slate-700 mb-1">
                {{ editingId ? 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน' }}
              </label>
              <input id="t-password" v-model="form.password" type="password" :required="!editingId"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
            <div>
              <span class="block text-sm font-medium text-slate-700 mb-2">ระดับที่ดูแล</span>
              <div class="flex gap-3">
                <label
                  v-for="lvl in ['m1', 'm2', 'm3']"
                  :key="lvl"
                  class="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :value="lvl"
                    v-model="form.managedLevels"
                    class="rounded border-slate-300 text-indigo-600"
                  />
                  <span class="text-sm text-slate-700">{{ levelMap[lvl] }}</span>
                </label>
              </div>
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
const router = useRouter()
const levelMap = { m1: 'ม.1', m2: 'ม.2', m3: 'ม.3' }

// เฉพาะ superadmin เข้าถึงได้
onMounted(async () => {
  if (!auth.isSuperAdmin) {
    router.push('/dashboard')
    return
  }
  await loadTeachers()
})

const teachers = ref([])
const loading = ref(false)
const showModal = ref(false)
const editingId = ref(null)
const form = reactive({ name: '', email: '', password: '', managedLevels: [] })

function openModal(t = null) {
  if (t) {
    editingId.value = t._id
    form.name = t.name
    form.email = t.email
    form.password = ''
    form.managedLevels = [...(t.managedLevels || [])]
  } else {
    editingId.value = null
    form.name = ''
    form.email = ''
    form.password = ''
    form.managedLevels = []
  }
  showModal.value = true
}

async function handleSave() {
  try {
    const body = { ...form }
    if (editingId.value && !body.password) delete body.password
    if (editingId.value) {
      await apiFetch(`/teachers/${editingId.value}`, { method: 'PUT', body })
    } else {
      await apiFetch('/teachers', { method: 'POST', body })
    }
    showModal.value = false
    await loadTeachers()
  } catch (e) {
    toastError(e?.data?.message || 'เกิดข้อผิดพลาด')
  }
}

async function handleDelete(id) {
  const ok = await confirm({ title: 'ลบครู', message: 'ต้องการลบบัญชีครูนี้ออกจากระบบ?', confirmLabel: 'ลบเลย' })
  if (!ok) return
  try {
    await apiFetch(`/teachers/${id}`, { method: 'DELETE' })
    await loadTeachers()
  } catch (e) {
    toastError(e?.data?.message || 'เกิดข้อผิดพลาด')
  }
}

async function loadTeachers() {
  loading.value = true
  try {
    teachers.value = await apiFetch('/teachers')
  } finally {
    loading.value = false
  }
}
</script>
