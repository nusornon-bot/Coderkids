import React, { useState } from 'react';
import {
  Bug,
  Play,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  Award,
  Wrench,
  AlertTriangle,
} from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects.ts';

interface CodeDebuggingLabProps {
  addPoints: (points: number, reason?: string) => void;
  onComplete?: () => void;
}

interface DebugChallenge {
  id: string;
  grade: 'ป.4' | 'ป.5' | 'ป.6';
  indicator: string;
  title: string;
  authorName: string;
  goal: string;
  buggyOutput: string;
  expectedOutput: string;
  lines: {
    lineNo: number;
    code: string;
    traceState: string;
    isBuggyLine?: boolean;
  }[];
  fixOptions: {
    label: string;
    detail: string;
    isCorrect: boolean;
  }[];
  fixedLinesPreview: string[];
  explanation: string;
}

const DEBUG_CHALLENGES: DebugChallenge[] = [
  {
    id: 'dbg_p4_square',
    grade: 'ป.4',
    indicator: 'ว 4.2 ป.4/2',
    title: 'โจทย์ 1: โค้ดวาดสี่เหลี่ยมจัตุรัสของน้องต้นกล้าไม่เป็นรูปปิด',
    authorName: 'โค้ดของ ด.ช. ต้นกล้า (ป.4)',
    goal: 'ต้องการให้แมวเดินวาดรูปสี่เหลี่ยมจัตุรัสทั้ง 4 ด้านแล้วปิดมุมพอดี',
    buggyOutput: 'ได้รูปหกเหลี่ยมเปิด ไม่ใช่สี่เหลี่ยมมุมฉาก 90°!',
    expectedOutput: 'รูปสี่เหลี่ยมจัตุรัส 4 ด้านมุมฉาก 90° ปิดสนิท',
    lines: [
      { lineNo: 1, code: 'เมื่อคลิก ธงเขียว', traceState: 'เริ่มโปรแกรม (x: 0, y: 0, ทิศ: 90°)' },
      { lineNo: 2, code: 'จรดปากกา (Pen Down)', traceState: 'ปากกา = พร้อมวาด' },
      { lineNo: 3, code: 'ทำซ้ำ (4) รอบ:', traceState: 'รอบที่ 1..4' },
      { lineNo: 4, code: '   ก้าว (80) ก้าว', traceState: 'วาดเส้นยาว 80 หน่วย' },
      {
        lineNo: 5,
        code: '   หมุนตามเข็ม (60) องศา   <-- จุดน่าสงสัย!',
        traceState: 'มุมเลี้ยว = 60° (4 × 60° = 240° ไม่ครบ 360°!)',
        isBuggyLine: true,
      },
      { lineNo: 6, code: 'ยกปากกา (Pen Up)', traceState: 'จบการวาด' },
    ],
    fixOptions: [
      {
        label: 'แก้บรรทัดที่ 5 เป็น: หมุนตามเข็ม (90) องศา',
        detail: 'เพราะรูปสี่เหลี่ยมมีมุมภายนอก 360° ÷ 4 = 90°',
        isCorrect: true,
      },
      {
        label: 'แก้บรรทัดที่ 3 เป็น: ทำซ้ำ (2) รอบ',
        detail: 'จะวาดได้แค่ 2 ด้านเท่านั้น',
        isCorrect: false,
      },
      {
        label: 'ลบบรรทัดที่ 2 จรดปากกา ออก',
        detail: 'แมวจะเดินโดยไม่มีเส้นวาดเลย',
        isCorrect: false,
      },
    ],
    fixedLinesPreview: [
      'ทำซ้ำ (4) รอบ:',
      '   ก้าว (80) ก้าว',
      '   หมุนตามเข็ม (90) องศา  ✅ (4 × 90° = 360°)',
    ],
    explanation:
      'การตรวจสอบความผิดพลาดทีละขั้นตอนพบว่า ต้นกล้าใส่องศาการหมุนผิดเป็น 60° ทำให้วาดครบ 4 รอบได้เพียง 240° เมื่อเปลี่ยนเป็น 90° จะครบรอบ 360° เป็นสี่เหลี่ยมจัตุรัสพอดี',
  },
  {
    id: 'dbg_p5_evenodd',
    grade: 'ป.5',
    indicator: 'ว 4.2 ป.5/2',
    title: 'โจทย์ 2: โปรแกรมตรวจสอบเลขคู่/เลขคี่ ตอบเลข 0 และเลขคี่ผิด',
    authorName: 'โค้ดของ ด.ญ. มะลิ (ป.5)',
    goal: 'รับจำนวนเต็ม n แล้วตรวจสอบให้ครบทุกกรณีว่าเป็น "เลขคู่" หรือ "เลขคี่"',
    buggyOutput: 'ใส่ n = 7 โปรแกรมกลับแสดงผลว่าเป็น "เลขคู่"!',
    expectedOutput: 'ใส่ n = 7 ต้องตอบ "เลขคี่", ใส่ n = 8 ต้องตอบ "เลขคู่"',
    lines: [
      { lineNo: 1, code: 'รับค่าตัวเลข n = 7', traceState: 'ตัวแปร n = 7' },
      {
        lineNo: 2,
        code: 'ถ้า (n > 0) แล้ว:   <-- จุดน่าสงสัย!',
        traceState: '7 > 0 เป็นจริง! (ไม่ได้เช็กการหาร 2 ลงตัวเลย)',
        isBuggyLine: true,
      },
      { lineNo: 3, code: '   แสดงผล "เป็นเลขคู่"', traceState: 'พิมพ์คำว่า "เป็นเลขคู่" (ผิด!)' },
      { lineNo: 4, code: 'มิฉะนั้น (Else):', traceState: 'ข้ามกิ่ง Else' },
      { lineNo: 5, code: '   แสดงผล "เป็นเลขคี่"', traceState: 'ไม่ถูกเรียกใช้งาน' },
    ],
    fixOptions: [
      {
        label: 'แก้เงื่อนไขบรรทัด 2 เป็น: ถ้า (n mod 2 == 0)',
        detail: 'ใช้ตัวดำเนินการ mod ตรวจว่าหาร 2 เหลือเศษ 0 หรือไม่',
        isCorrect: true,
      },
      {
        label: 'แก้เงื่อนไขบรรทัด 2 เป็น: ถ้า (n < 10)',
        detail: 'เลขคี่ที่น้อยกว่า 10 อย่าง 7 ก็ยังผิดอยู่ดี',
        isCorrect: false,
      },
      {
        label: 'ลบคำสั่ง Else ออกให้เหลือแต่ If',
        detail: 'ทำให้โปรแกรมไม่ครอบคลุมกรณีเลขคี่',
        isCorrect: false,
      },
    ],
    fixedLinesPreview: [
      'ถ้า (n mod 2 == 0) แล้ว:  ✅',
      '   แสดงผล "เป็นเลขคู่"',
      'มิฉะนั้น (Else):',
      '   แสดงผล "เป็นเลขคี่"',
    ],
    explanation:
      'เงื่อนไขเลขคู่คือ "หารด้วย 2 ลงตัว (เศษเท่ากับ 0)" หรือ n mod 2 == 0 การใช้ n > 0 ทำให้เลขบวกที่เป็นเลขคี่ถูกจัดเป็นเลขคู่ทั้งหมด',
  },
  {
    id: 'dbg_p5_body',
    grade: 'ป.5',
    indicator: 'ว 4.2 ป.5/2',
    title: 'โจทย์ 3: โปรแกรมตรวจความสมส่วนร่างกาย (น้ำหนัก-ส่วนสูง) จัดเกณฑ์ผิดลำดับ',
    authorName: 'โค้ดของ ด.ช. ภูมิ (ป.5)',
    goal: 'จำแนกค่า BMI: < 18.5 = ผอม, 18.5–22.9 = สมส่วน, >= 23 = น้ำหนักเกิน',
    buggyOutput: 'นักเรียน BMI = 16.0 (ผอม) แต่โปรแกรมกลับตอบว่า "สมส่วน"!',
    expectedOutput: 'BMI = 16.0 ต้องเข้าเงื่อนไข "ผอม (< 18.5)"',
    lines: [
      { lineNo: 1, code: 'รับค่า น้ำหนัก, ส่วนสูง -> คำนวณ BMI = 16.0', traceState: 'BMI = 16.0' },
      {
        lineNo: 2,
        code: 'ถ้า (BMI < 23) แล้ว:   <-- จุดน่าสงสัย!',
        traceState: '16.0 < 23 เป็นจริงทันที! จบการเช็กตรงนี้เลย',
        isBuggyLine: true,
      },
      { lineNo: 3, code: '   แสดงผล "สมส่วน"', traceState: 'ตอบ "สมส่วน" ผิดเงื่อนไข!' },
      { lineNo: 4, code: 'มิฉะนั้น ถ้า (BMI < 18.5) แล้ว:', traceState: 'ไม่เคยถูกตรวจเพราะบรรทัด 2 ดักไปแล้ว!' },
      { lineNo: 5, code: '   แสดงผล "ผอม"', traceState: 'ไม่ได้ทำงาน' },
    ],
    fixOptions: [
      {
        label: 'สลับตรวจเงื่อนไข (BMI < 18.5) ก่อน แล้วค่อยตรวจ (BMI < 23)',
        detail: 'เรียงช่วงตัวเลขจากค่าน้อยไปมาก เพื่อไม่ให้เงื่อนไขกว้างดักช่วงแคบ',
        isCorrect: true,
      },
      {
        label: 'เปลี่ยนเครื่องหมาย < เป็น + ในทุกบรรทัด',
        detail: 'ไม่สามารถเปรียบเทียบตัวเลขได้',
        isCorrect: false,
      },
      {
        label: 'ใส่ค่า BMI = 20 คงที่ไว้ตั้งแต่บรรทัดแรก',
        detail: 'จะทำให้รับค่าจากผู้ใช้จริงไม่ได้',
        isCorrect: false,
      },
    ],
    fixedLinesPreview: [
      'ถ้า (BMI < 18.5) แล้ว: แสดงผล "ผอม" ✅',
      'มิฉะนั้น ถ้า (BMI < 23) แล้ว: แสดงผล "สมส่วน" ✅',
      'มิฉะนั้น: แสดงผล "น้ำหนักเกิน" ✅',
    ],
    explanation:
      'ในการเขียนเงื่อนไขหลายช่วง (Else-If) ต้องเรียงลำดับขอบเขตให้ถูกต้อง มิฉะนั้น BMI = 16.0 ซึ่งน้อยกว่า 23 จะถูกจับเข้ากลุ่ม "สมส่วน" ก่อนถึงเงื่อนไข < 18.5',
  },
  {
    id: 'dbg_p6_lcm',
    grade: 'ป.6',
    indicator: 'ว 4.2 ป.6/2',
    title: 'โจทย์ 4: โปรแกรมหาค่า ค.ร.น. (LCM) ของเลข 4 และ 6 วนลูปไม่จบ (Infinite Loop)',
    authorName: 'โค้ดของ ด.ญ. น้ำหวาน (ป.6)',
    goal: 'หาตัวคูณร่วมน้อย (ค.ร.น.) ของ a = 4 และ b = 6 (คำตอบที่ถูกคือ 12)',
    buggyOutput: 'โปรแกรมค้าง! ตัวแปร lcm เพิ่มค่าไปเรื่อย ๆ ไม่ยอมหยุดที่ 12',
    expectedOutput: 'หยุดลูปเมื่อ lcm หารทั้ง 4 และ 6 ลงตัว ได้ ค.ร.น. = 12',
    lines: [
      { lineNo: 1, code: 'ตั้งค่า a = 4, b = 6', traceState: 'a = 4, b = 6' },
      { lineNo: 2, code: 'ตั้งค่า lcm = max(a, b)', traceState: 'lcm = 6' },
      { lineNo: 3, code: 'ทำซ้ำจนกว่า (lcm mod a == 0 และ lcm mod b == 0):', traceState: 'ตรวจ 6: 6 mod 4 = 2 (ยังไม่เป็น 0)' },
      {
        lineNo: 4,
        code: '   เปลี่ยนค่า a เพิ่มขึ้น 1   <-- จุดน่าสงสัย!',
        traceState: 'ไปเพิ่มตัวแปร a แทน lcm! ทำให้ lcm ค้างอยู่ที่ 6 ตลอดกาล',
        isBuggyLine: true,
      },
      { lineNo: 5, code: 'แสดงผล lcm', traceState: 'วนลูปไม่รู้จบ ไม่ถึงบรรทัดนี้' },
    ],
    fixOptions: [
      {
        label: 'แก้บรรทัดที่ 4 เป็น: เปลี่ยนค่า lcm เพิ่มขึ้น 1',
        detail: 'เพื่อให้ lcm ขยับจาก 6 -> 7 -> ... -> 12 จนหารทั้ง a และ b ลงตัว',
        isCorrect: true,
      },
      {
        label: 'แก้บรรทัดที่ 3 เป็น: ทำซ้ำ (1) รอบ',
        detail: 'จะได้คำตอบเป็น 6 ซึ่งหาร 4 ไม่ลงตัว',
        isCorrect: false,
      },
      {
        label: 'เปลี่ยนคำว่า "และ" เป็น "หรือ"',
        detail: '6 หาร 6 ลงตัวตั้งแต่รอบแรก จะตอบ 6 ซึ่งผิด ค.ร.น.',
        isCorrect: false,
      },
    ],
    fixedLinesPreview: [
      'ทำซ้ำจนกว่า (lcm mod a == 0 และ lcm mod b == 0):',
      '   เปลี่ยนค่า lcm เพิ่มขึ้น 1  ✅ (6 -> ... -> 12)',
      'แสดงผล lcm  --> ได้ 12! 🎉',
    ],
    explanation:
      'การเขียน Loop + ตัวแปร ต้องอัปเดตตัวแปรที่เป็นเงื่อนไขของลูป (lcm) การไปเพิ่มค่า a ทำให้ lcm อยู่กับที่และเกิด Infinite Loop',
  },
  {
    id: 'dbg_p6_typing',
    grade: 'ป.6',
    indicator: 'ว 4.2 ป.6/2',
    title: 'โจทย์ 5: เกมฝึกพิมพ์ (Typing Game) บวกคะแนนแม้พิมพ์ผิดตัวอักษร',
    authorName: 'โค้ดของ ด.ช. ปั้น (ป.6)',
    goal: 'เมื่อผู้เล่นพิมพ์ตรงกับตัวอักษรเป้าหมายจึงจะได้ +10 คะแนน ถ้าผิดให้ -5 คะแนน',
    buggyOutput: 'พิมพ์ผิดก็ยังได้ +10 คะแนนฟรีทุกครั้ง!',
    expectedOutput: 'พิมพ์ถูกได้ +10, พิมพ์ผิดติดลบ -5',
    lines: [
      { lineNo: 1, code: 'ตั้งค่า คะแนน = 0, เป้าหมาย = "K"', traceState: 'คะแนน = 0' },
      { lineNo: 2, code: 'รับค่าปุ่มที่พิมพ์ inputKey = "Z"', traceState: 'inputKey = "Z" (ไม่ตรงกับ "K")' },
      { lineNo: 3, code: 'ถ้า (inputKey == เป้าหมาย) แล้ว:', traceState: '"Z" == "K" เป็นเท็จ' },
      { lineNo: 4, code: '   พูดว่า "เยี่ยมมาก!"', traceState: 'ข้ามกิ่งนี้' },
      { lineNo: 5, code: 'มิฉะนั้น: เปลี่ยน คะแนน เพิ่ม (-5)', traceState: 'คะแนนกลายเป็น -5' },
      {
        lineNo: 6,
        code: 'เปลี่ยน คะแนน เพิ่ม (10)  (วางอยู่นอกบล็อก If!)   <-- จุดน่าสงสัย!',
        traceState: 'ทำงานทุกครั้ง! คะแนนกลายเป็น -5 + 10 = +5 แม้พิมพ์ผิด!',
        isBuggyLine: true,
      },
    ],
    fixOptions: [
      {
        label: 'ย้าย "เปลี่ยน คะแนน เพิ่ม (10)" เข้าไปไว้ในกิ่ง "ถ้า (If)"',
        detail: 'เพื่อให้บวก +10 เฉพาะตอนที่พิมพ์ตรงกับเป้าหมายเท่านั้น',
        isCorrect: true,
      },
      {
        label: 'ลบคำสั่งรับค่าปุ่มที่พิมพ์ออก',
        detail: 'เกมจะรับข้อมูลจากคีย์บอร์ดไม่ได้',
        isCorrect: false,
      },
      {
        label: 'เปลี่ยน -5 เป็น +5',
        detail: 'จะยิ่งได้คะแนนฟรีแม้พิมพ์ผิด',
        isCorrect: false,
      },
    ],
    fixedLinesPreview: [
      'ถ้า (inputKey == เป้าหมาย) แล้ว:',
      '   พูดว่า "เยี่ยมมาก!"',
      '   เปลี่ยน คะแนน เพิ่ม (10)  ✅',
      'มิฉะนั้น: เปลี่ยน คะแนน เพิ่ม (-5)  ✅',
    ],
    explanation:
      'คำสั่งเพิ่มคะแนนถูกวางไว้นอกโครงสร้าง If-Then-Else จึงทำงานต่อท้ายเสมอไม่ว่าจะพิมพ์ถูกหรือผิด ต้องย้ายเข้าไปอยู่ใต้กิ่ง "แล้ว (Then)"',
  },
];

export const CodeDebuggingLab: React.FC<CodeDebuggingLabProps> = ({ addPoints, onComplete }) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [traceStep, setTraceStep] = useState<number>(0); // 0 = not started, 1..lines.length
  const [selectedFix, setSelectedFix] = useState<Record<string, number>>({});
  const [solvedIds, setSolvedIds] = useState<string[]>([]);

  const challenge = DEBUG_CHALLENGES[selectedIdx];
  const chosenFixIdx = selectedFix[challenge.id];
  const isSolved = solvedIds.includes(challenge.id);

  const handleSelectChallenge = (idx: number) => {
    soundEffects.play('click');
    setSelectedIdx(idx);
    setTraceStep(0);
  };

  const handleNextTrace = () => {
    soundEffects.play('click');
    setTraceStep((prev) => (prev < challenge.lines.length ? prev + 1 : prev));
  };

  const handleSelectFix = (fixIdx: number) => {
    soundEffects.play('click');
    setSelectedFix((prev) => ({ ...prev, [challenge.id]: fixIdx }));
    const opt = challenge.fixOptions[fixIdx];
    if (opt.isCorrect) {
      soundEffects.play('correct');
      if (!solvedIds.includes(challenge.id)) {
        const nextSolved = [...solvedIds, challenge.id];
        setSolvedIds(nextSolved);
        addPoints(20, `แก้บั๊กโค้ดสำเร็จ: ${challenge.title}`);
        if (nextSolved.length >= 3) {
          onComplete?.();
        }
      }
    } else {
      soundEffects.play('error');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <Bug className="w-4 h-4" />
            <span>มาตรฐาน ว 4.2 ป.4/2 · ป.5/2 · ป.6/2</span>
            <span aria-hidden="true">·</span>
            <span>ฝึกตรวจสอบและแก้ไขโปรแกรมของผู้อื่น</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            ห้องปฏิบัติการจับผิดและแก้บั๊กโค้ดทีละขั้นตอน (Code Debugger Lab)
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            รันติดตามค่าตัวแปรและผลลัพธ์ทีละบรรทัด (Step-by-Step Trace) เพื่อหาจุดผิดพลาดในโปรแกรมของผู้อื่น แล้วเลือกวิธีแก้ไขที่ถูกต้อง
          </p>
        </div>

        <div className="px-4 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-2 shrink-0">
          <Award className="w-4 h-4 text-indigo-600" />
          <span>แก้บั๊กสำเร็จแล้ว {solvedIds.length} / {DEBUG_CHALLENGES.length} โจทย์</span>
        </div>
      </div>

      {/* Challenge Selector Bar */}
      <div className="flex flex-wrap gap-2">
        {DEBUG_CHALLENGES.map((item, idx) => {
          const active = idx === selectedIdx;
          const done = solvedIds.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectChallenge(idx)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                active
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : done
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {done && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
              <span>{item.grade}: โจทย์ {idx + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Main Split Debugger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: Step-by-Step Code Tracer */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{challenge.indicator}</span>
              <span aria-hidden="true">·</span>
              <span>{challenge.authorName}</span>
            </div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">{challenge.title}</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <strong>เป้าหมายที่ต้องการ:</strong> {challenge.goal}
            </p>
          </div>

          {/* Expected vs Buggy Output */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200">
              <div className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>ผลลัพธ์ที่ผิดพลาดตอนนี้:</span>
              </div>
              <div className="mt-1">{challenge.buggyOutput}</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
              <div className="font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>ผลลัพธ์ที่ถูกต้อง:</span>
              </div>
              <div className="mt-1">{challenge.expectedOutput}</div>
            </div>
          </div>

          {/* Step-by-step Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              กด &quot;รันทีละบรรทัด&quot; เพื่อติดตามการทำงาน (ขั้นตอนที่ {traceStep} / {challenge.lines.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTraceStep(0)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>เริ่มใหม่</span>
              </button>
              <button
                type="button"
                onClick={handleNextTrace}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>{traceStep === 0 ? 'เริ่มติดตามบรรทัดที่ 1' : 'บรรทัดถัดไป'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEffects.play('click');
                  setTraceStep(challenge.lines.length);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold cursor-pointer flex items-center gap-1"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>ดูทั้งหมด</span>
              </button>
            </div>
          </div>

          {/* Code lines */}
          <div className="space-y-1.5">
            {challenge.lines.map((ln, idx) => {
              const isReached = idx < traceStep;
              const isCurrent = idx === traceStep - 1;
              return (
                <div
                  key={ln.lineNo}
                  className={`p-3 rounded-xl border font-mono text-xs transition-all ${
                    isCurrent
                      ? ln.isBuggyLine
                        ? 'bg-rose-100 border-rose-400 text-rose-950 ring-2 ring-rose-300'
                        : 'bg-indigo-50 border-indigo-400 text-indigo-950 ring-2 ring-indigo-200'
                      : isReached
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                      : 'bg-white/60 dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="inline-block w-6 text-slate-400 font-bold">{ln.lineNo}.</span>
                      <span className="font-bold">{ln.code}</span>
                    </div>
                  </div>
                  {isReached && (
                    <div className="mt-1 pl-6 font-sans text-[11px] text-slate-600 dark:text-slate-400">
                      ↳ สถานะ: {ln.traceState}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 cols: Pick the Fix */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Wrench className="w-4 h-4 text-indigo-600" />
            <span>เลือกวิธีแก้ไขบั๊กให้ถูกต้อง</span>
          </div>

          <div className="space-y-2.5">
            {challenge.fixOptions.map((opt, idx) => {
              const isPicked = chosenFixIdx === idx;
              let cls = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-400';
              if (chosenFixIdx !== undefined) {
                if (opt.isCorrect) {
                  cls = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold';
                } else if (isPicked) {
                  cls = 'bg-rose-50 border-rose-300 text-rose-900';
                }
              }
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectFix(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all cursor-pointer space-y-1 ${cls}`}
                >
                  <div className="flex items-center justify-between gap-2 font-bold">
                    <span>{opt.label}</span>
                    {chosenFixIdx !== undefined && opt.isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    {chosenFixIdx !== undefined && isPicked && !opt.isCorrect && (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                  </div>
                  <div className="text-[11px] opacity-85 font-normal">{opt.detail}</div>
                </button>
              );
            })}
          </div>

          {(chosenFixIdx !== undefined || isSolved) && (
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700 space-y-2.5 text-xs">
              <div className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>โค้ดหลังแก้ไข (Fixed Code) &amp; คำอธิบาย</span>
              </div>
              <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                {challenge.fixedLinesPreview.join('\n')}
              </pre>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{challenge.explanation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
