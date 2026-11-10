import React, { useState } from 'react';
import {
  X,
  Bug,
  Sparkles,
  Bot,
  Play,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Lightbulb,
  Check,
  Cpu,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEffects } from '../utils/soundEffects.ts';

interface BugCase {
  id: string;
  title: string;
  category: 'scratch' | 'microbit' | 'logic';
  categoryLabel: string;
  symptom: string;
  buggyCode: string;
  fixedCode: string;
  steps: {
    question: string;
    catSpeech: string;
    options: {
      text: string;
      isCorrect: boolean;
      hint: string;
    }[];
  }[];
  lesson: string;
}

const BUG_CASES: BugCase[] = [
  {
    id: 'bug_1',
    title: 'ตัวละครค้าง! วนซ้ำไม่มีวันสิ้นสุด (Infinite Loop)',
    category: 'scratch',
    categoryLabel: 'Scratch Studio',
    symptom: 'เมื่อกดธงเขียว โปรแกรมค้างและตัวละครไม่ขยับไปไหนเลย',
    buggyCode: `when green flag clicked
set [energy v] to [10]
repeat until <(energy) = [0]>
    move (5) steps
    // ลืมใส่คำสั่งลดพลังงาน!
end
say [ภารกิจสำเร็จ!]`,
    fixedCode: `when green flag clicked
set [energy v] to [10]
repeat until <(energy) = [0]>
    move (5) steps
    change [energy v] by (-1)  // ลดพลังงานทีละ 1
end
say [ภารกิจสำเร็จ!]`,
    steps: [
      {
        question: 'น้องแมวถาม: ในบล็อก `repeat until <energy = 0>` ค่า energy จะกลายเป็น 0 ได้อย่างไร?',
        catSpeech: 'เหมียว! ดูเงื่อนไขการหยุดสิ ถ้า energy เริ่มต้นที่ 10 แล้วในลูปไม่มีคำสั่งเปลี่ยนค่า energy เลย แล้วมันจะหยุดได้ยังไงนะ?',
        options: [
          { text: 'energy จะลดลงเองอัตโนมัติตามเวลา', isCorrect: false, hint: 'ตัวแปรในคอมพิวเตอร์จะไม่เปลี่ยนค่าเองถ้าเราไม่เขียนคำสั่งเปลี่ยนนะเหมียว!' },
          { text: 'ต้องมีคำสั่ง change [energy] by (-1) ในลูป', isCorrect: true, hint: 'ถูกต้อง! การลดค่าตัวแปรในแต่ละรอบจะทำให้เงื่อนไขหยุดเป็นจริงได้ในที่สุด' },
          { text: 'เปลี่ยนเป็น repeat until <energy = 10>', isCorrect: false, hint: 'ถ้าทำแบบนั้น ลูปจะหยุดทันทีตั้งแต่รอบแรกเลยนะเหมียว' },
        ],
      },
      {
        question: 'น้องแมวถาม: การทำงานแบบนี้ในทางคอมพิวเตอร์เรียกว่าอะไร?',
        catSpeech: 'สุดยอดเลย! แล้วรู้ไหมว่าเวลาลูปทำงานวนไม่รู้จบแบบนี้ ภาษาโปรแกรมเมอร์เขาเรียกกันว่าอะไรนะ?',
        options: [
          { text: 'Infinite Loop (ลูปไม่รู้จบ)', isCorrect: true, hint: 'ใช่เลย! เป็นบั๊กยอดฮิตที่ทำให้โปรแกรมค้าง' },
          { text: 'Syntax Error (ไวยากรณ์ผิด)', isCorrect: false, hint: 'ไวยากรณ์เขียนถูกแล้ว แต่ตรรกะเหตุผลไม่สมบูรณ์ต่างหากล่ะเหมียว' },
          { text: 'Hardware Freeze', isCorrect: false, hint: 'ปัญหานี้เกิดจากโค้ดของซอฟต์แวร์ ไม่ใช่บอร์ดเสียนะ' },
        ],
      },
    ],
    lesson: 'ทุกครั้งที่ใช้คำสั่งวนซ้ำแบบมีเงื่อนไข (repeat until หรือ while) ต้องแน่ใจว่ามีคำสั่งที่ทำให้ค่าตัวแปรเปลี่ยนไปจนเงื่อนไขกลายเป็นจริง',
  },
  {
    id: 'bug_2',
    title: 'ตัวแปรคะแนนพุ่งทะลุโลก! (Uninitialized Variable)',
    category: 'scratch',
    categoryLabel: 'Scratch Studio',
    symptom: 'เริ่มเกมใหม่ แต่ทำไมคะแนนยังค้างอยู่ที่ 500 คะแนนจากตาที่แล้ว?',
    buggyCode: `when green flag clicked
// ขาดคำสั่งกำหนดค่าเริ่มต้น (Init)
forever
    if <touching [coin v]?> then
        change [score v] by (1)
        wait (0.2) secs
    end
end`,
    fixedCode: `when green flag clicked
set [score v] to [0]  // รีเซ็ตคะแนนเป็น 0 ทุกครั้งที่เริ่มเกม
forever
    if <touching [coin v]?> then
        change [score v] by (1)
        wait (0.2) secs
    end
end`,
    steps: [
      {
        question: 'น้องแมวถาม: เมื่อผู้เล่นเริ่มเกมใหม่ ค่า score ควรเริ่มต้นด้วยค่าใด?',
        catSpeech: 'เหมียว! ปกติเวลาเราเล่นเกมใหม่ เราควรเริ่มนับคะแนนจากเท่าไหร่ดีนะ?',
        options: [
          { text: 'เริ่มจาก 0 เสมอ', isCorrect: true, hint: 'ถูกต้องเลย! ต้องตั้งค่าเริ่มต้นด้วยบล็อก `set [score] to [0]`' },
          { text: 'ปล่อยให้คอมพิวเตอร์สุ่มค่าขึ้นมา', isCorrect: false, hint: 'ถ้าสุ่มค่า ผู้เล่นแต่ละคนก็จะได้คะแนนไม่เท่ากันสิเหมียว' },
          { text: 'ไม่ต้องกำหนด ปล่อยให้จำค่าเดิม', isCorrect: false, hint: 'ถ้าจำค่าเดิม คะแนนก็จะสะสมข้ามตาไปเรื่อยๆ เกมก็ไม่ยุติธรรมนะ' },
        ],
      },
    ],
    lesson: 'การกำหนดค่าเริ่มต้นให้กับตัวแปร (Variable Initialization) เป็นกฎเหล็กในการเขียนโปรแกรม เพื่อให้การทำงานในแต่ละรอบมีจุดเริ่มต้นที่แน่นอน',
  },
  {
    id: 'bug_3',
    title: 'เซ็นเซอร์วัดแสง Micro:bit อ่านค่าไม่ออก',
    category: 'microbit',
    categoryLabel: 'Micro:bit V2',
    symptom: 'นำมือไปบังหน้าจอ แต่ไฟ LED ไม่ยอมติดตอนกลางคืน',
    buggyCode: `basic.forever(function () {
    let light = input.lightLevel()
    if (light > 200) {  // ผิดเงื่อนไข! 200 คือสว่างจัด
        basic.showIcon(IconNames.Heart)
    } else {
        basic.clearScreen()
    }
})`,
    fixedCode: `basic.forever(function () {
    let light = input.lightLevel()
    if (light < 50) {  // เมื่อมืด (ค่าน้อยกว่า 50) ให้เปิดไฟ
        basic.showIcon(IconNames.Heart)
    } else {
        basic.clearScreen()
    }
})`,
    steps: [
      {
        question: 'น้องแมวถาม: เซ็นเซอร์วัดแสงของ Micro:bit ค่าน้อยหมายถึงอะไร?',
        catSpeech: 'เหมียว! ค่า lightLevel อยู่ระหว่าง 0 ถึง 255 เมื่อเอามือบังให้มืด ตัวเลขจะสูงขึ้นหรือลดลงนะ?',
        options: [
          { text: 'ค่ายิ่งน้อย แสดงว่ายิ่งมืด (0 = มืดสนิท)', isCorrect: true, hint: 'เป๊ะเลย! ดังนั้นเงื่อนไขเปิดไฟตอนกลางคืนต้องใช้เครื่องหมายน้อยกว่า (< 50)' },
          { text: 'ค่ายิ่งน้อย แสดงว่ายิ่งสว่างจัด', isCorrect: false, hint: 'ตรงกันข้ามเลยเหมียว! 255 คือสว่างจ้าแดดจัดต่างหาก' },
        ],
      },
    ],
    lesson: 'ตรวจดูเครื่องหมายเปรียบเทียบ (> หรือ <) เสมอ โดยเฉพาะเมื่อทำงานกับเซ็นเซอร์วัดค่าสิ่งแวดล้อม',
  },
];

interface SmartSocraticDebuggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudentName: string;
  onRewardPoints?: (pts: number, reason: string) => void;
}

export const SmartSocraticDebuggerModal: React.FC<SmartSocraticDebuggerModalProps> = ({
  isOpen,
  onClose,
  currentStudentName,
  onRewardPoints,
}) => {
  const [activeBugId, setActiveBugId] = useState<string>('bug_1');
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [isFixed, setIsFixed] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentBug = BUG_CASES.find((b) => b.id === activeBugId) || BUG_CASES[0];
  const currentStep = currentBug.steps[currentStepIdx] || currentBug.steps[0];

  const handleSelectBug = (id: string) => {
    setActiveBugId(id);
    setCurrentStepIdx(0);
    setSelectedOptionIdx(null);
    setIsAnswerChecked(false);
    setIsFixed(false);
    setIsSimulating(false);
    soundEffects.play('click');
  };

  const handleSelectOption = (idx: number) => {
    setSelectedOptionIdx(idx);
    setIsAnswerChecked(true);

    const opt = currentStep.options[idx];
    if (opt.isCorrect) {
      soundEffects.play('correct');
      if (currentStepIdx + 1 < currentBug.steps.length) {
        setTimeout(() => {
          setCurrentStepIdx((prev) => prev + 1);
          setSelectedOptionIdx(null);
          setIsAnswerChecked(false);
        }, 1200);
      } else {
        setIsFixed(true);
        confetti({ particleCount: 40, spread: 50 });
        if (onRewardPoints) {
          onRewardPoints(15, `แก้บั๊ก "${currentBug.title}" ด้วยวิธีคิดแบบโสเครติส`);
        }
      }
    } else {
      soundEffects.play('error');
    }
  };

  const handleSimulateRun = () => {
    setIsSimulating(true);
    soundEffects.play('victory');
    setTimeout(() => {
      setIsSimulating(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg text-2xl">
              🐱
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Socratic Code Debugger 🐾
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  น้องแมวช่วยจับบั๊ก
                </span>
              </div>
              <p className="text-xs text-slate-400">
                เรียนรู้วิธีสืบสวนหาต้นตอข้อผิดพลาดของโค้ดด้วยคำถามชวนคิด ไม่ใช่แค่บอกเฉลย
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bug Case Selector Tabs */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
          {BUG_CASES.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => handleSelectBug(b.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeBugId === b.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white'
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              <span>{b.title.split(' ')[0]} {b.title.split(' ')[1]}</span>
            </button>
          ))}
        </div>

        {/* Main Workspace */}
        <div className="p-4 sm:p-6 flex-1 space-y-6">
          {/* Symptom Card */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-rose-400">
                อาการของโปรแกรม (Symptom):
              </div>
              <p className="text-xs sm:text-sm text-slate-200 mt-0.5 font-medium">
                {currentBug.symptom}
              </p>
            </div>
          </div>

          {/* Code Viewer (Side-by-side or Buggy View) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Buggy Code */}
            <div className="rounded-2xl bg-slate-950 border border-rose-900/40 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-rose-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>โค้ดที่มีบั๊ก (Buggy Code)</span>
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-950/60">
                  {currentBug.categoryLabel}
                </span>
              </div>
              <pre className="font-mono text-xs text-rose-200/90 whitespace-pre-wrap leading-relaxed bg-black/30 p-3 rounded-xl border border-rose-950/50">
                {currentBug.buggyCode}
              </pre>
            </div>

            {/* Fixed Code (Unlocked after Socratic solved) */}
            <div className="rounded-2xl bg-slate-950 border border-emerald-900/40 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>โค้ดที่แก้ไขถูกต้อง (Fixed Code)</span>
                </span>
                {isFixed && (
                  <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded">
                    ปลดล็อกแล้ว ✓
                  </span>
                )}
              </div>

              {isFixed ? (
                <div className="space-y-3">
                  <pre className="font-mono text-xs text-emerald-300 whitespace-pre-wrap leading-relaxed bg-black/30 p-3 rounded-xl border border-emerald-950/50 animate-fadeIn">
                    {currentBug.fixedCode}
                  </pre>
                  <button
                    type="button"
                    onClick={handleSimulateRun}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>{isSimulating ? '🐱 กำลังรันโปรแกรมอย่างราบรื่น...' : 'รันโค้ดที่แก้ไขแล้ว! (Test Fixed Code)'}</span>
                  </button>
                </div>
              ) : (
                <div className="h-44 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center p-4 text-slate-500 text-xs">
                  <Bot className="w-8 h-8 mb-2 opacity-50 text-purple-400" />
                  <span>ตอบคำถามชวนคิดของน้องแมวให้ครบเพื่อปลดล็อกโค้ดที่ถูกต้อง</span>
                </div>
              )}
            </div>
          </div>

          {/* Socratic Cat Dialogue & Options */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-950/80 border border-purple-900/40 space-y-4 shadow-inner">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-2xl shrink-0 shadow-lg">
                🐱
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  น้องแมวโค้ดเดอร์ชวนคิด (Socratic Step {currentStepIdx + 1}/{currentBug.steps.length})
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  "{currentStep.catSpeech}"
                </p>
              </div>
            </div>

            {/* Question title */}
            <div className="text-xs font-bold text-purple-300 pl-1">
              ❓ {currentStep.question}
            </div>

            {/* Answer Options */}
            <div className="space-y-2">
              {currentStep.options.map((opt, idx) => {
                const isSelected = selectedOptionIdx === idx;
                let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800';

                if (isAnswerChecked && isSelected) {
                  btnStyle = opt.isCorrect
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/30'
                    : 'bg-rose-950/60 border-rose-500 text-rose-200';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswerChecked && isSelected && opt.isCorrect}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-3.5 rounded-2xl border text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center justify-between gap-3 ${btnStyle}`}
                  >
                    <span>{opt.text}</span>
                    {isAnswerChecked && isSelected && (
                      opt.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <span className="text-[11px] text-rose-400 font-bold shrink-0">ลองใหม่นะ</span>
                      )
                    )}
                  </button>
                );
              })}
            </div>

            {/* Feedback Message */}
            {isAnswerChecked && selectedOptionIdx !== null && (
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-200 leading-relaxed animate-fadeIn">
                💡 <strong>คำแนะนำจากน้องแมว:</strong> {currentStep.options[selectedOptionIdx].hint}
              </div>
            )}

            {/* Lesson Takeaway */}
            {isFixed && (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 space-y-1 animate-fadeIn">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>บทเรียนที่ได้จากบั๊กนี้:</span>
                </div>
                <p className="text-slate-300 leading-relaxed pl-5">
                  {currentBug.lesson}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
