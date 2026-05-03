<template>
  <div class="min-h-screen bg-slate-50 flex">
    <!-- Sidebar -->
    <aside class="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200">
      <div class="p-4 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <GraduationCap :size="24" class="text-indigo-600" />
          <span class="font-bold text-slate-800">Math Exam Admin</span>
        </div>
      </div>

      <nav class="flex-1 p-3 space-y-1">
        <NuxtLink
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="isActive(item.to)
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-slate-600 hover:bg-slate-50'"
        >
          <component :is="item.icon" :size="18" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="p-3 border-t border-slate-100">
        <div class="px-3 py-2 text-sm text-slate-500">
          {{ auth.name }}
        </div>
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition"
        >
          <LogOut :size="18" />
          ออกจากระบบ
        </button>
      </div>
    </aside>

    <!-- Mobile Header -->
    <div class="flex-1 flex flex-col">
      <header class="lg:hidden bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between">
        <button @click="mobileMenu = !mobileMenu" class="p-2 rounded-lg hover:bg-slate-100">
          <Menu :size="20" class="text-slate-600" />
        </button>
        <span class="font-bold text-slate-800">Math Exam Admin</span>
        <div class="w-10" />
      </header>

      <!-- Mobile Menu Overlay -->
      <div v-if="mobileMenu" class="lg:hidden fixed inset-0 z-40">
        <div class="absolute inset-0 bg-black/20" @click="mobileMenu = false" />
        <div class="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl p-3 space-y-1">
          <div class="p-3 mb-2 flex items-center gap-2">
            <GraduationCap :size="24" class="text-indigo-600" />
            <span class="font-bold text-slate-800">Math Exam Admin</span>
          </div>
          <NuxtLink
            v-for="item in menuItems"
            :key="item.to"
            :to="item.to"
            @click="mobileMenu = false"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            :class="isActive(item.to)
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-slate-600 hover:bg-slate-50'"
          >
            <component :is="item.icon" :size="18" />
            {{ item.label }}
          </NuxtLink>
        </div>
      </div>

      <main class="flex-1">
        <slot />
      </main>
    </div>
  </div>
  <ToastContainer />
  <ConfirmDialog />
</template>

<script setup>
import { GraduationCap, LayoutDashboard, FileText, Users, ClipboardCheck, LogOut, Menu, UserCog, TrendingUp, BarChart3 } from 'lucide-vue-next'
import ToastContainer from '~/components/ToastContainer.vue'
import ConfirmDialog from '~/components/ConfirmDialog.vue'
import { useAdminAuthStore } from '~/stores/auth'
import { useConfirm } from '~/composables/useConfirm'

const auth = useAdminAuthStore()
const { logout } = useAuth()
const { confirm } = useConfirm()
const router = useRouter()
const route = useRoute()
const mobileMenu = ref(false)

const menuItems = computed(() => {
  const items = [
    { to: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { to: '/questions', label: 'จัดการข้อสอบ', icon: FileText },
    { to: '/students', label: 'จัดการนักเรียน', icon: Users },
    { to: '/submissions', label: 'ตรวจข้อสอบ', icon: ClipboardCheck },
    { to: '/progress', label: 'พัฒนาการนักเรียน', icon: TrendingUp },
    { to: '/classroom-scores', label: 'คะแนนรายห้อง', icon: BarChart3 },
  ]
  if (auth.isSuperAdmin) {
    items.push({ to: '/teachers', label: 'จัดการครู', icon: UserCog })
  }
  return items
})

function isActive(path) {
  return route.path.startsWith(path)
}

async function handleLogout() {
  const ok = await confirm({
    title: 'ออกจากระบบ',
    message: 'ต้องการออกจากระบบหรือไม่?',
    confirmLabel: 'ออกจากระบบ',
  })
  if (!ok) return
  await logout()
  router.push('/')
}
</script>
