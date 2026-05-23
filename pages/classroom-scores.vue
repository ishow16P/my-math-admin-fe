<template>
  <NuxtLayout name="admin">
    <div class="p-6 md:p-8">
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 class="text-xl font-bold text-slate-800">คะแนนรายห้อง</h1>
        <button @click="showFeedback = true"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition">
          <MessageSquare :size="14" />
          ข้อเสนอแนะสำหรับครูผู้สอน
        </button>
      </div>

      <!-- Filter -->
      <div class="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <div class="flex flex-wrap gap-3">
          <div class="flex-1 min-w-[140px]">
            <label for="filter-level" class="block text-sm font-medium text-slate-700 mb-1">ระดับ</label>
            <select id="filter-level" v-model="filterLevel" :class="filterControlClass">
              <option v-for="lvl in availableLevels" :key="lvl" :value="lvl">{{ levelMap[lvl] }}</option>
            </select>
          </div>
          <div class="flex-1 min-w-[140px]">
            <label for="filter-classroom" class="block text-sm font-medium text-slate-700 mb-1">เลขห้อง (ไม่บังคับ)</label>
            <input id="filter-classroom" v-model.number="filterClassroom" type="number" min="1" placeholder="เช่น 3" :class="filterControlClass" />
          </div>
          <div class="flex-1 min-w-[180px]">
            <label for="filter-examtype" class="block text-sm font-medium text-slate-700 mb-1">ประเภทการสอบ</label>
            <select id="filter-examtype" v-model="filterExamType" :class="filterControlClass">
              <option v-for="et in EXAM_TYPES" :key="et.type" :value="et.type">{{ et.label }}</option>
            </select>
          </div>
          <div class="flex items-end gap-2">
            <button @click="loadScores" :disabled="loading"
              class="h-10 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 inline-flex items-center justify-center">
              โหลด
            </button>
            <button @click="exportXLSX" :disabled="!scores.length"
              class="h-10 inline-flex items-center justify-center gap-1.5 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50">
              <Download :size="14" />
              ดาวน์โหลด
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <Loader2 :size="24" class="animate-spin text-indigo-500" />
      </div>

      <!-- Table: All exam types (total per question) -->
      <div v-else-if="scores.length > 0 && mode === 'all'" class="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-500">
            <tr class="border-b border-slate-200">
              <th rowspan="2" class="text-left px-4 py-2 font-medium whitespace-nowrap border-r border-slate-200">ลำดับ</th>
              <th rowspan="2" class="text-left px-4 py-2 font-medium whitespace-nowrap border-r border-slate-200">รหัส</th>
              <th rowspan="2" class="text-left px-4 py-2 font-medium whitespace-nowrap border-r border-slate-200">ชื่อ-นามสกุล</th>
              <th rowspan="2" class="text-left px-4 py-2 font-medium whitespace-nowrap border-r border-slate-200">ห้อง</th>
              <th v-for="et in EXAM_TYPES" :key="et.type" :colspan="et.questionCount"
                class="text-center px-4 py-2 font-medium whitespace-nowrap border-l border-slate-200">
                {{ et.label }}
              </th>
            </tr>
            <tr>
              <th v-for="col in allColumns" :key="`${col.type}-${col.qIndex}`"
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
              <td v-for="col in allColumns" :key="`${col.type}-${col.qIndex}`"
                class="px-3 py-3 text-center border-l border-slate-100">
                <template v-if="getScore(s, col.type, col.qIndex, 'total') !== null">
                  <span class="font-semibold text-indigo-600">{{ getScore(s, col.type, col.qIndex, 'total') }}</span>
                </template>
                <span v-else class="text-slate-200">—</span>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-slate-50 border-t-2 border-slate-200">
              <td class="px-4 py-3 text-xs font-semibold text-slate-500 border-r border-slate-200" colspan="4">คะแนนเฉลี่ย</td>
              <td v-for="col in allColumns" :key="`avg-${col.type}-${col.qIndex}`"
                class="px-3 py-3 text-center border-l border-slate-100">
                <template v-if="avgScore(col.type, col.qIndex, 'total') !== null">
                  <span class="font-bold text-slate-700">{{ avgScore(col.type, col.qIndex, 'total') }}</span>
                </template>
                <span v-else class="text-slate-300">—</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Detail: per-student table with step breakdown -->
      <div v-else-if="scores.length > 0 && mode === 'detail'" class="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-500">
            <tr class="border-b border-slate-200">
              <th rowspan="3" class="text-left px-4 py-2 font-medium whitespace-nowrap border-r border-slate-200">ลำดับ</th>
              <th rowspan="3" class="text-left px-4 py-2 font-medium whitespace-nowrap border-r border-slate-200">รหัส</th>
              <th rowspan="3" class="text-left px-4 py-2 font-medium whitespace-nowrap border-r border-slate-200">ชื่อ-นามสกุล</th>
              <th rowspan="3" class="text-left px-4 py-2 font-medium whitespace-nowrap border-r border-slate-200">ห้อง</th>
              <th v-for="qi in detailQuestions" :key="qi" :colspan="5"
                class="text-center px-4 py-2 font-medium whitespace-nowrap border-l border-slate-200">
                {{ detailET.questionCount > 1 ? `ข้อ ${qi + 1}` : detailET.label }}
              </th>
              <th v-if="detailET.questionCount > 1" rowspan="3"
                class="text-center px-4 py-2 font-medium whitespace-nowrap text-slate-600">
                คะแนนรวม
              </th>
            </tr>
            <tr class="border-b border-slate-100">
              <template v-for="qi in detailQuestions" :key="qi">
                <th v-for="s in STEP_COLS" :key="`${qi}-${s.key}`"
                  class="text-center px-2 py-1.5 font-normal text-xs whitespace-nowrap border-slate-100"
                  :class="s.key === 'total' ? 'bg-indigo-50 text-indigo-500' : ''">
                  {{ s.label }}
                </th>
              </template>
            </tr>
            <tr>
              <template v-for="qi in detailQuestions" :key="qi">
                <th v-for="s in STEP_COLS" :key="`${qi}-${s.key}-max`"
                  class="text-center px-2 py-1 font-normal text-xs text-slate-300 whitespace-nowrap ">
                  {{ s.max }}
                </th>
              </template>
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
              <template v-for="qi in detailQuestions" :key="qi">
                <td v-for="sc in STEP_COLS" :key="`${qi}-${sc.key}`"
                  class="px-2 py-3 text-center border-l border-slate-100"
                  :class="sc.key === 'total' ? 'bg-indigo-50' : ''">
                  <template v-if="getScore(s, loadedExamType, qi, sc.key) !== null">
                    <span class="font-semibold" :class="sc.key === 'total' ? 'text-indigo-600' : 'text-slate-700'">
                      {{ getScore(s, loadedExamType, qi, sc.key) }}
                    </span>
                  </template>
                  <span v-else class="text-slate-200">—</span>
                </td>
              </template>
              <td v-if="detailET.questionCount > 1" class="px-3 py-3 text-center">
                <template v-if="detailQuestions.some(qi => getScore(s, loadedExamType, qi, 'total') !== null)">
                  <span class="font-bold text-slate-800">
                    {{ detailQuestions.reduce((sum, qi) => sum + (getScore(s, loadedExamType, qi, 'total') ?? 0), 0) }}
                  </span>
                </template>
                <span v-else class="text-slate-200">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="searched" class="text-center py-12 text-slate-400">
        ไม่พบข้อมูลสำหรับเงื่อนไขที่เลือก
      </div>
    </div>

    <!-- Feedback Modal -->
    <div v-if="showFeedback" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40" @click="showFeedback = false" />
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-5xl flex flex-col max-h-[90vh]">
        <div class="px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0 flex items-center justify-between">
          <h2 class="text-base font-semibold text-slate-800">ข้อเสนอแนะสำหรับครูผู้สอน</h2>
          <button @click="showFeedback = false" class="p-1.5 rounded hover:bg-slate-100 transition text-slate-400">
            <X :size="16" />
          </button>
        </div>
        <div class="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          <div v-for="step in FEEDBACK" :key="step.key">
            <!-- Step header -->
            <div class="flex items-center gap-3 mb-3">
              <span class="text-sm font-bold text-slate-800">{{ step.label }}</span>
              <span class="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">เต็ม {{ step.max }} คะแนน</span>
            </div>
            <!-- Table per step -->
            <div class="rounded-xl border border-slate-200 overflow-hidden">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200">
                    <th class="text-center px-4 py-2.5 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200 w-28">กลุ่มคะแนน</th>
                    <th class="text-left px-4 py-2.5 font-semibold text-slate-600 border-r border-slate-200 w-2/5">ลักษณะนักเรียน</th>
                    <th class="text-left px-4 py-2.5 font-semibold text-slate-600">แนวทางดำเนินการสำหรับครู</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="group in step.groups" :key="group.score" class="align-top">
                    <td class="px-4 py-4 text-center border-r border-slate-100">
                      <span class="inline-block text-xs font-bold px-2.5 py-1 rounded-lg" :class="scoreBadgeClass(group.score, step.max)">
                        {{ group.score }} คะแนน
                      </span>
                    </td>
                    <td class="px-4 py-4 text-slate-600 leading-relaxed border-r border-slate-100 text-xs">
                      {{ group.description.replace(/ ครูควรดำเนินการดังนี้$/, '') }}
                    </td>
                    <td class="px-4 py-4">
                      <ol class="space-y-2">
                        <li v-for="(item, i) in group.items" :key="i" class="flex gap-2 text-xs text-slate-700 leading-relaxed">
                          <span class="shrink-0 font-bold text-indigo-500 w-5">{{ i + 1 }}.</span>
                          <span>{{ item }}</span>
                        </li>
                      </ol>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-slate-100 flex-shrink-0 flex justify-end">
          <button @click="showFeedback = false" class="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition">ปิด</button>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { Loader2, Download, MessageSquare, X } from "lucide-vue-next";
import { useApi } from "~/composables/useApi";
import { useToast } from "~/composables/useToast";
import { useAdminAuthStore } from "~/stores/auth";

definePageMeta({ middleware: "auth", layout: false });

const { apiFetch } = useApi();
const { error: toastError } = useToast();
const auth = useAdminAuthStore();
const levelMap = { m1: "ม.1", m2: "ม.2", m3: "ม.3" };

const EXAM_TYPES = [
  { type: "pre_test",   label: "แบบทดสอบก่อนเรียน",  questionCount: 2 },
  { type: "in_class_1", label: "แบบทดสอบท้ายคาบ 1", questionCount: 1 },
  { type: "in_class_2", label: "แบบทดสอบท้ายคาบ 2", questionCount: 1 },
  { type: "in_class_3", label: "แบบทดสอบท้ายคาบ 3", questionCount: 1 },
  { type: "post_test",  label: "แบบทดสอบหลังเรียน",  questionCount: 2 },
];

const SCORE_LEVELS = [4, 3, 2, 1, 0];

const FEEDBACK = [
  {
    key: "step1", label: "ขั้นตอนที่ 1  ทำความเข้าใจปัญหา", max: 2,
    groups: [
      {
        score: 0,
        description: "นักเรียนกลุ่มนี้ยังไม่สามารถระบุข้อมูลจากโจทย์ได้เลย ครูควรดำเนินการดังนี้",
        items: [
          'สอนให้นักเรียนแยกโจทย์ออกเป็น 2 ส่วนเสมอ คือ "สิ่งที่โจทย์กำหนดให้" และ "สิ่งที่โจทย์ต้องการหา" โดยใช้การขีดเส้นใต้ข้อมูลในโจทย์เป็นขั้นตอนแรกก่อนทำข้อสอบทุกครั้ง',
          'ฝึกให้นักเรียนอ่านโจทย์ทีละประโยค แล้วถามว่า "ประโยคนี้บอกอะไร" ก่อนเขียนลงกระดาษ เพื่อให้นักเรียนเชื่อมโยงภาษาพูดกับการเขียนข้อมูล',
          'ให้นักเรียนฝึกกับโจทย์สั้น ๆ ที่มีข้อมูลน้อยก่อน แล้วค่อยเพิ่มความซับซ้อนของโจทย์ทีละขั้น จนนักเรียนคุ้นเคยกับการแยกข้อมูล',
          'ให้นักเรียนตรวจสอบตนเองก่อนข้ามขั้นถัดไปด้วยคำถาม "รู้ว่าโจทย์ให้อะไรมาบ้างแล้วหรือยัง" และ "รู้ว่าโจทย์ถามอะไรแล้วหรือยัง"',
        ],
      },
      {
        score: 1,
        description: "นักเรียนกลุ่มนี้ระบุข้อมูลได้บางส่วน มักพลาดใน 2 ลักษณะ คือ ระบุสิ่งที่กำหนดให้ได้แต่ลืมระบุสิ่งที่โจทย์ถาม หรือระบุข้อมูลไม่ครบทุกเงื่อนไขในโจทย์ ครูควรดำเนินการดังนี้",
        items: [
          'สอนให้นักเรียนนับจำนวนเงื่อนไขในโจทย์ก่อน แล้วตรวจว่าเขียนลงกระดาษครบตามจำนวนนั้นหรือไม่ โดยเฉพาะโจทย์ที่มีหลายเงื่อนไขซึ่งนักเรียนมักมองข้ามเงื่อนไขท้ายโจทย์',
          'ฝึกให้นักเรียนวนอ่านโจทย์ 2 รอบ รอบแรกขีดเส้นใต้ข้อมูลที่โจทย์กำหนด รอบสองหาสิ่งที่โจทย์ต้องการถาม แล้วตรวจว่าเขียนครบทั้ง 2 ส่วน',
          'ให้นักเรียนจับคู่ตรวจสอบงานกัน โดยผู้ตรวจถามว่า "สิ่งที่กำหนดให้ครบไหม" และ "สิ่งที่โจทย์ถามมีไหม" เพื่อให้นักเรียนรู้จักตรวจสอบความครบถ้วนด้วยตนเอง',
        ],
      },
    ],
  },
  {
    key: "step2", label: "ขั้นตอนที่ 2  วางแผนแก้ปัญหา", max: 2,
    groups: [
      {
        score: 0,
        description: "นักเรียนกลุ่มนี้ยังไม่สามารถแปลงข้อมูลจากโจทย์เป็นสมการหรือแนวทางแก้ปัญหาได้ ครูควรดำเนินการดังนี้",
        items: [
          'สอนขั้นตอนการกำหนดตัวแทน (ตัวแปร) อย่างชัดเจน โดยให้นักเรียนเริ่มจากการเขียน "ให้ ... แทน ..." ก่อนเสมอ ไม่ข้ามไปคำนวณโดยไม่ประกาศตัวแปร',
          'สอนให้นักเรียนเชื่อมโยงข้อมูลจากขั้นตอนที่ 1 มาเขียนเป็นความสัมพันธ์ โดยใช้คำถามนำว่า "สิ่งที่โจทย์ให้มาแต่ละชิ้นเกี่ยวข้องกันอย่างไร" และ "เขียนความสัมพันธ์นั้นเป็นสมการได้ว่าอย่างไร"',
          'ฝึกผ่านโจทย์ง่ายที่มีความสัมพันธ์ตรงไปตรงมาก่อน แล้วค่อยเพิ่มโจทย์ที่ซับซ้อนขึ้น เพื่อให้นักเรียนสร้างความคุ้นเคยกับการแปลงภาษาพูดเป็นภาษาคณิตศาสตร์',
        ],
      },
      {
        score: 1,
        description: "นักเรียนกลุ่มนี้เริ่มวางแผนได้แต่ยังไม่สมบูรณ์ มักตั้งตัวแทนได้แต่เขียนสมการผิด หรือเข้าใจความสัมพันธ์ระหว่างตัวแปรคลาดเคลื่อน ครูควรดำเนินการดังนี้",
        items: [
          'ให้นักเรียนอธิบายแนวคิดด้วยคำพูดก่อนเขียนเป็นสมการ เพื่อตรวจสอบว่าเข้าใจความสัมพันธ์ถูกต้องหรือไม่ หากอธิบายได้แต่เขียนสมการผิด แสดงว่าปัญหาอยู่ที่การแปลงสัญลักษณ์',
          'ชี้ให้เห็นจุดที่ผิดพลาดโดยเฉพาะ เช่น ลืมเครื่องหมาย ใช้อัตราส่วนผิดตัว หรือสับสนระหว่าง "ส่วนย่อย" กับ "ทั้งหมด" แล้วให้นักเรียนกลับไปแก้จุดนั้นด้วยตนเอง โดยไม่เฉลยให้ทั้งหมด',
          'ให้นักเรียนตรวจสอบสมการที่เขียนด้วยการอ่านออกเสียงว่า "สมการนี้หมายความว่าอะไร" เพื่อให้รู้ตัวเองว่าสมการสื่อตรงกับโจทย์หรือไม่',
        ],
      },
    ],
  },
  {
    key: "step3", label: "ขั้นตอนที่ 3  ดำเนินการตามแผน", max: 4,
    groups: [
      {
        score: 0,
        description: "นักเรียนกลุ่มนี้ไม่สามารถลงมือคำนวณได้เลย ครูควรตรวจสอบก่อนว่าปัญหาเกิดจากการวางแผนผิดพลาดตั้งแต่ขั้นที่ 2 หรือขาดทักษะการคำนวณพื้นฐาน แล้วดำเนินการดังนี้",
        items: [
          'หากปัญหาอยู่ที่ขั้นวางแผน ให้ช่วยนักเรียนแก้สมการในขั้น 2 ก่อน แล้วให้นักเรียนนำสมการที่ถูกต้องไปคำนวณต่อด้วยตนเอง',
          'หากปัญหาอยู่ที่ทักษะพื้นฐาน เช่น การดำเนินการกับเศษส่วน การแก้สมการเชิงเส้น ให้ทบทวนทักษะนั้นก่อน แล้วค่อยให้กลับมาทำโจทย์เดิม',
          'สอนให้นักเรียนทำทีละขั้นโดยไม่ข้ามขั้น เริ่มจากขั้นที่ง่ายที่สุดก่อน แล้วแสดงให้เห็นว่าผลจากขั้นที่แล้วนำไปใช้ต่อในขั้นถัดไปอย่างไร',
        ],
      },
      {
        score: 1,
        description: "นักเรียนกลุ่มนี้เริ่มต้นได้แต่หยุดกลางทาง ครูควรดำเนินการดังนี้",
        items: [
          'ให้นักเรียนแบ่งการคำนวณเป็นขั้นย่อย ๆ โดยเขียนลำดับขั้นทั้งหมดที่ต้องทำไว้ก่อน แล้วค่อยทำทีละขั้น เพื่อให้เห็นว่าตนเองทำถึงไหนแล้ว',
          'ชี้ให้เห็นว่านักเรียนติดขัดที่ทักษะย่อยใด เช่น การจัดรูปสมการ การกระจายวงเล็บ การทำให้เศษส่วนเท่ากัน แล้วฝึกทักษะนั้นเพิ่มเติมก่อนให้กลับมาทำต่อ',
          'ใช้คำถามนำ เช่น "ขั้นต่อไปจากนี้ควรทำอะไร" แทนการบอกคำตอบ เพื่อให้นักเรียนคิดต่อด้วยตนเอง',
        ],
      },
      {
        score: 2,
        description: "นักเรียนกลุ่มนี้ทำได้ประมาณครึ่งทางแต่ติดขัดในขั้นที่ซับซ้อนขึ้น ครูควรดำเนินการดังนี้",
        items: [
          'ระบุให้ชัดเจนว่านักเรียนติดขัดตรงจุดใด เช่น การคูณเศษส่วน การย้ายพจน์ การแก้สมการหลายขั้น แล้วฝึกทักษะนั้นด้วยโจทย์ย่อยก่อน',
          'แสดงให้นักเรียนเห็นว่าขั้นที่ทำถูกแล้วนำไปต่อยอดในขั้นถัดไปได้อย่างไร เพื่อให้นักเรียนไม่ต้องเริ่มใหม่ทั้งหมด แต่ทำต่อจากจุดที่หยุด',
          'สอนให้นักเรียนตรวจสอบความสมเหตุสมผลของผลลัพธ์ในแต่ละขั้น ก่อนนำไปคำนวณในขั้นถัดไป เพื่อป้องกันความผิดพลาดสะสม',
        ],
      },
      {
        score: 3,
        description: "นักเรียนกลุ่มนี้ทำได้เกือบสมบูรณ์แต่มักผิดพลาดในขั้นสุดท้าย เช่น คำนวณตัวเลขผิด หรือลืมสรุปคำตอบให้ตรงกับสิ่งที่โจทย์ถาม ครูควรดำเนินการดังนี้",
        items: [
          'ฝึกให้นักเรียนตรวจสอบการคำนวณซ้ำในขั้นสุดท้ายก่อนสรุปคำตอบ โดยเฉพาะการคำนวณที่มีหลายขั้นตอน ซึ่งมักเกิดความผิดพลาดสะสม',
          'เน้นย้ำให้นักเรียนเขียนสรุปคำตอบให้ชัดเจนว่าตอบสิ่งที่โจทย์ถาม โดยกลับไปอ่านโจทย์อีกครั้งก่อนเขียนสรุป เพื่อให้แน่ใจว่าคำตอบตรงกับสิ่งที่ต้องการหา',
          'สอนให้นักเรียนตรวจสอบหน่วยของคำตอบว่าถูกต้องและสอดคล้องกับโจทย์',
        ],
      },
    ],
  },
  {
    key: "step4", label: "ขั้นตอนที่ 4  ตรวจสอบกระบวนการแก้ปัญหา", max: 2,
    groups: [
      {
        score: 0,
        description: "นักเรียนกลุ่มนี้ข้ามขั้นตอนการตรวจสอบทั้งหมด ครูควรดำเนินการดังนี้",
        items: [
          'อธิบายให้นักเรียนเข้าใจว่าขั้นตรวจสอบไม่ใช่การทำซ้ำ แต่เป็นการพิสูจน์ว่าคำตอบที่ได้ถูกต้อง โดยใช้วิธีแทนค่าคำตอบกลับเข้าไปในโจทย์แล้วดูว่าสมเหตุสมผลหรือไม่',
          'สอนวิธีตรวจสอบอย่างเป็นขั้นตอน ได้แก่ แทนค่าคำตอบกลับเข้าสมการ คำนวณ แล้วตรวจว่าผลลัพธ์สอดคล้องกับเงื่อนไขในโจทย์',
          'กำหนดให้การตรวจสอบเป็นส่วนบังคับของทุกการส่งงาน โดยหากไม่มีขั้นตอนนี้ให้ถือว่างานยังไม่สมบูรณ์',
          'ฝึกให้นักเรียนตั้งคำถามกับตนเองก่อนส่งงานว่า "ถ้าแทนคำตอบนี้กลับเข้าโจทย์ จะได้ผลตรงกับที่โจทย์กำหนดไหม"',
        ],
      },
      {
        score: 1,
        description: "นักเรียนกลุ่มนี้ตรวจสอบได้บางส่วนแต่ไม่ครบ มักเขียนเพียงว่า \"ตรวจแล้วถูก\" โดยไม่แสดงวิธีคิด หรือตรวจสอบเพียงบางเงื่อนไข ครูควรดำเนินการดังนี้",
        items: [
          'สอนให้นักเรียนเขียนขั้นตอนการตรวจสอบอย่างชัดเจนอย่างน้อย 2 บรรทัด ได้แก่ บรรทัดแรกแสดงการแทนค่ากลับเข้าสมการ และบรรทัดที่สองสรุปว่าคำตอบสมเหตุสมผลหรือไม่',
          'เน้นย้ำว่าการตรวจสอบต้องครอบคลุมทุกเงื่อนไขในโจทย์ ไม่ใช่แค่เงื่อนไขเดียว โดยให้นักเรียนกลับไปอ่านขั้นตอนที่ 1 แล้วตรวจสอบว่าคำตอบสอดคล้องกับทุกเงื่อนไขที่ระบุไว้',
          'สอนให้นักเรียนตรวจสอบความสมเหตุสมผลของคำตอบในเชิงบริบท เช่น คำตอบที่เป็นพื้นที่ต้องเป็นจำนวนบวก คำตอบที่เป็นเวลาต้องไม่ติดลบ เป็นต้น',
        ],
      },
    ],
  },
];

const STEP_COLS = [
  { key: "step1", label: "ขั้น 1", max: 2 },
  { key: "step2", label: "ขั้น 2", max: 2 },
  { key: "step3", label: "ขั้น 3", max: 4 },
  { key: "step4", label: "ขั้น 4", max: 2 },
  { key: "total", label: "รวม",   max: 10 },
];

// columns for "all" mode
const allColumns = EXAM_TYPES.flatMap((et) =>
  Array.from({ length: et.questionCount }, (_, i) => ({
    type: et.type,
    questionCount: et.questionCount,
    qIndex: i,
  }))
);

const availableLevels = computed(() =>
  auth.isSuperAdmin ? ["m1", "m2", "m3"] : auth.managedLevels || []
);

const filterControlClass =
  "w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400";

const filterLevel = ref(availableLevels.value[0] || "m1");
const filterClassroom = ref(null);
const filterExamType = ref("pre_test");
const loadedExamType = ref("pre_test");
const showFeedback = ref(false); // อัปเดตเฉพาะเมื่อกดโหลด
const scores = ref([]);
const loading = ref(false);
const searched = ref(false);

const mode = computed(() => (loadedExamType.value === "all" ? "all" : "detail"));
const detailET = computed(() => EXAM_TYPES.find((e) => e.type === loadedExamType.value) || null);
const detailQuestions = computed(() =>
  detailET.value ? Array.from({ length: detailET.value.questionCount }, (_, i) => i) : []
);

const groupedData = computed(() => {
  if (mode.value !== "detail" || !detailET.value) return [];
  return detailQuestions.value.map((qi) => ({
    qIndex: qi,
    steps: STEP_COLS.filter((sc) => sc.key !== "total").map((sc) => {
      const groups = [];
      for (let score = sc.max; score >= 0; score--) {
        const students = scores.value.filter(
          (s) => getScore(s, loadedExamType.value, qi, sc.key) === score
        );
        groups.push({ score, students });
      }
      return { stepCol: sc, groups };
    }),
  }));
});

function scoreBadgeClass(score, max) {
  const ratio = max > 0 ? score / max : 0;
  if (ratio === 1) return "bg-emerald-100 text-emerald-700";
  if (ratio >= 0.5) return "bg-amber-100 text-amber-700";
  if (ratio > 0) return "bg-orange-100 text-orange-700";
  return "bg-slate-100 text-slate-500";
}

function getSub(student, examType) {
  return student.submissions.find((s) => s.examType === examType) ?? null;
}

function getScore(student, examType, qIndex, key) {
  const sub = getSub(student, examType);
  if (!sub) return null;
  const ans = sub.answerScores?.[qIndex];
  if (!ans) return null;
  return ans[key] ?? null;
}

function avgScore(examType, qIndex, key) {
  const vals = scores.value
    .map((s) => getScore(s, examType, qIndex, key))
    .filter((v) => v !== null);
  if (!vals.length) return null;
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

async function loadScores() {
  loading.value = true;
  searched.value = false;
  try {
    const params = new URLSearchParams({ level: filterLevel.value });
    if (filterClassroom.value) params.append("classroom", filterClassroom.value);
    if (filterExamType.value !== "all") params.append("examType", filterExamType.value);
    scores.value = await apiFetch(`/analytics/classroom?${params}`);
    loadedExamType.value = filterExamType.value;
    searched.value = true;
  } catch (e) {
    toastError(e?.data?.message || "เกิดข้อผิดพลาด");
  } finally {
    loading.value = false;
  }
}

async function exportXLSX() {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  // --- Sheet 1: คะแนน ---
  const sheet1Rows = [];
  if (mode.value === "all") {
    const h1 = ["ลำดับ", "รหัส", "ชื่อ-นามสกุล", "ห้อง"];
    EXAM_TYPES.forEach((et) => { h1.push(et.label); for (let i = 1; i < et.questionCount; i++) h1.push(""); });
    const h2 = ["", "", "", ""];
    allColumns.forEach((col) => { h2.push(col.questionCount > 1 ? `ข้อ ${col.qIndex + 1}` : "คะแนน"); });
    sheet1Rows.push(h1, h2);
    scores.value.forEach((s, i) => {
      const row = [i + 1, s.studentId, s.name, s.classroom ? `${s.level.replace("m", "")}/${s.classroom}` : "-"];
      allColumns.forEach((col) => { row.push(getScore(s, col.type, col.qIndex, "total") ?? ""); });
      sheet1Rows.push(row);
    });
    const avgRow = ["", "", "", "เฉลี่ย"];
    allColumns.forEach((col) => { avgRow.push(avgScore(col.type, col.qIndex, "total") ?? ""); });
    sheet1Rows.push(avgRow);
  } else {
    const et = detailET.value;
    const hasGrandTotal = et.questionCount > 1;
    const h1 = ["ลำดับ", "รหัส", "ชื่อ-นามสกุล", "ห้อง"];
    detailQuestions.value.forEach((qi) => { const l = et.questionCount > 1 ? `ข้อ ${qi + 1}` : et.label; h1.push(l, "", "", "", ""); });
    if (hasGrandTotal) h1.push("คะแนนรวม");
    const h2 = ["", "", "", ""];
    detailQuestions.value.forEach(() => { STEP_COLS.forEach((sc) => h2.push(sc.label)); });
    if (hasGrandTotal) h2.push("");
    const h3 = ["", "", "", ""];
    detailQuestions.value.forEach(() => { STEP_COLS.forEach((sc) => h3.push(sc.max)); });
    if (hasGrandTotal) h3.push(et.questionCount * 10);
    sheet1Rows.push(h1, h2, h3);
    scores.value.forEach((s, i) => {
      const row = [i + 1, s.studentId, s.name, s.classroom ? `${s.level.replace("m", "")}/${s.classroom}` : "-"];
      detailQuestions.value.forEach((qi) => { STEP_COLS.forEach((sc) => row.push(getScore(s, loadedExamType.value, qi, sc.key) ?? "")); });
      if (hasGrandTotal) {
        const grandTotal = detailQuestions.value.reduce((sum, qi) => sum + (getScore(s, loadedExamType.value, qi, "total") ?? 0), 0);
        row.push(grandTotal);
      }
      sheet1Rows.push(row);
    });
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet1Rows), "คะแนน");

  // --- Sheet 2: ข้อเสนอแนะ ---
  const sheet2Rows = [];
  FEEDBACK.forEach((step) => {
    sheet2Rows.push([`${step.label}  (เต็ม ${step.max} คะแนน)`, "", ""]);
    sheet2Rows.push(["กลุ่มคะแนน", "ลักษณะนักเรียน", "แนวทางดำเนินการสำหรับครู"]);
    step.groups.forEach((group) => {
      const description = group.description.replace(/ ครูควรดำเนินการดังนี้$/, "");
      const actions = group.items.map((item, i) => `${i + 1}. ${item}`).join("\n");
      sheet2Rows.push([`${group.score} คะแนน`, description, actions]);
    });
    sheet2Rows.push(["", "", ""]);
  });
  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Rows);
  // ตั้งความกว้างคอลัมน์
  ws2["!cols"] = [{ wch: 14 }, { wch: 50 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, ws2, "ข้อเสนอแนะสำหรับครูผู้สอน");

  const et = EXAM_TYPES.find((e) => e.type === loadedExamType.value);
  const examSuffix = et ? `-${et.label}` : "";
  const levelLabel = levelMap[filterLevel.value] || filterLevel.value;
  const classroomSuffix = filterClassroom.value ? `-ห้อง${filterClassroom.value}` : "";
  XLSX.writeFile(wb, `คะแนนรายห้อง-${levelLabel}${classroomSuffix}${examSuffix}.xlsx`);
}
</script>
