import React, { useEffect, useState } from 'react';
import {
  Terminal,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  BookOpen,
  Lightbulb,
  GitBranch,
  Cloud,
  Bot,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AudioNarratorButton } from './AudioNarratorButton.tsx';
import { runPythonCode } from '../utils/pythonRunner.ts';
import {
  generateSocraticCodeHint,
  type SocraticHintResult,
} from '../utils/pythonSocraticHint.ts';
import { CloudStudioProjectModal } from './Module3CodingLab/CloudStudioProjectModal.tsx';

interface CodeTemplate {
  id: string;
  lang: 'python' | 'javascript';
  title: string;
  description: string;
  code: string;
  expectedOutput: string;
}

const TEMPLATES: CodeTemplate[] = [
  {
    id: 'py_mult',
    lang: 'python',
    title: 'Python: ตารางสูตรคูณด้วยลูป for',
    description: 'ฝึกใช้คำสั่ง for loop และ range() คำนวณสูตรคูณแม่ 2 ถึงแม่ 12',
    code: `# ตารางสูตรคูณหรรษาด้วย Python\nnumber = 5\nprint(f"=== เริ่มต้นสูตรคูณแม่ {number} ===")\nfor i in range(1, 13):\n    result = number * i\n    print(f"{number} x {i} = {result}")\nprint("ฝึกคิดเป็นขั้นตอนสำเร็จ!")`,
    expectedOutput: `=== เริ่มต้นสูตรคูณแม่ 5 ===\n5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45\n5 x 10 = 50\n5 x 11 = 55\n5 x 12 = 60\nฝึกคิดเป็นขั้นตอนสำเร็จ!`,
  },
  {
    id: 'py_grade',
    lang: 'python',
    title: 'Python: โปรแกรมตัดเกรดอัตโนมัติ (If-Elif-Else)',
    description: 'ตรวจสอบเงื่อนไขคะแนนตามเกณฑ์ สพฐ. เพื่อหาเกรด 4, 3, 2, 1',
    code: `# โปรแกรมคำนวณระดับผลการเรียน สพฐ.\nscore = 85\n\nif score >= 80:\n    grade = "4 (ดีเยี่ยม)"\nelif score >= 70:\n    grade = "3 (ดีมาก)"\nelif score >= 60:\n    grade = "2 (ผ่านเกณฑ์)"\nelse:\n    grade = "1 (ควรปรับปรุง)"\n\nprint(f"คะแนนที่ได้: {score} คะแนน")\nprint(f"ผลการประเมิน: เกรด {grade}")`,
    expectedOutput: `คะแนนที่ได้: 85 คะแนน\nผลการประเมิน: เกรด 4 (ดีเยี่ยม)`,
  },
  {
    id: 'js_microbit',
    lang: 'javascript',
    title: 'Micro:bit JS: เซ็นเซอร์ตรวจจับอุณหภูมิ',
    description: 'เขียน JavaScript ควบคุมบอร์ด Micro:bit แจ้งเตือนเมื่ออากาศร้อนเกิน 30°C',
    code: `// Micro:bit V2 JavaScript Simulation\nlet temp = input.temperature();\nbasic.showString("TEMP: " + temp + "C");\n\nif (temp > 30) {\n    basic.showIcon(IconNames.Sad);\n    music.playTone(440, music.beat(BeatFraction.Whole));\n    console.log("[Alert] อุณหภูมิสูงเกินเกณฑ์!");\n} else {\n    basic.showIcon(IconNames.Happy);\n    console.log("[Normal] สภาพอากาศปกติ รดน้ำต้นไม้สมบูรณ์");\n}`,
    expectedOutput: `[Micro:bit Booting...] V2.2 System Ready\nReading Temperature Sensor -> 32 C\n[Alert] อุณหภูมิสูงเกินเกณฑ์! หน้าจอแสดงไอคอน Sad :( \nส่งเสียง Buzzer แจ้งเตือนความถี่ 440 Hz สำเร็จ`,
  },
  {
    id: 'py_dice_game',
    lang: 'python',
    title: 'Python: เกมทอยลูกเต๋า & แต้มโบนัส',
    description: 'ใช้โมดูล random สุ่มแต้มลูกเต๋า 2 ลูกและตรวจสอบโบนัสเลขเบิ้ล',
    code: `import random\n\nd1 = 6\nd2 = 6\ntotal = d1 + d2\nprint(f"🎲 ลูกเต๋าที่ 1: {d1} | ลูกเต๋าที่ 2: {d2}")\nprint(f"แต้มรวมทั้งหมด = {total}")\nif d1 == d2:\n    print("✨ ว้าว! ออกเลขเบิ้ล รับโบนัสเดินเพิ่ม +10 ช่อง!")`,
    expectedOutput: `🎲 ลูกเต๋าที่ 1: 6 | ลูกเต๋าที่ 2: 6\nแต้มรวมทั้งหมด = 12\n✨ ว้าว! ออกเลขเบิ้ล รับโบนัสเดินเพิ่ม +10 ช่อง!`,
  },
  {
    id: 'py_list_sum',
    lang: 'python',
    title: 'Python: คำนวณราคารวมในตะกร้าด้วย List',
    description: 'ฝึกสร้างลิสต์ราคาสินค้าและใช้ลูป for หาผลรวมและราคาเฉลี่ย',
    code: `cart = [25, 40, 15, 60, 20]\ntotal = 0\nfor price in cart:\n    total += price\navg = total / len(cart)\nprint("จำนวนสินค้า:", len(cart), "ชิ้น")\nprint("ราคารวมทั้งหมด:", total, "บาท")\nprint("ราคาเฉลี่ยต่อชิ้น:", avg, "บาท")`,
    expectedOutput: `จำนวนสินค้า: 5 ชิ้น\nราคารวมทั้งหมด: 160 บาท\nราคาเฉลี่ยต่อชิ้น: 32 บาท`,
  },
  {
    id: 'py_binary_convert',
    lang: 'python',
    title: 'Python: ตัวแปลงเลขฐานสิบเป็นฐานสอง (Binary)',
    description: 'แปลงตัวเลขอายุหรือคะแนนสอบเป็นรหัสไบนารี 8 บิตด้วยฟังก์ชัน bin()',
    code: `decimal_num = 25\nbinary_str = bin(decimal_num)[2:].zfill(8)\nprint(f"เลขฐานสิบ: {decimal_num}")\nprint(f"รหัสเลขฐานสอง (8-bit): {binary_str}")`,
    expectedOutput: `เลขฐานสิบ: 25\nรหัสเลขฐานสอง (8-bit): 00011001`,
  },
  {
    id: 'js_step_counter',
    lang: 'javascript',
    title: 'Micro:bit JS: เครื่องนับก้าวเดินอัจฉริยะ',
    description: 'ใช้เซ็นเซอร์ตรวจจับแรงสั่น (onGesture Shake) นับจำนวนก้าวเดินออกกำลังกาย',
    code: `let steps = 0;\ninput.onGesture(Gesture.Shake, function () {\n    steps += 1;\n    basic.showNumber(steps);\n    if (steps % 10 == 0) {\n        music.playSoundEffect(SoundExpression.Happy);\n    }\n});`,
    expectedOutput: `[Accelerometer Active] ตรวจจับการเดิน...\nGesture: Shake -> Steps = 1\nGesture: Shake -> Steps = 2 ... 10!\n🎉 ถึงเป้า 10 ก้าวแล้ว เล่นเสียงฉลอง Happy!`,
  },
  {
    id: 'js_soil_pump',
    lang: 'javascript',
    title: 'Micro:bit JS: ระบบรดน้ำต้นไม้อัตโนมัติ',
    description: 'อ่านค่าความชื้นดินผ่าน Pin 0 แล้วสั่งเปิดรีเลย์ปั๊มน้ำที่ Pin 1 เมื่อดินแห้ง',
    code: `basic.forever(function () {\n    let soil = pins.analogReadPin(AnalogPin.P0);\n    if (soil < 400) {\n        pins.digitalWritePin(DigitalPin.P1, 1);\n        basic.showIcon(IconNames.Umbrella);\n    } else {\n        pins.digitalWritePin(DigitalPin.P1, 0);\n        basic.showIcon(IconNames.Yes);\n    }\n    basic.pause(2000);\n});`,
    expectedOutput: `[Pin 0 Soil Sensor] ค่าความชื้นที่อ่านได้ = 315 (ดินแห้ง)\n[Pin 1 Relay] สถานะ = ON (กำลังสูบน้ำรดต้นไม้ 5 วินาที...)\n💧 ดินชุ่มชื้นแล้ว ระบบสลับเข้าสู่โหมดเฝ้าระวัง`,
  },
];

interface JuniorCodePlaygroundProps {
  onAwardPoints?: (pts: number, options?: { uniqueKey?: string }) => void;
  initialCode?: string;
  initialTitle?: string;
  initialCodeKey?: number;
}

export const JuniorCodePlayground: React.FC<JuniorCodePlaygroundProps> = ({
  onAwardPoints,
  initialCode,
  initialTitle,
  initialCodeKey,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<CodeTemplate>(TEMPLATES[0]);
  const [isFlowchartHandoff, setIsFlowchartHandoff] = useState<boolean>(Boolean(initialCode));
  const [handoffTitle, setHandoffTitle] = useState<string>(initialTitle || 'โค้ดจากผังงาน Flowchart');
  const [userCode, setUserCode] = useState<string>(initialCode || TEMPLATES[0].code);
  const [terminalOutput, setTerminalOutput] = useState<string>(
    initialCode
      ? `🚀 นำเข้าโค้ด Python จาก "${initialTitle || 'บล็อกคำสั่ง'}" แล้ว! กด "รันโค้ด (Run Code)" เพื่อทดสอบจริงได้เลย`
      : 'พร้อมรันโค้ด คลิกปุ่ม "รันโค้ด (Run Code)" เพื่อดูผลลัพธ์...'
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [lastRunHadError, setLastRunHadError] = useState<boolean>(false);
  const [socraticHint, setSocraticHint] = useState<SocraticHintResult | null>(null);
  const [aiDeepHint, setAiDeepHint] = useState<string | null>(null);
  const [isAskingAiHint, setIsAskingAiHint] = useState<boolean>(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (initialCode && initialCode.trim()) {
      setIsFlowchartHandoff(true);
      setHandoffTitle(initialTitle || 'โค้ดจากบล็อกคำสั่ง');
      setUserCode(initialCode);
      setTerminalOutput(
        `🚀 นำเข้าโค้ด Python จาก "${initialTitle || 'บล็อกคำสั่ง'}" เรียบร้อยแล้ว!\nกดปุ่ม "รันโค้ด (Run Code)" เพื่อประมวลผลจริง...`
      );
    }
  }, [initialCode, initialTitle, initialCodeKey]);

  const activeLang: 'python' | 'javascript' = isFlowchartHandoff
    ? 'python'
    : selectedTemplate.lang;

  const handleSelectTemplate = (template: CodeTemplate) => {
    setIsFlowchartHandoff(false);
    setSelectedTemplate(template);
    setUserCode(template.code);
    setLastRunHadError(false);
    setSocraticHint(null);
    setAiDeepHint(null);
    setTerminalOutput(`โหลดแม่แบบ: ${template.title}\nพร้อมประมวลผล...`);
  };

  const handleResetCode = () => {
    setLastRunHadError(false);
    setSocraticHint(null);
    setAiDeepHint(null);
    if (isFlowchartHandoff && initialCode) {
      setUserCode(initialCode);
      setTerminalOutput('รีเซ็ตโค้ดกลับเป็นต้นฉบับจากผังงานแล้ว');
      return;
    }
    setUserCode(selectedTemplate.code);
    setTerminalOutput('รีเซ็ตโค้ดกลับสู่ค่าเริ่มต้นแล้ว');
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setSocraticHint(null);
    setAiDeepHint(null);
    setTerminalOutput('⏳ กำลังประมวลผลสคริปต์...');

    setTimeout(() => {
      setIsRunning(false);

      if (activeLang === 'python') {
        const res = runPythonCode(userCode);
        setLastRunHadError(!res.ok);
        setTerminalOutput(
          res.ok
            ? `${res.output}\n\n✅ [Python Sandbox สำเร็จ · ${res.stepsExecuted} ขั้นตอน]`
            : res.output
        );
        if (!res.ok) {
          setSocraticHint(generateSocraticCodeHint(userCode, res.output, 'python'));
        } else {
          confetti({
            particleCount: 55,
            spread: 55,
            origin: { y: 0.7 },
          });
          if (onAwardPoints) {
            const templateKey = isFlowchartHandoff ? 'flowchart_handoff' : selectedTemplate.id;
            onAwardPoints(10, { uniqueKey: `junior_playground_${templateKey}` });
          }
        }
        return;
      }

      // Micro:bit JavaScript simulation preview
      setLastRunHadError(false);
      setTerminalOutput(selectedTemplate.expectedOutput);
      confetti({
        particleCount: 55,
        spread: 55,
        origin: { y: 0.7 },
      });
      if (onAwardPoints) {
        onAwardPoints(10, { uniqueKey: `junior_playground_${selectedTemplate.id}` });
      }
    }, 280);
  };

  const handleRequestSocraticHint = () => {
    const hint = generateSocraticCodeHint(
      userCode,
      lastRunHadError ? terminalOutput : '',
      activeLang
    );
    setSocraticHint(hint);
    setAiDeepHint(null);
  };

  const handleAskAiTutorHint = async () => {
    setIsAskingAiHint(true);
    setAiDeepHint(null);
    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `ช่วยตรวจโค้ด ${activeLang} นี้แบบ Socratic Method (ตั้งคำถามชวนคิดและใบ้ทีละขั้น ไม่เฉลยโค้ดสำเร็จรูปทั้งหมด) สำหรับเด็ก ป.4-ป.6:\n\nโค้ด:\n${userCode.slice(0, 1200)}\n\nผลลัพธ์/Error:\n${terminalOutput.slice(0, 400)}`,
          studentContext: { activeModule: 'Junior Code Playground' },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.reply) {
          setAiDeepHint(String(data.reply));
        }
      }
    } catch {
      setAiDeepHint(
        'ครูพี่โค้ดแนะนำให้ลองตรวจสอบคำใบ้ทีละขั้นด้านบน และทดสอบแก้ทีละ 1 บรรทัดแล้วกดรันดูผลลัพธ์นะ!'
      );
    } finally {
      setIsAskingAiHint(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(userCode).catch(() => {});
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Playground Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-800/40 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-400/30">
              <Terminal className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/40 text-indigo-200 border border-indigo-400/30">
                  Junior Code Playground
                </span>
                <span className="text-xs text-slate-300">สะพานเชื่อมจาก Block สู่ Text-based Coding</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                ห้องทดลองเขียนโค้ดภาษา Python &amp; Micro:bit JavaScript
              </h2>
            </div>
          </div>
          <AudioNarratorButton
            textToRead="ยินดีต้อนรับสู่ห้องทดลองเขียนโค้ด Junior Code Playground สามารถแก้ไขตัวเลขหรือคำสั่ง Python แล้วกดรันเพื่อดูผลลัพธ์จริงได้ทันที"
            label="ฟังคำอธิบาย"
          />
        </div>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          ฝึกพิมพ์คำสั่งไวยากรณ์ (Syntax), ตัวแปร, เงื่อนไข <code className="text-amber-300">if/elif/else</code> และลูป <code className="text-sky-300">for/while</code> — ลองเปลี่ยนตัวเลขหรือข้อความในโค้ดแล้วกดรันเพื่อเห็นผลลัพธ์จริง!
        </p>
      </div>

      {isFlowchartHandoff && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900">
          <div className="flex items-center gap-2 font-bold">
            <GitBranch className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>ส่งต่อโค้ดอัตโนมัติ: {handoffTitle}</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold">
            แก้ไขค่าตัวแปรด้านล่างแล้วกด "รันโค้ด (Run Code)" ได้เลย
          </span>
        </div>
      )}

      {/* Template Selector Bar */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-3 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          <span>เลือกแม่แบบโปรแกรม:</span>
        </span>
        {TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => handleSelectTemplate(tmpl)}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              !isFlowchartHandoff && selectedTemplate.id === tmpl.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600'
            }`}
          >
            {tmpl.title}
          </button>
        ))}
      </div>

      {/* Editor & Terminal 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Code Editor */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800 text-slate-200 border border-slate-700">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <span className="text-xs font-mono font-bold text-slate-300 ml-2">
                main.{activeLang === 'python' ? 'py' : 'js'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsCloudModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="บันทึกหรือโหลดโค้ดจาก Cloud Firestore / ในเครื่อง"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>บันทึก / โหลด Cloud</span>
              </button>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-xs flex items-center gap-1 cursor-pointer"
                title="คัดลอกโค้ด"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'คัดลอกแล้ว' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={handleResetCode}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 text-xs flex items-center gap-1 cursor-pointer"
                title="รีเซ็ตโค้ด"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ต</span>
              </button>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner">
            <textarea
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              rows={14}
              spellCheck={false}
              className="w-full p-4 font-mono text-xs sm:text-sm bg-transparent text-emerald-400 focus:outline-none resize-none leading-relaxed selection:bg-indigo-700 selection:text-white"
            />
          </div>

          {/* Action Execution Button */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>พิมพ์แก้ไขตัวเลขหรือข้อความได้ตามใจชอบ แล้วกดปุ่มรันโค้ด</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRequestSocraticHint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-bold text-xs transition-all cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
                <span>ขอคำใบ้แก้โค้ด (Socratic Hint)</span>
              </button>
              <button
                type="button"
                onClick={handleRunCode}
                disabled={isRunning}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isRunning ? 'กำลังรัน...' : 'รันโค้ด (Run Code)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Terminal & Concept Card */}
        <div className="lg:col-span-5 space-y-4">
          {/* Terminal Console */}
          <div className="rounded-2xl border border-slate-800 bg-black text-slate-200 overflow-hidden shadow-xl flex flex-col h-[280px]">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Output Console / Terminal</span>
              </span>
              <span className="text-[10px] text-slate-500">
                {activeLang === 'python' ? 'Python 3 Sandbox' : 'Micro:bit JS Sim'}
              </span>
            </div>
            <div className="p-4 font-mono text-xs text-emerald-400 overflow-y-auto flex-1 whitespace-pre-wrap leading-relaxed">
              {terminalOutput}
            </div>
          </div>

          {/* Socratic Hint Panel */}
          {socraticHint && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-900 dark:text-amber-200">
                  <Bot className="w-4 h-4 text-amber-600" />
                  <span>ครูพี่โค้ดชวนคิด · {socraticHint.errorCategory}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSocraticHint(null)}
                  className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
                >
                  ซ่อน
                </button>
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {socraticHint.headline}
              </p>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-amber-200 dark:border-amber-900 text-xs text-amber-950 dark:text-amber-100 leading-relaxed">
                <strong>คำถามชวนคิด:</strong> {socraticHint.socraticQuestion}
              </div>
              <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 list-disc pl-4">
                {socraticHint.stepByStepHints.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
              {socraticHint.checkSnippet && (
                <code className="block px-3 py-1.5 rounded-lg bg-slate-900 text-emerald-300 font-mono text-[11px]">
                  {socraticHint.checkSnippet}
                </code>
              )}
              <div className="pt-1 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => void handleAskAiTutorHint()}
                  disabled={isAskingAiHint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-[11px] font-bold cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {isAskingAiHint
                      ? 'กำลังถามครูพี่โค้ด AI...'
                      : 'ให้ครูพี่โค้ด AI อธิบายเพิ่มทีละขั้น'}
                  </span>
                </button>
              </div>
              {aiDeepHint && (
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-100 whitespace-pre-wrap leading-relaxed">
                  {aiDeepHint}
                </div>
              )}
            </div>
          )}

          {/* Explanation & Learning Objectives */}
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2">
            <h4 className="text-xs sm:text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>ความรู้หลักการคิดเชิงคำนวณที่ใช้:</span>
            </h4>
            <p className="text-xs text-indigo-950/80 dark:text-indigo-300/90 leading-relaxed">
              {isFlowchartHandoff
                ? `ฝึกแปลง "${handoffTitle}" เป็นคำสั่ง Python 3 จริง พร้อมทดลองปรับค่าตัวแปรและตรวจสอบผลลัพธ์`
                : selectedTemplate.description}
            </p>
            <div className="pt-2 border-t border-indigo-200/60 dark:border-indigo-900/60 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>ผ่านเกณฑ์ตัวชี้วัด สพฐ. ด้านการเขียนโปรแกรม</span>
              </span>
              <span>+10 แต้ม EXP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Save & Load Python Project Modal */}
      <CloudStudioProjectModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        studioType="python"
        studioLabel="Junior Code Playground"
        defaultTitle={isFlowchartHandoff ? handoffTitle : selectedTemplate.title}
        currentPresetId={selectedTemplate.id}
        currentCodeContent={userCode}
        onLoadProject={(proj) => {
          setIsFlowchartHandoff(true);
          setHandoffTitle(proj.title);
          setUserCode(proj.codeContent);
          setLastRunHadError(false);
          setSocraticHint(null);
          setAiDeepHint(null);
          setTerminalOutput(`☁️ โหลดโค้ด "${proj.title}" เรียบร้อยแล้ว! กดปุ่ม "รันโค้ด (Run Code)" เพื่อทดสอบเลย`);
        }}
      />
    </div>
  );
};
