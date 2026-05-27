<template>
  <NuxtLayout name="admin">
    <div class="p-6 md:p-8">
      <div class="flex items-center justify-between mb-5">
        <NuxtLink to="/submissions" class="text-sm text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1">
          ← กลับรายการข้อสอบ
        </NuxtLink>
        <button
          @click="showScoring = true"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
        >
          <FileText :size="13" />
          เกณฑ์การให้คะแนน
        </button>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-20">
        <Loader2 :size="24" class="animate-spin text-indigo-500" />
      </div>

      <div v-else-if="submission" class="flex flex-col xl:flex-row gap-6 items-start">
      <!-- Left: Grading -->
      <div class="w-full xl:w-[65%] min-w-0 space-y-5">
        <!-- Header Card -->
        <div class="bg-white rounded-xl border border-slate-200 p-5">
          <div class="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 class="text-base font-bold text-slate-800">
                <span v-if="submission.studentId?.title" class="text-slate-500 font-normal mr-1">{{ submission.studentId.title }}</span>{{ submission.studentId?.name }}
              </h1>
              <div class="text-sm text-slate-400 mt-0.5">
                รหัส {{ submission.studentId?.studentId }}
                <span v-if="submission.studentId?.classroom"> · ห้อง {{ submission.studentId.level?.replace('m', '') }}/{{ submission.studentId.classroom }}</span>
                · {{ levelMap[submission.level] }}
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="text-right">
                <div class="text-2xl font-bold text-indigo-600">{{ computedTotal }}<span class="text-sm font-normal text-slate-400">/{{ grades.length * 10 }}</span></div>
                <div class="text-xs text-slate-400">คะแนนรวม</div>
              </div>
              <span
                class="px-3 py-1 rounded-full text-xs font-medium"
                :class="submission.status === 'graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
              >
                {{ submission.status === 'graded' ? 'ตรวจแล้ว' : 'รอตรวจ' }}
              </span>
            </div>
          </div>
          <div v-if="submission.gradedBy" class="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
            ตรวจโดย {{ submission.gradedBy?.name || 'ครู' }}
          </div>
        </div>

        <!-- Answer Cards -->
        <form @submit.prevent="handleGrade" class="space-y-5">
          <div
            v-for="(ans, index) in grades"
            :key="index"
            class="bg-white rounded-xl border border-slate-200"
          >
            <!-- Question Header -->
            <div class="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between rounded-t-xl">
              <span class="font-semibold text-slate-700 text-sm">ข้อ {{ index + 1 }}</span>
              <div class="flex items-center gap-1.5">
                <span class="text-lg font-bold text-indigo-600">{{ questionScore(index) }}</span>
                <span class="text-sm text-slate-400">/ 10 คะแนน</span>
              </div>
            </div>

            <div class="p-5 space-y-5">
              <!-- Problem -->
              <div class="rounded-lg bg-indigo-50 border border-indigo-100 p-4">
                <div class="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-2">โจทย์</div>
                <div class="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{{ ans.problemSnapshot }}</div>
                <div v-if="ans.problemImageSnapshots?.length" class="mt-3 flex flex-col gap-2">
                  <img v-for="(url, i) in ans.problemImageSnapshots" :key="i" :src="url" alt="โจทย์" class="max-w-full rounded-lg" />
                </div>
              </div>
      
              <!-- เฉลย -->
              <div v-if="ans.referenceSolution || ans.answer || ans.referenceSolutionImageUrls?.length" class="rounded-lg bg-emerald-50 border border-emerald-100 p-4">
                <div class="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">เฉลย</div>
                <div v-if="ans.answer" class="text-sm font-semibold text-emerald-800 mb-1">
                  คำตอบ: {{ ans.answer }}
                </div>
                <div v-if="ans.referenceSolution" class="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {{ ans.referenceSolution }}
                </div>
                <div v-if="ans.referenceSolutionImageUrls?.length" class="mt-2 flex flex-wrap gap-2">
                  <img v-for="(url, i) in ans.referenceSolutionImageUrls" :key="i" :src="url" alt="รูปภาพเฉลย" class="max-w-full rounded-lg border border-emerald-200" />
                </div>
              </div>

              <!-- Steps -->
              <div class="space-y-4">
                <div
                  v-for="step in STEPS"
                  :key="step.key"
                  class="rounded-lg border border-slate-200"
                >
                  <!-- Step Header: label + score -->
                  <div class="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200 rounded-t-lg">
                    <span class="text-xs font-semibold text-slate-600">{{ step.label }}</span>
                    <div class="flex items-center gap-1.5">
                      <label :for="`score-${index}-${step.key}`" class="text-xs text-slate-400">คะแนน</label>
                      <input
                        :id="`score-${index}-${step.key}`"
                        v-model.number="ans[step.key].scoreGiven"
                        type="number"
                        min="0"
                        :max="step.maxScore"
                        @input="clampScore(ans, step)"
                        class="w-14 px-2 py-0.5 border border-slate-200 rounded-md text-sm text-center font-semibold text-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                      <span class="text-xs text-slate-400">/ {{ step.maxScore }}</span>
                    </div>
                  </div>

                  <div class="p-4 space-y-3">
                    <!-- Student Answer -->
                    <div>
                      <div class="text-xs text-slate-400 mb-1.5">คำตอบนักเรียน</div>
                      <div v-if="ans[step.key]?.text" class="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                        <MathDisplay :value="ans[step.key].text" />
                      </div>
                      <img
                        v-if="ans[step.key]?.imageUrl"
                        :src="ans[step.key].imageUrl"
                        alt="ภาพวาด"
                        class="max-w-full rounded-lg border border-slate-200"
                      />
                      <div v-if="!ans[step.key]?.text && !ans[step.key]?.imageUrl"
                        class="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-300 italic">
                        — ไม่มีคำตอบ —
                      </div>
                    </div>

                    <!-- Teacher Feedback -->
                    <div>
                      <div class="flex items-center justify-between mb-1.5">
                        <label :for="`feedback-${index}-${step.key}`" class="text-xs font-medium text-slate-500">
                          ข้อเสนอแนะขั้นที่ {{ step.key.replace('step', '') }}
                        </label>
                        <div v-if="ans.stepFeedbacks?.[step.key]?.length > 0" class="relative">
                          <button
                            type="button"
                            @click.stop="toggleDropdown(`${index}-${step.key}`)"
                            class="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 bg-white text-xs text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition"
                          >
                            <Zap :size="11" />
                            ข้อเสนอแนะ
                            <ChevronDown
                              :size="11"
                              class="transition-transform"
                              :class="openDropdown === `${index}-${step.key}` ? 'rotate-180' : ''"
                            />
                          </button>
                          <div
                            v-if="openDropdown === `${index}-${step.key}`"
                            @click.stop
                            class="absolute right-0 top-full mt-1 z-50 w-72 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
                          >
                            <div class="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500">ข้อเสนอแนะที่ใช้งานบ่อย</div>
                            <div class="max-h-48 overflow-y-auto">
                              <button
                                v-for="(fb, fi) in ans.stepFeedbacks[step.key]"
                                :key="fi"
                                type="button"
                                @click="appendQuickFeedback(ans, step.key, fb)"
                                class="w-full text-left px-3 py-2.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border-b border-slate-100 last:border-0 transition leading-relaxed"
                              >
                                {{ fb }}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <textarea
                        :id="`feedback-${index}-${step.key}`"
                        v-model="ans[step.key].feedback"
                        rows="1"
                        :placeholder="`ระบุข้อเสนอแนะสำหรับขั้นที่ ${step.key.replace('step', '')}...`"
                        class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Overall comment for this question -->
              <div class="pt-1">
                <div class="flex items-center justify-between mb-1.5">
                  <label :for="`comment-${index}`" class="text-xs font-medium text-slate-500">ข้อเสนอแนะภาพรวมต่อข้อนี้</label>
                  <div v-if="allStepFeedbacks(ans).length > 0" class="relative">
                    <button
                      type="button"
                      @click.stop="toggleDropdown(`${index}-comment`)"
                      class="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 bg-white text-xs text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition"
                    >
                      <Zap :size="11" />
                      ข้อเสนอแนะ
                      <ChevronDown :size="11" class="transition-transform" :class="openDropdown === `${index}-comment` ? 'rotate-180' : ''" />
                    </button>
                    <div
                      v-if="openDropdown === `${index}-comment`"
                      @click.stop
                      class="absolute right-0 top-full mt-1 z-50 w-72 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
                    >
                      <div class="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500">ข้อเสนอแนะที่ใช้งานบ่อย</div>
                      <div class="max-h-48 overflow-y-auto">
                        <button
                          v-for="(fb, fi) in allStepFeedbacks(ans)"
                          :key="fi"
                          type="button"
                          @click="appendToComment(ans, fb)"
                          class="w-full text-left px-3 py-2.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border-b border-slate-100 last:border-0 transition leading-relaxed"
                        >{{ fb }}</button>
                      </div>
                    </div>
                  </div>
                </div>
                <textarea
                  :id="`comment-${index}`"
                  v-model="ans.teacherComment"
                  rows="2"
                  placeholder="เช่น เข้าใจปัญหาถูกต้อง แต่ขาดการตรวจสอบคำตอบ"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder:text-slate-300"
                />
              </div>
            </div>
          </div>

          <!-- Overall Feedback -->
          <div class="bg-white rounded-xl border border-slate-200 p-5">
            <label for="overall-feedback" class="block text-sm font-semibold text-slate-700 mb-1">ข้อเสนอแนะภาพรวม</label>
            <p class="text-xs text-slate-400 mb-2">นักเรียนจะเห็นข้อความนี้ในหน้าผลการสอบ</p>
            <textarea
              id="overall-feedback"
              v-model="overallFeedback"
              rows="3"
              placeholder="เช่น ทำได้ดีในภาพรวม ควรพัฒนาทักษะการตรวจสอบคำตอบให้มากยิ่งขึ้น"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder:text-slate-300"
            />
          </div>

          <div class="flex items-center justify-between pb-4">
            <button
              type="button"
              @click="showDeleteModal = true"
              class="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition"
            >
              <Trash2 :size="15" />
              ลบข้อสอบนี้
            </button>
            <button
              type="button"
              :disabled="saving"
              @click="confirmGrade"
              class="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
            >
              <CheckCircle2 :size="16" />
              บันทึกการตรวจ
            </button>
          </div>
        </form>
      </div>

      <!-- Right: Self-Assessment -->
      <div class="w-full xl:w-[35%] min-w-0">
        <div class="bg-white rounded-xl border border-slate-200 sticky top-6 overflow-auto">
          <div class="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <ClipboardList :size="15" class="text-indigo-500" />
            <span class="text-sm font-semibold text-slate-700">แบบประเมินความสามารถในการกำกับการเรียนรู้ตนเอง</span>
          </div>
          <div v-if="selfAssessment" class="p-4 space-y-4">
            <div v-for="(q, i) in ASSESSMENT_QUESTIONS" :key="i">
              <div class="text-xs font-medium text-slate-500 mb-1">{{ i + 1 }}. {{ q }}</div>
              <div class="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                {{ selfAssessment[`q${i + 1}`] || '—' }}
              </div>
            </div>
          </div>
          <div v-else class="p-6 text-center text-sm text-slate-400">
            นักเรียนยังไม่ได้ส่งแบบประเมิน
          </div>
          <div v-if="selfAssessment" class="px-4 py-3 border-t border-slate-100">
            <button
              @click="exportSelfAssessment"
              class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition"
            >
              <Download :size="13" />
              ดาวน์โหลดแบบประเมิน
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- Scoring Criteria Modal -->
    <div v-if="showScoring" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showScoring = false" />
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div class="p-6 pb-4 text-center border-b border-slate-100 flex-shrink-0">
          <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText :size="22" class="text-slate-600" />
          </div>
          <h2 class="text-lg font-bold text-slate-800">เกณฑ์การให้คะแนน</h2>
          <p class="text-sm text-slate-500 mt-1">คะแนนเต็มรวม {{ grades.length * 10 }} คะแนน (ข้อละ 10 คะแนน)</p>
        </div>
        <div class="overflow-y-auto flex-1 px-8 py-4 space-y-5 text-sm text-slate-700">
          <div class="mx-3">
            <p class="font-semibold text-slate-800 mb-2">1. การทำความเข้าใจปัญหา <span class="text-indigo-600">(เต็ม 2 คะแนน)</span></p>
            <ul class="space-y-1.5 pl-2">
              <li class="flex items-start gap-2"><span class="mt-0.5 shrink-0 text-xs font-bold text-emerald-600 w-12">2 คะแนน</span><p class="text-slate-600">บอกสิ่งที่โจทย์กำหนดให้และสิ่งที่โจทย์ต้องการทราบ ตรงกับสถานการณ์ได้ครบถ้วน</p></li>
              <li class="flex items-start gap-2"><span class="mt-0.5 shrink-0 text-xs font-bold text-amber-500 w-12">1 คะแนน</span><p class="text-slate-600">บอกสิ่งที่โจทย์กำหนดให้และสิ่งที่โจทย์ต้องการทราบ ตรงกับสถานการณ์แต่ไม่ครบถ้วน</p></li>
              <li class="flex items-start gap-2"><span class="mt-0.5 shrink-0 text-xs font-bold text-slate-400 w-12">0 คะแนน</span><p class="text-slate-500">ตอบไม่ตรงกับสถานการณ์หรือไม่ตอบ</p></li>
            </ul>
          </div>
          <div class="mx-3">
            <p class="font-semibold text-slate-800 mb-2">2. การวางแผนแก้ปัญหา <span class="text-indigo-600">(เต็ม 2 คะแนน)</span></p>
            <ul class="space-y-1.5 pl-2">
              <li class="flex items-start gap-2"><span class="mt-0.5 shrink-0 text-xs font-bold text-emerald-600 w-12">2 คะแนน</span><p class="text-slate-600">วางแผนโดยใช้ข้อมูลจากขั้นทำความเข้าใจปัญหาและแปลงวิธีการแก้ปัญหาให้อยู่ในรูปประโยคสัญลักษณ์ได้ถูกต้อง</p></li>
              <li class="flex items-start gap-2"><span class="mt-0.5 shrink-0 text-xs font-bold text-amber-500 w-12">1 คะแนน</span><p class="text-slate-600">วางแผนโดยใช้ข้อมูลจากขั้นทำความเข้าใจปัญหา แต่แปลงวิธีการแก้ปัญหาให้อยู่ในรูปประโยคสัญลักษณ์ไม่ถูกต้อง</p></li>
              <li class="flex items-start gap-2"><span class="mt-0.5 shrink-0 text-xs font-bold text-slate-400 w-12">0 คะแนน</span><p class="text-slate-500">ไม่สามารถวางแผนการแก้ปัญหาได้</p></li>
            </ul>
          </div>
          <div class="mx-3">
            <p class="font-semibold text-slate-800 mb-2">3. การดำเนินการตามแผน <span class="text-indigo-600">(เต็ม 4 คะแนน)</span></p>
            <ul class="space-y-1.5 pl-2">
              <li class="flex items-start gap-2"><span class="mt-0.5 shrink-0 text-xs font-bold text-emerald-600 w-12">4 คะแนน</span><p class="text-slate-600">ดำเนินการแก้ปัญหาตามลำดับขั้น สามารถแก้ปัญหาและหาคำตอบได้ถูกต้อง</p></li>
              <li class="flex items-start gap-2"><span class="mt-0.5 shrink-0 text-xs font-bold text-emerald-500 w-12">3 คะแนน</span><p class="text-slate-600">ดำเนินการแก้ปัญหาตามลำดับขั้น สามารถแก้ปัญหาได้และหาคำตอบได้ถูกต้องบางส่วน</p></li>
              <li class="flex items-start gap-2"><span class="mt-0.5 shrink-0 text-xs font-bold text-amber-500 w-12">2 คะแนน</span><p class="text-slate-600">ดำเนินการแก้ปัญหาตามลำดับขั้น สามารถแก้ปัญหาได้ แต่ไม่สามารถหาคำตอบได้ถูกต้อง</p></li>
              <li class="flex items-start gap-2"><span class="mt-0.5 shrink-0 text-xs font-bold text-amber-400 w-12">1 คะแนน</span><p class="text-slate-600">ดำเนินการแก้ปัญหาตามลำดับขั้นได้บางขั้นตอน แต่ไม่สามารถแก้ปัญหาได้</p></li>
              <li class="flex items-start gap-2"><span class="mt-0.5 shrink-0 text-xs font-bold text-slate-400 w-12">0 คะแนน</span><p class="text-slate-500">ไม่สามารถแก้ไขปัญหาได้</p></li>
            </ul>
          </div>
          <div class="mx-3">
            <p class="font-semibold text-slate-800 mb-2">4. การตรวจสอบกระบวนการแก้ปัญหา <span class="text-indigo-600">(เต็ม 2 คะแนน)</span></p>
            <ul class="space-y-1.5 pl-2">
              <li class="flex items-start gap-2"><span class="mt-0.5 shrink-0 text-xs font-bold text-emerald-600 w-12">2 คะแนน</span><p class="text-slate-600">แสดงวิธีตรวจคำตอบได้ถูกต้อง หรือเมื่อตรวจคำตอบพบว่าไม่ถูก สามารถแก้ไขปัญหาได้</p></li>
              <li class="flex items-start gap-2"><span class="mt-0.5 shrink-0 text-xs font-bold text-amber-500 w-12">1 คะแนน</span><p class="text-slate-600">แสดงวิธีตรวจคำตอบได้บางส่วนแต่ไม่ถูกต้อง หรือไม่สามารถตรวจพบว่าคำตอบไม่ถูกต้อง</p></li>
              <li class="flex items-start gap-2"><span class="mt-0.5 shrink-0 text-xs font-bold text-slate-400 w-12">0 คะแนน</span><p class="text-slate-500">ไม่สามารถแสดงวิธีการตรวจคำตอบได้</p></li>
            </ul>
          </div>
        </div>
        <div class="p-5 border-t border-slate-100 flex-shrink-0">
          <button @click="showScoring = false" class="w-full px-4 py-2.5 text-sm font-semibold text-white bg-slate-700 rounded-xl hover:bg-slate-800 transition">ปิด</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40" @click="closeDeleteModal" />
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <Trash2 :size="18" class="text-red-600" />
          </div>
          <div>
            <h3 class="font-semibold text-slate-800">ลบข้อสอบนี้?</h3>
            <p class="text-xs text-slate-400 mt-0.5">การลบไม่สามารถย้อนกลับได้</p>
          </div>
        </div>
        <p class="text-sm text-slate-600 mb-3">พิมพ์ <span class="font-bold text-red-600">ยืนยัน</span> เพื่อดำเนินการ</p>
        <input
          v-model="deleteConfirmText"
          type="text"
          placeholder="ยืนยัน"
          class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 mb-4"
          :class="deleteConfirmText === 'ยืนยัน' ? 'border-red-400 focus:ring-red-300' : 'border-slate-200 focus:ring-indigo-300'"
          @keydown.enter="handleDelete"
        />
        <div class="flex gap-2">
          <button
            type="button"
            @click="closeDeleteModal"
            class="flex-1 px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            @click="handleDelete"
            :disabled="deleteConfirmText !== 'ยืนยัน' || deleting"
            class="flex-1 px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Loader2 v-if="deleting" :size="14" class="animate-spin" />
            ลบ
          </button>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import { CheckCircle2, Loader2, ChevronDown, Zap, Trash2, FileText, ClipboardList, Download } from 'lucide-vue-next'
import MathDisplay from '~/components/MathDisplay.vue'
import { useApi } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import { useConfirm } from '~/composables/useConfirm'

definePageMeta({ middleware: 'auth', layout: false })

const route = useRoute()
const router = useRouter()
const { apiFetch } = useApi()
const { success: toastSuccess, error: toastError } = useToast()
const levelMap = { m1: 'ม.1', m2: 'ม.2', m3: 'ม.3' }

const STEPS = [
  { key: 'step1', label: 'ขั้นที่ 1: ทำความเข้าใจปัญหา', maxScore: 2 },
  { key: 'step2', label: 'ขั้นที่ 2: วางแผนแก้ปัญหา', maxScore: 2 },
  { key: 'step3', label: 'ขั้นที่ 3: ดำเนินการตามแผน', maxScore: 4 },
  { key: 'step4', label: 'ขั้นที่ 4: ตรวจสอบกระบวนการ', maxScore: 2 },
]

const ASSESSMENT_QUESTIONS = [
  'หลังจากทราบผลการทดสอบครั้งที่แล้วและอ่านข้อเสนอแนะเรียบร้อยแล้ว นักเรียนคิดว่าตนเองต้องพัฒนาเรื่องใดบ้าง',
  'หลังจากทราบผลการทดสอบครั้งที่แล้วและอ่านข้อเสนอแนะเรียบร้อยแล้ว นักเรียนเข้าใจวิธีการแก้ปัญหาเพิ่มขึ้นอย่างไรบ้าง',
  'ข้อมูลที่นักเรียนได้รับจากระบบหลังการสอบมีผลต่อการเตรียมตัวของนักเรียนอย่างไร',
  'ระหว่างการสอบครั้งที่แล้วจนถึงการสอบครั้งนี้ นักเรียนเตรียมตัวอย่างไรบ้าง',
  'ในการสอบครั้งถัดไป นักเรียนจะทำอย่างไรเพื่อให้ได้คะแนนที่สูงขึ้น',
]

const submission = ref(null)
const selfAssessment = ref(null)
const loading = ref(true)
const saving = ref(false)
const overallFeedback = ref('')
const grades = ref([])
const openDropdown = ref(null)
const showDeleteModal = ref(false)
const showScoring = ref(false)
const { confirm } = useConfirm()
const deleteConfirmText = ref('')
const deleting = ref(false)

function closeDeleteModal() {
  showDeleteModal.value = false
  deleteConfirmText.value = ''
}

async function handleDelete() {
  if (deleteConfirmText.value !== 'ยืนยัน') return
  deleting.value = true
  try {
    await apiFetch(`/submissions/${route.params.id}`, { method: 'DELETE' })
    await router.push('/submissions')
  } catch (e) {
    toastError(e?.data?.message || 'เกิดข้อผิดพลาด')
  } finally {
    deleting.value = false
  }
}

function toggleDropdown(key) {
  openDropdown.value = openDropdown.value === key ? null : key
}

function closeDropdown() {
  openDropdown.value = null
}

function appendQuickFeedback(ans, stepKey, text) {
  const current = (ans[stepKey].feedback || '').trimEnd()
  ans[stepKey].feedback = current ? `${current}\n${text}` : text
  openDropdown.value = null
}

function appendToComment(ans, text) {
  const current = (ans.teacherComment || '').trimEnd()
  ans.teacherComment = current ? `${current}\n${text}` : text
  openDropdown.value = null
}

function allStepFeedbacks(ans) {
  const sf = ans.stepFeedbacks || {}
  return [...new Set(['step1', 'step2', 'step3', 'step4'].flatMap((s) => sf[s] || []))]
}

function clampScore(ans, step) {
  const val = ans[step.key].scoreGiven
  if (val < 0) ans[step.key].scoreGiven = 0
  else if (val > step.maxScore) ans[step.key].scoreGiven = step.maxScore
}

function questionScore(index) {
  const ans = grades.value[index]
  if (!ans) return 0
  return STEPS.reduce((sum, step) => sum + (ans[step.key]?.scoreGiven || 0), 0)
}

const computedTotal = computed(() => {
  return grades.value.reduce((sum, _, i) => sum + questionScore(i), 0)
})

onMounted(async () => {
  document.addEventListener('click', closeDropdown)
  try {
    const data = await apiFetch(`/submissions/${route.params.id}`)
    submission.value = data
    overallFeedback.value = data.overallFeedback || ''
    grades.value = data.answers.map((a) => ({
      questionId: a.questionId,
      problemSnapshot: a.problemSnapshot,
      problemImageSnapshots: a.problemImageSnapshots || [],
      referenceSolution: a.referenceSolution || '',
      referenceSolutionImageUrls: a.referenceSolutionImageUrls || [],
      answer: a.answer || '',
      stepFeedbacks: a.stepFeedbacks || {},
      step1: { ...(a.step1 || { inputType: 'text', text: '', imageUrl: '' }), scoreGiven: a.step1Score || 0, feedback: a.step1Feedback || '' },
      step2: { ...(a.step2 || { inputType: 'text', text: '', imageUrl: '' }), scoreGiven: a.step2Score || 0, feedback: a.step2Feedback || '' },
      step3: { ...(a.step3 || { inputType: 'text', text: '', imageUrl: '' }), scoreGiven: a.step3Score || 0, feedback: a.step3Feedback || '' },
      step4: { ...(a.step4 || { inputType: 'text', text: '', imageUrl: '' }), scoreGiven: a.step4Score || 0, feedback: a.step4Feedback || '' },
      teacherComment: a.teacherComment || '',
    }))
    // fetch self-assessment (non-blocking)
    apiFetch(`/self-assessments/admin/${route.params.id}`)
      .then(sa => { selfAssessment.value = sa })
      .catch(() => {})
  } catch (e) {
    toastError(e?.data?.message || "ไม่สามารถโหลดข้อมูลการส่งได้")
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})

async function confirmGrade() {
  const ok = await confirm({
    title: 'ยืนยันการตรวจข้อสอบ',
    message: `คะแนนรวม ${computedTotal.value} / ${grades.value.length * 10} คะแนน\nนักเรียนจะเห็นคะแนนและข้อเสนอแนะทันที`,
    confirmLabel: 'ยืนยัน',
    danger: false,
  })
  if (!ok) return
  handleGrade()
}

async function exportSelfAssessment() {
  const XLSX = await import('xlsx')
  const student = submission.value?.studentId
  const sa = selfAssessment.value

  const rows = [
    ['ชื่อ-นามสกุล', (student?.title ? student.title + ' ' : '') + (student?.name || '-')],
    ['รหัสนักเรียน', student?.studentId || '-'],
    [],
    ['ข้อ', 'คำถาม', 'คำตอบ'],
    ...ASSESSMENT_QUESTIONS.map((q, i) => [i + 1, q, sa?.[`q${i + 1}`] || '-']),
  ]

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 6 }, { wch: 60 }, { wch: 60 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'แบบประเมินตนเอง')

  const filename = `แบบประเมิน-${student?.studentId || 'student'}.xlsx`
  XLSX.writeFile(wb, filename)
}

async function handleGrade() {
  saving.value = true
  try {
    await apiFetch(`/submissions/${route.params.id}/grade`, {
      method: 'PUT',
      body: {
        answers: grades.value.map((g, i) => ({
          questionId: g.questionId,
          scoreGiven: questionScore(i),
          step1Score: g.step1.scoreGiven,
          step2Score: g.step2.scoreGiven,
          step3Score: g.step3.scoreGiven,
          step4Score: g.step4.scoreGiven,
          step1Feedback: g.step1.feedback,
          step2Feedback: g.step2.feedback,
          step3Feedback: g.step3.feedback,
          step4Feedback: g.step4.feedback,
          teacherComment: g.teacherComment,
        })),
        overallFeedback: overallFeedback.value,
        maxScore: grades.value.length * 10,
      },
    })
    toastSuccess('บันทึกการตรวจเรียบร้อยแล้ว!')
    await router.push('/submissions')
  } catch (e) {
    toastError(e?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
  } finally {
    saving.value = false
  }
}
</script>
