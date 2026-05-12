<template>
  <NuxtLayout name="admin">
    <div class="p-6 md:p-8">
      <h1 class="text-xl font-bold text-slate-800 mb-6">ตรวจข้อสอบ</h1>

      <div class="flex flex-col gap-2 mb-4">
        <div class="flex flex-wrap items-center gap-2">
          <div class="relative">
            <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="ค้นหารหัสหรือชื่อนักเรียน..."
              class="w-full sm:w-64 pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300 focus:border-indigo-300 placeholder:text-slate-300"
            />
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="s in ['all', 'submitted', 'graded']"
              :key="s"
              @click="filterStatus = s"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition"
              :class="filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'"
            >
              {{ statusLabel[s] }}
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="l in ['all', 'm1', 'm2', 'm3']"
              :key="l"
              @click="filterLevel = l"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition"
              :class="filterLevel === l ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'"
            >
              {{ l === "all" ? "ทุกระดับ" : levelMap[l] }}
            </button>
          </div>
        </div>
      </div>

      <!-- List -->
      <div v-if="loading" class="flex justify-center py-12">
        <Loader2 :size="24" class="animate-spin text-indigo-400" />
      </div>

      <div v-else class="space-y-3">
        <NuxtLink
          v-for="sub in submissions"
          :key="sub._id"
          :to="`/submissions/${sub._id}`"
          class="block bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-slate-800">
                {{ sub.studentId?.name || "N/A" }}
              </div>
              <div class="text-xs text-slate-400">
                {{ sub.studentId?.studentId }} - {{ levelMap[sub.level] }} -
                {{ formatDate(sub.createdAt) }}
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div
                v-if="sub.status === 'graded'"
                class="text-lg font-bold text-indigo-600"
              >
                {{ sub.totalScore }}<span class="text-sm font-normal text-slate-400">/30</span>
              </div>
              <span
                class="px-2.5 py-1 rounded-full text-xs font-medium"
                :class="
                  sub.status === 'graded'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                "
              >
                {{ sub.status === "graded" ? "ตรวจแล้ว" : "รอตรวจ" }}
              </span>
            </div>
          </div>
        </NuxtLink>

        <div v-if="submissions.length === 0" class="text-center py-12 text-slate-400">
          ไม่พบข้อสอบ
        </div>
        <PaginationBar v-if="total > 0" v-model="currentPage" :total="total" />
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { Loader2, Search } from "lucide-vue-next";
import { useApi } from "~/composables/useApi";
import { useToast } from "~/composables/useToast";

definePageMeta({ middleware: "auth", layout: false });

const { apiFetch } = useApi();
const { error: toastError } = useToast();
const levelMap = { m1: "ม.1", m2: "ม.2", m3: "ม.3" };
const statusLabel = { all: "ทั้งหมด", submitted: "รอตรวจ", graded: "ตรวจแล้ว" };

const PER_PAGE = 10;
const submissions = ref([]);
const total = ref(0);
const loading = ref(false);
const filterStatus = ref("all");
const filterLevel = ref("all");
const searchQuery = ref("");
const currentPage = ref(1);

function formatDate(d) {
  return new Date(d).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadSubmissions() {
  loading.value = true;
  try {
    const params = new URLSearchParams({ page: currentPage.value, limit: PER_PAGE });
    if (filterStatus.value !== "all") params.append("status", filterStatus.value);
    if (filterLevel.value !== "all") params.append("level", filterLevel.value);
    const q = searchQuery.value.trim();
    if (q) params.append("search", q);
    const res = await apiFetch(`/submissions?${params}`);
    submissions.value = res.data;
    total.value = res.pagination.total;
  } catch (e) {
    toastError(e?.data?.message || "ไม่สามารถโหลดรายการข้อสอบได้");
  } finally {
    loading.value = false;
  }
}

function resetAndLoad() {
  if (currentPage.value !== 1) {
    currentPage.value = 1;
  } else {
    loadSubmissions();
  }
}

watch(currentPage, loadSubmissions);
watch([filterStatus, filterLevel], resetAndLoad);

let searchTimer = null;
watch(searchQuery, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(resetAndLoad, 300);
});

onMounted(loadSubmissions);
</script>
