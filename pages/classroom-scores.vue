<template>
  <NuxtLayout name="admin">
    <div class="p-6 md:p-8">
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 class="text-xl font-bold text-slate-800">คะแนนรายห้อง</h1>
      </div>

      <!-- Filter -->
      <div class="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div class="flex flex-wrap gap-3">
          <div class="flex-1 min-w-[140px]">
            <label
              for="filter-level"
              class="block text-sm font-medium text-slate-700 mb-1"
              >ระดับ</label
            >
            <select id="filter-level" v-model="filterLevel" :class="filterControlClass">
              <option v-for="lvl in availableLevels" :key="lvl" :value="lvl">
                {{ levelMap[lvl] }}
              </option>
            </select>
          </div>
          <div class="flex-1 min-w-[140px]">
            <label
              for="filter-classroom"
              class="block text-sm font-medium text-slate-700 mb-1"
              >เลขห้อง (ไม่บังคับ)</label
            >
            <input
              id="filter-classroom"
              v-model.number="filterClassroom"
              type="number"
              min="1"
              placeholder="เช่น 3"
              :class="filterControlClass"
            />
          </div>
          <div class="flex items-end gap-2">
            <button
              @click="loadScores"
              :disabled="loading"
              class="h-10 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 inline-flex items-center justify-center"
            >
              โหลด
            </button>
            <button
              @click="exportCSV"
              :disabled="!scores.length"
              class="h-10 inline-flex items-center justify-center gap-1.5 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              <Download :size="14" />
              Export
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <Loader2 :size="24" class="animate-spin text-indigo-500" />
      </div>

      <!-- Table -->
      <div
        v-else-if="scores.length > 0"
        class="bg-white rounded-xl border border-slate-200 overflow-x-auto"
      >
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-500">
            <!-- Row 1: exam type groups -->
            <tr class="border-b border-slate-200">
              <th rowspan="2" class="text-left px-4 py-2 font-medium whitespace-nowrap border-r border-slate-200">ลำดับ</th>
              <th rowspan="2" class="text-left px-4 py-2 font-medium whitespace-nowrap border-r border-slate-200">รหัส</th>
              <th rowspan="2" class="text-left px-4 py-2 font-medium whitespace-nowrap border-r border-slate-200">ชื่อ-นามสกุล</th>
              <th rowspan="2" class="text-left px-4 py-2 font-medium whitespace-nowrap border-r border-slate-200">ห้อง</th>
              <th v-for="et in EXAM_TYPES" :key="et.type"
                :colspan="et.questionCount"
                class="text-center px-4 py-2 font-medium whitespace-nowrap border-l border-slate-200">
                {{ et.label }}
              </th>
            </tr>
            <!-- Row 2: per-question -->
            <tr>
              <th v-for="col in COLUMNS" :key="`${col.type}-${col.qIndex}`"
                class="text-center px-3 py-1.5 font-normal text-xs whitespace-nowrap border-l border-slate-100">
                {{ col.questionCount > 1 ? `ข้อ ${col.qIndex + 1}` : 'คะแนน' }}
                <span class="text-slate-300">/10</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="(s, i) in scores" :key="s._id" class="hover:bg-slate-50">
              <td class="px-4 py-3 text-slate-400 border-r border-slate-100">{{ i + 1 }}</td>
              <td class="px-4 py-3 font-mono text-slate-600 border-r border-slate-100">{{ s.studentId }}</td>
              <td class="px-4 py-3 text-slate-800 border-r border-slate-100">{{ s.name }}</td>
              <td class="px-4 py-3 text-slate-500 whitespace-nowrap border-r border-slate-100">
                {{ s.classroom ? `${s.level.replace("m", "")}/${s.classroom}` : "-" }}
              </td>
              <td v-for="col in COLUMNS" :key="`${col.type}-${col.qIndex}`"
                class="px-3 py-3 text-center border-l border-slate-100">
                <template v-if="getQuestionScore(s, col.type, col.qIndex) !== null">
                  <span class="font-semibold text-indigo-600">{{ getQuestionScore(s, col.type, col.qIndex) }}</span>
                </template>
                <span v-else class="text-slate-200">—</span>
              </td>
            </tr>
          </tbody>
          <!-- Average row -->
          <tfoot>
            <tr class="bg-slate-50 border-t-2 border-slate-200">
              <td class="px-4 py-3 text-xs font-semibold text-slate-500 border-r border-slate-200" colspan="4">
                คะแนนเฉลี่ย
              </td>
              <td v-for="col in COLUMNS" :key="`avg-${col.type}-${col.qIndex}`"
                class="px-3 py-3 text-center border-l border-slate-100">
                <template v-if="avgCol(col.type, col.qIndex) !== null">
                  <span class="font-bold text-slate-700">{{ avgCol(col.type, col.qIndex) }}</span>
                </template>
                <span v-else class="text-slate-300">—</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div v-else-if="searched" class="text-center py-12 text-slate-400">
        ไม่พบข้อมูลสำหรับเงื่อนไขที่เลือก
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { Loader2, Download } from "lucide-vue-next";
import { useApi } from "~/composables/useApi";
import { useToast } from "~/composables/useToast";
import { useAdminAuthStore } from "~/stores/auth";

definePageMeta({ middleware: "auth", layout: false });

const { apiFetch } = useApi();
const { error: toastError } = useToast();
const auth = useAdminAuthStore();
const levelMap = { m1: "ม.1", m2: "ม.2", m3: "ม.3" };

const EXAM_TYPES = [
  { type: "pre_test",   label: "ก่อนเรียน",  questionCount: 2 },
  { type: "in_class_1", label: "ท้ายคาบ 1", questionCount: 1 },
  { type: "in_class_2", label: "ท้ายคาบ 2", questionCount: 1 },
  { type: "in_class_3", label: "ท้ายคาบ 3", questionCount: 1 },
  { type: "post_test",  label: "หลังเรียน",  questionCount: 2 },
];

// flatten columns: { type, label, qIndex (0-based), colLabel }
const COLUMNS = EXAM_TYPES.flatMap((et) =>
  Array.from({ length: et.questionCount }, (_, i) => ({
    type: et.type,
    groupLabel: et.label,
    questionCount: et.questionCount,
    qIndex: i,
    colLabel: et.questionCount > 1 ? `ข้อ ${i + 1}` : et.label,
  }))
);

function getSub(student, examType) {
  return student.submissions.find((s) => s.examType === examType) ?? null;
}

function getQuestionScore(student, examType, qIndex) {
  const sub = getSub(student, examType);
  if (!sub) return null;
  return sub.answerScores?.[qIndex] ?? null;
}

function avgCol(examType, qIndex) {
  const vals = scores.value
    .map((s) => getQuestionScore(s, examType, qIndex))
    .filter((v) => v !== null);
  if (!vals.length) return null;
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

const availableLevels = computed(() => {
  if (auth.isSuperAdmin) return ["m1", "m2", "m3"];
  return auth.managedLevels || [];
});

/** ให้ select/input สูงเท่ากันทุกเบราว์เซอร์ */
const filterControlClass =
  "w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400";

const filterLevel = ref(availableLevels.value[0] || "m1");
const filterClassroom = ref(null);
const scores = ref([]);
const loading = ref(false);
const searched = ref(false);

async function loadScores() {
  loading.value = true;
  searched.value = false;
  try {
    const params = new URLSearchParams({ level: filterLevel.value });
    if (filterClassroom.value) params.append("classroom", filterClassroom.value);
    scores.value = await apiFetch(`/analytics/classroom?${params}`);
    searched.value = true;
  } catch (e) {
    toastError(e?.data?.message || "เกิดข้อผิดพลาด");
  } finally {
    loading.value = false;
  }
}

function exportCSV() {
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

  // Header row 1: group labels
  const h1 = ["ลำดับ", "รหัส", "ชื่อ-นามสกุล", "ห้อง"];
  EXAM_TYPES.forEach((et) => {
    h1.push(et.label);
    for (let i = 1; i < et.questionCount; i++) h1.push("");
  });

  // Header row 2: per-question labels
  const h2 = ["", "", "", ""];
  COLUMNS.forEach((col) => {
    h2.push(col.questionCount > 1 ? `ข้อ ${col.qIndex + 1}` : "คะแนน");
  });

  // Data rows
  const dataRows = scores.value.map((s, i) => {
    const row = [
      i + 1,
      s.studentId,
      s.name,
      s.classroom ? `${s.level.replace("m", "")}/${s.classroom}` : "-",
    ];
    COLUMNS.forEach((col) => {
      const v = getQuestionScore(s, col.type, col.qIndex);
      row.push(v !== null ? v : "");
    });
    return row;
  });

  // Average row
  const avgRow = ["", "", "", "เฉลี่ย"];
  COLUMNS.forEach((col) => {
    const v = avgCol(col.type, col.qIndex);
    avgRow.push(v !== null ? v : "");
  });

  const rows = [h1, h2, ...dataRows, avgRow];
  const csv = "\uFEFF" + rows.map((r) => r.map(escape).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const levelLabel = levelMap[filterLevel.value] || filterLevel.value;
  const classroomSuffix = filterClassroom.value ? `-ห้อง${filterClassroom.value}` : "";
  const filename = `คะแนนรายห้อง-${levelLabel}${classroomSuffix}.csv`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

</script>
