<template>
  <div ref="containerRef" class="math-display-container" />
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  value: { type: String, default: '' },
})

const containerRef = ref(null)

async function render(val) {
  if (!import.meta.client || !containerRef.value) return
  const container = containerRef.value
  if (!val?.trim()) {
    container.innerHTML = '<span class="text-slate-400 text-sm italic">—</span>'
    return
  }
  const { MathfieldElement } = await import('mathlive')
  if (!customElements.get('math-field')) {
    customElements.define('math-field', MathfieldElement)
  }
  container.innerHTML = ''
  const lines = val.split('\n')
  lines.forEach((line, i) => {
    if (line.trim() === '') {
      container.appendChild(document.createElement('br'))
    } else {
      const mf = document.createElement('math-field')
      mf.setAttribute('read-only', '')
      mf.value = line
      mf.style.display = 'block'
      mf.style.background = 'transparent'
      mf.style.border = 'none'
      mf.style.padding = '0'
      mf.style.fontSize = '1rem'
      mf.style.lineHeight = '1.75'
      container.appendChild(mf)
    }
  })
}

onMounted(() => render(props.value))
watch(() => props.value, render)
</script>

<style>
.math-display-container math-field[read-only] {
  pointer-events: none;
  user-select: text;
}
</style>
