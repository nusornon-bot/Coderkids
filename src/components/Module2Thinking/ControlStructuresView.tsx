import React, { useState } from 'react';
import { ArrowDown, Repeat, BookOpen, GitBranch, Lightbulb, RotateCcw, CheckCircle2 } from 'lucide-react';

type SeqExampleId = 'default' | 'sprout' | 'scratch_story' | 'microbit_badge';
type SelExampleId = 'default' | 'traffic' | 'scratch_game' | 'microbit_temp';
type LoopExampleId = 'default' | 'repeat_n' | 'forever' | 'repeat_until';

interface SeqCodeBlock {
  text: string;
  colorClass: string;
}

interface SeqExampleData {
  id: SeqExampleId;
  blockTitle: string;
  flowTitle: string;
  blocks: SeqCodeBlock[];
  flowSteps: string[];
}

const SEQUENCE_EXAMPLES: Record<SeqExampleId, SeqExampleData> = {
  default: {
    id: 'default',
    blockTitle: 'บล็อกคำสั่งแบบลำดับใน Scratch',
    flowTitle: 'ภาพผังงาน Flowchart แบบลำดับ (เดินตรงจากบนลงล่าง)',
    blocks: [
      { text: 'move (10) steps', colorClass: 'bg-blue-500' },
      { text: 'say [สวัสดีครับ!] for (2) secs', colorClass: 'bg-purple-500' },
      { text: 'turn right (90) degrees', colorClass: 'bg-blue-500' },
    ],
    flowSteps: [
      '1. ตื่นนอนและเก็บที่นอน',
      '2. อาบน้ำ แปรงฟัน แต่งตัว',
      '3. รับประทานอาหารเช้า',
      '4. เดินทางไปโรงเรียน',
    ],
  },
  sprout: {
    id: 'sprout',
    blockTitle: 'ลำดับคำสั่ง: การปลูกถั่วงอกในแก้ว (ป.4)',
    flowTitle: 'ภาพผังงาน Flowchart: การปลูกถั่วงอกในแก้ว',
    blocks: [
      { text: '1. เตรียมแก้ว + รองทิชชูเปียกก้นแก้ว', colorClass: 'bg-sky-600' },
      { text: '2. วางเมล็ดถั่วเขียวลงบนทิชชู', colorClass: 'bg-emerald-600' },
      { text: '3. พรมน้ำให้ชุ่มทุกเช้า - เย็น', colorClass: 'bg-blue-500' },
      { text: '4. สังเกตและบันทึกการงอก', colorClass: 'bg-indigo-600' },
    ],
    flowSteps: [
      '1. รองทิชชูเปียกก้นแก้ว',
      '2. วางเมล็ดถั่วเขียวให้กระจาย',
      '3. พรมน้ำเช้า-เย็นสม่ำเสมอ',
      '4. สังเกตการงอกของต้นถั่วงอก',
    ],
  },
  scratch_story: {
    id: 'scratch_story',
    blockTitle: 'บล็อกคำสั่ง Scratch: นิทานแอนิเมชันสั้น 1 ฉาก (ป.5)',
    flowTitle: 'ภาพผังงาน Flowchart: นิทานแอนิเมชันสั้น 1 ฉาก',
    blocks: [
      { text: 'switch backdrop to [Garden v]', colorClass: 'bg-purple-500' },
      { text: 'glide (1) secs to x: (0) y: (0)', colorClass: 'bg-blue-500' },
      { text: 'say [สวัสดีเพื่อนๆ!] for (2) secs', colorClass: 'bg-purple-600' },
      { text: 'start sound [Meow v]', colorClass: 'bg-fuchsia-500' },
    ],
    flowSteps: [
      '1. เปลี่ยนฉากพื้นหลังเป็นสวน',
      '2. แมวเดินไปที่จุดกลางจอ',
      '3. พูดทักทายนาน 2 วินาที',
      '4. เล่นเสียงร้องเหมียว',
    ],
  },
  microbit_badge: {
    id: 'microbit_badge',
    blockTitle: 'บล็อกคำสั่ง Micro:bit: ป้ายชื่อดิจิทัลทักทาย (ป.6)',
    flowTitle: 'ภาพผังงาน Flowchart: ป้ายชื่อดิจิทัล Micro:bit',
    blocks: [
      { text: 'on start', colorClass: 'bg-teal-600' },
      { text: 'show string "HELLO"', colorClass: 'bg-blue-500' },
      { text: 'show icon (Heart)', colorClass: 'bg-indigo-500' },
      { text: 'play melody (Power Up)', colorClass: 'bg-purple-600' },
    ],
    flowSteps: [
      '1. เริ่มต้นเปิดเครื่อง Micro:bit',
      '2. แสดงข้อความ "HELLO" บนจอ LED',
      '3. แสดงไอคอนรูปหัวใจ ♥',
      '4. เล่นทำนองเพลง Power Up',
    ],
  },
};

export const ControlStructuresView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sequence' | 'selection' | 'loop'>('sequence');

  // Active example per tab
  const [selectedSeqExample, setSelectedSeqExample] = useState<SeqExampleId>('default');
  const [selectedSelExample, setSelectedSelExample] = useState<SelExampleId>('default');
  const [selectedLoopExample, setSelectedLoopExample] = useState<LoopExampleId>('default');

  // Interactive testers
  const [testScore, setTestScore] = useState<number>(65);
  const [trafficLight, setTrafficLight] = useState<'green' | 'red'>('green');
  const [touchingSpike, setTouchingSpike] = useState<boolean>(false);
  const [roomTemp, setRoomTemp] = useState<number>(34);
  const [repeatCount, setRepeatCount] = useState<number>(4);
  const [reachedFlag, setReachedFlag] = useState<boolean>(false);

  const activeSeq = SEQUENCE_EXAMPLES[selectedSeqExample];

  // Computed Selection view data based on selectedSelExample & interactive testers
  const selectionView = (() => {
    if (selectedSelExample === 'traffic') {
      const isTrue = trafficLight === 'green';
      return {
        blockTitle: 'บล็อกคำสั่ง If-Else: สัญญาณไฟจราจรข้ามถนน (ป.4)',
        flowTitle: 'ผังงาน Flowchart: สัญญาณไฟจราจรข้ามถนน',
        inputText: isTrue ? 'รับค่า ไฟคนข้าม = สีเขียว 🟢' : 'รับค่า ไฟคนข้าม = สีแดง 🔴',
        conditionCode: 'if <ไฟคนข้าม = สีเขียว> then',
        conditionDiamond: '◇ ไฟคนข้าม = สีเขียว หรือไม่?',
        trueCode: 'เดินข้ามทางม้าลายอย่างปลอดภัย',
        falseCode: 'หยุดรออยู่บนริมฟุตบาท',
        trueFlowText: 'เดินข้ามทางม้าลายได้ 🚶',
        falseFlowText: 'หยุดรอริมฟุตบาท 🛑',
        isTrue,
      };
    }
    if (selectedSelExample === 'scratch_game') {
      const isTrue = touchingSpike;
      return {
        blockTitle: 'บล็อกคำสั่ง Scratch If-Else: ตรวจจับชนสิ่งกีดขวาง (ป.5)',
        flowTitle: 'ผังงาน Flowchart: เกมตรวจจับชนสิ่งกีดขวาง',
        inputText: isTrue ? 'สถานะตัวละคร = ชนหนาม! 💥' : 'สถานะตัวละคร = ทางโล่ง ⭐',
        conditionCode: 'if <touching [หนาม]?> then',
        conditionDiamond: '◇ ตัวละครชนหนามหรือไม่?',
        trueCode: 'change [หัวใจ] by (-1) + play sound [โอ๊ย]',
        falseCode: 'move (10) steps + เก็บดาว (+1 คะแนน)',
        trueFlowText: 'ลดหัวใจ -1 และส่งเสียงร้อง 💔',
        falseFlowText: 'เดินหน้าเก็บดาวต่อ ⭐',
        isTrue,
      };
    }
    if (selectedSelExample === 'microbit_temp') {
      const isTrue = roomTemp > 32;
      return {
        blockTitle: 'บล็อกคำสั่ง Micro:bit If-Else: เตือนอากาศร้อนจัด (ป.6)',
        flowTitle: 'ผังงาน Flowchart: ระบบเตือนอากาศร้อน Micro:bit',
        inputText: `รับค่า อุณหภูมิ = ${roomTemp}°C`,
        conditionCode: 'if <temperature > 32> then',
        conditionDiamond: '◇ อุณหภูมิ > 32°C หรือไม่?',
        trueCode: 'show icon (พัดลม) + play tone [เตือน]',
        falseCode: 'show icon (หน้ายิ้ม 😊)',
        trueFlowText: 'แสดงรูปพัดลม + ส่งเสียงเตือน 🌬️',
        falseFlowText: 'แสดงหน้ายิ้ม (อากาศปกติ) 😊',
        isTrue,
      };
    }
    const isTrue = testScore >= 50;
    return {
      blockTitle: 'บล็อกคำสั่งเงื่อนไข If-Else',
      flowTitle: 'ผังงาน Flowchart แบบทางเลือก (แยกซ้าย-ขวาตามเงื่อนไข)',
      inputText: `รับค่า คะแนน = ${testScore}`,
      conditionCode: 'if <score >= 50> then',
      conditionDiamond: '◇ คะแนน >= 50 หรือไม่?',
      trueCode: 'show string "PASS"',
      falseCode: 'show string "RETRY"',
      trueFlowText: 'แสดง "PASS" 🎉',
      falseFlowText: 'แสดง "RETRY" 💪',
      isTrue,
    };
  })();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
      <div className="mb-6 pb-4 border-b border-slate-100">
        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          โครงสร้างการทำงาน + เปรียบเทียบ Flowchart
        </span>
        <h3 className="text-xl font-bold text-slate-900 mt-0.5">
          3 โครงสร้างควบคุมหลักในการเขียนโปรแกรม (Control Structures)
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          เรียนรู้ทั้งลำดับขั้นตอน, การตัดสินใจ (If-Else) และการใช้ Loop วนซ้ำ พร้อมดูผังงาน Flowchart คู่กับบล็อก Scratch สำหรับ ป.4–ป.6
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-xl mb-6 max-w-xl">
        <button
          onClick={() => setActiveTab('sequence')}
          className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'sequence' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          1. ลำดับ (Sequence)
        </button>
        <button
          onClick={() => setActiveTab('selection')}
          className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'selection' ? 'bg-white text-amber-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          2. ทางเลือก (Selection)
        </button>
        <button
          onClick={() => setActiveTab('loop')}
          className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'loop' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          3. การวนซ้ำ (Iteration / Loop)
        </button>
      </div>

      {/* 1. SEQUENCE */}
      {activeTab === 'sequence' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
                  1
                </span>
                <span>โครงสร้างแบบลำดับ (Sequence Structure)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                คือการเขียนคำสั่งให้ทำงาน <strong>เรียงต่อกันเป็นเส้นตรงจากบนลงล่าง</strong> ทีละขั้นตอนอย่างต่อเนื่อง ไม่มีการกระโดดข้ามหรือย้อนกลับ เหมาะกับงานที่ทำตามลำดับ 1 → 2 → 3 → จบ
              </p>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>สังเกตง่ายๆ: ถ้าสลับลำดับ ผลลัพธ์อาจผิดทันที!</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  เช่น <strong>ใส่ถุงเท้า → ใส่รองเท้า</strong> ทำได้ปกติ แต่ถ้าสลับเป็น <strong>ใส่รองเท้า → ใส่ถุงเท้า</strong> จะใส่ไม่ได้! ในโค้ดดิ้งก็เช่นเดียวกัน ต้องวางลำดับคำสั่งให้ถูกต้อง
                </p>
              </div>

              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2 transition-all">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-xs font-bold text-indigo-900">{activeSeq.blockTitle}</div>
                  {selectedSeqExample !== 'default' && (
                    <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold shrink-0">
                      อัปเดตตามตัวอย่าง
                    </span>
                  )}
                </div>
                {activeSeq.blocks.map((block, idx) => (
                  <React.Fragment key={idx}>
                    <div
                      className={`p-2.5 ${block.colorClass} text-white text-xs font-mono font-medium rounded-md shadow-sm`}
                    >
                      {block.text}
                    </div>
                    {idx < activeSeq.blocks.length - 1 && (
                      <div className="flex justify-center text-slate-400">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Right: Visual Flowchart Diagram for Sequence */}
            <div className="lg:col-span-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col items-center">
              <div className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5 text-center">
                <GitBranch className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{activeSeq.flowTitle}</span>
              </div>
              <div className="w-full max-w-xs flex flex-col items-center space-y-1">
                <div className="px-6 py-2 rounded-full bg-rose-100 border-2 border-rose-400 text-rose-900 text-xs font-bold">
                  เริ่มต้น (Start)
                </div>
                {activeSeq.flowSteps.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <ArrowDown className="w-4 h-4 text-slate-500" />
                    <div className="w-full py-2 px-4 rounded-lg bg-white border-2 border-indigo-400 text-slate-800 text-xs font-semibold text-center shadow-xs">
                      {step}
                    </div>
                  </React.Fragment>
                ))}
                <ArrowDown className="w-4 h-4 text-slate-500" />
                <div className="px-6 py-2 rounded-full bg-rose-100 border-2 border-rose-400 text-rose-900 text-xs font-bold">
                  จบการทำงาน (End)
                </div>
              </div>
            </div>
          </div>

          {/* Grade-level examples for Sequence (Clickable) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>ตัวอย่างโครงสร้างแบบลำดับเพิ่มเติม (ป.4 – ป.6) — คลิกที่การ์ดเพื่อเปลี่ยนบล็อกคำสั่งและผังงาน</span>
              </div>
              {selectedSeqExample !== 'default' && (
                <button
                  type="button"
                  onClick={() => setSelectedSeqExample('default')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-bold cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>กลับตัวอย่างเริ่มต้น</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  id: 'sprout' as SeqExampleId,
                  badge: 'ป.4 · ชีวิตประจำวัน',
                  badgeClass: 'bg-sky-100 text-sky-700',
                  title: 'การปลูกถั่วงอกในแก้ว',
                  desc: '1) รองทิชชูเปียกก้นแก้ว → 2) วางเมล็ดถั่วเขียว → 3) พรมน้ำเช้า-เย็น → 4) สังเกตการงอก',
                },
                {
                  id: 'scratch_story' as SeqExampleId,
                  badge: 'ป.5 · Scratch',
                  badgeClass: 'bg-amber-100 text-amber-800',
                  title: 'นิทานแอนิเมชันสั้น 1 ฉาก',
                  desc: '1) เปลี่ยนฉากเป็นสวน → 2) แมวเดินไปกลางจอ → 3) พูดทักทาย 2 วินาที → 4) เล่นเสียงร้องเหมียว',
                },
                {
                  id: 'microbit_badge' as SeqExampleId,
                  badge: 'ป.6 · Micro:bit',
                  badgeClass: 'bg-emerald-100 text-emerald-700',
                  title: 'ป้ายชื่อดิจิทัลทักทาย',
                  desc: 'on start → show string "HELLO" → show icon (Heart) → play melody (Power Up)',
                },
              ].map((card) => {
                const isSelected = selectedSeqExample === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedSeqExample(isSelected ? 'default' : card.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-200 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${card.badgeClass}`}>
                          {card.badge}
                        </span>
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>กำลังแสดงผล</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-indigo-600">คลิกดูผังงาน →</span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-1.5">{card.title}</div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{card.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. SELECTION */}
      {activeTab === 'selection' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center text-xs">
                  2
                </span>
                <span>โครงสร้างแบบทางเลือก (Selection / If-Else)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                คือการให้โปรแกรม <strong>ตรวจสอบเงื่อนไข (Decision ◇)</strong> ก่อนตัดสินใจทำงาน ถ้าเงื่อนไขเป็น <strong>จริง (True / ใช่)</strong> จะทำชุดคำสั่งฝั่งหนึ่ง แต่ถ้าเป็น <strong>เท็จ (False / ไม่ใช่)</strong> จะไปทำอีกชุดคำสั่งหนึ่ง
              </p>

              {/* Interactive Tester adapted to active selection example */}
              {selectedSelExample === 'default' && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span>🎮 ทดลองปรับค่าคะแนนเพื่อดูทางเลือกทำงาน:</span>
                    <span className="px-2 py-0.5 rounded bg-white border border-amber-300 text-slate-900">
                      score = {testScore}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={testScore}
                    onChange={(e) => setTestScore(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <div className="text-xs font-semibold text-slate-800">
                    ผลการตรวจเงื่อนไข (score &gt;= 50):{' '}
                    {testScore >= 50 ? (
                      <span className="text-emerald-700 font-bold">✅ จริง (True) → แสดง &quot;PASS 🎉&quot;</span>
                    ) : (
                      <span className="text-rose-700 font-bold">❌ เท็จ (False) → แสดง &quot;RETRY 💪&quot;</span>
                    )}
                  </div>
                </div>
              )}

              {selectedSelExample === 'traffic' && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-amber-900 flex-wrap">
                    <span>🚦 ทดลองสลับสัญญาณไฟคนข้าม:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTrafficLight('green')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          trafficLight === 'green'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white border border-amber-300 text-slate-700'
                        }`}
                      >
                        🟢 ไฟสีเขียว
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrafficLight('red')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          trafficLight === 'red'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white border border-amber-300 text-slate-700'
                        }`}
                      >
                        🔴 ไฟสีแดง
                      </button>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    ผลการตรวจเงื่อนไข: {selectionView.isTrue ? '✅ จริง (True) → เดินข้ามทางม้าลายได้' : '❌ เท็จ (False) → หยุดรอริมฟุตบาท'}
                  </div>
                </div>
              )}

              {selectedSelExample === 'scratch_game' && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-amber-900 flex-wrap">
                    <span>🎮 ทดลองสถานะตัวละครในเกม Scratch:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTouchingSpike(false)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          !touchingSpike
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white border border-amber-300 text-slate-700'
                        }`}
                      >
                        ⭐ ทางโล่ง
                      </button>
                      <button
                        type="button"
                        onClick={() => setTouchingSpike(true)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          touchingSpike
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white border border-amber-300 text-slate-700'
                        }`}
                      >
                        💥 ชนหนาม
                      </button>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    ผลการตรวจเงื่อนไข: {selectionView.isTrue ? '✅ ชนหนาม (True) → ลดหัวใจ -1' : '❌ ไม่ชน (False) → เดินเก็บดาวต่อ'}
                  </div>
                </div>
              )}

              {selectedSelExample === 'microbit_temp' && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span>🌡️ ทดลองปรับอุณหภูมิห้องเรียน:</span>
                    <span className="px-2 py-0.5 rounded bg-white border border-amber-300 text-slate-900">
                      temperature = {roomTemp}°C
                    </span>
                  </div>
                  <input
                    type="range"
                    min={22}
                    max={40}
                    value={roomTemp}
                    onChange={(e) => setRoomTemp(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <div className="text-xs font-semibold text-slate-800">
                    ผลการตรวจเงื่อนไข (temperature &gt; 32):{' '}
                    {selectionView.isTrue ? (
                      <span className="text-emerald-700 font-bold">✅ จริง (True) → แสดงพัดลม + เตือน!</span>
                    ) : (
                      <span className="text-rose-700 font-bold">❌ เท็จ (False) → แสดงหน้ายิ้ม 😊</span>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-1.5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-xs font-bold text-amber-900">{selectionView.blockTitle}</div>
                  {selectedSelExample !== 'default' && (
                    <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-[10px] font-bold shrink-0">
                      อัปเดตตามตัวอย่าง
                    </span>
                  )}
                </div>
                <div className="p-2.5 bg-amber-500 text-white text-xs font-mono font-medium rounded-t-md shadow-sm">
                  <span>{selectionView.conditionCode}</span>
                </div>
                <div
                  className={`p-2.5 text-white text-xs font-mono font-medium ml-4 border-l-2 border-white shadow-sm transition-opacity ${
                    selectionView.isTrue ? 'bg-emerald-600 ring-2 ring-emerald-300' : 'bg-emerald-600/40'
                  }`}
                >
                  {selectionView.trueCode}
                </div>
                <div className="p-2 bg-amber-500 text-white text-xs font-mono font-medium shadow-sm">else</div>
                <div
                  className={`p-2.5 text-white text-xs font-mono font-medium ml-4 border-l-2 border-white rounded-b-md shadow-sm transition-opacity ${
                    !selectionView.isTrue ? 'bg-rose-600 ring-2 ring-rose-300' : 'bg-rose-600/40'
                  }`}
                >
                  {selectionView.falseCode}
                </div>
              </div>
            </div>

            {/* Right: Visual Branching Flowchart for Selection */}
            <div className="lg:col-span-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col items-center">
              <div className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5 text-center">
                <GitBranch className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{selectionView.flowTitle}</span>
              </div>

              <div className="w-full max-w-sm flex flex-col items-center space-y-2">
                <div className="px-6 py-1.5 rounded-full bg-rose-100 border-2 border-rose-400 text-rose-900 text-xs font-bold">
                  เริ่มต้น (Start)
                </div>
                <ArrowDown className="w-4 h-4 text-slate-500" />
                <div className="px-5 py-2 rounded-lg -skew-x-6 bg-sky-100 border-2 border-sky-400 text-sky-900 text-xs font-bold">
                  <span className="inline-block skew-x-6">{selectionView.inputText}</span>
                </div>
                <ArrowDown className="w-4 h-4 text-slate-500" />

                {/* Decision Diamond */}
                <div className="px-5 py-3 rounded-2xl border-2 border-dashed border-amber-500 bg-amber-100 text-amber-950 text-xs font-bold text-center">
                  {selectionView.conditionDiamond}
                </div>

                {/* Two Branches */}
                <div className="grid grid-cols-2 gap-3 w-full pt-2">
                  <div
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      selectionView.isTrue
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-900 shadow-md scale-[1.02]'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase mb-1">✅ ถ้า ใช่ (True)</div>
                    <div className="text-xs font-bold">{selectionView.trueFlowText}</div>
                  </div>
                  <div
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      !selectionView.isTrue
                        ? 'bg-rose-100 border-rose-500 text-rose-900 shadow-md scale-[1.02]'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase mb-1">❌ ถ้า ไม่ใช่ (False)</div>
                    <div className="text-xs font-bold">{selectionView.falseFlowText}</div>
                  </div>
                </div>

                <ArrowDown className="w-4 h-4 text-slate-500 pt-1" />
                <div className="px-6 py-1.5 rounded-full bg-rose-100 border-2 border-rose-400 text-rose-900 text-xs font-bold">
                  จบการทำงาน (End)
                </div>
              </div>
            </div>
          </div>

          {/* Grade-level examples for Selection (Clickable) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>ตัวอย่างโครงสร้างแบบทางเลือกเพิ่มเติม (ป.4 – ป.6) — คลิกที่การ์ดเพื่อเปลี่ยนบล็อกคำสั่งและผังงาน</span>
              </div>
              {selectedSelExample !== 'default' && (
                <button
                  type="button"
                  onClick={() => setSelectedSelExample('default')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-bold cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>กลับตัวอย่างตรวจคะแนน</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  id: 'traffic' as SelExampleId,
                  badge: 'ป.4 · ความปลอดภัย',
                  badgeClass: 'bg-sky-100 text-sky-700',
                  title: 'สัญญาณไฟจราจรข้ามถนน',
                  desc: 'ถ้า ไฟคนข้าม = สีเขียว → เดินข้ามทางม้าลายได้, มิฉะนั้น → หยุดรอริมฟุตบาท',
                },
                {
                  id: 'scratch_game' as SelExampleId,
                  badge: 'ป.5 · เกม Scratch',
                  badgeClass: 'bg-amber-100 text-amber-800',
                  title: 'การตรวจจับชนสิ่งกีดขวาง',
                  desc: 'ถ้า <touching [หนาม]?> → ลดหัวใจ -1 และส่งเสียงร้อง, มิฉะนั้น → เดินเก็บดาวต่อ',
                },
                {
                  id: 'microbit_temp' as SelExampleId,
                  badge: 'ป.6 · Micro:bit',
                  badgeClass: 'bg-emerald-100 text-emerald-700',
                  title: 'เตือนอากาศร้อนจัดในห้องเรียน',
                  desc: 'ถ้า temperature > 32°C → แสดงรูปพัดลม + ส่งเสียงเตือน, มิฉะนั้น → แสดงหน้ายิ้ม',
                },
              ].map((card) => {
                const isSelected = selectedSelExample === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedSelExample(isSelected ? 'default' : card.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-200 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${card.badgeClass}`}>
                          {card.badge}
                        </span>
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>กำลังแสดงผล</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-700">คลิกดูผังงาน →</span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-1.5">{card.title}</div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{card.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. LOOP */}
      {activeTab === 'loop' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                  3
                </span>
                <span>โครงสร้างแบบวนซ้ำ (Iteration / Loops)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                คือการสั่งให้คอมพิวเตอร์ <strong>ทำงานชุดเดิมซ้ำๆ อัตโนมัติ</strong> เช่น ทำซ้ำตามจำนวนรอบ (<code>repeat 4</code>), ทำซ้ำตลอดเวลา (<code>forever</code>) หรือทำซ้ำจนกว่าเงื่อนไขจะเป็นจริง (<code>repeat until</code>) ช่วยให้โค้ดสั้นลงและไม่เหนื่อยพิมพ์ซ้ำ!
              </p>

              {/* Interactive tester adapted to selected loop example */}
              {(selectedLoopExample === 'default' || selectedLoopExample === 'repeat_n') && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span>🔁 ทดลองเลือกจำนวนรอบทำซ้ำ (Repeat N):</span>
                    <div className="flex items-center gap-1.5">
                      {[3, 4, 5, 6].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRepeatCount(n)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer ${
                            repeatCount === n
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white border border-emerald-300 text-emerald-800'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  {selectedLoopExample === 'default' ? (
                    <div className="text-xs text-emerald-800">
                      ถ้าสั่ง <code>repeat ({repeatCount}) [เดิน 100 ก้าว + หมุน {Math.round(360 / repeatCount)}°]</code> จะได้รูป{' '}
                      <strong>
                        {repeatCount === 3 && 'สามเหลี่ยมด้านเท่า 🔺'}
                        {repeatCount === 4 && 'สี่เหลี่ยมจัตุรัส 🟦'}
                        {repeatCount === 5 && 'ห้าเหลี่ยมด้านเท่า ⬟'}
                        {repeatCount === 6 && 'หกเหลี่ยมรังผึ้ง ⬡'}
                      </strong>{' '}
                      (ประหยัดบล็อกโค้ดจาก {repeatCount * 2} บล็อก เหลือแค่ 3 บล็อก!)
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-800">
                      สั่งไฟ LED กะพริบซ้ำ <strong>{repeatCount} รอบ</strong> แล้วหยุดอัตโนมัติ (ประหยัดบล็อกจากการวางเรียงยาวได้ถึง {repeatCount * 3} คำสั่ง!)
                    </div>
                  )}
                </div>
              )}

              {selectedLoopExample === 'forever' && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="font-bold">♾️ ลูปแบบ Forever (วนซ้ำตลอดเวลาไม่มีหยุด):</div>
                  <p className="text-emerald-800">
                    ใช้กับงานที่ต้องการให้ทำงานต่อเนื่องตั้งแต่เปิดเครื่อง เช่น ไฟหัวใจเต้นบน Micro:bit หรือการเช็กการกดปุ่มในเกมตลอดเวลา
                  </p>
                </div>
              )}

              {selectedLoopExample === 'repeat_until' && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-emerald-900 flex-wrap">
                    <span>🏁 ทดลองสถานะการเดินไปหาธงชัย:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setReachedFlag(false)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          !reachedFlag
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white border border-emerald-300 text-emerald-900'
                        }`}
                      >
                        🚶 ยังไม่ถึงธง
                      </button>
                      <button
                        type="button"
                        onClick={() => setReachedFlag(true)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          reachedFlag
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white border border-emerald-300 text-emerald-900'
                        }`}
                      >
                        🏁 ถึงธงชัยแล้ว!
                      </button>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-emerald-800">
                    {reachedFlag
                      ? '✅ ถึงธงชัยแล้ว (True) → ออกจาก Loop ทันทีและจบการทำงาน!'
                      : '🔄 ยังไม่ถึงธงชัย (False) → ทำซ้ำใน Loop เดินหน้าต่อทีละ 10 ก้าว'}
                  </div>
                </div>
              )}

              {/* Code Blocks for active loop example */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="text-xs font-bold text-emerald-900">
                    {selectedLoopExample === 'default' && 'บล็อกคำสั่งทำซ้ำใน Scratch / Micro:bit'}
                    {selectedLoopExample === 'repeat_n' && 'บล็อกคำสั่ง Repeat N: กะพริบไฟ LED (ป.4–ป.6)'}
                    {selectedLoopExample === 'forever' && 'บล็อกคำสั่ง Forever: ไฟหัวใจเต้น Micro:bit'}
                    {selectedLoopExample === 'repeat_until' && 'บล็อกคำสั่ง Repeat Until: เดินจนกว่าจะถึงธงชัย'}
                  </div>
                  {selectedLoopExample !== 'default' && (
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold shrink-0">
                      อัปเดตตามตัวอย่าง
                    </span>
                  )}
                </div>

                {selectedLoopExample === 'default' && (
                  <>
                    <div className="p-3 bg-amber-500 text-white text-xs font-mono font-medium rounded-t-md shadow-sm flex items-center justify-between">
                      <span>repeat ({repeatCount}) times</span>
                      <Repeat className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-2.5 bg-blue-500 text-white text-xs font-mono font-medium ml-4 border-l-2 border-white shadow-sm">
                      move (100) steps
                    </div>
                    <div className="p-2.5 bg-blue-600 text-white text-xs font-mono font-medium ml-4 border-l-2 border-white shadow-sm">
                      turn right ({Math.round(360 / repeatCount)}) degrees
                    </div>
                    <div className="p-1.5 bg-amber-500 rounded-b-md"></div>
                  </>
                )}

                {selectedLoopExample === 'repeat_n' && (
                  <>
                    <div className="p-3 bg-emerald-600 text-white text-xs font-mono font-medium rounded-t-md shadow-sm flex items-center justify-between">
                      <span>repeat ({repeatCount}) times</span>
                      <Repeat className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-2.5 bg-blue-500 text-white text-xs font-mono font-medium ml-4 border-l-2 border-white shadow-sm">
                      show icon (Heart ♥)
                    </div>
                    <div className="p-2.5 bg-indigo-500 text-white text-xs font-mono font-medium ml-4 border-l-2 border-white shadow-sm">
                      pause (500) ms
                    </div>
                    <div className="p-2.5 bg-blue-600 text-white text-xs font-mono font-medium ml-4 border-l-2 border-white shadow-sm">
                      clear screen
                    </div>
                    <div className="p-1.5 bg-emerald-600 rounded-b-md"></div>
                  </>
                )}

                {selectedLoopExample === 'forever' && (
                  <>
                    <div className="p-3 bg-amber-500 text-white text-xs font-mono font-medium rounded-t-md shadow-sm flex items-center justify-between">
                      <span>forever (ทำซ้ำตลอดเวลา)</span>
                      <Repeat className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-2.5 bg-blue-500 text-white text-xs font-mono font-medium ml-4 border-l-2 border-white shadow-sm">
                      show icon (Big Heart ♥) → pause (300ms)
                    </div>
                    <div className="p-2.5 bg-indigo-500 text-white text-xs font-mono font-medium ml-4 border-l-2 border-white shadow-sm">
                      show icon (Small Heart ♡) → pause (300ms)
                    </div>
                    <div className="p-1.5 bg-amber-500 rounded-b-md"></div>
                  </>
                )}

                {selectedLoopExample === 'repeat_until' && (
                  <>
                    <div className="p-3 bg-amber-600 text-white text-xs font-mono font-medium rounded-t-md shadow-sm flex items-center justify-between">
                      <span>repeat until &lt;touching [ธงชัย]?&gt;</span>
                      <Repeat className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-2.5 bg-blue-500 text-white text-xs font-mono font-medium ml-4 border-l-2 border-white shadow-sm">
                      move (10) steps
                    </div>
                    <div className="p-2.5 bg-purple-500 text-white text-xs font-mono font-medium ml-4 border-l-2 border-white shadow-sm">
                      next costume (สลับท่าเดิน)
                    </div>
                    <div className="p-1.5 bg-amber-600 rounded-b-md"></div>
                  </>
                )}
              </div>
            </div>

            {/* Right: Visual Flowchart for Loop */}
            <div className="lg:col-span-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col items-center">
              <div className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5 text-center">
                <GitBranch className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {selectedLoopExample === 'default' && 'ผังงาน Flowchart แบบวนซ้ำ (มีลูกศรชี้วนกลับด้านบน)'}
                  {selectedLoopExample === 'repeat_n' && `ผังงาน Flowchart: กะพริบไฟ LED ${repeatCount} รอบ`}
                  {selectedLoopExample === 'forever' && 'ผังงาน Flowchart: ไฟหัวใจเต้นตลอดเวลา (Forever)'}
                  {selectedLoopExample === 'repeat_until' && 'ผังงาน Flowchart: เดินหน้าจนกว่าจะถึงธงชัย'}
                </span>
              </div>

              {(selectedLoopExample === 'default' || selectedLoopExample === 'repeat_n') && (
                <div className="w-full max-w-xs flex flex-col items-center space-y-1.5">
                  <div className="px-6 py-1.5 rounded-full bg-rose-100 border-2 border-rose-400 text-rose-900 text-xs font-bold">
                    เริ่มต้น (Start)
                  </div>
                  <ArrowDown className="w-4 h-4 text-slate-500" />
                  <div className="w-full py-2 px-4 rounded-lg bg-white border-2 border-indigo-300 text-slate-800 text-xs font-semibold text-center">
                    กำหนด ตัวนับรอบ = 1
                  </div>
                  <ArrowDown className="w-4 h-4 text-slate-500" />
                  <div className="w-full py-2.5 px-4 rounded-2xl border-2 border-dashed border-amber-500 bg-amber-100 text-amber-950 text-xs font-bold text-center">
                    ◇ ตัวนับรอบ &lt;= {repeatCount} หรือไม่?
                  </div>

                  <div className="w-full p-3 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-center space-y-1">
                    <div className="text-[10px] font-bold text-emerald-700">ถ้า ใช่ (True) → ทำซ้ำใน Loop:</div>
                    <div className="text-xs font-bold text-slate-900">
                      {selectedLoopExample === 'default'
                        ? `เดินหน้า 100 ก้าว → หมุน ${Math.round(360 / repeatCount)}°`
                        : 'เปิดไฟรูปหัวใจ ♥ → รอ 0.5 วินาที → ดับไฟ'}
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-800">
                      เพิ่ม ตัวนับรอบ = ตัวนับรอบ + 1 ⤴️ (วนกลับไปตรวจเงื่อนไข)
                    </div>
                  </div>

                  <ArrowDown className="w-4 h-4 text-slate-500" />
                  <div className="text-[10px] font-bold text-rose-700">
                    เมื่อ ตัวนับรอบ &gt; {repeatCount} (ไม่ใช่ → ออกจาก Loop)
                  </div>
                  <div className="px-6 py-1.5 rounded-full bg-rose-100 border-2 border-rose-400 text-rose-900 text-xs font-bold">
                    จบการทำงาน (End)
                  </div>
                </div>
              )}

              {selectedLoopExample === 'forever' && (
                <div className="w-full max-w-xs flex flex-col items-center space-y-1.5">
                  <div className="px-6 py-1.5 rounded-full bg-rose-100 border-2 border-rose-400 text-rose-900 text-xs font-bold">
                    เริ่มต้นเปิดเครื่อง (Start)
                  </div>
                  <ArrowDown className="w-4 h-4 text-slate-500" />
                  <div className="w-full py-2.5 px-4 rounded-2xl border-2 border-dashed border-amber-500 bg-amber-100 text-amber-950 text-xs font-bold text-center">
                    ◇ เครื่องยังเปิดทำงานอยู่หรือไม่?
                  </div>
                  <div className="w-full p-3 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-center space-y-1.5">
                    <div className="text-[10px] font-bold text-emerald-700">✅ ใช่ → วนซ้ำตลอดเวลา (Forever):</div>
                    <div className="text-xs font-bold text-slate-900 bg-white rounded-lg p-2 border border-emerald-200">
                      1. แสดงรูปหัวใจใหญ่ ♥ (0.3 วินาที)
                    </div>
                    <div className="text-xs font-bold text-slate-900 bg-white rounded-lg p-2 border border-emerald-200">
                      2. แสดงรูปหัวใจเล็ก ♡ (0.3 วินาที)
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-800">
                      ⤴️ วนกลับไปทำข้อ 1 ใหม่อย่างต่อเนื่องไม่มีหยุด
                    </div>
                  </div>
                  <ArrowDown className="w-4 h-4 text-slate-500" />
                  <div className="text-[10px] font-bold text-rose-700">เมื่อปิดสวิตช์เครื่อง (ไม่ใช่)</div>
                  <div className="px-6 py-1.5 rounded-full bg-rose-100 border-2 border-rose-400 text-rose-900 text-xs font-bold">
                    จบการทำงาน (End)
                  </div>
                </div>
              )}

              {selectedLoopExample === 'repeat_until' && (
                <div className="w-full max-w-xs flex flex-col items-center space-y-1.5">
                  <div className="px-6 py-1.5 rounded-full bg-rose-100 border-2 border-rose-400 text-rose-900 text-xs font-bold">
                    เริ่มต้น (Start)
                  </div>
                  <ArrowDown className="w-4 h-4 text-slate-500" />
                  <div className="w-full py-2.5 px-4 rounded-2xl border-2 border-dashed border-amber-500 bg-amber-100 text-amber-950 text-xs font-bold text-center">
                    ◇ ถึงธงชัยแล้วหรือยัง? (touching ธงชัย?)
                  </div>

                  <div
                    className={`w-full p-3 rounded-xl border-2 text-center space-y-1 transition-all ${
                      !reachedFlag
                        ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                        : 'bg-white border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-emerald-700">❌ ถ้า ยังไม่ถึง (False) → ทำซ้ำ:</div>
                    <div className="text-xs font-bold text-slate-900">เดินหน้า 10 ก้าว + สลับท่าเดิน</div>
                    <div className="text-[11px] font-semibold text-emerald-800">
                      ⤴️ วนกลับไปเช็กว่าถึงธงชัยหรือยัง
                    </div>
                  </div>

                  <ArrowDown className="w-4 h-4 text-slate-500" />
                  <div
                    className={`w-full py-2 px-4 rounded-xl border-2 text-xs font-bold text-center transition-all ${
                      reachedFlag
                        ? 'bg-indigo-100 border-indigo-500 text-indigo-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    ✅ ถ้า ถึงธงชัยแล้ว (True) → แสดง &quot;เข้าเส้นชัย!&quot; 🎉
                  </div>
                  <ArrowDown className="w-4 h-4 text-slate-500" />
                  <div className="px-6 py-1.5 rounded-full bg-rose-100 border-2 border-rose-400 text-rose-900 text-xs font-bold">
                    จบการทำงาน (End)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Grade-level examples for Loop (Clickable) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>ตัวอย่างการใช้ Loop 3 แบบ ที่เด็ก ป.4 – ป.6 เจอบ่อย — คลิกที่การ์ดเพื่อเปลี่ยนบล็อกคำสั่งและผังงาน</span>
              </div>
              {selectedLoopExample !== 'default' && (
                <button
                  type="button"
                  onClick={() => setSelectedLoopExample('default')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-bold cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>กลับตัวอย่างวาดรูปเรขาคณิต</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  id: 'repeat_n' as LoopExampleId,
                  badge: '1. วนซ้ำตามจำนวน (Repeat N)',
                  badgeClass: 'bg-sky-100 text-sky-700',
                  title: 'รู้ล่วงหน้าว่าทำกี่รอบ',
                  desc: 'เช่น วิ่งรอบสนาม 3 รอบ, กะพริบไฟ LED 5 ครั้ง, หรือวาดรูปสี่เหลี่ยม 4 ด้าน',
                },
                {
                  id: 'forever' as LoopExampleId,
                  badge: '2. วนซ้ำตลอดเวลา (Forever)',
                  badgeClass: 'bg-amber-100 text-amber-800',
                  title: 'ทำงานต่อเนื่องไม่หยุด',
                  desc: 'เช่น นาฬิกาดิจิทัล, ไฟหัวใจเต้น Micro:bit, หรือคอยตรวจจับการกดปุ่มในเกม',
                },
                {
                  id: 'repeat_until' as LoopExampleId,
                  badge: '3. วนซ้ำจนกว่า... (Repeat Until)',
                  badgeClass: 'bg-emerald-100 text-emerald-700',
                  title: 'หยุดเมื่อทำเป้าหมายสำเร็จ',
                  desc: 'เช่น เดินหน้าทีละก้าว จนกว่าจะถึงธงชัย หรือล้างจานจนกว่าจะหมดซิงก์',
                },
              ].map((card) => {
                const isSelected = selectedLoopExample === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedLoopExample(isSelected ? 'default' : card.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-200 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${card.badgeClass}`}>
                          {card.badge}
                        </span>
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>กำลังแสดงผล</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-700">คลิกดูผังงาน →</span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-1.5">{card.title}</div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{card.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

