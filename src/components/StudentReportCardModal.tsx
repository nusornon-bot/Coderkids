import React, { useState } from 'react';
import {
  X,
  Printer,
  Award,
  CheckCircle2,
  Calendar,
  User,
  GraduationCap,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Cpu,
  Brain,
  Share2,
} from 'lucide-react';
import { UserProfile } from '../types/index.ts';
import { soundEffects } from '../utils/soundEffects.ts';

interface StudentReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  points: number;
}

export const StudentReportCardModal: React.FC<StudentReportCardModalProps> = ({
  isOpen,
  onClose,
  profile,
  points,
}) => {
  const [teacherRemarks, setTeacherRemarks] = useState<string>(
    'ผู้เรียนมีความกระตือรือร้นในการเรียนรู้วิทยาการคำนวณอย่างโดดเด่น สามารถแก้ปัญหาเชิงตรรกะผ่านการเขียนบล็อกโค้ด Scratch และการต่อวงจร Micro:bit ได้อย่างสร้างสรรค์ มีคุณธรรมจริยธรรมในการใช้อินเทอร์เน็ตและเข้าใจสิทธิส่วนบุคคลตามกฎหมาย PDPA เป็นอย่างดี ควรส่งเสริมเข้าแข่งขันในระดับเขตพื้นที่การศึกษาต่อไป'
  );

  const [academicYear, setAcademicYear] = useState<string>('2568-2569');
  const [semester, setSemester] = useState<string>('ภาคเรียนที่ 2');

  if (!isOpen) return null;

  const handlePrint = () => {
    soundEffects.play('click');
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col text-slate-900 dark:text-white print:border-none print:shadow-none print:max-h-none print:rounded-none">
        {/* Screen Header (Hidden on print) */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 sticky top-0 z-10 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล (ปพ.5 / ว PA)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  มาตรฐาน ว 4.2 สพฐ.
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เอกสารประเมินสมรรถนะการเรียนรู้วิทยาการคำนวณและเทคโนโลยี พร้อมพิมพ์ขนาด A4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ใบรายงาน A4 / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE A4 REPORT CARD BODY */}
        <div className="p-6 sm:p-10 space-y-6 print:p-6 print:space-y-4 print:text-black">
          {/* Official Emblem & Header */}
          <div className="text-center space-y-1.5 border-b-2 border-indigo-600 dark:border-indigo-400 pb-4">
            <div className="text-3xl font-serif">🏛️</div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase print:text-black">
              แบบรายงานผลการประเมินสมรรถนะและคุณลักษณะอันพึงประสงค์
            </h1>
            <h2 className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 print:text-gray-700">
              กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี (วิทยาการคำนวณ ว 4.2)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 print:text-gray-600">
              หลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พุทธศักราช 2551 (ฉบับปรับปรุง 2560) | ประจำ{semester} ปีการศึกษา {academicYear}
            </p>
          </div>

          {/* Student Info Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs print:bg-white print:border-gray-300">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">ชื่อ-นามสกุล:</span>
              <span className="font-bold text-sm text-slate-900 dark:text-white print:text-black">
                {profile.name || 'ด.ช. นักเรียน โค้ดเดอร์'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">รหัสนักเรียน:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">
                {profile.studentId || 'CK-2568-1001'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">ระดับชั้น:</span>
              <span className="font-bold text-slate-900 dark:text-white print:text-black">
                {profile.grade || 'ประถมศึกษาปีที่ 5'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">คะแนนสะสม / สมรรถนะ:</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 print:text-indigo-800">
                {points.toLocaleString()} XP (ระดับยอดเยี่ยม)
              </span>
            </div>
          </div>

          {/* 4 Modules Competency Assessment Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>ผลการเรียนรู้รายโมดูลหลัก (4 Core Modules)</span>
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 print:border-gray-400">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 print:bg-gray-100 print:text-black">
                  <tr>
                    <th className="p-3 font-bold">หน่วยการเรียนรู้ (Module)</th>
                    <th className="p-3 font-bold">มาตรฐานตัวชี้วัด</th>
                    <th className="p-3 font-bold text-center">คะแนนเต็ม</th>
                    <th className="p-3 font-bold text-center">คะแนนที่ได้</th>
                    <th className="p-3 font-bold text-center">ระดับผลการเรียน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-gray-300">
                  <tr>
                    <td className="p-3 font-semibold">
                      โมดูล 1: ความปลอดภัยดิจิทัล &amp; กฎหมาย PDPA
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 print:text-gray-600">
                      ว 4.2 ป.5/4 ใช้เทคโนโลยีอย่างปลอดภัยและมีมารยาท
                    </td>
                    <td className="p-3 text-center font-mono">25</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-600">24</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                        ดีเยี่ยม (4.0)
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold">
                      โมดูล 2: แนวคิดเชิงคำนวณ &amp; อัลกอริทึม
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 print:text-gray-600">
                      ว 4.2 ป.5/1 ใช้เหตุผลเชิงตรรกะในการแก้ปัญหา
                    </td>
                    <td className="p-3 text-center font-mono">25</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-600">25</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                        ดีเยี่ยม (4.0)
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold">
                      โมดูล 3: บล็อกโค้ดดิ้ง Scratch &amp; ฮาร์ดแวร์ Micro:bit V2
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 print:text-gray-600">
                      ว 4.2 ป.5/2 ออกแบบและเขียนโปรแกรมอย่างง่าย
                    </td>
                    <td className="p-3 text-center font-mono">30</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-600">28</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                        ดีเยี่ยม (4.0)
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold">
                      โมดูล 4: โครงงานนวัตกรรม STEM &amp; การสะท้อนคิด
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 print:text-gray-600">
                      ว 4.2 ป.5/3 ประยุกต์ใช้ซอฟต์แวร์ในการนำเสนอผลงาน
                    </td>
                    <td className="p-3 text-center font-mono">20</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-600">19</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                        ดีเยี่ยม (4.0)
                      </span>
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700 print:bg-gray-100">
                  <tr>
                    <td colSpan={2} className="p-3 text-right">คะแนนรวมตลอดภาคเรียน:</td>
                    <td className="p-3 text-center font-mono">100</td>
                    <td className="p-3 text-center font-mono text-indigo-600 dark:text-indigo-400 text-sm">96</td>
                    <td className="p-3 text-center text-emerald-600 font-black">เกรด 4.00 (ยอดเยี่ยม)</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 5 Core Competencies (สมรรถนะสำคัญ 5 ประการ) */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>การประเมินสมรรถนะสำคัญ 5 ประการของผู้เรียน (ตามหลักสูตรแกนกลาง)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {[
                { name: '1. ความสามารถในการสื่อสาร', level: 'ดีเยี่ยม (3)' },
                { name: '2. ความสามารถในการคิด', level: 'ดีเยี่ยม (3)' },
                { name: '3. ความสามารถในการแก้ปัญหา', level: 'ดีเยี่ยม (3)' },
                { name: '4. ความสามารถในการใช้ทักษะชีวิต', level: 'ดีเยี่ยม (3)' },
                { name: '5. ความสามารถในการใช้เทคโนโลยี', level: 'ดีเยี่ยม (3)' },
              ].map((comp, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] leading-tight">
                    {comp.name}
                  </div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                    ✓ {comp.level}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Teacher Observation Remarks Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 print:bg-white print:border-gray-400">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              ข้อเสนอแนะและความเห็นของครูผู้สอน / ครูประจำชั้น:
            </label>
            <textarea
              rows={3}
              value={teacherRemarks}
              onChange={(e) => setTeacherRemarks(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs leading-relaxed focus:outline-none focus:border-indigo-500 print:border-none print:p-0 print:text-black"
            />
          </div>

          {/* Signature & Seal Block */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-6 text-center text-xs text-slate-600 dark:text-slate-400 print:text-black">
            <div className="space-y-8">
              <div className="font-semibold">ลงชื่อ .................................................... ครูผู้สอน</div>
              <div>(คุณครูผู้ประสิทธิ์ประสาทวิชา)</div>
            </div>

            <div className="space-y-8">
              <div className="font-semibold">ลงชื่อ .................................................... ผู้ปกครอง</div>
              <div>(.......................................................)</div>
            </div>

            <div className="space-y-8 col-span-2 sm:col-span-1">
              <div className="font-semibold">ลงชื่อ .................................................... นายทะเบียน</div>
              <div>ผู้อำนวยการสถานศึกษา / ประทับตรา</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
