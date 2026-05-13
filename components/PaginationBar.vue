<template>
  <div class="flex items-center justify-between px-1 py-3">
    <p class="text-xs text-slate-400">
      แสดง {{ from }}–{{ to }} จาก {{ total }} รายการ
    </p>
    <div class="flex items-center gap-1">
      <button
        @click="emit('update:modelValue', modelValue - 1)"
        :disabled="modelValue === 1"
        class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <ChevronLeft :size="14" />
      </button>

      <template v-for="p in pages" :key="p">
        <span v-if="p === '...'" class="w-8 h-8 flex items-center justify-center text-xs text-slate-400">…</span>
        <button
          v-else
          @click="emit('update:modelValue', p)"
          class="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition"
          :class="p === modelValue ? 'bg-indigo-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'"
        >
          {{ p }}
        </button>
      </template>

      <button
        @click="emit('update:modelValue', modelValue + 1)"
        :disabled="modelValue === totalPages"
        class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <ChevronRight :size="14" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Number, required: true },
  total: { type: Number, required: true },
  perPage: { type: Number, default: 10 },
})

const emit = defineEmits(['update:modelValue'])

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.perPage)))
const from = computed(() => props.total === 0 ? 0 : (props.modelValue - 1) * props.perPage + 1)
const to = computed(() => Math.min(props.modelValue * props.perPage, props.total))

const pages = computed(() => {
  const total = totalPages.value
  const cur = props.modelValue
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const result = []
  result.push(1)
  if (cur > 3) result.push('...')
  for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) result.push(p)
  if (cur < total - 2) result.push('...')
  result.push(total)
  return result
})
</script>
