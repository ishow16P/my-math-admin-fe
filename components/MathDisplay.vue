<template>
  <div ref="containerRef" class="math-display-container" />
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  value: { type: String, default: '' },
})

const containerRef = ref(null)

/**
 * Parse mixed content: plain text + $latex$ blocks + newlines
 * Returns array of { type: 'text' | 'math' | 'br', content? }
 */
function parseContent(val) {
  if (!val) return []
  const parts = []
  const lines = val.split('\n')
  lines.forEach((line, lineIdx) => {
    const regex = /\$([^$]+)\$/g
    let lastIndex = 0
    let match
    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: line.slice(lastIndex, match.index) })
      }
      parts.push({ type: 'math', content: match[1] })
      lastIndex = regex.lastIndex
    }
    if (lastIndex < line.length) {
      parts.push({ type: 'text', content: line.slice(lastIndex) })
    }
    if (lineIdx < lines.length - 1) {
      parts.push({ type: 'br' })
    }
  })
  return parts
}

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
  // แก้ Safari: ป้องกัน dotted-circle จาก custom math font
  MathfieldElement.fontsDirectory = null

  const parts = parseContent(val)
  container.innerHTML = ''

  for (const part of parts) {
    if (part.type === 'br') {
      container.appendChild(document.createElement('br'))
    } else if (part.type === 'text') {
      const span = document.createElement('span')
      span.textContent = part.content
      container.appendChild(span)
    } else if (part.type === 'math') {
      const mf = document.createElement('math-field')
      mf.setAttribute('read-only', '')
      mf.value = part.content
      mf.style.display = 'inline-block'
      mf.style.background = 'transparent'
      mf.style.border = 'none'
      mf.style.padding = '0 2px'
      mf.style.fontSize = 'inherit'
      mf.style.lineHeight = 'inherit'
      mf.style.verticalAlign = 'middle'
      container.appendChild(mf)
    }
  }
}

onMounted(() => render(props.value))
watch(() => props.value, render)
</script>

<style>
.math-display-container {
  line-height: 1.75;
  font-size: 1rem;
  color: #334155;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.math-display-container math-field[read-only] {
  pointer-events: none;
  -webkit-user-select: text;
  user-select: text;
}
</style>
