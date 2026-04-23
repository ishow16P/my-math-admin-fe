<template>
  <Teleport to="body">
    <div class="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none" aria-live="polite">
      <TransitionGroup name="toast" tag="div" class="flex flex-col gap-2">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[260px] max-w-sm"
          :class="{
            'bg-emerald-50 border-emerald-200 text-emerald-800': t.type === 'success',
            'bg-red-50 border-red-200 text-red-800': t.type === 'error',
            'bg-indigo-50 border-indigo-200 text-indigo-800': t.type === 'info',
          }"
        >
          <!-- Icon -->
          <span class="shrink-0 mt-0.5">
            <CheckCircle2 v-if="t.type === 'success'" :size="18" class="text-emerald-500" />
            <XCircle v-else-if="t.type === 'error'" :size="18" class="text-red-500" />
            <Info v-else :size="18" class="text-indigo-500" />
          </span>

          <!-- Message -->
          <span class="flex-1 text-sm font-medium leading-snug">{{ t.message }}</span>

          <!-- Close -->
          <button
            type="button"
            @click="remove(t.id)"
            class="shrink-0 opacity-50 hover:opacity-100 transition"
          >
            <X :size="15" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { CheckCircle2, XCircle, Info, X } from 'lucide-vue-next'
import { useToast } from '~/composables/useToast'

const { toasts, remove } = useToast()
</script>

<style scoped>
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(60px) scale(0.9);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(60px) scale(0.9);
}
</style>
