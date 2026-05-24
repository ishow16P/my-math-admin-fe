<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="state.visible"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        @click.self="onCancel"
      >
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="onCancel" />

        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
          <!-- Icon -->
          <div class="flex justify-center">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center"
              :class="state.danger ? 'bg-red-100' : 'bg-emerald-100'"
            >
              <AlertTriangle v-if="state.danger" :size="22" class="text-red-500" />
              <CheckCircle2 v-else :size="22" class="text-emerald-500" />
            </div>
          </div>

          <!-- Text -->
          <div class="text-center space-y-2">
            <h2 class="text-base font-bold text-slate-800">{{ state.title }}</h2>
            <template v-if="state.message">
              <template v-if="messageLines.length > 1">
                <p class="text-sm font-semibold" :class="state.danger ? 'text-red-600' : 'text-emerald-600'">
                  {{ messageLines[0] }}
                </p>
                <p class="text-xs text-slate-400">{{ messageLines[1] }}</p>
              </template>
              <p v-else class="text-sm text-slate-500">{{ state.message }}</p>
            </template>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-1">
            <button
              type="button"
              @click="onCancel"
              class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              @click="onConfirm"
              class="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
              :class="state.confirmClass"
            >
              {{ state.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { AlertTriangle, CheckCircle2 } from 'lucide-vue-next'
import { useConfirm } from '~/composables/useConfirm'

const { state, onConfirm, onCancel } = useConfirm()

const messageLines = computed(() => state.message?.split('\n') ?? [])
</script>

<style scoped>
.modal-fade-enter-active {
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-fade-leave-active {
  transition: all 0.15s ease-in;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .relative {
  transform: scale(0.95) translateY(8px);
}
</style>
