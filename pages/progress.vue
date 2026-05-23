<template>
  <NuxtLayout name="admin">
    <div class="p-6 md:p-8">
      <h1 class="text-xl font-bold text-slate-800 mb-6">พัฒนาการนักเรียน</h1>

      <!-- Search Student -->
      <div class="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex-1">
            <label
              for="progress-level"
              class="block text-sm font-medium text-slate-700 mb-1"
              >เลือกระดับ</label
            >
            <select
              id="progress-level"
              v-model="filterLevel"
              @change="loadStudents"
              :class="filterControlClass"
            >
              <option value="">-- ทุกระดับ --</option>
              <option v-for="lvl in availableLevels" :key="lvl" :value="lvl">
                {{ levelMap[lvl] }}
              </option>
            </select>
          </div>
          <div class="flex-1">
            <label
              for="progress-classroom"
              class="block text-sm font-medium text-slate-700 mb-1"
              >เลขห้อง</label
            >
            <input
              id="progress-classroom"
              v-model.number="filterClassroom"
              @change="loadStudents"
              type="number"
              min="1"
              placeholder="เช่น 3"
              :class="filterControlClass"
            />
          </div>
          <div class="flex-1">
            <label
              for="progress-student"
              class="block text-sm font-medium text-slate-700 mb-1"
              >นักเรียน</label
            >
            <select
              id="progress-student"
              v-model="selectedStudentId"
              :class="filterControlClass"
            >
              <option value="">-- เลือกนักเรียน --</option>
              <option v-for="s in students" :key="s._id" :value="s._id">
                {{ s.name }} ({{ s.studentId }})
              </option>
            </select>
          </div>
          <div class="flex items-end gap-2">
            <button
              @click="loadProgress"
              :disabled="!selectedStudentId || loadingProgress"
              class="h-10 px-4 inline-flex items-center justify-center bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
            >
              ดูพัฒนาการ
            </button>
            <button
              @click="exportXLSX"
              :disabled="!progress"
              class="h-10 px-4 inline-flex items-center gap-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download :size="14" />
              ดาวน์โหลด
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loadingProgress" class="flex items-center justify-center py-12">
        <Loader2 :size="24" class="animate-spin text-indigo-500" />
      </div>

      <!-- Progress Data -->
      <div v-else-if="progress" class="space-y-6">
        <!-- Student Info -->
        <div class="bg-white rounded-xl border border-slate-200 p-5">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center"
            >
              <User :size="24" class="text-indigo-600" />
            </div>
            <div>
              <div class="font-semibold text-slate-800">{{ progress.student?.name }}</div>
              <div class="text-sm text-slate-400">
                {{ progress.student?.studentId }} —
                {{
                  progress.student?.classroom
                    ? `${progress.student.level?.replace("m", "")}/${
                        progress.student.classroom
                      }`
                    : levelMap[progress.student?.level]
                }}
              </div>
            </div>
          </div>
        </div>

        <!-- Score cards per exam type (fixed order) -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div
            v-for="type in EXAM_TYPE_ORDER"
            :key="type"
            class="bg-white rounded-xl border p-4"
            :class="examTypeMap[type] ? 'border-indigo-200' : 'border-slate-200 opacity-50'"
          >
            <div class="text-xs font-semibold mb-2"
              :class="examTypeMap[type] ? 'text-indigo-400' : 'text-slate-400'">
              {{ examTypeLabel[type] }}
            </div>
            <template v-if="examTypeMap[type]">
              <div class="text-2xl font-bold text-indigo-600">
                {{ examTypeMap[type].totalScore }}<span class="text-sm text-slate-400">/{{ examTypeMap[type].maxScore }}</span>
              </div>
              <div class="text-xs text-slate-400 mt-1">{{ formatDate(examTypeMap[type].createdAt) }}</div>
            </template>
            <div v-else class="text-sm text-slate-300">ยังไม่มีข้อมูล</div>
          </div>
        </div>

        <!-- Score History Chart -->
        <div
          v-if="sortedHistory.length > 1"
          class="bg-white rounded-xl border border-slate-200 p-5"
        >
          <h3 class="text-sm font-semibold text-slate-700 mb-4">กราฟพัฒนาการ</h3>
          <Line :data="chartData" :options="chartOptions" />
        </div>

        <!-- History Table -->
        <div
          v-if="sortedHistory.length > 0"
          class="bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
          <table class="w-full text-sm">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="text-left px-4 py-3 font-medium">แบบทดสอบ</th>
                <th class="text-left px-4 py-3 font-medium">วันที่สอบ</th>
                <th class="text-left px-4 py-3 font-medium">คะแนน</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="(h, i) in sortedHistory"
                :key="h._id"
                class="hover:bg-slate-50"
              >
                <td class="px-4 py-3 text-slate-600">{{ examTypeLabel[h.examType] || h.examType || "-" }}</td>
                <td class="px-4 py-3 text-slate-600">{{ formatDate(h.createdAt) }}</td>
                <td class="px-4 py-3 font-semibold text-indigo-600">
                  {{ h.totalScore }}/{{ h.maxScore }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { Loader2, User, Download } from "lucide-vue-next";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useApi } from "~/composables/useApi";
import { useToast } from "~/composables/useToast";
import { useAdminAuthStore } from "~/stores/auth";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

definePageMeta({ middleware: "auth", layout: false });

const { apiFetch } = useApi();
const { error: toastError } = useToast();
const auth = useAdminAuthStore();
const levelMap = { m1: "ม.1", m2: "ม.2", m3: "ม.3" };

/** ให้ select/input สูงเท่ากันทุกเบราว์เซอร์ */
const filterControlClass =
  "w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400";

const availableLevels = computed(() => {
  if (auth.isSuperAdmin) return ["m1", "m2", "m3"];
  return auth.managedLevels || [];
});

const filterLevel = ref("");
const filterClassroom = ref(null);
const selectedStudentId = ref("");
const students = ref([]);
const progress = ref(null);
const loadingProgress = ref(false);

async function loadStudents() {
  try {
    const params = new URLSearchParams();
    if (filterLevel.value) params.append("level", filterLevel.value);
    if (filterClassroom.value) params.append("classroom", filterClassroom.value);
    students.value = await apiFetch(`/students?${params}`);
    selectedStudentId.value = "";
    progress.value = null;
  } catch (e) {
    toastError(e?.data?.message || "ไม่สามารถโหลดรายชื่อนักเรียนได้");
  }
}

async function loadProgress() {
  if (!selectedStudentId.value) return;
  loadingProgress.value = true;
  try {
    progress.value = await apiFetch(
      `/analytics/student/${selectedStudentId.value}/progress`
    );
  } catch (e) {
    toastError(e?.data?.message || "เกิดข้อผิดพลาด");
  } finally {
    loadingProgress.value = false;
  }
}

const scoreDiff = computed(() => {
  if (!progress.value?.first || !progress.value?.latest) return 0;
  const f =
    (progress.value.first.totalScore / (progress.value.first.maxScore || 1)) * 100;
  const l =
    (progress.value.latest.totalScore / (progress.value.latest.maxScore || 1)) * 100;
  return l - f;
});

const examTypeLabel = {
  pre_test:   "ก่อนเรียน",
  in_class_1: "ท้ายคาบ 1",
  in_class_2: "ท้ายคาบ 2",
  in_class_3: "ท้ายคาบ 3",
  post_test:  "หลังเรียน",
};

const EXAM_TYPE_ORDER = ["pre_test", "in_class_1", "in_class_2", "in_class_3", "post_test"];

const sortedHistory = computed(() => {
  const history = progress.value?.history || [];
  return [...history].sort(
    (a, b) => EXAM_TYPE_ORDER.indexOf(a.examType) - EXAM_TYPE_ORDER.indexOf(b.examType)
  );
});

// map examType → submission (ใช้ล่าสุดถ้ามีหลายครั้งของ type เดียวกัน)
const examTypeMap = computed(() => {
  const map = {};
  for (const h of sortedHistory.value) {
    map[h.examType] = h;
  }
  return map;
});

const chartData = computed(() => {
  const history = sortedHistory.value;
  return {
    labels: history.map((h) => examTypeLabel[h.examType] || h.examType || "-"),
    datasets: [
      {
        label: "คะแนน (%)",
        data: history.map((h) =>
          h.maxScore ? Math.round((h.totalScore / h.maxScore) * 100) : 0
        ),
        borderColor: "#6366f1",
        backgroundColor: "#e0e7ff",
        tension: 0.3,
        fill: true,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    y: { min: 0, max: 100, ticks: { callback: (v) => v + "%" } },
  },
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

async function exportXLSX() {
  const XLSX = await import("xlsx");
  const p = progress.value;
  const student = p.student;
  const history = sortedHistory.value;
  const first = history[0];
  const latest = history[history.length - 1];
  const numQ = Math.max(...history.map((h) => h.answers?.length || 0), 0) || 3;

  // --- Sheet 1: คะแนนทุกครั้ง ---
  const s1Header = ["ครั้งที่", "ประเภท", "วันที่สอบ"];
  for (let q = 1; q <= numQ; q++) s1Header.push(`ข้อ ${q}`);
  s1Header.push("รวม", "คะแนนเต็ม", "%");

  const s1Rows = history.map((h, i) => {
    const row = [i + 1, examTypeLabel[h.examType] || h.examType || "-", formatDate(h.createdAt)];
    for (let q = 0; q < numQ; q++) row.push(h.answers?.[q]?.scoreGiven ?? "-");
    const pct = h.maxScore ? Math.round((h.totalScore / h.maxScore) * 100) : 0;
    row.push(h.totalScore, h.maxScore, pct + "%");
    return row;
  });

  const ws1 = XLSX.utils.aoa_to_sheet([s1Header, ...s1Rows]);

  // --- Sheet 2: ครั้งล่าสุด (per-step) ---
  const s2Header = [
    "ข้อ",
    "ขั้นที่ 1 (ขั้นทำความเข้าใจปัญหา)",
    "ขั้นที่ 2 (ขั้นวางแผนแก้ปัญหา)",
    "ขั้นที่ 3 (ขั้นดำเนินการตามแผน)",
    "ขั้นที่ 4 (ขั้นตรวจสอบกระบวนการ)",
    "รวมคะแนน",
  ];
  const s2Rows = (latest?.answers || []).map((a, i) => [
    `ข้อ ${i + 1}`,
    a.step1Score ?? "-",
    a.step2Score ?? "-",
    a.step3Score ?? "-",
    a.step4Score ?? "-",
    a.scoreGiven ?? "-",
  ]);
  s2Rows.push(["รวม", "", "", "", "", latest?.totalScore ?? "-"]);

  const ws2 = XLSX.utils.aoa_to_sheet([s2Header, ...s2Rows]);

  // --- Sheet 3: ผลต่าง ครั้งแรก vs ล่าสุด ---
  const s3Header = ["ข้อ", "ครั้งแรก", "ล่าสุด", "ผลต่าง"];
  const s3Rows = Array.from({ length: numQ }, (_, i) => {
    const f = first?.answers?.[i]?.scoreGiven ?? 0;
    const l = latest?.answers?.[i]?.scoreGiven ?? 0;
    return [`ข้อ ${i + 1}`, f, l, l - f];
  });
  const fTotal = first?.totalScore ?? 0;
  const lTotal = latest?.totalScore ?? 0;
  s3Rows.push(["รวม", fTotal, lTotal, lTotal - fTotal]);

  const ws3 = XLSX.utils.aoa_to_sheet([s3Header, ...s3Rows]);

  // --- สร้างไฟล์ ---
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, "คะแนนทุกครั้ง");
  XLSX.utils.book_append_sheet(wb, ws2, "ครั้งล่าสุด");
  XLSX.utils.book_append_sheet(wb, ws3, "เปรียบเทียบ");

  const filename = `ข้อมูลพัฒนาการ-${student?.studentId || "student"}.xlsx`;
  XLSX.writeFile(wb, filename);
}

onMounted(loadStudents);
</script>
