import React, { useState, useEffect } from 'react';
import {
  Play,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowDown,
  ArrowUp,
  Lightbulb,
  BookOpen,
  Award,
  AlertCircle,
  GripVertical,
  Plus,
  Trash2,
  Wand2,
  LayoutTemplate,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  ImageDown,
  FileJson,
  HelpCircle,
  Share2,
  Check,
  Magnet,
  AlignCenter,
  Code2,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface FlowchartGuideViewProps {
  addPoints?: (points: number) => void;
}

interface FlowchartSymbolInfo {
  id: string;
  nameTh: string;
  nameEn: string;
  shapeType: 'terminator' | 'process' | 'decision' | 'io' | 'flow' | 'connector';
  colorClass: string;
  meaningForKids: string;
  sampleInside: string;
  commonMistake: string;
  visualEmoji: string;
  visualTitle: string;
  visualMetaphor: string;
  visualCue: string;
}

const FLOWCHART_SYMBOLS: FlowchartSymbolInfo[] = [
  {
    id: 'terminator',
    nameTh: 'จุดเริ่มต้น / สิ้นสุด',
    nameEn: 'Terminator (Start/End)',
    shapeType: 'terminator',
    colorClass: 'border-rose-300 bg-rose-50 text-rose-800',
    meaningForKids: 'ใช้บอก "จุดเริ่มต้น (Start)" ตอนเปิดผังงาน และ "จุดสิ้นสุด (End)" เมื่อทำงานจบครบทุกขั้นตอน',
    sampleInside: 'เริ่มต้น (Start) / จบ (End)',
    commonMistake: 'ลืมใส่จุดเริ่มต้นหรือจุดสิ้นสุด หรือใช้สี่เหลี่ยมผืนผ้าแทนวงรี',
    visualEmoji: '🚦',
    visualTitle: 'ป้ายออกตัว & เส้นชัย',
    visualMetaphor: 'เหมือนจุดปล่อยตัวนักวิ่ง 🏁 และเส้นชัย — ทุกการผจญภัยต้องรู้ว่าเริ่มตรงไหนและจบตรงไหน!',
    visualCue: '🟢 เริ่มต้น ➔ ... ➔ 🏁 จบ',
  },
  {
    id: 'process',
    nameTh: 'การปฏิบัติงาน / ประมวลผล',
    nameEn: 'Process',
    shapeType: 'process',
    colorClass: 'border-indigo-300 bg-indigo-50 text-indigo-800',
    meaningForKids: 'ใช้เขียนคำสั่ง "ลงมือทำ" หรือการคำนวณ เช่น แปรงฟัน, บวกคะแนน, เดินหน้า 10 ก้าว',
    sampleInside: 'คำนวณ คะแนน = คะแนน + 10',
    commonMistake: 'เอาคำถามที่มี "ใช่/ไม่ใช่" มาใส่ในสี่เหลี่ยมผืนผ้าแทนรูปข้าวหลามตัด',
    visualEmoji: '⚙️',
    visualTitle: 'กล่องลงมือทำ',
    visualMetaphor: 'เหมือนฟันเฟืองหุ่นยนต์ ⚙️ ที่กำลังทำงานตามคำสั่งทีละอย่าง เช่น เดินหน้า บวกเลข หรือแปรงฟัน',
    visualCue: '⚙️ ทำภารกิจ / คำนวณ',
  },
  {
    id: 'decision',
    nameTh: 'การตัดสินใจ / เงื่อนไข',
    nameEn: 'Decision',
    shapeType: 'decision',
    colorClass: 'border-amber-300 bg-amber-50 text-amber-800',
    meaningForKids: 'ใช้ตั้ง "คำถามตรวจสอบเงื่อนไข" ที่มีคำตอบได้ 2 ทาง คือ จริง (ใช่/Yes) หรือ เท็จ (ไม่ใช่/No)',
    sampleInside: 'คะแนน >= 50 หรือไม่?',
    commonMistake: 'ลืมเขียนคำว่า "ใช่ (จริง)" กับ "ไม่ใช่ (เท็จ)" กำกับไว้บนเส้นลูกศรที่ออกจากรูปข้าวหลามตัด',
    visualEmoji: '🤔',
    visualTitle: 'ทางแยก 2 ทาง (ใช่ / ไม่ใช่)',
    visualMetaphor: 'เหมือนป้ายทางแยกที่มีคำถามชวนคิด 🤔 ถ้าตอบ "ใช่ ✔️" เลี้ยวทางหนึ่ง ถ้า "ไม่ใช่ ❌" ไปอีกทางหนึ่ง!',
    visualCue: '✔️ ใช่ (True) ⟷ ❌ ไม่ใช่ (False)',
  },
  {
    id: 'io',
    nameTh: 'รับข้อมูลเข้า / แสดงผลลัพธ์',
    nameEn: 'Input / Output',
    shapeType: 'io',
    colorClass: 'border-sky-300 bg-sky-50 text-sky-800',
    meaningForKids: 'ใช้เมื่อโปรแกรม "รับค่าจากผู้ใช้" (เช่น กดปุ่ม, พิมพ์ชื่อ) หรือ "แสดงผลบนหน้าจอ"',
    sampleInside: 'รับค่าอายุ / แสดงคำว่า "ผ่าน!"',
    commonMistake: 'วาดกรอบเอียงสี่เหลี่ยมด้านขนานผิดด้าน หรือสลับกับการประมวลผล',
    visualEmoji: '🎤',
    visualTitle: 'รับเข้า & โชว์ผล',
    visualMetaphor: 'เหมือนไมโครโฟน 🎤 รับเสียงหรือพิมพ์ข้อความเข้ามา แล้วส่งภาพ/เสียงออกไปโชว์บนหน้าจอ 📺',
    visualCue: '📥 รับค่าเข้า ➔ 📤 แสดงบนจอ',
  },
  {
    id: 'flow',
    nameTh: 'ลูกศรทิศทางการทำงาน',
    nameEn: 'Flow Line',
    shapeType: 'flow',
    colorClass: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    meaningForKids: 'บอกลำดับว่าจะทำงานกล่องไหนก่อน-หลัง โดยนิยมลากจาก "บนลงล่าง" หรือ "ซ้ายไปขวา"',
    sampleInside: '↓ หรือ →',
    commonMistake: 'วาดเป็นเส้นตรงเฉยๆ ไม่มีหัวลูกศร ทำให้อ่านไม่ออกว่าต้องเดินไปทางไหน',
    visualEmoji: '🧭',
    visualTitle: 'ป้ายลูกศรนำทาง',
    visualMetaphor: 'เหมือนป้ายบอกทางบนถนน 🧭 พาเดินจากกล่องหนึ่งไปยังกล่องถัดไปอย่างเป็นระเบียบ ไม่หลงทาง!',
    visualCue: '⬇️ เดินลง / ➡️ ไปขวา',
  },
  {
    id: 'connector',
    nameTh: 'จุดเชื่อมต่อ (ในหน้าเดียวกัน)',
    nameEn: 'On-Page Connector',
    shapeType: 'connector',
    colorClass: 'border-violet-300 bg-violet-50 text-violet-800',
    meaningForKids: 'ใช้รวมเส้นลูกศรจากหลายทางให้กลับมาเชื่อมกันอย่างเป็นระเบียบ ก่อนไปขั้นตอนถัดไป',
    sampleInside: '○ จุดรวมเส้น',
    commonMistake: 'ลากเส้นตัดทับกันไปมาจนอ่านสับสนแทนที่จะใช้จุดเชื่อมต่อ',
    visualEmoji: '🔗',
    visualTitle: 'วงเวียนรวมเส้นทาง',
    visualMetaphor: 'เหมือนวงเวียนถนน 🔗 ที่รวมรถจากทางแยก ใช่/ไม่ใช่ ให้กลับมารวมกันเป็นเส้นทางเดียว!',
    visualCue: '⭕ รวมเส้นทางให้เรียบร้อย',
  },
];

interface FlowchartStepNode {
  id: string;
  shape: 'terminator' | 'process' | 'decision' | 'io';
  text: string;
  explanation: string;
  branchTag?: string;
}

interface FlowchartExample {
  id: string;
  grade: 'ป.4' | 'ป.5' | 'ป.6';
  structureType: string;
  title: string;
  subtitle: string;
  interactiveMode?: 'score' | 'weather' | 'loop5' | 'light';
  pseudocode: string[];
  scratchHint: string;
}

const FLOWCHART_EXAMPLES: FlowchartExample[] = [
  {
    id: 'p4_brush',
    grade: 'ป.4',
    structureType: 'แบบลำดับ (Sequence)',
    title: 'ตัวอย่างที่ 1: ขั้นตอนการแปรงฟันก่อนนอน',
    subtitle: 'ทำเรียงต่อกันทีละขั้นจากบนลงล่าง ไม่มีทางแยก',
    pseudocode: [
      '1. เริ่มต้น',
      '2. บีบยาสีฟันลงบนแปรง',
      '3. แปรงฟันให้สะอาดทั่วทุกซี่นาน 2 นาที',
      '4. บ้วนปากด้วยน้ำสะอาดและล้างแปรง',
      '5. จบการทำงาน',
    ],
    scratchHint: 'เรียงบล็อกต่อกันตรงๆ: เตรียมตัว -> แปรงฟัน -> บ้วนปาก -> พูดว่า "ฟันสะอาดแล้ว!"',
  },
  {
    id: 'p4_noodle',
    grade: 'ป.4',
    structureType: 'แบบลำดับ (Sequence)',
    title: 'ตัวอย่างที่ 2: การต้มบะหมี่กึ่งสำเร็จรูป',
    subtitle: 'กิจวัตรประจำวันที่แสดง Input (รับของ) และ Process (ลงมือทำ)',
    pseudocode: [
      '1. เริ่มต้น',
      '2. เตรียมบะหมี่ น้ำดื่ม และหม้อต้ม (Input)',
      '3. ต้มน้ำให้เดือด ใส่เส้นและเครื่องปรุง (Process)',
      '4. รอ 3 นาที แล้วเทใส่ชามพร้อมเสิร์ฟ (Output)',
      '5. จบการทำงาน',
    ],
    scratchHint: 'เหมือนลำดับเหตุการณ์: รอ 3 วินาที (wait 3 secs) แล้วเปลี่ยนชุดตัวละครเป็นชามบะหมี่',
  },
  {
    id: 'p5_exam',
    grade: 'ป.5',
    structureType: 'แบบทางเลือก (Selection / If-Else)',
    title: 'ตัวอย่างที่ 3: ระบบตรวจผลสอบวิทยาการคำนวณ',
    subtitle: 'ทดลองปรับคะแนนสอบ แล้วกดจำลองเพื่อดูผังงานเดินไปคนละเส้นทาง!',
    interactiveMode: 'score',
    pseudocode: [
      '1. เริ่มต้น',
      '2. รับค่า คะแนนสอบ (Input)',
      '3. ตรวจสอบ: คะแนน >= 50 หรือไม่? (Decision)',
      '   - ถ้า ใช่ -> แสดงข้อความ "ยินดีด้วย สอบผ่าน!"',
      '   - ถ้า ไม่ใช่ -> แสดงข้อความ "พยายามใหม่ ทบทวนอีกครั้ง"',
      '4. จบการทำงาน',
    ],
    scratchHint: 'ใช้บล็อก if <(score) >= (50)> then [say ผ่าน] else [say ทบทวนใหม่]',
  },
  {
    id: 'p5_umbrella',
    grade: 'ป.5',
    structureType: 'แบบทางเลือก (Selection / If-Else)',
    title: 'ตัวอย่างที่ 4: เช็กสภาพอากาศก่อนออกจากบ้าน',
    subtitle: 'เลือกสภาพอากาศด้านล่าง แล้วดูการตัดสินใจของผังงานข้าวหลามตัด ◇',
    interactiveMode: 'weather',
    pseudocode: [
      '1. เริ่มต้น',
      '2. สังเกตสภาพอากาศหน้าบ้าน (Input)',
      '3. ตรวจสอบ: ฝนตกหรือไม่? (Decision)',
      '   - ถ้า ใช่ (ฝนตก) -> หยิบร่มและเสื้อกันฝนใส่กระเป๋า',
      '   - ถ้า ไม่ใช่ (แดดออก) -> ใส่หมวกกันแดดออกจากบ้าน',
      '4. จบการทำงาน',
    ],
    scratchHint: 'ใช้บล็อก if <(weather) = [ฝนตก]> then [พกร่ม] else [ใส่หมวก]',
  },
  {
    id: 'p6_water',
    grade: 'ป.6',
    structureType: 'แบบวนซ้ำ (Iteration / Loop)',
    title: 'ตัวอย่างที่ 5: หุ่นยนต์รดน้ำต้นไม้ครบ 5 ต้น',
    subtitle: 'ดูลูกศรวนกลับไปที่จุดตัดสินใจซ้ำๆ จนกว่ารดครบ 5 ต้นจึงหยุด',
    interactiveMode: 'loop5',
    pseudocode: [
      '1. เริ่มต้น',
      '2. กำหนดค่า ต้นที่ = 1',
      '3. ตรวจสอบ: ต้นที่ <= 5 หรือไม่?',
      '   - ถ้า ใช่ -> รดน้ำต้นไม้ แล้วเพิ่ม ต้นที่ = ต้นที่ + 1 (วนกลับข้อ 3)',
      '   - ถ้า ไม่ใช่ -> แสดงผล "รดน้ำครบ 5 ต้นแล้ว!"',
      '4. จบการทำงาน',
    ],
    scratchHint: 'ใช้บล็อก repeat (5) [รดน้ำต้นไม้ -> เดินไปต้นถัดไป]',
  },
  {
    id: 'p6_streetlight',
    grade: 'ป.6',
    structureType: 'โครงงาน IoT (ทางเลือก + วนซ้ำ)',
    title: 'ตัวอย่างที่ 6: โคมไฟถนนอัจฉริยะ Micro:bit',
    subtitle: 'ลากแถบวัดแสง (Light Level 0–100) แล้วดูระบบตัดสินใจเปิด-ปิดไฟอัตโนมัติ',
    interactiveMode: 'light',
    pseudocode: [
      '1. เริ่มต้น (ทำงานตลอดเวลา Forever)',
      '2. อ่านค่าความสว่างแสงจากเซ็นเซอร์ (Input)',
      '3. ตรวจสอบ: แสงสว่าง < 50 (มืด) หรือไม่?',
      '   - ถ้า ใช่ -> เปิดหลอดไฟ LED 5x5 สว่างเต็มที่',
      '   - ถ้า ไม่ใช่ -> ปิดไฟ LED เพื่อประหยัดพลังงาน',
      '4. วนกลับไปอ่านค่าแสงใหม่อย่างต่อเนื่อง',
    ],
    scratchHint: 'Micro:bit: forever { if (light level < 50) show LEDs ON else clear screen }',
  },
];

const FLOWCHART_QUIZ = [
  {
    q: 'สัญลักษณ์รูป "สี่เหลี่ยมข้าวหลามตัด ◇" ในผังงาน Flowchart มีหน้าที่ทำอะไร?',
    options: [
      'จุดเริ่มต้นและจุดสิ้นสุดของผังงาน',
      'ตรวจสอบเงื่อนไขและการตัดสินใจ (มีทางออก จริง/เท็จ)',
      'การบวกลบเลขหรือสั่งให้ตัวละครเดิน',
    ],
    correct: 1,
    explanation: 'ถูกต้อง! สี่เหลี่ยมข้าวหลามตัด (Decision) ใช้ตั้งคำถามตรวจสอบเงื่อนไข เช่น คะแนน >= 50 หรือไม่ โดยมีทางออกเป็น "ใช่" กับ "ไม่ใช่"',
  },
  {
    q: 'หากต้องการเขียนกล่องข้อความว่า "เริ่มต้น" และ "จบการทำงาน" ต้องใช้รูปสัญลักษณ์ใด?',
    options: [
      'รูปวงรี / แคปซูล (Terminator)',
      'รูปสี่เหลี่ยมผืนผ้า (Process)',
      'รูปสี่เหลี่ยมด้านขนาน (Input/Output)',
    ],
    correct: 0,
    explanation: 'เก่งมาก! ทุกผังงานต้องขึ้นต้นและลงท้ายด้วยรูปวงรี/แคปซูล (Terminator) เสมอ',
  },
  {
    q: 'ข้อใดใช้สัญลักษณ์ "สี่เหลี่ยมด้านขนาน ▱ (Input / Output)" ได้ถูกต้อง?',
    options: [
      'เดินหน้า 5 ก้าว',
      'ฝนตกหรือไม่?',
      'รับค่าชื่อนักเรียนจากคีย์บอร์ด / แสดงคะแนนรวมบนหน้าจอ',
    ],
    correct: 2,
    explanation: 'ถูกต้อง! สี่เหลี่ยมด้านขนานใช้สำหรับรับข้อมูลเข้า (Input) หรือแสดงผลลัพธ์ออกทางหน้าจอ/ลำโพง (Output)',
  },
  {
    q: 'ตามหลักการเขียนผังงาน Flowchart ที่ดี ควรวาดทิศทางลูกศรอย่างไร?',
    options: [
      'ลากจากบนลงล่าง หรือซ้ายไปขวา และมีหัวลูกศรชัดเจน',
      'วาดสลับขึ้นลงตัดเส้นทับกันเพื่อให้ประหยัดพื้นที่',
      'ไม่ต้องใส่หัวลูกศร ใช้แค่เส้นตรงอย่างเดียว',
    ],
    correct: 0,
    explanation: 'เยี่ยมมาก! การวาดจากบนลงล่างหรือซ้ายไปขวา พร้อมหัวลูกศรที่ชัดเจน จะช่วยให้ทุกคนอ่านเข้าใจตรงกัน',
  },
  {
    q: 'ในโครงสร้างแบบวนซ้ำ (Loop) ลูกศรหลังจากทำงานครบ 1 รอบจะชี้ไปที่ใด?',
    options: [
      'ชี้ตรงไปที่จุดสิ้นสุด (End) ทันทีโดยไม่ตรวจเงื่อนไข',
      'ชี้วนย้อนกลับไปที่จุดตรวจสอบเงื่อนไขด้านบน เพื่อดูว่าจะทำรอบต่อไปหรือไม่',
      'ชี้หายออกไปนอกหน้ากระดาษ',
    ],
    correct: 1,
    explanation: 'ถูกต้อง! หัวใจของ Loop คือลูกศรต้องวนย้อนกลับไปตรวจสอบเงื่อนไขซ้ำ จนกว่าเงื่อนไขจะเปลี่ยนเป็นเท็จจึงออกจาก Loop ได้',
  },
];

const SymbolGraphic: React.FC<{
  shape: FlowchartSymbolInfo['shapeType'];
  mode?: 'text' | 'visual';
}> = ({ shape, mode = 'text' }) => {
  if (shape === 'terminator') {
    return (
      <svg viewBox="0 0 120 48" className="w-28 h-12 mx-auto">
        <rect x="10" y="6" width="100" height="36" rx="18" fill="#ffe4e6" stroke="#e11d48" strokeWidth="2.5" />
        <text x="60" y="29" textAnchor="middle" fontSize={mode === 'visual' ? '15' : '12'} fontWeight="700" fill="#9f1239">
          {mode === 'visual' ? '🚦 เริ่ม / จบ' : 'เริ่มต้น / จบ'}
        </text>
      </svg>
    );
  }
  if (shape === 'process') {
    return (
      <svg viewBox="0 0 120 48" className="w-28 h-12 mx-auto">
        <rect x="12" y="6" width="96" height="36" rx="4" fill="#e0e7ff" stroke="#4f46e5" strokeWidth="2.5" />
        <text x="60" y="29" textAnchor="middle" fontSize={mode === 'visual' ? '14' : '12'} fontWeight="700" fill="#3730a3">
          {mode === 'visual' ? '⚙️ ทำเลย!' : 'ลงมือทำ'}
        </text>
      </svg>
    );
  }
  if (shape === 'decision') {
    return (
      <svg viewBox="0 0 120 56" className="w-28 h-14 mx-auto">
        <polygon points="60,4 110,28 60,52 10,28" fill="#fef3c7" stroke="#d97706" strokeWidth="2.5" />
        <text x="60" y="32" textAnchor="middle" fontSize={mode === 'visual' ? '13' : '11'} fontWeight="700" fill="#92400e">
          {mode === 'visual' ? '🤔 ใช่/ไม่?' : 'เงื่อนไข?'}
        </text>
      </svg>
    );
  }
  if (shape === 'io') {
    return (
      <svg viewBox="0 0 120 48" className="w-28 h-12 mx-auto">
        <polygon points="24,6 110,6 96,42 10,42" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2.5" />
        <text x="60" y="29" textAnchor="middle" fontSize={mode === 'visual' ? '13' : '11'} fontWeight="700" fill="#075985">
          {mode === 'visual' ? '🎤 ⇄ 📺' : 'รับค่า / แสดงผล'}
        </text>
      </svg>
    );
  }
  if (shape === 'flow') {
    return (
      <svg viewBox="0 0 120 48" className="w-28 h-12 mx-auto">
        <line x1="16" y1="24" x2="88" y2="24" stroke="#059669" strokeWidth="3.5" />
        <polygon points="88,15 106,24 88,33" fill="#059669" />
        {mode === 'visual' && (
          <text x="48" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill="#065f46">
            🧭 ไปต่อ
          </text>
        )}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 48" className="w-28 h-12 mx-auto">
      <circle cx="60" cy="24" r="16" fill="#ede9fe" stroke="#7c3aed" strokeWidth="2.5" />
      <text x="60" y="29" textAnchor="middle" fontSize={mode === 'visual' ? '13' : '11'} fontWeight="700" fill="#5b21b6">
        {mode === 'visual' ? '🔗' : 'A'}
      </text>
    </svg>
  );
};

type EditorSymbolKind = 'start' | 'input' | 'process' | 'decision' | 'output' | 'end';

interface EditorNode {
  uid: string;
  kind: EditorSymbolKind;
  label: string;
  trueAction?: string;
  falseAction?: string;
  x?: number;
  y?: number;
}

const CANVAS_GRID_SIZE = 24;
const CANVAS_LOGICAL_WIDTH = 720;
const NODE_CARD_WIDTH = 336;
const CANVAS_PADDING = 24;
const CENTER_NODE_X = (CANVAS_LOGICAL_WIDTH - NODE_CARD_WIDTH) / 2; // 192px (8 * 24)
const CONNECTOR_VERTICAL_GAP = 48; // 2 * 24

const getEstimatedNodeHeight = (kind: EditorSymbolKind): number =>
  kind === 'decision' ? 168 : 96;

const snapCoordinate = (value: number, enabled: boolean, gridSize = CANVAS_GRID_SIZE): number =>
  enabled ? Math.round(value / gridSize) * gridSize : Math.round(value);

const clampNodePosition = (x: number, y: number): { x: number; y: number } => ({
  x: Math.max(
    CANVAS_PADDING,
    Math.min(CANVAS_LOGICAL_WIDTH - NODE_CARD_WIDTH - CANVAS_PADDING, x)
  ),
  y: Math.max(CANVAS_PADDING, y),
});

const layoutNodesTidily = (
  nodes: EditorNode[],
  heightsMap?: Record<string, number>,
  preserveExplicitX = false
): EditorNode[] => {
  let cursorY = CANVAS_PADDING;
  return nodes.map((node) => {
    const snappedY = Math.round(cursorY / CANVAS_GRID_SIZE) * CANVAS_GRID_SIZE;
    const h = heightsMap?.[node.uid] || getEstimatedNodeHeight(node.kind);
    cursorY = snappedY + h + CONNECTOR_VERTICAL_GAP;
    const targetX =
      preserveExplicitX && typeof node.x === 'number' && Number.isFinite(node.x)
        ? clampNodePosition(snapCoordinate(node.x, true), snappedY).x
        : CENTER_NODE_X;
    return {
      ...node,
      x: targetX,
      y: snappedY,
    };
  });
};

const ensureNodeCoordinates = (nodes: EditorNode[], snapEnabled = true): EditorNode[] => {
  let fallbackY = CANVAS_PADDING;
  let prevX = CENTER_NODE_X;

  return nodes.map((node) => {
    const estH = getEstimatedNodeHeight(node.kind);
    if (
      typeof node.x === 'number' &&
      typeof node.y === 'number' &&
      Number.isFinite(node.x) &&
      Number.isFinite(node.y)
    ) {
      const clamped = clampNodePosition(
        snapCoordinate(node.x, snapEnabled),
        snapCoordinate(node.y, snapEnabled)
      );
      prevX = clamped.x;
      fallbackY = Math.max(fallbackY, clamped.y + estH + CONNECTOR_VERTICAL_GAP);
      return { ...node, x: clamped.x, y: clamped.y };
    }

    const clamped = clampNodePosition(
      snapCoordinate(prevX, true),
      snapCoordinate(fallbackY, true)
    );
    fallbackY = clamped.y + estH + CONNECTOR_VERTICAL_GAP;
    return { ...node, x: clamped.x, y: clamped.y };
  });
};

interface EditorPaletteItem {
  kind: EditorSymbolKind;
  nameTh: string;
  visualName: string;
  visualEmoji: string;
  defaultLabel: string;
  badgeText: string;
  cardClass: string;
  tooltipFunction: string;
  tooltipBestUse: string;
}

const EDITOR_PALETTE: EditorPaletteItem[] = [
  {
    kind: 'start',
    nameTh: 'จุดเริ่มต้น (Start)',
    visualName: '🚦 ป้ายออกตัว (Start)',
    visualEmoji: '🚦',
    defaultLabel: 'เริ่มต้นการทำงาน (Start)',
    badgeText: 'Terminator',
    cardClass: 'bg-rose-50 border-rose-300 text-rose-900',
    tooltipFunction: 'ใช้บอกจุดเริ่มต้นการทำงานของโปรแกรมหรือผังงานทุกชิ้น',
    tooltipBestUse: 'วางเป็นกล่องแรกสุดเสมอ (เช่น "เริ่มต้นทำแซนด์วิช" หรือ "เปิดระบบไฟอัตโนมัติ")',
  },
  {
    kind: 'input',
    nameTh: 'รับข้อมูลเข้า (Input)',
    visualName: '🎤 รับข้อมูลเข้า (Input)',
    visualEmoji: '🎤',
    defaultLabel: 'รับค่าข้อมูลจากผู้ใช้',
    badgeText: 'Input',
    cardClass: 'bg-sky-50 border-sky-300 text-sky-900',
    tooltipFunction: 'ใช้รับข้อมูล คำสั่ง หรือค่าจากเซ็นเซอร์และผู้ใช้เข้าสู่โปรแกรม',
    tooltipBestUse: 'ใช้เมื่อต้องถามข้อมูลหรือวัดค่าก่อนคิด (เช่น กดปุ่ม A, พิมพ์คะแนน, อ่านค่าความชื้นดิน)',
  },
  {
    kind: 'process',
    nameTh: 'ลงมือทำ / ประมวลผล (Process)',
    visualName: '⚙️ ลงมือทำ (Process)',
    visualEmoji: '⚙️',
    defaultLabel: 'คำนวณหรือทำงานตามคำสั่ง',
    badgeText: 'Process',
    cardClass: 'bg-indigo-50 border-indigo-300 text-indigo-900',
    tooltipFunction: 'ใช้สั่งงานให้ทำตามขั้นตอนหรือคำนวณเปลี่ยนแปลงค่าต่างๆ',
    tooltipBestUse: 'ใช้สำหรับทุกการกระทำหรือสูตรคำนวณ (เช่น บวกคะแนน +1, เปิดปั๊มน้ำ, เดินหน้า 10 ก้าว)',
  },
  {
    kind: 'decision',
    nameTh: 'ตรวจสอบเงื่อนไข (Decision)',
    visualName: '🤔 ทางแยกตัดสินใจ (Decision)',
    visualEmoji: '🤔',
    defaultLabel: 'ตรวจสอบเงื่อนไข ใช่หรือไม่?',
    badgeText: 'Decision ◇',
    cardClass: 'bg-amber-50 border-amber-400 text-amber-900',
    tooltipFunction: 'ใช้ตั้งคำถามเพื่อตัดสินใจแยกเส้นทางเป็น 2 ทาง คือ "ใช่ (True)" หรือ "ไม่ใช่ (False)"',
    tooltipBestUse: 'ใช้เมื่อต้องเปรียบเทียบหรือทำซ้ำ Loop (เช่น คะแนน >= 50?, ฝนตกไหม?, ตัวนับ <= 5?)',
  },
  {
    kind: 'output',
    nameTh: 'แสดงผลลัพธ์ (Output)',
    visualName: '📺 แสดงผลบนจอ (Output)',
    visualEmoji: '📺',
    defaultLabel: 'แสดงผลลัพธ์บนหน้าจอ',
    badgeText: 'Output',
    cardClass: 'bg-cyan-50 border-cyan-300 text-cyan-900',
    tooltipFunction: 'ใช้แสดงคำตอบ ข้อความ เสียง หรือสัญญาณไฟให้ผู้ใช้งานเห็นผลลัพธ์',
    tooltipBestUse: 'ใช้เมื่อต้องการโชว์ผลหลังประมวลผลเสร็จ (เช่น แสดงคำว่า "สอบผ่าน!", โชว์ไอคอนหัวใจบน LED)',
  },
  {
    kind: 'end',
    nameTh: 'จุดสิ้นสุด (End)',
    visualName: '🏁 เส้นชัย (End)',
    visualEmoji: '🏁',
    defaultLabel: 'จบการทำงาน (End)',
    badgeText: 'Terminator',
    cardClass: 'bg-rose-50 border-rose-300 text-rose-900',
    tooltipFunction: 'ใช้บอกจุดจบการทำงานของผังงานเมื่อทำครบทุกขั้นตอนแล้ว',
    tooltipBestUse: 'วางเป็นกล่องสุดท้ายเสมอ เพื่อปิดการทำงานให้สมบูรณ์ไม่ค้างกลางทาง',
  },
];

const EDITOR_MISSIONS: Array<{
  id: string;
  title: string;
  description: string;
  starterNodes: Omit<EditorNode, 'uid'>[];
}> = [
  {
    id: 'mission_free',
    title: '🎨 โหมดอิสระ (สร้างผังงานเอง)',
    description: 'ลากหรือคลิกสัญลักษณ์จากฝั่งซ้ายมาเรียงต่อกัน แล้วแก้ไขข้อความในกล่องได้ตามใจชอบ!',
    starterNodes: [
      { kind: 'start', label: 'เริ่มต้น (Start)' },
      { kind: 'process', label: 'ลงมือทำขั้นตอนที่ 1' },
    ],
  },
  {
    id: 'mission_sandwich',
    title: '🥪 ภารกิจ ป.4: ผังงานทำแซนด์วิช',
    description: 'ลองเติมกล่อง "ลงมือทำ (Process)" และ "จุดสิ้นสุด (End)" ให้ครบ 4–5 ขั้นตอน!',
    starterNodes: [
      { kind: 'start', label: 'เริ่มต้นทำแซนด์วิช' },
      { kind: 'input', label: 'เตรียมขนมปังและไส้ทูน่า' },
    ],
  },
  {
    id: 'mission_door',
    title: '🤖 ภารกิจ ป.5–ป.6: ประตูอัตโนมัติ (Decision)',
    description: 'สร้างผังงานตรวจจับคนเดินผ่านด้วยสัญลักษณ์ "ตรวจสอบเงื่อนไข (Decision ◇)" พร้อมผลลัพธ์!',
    starterNodes: [
      { kind: 'start', label: 'เปิดระบบประตูอัตโนมัติ' },
      { kind: 'input', label: 'เซ็นเซอร์ตรวจจับการเคลื่อนไหว' },
      {
        kind: 'decision',
        label: 'มีคนเดินเข้ามาหรือไม่?',
        trueAction: 'เปิดประตูอัตโนมัติ 🚪',
        falseAction: 'ปิดประตูไว้เหมือนเดิม 🔒',
      },
    ],
  },
];

interface FlowchartTemplateItem {
  id: string;
  patternTag: string;
  title: string;
  gradeTag: string;
  description: string;
  previewFlow: string;
  badgeColor: string;
  nodes: Omit<EditorNode, 'uid'>[];
}

const FLOWCHART_TEMPLATES: FlowchartTemplateItem[] = [
  {
    id: 'tpl_ipo',
    patternTag: 'Input–Process–Output (IPO)',
    title: '📥 รับข้อมูล → ประมวลผล → แสดงผล',
    gradeTag: 'พื้นฐาน ป.4–ป.6',
    description: 'แม่แบบหลักของโปรแกรมคอมพิวเตอร์: รับข้อมูลเข้า คำนวณผลลัพธ์ และแสดงออกหน้าจอ',
    previewFlow: 'Start ➔ Input ➔ Process ➔ Output ➔ End',
    badgeColor: 'bg-sky-100 text-sky-800',
    nodes: [
      { kind: 'start', label: 'เริ่มต้นโปรแกรมคำนวณ' },
      { kind: 'input', label: 'รับค่าตัวเลข A และ B (Input)' },
      { kind: 'process', label: 'คำนวณ ผลรวม = A + B (Process)' },
      { kind: 'output', label: 'แสดงผลรวมบนหน้าจอ (Output)' },
      { kind: 'end', label: 'จบการทำงาน (End)' },
    ],
  },
  {
    id: 'tpl_sequence',
    patternTag: 'Sequence (ลำดับ)',
    title: '1️⃣ ลำดับขั้นตอนต่อเนื่อง',
    gradeTag: 'ป.4',
    description: 'ทำเรียงจากบนลงล่างทีละขั้น เหมาะกับงานกิจวัตรหรือแอนิเมชันสั้นๆ',
    previewFlow: 'Start ➔ Process 1 ➔ Process 2 ➔ End',
    badgeColor: 'bg-indigo-100 text-indigo-800',
    nodes: [
      { kind: 'start', label: 'เริ่มต้นภารกิจยามเช้า' },
      { kind: 'process', label: 'ตื่นนอนและพับผ้าห่มให้เรียบร้อย' },
      { kind: 'process', label: 'แปรงฟัน ล้างหน้า และแต่งชุดนักเรียน' },
      { kind: 'output', label: 'พร้อมออกเดินทางไปโรงเรียน 🎒' },
      { kind: 'end', label: 'จบการทำงาน (End)' },
    ],
  },
  {
    id: 'tpl_selection',
    patternTag: 'If–Else Decision (ทางเลือก)',
    title: '🔀 ตรวจสอบเงื่อนไข (ใช่ / ไม่ใช่)',
    gradeTag: 'ป.5',
    description: 'ตัดสินใจแยก 2 เส้นทางเมื่อมีเงื่อนไข เช่น ตรวจอุณหภูมิหรือคะแนนสอบ',
    previewFlow: 'Start ➔ Input ➔ Decision ◇ ➔ Output ➔ End',
    badgeColor: 'bg-amber-100 text-amber-800',
    nodes: [
      { kind: 'start', label: 'เริ่มต้นระบบควบคุมพัดลม' },
      { kind: 'input', label: 'อ่านค่าอุณหภูมิห้อง (°C)' },
      {
        kind: 'decision',
        label: 'อุณหภูมิ > 30°C หรือไม่?',
        trueAction: 'เปิดพัดลมระบายอากาศ 🌀',
        falseAction: 'ปิดพัดลมประหยัดไฟ ✅',
      },
      { kind: 'output', label: 'แสดงสถานะพัดลมบนหน้าจอ' },
      { kind: 'end', label: 'จบการทำงาน (End)' },
    ],
  },
  {
    id: 'tpl_loop',
    patternTag: 'Looping (การวนซ้ำ)',
    title: '🔁 ทำงานวนซ้ำตามจำนวนรอบ',
    gradeTag: 'ป.5–ป.6',
    description: 'สั่งให้ทำงานเดิมซ้ำๆ อัตโนมัติ จนกว่าเงื่อนไขตัวนับรอบจะครบแล้วค่อยหยุด',
    previewFlow: 'Start ➔ Set Loop ➔ Decision ↻ ➔ Output ➔ End',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    nodes: [
      { kind: 'start', label: 'เริ่มต้นวาดรูปสี่เหลี่ยม' },
      { kind: 'process', label: 'กำหนด ตัวนับรอบ = 1' },
      {
        kind: 'decision',
        label: 'ตัวนับรอบ <= 4 หรือไม่?',
        trueAction: 'เดิน 100 ก้าว + หมุน 90° + รอบ + 1 ⤴️',
        falseAction: 'ครบ 4 ด้านแล้ว ออกจาก Loop 🏁',
      },
      { kind: 'output', label: 'แสดงรูปสี่เหลี่ยมจัตุรัสสมบูรณ์ 🟦' },
      { kind: 'end', label: 'จบการทำงาน (End)' },
    ],
  },
  {
    id: 'tpl_game_score',
    patternTag: 'Accumulator (สะสมคะแนน)',
    title: '🎮 เก็บเหรียญสะสมแต้มในเกม',
    gradeTag: 'ป.5–ป.6',
    description: 'รูปแบบสร้างเกมยอดฮิต: กำหนดคะแนนเริ่มต้น ตรวจการชนเหรียญ และบวกแต้ม',
    previewFlow: 'Start ➔ Score=0 ➔ Decision ◇ ➔ Output ➔ End',
    badgeColor: 'bg-violet-100 text-violet-800',
    nodes: [
      { kind: 'start', label: 'เริ่มเกมเก็บเหรียญ Scratch' },
      { kind: 'process', label: 'ตั้งค่าตัวแปร คะแนน = 0' },
      {
        kind: 'decision',
        label: 'ตัวละครแตะเหรียญทองหรือไม่?',
        trueAction: 'เพิ่ม คะแนน = คะแนน + 10 🪙',
        falseAction: 'ขยับตัวละครหาเหรียญต่อ 🏃',
      },
      { kind: 'output', label: 'แสดงคะแนนล่าสุดมุมบนหน้าจอ' },
      { kind: 'end', label: 'จบการทำงาน (End)' },
    ],
  },
  {
    id: 'tpl_iot_sensor',
    patternTag: 'IoT Smart Sensor',
    title: '🌱 รดน้ำต้นไม้อัตโนมัติ Micro:bit',
    gradeTag: 'ป.6 STEM',
    description: 'โครงงานสมองกลฝังตัว: อ่านค่าความชื้นดินแล้วสั่งเปิด/ปิดน้ำอัตโนมัติ',
    previewFlow: 'Start ➔ Sensor ➔ Decision ◇ ➔ LED Output ➔ End',
    badgeColor: 'bg-teal-100 text-teal-800',
    nodes: [
      { kind: 'start', label: 'เปิดระบบสวนอัจฉริยะ Micro:bit' },
      { kind: 'input', label: 'อ่านค่าความชื้นดินจากเซ็นเซอร์' },
      {
        kind: 'decision',
        label: 'ความชื้นดิน < 30% (แห้ง) ?',
        trueAction: 'เปิดปั๊มรดน้ำต้นไม้ 5 วินาที 💧',
        falseAction: 'ดินชุ่มชื้นดีแล้ว พักปั๊มน้ำ 🌿',
      },
      { kind: 'output', label: 'แสดงไอคอนหัวใจบนจอ LED 5×5' },
      { kind: 'end', label: 'จบการทำงาน (End)' },
    ],
  },
  {
    id: 'tpl_if_then_loop',
    patternTag: 'Looping Pattern (If-Then-Else ➔ Repeat)',
    title: '🔀🔁 เงื่อนไข If-Then-Else นำเข้าสู่ลูปทำซ้ำ',
    gradeTag: 'ป.5–ป.6',
    description: 'ตัวอย่างการใช้เงื่อนไข If-Then-Else เลือกรูปแบบก่อนเข้าสู่ Repeat Loop เพื่อทำงานซ้ำอย่างเป็นระบบ',
    previewFlow: 'Start ➔ Input ➔ If-Else ◇ ➔ Repeat ↻ ➔ End',
    badgeColor: 'bg-rose-100 text-rose-800',
    nodes: [
      { kind: 'start', label: 'เริ่มต้นระบบสัญญาณไฟ Micro:bit' },
      { kind: 'input', label: 'รับค่าสถานะปุ่มกดโหมด (Input)' },
      {
        kind: 'decision',
        label: 'If: กดปุ่ม A (โหมดเตือนภัยฉุกเฉิน) หรือไม่?',
        trueAction: 'Then: ตั้งค่า รอบกะพริบ = 5 รอบ, ตัวนับ = 1 ⚡',
        falseAction: 'Else: ตั้งค่า รอบกะพริบ = 2 รอบ, ตัวนับ = 1 💡',
      },
      { kind: 'process', label: 'เข้าสู่ Repeat Loop: ตรวจสอบตัวนับรอบที่ตั้งค่าไว้' },
      {
        kind: 'decision',
        label: 'Repeat Loop: ตัวนับรอบ <= รอบกะพริบ หรือไม่?',
        trueAction: 'เปิดไฟ LED + เสียงเตือน + ตัวนับ = ตัวนับ + 1 ⤴️',
        falseAction: 'กะพริบครบตามจำนวนรอบแล้ว ออกจาก Loop ✅',
      },
      { kind: 'output', label: 'แสดงผล "ส่งสัญญาณครบทุกรอบแล้ว!" บนหน้าจอ' },
      { kind: 'end', label: 'จบการทำงาน (End)' },
    ],
  },
  {
    id: 'tpl_nested_loop',
    patternTag: 'Nested Loop Pattern (ลูปซ้อนลูป)',
    title: '⭐ วาดลายดาวซ้อนกัน (Outer Loop ➔ Inner Loop)',
    gradeTag: 'ป.5–ป.6',
    description: 'ตัวอย่างลูปซ้อนลูป: ลูปนอกนับแถว (Row 1–3) และลูปในวาดดาว ★ แถวละ 4 ดวง รวม 12 ดวง',
    previewFlow: 'Start ➔ Row=1 ➔ Outer ◇ ➔ Inner ◇ ➔ Newline ➔ End',
    badgeColor: 'bg-fuchsia-100 text-fuchsia-800',
    nodes: [
      { kind: 'start', label: 'เริ่มต้นโปรแกรมวาดลายดาว (Nested Loop)', x: 96 },
      { kind: 'process', label: 'กำหนด ลูปนอก: row = 1 (วาดทั้งหมด 3 แถว)', x: 96 },
      {
        kind: 'decision',
        label: 'Outer Loop: row <= 3 (ยังไม่ครบ 3 แถว) ?',
        trueAction: 'เข้าสู่ลูปใน (Inner Loop) เพื่อวาดดาวในแถวนี้',
        falseAction: 'วาดครบทั้ง 3 แถวแล้ว ออกจากลูปนอก 🏁',
        x: 96,
      },
      { kind: 'process', label: '↳ [ลูปใน] กำหนด ลูปใน: col = 1 (แถวละ 4 ดวง)', x: 264 },
      {
        kind: 'decision',
        label: '↳ Inner Loop: col <= 4 (ดาวแถวนี้ครบ 4 ดวงหรือยัง) ?',
        trueAction: 'วาด "★ " ไม่ขึ้นบรรทัดใหม่ + col = col + 1 ⤴️',
        falseAction: 'ครบ 4 ดวงในแถวนี้แล้ว ออกจากลูปใน ↩️',
        x: 264,
      },
      { kind: 'process', label: 'ขึ้นบรรทัดใหม่ + เพิ่ม ลูปนอก: row = row + 1 ⤴️', x: 96 },
      { kind: 'output', label: 'แสดงผลลายดาว 3 แถว × 4 ดวง (รวม 12 ดวง) ⭐', x: 96 },
      { kind: 'end', label: 'จบการทำงาน (End)', x: 96 },
    ],
  },
];

const FlowConnectorLine: React.FC<{
  status: 'idle' | 'flowing' | 'passed';
  compact?: boolean;
}> = ({ status, compact = false }) => {
  const heightClass = compact ? 'h-8' : 'h-9';
  const isFlowing = status === 'flowing';
  const isPassed = status === 'passed';

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-8 ${heightClass} my-0.5 select-none`}
      aria-hidden="true"
    >
      {isFlowing && (
        <span className="absolute inset-y-0.5 w-3.5 rounded-full bg-indigo-400/35 blur-xs animate-pulse" />
      )}

      <svg
        viewBox="0 0 24 36"
        className={`w-6 h-full overflow-visible transition-all duration-300 ${
          isFlowing
            ? 'text-indigo-600 drop-shadow-[0_0_6px_rgba(79,70,229,0.55)] scale-110'
            : isPassed
            ? 'text-emerald-500'
            : 'text-slate-300'
        }`}
        fill="none"
      >
        <line
          x1="12"
          y1="2"
          x2="12"
          y2="27"
          stroke="currentColor"
          strokeOpacity={isFlowing ? 0.3 : 1}
          strokeWidth={isFlowing || isPassed ? 2.8 : 2}
          strokeLinecap="round"
        />

        {isFlowing && (
          <line
            x1="12"
            y1="2"
            x2="12"
            y2="27"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="animate-flowchart-dash"
          />
        )}

        <path
          d="M6.5 23.5L12 31.5L17.5 23.5"
          stroke="currentColor"
          strokeWidth={isFlowing || isPassed ? 2.8 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={isFlowing || isPassed ? 'currentColor' : 'none'}
        />
      </svg>

      {isFlowing && (
        <span className="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-indigo-500 shadow-sm animate-flowchart-dot" />
      )}
    </div>
  );
};

interface SharedFlowchartPayload {
  v: 1;
  m?: string;
  t?: string | null;
  d?: 'visual' | 'text';
  g?: 0 | 1;
  n: Array<{
    k: EditorSymbolKind;
    l: string;
    ta?: string;
    fa?: string;
    x?: number;
    y?: number;
  }>;
}

const VALID_EDITOR_KINDS: ReadonlyArray<EditorSymbolKind> = [
  'start',
  'input',
  'process',
  'decision',
  'output',
  'end',
];

const encodeShareableFlowchart = (payload: SharedFlowchartPayload): string => {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const decodeShareableFlowchart = (
  encoded: string
): {
  nodes: EditorNode[];
  missionId: string;
  templateId: string | null;
  displayMode: 'visual' | 'text';
  snapToGrid: boolean;
} | null => {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((encoded.length + 3) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as Partial<SharedFlowchartPayload>;
    if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.n)) return null;

    const snap = parsed.g !== 0;
    const now = Date.now();
    const rawNodes: EditorNode[] = parsed.n.slice(0, 100).flatMap((item, idx) => {
      if (!item || typeof item !== 'object') return [];
      if (!VALID_EDITOR_KINDS.includes(item.k as EditorSymbolKind)) return [];
      const kind = item.k as EditorSymbolKind;
      return [
        {
          uid: `shared_${now}_${idx}`,
          kind,
          label: typeof item.l === 'string' ? item.l : '',
          ...(typeof item.x === 'number' && Number.isFinite(item.x) ? { x: item.x } : {}),
          ...(typeof item.y === 'number' && Number.isFinite(item.y) ? { y: item.y } : {}),
          ...(kind === 'decision'
            ? {
                trueAction: typeof item.ta === 'string' ? item.ta : '',
                falseAction: typeof item.fa === 'string' ? item.fa : '',
              }
            : {}),
        },
      ];
    });

    if (rawNodes.length === 0) return null;
    const nodes = ensureNodeCoordinates(rawNodes, snap);

    return {
      nodes,
      missionId:
        typeof parsed.m === 'string' && EDITOR_MISSIONS.some((m) => m.id === parsed.m)
          ? parsed.m
          : 'mission_free',
      templateId:
        typeof parsed.t === 'string' && FLOWCHART_TEMPLATES.some((t) => t.id === parsed.t)
          ? parsed.t
          : null,
      displayMode: parsed.d === 'text' ? 'text' : 'visual',
      snapToGrid: snap,
    };
  } catch {
    return null;
  }
};

const readSharedFlowchartFromUrl = () => {
  if (typeof window === 'undefined') return null;
  const fcParam = new URLSearchParams(window.location.search).get('fc');
  if (!fcParam) return null;
  return decodeShareableFlowchart(fcParam);
};

interface FlowchartPythonLine {
  text: string;
  nodeIdx?: number;
}

const stripDecorForPython = (raw: string): string =>
  raw
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

const escapePyDoubleQuote = (raw: string): string =>
  raw.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const buildFlowchartPythonLines = (
  nodes: EditorNode[],
  includeComments: boolean
): FlowchartPythonLine[] => {
  if (nodes.length === 0) {
    return [
      {
        text: '# ลากสัญลักษณ์ลงบนกระดาน เพื่อดูโค้ดภาษาไพทอนแบบเรียลไทม์',
      },
    ];
  }

  const lines: FlowchartPythonLine[] = [];
  const declaredVars = new Set<string>();
  let genericInputCount = 0;
  let outerLoopIndent = '';
  let activeOuterLoopVar: string | null = null;

  if (includeComments) {
    lines.push({ text: '# โค้ดภาษาไพทอนที่แปลงจากผังงาน (Flowchart ➔ Python 3)' });
  }

  const ensureVar = (varName: string, defaultExpr: string, nodeIdx: number, comment?: string) => {
    if (declaredVars.has(varName)) return;
    declaredVars.add(varName);
    lines.push({
      text:
        includeComments && comment
          ? `${varName} = ${defaultExpr}  # ${comment}`
          : `${varName} = ${defaultExpr}`,
      nodeIdx,
    });
  };

  const emitBranchActions = (
    rawAction: string | undefined,
    indent: string,
    nodeIdx: number,
    isLoopBody = false
  ) => {
    const clean = stripDecorForPython(rawAction || '');
    if (!clean) {
      lines.push({ text: `${indent}pass`, nodeIdx });
      return;
    }

    let emittedSomething = false;
    let handledCountInc = false;

    const blinkMatch = clean.match(/รอบกะพริบ\s*=\s*(\d+)/);
    if (blinkMatch) {
      declaredVars.add('blink_limit');
      lines.push({ text: `${indent}blink_limit = ${blinkMatch[1]}`, nodeIdx });
      emittedSomething = true;
    }

    const countSetMatch = clean.match(/ตัวนับ(?:รอบ)?\s*=\s*(\d+)/);
    if (countSetMatch && !/ตัวนับ(?:รอบ)?\s*\+/.test(clean)) {
      declaredVars.add('count');
      lines.push({ text: `${indent}count = ${countSetMatch[1]}`, nodeIdx });
      emittedSomething = true;
    }

    const scoreIncMatch = clean.match(/คะแนน\s*=\s*คะแนน\s*\+\s*(\d+)/);
    if (scoreIncMatch) {
      declaredVars.add('score');
      lines.push({ text: `${indent}score += ${scoreIncMatch[1]}`, nodeIdx });
      emittedSomething = true;
    }

    if (/เปิดพัดลม/.test(clean)) {
      declaredVars.add('fan_on');
      lines.push({ text: `${indent}fan_on = True`, nodeIdx });
      lines.push({ text: `${indent}print("${escapePyDoubleQuote(clean)}")`, nodeIdx });
      emittedSomething = true;
    } else if (/ปิดพัดลม/.test(clean)) {
      declaredVars.add('fan_on');
      lines.push({ text: `${indent}fan_on = False`, nodeIdx });
      lines.push({ text: `${indent}print("${escapePyDoubleQuote(clean)}")`, nodeIdx });
      emittedSomething = true;
    } else if (/เปิดปั๊ม/.test(clean)) {
      declaredVars.add('pump_on');
      lines.push({ text: `${indent}pump_on = True`, nodeIdx });
      lines.push({ text: `${indent}print("${escapePyDoubleQuote(clean)}")`, nodeIdx });
      emittedSomething = true;
    } else if (/พักปั๊ม|ปิดปั๊ม/.test(clean)) {
      declaredVars.add('pump_on');
      lines.push({ text: `${indent}pump_on = False`, nodeIdx });
      lines.push({ text: `${indent}print("${escapePyDoubleQuote(clean)}")`, nodeIdx });
      emittedSomething = true;
    }

    if (
      /ตัวนับ(?:รอบ)?\s*=\s*ตัวนับ(?:รอบ)?\s*\+\s*1|รอบ\s*\+\s*1/.test(clean)
    ) {
      handledCountInc = true;
      if (!emittedSomething) {
        const displayPart = stripDecorForPython(
          clean
            .replace(/ตัวนับ(?:รอบ)?\s*=\s*ตัวนับ(?:รอบ)?\s*\+\s*1/g, '')
            .replace(/รอบ\s*\+\s*1/g, '')
            .replace(/\+\s*$/g, '')
        );
        if (displayPart) {
          lines.push({
            text: declaredVars.has('count')
              ? `${indent}print(f"รอบที่ {count}: ${escapePyDoubleQuote(displayPart)}")`
              : `${indent}print("${escapePyDoubleQuote(displayPart)}")`,
            nodeIdx,
          });
        }
      }
      declaredVars.add('count');
      lines.push({ text: `${indent}count += 1`, nodeIdx });
      emittedSomething = true;
    }

    if (!emittedSomething) {
      const cleanedPrompt = clean.replace(/^(Then:|Else:)\s*/i, '');
      lines.push({
        text: `${indent}print("${escapePyDoubleQuote(cleanedPrompt)}")`,
        nodeIdx,
      });
    }

    if (isLoopBody && !handledCountInc) {
      declaredVars.add('count');
      lines.push({
        text: includeComments
          ? `${indent}count += 1  # เพิ่มตัวนับรอบทีละ 1`
          : `${indent}count += 1`,
        nodeIdx,
      });
    }
  };

  nodes.forEach((node, idx) => {
    const clean = stripDecorForPython(node.label);

    if (node.kind === 'start') {
      if (includeComments) {
        lines.push({
          text: `# [Start] ${clean || 'เริ่มต้นการทำงาน'}`,
          nodeIdx: idx,
        });
      }
      return;
    }

    if (node.kind === 'end') {
      outerLoopIndent = '';
      activeOuterLoopVar = null;
      if (includeComments) {
        lines.push({
          text: `# [End] ${clean || 'จบการทำงาน'}`,
          nodeIdx: idx,
        });
      }
      return;
    }

    if (node.kind === 'input') {
      if (/\bA\b.*\bB\b/i.test(clean)) {
        declaredVars.add('a');
        declaredVars.add('b');
        lines.push({
          text: includeComments
            ? 'a = int(input("กรอกค่า A: "))  # รับข้อมูลตัวเลข A'
            : 'a = int(input("กรอกค่า A: "))',
          nodeIdx: idx,
        });
        lines.push({
          text: includeComments
            ? 'b = int(input("กรอกค่า B: "))  # รับข้อมูลตัวเลข B'
            : 'b = int(input("กรอกค่า B: "))',
          nodeIdx: idx,
        });
      } else if (/อุณหภูมิ|temp/i.test(clean)) {
        declaredVars.add('temp');
        lines.push({
          text: includeComments
            ? 'temp = float(input("กรอกอุณหภูมิห้อง (°C): "))  # รับค่าอุณหภูมิ'
            : 'temp = float(input("กรอกอุณหภูมิห้อง (°C): "))',
          nodeIdx: idx,
        });
      } else if (/ความชื้น|moisture/i.test(clean)) {
        declaredVars.add('moisture');
        lines.push({
          text: includeComments
            ? 'moisture = int(input("อ่านค่าความชื้นดิน (%): "))  # อ่านค่าจากเซ็นเซอร์'
            : 'moisture = int(input("อ่านค่าความชื้นดิน (%): "))',
          nodeIdx: idx,
        });
      } else if (/คะแนน|score/i.test(clean)) {
        declaredVars.add('score');
        lines.push({
          text: 'score = int(input("กรอกคะแนน: "))',
          nodeIdx: idx,
        });
      } else if (/อายุ|age/i.test(clean)) {
        declaredVars.add('age');
        lines.push({
          text: 'age = int(input("กรอกอายุ: "))',
          nodeIdx: idx,
        });
      } else if (/ปุ่ม|button|โหมด/i.test(clean)) {
        declaredVars.add('button_a');
        lines.push({
          text: includeComments
            ? 'button_a = input("กดปุ่ม A หรือไม่? (y/n): ") == "y"  # อ่านค่าปุ่มกด'
            : 'button_a = input("กดปุ่ม A หรือไม่? (y/n): ") == "y"',
          nodeIdx: idx,
        });
      } else if (/เซ็นเซอร์|เคลื่อนไหว|motion/i.test(clean)) {
        declaredVars.add('motion_detected');
        lines.push({
          text: includeComments
            ? 'motion_detected = input("ตรวจพบคนเดินผ่านหรือไม่? (y/n): ") == "y"  # Input จากเซ็นเซอร์'
            : 'motion_detected = input("ตรวจพบคนเดินผ่านหรือไม่? (y/n): ") == "y"',
          nodeIdx: idx,
        });
      } else if (/เตรียม/.test(clean)) {
        declaredVars.add('ingredients_ready');
        lines.push({
          text: includeComments
            ? `ingredients_ready = True  # ${clean}`
            : 'ingredients_ready = True',
          nodeIdx: idx,
        });
      } else {
        genericInputCount += 1;
        const varName = genericInputCount === 1 ? 'user_input' : `user_input_${genericInputCount}`;
        declaredVars.add(varName);
        lines.push({
          text: `${varName} = input("${escapePyDoubleQuote(clean || 'กรอกข้อมูล')}: ")`,
          nodeIdx: idx,
        });
      }
      return;
    }

    if (node.kind === 'process') {
      const ind = outerLoopIndent;
      if (/ผลรวม\s*=\s*A\s*\+\s*B|A\s*\+\s*B/i.test(clean)) {
        ensureVar('a', '0', idx, 'ค่าเริ่มต้น A');
        ensureVar('b', '0', idx, 'ค่าเริ่มต้น B');
        declaredVars.add('total');
        lines.push({
          text: includeComments
            ? `${ind}total = a + b  # ประมวลผลรวมค่า A และ B`
            : `${ind}total = a + b`,
          nodeIdx: idx,
        });
      } else if (/\brow\s*=\s*row\s*\+\s*\d+|\brow\s*\+=\s*\d+/i.test(clean)) {
        const incMatch = clean.match(/\brow\s*(?:=\s*row\s*\+|\+=)\s*(\d+)/i);
        const step = incMatch ? incMatch[1] : '1';
        if (/ขึ้นบรรทัดใหม่/.test(clean)) {
          lines.push({
            text: includeComments
              ? `${ind}print()  # ขึ้นบรรทัดใหม่เมื่อจบ 1 แถว`
              : `${ind}print()`,
            nodeIdx: idx,
          });
        }
        declaredVars.add('row');
        lines.push({
          text: includeComments
            ? `${ind}row += ${step}  # ขยับไปแถวถัดไป (ลูปนอก)`
            : `${ind}row += ${step}`,
          nodeIdx: idx,
        });
        if (activeOuterLoopVar === 'row') {
          outerLoopIndent = '';
          activeOuterLoopVar = null;
        }
      } else if (/\brow\s*=\s*(\d+)/i.test(clean)) {
        const m = clean.match(/\brow\s*=\s*(\d+)/i);
        declaredVars.add('row');
        lines.push({
          text: includeComments
            ? `${ind}row = ${m ? m[1] : '1'}  # กำหนดตัวนับลูปนอก (แถว)`
            : `${ind}row = ${m ? m[1] : '1'}`,
          nodeIdx: idx,
        });
      } else if (/\bcol\s*=\s*(\d+)/i.test(clean)) {
        const m = clean.match(/\bcol\s*=\s*(\d+)/i);
        declaredVars.add('col');
        lines.push({
          text: includeComments
            ? `${ind}col = ${m ? m[1] : '1'}  # รีเซ็ตตัวนับลูปใน (คอลัมน์)`
            : `${ind}col = ${m ? m[1] : '1'}`,
          nodeIdx: idx,
        });
      } else if (/คะแนน\s*=\s*0|score\s*=\s*0/i.test(clean)) {
        declaredVars.add('score');
        lines.push({
          text: includeComments ? `${ind}score = 0  # กำหนดค่าเริ่มต้นตัวแปร` : `${ind}score = 0`,
          nodeIdx: idx,
        });
      } else if (/ตัวนับ(?:รอบ)?\s*=\s*(\d+)/.test(clean)) {
        const m = clean.match(/ตัวนับ(?:รอบ)?\s*=\s*(\d+)/);
        declaredVars.add('count');
        lines.push({
          text: includeComments
            ? `${ind}count = ${m ? m[1] : 1}  # กำหนดค่าตัวนับรอบเริ่มต้น`
            : `${ind}count = ${m ? m[1] : 1}`,
          nodeIdx: idx,
        });
      } else if (/เข้าสู่ Repeat Loop/i.test(clean)) {
        if (includeComments) {
          lines.push({ text: `${ind}# ${clean}`, nodeIdx: idx });
        }
      } else {
        const assignMatch = clean.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
        if (assignMatch) {
          declaredVars.add(assignMatch[1]);
          lines.push({
            text: `${ind}${assignMatch[1]} = ${assignMatch[2]}`,
            nodeIdx: idx,
          });
        } else {
          lines.push({
            text: includeComments
              ? `${ind}print("ขั้นตอน: ${escapePyDoubleQuote(clean || 'ประมวลผล')}")  # Process`
              : `${ind}print("ขั้นตอน: ${escapePyDoubleQuote(clean || 'ประมวลผล')}")`,
            nodeIdx: idx,
          });
        }
      }
      return;
    }

    if (node.kind === 'decision') {
      const ind = outerLoopIndent;
      const isLoop = /repeat|loop|ตัวนับ|รอบ\s*<=|\b(row|col)\s*(<=|<)/i.test(clean);

      if (isLoop) {
        const isOuterRowLoop = /outer loop|\brow\s*(<=|<)/i.test(clean);
        const isInnerColLoop = /inner loop|\bcol\s*(<=|<)/i.test(clean);

        if (isOuterRowLoop) {
          ensureVar('row', '1', idx, 'ตัวนับแถวเริ่มต้น');
          const rowCmp = clean.match(/\brow\s*(<=|<)\s*(\d+)/i);
          const loopCond = rowCmp ? `row ${rowCmp[1]} ${rowCmp[2]}` : 'row <= 3';
          const hasInnerBlockLater = nodes.slice(idx + 1).some((n) =>
            /inner loop|\bcol\b|\brow\s*=\s*row\s*\+|\brow\s*\+=/i.test(n.label)
          );

          lines.push({
            text: includeComments
              ? `${ind}while ${loopCond}:  # ลูปนอก: วนซ้ำตามจำนวนแถว`
              : `${ind}while ${loopCond}:`,
            nodeIdx: idx,
          });

          if (hasInnerBlockLater) {
            outerLoopIndent = '    ';
            activeOuterLoopVar = 'row';
            if (includeComments && node.trueAction) {
              lines.push({
                text: `    # ${stripDecorForPython(node.trueAction)}`,
                nodeIdx: idx,
              });
            }
          } else {
            emitBranchActions(node.trueAction, `${ind}    `, idx, false);
            lines.push({ text: `${ind}    row += 1`, nodeIdx: idx });
          }
          return;
        }

        if (isInnerColLoop) {
          if (!declaredVars.has('col')) {
            declaredVars.add('col');
            lines.push({
              text: includeComments
                ? `${ind}col = 1  # ตัวนับคอลัมน์เริ่มต้น`
                : `${ind}col = 1`,
              nodeIdx: idx,
            });
          }
          const colCmp = clean.match(/\bcol\s*(<=|<)\s*(\d+)/i);
          const loopCond = colCmp ? `col ${colCmp[1]} ${colCmp[2]}` : 'col <= 4';
          lines.push({
            text: includeComments
              ? `${ind}while ${loopCond}:  # ลูปใน: วาดดาวทีละดวงในแถว`
              : `${ind}while ${loopCond}:`,
            nodeIdx: idx,
          });

          const trueClean = stripDecorForPython(node.trueAction || '');
          if (/★|ดาว|ไม่ขึ้นบรรทัดใหม่/.test(trueClean)) {
            lines.push({
              text: `${ind}    print("★", end=" ")`,
              nodeIdx: idx,
            });
            declaredVars.add('col');
            lines.push({ text: `${ind}    col += 1`, nodeIdx: idx });
          } else {
            emitBranchActions(node.trueAction, `${ind}    `, idx, false);
            lines.push({ text: `${ind}    col += 1`, nodeIdx: idx });
          }
          const falseClean = stripDecorForPython(node.falseAction || '');
          if (includeComments && falseClean) {
            lines.push({ text: `${ind}# ${falseClean}`, nodeIdx: idx });
          }
          return;
        }

        ensureVar('count', '1', idx, 'ตัวนับรอบเริ่มต้น');
        let loopCond = 'count <= 4';

        if (/รอบกะพริบ/.test(clean)) {
          ensureVar('blink_limit', '3', idx, 'จำนวนรอบเป้าหมาย');
          loopCond = 'count <= blink_limit';
        } else {
          const cmpMatch = clean.match(/(<=|<)\s*(\d+)/);
          if (cmpMatch) {
            loopCond = `count ${cmpMatch[1]} ${cmpMatch[2]}`;
          }
        }

        lines.push({
          text: includeComments
            ? `${ind}while ${loopCond}:  # วนซ้ำตราบใดที่เงื่อนไขเป็นจริง`
            : `${ind}while ${loopCond}:`,
          nodeIdx: idx,
        });
        emitBranchActions(node.trueAction, `${ind}    `, idx, true);
        const falseClean = stripDecorForPython(node.falseAction || '');
        if (includeComments && falseClean) {
          lines.push({ text: `${ind}# เมื่อเงื่อนไขเป็นเท็จ: ${falseClean}`, nodeIdx: idx });
        }
        return;
      }

      let conditionExpr = 'condition_ok';
      const tempMatch = clean.match(/(?:อุณหภูมิ|temp)[^\d><=]*(>=|<=|>|<|==|!=)\s*(\d+(?:\.\d+)?)/i);
      const moistureMatch = clean.match(/(?:ความชื้น|moisture)[^\d><=]*(>=|<=|>|<|==|!=)\s*(\d+(?:\.\d+)?)/i);
      const scoreMatch = clean.match(/(?:คะแนน|score)[^\d><=]*(>=|<=|>|<|==|!=)\s*(\d+(?:\.\d+)?)/i);
      const asciiCmpMatch = clean.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(>=|<=|>|<|==|!=)\s*(\d+(?:\.\d+)?)/);

      if (tempMatch) {
        ensureVar('temp', '32.0', idx, 'ค่าอุณหภูมิทดสอบ');
        conditionExpr = `temp ${tempMatch[1]} ${tempMatch[2]}`;
      } else if (moistureMatch) {
        ensureVar('moisture', '25', idx, 'ค่าความชื้นทดสอบ');
        conditionExpr = `moisture ${moistureMatch[1]} ${moistureMatch[2]}`;
      } else if (scoreMatch) {
        ensureVar('score', '75', idx, 'ค่าคะแนนทดสอบ');
        conditionExpr = `score ${scoreMatch[1]} ${scoreMatch[2]}`;
      } else if (asciiCmpMatch) {
        ensureVar(asciiCmpMatch[1], '0', idx, 'ค่าเริ่มต้นตัวแปร');
        conditionExpr = `${asciiCmpMatch[1]} ${asciiCmpMatch[2]} ${asciiCmpMatch[3]}`;
      } else if (/ปุ่ม|button/i.test(clean)) {
        ensureVar('button_a', 'True', idx, 'สถานะปุ่ม A');
        conditionExpr = 'button_a';
      } else if (/มีคนเดิน|เคลื่อนไหว|motion/i.test(clean)) {
        ensureVar('motion_detected', 'True', idx, 'สถานะเซ็นเซอร์ตรวจจับคน');
        conditionExpr = 'motion_detected';
      } else if (/เหรียญ|coin/i.test(clean)) {
        ensureVar('touch_coin', 'True', idx, 'สถานะชนเหรียญ');
        conditionExpr = 'touch_coin';
      } else if (/ฝนตก|rain/i.test(clean)) {
        ensureVar('is_raining', 'True', idx, 'สภาพอากาศ');
        conditionExpr = 'is_raining';
      } else {
        ensureVar('condition_ok', 'True', idx, clean || 'เงื่อนไขทดสอบ');
        conditionExpr = 'condition_ok';
      }

      lines.push({
        text: includeComments
          ? `${ind}if ${conditionExpr}:  # ${clean || 'ตรวจสอบเงื่อนไข'}`
          : `${ind}if ${conditionExpr}:`,
        nodeIdx: idx,
      });
      emitBranchActions(node.trueAction, `${ind}    `, idx, false);
      if (node.falseAction && stripDecorForPython(node.falseAction)) {
        lines.push({
          text: includeComments ? `${ind}else:  # กรณีเงื่อนไขเป็นเท็จ` : `${ind}else:`,
          nodeIdx: idx,
        });
        emitBranchActions(node.falseAction, `${ind}    `, idx, false);
      }
      return;
    }

    if (node.kind === 'output') {
      outerLoopIndent = '';
      activeOuterLoopVar = null;
      if (declaredVars.has('total') && /ผลรวม|total/i.test(clean)) {
        lines.push({ text: 'print("ผลรวม =", total)', nodeIdx: idx });
      } else if (declaredVars.has('score') && /คะแนน|score/i.test(clean)) {
        lines.push({ text: 'print("คะแนนล่าสุด:", score)', nodeIdx: idx });
      } else if (declaredVars.has('fan_on') && /พัดลม|fan/i.test(clean)) {
        lines.push({
          text: 'print("สถานะพัดลม:", "เปิด" if fan_on else "ปิด")',
          nodeIdx: idx,
        });
      } else {
        lines.push({
          text: includeComments
            ? `print("${escapePyDoubleQuote(clean || 'แสดงผลลัพธ์')}")  # Output`
            : `print("${escapePyDoubleQuote(clean || 'แสดงผลลัพธ์')}")`,
          nodeIdx: idx,
        });
      }
    }
  });

  return lines;
};

const highlightFlowchartPythonLine = (line: string) => {
  const tokens = line.split(
    /(f?"[^"]*"|'[^']*'|#.*$|\b(?:if|elif|else|for|in|range|while|not|and|or|def|True|False|input|int|float|print)\b)/g
  );

  return (
    <>
      {tokens.map((tok, tIdx) => {
        if (!tok) return null;
        if (tok.startsWith('#')) {
          return (
            <span key={tIdx} className="text-slate-400 italic">
              {tok}
            </span>
          );
        }
        if (/^(if|elif|else|for|in|while|not|and|or|def)$/.test(tok)) {
          return (
            <span key={tIdx} className="text-purple-400 font-semibold">
              {tok}
            </span>
          );
        }
        if (/^(True|False)$/.test(tok)) {
          return (
            <span key={tIdx} className="text-amber-300 font-semibold">
              {tok}
            </span>
          );
        }
        if (/^(range|input|int|float|print)$/.test(tok)) {
          return (
            <span key={tIdx} className="text-sky-300 font-semibold">
              {tok}
            </span>
          );
        }
        if (/^(f?"[^"]*"|'[^']*')$/.test(tok)) {
          return (
            <span key={tIdx} className="text-emerald-300">
              {tok}
            </span>
          );
        }
        return (
          <span key={tIdx} className="text-slate-100">
            {tok}
          </span>
        );
      })}
    </>
  );
};

export const FlowchartGuideView: React.FC<FlowchartGuideViewProps> = ({ addPoints }) => {
  const initialSharedData = React.useMemo(() => readSharedFlowchartFromUrl(), []);
  const editorSectionRef = React.useRef<HTMLDivElement | null>(null);

  const [selectedSymbolId, setSelectedSymbolId] = useState<string>('terminator');
  const [symbolDisplayMode, setSymbolDisplayMode] = useState<'visual' | 'text'>(
    initialSharedData?.displayMode || 'visual'
  );
  const [gradeFilter, setGradeFilter] = useState<'all' | 'ป.4' | 'ป.5' | 'ป.6'>('all');
  const [selectedExampleId, setSelectedExampleId] = useState<string>('p5_exam');

  // Interactive parameters for live simulations
  const [simScore, setSimScore] = useState<number>(75);
  const [simWeather, setSimWeather] = useState<'rain' | 'sunny'>('rain');
  const [simLight, setSimLight] = useState<number>(25);

  // Step-by-step trace state
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  // Drag-and-Drop Flowchart Editor state with Undo/Redo history stack
  const [activeMissionId, setActiveMissionId] = useState<string>(
    initialSharedData?.missionId || 'mission_free'
  );
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(
    initialSharedData?.templateId ?? null
  );
  const [editorHistory, setEditorHistory] = useState<{
    past: EditorNode[][];
    present: EditorNode[];
    future: EditorNode[][];
  }>({
    past: [],
    present:
      initialSharedData?.nodes ||
      ensureNodeCoordinates(
        [
          { uid: 'init_1', kind: 'start', label: 'เริ่มต้น (Start)' },
          { uid: 'init_2', kind: 'process', label: 'ลงมือทำขั้นตอนที่ 1' },
        ],
        true
      ),
    future: [],
  });
  const editorNodes = editorHistory.present;
  const lastTextEditMetaRef = React.useRef<{ key: string; time: number }>({ key: '', time: 0 });
  const canvasInnerRef = React.useRef<HTMLDivElement | null>(null);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(initialSharedData?.snapToGrid ?? true);
  const [nodeHeights, setNodeHeights] = useState<Record<string, number>>({});
  const [draggedPaletteKind, setDraggedPaletteKind] = useState<EditorSymbolKind | null>(null);
  const [paletteDropPreview, setPaletteDropPreview] = useState<{ x: number; y: number } | null>(null);
  const [draggingNodeState, setDraggingNodeState] = useState<{
    uid: string;
    x: number;
    y: number;
    alignX: number | null;
    alignY: number | null;
  } | null>(null);
  const pointerDragRef = React.useRef<{
    uid: string;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
    scaleX: number;
    scaleY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [isCanvasDragOver, setIsCanvasDragOver] = useState<boolean>(false);
  const [editorValidation, setEditorValidation] = useState<{
    valid: boolean;
    message: string;
    tips: string[];
  } | null>(
    initialSharedData
      ? {
          valid: true,
          message: `🔗 เปิดผังงานจากลิงก์ที่แชร์มาเรียบร้อยแล้ว! (${initialSharedData.nodes.length} ขั้นตอน)`,
          tips: ['สามารถแก้ไขข้อความ ลากวางบนตาราง หรือกด "ตรวจ & รันผังงาน" ได้ทันที'],
        }
      : null
  );
  const [editorActiveStep, setEditorActiveStep] = useState<number | null>(null);
  const [editorActiveEdge, setEditorActiveEdge] = useState<number | null>(null);
  const [editorRunPassedCount, setEditorRunPassedCount] = useState<number>(0);
  const [editorIsRunning, setEditorIsRunning] = useState<boolean>(false);
  const [isStepThroughMode, setIsStepThroughMode] = useState<boolean>(false);
  const pythonScrollRef = React.useRef<HTMLDivElement | null>(null);
  const activePythonRowRef = React.useRef<HTMLDivElement | null>(null);
  const [editorRewarded, setEditorRewarded] = useState<boolean>(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [shareableLinkPreview, setShareableLinkPreview] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [showPythonPanel, setShowPythonPanel] = useState<boolean>(true);
  const [showFcPyComments, setShowFcPyComments] = useState<boolean>(true);
  const [fcPyCopied, setFcPyCopied] = useState<boolean>(false);
  const exportFeedbackTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const linkCopiedTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const fcPyCopiedTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRunTokenRef = React.useRef<number>(0);
  const canUndo = editorHistory.past.length > 0 && !editorIsRunning;
  const canRedo = editorHistory.future.length > 0 && !editorIsRunning;

  const CANVAS_ZOOM_STEPS = [
    { percent: 60, className: '[zoom:0.6]' },
    { percent: 75, className: '[zoom:0.75]' },
    { percent: 90, className: '[zoom:0.9]' },
    { percent: 100, className: '[zoom:1]' },
    { percent: 115, className: '[zoom:1.15]' },
    { percent: 130, className: '[zoom:1.3]' },
  ] as const;
  const [canvasZoomIdx, setCanvasZoomIdx] = useState<number>(3);
  const currentZoom = CANVAS_ZOOM_STEPS[canvasZoomIdx] || CANVAS_ZOOM_STEPS[3];
  const canZoomOut = canvasZoomIdx > 0;
  const canZoomIn = canvasZoomIdx < CANVAS_ZOOM_STEPS.length - 1;

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizRewarded, setQuizRewarded] = useState<boolean>(false);
  const [complexQuizAns, setComplexQuizAns] = useState<Record<number, boolean>>({});
  const [complexQuizChecked, setComplexQuizChecked] = useState<boolean>(false);

  const selectedSymbol = FLOWCHART_SYMBOLS.find((s) => s.id === selectedSymbolId) || FLOWCHART_SYMBOLS[0];

  const filteredExamples =
    gradeFilter === 'all' ? FLOWCHART_EXAMPLES : FLOWCHART_EXAMPLES.filter((e) => e.grade === gradeFilter);

  const currentExample =
    FLOWCHART_EXAMPLES.find((e) => e.id === selectedExampleId) || filteredExamples[0] || FLOWCHART_EXAMPLES[0];

  // Build active trace nodes dynamically based on example and interactive parameter
  const getTraceNodes = (ex: FlowchartExample): FlowchartStepNode[] => {
    if (ex.id === 'p4_brush') {
      return [
        { id: '1', shape: 'terminator', text: 'เริ่มต้น (Start)', explanation: 'เริ่มทำภารกิจก่อนนอน' },
        { id: '2', shape: 'process', text: 'บีบยาสีฟันลงบนแปรง', explanation: 'เตรียมแปรงและยาสีฟันขนาดพอเหมาะ' },
        { id: '3', shape: 'process', text: 'แปรงฟันให้สะอาด 2 นาที', explanation: 'แปรงฟันบน-ล่าง ด้านในและด้านนอกให้ทั่ว' },
        { id: '4', shape: 'process', text: 'บ้วนปากและล้างแปรง', explanation: 'ล้างคราบฟองออกให้หมดจด' },
        { id: '5', shape: 'terminator', text: 'จบการทำงาน (End)', explanation: 'เสร็จเรียบร้อย พร้อมเข้านอน!' },
      ];
    }
    if (ex.id === 'p4_noodle') {
      return [
        { id: '1', shape: 'terminator', text: 'เริ่มต้น (Start)', explanation: 'เริ่มต้นขั้นตอนทำอาหารว่าง' },
        { id: '2', shape: 'io', text: 'เตรียมบะหมี่และน้ำสะอาด', explanation: 'Input: นำวัตถุดิบเข้าสู่ขั้นตอนการทำ' },
        { id: '3', shape: 'process', text: 'ต้มน้ำเดือด ใส่เส้น รอ 3 นาที', explanation: 'Process: ใช้ความร้อนปรุงเส้นให้สุก' },
        { id: '4', shape: 'io', text: 'เทใส่ชามพร้อมรับประทาน', explanation: 'Output: ได้บะหมี่ร้อนๆ แสนอร่อย' },
        { id: '5', shape: 'terminator', text: 'จบการทำงาน (End)', explanation: 'สิ้นสุดขั้นตอน ปิดเตาให้ปลอดภัย!' },
      ];
    }
    if (ex.id === 'p5_exam') {
      const passed = simScore >= 50;
      return [
        { id: '1', shape: 'terminator', text: 'เริ่มต้น (Start)', explanation: 'เปิดโปรแกรมตรวจผลคะแนน' },
        { id: '2', shape: 'io', text: `รับค่า คะแนน = ${simScore}`, explanation: `โปรแกรมรับค่าคะแนนของคุณคือ ${simScore} คะแนน` },
        {
          id: '3',
          shape: 'decision',
          text: 'คะแนน >= 50 ?',
          explanation: passed
            ? `ตรวจสอบ: ${simScore} >= 50 เป็น "จริง (ใช่)" -> เดินไปฝั่งใช่`
            : `ตรวจสอบ: ${simScore} >= 50 เป็น "เท็จ (ไม่ใช่)" -> เดินไปฝั่งไม่ใช่`,
        },
        {
          id: '4',
          shape: 'io',
          branchTag: passed ? 'เส้นทาง: ใช่ (True)' : 'เส้นทาง: ไม่ใช่ (False)',
          text: passed ? 'แสดง: "ยินดีด้วย สอบผ่าน!" 🎉' : 'แสดง: "ทบทวนแล้วลองใหม่นะ!" 💪',
          explanation: passed
            ? 'เพราะคะแนนถึงเกณฑ์ 50 จึงแสดงข้อความสอบผ่านบนหน้าจอ'
            : 'เพราะคะแนนยังไม่ถึง 50 จึงแสดงคำแนะนำให้ทบทวนบทเรียน',
        },
        { id: '5', shape: 'terminator', text: 'จบการทำงาน (End)', explanation: 'สิ้นสุดการตรวจคะแนน' },
      ];
    }
    if (ex.id === 'p5_umbrella') {
      const isRain = simWeather === 'rain';
      return [
        { id: '1', shape: 'terminator', text: 'เริ่มต้น (Start)', explanation: 'เตรียมตัวออกจากบ้านไปโรงเรียน' },
        {
          id: '2',
          shape: 'io',
          text: isRain ? 'สังเกตอากาศ: 🌧️ ฝนตก' : 'สังเกตอากาศ: ☀️ แดดออก',
          explanation: isRain ? 'รับข้อมูลว่าตอนนี้ข้างนอกมีฝนตก' : 'รับข้อมูลว่าท้องฟ้าแจ่มใส ไม่มีฝน',
        },
        {
          id: '3',
          shape: 'decision',
          text: 'ฝนตกหรือไม่ ?',
          explanation: isRain
            ? 'เงื่อนไขเป็น "ใช่" -> ต้องเตรียมอุปกรณ์กันฝน'
            : 'เงื่อนไขเป็น "ไม่ใช่" -> ไม่ต้องพกร่ม ใช้หมวกแทน',
        },
        {
          id: '4',
          shape: 'process',
          branchTag: isRain ? 'เส้นทาง: ใช่ (True)' : 'เส้นทาง: ไม่ใช่ (False)',
          text: isRain ? 'หยิบร่มและเสื้อกันฝน ☂️' : 'ใส่หมวกกันแดดออกจากบ้าน 🧢',
          explanation: isRain ? 'กางร่มเพื่อไม่ให้เปียกฝนและไม่เป็นหวัด' : 'เดินทางไปโรงเรียนได้อย่างคล่องตัว',
        },
        { id: '5', shape: 'terminator', text: 'จบการทำงาน (End)', explanation: 'พร้อมออกเดินทางอย่างปลอดภัย!' },
      ];
    }
    if (ex.id === 'p6_water') {
      return [
        { id: '1', shape: 'terminator', text: 'เริ่มต้น (Start)', explanation: 'เปิดสวิตช์หุ่นยนต์ดูแลสวนโรงเรียน' },
        { id: '2', shape: 'process', text: 'กำหนด ต้นที่ = 1', explanation: 'เริ่มนับต้นไม้จากต้นที่ 1' },
        { id: '3', shape: 'decision', text: 'ต้นที่ <= 5 ?', explanation: 'รอบที่ 1–5 เงื่อนไขเป็นจริง -> เข้าไปรดน้ำ' },
        { id: '4', shape: 'process', branchTag: 'ทำซ้ำ Loop (5 รอบ)', text: 'รดน้ำต้นไม้ & บวก ต้นที่ + 1', explanation: 'รดน้ำทีละต้น แล้วเดินวนกลับไปตรวจเงื่อนไขต้นที่ 2, 3, 4, 5' },
        { id: '5', shape: 'io', branchTag: 'เมื่อ ต้นที่ = 6 (ไม่ใช่)', text: 'แสดง: "รดน้ำครบ 5 ต้นแล้ว!" 🌱', explanation: 'หลุดออกจาก Loop เมื่อครบทั้ง 5 ต้น' },
        { id: '6', shape: 'terminator', text: 'จบการทำงาน (End)', explanation: 'หุ่นยนต์พักการทำงาน' },
      ];
    }
    // p6_streetlight
    const isDark = simLight < 50;
    return [
      { id: '1', shape: 'terminator', text: 'เริ่มต้น (Start)', explanation: 'เปิดระบบโคมไฟถนน Micro:bit V2' },
      { id: '2', shape: 'io', text: `อ่านค่าแสง = ${simLight}`, explanation: `เซ็นเซอร์วัดแสงได้ค่าความสว่าง ${simLight} (0=มืดสนิท, 100=สว่างมาก)` },
      {
        id: '3',
        shape: 'decision',
        text: 'แสง < 50 (มืด) ?',
        explanation: isDark
          ? `ค่าแสง ${simLight} < 50 เป็น "จริง" -> ต้องเปิดไฟถนน`
          : `ค่าแสง ${simLight} >= 50 เป็น "เท็จ" -> กลางวันสว่างแล้ว ปิดไฟ`,
      },
      {
        id: '4',
        shape: 'process',
        branchTag: isDark ? 'ใช่ (มืด)' : 'ไม่ใช่ (สว่าง)',
        text: isDark ? 'เปิดหลอดไฟ LED สว่าง 100% 💡' : 'ปิดหลอดไฟ LED ประหยัดไฟ ☀️',
        explanation: isDark ? 'ส่องสว่างช่วยให้ถนนปลอดภัยในเวลากลางคืน' : 'ช่วยประหยัดพลังงานไฟฟ้าในเวลากลางวัน',
      },
      { id: '5', shape: 'process', text: 'วนกลับไปอ่านค่าแสงใหม่ (Forever)', explanation: 'ระบบ IoT ทำงานตรวจสอบวนซ้ำตลอดเวลา' },
    ];
  };

  const traceNodes = getTraceNodes(currentExample);

  useEffect(() => {
    setActiveStepIdx(0);
    setIsAutoPlaying(false);
  }, [selectedExampleId, simScore, simWeather, simLight]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    if (activeStepIdx >= traceNodes.length - 1) {
      setIsAutoPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setActiveStepIdx((prev) => Math.min(traceNodes.length - 1, prev + 1));
    }, 1100);
    return () => clearTimeout(timer);
  }, [isAutoPlaying, activeStepIdx, traceNodes.length]);

  const handleSelectExample = (id: string) => {
    setSelectedExampleId(id);
    setActiveStepIdx(0);
    setIsAutoPlaying(false);
  };

  const handleFilterChange = (g: 'all' | 'ป.4' | 'ป.5' | 'ป.6') => {
    setGradeFilter(g);
    const list = g === 'all' ? FLOWCHART_EXAMPLES : FLOWCHART_EXAMPLES.filter((e) => e.grade === g);
    if (list.length > 0 && !list.some((e) => e.id === selectedExampleId)) {
      setSelectedExampleId(list[0].id);
    }
  };

  const handleAnswerQuiz = (qIdx: number, optIdx: number) => {
    const next = { ...quizAnswers, [qIdx]: optIdx };
    setQuizAnswers(next);
    if (!quizRewarded && Object.keys(next).length === FLOWCHART_QUIZ.length) {
      const score = FLOWCHART_QUIZ.reduce((acc, q, i) => (next[i] === q.correct ? acc + 1 : acc), 0);
      if (score >= 3 && addPoints) {
        setQuizRewarded(true);
        addPoints(20);
      }
    }
  };

  const quizCorrectCount = FLOWCHART_QUIZ.reduce(
    (acc, q, idx) => (quizAnswers[idx] === q.correct ? acc + 1 : acc),
    0
  );

  // ------------------ DRAG-AND-DROP FLOWCHART EDITOR & UNDO/REDO HANDLERS ------------------
  const cloneNodes = (list: EditorNode[]): EditorNode[] => list.map((n) => ({ ...n }));

  const commitEditorNodes = (computeNext: (curr: EditorNode[]) => EditorNode[]) => {
    lastTextEditMetaRef.current = { key: '', time: 0 };
    setIsStepThroughMode(false);
    setEditorActiveStep(null);
    setEditorActiveEdge(null);
    setEditorRunPassedCount(0);
    setEditorHistory((prev) => {
      const next = computeNext(prev.present);
      if (next === prev.present) return prev;
      return {
        past: [...prev.past.slice(-39), cloneNodes(prev.present)],
        present: next,
        future: [],
      };
    });
  };

  const handleUndo = () => {
    if (!canUndo) return;
    lastTextEditMetaRef.current = { key: '', time: 0 };
    setIsStepThroughMode(false);
    setEditorHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      return {
        past: prev.past.slice(0, -1),
        present: previous,
        future: [cloneNodes(prev.present), ...prev.future.slice(0, 39)],
      };
    });
    setEditorValidation(null);
    setEditorActiveStep(null);
    setEditorActiveEdge(null);
    setEditorRunPassedCount(0);
  };

  const handleRedo = () => {
    if (!canRedo) return;
    lastTextEditMetaRef.current = { key: '', time: 0 };
    setIsStepThroughMode(false);
    setEditorHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      return {
        past: [...prev.past.slice(-39), cloneNodes(prev.present)],
        present: next,
        future: prev.future.slice(1),
      };
    });
    setEditorValidation(null);
    setEditorActiveStep(null);
    setEditorActiveEdge(null);
    setEditorRunPassedCount(0);
  };

  const handleZoomOut = () => {
    setCanvasZoomIdx((prev) => Math.max(0, prev - 1));
  };

  const handleZoomIn = () => {
    setCanvasZoomIdx((prev) => Math.min(CANVAS_ZOOM_STEPS.length - 1, prev + 1));
  };

  const handleResetZoom = () => {
    setCanvasZoomIdx(3);
  };

  const handleResetCanvas = () => {
    if (editorIsRunning) return;
    editorRunTokenRef.current += 1;
    commitEditorNodes(() => []);
    setActiveTemplateId(null);
    setActiveMissionId('mission_free');
    setEditorValidation(null);
    setIsStepThroughMode(false);
    setEditorActiveStep(null);
    setEditorActiveEdge(null);
    setEditorRunPassedCount(0);
    setExportFeedback(null);
    setDraggedPaletteKind(null);
    setPaletteDropPreview(null);
    setDraggingNodeState(null);
    pointerDragRef.current = null;
    setIsCanvasDragOver(false);
  };

  const handleToggleSnapToGrid = () => {
    if (editorIsRunning) return;
    const nextSnap = !snapToGrid;
    setSnapToGrid(nextSnap);
    if (nextSnap && editorNodes.length > 0) {
      const hasOffGrid = editorNodes.some((n) => {
        const nx = n.x ?? CENTER_NODE_X;
        const ny = n.y ?? CANVAS_PADDING;
        return nx % CANVAS_GRID_SIZE !== 0 || ny % CANVAS_GRID_SIZE !== 0;
      });
      if (hasOffGrid) {
        commitEditorNodes((prev) => ensureNodeCoordinates(prev, true));
      }
      showExportFeedback(`🧲 เปิดโหมดชิดตาราง (Snap to Grid ${CANVAS_GRID_SIZE}px) แล้ว — บล็อกจะจัดแนวอัตโนมัติ`);
    } else if (!nextSnap) {
      showExportFeedback('✋ ปิดชิดตารางชั่วคราว — ลากวางตำแหน่งอิสระได้');
    }
  };

  const handleTidyAlignCanvas = () => {
    if (editorIsRunning || editorNodes.length === 0) return;
    commitEditorNodes((prev) => layoutNodesTidily(prev, nodeHeights));
    setEditorValidation(null);
    showExportFeedback('✨ จัดเรียงบล็อกทั้งหมดตรงแนวกลางชิดตารางเรียบร้อยแล้ว!');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) {
        return;
      }
      if (!(e.ctrlKey || e.metaKey) || editorIsRunning) return;

      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey && canUndo) {
        e.preventDefault();
        handleUndo();
      } else if (((key === 'z' && e.shiftKey) || (key === 'y' && !e.shiftKey)) && canRedo) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  useEffect(() => {
    if (initialSharedData && editorSectionRef.current) {
      const timer = setTimeout(() => {
        editorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [initialSharedData]);

  useEffect(() => {
    return () => {
      editorRunTokenRef.current += 1;
      if (exportFeedbackTimerRef.current) {
        clearTimeout(exportFeedbackTimerRef.current);
      }
      if (linkCopiedTimerRef.current) {
        clearTimeout(linkCopiedTimerRef.current);
      }
      if (fcPyCopiedTimerRef.current) {
        clearTimeout(fcPyCopiedTimerRef.current);
      }
    };
  }, []);

  // Measure rendered heights of canvas nodes so orthogonal SVG connectors attach cleanly
  useEffect(() => {
    const el = canvasInnerRef.current;
    if (!el) return;
    const nodeEls = el.querySelectorAll<HTMLElement>('[data-flowchart-node-uid]');
    const nextHeights: Record<string, number> = {};
    nodeEls.forEach((nodeEl) => {
      const uid = nodeEl.getAttribute('data-flowchart-node-uid');
      if (uid) {
        nextHeights[uid] = nodeEl.offsetHeight;
      }
    });
    setNodeHeights((prev) => {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(nextHeights);
      if (
        prevKeys.length === nextKeys.length &&
        nextKeys.every((k) => prev[k] === nextHeights[k])
      ) {
        return prev;
      }
      return nextHeights;
    });
  }, [editorNodes, symbolDisplayMode, canvasZoomIdx]);

  // Smooth pointer-based dragging inside the 2D Snap-to-Grid canvas
  useEffect(() => {
    if (!draggingNodeState) return;

    const handlePointerMove = (e: PointerEvent) => {
      const drag = pointerDragRef.current;
      if (!drag) return;
      const dx = (e.clientX - drag.startClientX) / drag.scaleX;
      const dy = (e.clientY - drag.startClientY) / drag.scaleY;
      const raw = clampNodePosition(drag.origX + dx, drag.origY + dy);
      let nextX = snapCoordinate(raw.x, snapToGrid);
      let nextY = snapCoordinate(raw.y, snapToGrid);
      let alignX: number | null = null;
      let alignY: number | null = null;

      for (const other of editorNodes) {
        if (other.uid === drag.uid) continue;
        const ox = other.x ?? CENTER_NODE_X;
        const oy = other.y ?? CANVAS_PADDING;
        if (Math.abs(nextX - ox) <= 8) {
          nextX = ox;
          alignX = ox + NODE_CARD_WIDTH / 2;
        }
        if (Math.abs(nextY - oy) <= 8) {
          nextY = oy;
          alignY = oy;
        }
      }

      const clamped = clampNodePosition(nextX, nextY);
      drag.currentX = clamped.x;
      drag.currentY = clamped.y;
      setDraggingNodeState({
        uid: drag.uid,
        x: clamped.x,
        y: clamped.y,
        alignX,
        alignY,
      });
    };

    const handlePointerUp = () => {
      const drag = pointerDragRef.current;
      pointerDragRef.current = null;
      setDraggingNodeState(null);
      if (!drag) return;
      if (drag.currentX !== drag.origX || drag.currentY !== drag.origY) {
        commitEditorNodes((prev) =>
          prev.map((n) =>
            n.uid === drag.uid ? { ...n, x: drag.currentX, y: drag.currentY } : n
          )
        );
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [draggingNodeState?.uid, snapToGrid, editorNodes]);

  const showExportFeedback = (message: string, shareUrl?: string) => {
    setExportFeedback(message);
    setShareableLinkPreview(shareUrl || null);
    if (exportFeedbackTimerRef.current) {
      clearTimeout(exportFeedbackTimerRef.current);
    }
    exportFeedbackTimerRef.current = setTimeout(() => {
      setExportFeedback(null);
      setShareableLinkPreview(null);
    }, shareUrl ? 8000 : 4000);
  };

  const handleCopyShareLink = async () => {
    if (editorNodes.length === 0 || editorIsRunning || typeof window === 'undefined') return;

    const payload: SharedFlowchartPayload = {
      v: 1,
      ...(activeMissionId !== 'mission_free' ? { m: activeMissionId } : {}),
      ...(activeTemplateId ? { t: activeTemplateId } : {}),
      ...(symbolDisplayMode !== 'visual' ? { d: symbolDisplayMode } : {}),
      g: snapToGrid ? 1 : 0,
      n: editorNodes.map((node) => ({
        k: node.kind,
        l: node.label,
        ...(typeof node.x === 'number' ? { x: node.x } : {}),
        ...(typeof node.y === 'number' ? { y: node.y } : {}),
        ...(node.kind === 'decision'
          ? {
              ta: node.trueAction || '',
              fa: node.falseAction || '',
            }
          : {}),
      })),
    };

    const encoded = encodeShareableFlowchart(payload);
    const url = new URL(window.location.href);
    url.searchParams.set('fc', encoded);
    const shareUrl = url.toString();

    let copied = false;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
      } catch {
        copied = false;
      }
    }

    if (!copied) {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.setAttribute('readonly', '');
      textarea.className = 'fixed -left-[9999px] top-0 opacity-0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        copied = document.execCommand('copy');
      } catch {
        copied = false;
      }
      document.body.removeChild(textarea);
    }

    if (copied) {
      setLinkCopied(true);
      if (linkCopiedTimerRef.current) {
        clearTimeout(linkCopiedTimerRef.current);
      }
      linkCopiedTimerRef.current = setTimeout(() => {
        setLinkCopied(false);
      }, 2500);
      showExportFeedback(
        '🔗 คัดลอกลิงก์แชร์ผังงานเรียบร้อยแล้ว! ส่งลิงก์ให้เพื่อนหรือคุณครูเปิดดูผลงานได้ทันที',
        shareUrl
      );
    } else {
      showExportFeedback(
        '🔗 สร้างลิงก์แชร์ผังงานแล้ว! กดคัดลอกลิงก์ด้านล่างเพื่อนำไปแชร์ได้เลย',
        shareUrl
      );
    }
  };

  const getActiveFlowchartTitle = (): string => {
    if (activeTemplateId) {
      const tpl = FLOWCHART_TEMPLATES.find((t) => t.id === activeTemplateId);
      if (tpl) return tpl.title;
    }
    const mission = EDITOR_MISSIONS.find((m) => m.id === activeMissionId);
    if (mission && activeMissionId !== 'mission_free') {
      return mission.title;
    }
    return 'ผังงานของฉัน (My Flowchart)';
  };

  const getExportFileBaseName = (): string => {
    const now = new Date();
    const dateStamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(
      2,
      '0'
    )}`;
    const sourceTag = activeTemplateId || (activeMissionId !== 'mission_free' ? activeMissionId : 'custom');
    return `flowchart-${sourceTag}-${dateStamp}`;
  };

  const triggerFileDownload = (href: string, filename: string, shouldRevoke: boolean) => {
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (shouldRevoke) {
      setTimeout(() => URL.revokeObjectURL(href), 1000);
    }
  };

  const handleExportJson = () => {
    if (editorNodes.length === 0 || editorIsRunning) return;
    const payload = {
      app: 'FlowchartGuideEditor',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      title: getActiveFlowchartTitle(),
      missionId: activeMissionId,
      templateId: activeTemplateId,
      snapToGrid,
      gridSize: CANVAS_GRID_SIZE,
      nodeCount: editorNodes.length,
      nodes: editorNodes.map((n, index) => ({
        step: index + 1,
        kind: n.kind,
        label: n.label,
        position: {
          x: n.x ?? CENTER_NODE_X,
          y: n.y ?? CANVAS_PADDING,
        },
        ...(n.kind === 'decision'
          ? {
              trueAction: n.trueAction || '',
              falseAction: n.falseAction || '',
            }
          : {}),
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    triggerFileDownload(url, `${getExportFileBaseName()}.json`, true);
    showExportFeedback('✅ บันทึกไฟล์ผังงาน (.json) ลงอุปกรณ์เรียบร้อยแล้ว!');
  };

  const splitGraphemes = (text: string): string[] => {
    const IntlWithSegmenter = Intl as typeof Intl & {
      Segmenter?: new (
        locales?: string | string[],
        options?: { granularity?: 'grapheme' | 'word' | 'sentence' }
      ) => { segment: (input: string) => Iterable<{ segment: string }> };
    };
    if (typeof IntlWithSegmenter.Segmenter === 'function') {
      const segmenter = new IntlWithSegmenter.Segmenter('th', { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text), (s) => s.segment);
    }
    return Array.from(text);
  };

  const wrapCanvasText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] => {
    const cleanText = (text || '').trim();
    if (!cleanText) return ['(ยังไม่ได้ระบุข้อความ)'];

    const words = cleanText.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    const pushSegmentByChars = (segment: string) => {
      const chars = splitGraphemes(segment);
      for (const ch of chars) {
        const candidate = currentLine + ch;
        if (ctx.measureText(candidate).width <= maxWidth || !currentLine) {
          currentLine = candidate;
        } else {
          lines.push(currentLine);
          currentLine = ch;
        }
      }
    };

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        currentLine = candidate;
      } else if (ctx.measureText(word).width <= maxWidth) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        if (currentLine) {
          currentLine += ' ';
        }
        pushSegmentByChars(word);
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.length > 0 ? lines : [' '];
  };

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const handleExportImage = () => {
    if (editorNodes.length === 0 || editorIsRunning) return;

    const canvasWidth = 840;
    const outerPad = 36;
    const cardWidth = 580;
    const cardX = (canvasWidth - cardWidth) / 2;
    const textInnerWidth = cardWidth - 52;
    const branchWidth = (cardWidth - 44 - 14) / 2;
    const branchTextWidth = branchWidth - 20;
    const arrowHeight = 36;
    const headerHeight = 104;
    const footerHeight = 52;
    const fontStack = '"Noto Sans Thai", "Sarabun", system-ui, -apple-system, sans-serif';

    const measureCanvas = document.createElement('canvas');
    const mCtx = measureCanvas.getContext('2d');
    if (!mCtx) return;

    interface MeasuredNodeLayout {
      node: EditorNode;
      kindTitle: string;
      labelLines: string[];
      trueLines: string[];
      falseLines: string[];
      branchBoxHeight: number;
      height: number;
    }

    const layouts: MeasuredNodeLayout[] = editorNodes.map((node) => {
      const paletteMeta = EDITOR_PALETTE.find((p) => p.kind === node.kind);
      const kindTitle =
        symbolDisplayMode === 'visual'
          ? paletteMeta?.visualName || node.kind
          : paletteMeta?.nameTh || node.kind;

      mCtx.font = `700 16px ${fontStack}`;
      const labelLines = wrapCanvasText(mCtx, node.label, textInnerWidth);

      let trueLines: string[] = [];
      let falseLines: string[] = [];
      let branchBoxHeight = 0;

      if (node.kind === 'decision') {
        mCtx.font = `600 13px ${fontStack}`;
        trueLines = wrapCanvasText(mCtx, node.trueAction || 'ทำคำสั่งฝั่งใช่', branchTextWidth);
        falseLines = wrapCanvasText(mCtx, node.falseAction || 'ทำคำสั่งฝั่งไม่ใช่', branchTextWidth);
        const maxBranchLines = Math.max(trueLines.length, falseLines.length);
        branchBoxHeight = 28 + maxBranchLines * 18 + 10;
      }

      const labelBlockHeight = labelLines.length * 22;
      const baseHeight = 20 + 22 + 8 + labelBlockHeight + 18;
      const height =
        node.kind === 'decision' ? baseHeight + 12 + branchBoxHeight : Math.max(82, baseHeight);

      return {
        node,
        kindTitle,
        labelLines,
        trueLines,
        falseLines,
        branchBoxHeight,
        height,
      };
    });

    const nodesTotalHeight =
      layouts.reduce((sum, item) => sum + item.height, 0) +
      Math.max(0, layouts.length - 1) * arrowHeight;
    const totalHeight = outerPad + headerHeight + nodesTotalHeight + footerHeight + outerPad;

    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth * scale;
    canvas.height = totalHeight * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvasWidth, totalHeight);

    // Outer frame
    drawRoundedRect(ctx, 18, 18, canvasWidth - 36, totalHeight - 36, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    // Header
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#4f46e5';
    ctx.font = `700 12px ${fontStack}`;
    ctx.fillText('FLOWCHART BUILDER EXPORT', outerPad + 12, outerPad);

    ctx.fillStyle = '#0f172a';
    ctx.font = `700 20px ${fontStack}`;
    const titleLines = wrapCanvasText(ctx, getActiveFlowchartTitle(), canvasWidth - outerPad * 2 - 24);
    ctx.fillText(titleLines[0] || 'ผังงานของฉัน', outerPad + 12, outerPad + 22);

    ctx.fillStyle = '#64748b';
    ctx.font = `500 13px ${fontStack}`;
    ctx.fillText(
      `จำนวนทั้งหมด ${editorNodes.length} ขั้นตอน · สร้างจากห้องต่อบล็อกผังงาน`,
      outerPad + 12,
      outerPad + 54
    );

    // Header divider
    ctx.beginPath();
    ctx.moveTo(outerPad + 12, outerPad + 84);
    ctx.lineTo(canvasWidth - outerPad - 12, outerPad + 84);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw nodes
    let cursorY = outerPad + headerHeight;

    layouts.forEach((item, idx) => {
      const { node, kindTitle, labelLines, trueLines, falseLines, branchBoxHeight, height } = item;

      let fill = '#ffffff';
      let stroke = '#6366f1';
      let badgeTextColor = '#4338ca';
      let textColor = '#0f172a';
      let cornerRadius = 14;
      let isDashed = false;

      if (node.kind === 'start' || node.kind === 'end') {
        fill = '#fff1f2';
        stroke = '#fb7185';
        badgeTextColor = '#be123c';
        textColor = '#881337';
        cornerRadius = height / 2;
      } else if (node.kind === 'decision') {
        fill = '#fffbeb';
        stroke = '#f59e0b';
        badgeTextColor = '#b45309';
        textColor = '#78350f';
        cornerRadius = 18;
        isDashed = true;
      } else if (node.kind === 'input' || node.kind === 'output') {
        fill = '#f0f9ff';
        stroke = '#38bdf8';
        badgeTextColor = '#0369a1';
        textColor = '#0c4a6e';
        cornerRadius = 14;
      }

      ctx.save();
      drawRoundedRect(ctx, cardX, cursorY, cardWidth, height, cornerRadius);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = stroke;
      if (isDashed) {
        ctx.setLineDash([7, 5]);
      }
      ctx.stroke();
      ctx.restore();

      // Badge line (#idx · kindTitle)
      ctx.fillStyle = badgeTextColor;
      ctx.font = `700 12px ${fontStack}`;
      const badgeX = node.kind === 'start' || node.kind === 'end' ? cardX + 34 : cardX + 22;
      ctx.fillText(`#${idx + 1} · ${kindTitle}`, badgeX, cursorY + 16);

      // Shape mini symbol on top-right
      ctx.save();
      const iconRightX = node.kind === 'start' || node.kind === 'end' ? cardX + cardWidth - 40 : cardX + cardWidth - 28;
      const iconCenterY = cursorY + 23;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.8;
      if (node.kind === 'start' || node.kind === 'end') {
        drawRoundedRect(ctx, iconRightX - 14, iconCenterY - 7, 28, 14, 7);
        ctx.stroke();
      } else if (node.kind === 'decision') {
        ctx.beginPath();
        ctx.moveTo(iconRightX, iconCenterY - 9);
        ctx.lineTo(iconRightX + 11, iconCenterY);
        ctx.lineTo(iconRightX, iconCenterY + 9);
        ctx.lineTo(iconRightX - 11, iconCenterY);
        ctx.closePath();
        ctx.stroke();
      } else if (node.kind === 'input' || node.kind === 'output') {
        ctx.beginPath();
        ctx.moveTo(iconRightX - 10, iconCenterY - 7);
        ctx.lineTo(iconRightX + 14, iconCenterY - 7);
        ctx.lineTo(iconRightX + 8, iconCenterY + 7);
        ctx.lineTo(iconRightX - 16, iconCenterY + 7);
        ctx.closePath();
        ctx.stroke();
      } else {
        ctx.strokeRect(iconRightX - 13, iconCenterY - 7, 26, 14);
      }
      ctx.restore();

      // Main label text
      ctx.fillStyle = textColor;
      ctx.font = `700 16px ${fontStack}`;
      labelLines.forEach((line, lineIdx) => {
        ctx.fillText(line, badgeX, cursorY + 42 + lineIdx * 22);
      });

      // Decision True / False branch boxes
      if (node.kind === 'decision') {
        const branchY = cursorY + 42 + labelLines.length * 22 + 10;
        const leftBranchX = cardX + 22;
        const rightBranchX = leftBranchX + branchWidth + 14;

        // True branch
        drawRoundedRect(ctx, leftBranchX, branchY, branchWidth, branchBoxHeight, 10);
        ctx.fillStyle = '#ecfdf5';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#6ee7b7';
        ctx.stroke();

        ctx.fillStyle = '#047857';
        ctx.font = `700 11px ${fontStack}`;
        ctx.fillText('✔️ ถ้า ใช่ (True):', leftBranchX + 10, branchY + 8);
        ctx.fillStyle = '#064e3b';
        ctx.font = `600 13px ${fontStack}`;
        trueLines.forEach((line, lIdx) => {
          ctx.fillText(line, leftBranchX + 10, branchY + 26 + lIdx * 18);
        });

        // False branch
        drawRoundedRect(ctx, rightBranchX, branchY, branchWidth, branchBoxHeight, 10);
        ctx.fillStyle = '#fff1f2';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#fda4af';
        ctx.stroke();

        ctx.fillStyle = '#be123c';
        ctx.font = `700 11px ${fontStack}`;
        ctx.fillText('❌ ถ้า ไม่ใช่ (False):', rightBranchX + 10, branchY + 8);
        ctx.fillStyle = '#881337';
        ctx.font = `600 13px ${fontStack}`;
        falseLines.forEach((line, lIdx) => {
          ctx.fillText(line, rightBranchX + 10, branchY + 26 + lIdx * 18);
        });
      }

      // Connector arrow to next node
      if (idx < layouts.length - 1) {
        const arrowStartX = canvasWidth / 2;
        const arrowStartY = cursorY + height + 2;
        const arrowEndY = cursorY + height + arrowHeight - 4;

        ctx.beginPath();
        ctx.moveTo(arrowStartX, arrowStartY);
        ctx.lineTo(arrowStartX, arrowEndY - 6);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(arrowStartX, arrowEndY);
        ctx.lineTo(arrowStartX - 6, arrowEndY - 9);
        ctx.lineTo(arrowStartX + 6, arrowEndY - 9);
        ctx.closePath();
        ctx.fillStyle = '#64748b';
        ctx.fill();
      }

      cursorY += height + arrowHeight;
    });

    // Footer timestamp
    const exportedTime = new Date().toLocaleString('th-TH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    ctx.fillStyle = '#94a3b8';
    ctx.font = `500 11px ${fontStack}`;
    ctx.fillText(`ส่งออกเมื่อ: ${exportedTime}`, outerPad + 12, totalHeight - outerPad - 18);

    const filename = `${getExportFileBaseName()}.png`;
    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          triggerFileDownload(url, filename, true);
        } else {
          triggerFileDownload(canvas.toDataURL('image/png'), filename, false);
        }
        showExportFeedback('🖼️ ดาวน์โหลดรูปภาพผังงาน (.png) เรียบร้อยแล้ว!');
      }, 'image/png');
    } else {
      triggerFileDownload(canvas.toDataURL('image/png'), filename, false);
      showExportFeedback('🖼️ ดาวน์โหลดรูปภาพผังงาน (.png) เรียบร้อยแล้ว!');
    }
  };

  const createEditorNode = (
    kind: EditorSymbolKind,
    pos?: { x: number; y: number }
  ): EditorNode => {
    const meta = EDITOR_PALETTE.find((p) => p.kind === kind) || EDITOR_PALETTE[2];
    const clamped = clampNodePosition(
      snapCoordinate(pos?.x ?? CENTER_NODE_X, snapToGrid),
      snapCoordinate(pos?.y ?? CANVAS_PADDING, snapToGrid)
    );
    return {
      uid: `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      kind,
      label: meta.defaultLabel,
      x: clamped.x,
      y: clamped.y,
      ...(kind === 'decision'
        ? { trueAction: 'ทำคำสั่งฝั่งใช่ ✅', falseAction: 'ทำคำสั่งฝั่งไม่ใช่ ❌' }
        : {}),
    };
  };

  const getLogicalCanvasPoint = (clientX: number, clientY: number): { x: number; y: number } => {
    const el = canvasInnerRef.current;
    if (!el) return { x: CENTER_NODE_X + NODE_CARD_WIDTH / 2, y: CANVAS_PADDING + 48 };
    const rect = el.getBoundingClientRect();
    const scaleX = rect.width / CANVAS_LOGICAL_WIDTH || 1;
    const scaleY = el.offsetHeight > 0 ? rect.height / el.offsetHeight : scaleX;
    return {
      x: (clientX - rect.left) / scaleX,
      y: (clientY - rect.top) / scaleY,
    };
  };

  const getSnappedDropPositionFromPointer = (clientX: number, clientY: number) => {
    const pt = getLogicalCanvasPoint(clientX, clientY);
    const rawX = pt.x - NODE_CARD_WIDTH / 2;
    const rawY = pt.y - 44;
    const snappedX = snapCoordinate(rawX, snapToGrid);
    const snappedY = snapCoordinate(rawY, snapToGrid);
    return clampNodePosition(snappedX, snappedY);
  };

  const addNodeToCanvas = (kind: EditorSymbolKind, dropPos?: { x: number; y: number }) => {
    if (editorIsRunning) return;
    commitEditorNodes((prev) => {
      let targetPos = dropPos;
      if (!targetPos) {
        if (prev.length === 0) {
          targetPos = { x: CENTER_NODE_X, y: CANVAS_PADDING };
        } else {
          const last = prev[prev.length - 1];
          const maxBottom = prev.reduce((max, n) => {
            const h = nodeHeights[n.uid] || getEstimatedNodeHeight(n.kind);
            return Math.max(max, (n.y ?? CANVAS_PADDING) + h);
          }, CANVAS_PADDING);
          targetPos = {
            x: snapCoordinate(last.x ?? CENTER_NODE_X, snapToGrid),
            y: snapCoordinate(maxBottom + CONNECTOR_VERTICAL_GAP, snapToGrid),
          };
        }
      }
      const newNode = createEditorNode(kind, targetPos);
      return [...prev, newNode];
    });
    setEditorValidation(null);
  };

  const updateNodeWithGroupedHistory = (
    editKey: string,
    computeNext: (curr: EditorNode[]) => EditorNode[]
  ) => {
    const now = Date.now();
    const isSameBurst =
      lastTextEditMetaRef.current.key === editKey && now - lastTextEditMetaRef.current.time < 1000;
    lastTextEditMetaRef.current = { key: editKey, time: now };

    setIsStepThroughMode(false);
    setEditorActiveStep(null);
    setEditorActiveEdge(null);
    setEditorRunPassedCount(0);
    setEditorHistory((prev) => {
      const next = computeNext(prev.present);
      if (isSameBurst) {
        return { ...prev, present: next, future: [] };
      }
      return {
        past: [...prev.past.slice(-39), cloneNodes(prev.present)],
        present: next,
        future: [],
      };
    });
  };

  const updateNodeLabel = (uid: string, label: string) => {
    updateNodeWithGroupedHistory(`label:${uid}`, (prev) =>
      prev.map((n) => (n.uid === uid ? { ...n, label } : n))
    );
  };

  const updateDecisionBranch = (uid: string, branch: 'trueAction' | 'falseAction', val: string) => {
    updateNodeWithGroupedHistory(`${branch}:${uid}`, (prev) =>
      prev.map((n) => (n.uid === uid ? { ...n, [branch]: val } : n))
    );
  };

  const removeEditorNode = (uid: string) => {
    if (editorIsRunning) return;
    commitEditorNodes((prev) => prev.filter((n) => n.uid !== uid));
    setEditorValidation(null);
  };

  const moveEditorNode = (index: number, direction: 'up' | 'down') => {
    if (editorIsRunning) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= editorNodes.length) return;
    commitEditorNodes((prev) => {
      const copy = [...prev];
      const aPos = { x: copy[index].x, y: copy[index].y };
      const bPos = { x: copy[target].x, y: copy[target].y };
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      // Swap grid positions so visual top-to-bottom layout stays tidy with step order
      if (typeof aPos.x === 'number' && typeof aPos.y === 'number' && typeof bPos.x === 'number' && typeof bPos.y === 'number') {
        const swappedA = direction === 'up' ? index - 1 : index + 1;
        const swappedB = index;
        copy[swappedA] = { ...copy[swappedA], x: bPos.x, y: bPos.y };
        copy[swappedB] = { ...copy[swappedB], x: aPos.x, y: aPos.y };
      }
      return copy;
    });
    setEditorValidation(null);
  };

  const loadEditorMission = (missionId: string) => {
    if (editorIsRunning) return;
    const found = EDITOR_MISSIONS.find((m) => m.id === missionId);
    if (!found) return;
    setActiveMissionId(missionId);
    setActiveTemplateId(null);
    commitEditorNodes(() =>
      layoutNodesTidily(
        found.starterNodes.map((n, idx) => ({
          ...n,
          uid: `mission_${missionId}_${idx}_${Date.now()}`,
        }))
      )
    );
    setEditorValidation(null);
    setIsStepThroughMode(false);
    setEditorActiveStep(null);
    setEditorActiveEdge(null);
    setEditorRunPassedCount(0);
    setEditorIsRunning(false);
  };

  const loadFlowchartTemplate = (templateId: string) => {
    if (editorIsRunning) return;
    const tpl = FLOWCHART_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setActiveTemplateId(templateId);
    setActiveMissionId('mission_free');
    commitEditorNodes(() =>
      layoutNodesTidily(
        tpl.nodes.map((n, idx) => ({
          ...n,
          uid: `tpl_${templateId}_${idx}_${Date.now()}`,
        })),
        undefined,
        true
      )
    );
    setIsStepThroughMode(false);
    setEditorActiveStep(null);
    setEditorValidation({
      valid: true,
      message: `✨ โหลดแม่แบบ "${tpl.patternTag}" ลงกระดานเรียบร้อยแล้ว! ลองแก้ไขข้อความ ลากจัดวางบนตาราง กด "ทีละขั้น (Next)" หรือ "ตรวจ & รันผังงาน" ได้เลย`,
      tips: [`โครงสร้างแม่แบบ: ${tpl.previewFlow}`],
    });
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCanvasDragOver(false);

    if (draggedPaletteKind) {
      const pos = paletteDropPreview || getSnappedDropPositionFromPointer(e.clientX, e.clientY);
      addNodeToCanvas(draggedPaletteKind, pos);
      setDraggedPaletteKind(null);
      setPaletteDropPreview(null);
    }
  };

  const handleNodePointerDown = (e: React.PointerEvent, node: EditorNode) => {
    if (editorIsRunning || e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (
      target?.closest('input, textarea, button, select, a, [data-no-drag="true"]')
    ) {
      return;
    }
    e.preventDefault();
    const el = canvasInnerRef.current;
    const rect = el?.getBoundingClientRect();
    const scaleX = rect && rect.width > 0 ? rect.width / CANVAS_LOGICAL_WIDTH : 1;
    const scaleY =
      rect && el && el.offsetHeight > 0 ? rect.height / el.offsetHeight : scaleX;
    const origX = node.x ?? CENTER_NODE_X;
    const origY = node.y ?? CANVAS_PADDING;

    pointerDragRef.current = {
      uid: node.uid,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX,
      origY,
      scaleX,
      scaleY,
      currentX: origX,
      currentY: origY,
    };
    setDraggingNodeState({
      uid: node.uid,
      x: origX,
      y: origY,
      alignX: null,
      alignY: null,
    });
  };

  const collectFlowchartValidationTips = (nodes: EditorNode[]): string[] => {
    const tips: string[] = [];
    if (nodes[0]?.kind !== 'start') {
      tips.push('กล่องแรกสุดควรเป็น "จุดเริ่มต้น (Start)" รูปวงรีครับ');
    }
    if (nodes[nodes.length - 1]?.kind !== 'end') {
      tips.push('กล่องสุดท้ายควรเป็น "จุดสิ้นสุด (End)" รูปวงรีครับ');
    }
    const middleNodes = nodes.slice(1, -1);
    if (nodes.length < 3 || middleNodes.length === 0) {
      tips.push('ควรมีขั้นตอนการทำงาน (Process / Input / Decision / Output) อย่างน้อย 1 กล่องระหว่างจุดเริ่มต้นและสิ้นสุด');
    }
    if (activeMissionId === 'mission_door' && !nodes.some((n) => n.kind === 'decision')) {
      tips.push('ภารกิจประตูอัตโนมัติต้องมีกล่อง "ตรวจสอบเงื่อนไข (Decision ◇)" ด้วยนะครับ');
    }
    return tips;
  };

  const finalizeTraceValidation = (tips: string[], isManualStep: boolean) => {
    if (tips.length === 0) {
      setEditorValidation({
        valid: true,
        message: isManualStep
          ? `🎉 แกะรอยทีละขั้นจนจบครบทั้ง ${editorNodes.length} ขั้นตอนแล้ว! โครงสร้างผังงานถูกต้องตามกฎทอง`
          : `🎉 ยอดเยี่ยมมาก! ผังงานของคุณมีโครงสร้างถูกต้องตามกฎทองครบทุกข้อ (ทั้งหมด ${editorNodes.length} ขั้นตอน)`,
        tips: ['ลองบันทึกภาพหน้าจอ คัดลอกโค้ด Python ไปรัน หรืออธิบายลำดับขั้นให้เพื่อนฟังได้เลย!'],
      });
      if (!editorRewarded && addPoints) {
        setEditorRewarded(true);
        addPoints(25);
      }
    } else {
      setEditorValidation({
        valid: false,
        message: isManualStep
          ? 'แกะรอยครบทุกกล่องแล้ว แต่ยังปรับให้สมบูรณ์ตามกฎ Flowchart ได้อีกนิดนะ:'
          : 'ผังงานรันจบแล้ว แต่ยังปรับให้สมบูรณ์ตามกฎ Flowchart ได้อีกนิดนะ:',
        tips,
      });
    }
  };

  useEffect(() => {
    if (editorActiveStep === null) return;
    const container = pythonScrollRef.current;
    const activeRow = activePythonRowRef.current;
    if (!container || !activeRow) return;
    const targetTop = activeRow.offsetTop - container.clientHeight / 2 + activeRow.clientHeight / 2;
    container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
  }, [editorActiveStep]);

  const handleResetStepThrough = () => {
    setIsStepThroughMode(false);
    setEditorActiveStep(null);
    setEditorActiveEdge(null);
    setEditorRunPassedCount(0);
  };

  const handleStepThroughNext = () => {
    if (editorIsRunning) return;
    if (editorNodes.length === 0) {
      setEditorValidation({
        valid: false,
        message: 'ผังงานยังว่างอยู่เลย! ลองลากสัญลักษณ์จากด้านซ้ายมาวางบนกระดานก่อนนะครับ',
        tips: ['ต้องมีจุดเริ่มต้น (Start) และจุดสิ้นสุด (End)'],
      });
      return;
    }

    setShowPythonPanel(true);

    if (!isStepThroughMode || editorActiveStep === null) {
      setIsStepThroughMode(true);
      setEditorValidation(null);
      setEditorActiveStep(0);
      setEditorActiveEdge(null);
      setEditorRunPassedCount(0);
      return;
    }

    const nextIdx = editorActiveStep + 1;
    if (nextIdx < editorNodes.length) {
      setEditorActiveStep(nextIdx);
      setEditorActiveEdge(nextIdx - 1);
      setEditorRunPassedCount(Math.max(0, nextIdx - 1));
      return;
    }

    const tips = collectFlowchartValidationTips(editorNodes);
    setIsStepThroughMode(false);
    setEditorActiveStep(null);
    setEditorActiveEdge(null);
    setEditorRunPassedCount(0);
    finalizeTraceValidation(tips, true);
  };

  const validateAndRunEditorFlowchart = async () => {
    if (editorIsRunning) return;

    if (editorNodes.length === 0) {
      setEditorValidation({
        valid: false,
        message: 'ผังงานยังว่างอยู่เลย! ลองลากสัญลักษณ์จากด้านซ้ายมาวางบนกระดานก่อนนะครับ',
        tips: ['ต้องมีจุดเริ่มต้น (Start) และจุดสิ้นสุด (End)'],
      });
      return;
    }

    const tips = collectFlowchartValidationTips(editorNodes);

    // Run step-by-step highlight & animated connection flow through student's logic chain
    const runToken = ++editorRunTokenRef.current;
    setIsStepThroughMode(false);
    setEditorIsRunning(true);
    setEditorValidation(null);
    setEditorActiveEdge(null);
    setEditorRunPassedCount(0);

    for (let i = 0; i < editorNodes.length; i++) {
      if (editorRunTokenRef.current !== runToken) return;
      setEditorActiveStep(i);
      setEditorActiveEdge(null);
      await new Promise((resolve) => setTimeout(resolve, 380));
      if (editorRunTokenRef.current !== runToken) return;

      if (i < editorNodes.length - 1) {
        setEditorActiveEdge(i);
        await new Promise((resolve) => setTimeout(resolve, 380));
        if (editorRunTokenRef.current !== runToken) return;
        setEditorRunPassedCount(i + 1);
      }
    }

    if (editorRunTokenRef.current !== runToken) return;
    setEditorActiveEdge(null);
    setEditorActiveStep(null);
    setEditorIsRunning(false);
    finalizeTraceValidation(tips, false);
  };

  const renderFlowNodeBox = (node: FlowchartStepNode, idx: number) => {
    const isCurrent = idx === activeStepIdx;
    const isPassed = idx < activeStepIdx;
    const connectorStatus: 'idle' | 'flowing' | 'passed' = isPassed
      ? 'passed'
      : isCurrent && idx < traceNodes.length - 1 && (isAutoPlaying || activeStepIdx > 0)
      ? 'flowing'
      : 'idle';

    let shapeClass = 'rounded-xl';
    let borderBg = isCurrent
      ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg ring-4 ring-indigo-200 scale-[1.03]'
      : isPassed
      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
      : 'bg-white text-slate-800 border-slate-300';

    if (node.shape === 'terminator') {
      shapeClass = 'rounded-full px-6';
      if (!isCurrent && !isPassed) borderBg = 'bg-rose-50 text-rose-900 border-rose-300';
    } else if (node.shape === 'decision') {
      shapeClass = 'rounded-2xl border-2 border-dashed';
      if (!isCurrent && !isPassed) borderBg = 'bg-amber-50 text-amber-900 border-amber-400';
    } else if (node.shape === 'io') {
      shapeClass = 'rounded-xl -skew-x-6';
      if (!isCurrent && !isPassed) borderBg = 'bg-sky-50 text-sky-900 border-sky-300';
    }

    return (
      <div key={node.id} className="flex flex-col items-center w-full">
        {node.branchTag && (
          <span className="mb-1 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
            {node.branchTag}
          </span>
        )}
        <button
          onClick={() => {
            setIsAutoPlaying(false);
            setActiveStepIdx(idx);
          }}
          className={`w-full max-w-xs py-2.5 px-4 border-2 text-center transition-all cursor-pointer ${shapeClass} ${borderBg}`}
        >
          <div className={node.shape === 'io' ? 'skew-x-6' : ''}>
            <div className="text-[10px] font-bold opacity-75 uppercase tracking-wider mb-0.5">
              {symbolDisplayMode === 'visual' ? (
                <>
                  {node.shape === 'terminator' && '🚦 ป้ายออกตัว / เส้นชัย (Start/End)'}
                  {node.shape === 'process' && '⚙️ กล่องลงมือทำ (Process)'}
                  {node.shape === 'decision' && '🤔 ทางแยกตัดสินใจ ใช่/ไม่?'}
                  {node.shape === 'io' && '🎤 รับค่าเข้า / 📺 แสดงผล'}
                </>
              ) : (
                <>
                  {node.shape === 'terminator' && '⬭ Start / End'}
                  {node.shape === 'process' && '▭ Process'}
                  {node.shape === 'decision' && '◇ Decision (ตรวจสอบ)'}
                  {node.shape === 'io' && '▱ Input / Output'}
                </>
              )}
            </div>
            <div className="text-xs sm:text-sm font-bold leading-snug">{node.text}</div>
          </div>
        </button>
        {idx < traceNodes.length - 1 && <FlowConnectorLine status={connectorStatus} />}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Intro + 4 Golden Rules */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="mb-5 pb-4 border-b border-slate-100">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            คู่มือฉบับเข้าใจง่ายสำหรับ ป.4 – ป.6
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">
            ผังงาน (Flowchart) คืออะไร? ทำไมนักเขียนโค้ดต้องรู้จัก?
          </h3>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            <strong>ผังงาน (Flowchart)</strong> คือ <strong>"แผนภาพบอกลำดับขั้นตอน"</strong> ที่ใช้รูปทรงเรขาคณิตและลูกศรแทนข้อความยาวๆ
            ช่วยให้เด็กๆ มองเห็นภาพรวมว่าโปรแกรมจะเริ่มตรงไหน ตัดสินใจอย่างไร และจบตรงไหน ก่อนลงมือเขียนโค้ดจริงใน Scratch หรือ Micro:bit
          </p>
        </div>

        {/* 4 Golden Rules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
            <div className="text-xs font-bold text-rose-800 mb-1">กฎข้อที่ 1: มีจุดเริ่มและจบ</div>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              ผังงานทุกอันต้องเริ่มต้นด้วย <strong>เริ่มต้น (Start)</strong> และจบด้วย <strong>สิ้นสุด (End)</strong> รูปวงรีเสมอ
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200">
            <div className="text-xs font-bold text-sky-800 mb-1">กฎข้อที่ 2: อ่านบนลงล่าง</div>
            <p className="text-[11px] text-sky-700 leading-relaxed">
              เรียงลำดับจาก <strong>บนลงล่าง</strong> หรือซ้ายไปขวา พร้อมใส่หัวลูกศรชี้ทิศทางชัดเจนทุกขั้นตอน
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
            <div className="text-xs font-bold text-amber-800 mb-1">กฎข้อที่ 3: เงื่อนไขต้องมี 2 ทาง</div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              กล่องข้าวหลามตัด ◇ ต้องมีทางออก 2 เส้นเสมอ พร้อมเขียนคำว่า <strong>ใช่ (True)</strong> และ <strong>ไม่ใช่ (False)</strong>
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="text-xs font-bold text-emerald-800 mb-1">กฎข้อที่ 4: ข้อความสั้นกระชับ</div>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              เขียนคำสั่งในกล่องให้สั้น อ่านเข้าใจง่าย เช่น <em>"เดินหน้า 10 ก้าว"</em> หรือ <em>"คะแนน &gt;= 50?"</em>
            </p>
          </div>
        </div>

        {/* Section 2: 6 Standard Symbols Explorer with Text-based vs Visual Icon-based Toggle */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>สัญลักษณ์ Flowchart มาตรฐานที่ควรรู้จัก (คลิกแต่ละการ์ดเพื่อดูรายละเอียด)</span>
            </div>

            {/* Text-based vs Visual Icon-based Toggle */}
            <div
              className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto"
              role="group"
              aria-label="เลือกรูปแบบคำอธิบายสัญลักษณ์ Flowchart"
            >
              <button
                type="button"
                onClick={() => setSymbolDisplayMode('visual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  symbolDisplayMode === 'visual'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🎨 ภาพไอคอนจำง่าย (Visual)</span>
              </button>
              <button
                type="button"
                onClick={() => setSymbolDisplayMode('text')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  symbolDisplayMode === 'text'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📝 ข้อความทางการ (Text-based)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4">
            {FLOWCHART_SYMBOLS.map((sym) => {
              const active = sym.id === selectedSymbolId;
              return (
                <button
                  key={sym.id}
                  onClick={() => setSelectedSymbolId(sym.id)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between ${
                    active
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <SymbolGraphic shape={sym.shapeType} mode={symbolDisplayMode} />
                  <div className="mt-2">
                    <div className="text-[11px] font-bold leading-tight">
                      {symbolDisplayMode === 'visual' ? `${sym.visualEmoji} ${sym.visualTitle}` : sym.nameTh}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${active ? 'text-sky-300' : 'text-slate-500'}`}>
                      {sym.nameEn}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Symbol Details */}
          <div className={`p-4 rounded-xl border ${selectedSymbol.colorClass}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="bg-white/95 rounded-xl p-3.5 border border-white/60 text-center">
                <SymbolGraphic shape={selectedSymbol.shapeType} mode={symbolDisplayMode} />
                <div className="text-xs font-bold mt-1.5 text-slate-900">
                  {symbolDisplayMode === 'visual'
                    ? `${selectedSymbol.visualEmoji} ${selectedSymbol.visualTitle}`
                    : `${selectedSymbol.nameTh} (${selectedSymbol.nameEn})`}
                </div>
                {symbolDisplayMode === 'visual' && (
                  <div className="text-[11px] text-slate-500 mt-0.5">{selectedSymbol.nameTh}</div>
                )}
              </div>

              {symbolDisplayMode === 'visual' ? (
                <div className="space-y-2">
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>💡 เปรียบเทียบให้เห็นภาพจำง่ายๆ:</span>
                  </div>
                  <p className="text-xs leading-relaxed font-medium">{selectedSymbol.visualMetaphor}</p>
                  <div className="text-[11px] font-bold bg-white/90 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-800 border border-white">
                    <span>คีย์ลัดความจำ:</span>
                    <span>{selectedSymbol.visualCue}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold">คำอธิบายความหมาย & หน้าที่ (Text-based):</div>
                  <p className="text-xs leading-relaxed">{selectedSymbol.meaningForKids}</p>
                  <div className="text-[11px] font-semibold bg-white/80 inline-block px-2.5 py-1 rounded-lg text-slate-800">
                    ตัวอย่างข้อความในกล่อง: {selectedSymbol.sampleInside}
                  </div>
                </div>
              )}

              <div className="bg-white/90 rounded-xl p-3 border border-rose-200/70 text-slate-800">
                <div className="text-[11px] font-bold text-rose-700 flex items-center gap-1 mb-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>ข้อผิดพลาดที่เจอบ่อย (ระวัง!):</span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">{selectedSymbol.commonMistake}</p>
                {symbolDisplayMode === 'visual' && (
                  <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-600">
                    <strong>ตัวอย่างในโค้ดจริง:</strong> {selectedSymbol.sampleInside}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Interactive Flowchart Studio (6 Examples across Pa.4 - Pa.6) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">
              คลังตัวอย่างผังงานแบบโต้ตอบได้ (Interactive Flowchart Lab)
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">
              6 ตัวอย่างผังงานจริง สำหรับเด็ก ป.4 – ป.6
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              เลือกตัวอย่าง แล้วกดปุ่ม <strong>"รันจำลองทีละขั้น"</strong> หรือทดลองปรับค่าตัวแปรเพื่อดูผังงานทำงานจริง!
            </p>
          </div>

          {/* Grade Filter */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl shrink-0">
            {(['all', 'ป.4', 'ป.5', 'ป.6'] as const).map((g) => (
              <button
                key={g}
                onClick={() => handleFilterChange(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  gradeFilter === g ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g === 'all' ? 'ทั้งหมด (6)' : g}
              </button>
            ))}
          </div>
        </div>

        {/* Example Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 my-5">
          {filteredExamples.map((ex) => {
            const isSelected = ex.id === currentExample.id;
            return (
              <button
                key={ex.id}
                onClick={() => handleSelectExample(ex.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-400 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      ex.grade === 'ป.4'
                        ? 'bg-sky-100 text-sky-700'
                        : ex.grade === 'ป.5'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {ex.grade} · {ex.structureType}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900">{ex.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{ex.subtitle}</div>
              </button>
            );
          })}
        </div>

        {/* Interactive Parameter Controls (if applicable) */}
        {currentExample.interactiveMode && (
          <div className="mb-5 p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
              <span>ทดลองเปลี่ยนค่าตัวแปรเพื่อดูเส้นทางในผังงานเปลี่ยนไป:</span>
            </div>

            {currentExample.interactiveMode === 'score' && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold text-slate-800">คะแนนสอบ = {simScore}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={simScore}
                  onChange={(e) => setSimScore(Number(e.target.value))}
                  className="w-36 accent-indigo-600 cursor-pointer"
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setSimScore(85)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
                  >
                    ลอง 85 (ผ่าน)
                  </button>
                  <button
                    onClick={() => setSimScore(35)}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                  >
                    ลอง 35 (ไม่ผ่าน)
                  </button>
                </div>
              </div>
            )}

            {currentExample.interactiveMode === 'weather' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSimWeather('rain')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                    simWeather === 'rain'
                      ? 'bg-sky-600 text-white border-sky-700'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  🌧️ ฝนตก (ใช่)
                </button>
                <button
                  onClick={() => setSimWeather('sunny')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                    simWeather === 'sunny'
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  ☀️ แดดออก (ไม่ใช่)
                </button>
              </div>
            )}

            {currentExample.interactiveMode === 'light' && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold text-slate-800">
                  ระดับแสง = {simLight} ({simLight < 50 ? '🌙 มืด' : '☀️ สว่าง'})
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={simLight}
                  onChange={(e) => setSimLight(Number(e.target.value))}
                  className="w-40 accent-amber-500 cursor-pointer"
                />
              </div>
            )}

            {currentExample.interactiveMode === 'loop5' && (
              <div className="text-xs font-semibold text-emerald-800 bg-white px-3 py-1.5 rounded-lg border border-emerald-200">
                🌱 ตัวอย่างนี้ใช้เงื่อนไขวนซ้ำ 5 รอบจนกว่ารดครบทุกต้น
              </div>
            )}
          </div>
        )}

        {/* Studio Split View: Visual Flowchart Trace vs Pseudocode & Scratch Mapping */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Visual Flowchart */}
          <div className="lg:col-span-7 bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col items-center">
            <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200">
              <div className="text-xs font-bold text-slate-800">
                แผนภาพผังงาน ({currentExample.grade} · {currentExample.structureType})
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    if (activeStepIdx >= traceNodes.length - 1) setActiveStepIdx(0);
                    setIsAutoPlaying((prev) => !prev);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isAutoPlaying ? 'หยุดชั่วคราว' : 'เล่นอัตโนมัติ'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setActiveStepIdx((prev) => (prev + 1 < traceNodes.length ? prev + 1 : 0));
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>ทีละขั้น</span>
                </button>
                <button
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setActiveStepIdx(0);
                  }}
                  className="p-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 cursor-pointer"
                  title="เริ่มใหม่"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Flowchart Nodes Stack */}
            <div className="w-full py-2 flex flex-col items-center">
              {traceNodes.map((node, idx) => renderFlowNodeBox(node, idx))}
            </div>
          </div>

          {/* Right: Active Step Explanation + Pseudocode + Scratch Bridge */}
          <div className="lg:col-span-5 space-y-4">
            {/* Step-by-step narrator box */}
            <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-200 mb-1">
                กำลังทำงานขั้นตอนที่ {activeStepIdx + 1} / {traceNodes.length}
              </div>
              <div className="text-sm font-bold mb-1">{traceNodes[activeStepIdx]?.text}</div>
              <p className="text-xs text-indigo-100 leading-relaxed">
                {traceNodes[activeStepIdx]?.explanation}
              </p>
            </div>

            {/* Pseudocode box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-900 mb-2">
                📝 เปรียบเทียบ: รหัสลำลอง (เขียนเป็นข้อความ)
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {currentExample.pseudocode.map((line, idx) => (
                  <li key={idx} className="p-2 rounded-lg bg-white border border-slate-200 font-medium">
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            {/* Scratch / Micro:bit Bridge */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>🔗 เชื่อมโยงสู่การเขียนโค้ดจริง (Scratch / Micro:bit)</span>
              </div>
              <p className="text-xs text-emerald-800 font-mono leading-relaxed">{currentExample.scratchHint}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3B: Interactive Drag-and-Drop Flowchart Editor */}
      <div
        ref={editorSectionRef}
        className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5" />
              <span>ห้องต่อบล็อกผังงาน (Interactive Drag-and-Drop Flowchart Editor)</span>
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">
              สร้างผังงาน Flowchart ด้วยตัวเอง (ลากวาง &amp; กดรันทดสอบ)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              ลากสัญลักษณ์จากแถบซ้ายไปวางบนกระดาน (หรือแตะที่ปุ่มสัญลักษณ์บนมือถือ) แล้วพิมพ์ข้อความในกล่องและกด <strong>&quot;ตรวจ &amp; รันผังงาน&quot;</strong>!
            </p>
          </div>

          {/* Starter Mission Picker */}
          <div className="flex flex-wrap items-center gap-1.5">
            {EDITOR_MISSIONS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => loadEditorMission(m.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  activeMissionId === m.id
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {m.title}
              </button>
            ))}
          </div>
        </div>

        {/* Active mission hint banner */}
        <div className="my-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{EDITOR_MISSIONS.find((m) => m.id === activeMissionId)?.description}</span>
          </div>
          {editorRewarded && (
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold">
              🏆 รับ +25 XP แล้ว!
            </span>
          )}
        </div>

        {/* Flowchart Template Library (One-Click Load) */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <LayoutTemplate className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>คลังแม่แบบผังงานยอดนิยม (Flowchart Template Library — โหลดใช้งานในคลิกเดียว)</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              คลิกแม่แบบที่สนใจเพื่อส่งลงกระดานต่อบล็อกด้านล่างทันที
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {FLOWCHART_TEMPLATES.map((tpl) => {
              const isSelected = activeTemplateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  disabled={editorIsRunning}
                  onClick={() => loadFlowchartTemplate(tpl.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 disabled:opacity-50 ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-400 shadow-xs ring-2 ring-indigo-200'
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${tpl.badgeColor}`}>
                        {tpl.patternTag}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">{tpl.gradeTag}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900">{tpl.title}</div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{tpl.description}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-slate-500 truncate">{tpl.previewFlow}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-[10px] font-bold shrink-0">
                      {isSelected ? '✓ โหลดแล้ว' : '⚡ โหลดใช้งาน'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Draggable Symbol Palette */}
          <div className="lg:col-span-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. คลังสัญลักษณ์ (ลากไปวาง หรือคลิกเพิ่ม)
              </div>
              <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1 shrink-0">
                <HelpCircle className="w-3 h-3 text-indigo-500" />
                <span>ชี้เพื่อดูวิธีใช้</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {EDITOR_PALETTE.map((item) => (
                <div
                  key={item.kind}
                  draggable={!editorIsRunning}
                  onDragStart={() => {
                    setDraggedPaletteKind(item.kind);
                  }}
                  onDragEnd={() => {
                    setDraggedPaletteKind(null);
                    setPaletteDropPreview(null);
                    setIsCanvasDragOver(false);
                  }}
                  onClick={() => addNodeToCanvas(item.kind)}
                  className={`group relative p-3 rounded-xl border-2 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing hover:shadow-sm transition-all select-none ${item.cardClass}`}
                  aria-label={`${item.nameTh}: ${item.tooltipFunction}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <GripVertical className="w-4 h-4 opacity-50 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {symbolDisplayMode === 'visual' ? item.visualName : item.nameTh}
                      </div>
                      <div className="text-[10px] opacity-75">{item.badgeText}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="w-5 h-5 rounded-full bg-white/70 text-slate-500 flex items-center justify-center group-hover:text-indigo-600 transition-colors"
                      aria-hidden="true"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </span>
                    <span className="w-6 h-6 rounded-lg bg-white/80 flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Hoverable Educational Tooltip */}
                  <div
                    role="tooltip"
                    className="pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-all duration-150 absolute z-30 bottom-full left-0 mb-2 w-72 sm:w-80 p-3 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-700 text-left"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-1.5">
                      <span>{item.visualEmoji}</span>
                      <span>{item.nameTh}</span>
                    </div>
                    <div className="space-y-1.5 text-[11px] leading-relaxed">
                      <div>
                        <span className="font-bold text-sky-300">หน้าที่: </span>
                        <span className="text-slate-100">{item.tooltipFunction}</span>
                      </div>
                      <div>
                        <span className="font-bold text-emerald-300">ใช้ตอนไหนดีที่สุด: </span>
                        <span className="text-slate-200">{item.tooltipBestUse}</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-700/80 text-[10px] text-slate-400">
                      💡 ลากไปวางบนกระดาน หรือคลิกเพื่อเพิ่มต่อท้ายได้เลย
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Flowchart Drop-Zone Canvas */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. กระดานผังงานของฉัน ({editorNodes.length} กล่อง)
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  disabled={!canUndo}
                  onClick={handleUndo}
                  title="ย้อนกลับการกระทำล่าสุดบนกระดาน (Undo · Ctrl+Z)"
                  aria-label="ย้อนกลับ (Undo)"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>ย้อนกลับ (Undo)</span>
                  {editorHistory.past.length > 0 && (
                    <span className="px-1 rounded bg-slate-100 text-[10px] font-bold text-slate-600">
                      {editorHistory.past.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  disabled={!canRedo}
                  onClick={handleRedo}
                  title="ทำซ้ำ (Redo)"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                  <span>ทำซ้ำ</span>
                </button>
                <button
                  type="button"
                  disabled={editorIsRunning}
                  onClick={handleToggleSnapToGrid}
                  title={`เปิด/ปิดการดูดชิดตารางอัตโนมัติ (Snap to Grid ${CANVAS_GRID_SIZE}px)`}
                  aria-pressed={snapToGrid}
                  aria-label="สลับโหมดชิดตาราง (Snap to Grid)"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    snapToGrid
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs hover:bg-indigo-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Magnet className="w-3.5 h-3.5" />
                  <span>{snapToGrid ? 'ชิดตาราง: เปิด' : 'ชิดตาราง: ปิด'}</span>
                </button>
                <button
                  type="button"
                  disabled={editorIsRunning || editorNodes.length === 0}
                  onClick={handleTidyAlignCanvas}
                  title="จัดเรียงบล็อกทั้งหมดให้ตรงแนวกลางและชิดตารางอย่างเป็นระเบียบ"
                  aria-label="จัดเรียงตรงแนว (Auto-Align)"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                  <span>จัดเรียงตรงแนว</span>
                </button>
                <div
                  className="inline-flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden"
                  role="group"
                  aria-label="ปรับขนาดมุมมองกระดานผังงาน"
                >
                  <button
                    type="button"
                    disabled={!canZoomOut}
                    onClick={handleZoomOut}
                    title="ซูมออก (Zoom Out) เพื่อดูผังงานยาวๆ ได้ครบ"
                    aria-label="ซูมออก"
                    className="p-1.5 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-r border-slate-200"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    disabled={currentZoom.percent === 100}
                    title="รีเซ็ตขนาดเป็น 100%"
                    className="px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:cursor-default disabled:hover:bg-white min-w-[44px] text-center"
                  >
                    {currentZoom.percent}%
                  </button>
                  <button
                    type="button"
                    disabled={!canZoomIn}
                    onClick={handleZoomIn}
                    title="ซูมเข้า (Zoom In) เพื่ออ่านและแก้ไขข้อความชัดขึ้น"
                    aria-label="ซูมเข้า"
                    className="p-1.5 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-l border-slate-200"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div
                  className="inline-flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden"
                  role="group"
                  aria-label="ส่งออกผังงาน"
                >
                  <button
                    type="button"
                    disabled={editorIsRunning || editorNodes.length === 0}
                    onClick={handleExportImage}
                    title="ดาวน์โหลดผังงานเป็นไฟล์รูปภาพ (.png)"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-r border-slate-200"
                  >
                    <ImageDown className="w-3.5 h-3.5" />
                    <span>บันทึกรูปภาพ</span>
                  </button>
                  <button
                    type="button"
                    disabled={editorIsRunning || editorNodes.length === 0}
                    onClick={handleExportJson}
                    title="บันทึกโครงสร้างผังงานเป็นไฟล์ข้อมูล (.json)"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 hover:bg-sky-50 hover:text-sky-700 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-r border-slate-200"
                  >
                    <FileJson className="w-3.5 h-3.5" />
                    <span>บันทึก JSON</span>
                  </button>
                  <button
                    type="button"
                    disabled={editorIsRunning || editorNodes.length === 0}
                    onClick={handleCopyShareLink}
                    title="สร้างและคัดลอกลิงก์ URL ของผังงานปัจจุบันเพื่อแชร์ให้เพื่อนหรือคุณครู"
                    aria-label="คัดลอกลิงก์แชร์ผังงาน (Copy Shareable Link)"
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      linkCopied
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'hover:bg-indigo-50 hover:text-indigo-700 text-slate-700'
                    }`}
                  >
                    {linkCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                    <span>{linkCopied ? 'คัดลอกลิงก์แล้ว!' : 'คัดลอกลิงก์แชร์'}</span>
                  </button>
                </div>
                <button
                  type="button"
                  disabled={
                    editorIsRunning ||
                    (editorNodes.length === 0 && !activeTemplateId && !editorValidation)
                  }
                  onClick={handleResetCanvas}
                  title="รีเซ็ตกระดาน (Reset Canvas) — ล้างสัญลักษณ์ทั้งหมดเพื่อเริ่มสร้างผังงานใหม่"
                  aria-label="รีเซ็ตกระดาน (Reset Canvas)"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 text-rose-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>รีเซ็ตกระดาน</span>
                </button>
                <button
                  type="button"
                  disabled={editorIsRunning || editorNodes.length === 0}
                  onClick={handleStepThroughNext}
                  title="โหมดแกะรอยทีละขั้น (Step-through) — คลิก Next เพื่อรันทีละบล็อกและดูไฮไลต์โค้ด Python ตามจริง"
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                    isStepThroughMode
                      ? 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-white'
                      : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                  }`}
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>
                    {!isStepThroughMode
                      ? 'ทีละขั้น (Next)'
                      : editorActiveStep !== null && editorActiveStep >= editorNodes.length - 1
                      ? 'จบการแกะรอย (Finish)'
                      : `ถัดไป (Next ${(editorActiveStep ?? 0) + 1}/${editorNodes.length})`}
                  </span>
                </button>
                {isStepThroughMode && (
                  <button
                    type="button"
                    onClick={handleResetStepThrough}
                    title="ออกจากโหมดแกะรอยทีละขั้น"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>ออกโหมดทีละขั้น</span>
                  </button>
                )}
                <button
                  type="button"
                  disabled={editorIsRunning}
                  onClick={validateAndRunEditorFlowchart}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{editorIsRunning ? 'กำลังรันทีละขั้น...' : 'ตรวจ & รันผังงาน'}</span>
                </button>
              </div>
            </div>

            {isStepThroughMode && editorActiveStep !== null && editorNodes[editorActiveStep] && (
              <div className="mb-2.5 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold flex flex-wrap items-center gap-2">
                    <span className="text-amber-700 tabular-nums">
                      กำลังแกะรอยขั้นที่ {editorActiveStep + 1} / {editorNodes.length}
                    </span>
                    <span className="text-amber-400" aria-hidden="true">·</span>
                    <span className="truncate">{editorNodes[editorActiveStep].label}</span>
                  </div>
                  {editorNodes[editorActiveStep].kind === 'decision' && (
                    <div className="mt-1 text-[11px] text-amber-800 flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>✔️ ใช่: {editorNodes[editorActiveStep].trueAction || '-'}</span>
                      <span>❌ ไม่ใช่: {editorNodes[editorActiveStep].falseAction || '-'}</span>
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-indigo-700 shrink-0">
                  กด &quot;ถัดไป (Next)&quot; เพื่อไปบล็อกถัดไป
                </span>
              </div>
            )}

            {exportFeedback && (
              <div className="mb-2.5 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span>{exportFeedback}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setExportFeedback(null);
                      setShareableLinkPreview(null);
                    }}
                    className="text-emerald-700 hover:text-emerald-950 font-bold text-[11px] cursor-pointer shrink-0"
                  >
                    ปิด
                  </button>
                </div>
                {shareableLinkPreview && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareableLinkPreview}
                      onFocus={(e) => e.currentTarget.select()}
                      onClick={(e) => e.currentTarget.select()}
                      aria-label="ลิงก์แชร์ผังงาน"
                      className="w-full px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-[11px] font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Drop Canvas Area (2D Snap-to-Grid Blueprint) */}
            {(() => {
              const effectiveNodes = editorNodes.map((node) => {
                if (draggingNodeState && draggingNodeState.uid === node.uid) {
                  return { ...node, x: draggingNodeState.x, y: draggingNodeState.y };
                }
                return {
                  ...node,
                  x: node.x ?? CENTER_NODE_X,
                  y: node.y ?? CANVAS_PADDING,
                };
              });

              const maxNodeBottom = effectiveNodes.reduce((max, n) => {
                const h = nodeHeights[n.uid] || getEstimatedNodeHeight(n.kind);
                return Math.max(max, (n.y ?? CANVAS_PADDING) + h);
              }, 300);

              const previewBottom = paletteDropPreview
                ? paletteDropPreview.y +
                  getEstimatedNodeHeight(draggedPaletteKind || 'process') +
                  48
                : 0;

              const canvasHeight = Math.max(
                432,
                Math.ceil((Math.max(maxNodeBottom, previewBottom) + 72) / CANVAS_GRID_SIZE) *
                  CANVAS_GRID_SIZE
              );

              return (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsCanvasDragOver(true);
                    if (draggedPaletteKind) {
                      const pos = getSnappedDropPositionFromPointer(e.clientX, e.clientY);
                      setPaletteDropPreview((prev) =>
                        prev && prev.x === pos.x && prev.y === pos.y ? prev : pos
                      );
                    }
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                      setIsCanvasDragOver(false);
                      setPaletteDropPreview(null);
                    }
                  }}
                  onDrop={handleCanvasDrop}
                  className={`min-h-[380px] max-h-[680px] overflow-auto rounded-2xl border-2 border-dashed transition-colors ${
                    isCanvasDragOver
                      ? 'bg-indigo-50/70 border-indigo-400'
                      : 'bg-slate-100/70 border-slate-300'
                  }`}
                >
                  <div
                    ref={canvasInnerRef}
                    style={{
                      width: `${CANVAS_LOGICAL_WIDTH}px`,
                      minHeight: `${canvasHeight}px`,
                    }}
                    className={`relative mx-auto transition-colors ${currentZoom.className} ${
                      snapToGrid
                        ? 'bg-white/90 bg-[linear-gradient(to_right,rgba(99,102,241,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.1)_1px,transparent_1px)] [background-size:24px_24px]'
                        : 'bg-slate-50/95'
                    }`}
                  >
                    {/* Subtle Snap-to-Grid Hint Pill */}
                    <div className="sticky top-2 left-2 z-20 inline-flex items-center gap-1.5 ml-3 mt-2 px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200 shadow-xs text-[10px] font-semibold text-slate-600 pointer-events-none">
                      <Magnet
                        className={`w-3 h-3 ${snapToGrid ? 'text-indigo-600' : 'text-slate-400'}`}
                      />
                      <span>
                        {snapToGrid
                          ? `โหมดชิดตาราง (${CANVAS_GRID_SIZE}px) เปิดอยู่ · ลากกล่องจัดวางได้อิสระ`
                          : 'โหมดวางอิสระ (ปิดชิดตาราง)'}
                      </span>
                    </div>

                    {editorNodes.length === 0 && !paletteDropPreview ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-400 space-y-2 p-8 pointer-events-none">
                        <div className="text-3xl">🧩</div>
                        <div className="text-sm font-bold text-slate-600">
                          ลากสัญลักษณ์มาวางบนตารางที่นี่ เพื่อเริ่มสร้างสายโซ่ตรรกะของคุณ!
                        </div>
                        <div className="text-xs">
                          แนะนำ: เริ่มด้วย <strong>จุดเริ่มต้น (Start)</strong> →{' '}
                          <strong>ขั้นตอนทำ/ตัดสินใจ</strong> → <strong>จุดสิ้นสุด (End)</strong>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* SVG Flow Connectors & Smart Alignment Guides Layer */}
                        <svg
                          width={CANVAS_LOGICAL_WIDTH}
                          height={canvasHeight}
                          viewBox={`0 0 ${CANVAS_LOGICAL_WIDTH} ${canvasHeight}`}
                          className="absolute inset-0 pointer-events-none z-0"
                          aria-hidden="true"
                        >
                          {/* Active Alignment Guide Lines while dragging a block */}
                          {draggingNodeState?.alignX !== null &&
                            draggingNodeState?.alignX !== undefined && (
                              <line
                                x1={draggingNodeState.alignX}
                                y1={0}
                                x2={draggingNodeState.alignX}
                                y2={canvasHeight}
                                stroke="#06b6d4"
                                strokeWidth="1.5"
                                strokeDasharray="5 4"
                              />
                            )}
                          {draggingNodeState?.alignY !== null &&
                            draggingNodeState?.alignY !== undefined && (
                              <line
                                x1={0}
                                y1={draggingNodeState.alignY}
                                x2={CANVAS_LOGICAL_WIDTH}
                                y2={draggingNodeState.alignY}
                                stroke="#06b6d4"
                                strokeWidth="1.5"
                                strokeDasharray="5 4"
                              />
                            )}

                          {/* Sequential Flow Connectors between consecutive logic blocks */}
                          {effectiveNodes.map((fromNode, idx) => {
                            if (idx >= effectiveNodes.length - 1) return null;
                            const toNode = effectiveNodes[idx + 1];
                            const fromH =
                              nodeHeights[fromNode.uid] || getEstimatedNodeHeight(fromNode.kind);
                            const sx = (fromNode.x ?? CENTER_NODE_X) + NODE_CARD_WIDTH / 2;
                            const sy = (fromNode.y ?? CANVAS_PADDING) + fromH;
                            const tx = (toNode.x ?? CENTER_NODE_X) + NODE_CARD_WIDTH / 2;
                            const ty = toNode.y ?? CANVAS_PADDING;
                            const endTipY = ty - 4;

                            let pathD = '';
                            if (endTipY >= sy + 8) {
                              if (Math.abs(sx - tx) <= 2) {
                                pathD = `M ${sx} ${sy} L ${tx} ${endTipY}`;
                              } else {
                                const midY = Math.round((sy + endTipY) / 2);
                                pathD = `M ${sx} ${sy} L ${sx} ${midY} L ${tx} ${midY} L ${tx} ${endTipY}`;
                              }
                            } else {
                              const exitY = sy + 18;
                              const entryY = endTipY - 16;
                              const detourX =
                                sx <= tx
                                  ? Math.min(
                                      CANVAS_LOGICAL_WIDTH - 16,
                                      Math.max(sx, tx) + NODE_CARD_WIDTH / 2 + 24
                                    )
                                  : Math.max(
                                      16,
                                      Math.min(sx, tx) - NODE_CARD_WIDTH / 2 - 24
                                    );
                              pathD = `M ${sx} ${sy} L ${sx} ${exitY} L ${detourX} ${exitY} L ${detourX} ${entryY} L ${tx} ${entryY} L ${tx} ${endTipY}`;
                            }

                            const status: 'idle' | 'flowing' | 'passed' =
                              editorActiveEdge === idx
                                ? 'flowing'
                                : idx < editorRunPassedCount
                                ? 'passed'
                                : 'idle';
                            const isFlowing = status === 'flowing';
                            const isPassed = status === 'passed';
                            const strokeColor = isFlowing
                              ? '#4f46e5'
                              : isPassed
                              ? '#10b981'
                              : '#cbd5e1';

                            return (
                              <g key={`${fromNode.uid}->${toNode.uid}`}>
                                {isFlowing && (
                                  <path
                                    d={pathD}
                                    fill="none"
                                    stroke="#818cf8"
                                    strokeOpacity="0.35"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                )}
                                <path
                                  d={pathD}
                                  fill="none"
                                  stroke={strokeColor}
                                  strokeOpacity={isFlowing ? 0.35 : 1}
                                  strokeWidth={isFlowing || isPassed ? 2.8 : 2.2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                {isFlowing && (
                                  <path
                                    d={pathD}
                                    fill="none"
                                    stroke="#4f46e5"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="animate-flowchart-dash"
                                  />
                                )}
                                <polygon
                                  points={`${tx - 5.5},${endTipY - 6} ${tx},${endTipY + 3} ${tx + 5.5},${endTipY - 6}`}
                                  fill={strokeColor}
                                />
                                {isFlowing && (
                                  <circle
                                    r="4.5"
                                    fill="#22d3ee"
                                    stroke="#4f46e5"
                                    strokeWidth="2"
                                  >
                                    <animateMotion dur="0.65s" repeatCount="indefinite" path={pathD} />
                                  </circle>
                                )}
                              </g>
                            );
                          })}
                        </svg>

                        {/* Snapped Drop Preview Ghost when dragging from Palette */}
                        {draggedPaletteKind && paletteDropPreview && (
                          <div
                            style={{
                              left: `${paletteDropPreview.x}px`,
                              top: `${paletteDropPreview.y}px`,
                              width: `${NODE_CARD_WIDTH}px`,
                              height: `${getEstimatedNodeHeight(draggedPaletteKind)}px`,
                            }}
                            className="absolute z-10 rounded-xl border-2 border-dashed border-indigo-500 bg-indigo-100/75 flex flex-col items-center justify-center text-center p-2 pointer-events-none shadow-sm"
                          >
                            <span className="text-xs font-bold text-indigo-800">
                              🧲 ปล่อยเพื่อวางชิดตาราง
                            </span>
                            <span className="text-[10px] font-mono text-indigo-600 mt-0.5">
                              X: {paletteDropPreview.x}px · Y: {paletteDropPreview.y}px
                            </span>
                          </div>
                        )}

                        {/* Positioned Logic Blocks */}
                        {effectiveNodes.map((node, idx) => {
                          const isRunningHere = editorActiveStep === idx;
                          const isBeingDragged = draggingNodeState?.uid === node.uid;
                          const nodeX = node.x ?? CENTER_NODE_X;
                          const nodeY = node.y ?? CANVAS_PADDING;

                          let nodeContainerShape = 'rounded-xl';
                          let nodeColor = 'bg-white border-indigo-400 text-slate-900';
                          if (node.kind === 'start' || node.kind === 'end') {
                            nodeContainerShape = 'rounded-full px-6';
                            nodeColor = 'bg-rose-50 border-rose-400 text-rose-950';
                          } else if (node.kind === 'decision') {
                            nodeContainerShape = 'rounded-2xl border-dashed';
                            nodeColor = 'bg-amber-50 border-amber-400 text-amber-950';
                          } else if (node.kind === 'input' || node.kind === 'output') {
                            nodeContainerShape = 'rounded-xl';
                            nodeColor = 'bg-sky-50 border-sky-400 text-sky-950';
                          }

                          const paletteInfo = EDITOR_PALETTE.find((p) => p.kind === node.kind);
                          const kindLabel =
                            symbolDisplayMode === 'visual'
                              ? paletteInfo?.visualName
                              : paletteInfo?.nameTh;

                          return (
                            <div
                              key={node.uid}
                              data-flowchart-node-uid={node.uid}
                              onPointerDown={(e) => handleNodePointerDown(e, node)}
                              style={{
                                left: `${nodeX}px`,
                                top: `${nodeY}px`,
                                width: `${NODE_CARD_WIDTH}px`,
                              }}
                              className={`absolute z-10 border-2 p-3 select-none ${
                                isBeingDragged
                                  ? 'z-30 shadow-xl ring-4 ring-cyan-300/80 cursor-grabbing transition-none'
                                  : 'transition-shadow cursor-grab shadow-xs hover:shadow-md'
                              } ${nodeContainerShape} ${nodeColor} ${
                                isRunningHere
                                  ? 'ring-4 ring-indigo-300 scale-[1.03] shadow-md bg-indigo-50!'
                                  : ''
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1.5 touch-none">
                                <div className="relative group/nodeinfo inline-flex items-center gap-1.5 text-[10px] font-bold opacity-85">
                                  <GripVertical className="w-3.5 h-3.5 shrink-0" />
                                  <span>
                                    #{idx + 1} · {kindLabel}
                                    {/inner loop|↳|ลูปใน/i.test(node.label)
                                      ? ' · ลูปใน (Inner Loop)'
                                      : /outer loop|ลูปนอก/i.test(node.label)
                                      ? ' · ลูปนอก (Outer Loop)'
                                      : ''}
                                  </span>
                                  {paletteInfo && (
                                    <>
                                      <span
                                        tabIndex={0}
                                        data-no-drag="true"
                                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/75 text-slate-600 hover:text-indigo-700 cursor-help focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        aria-label={`คำอธิบายสัญลักษณ์ ${paletteInfo.nameTh}`}
                                      >
                                        <HelpCircle className="w-3 h-3" />
                                      </span>
                                      <div
                                        role="tooltip"
                                        className={`pointer-events-none invisible opacity-0 group-hover/nodeinfo:visible group-hover/nodeinfo:opacity-100 group-focus-within/nodeinfo:visible group-focus-within/nodeinfo:opacity-100 transition-all duration-150 absolute z-30 left-0 w-64 sm:w-72 p-2.5 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-700 text-left font-normal ${
                                          nodeY < 160 ? 'top-full mt-1.5' : 'bottom-full mb-1.5'
                                        }`}
                                      >
                                        <div className="text-[11px] font-bold text-amber-300 mb-1">
                                          {paletteInfo.visualEmoji} {paletteInfo.nameTh}
                                        </div>
                                        <div className="text-[10px] leading-relaxed text-slate-100">
                                          <strong className="text-sky-300">หน้าที่: </strong>
                                          {paletteInfo.tooltipFunction}
                                        </div>
                                        <div className="text-[10px] leading-relaxed text-slate-200 mt-1">
                                          <strong className="text-emerald-300">ใช้ตอนไหน: </strong>
                                          {paletteInfo.tooltipBestUse}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-1" data-no-drag="true">
                                  {isBeingDragged && (
                                    <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono text-[9px] font-bold mr-0.5">
                                      {nodeX},{nodeY}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    disabled={editorIsRunning || idx === 0}
                                    onClick={() => moveEditorNode(idx, 'up')}
                                    className="p-1 rounded bg-white/80 hover:bg-white text-slate-600 disabled:opacity-30 cursor-pointer"
                                    title="เลื่อนลำดับขึ้น"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={editorIsRunning || idx === editorNodes.length - 1}
                                    onClick={() => moveEditorNode(idx, 'down')}
                                    className="p-1 rounded bg-white/80 hover:bg-white text-slate-600 disabled:opacity-30 cursor-pointer"
                                    title="เลื่อนลำดับลง"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={editorIsRunning}
                                    onClick={() => removeEditorNode(node.uid)}
                                    className="p-1 rounded bg-white/80 hover:bg-rose-100 text-rose-600 disabled:opacity-30 cursor-pointer"
                                    title="ลบกล่องนี้"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <input
                                type="text"
                                value={node.label}
                                disabled={editorIsRunning}
                                onChange={(e) => updateNodeLabel(node.uid, e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-white/90 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                placeholder="พิมพ์คำอธิบายขั้นตอนที่นี่..."
                              />

                              {node.kind === 'decision' && (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-1.5">
                                    <div className="text-[9px] font-bold text-emerald-700 mb-0.5">
                                      ✔️ ถ้า ใช่ (True):
                                    </div>
                                    <input
                                      type="text"
                                      value={node.trueAction || ''}
                                      disabled={editorIsRunning}
                                      onChange={(e) =>
                                        updateDecisionBranch(node.uid, 'trueAction', e.target.value)
                                      }
                                      className="w-full px-1.5 py-1 rounded bg-white border border-emerald-200 text-[11px] font-semibold text-slate-800 focus:outline-none"
                                    />
                                  </div>
                                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-1.5">
                                    <div className="text-[9px] font-bold text-rose-700 mb-0.5">
                                      ❌ ถ้า ไม่ใช่ (False):
                                    </div>
                                    <input
                                      type="text"
                                      value={node.falseAction || ''}
                                      disabled={editorIsRunning}
                                      onChange={(e) =>
                                        updateDecisionBranch(node.uid, 'falseAction', e.target.value)
                                      }
                                      className="w-full px-1.5 py-1 rounded bg-white border border-rose-200 text-[11px] font-semibold text-slate-800 focus:outline-none"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Validation Feedback */}
            {editorValidation && (
              <div
                className={`mt-4 p-4 rounded-xl border text-xs ${
                  editorValidation.valid
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  {editorValidation.valid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>{editorValidation.message}</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90">
                  {editorValidation.tips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Live Python 3 Code Display Panel */}
        {(() => {
          const pythonLines = buildFlowchartPythonLines(editorNodes, showFcPyComments);
          const plainPythonCode = pythonLines.map((l) => l.text).join('\n');

          const handleCopyFlowchartPython = async () => {
            let ok = false;
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
              try {
                await navigator.clipboard.writeText(plainPythonCode);
                ok = true;
              } catch {
                ok = false;
              }
            }
            if (!ok) {
              const ta = document.createElement('textarea');
              ta.value = plainPythonCode;
              ta.setAttribute('readonly', '');
              ta.className = 'fixed -left-[9999px] top-0 opacity-0';
              document.body.appendChild(ta);
              ta.select();
              try {
                ok = document.execCommand('copy');
              } catch {
                ok = false;
              }
              document.body.removeChild(ta);
            }
            if (ok) {
              setFcPyCopied(true);
              if (fcPyCopiedTimerRef.current) clearTimeout(fcPyCopiedTimerRef.current);
              fcPyCopiedTimerRef.current = setTimeout(() => setFcPyCopied(false), 2000);
            }
          };

          return (
            <div className="mt-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-lg overflow-hidden">
              <div className="px-4 sm:px-5 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <Code2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <h5 className="text-sm font-bold text-slate-100 whitespace-nowrap">
                    โค้ดภาษาไพทอนแบบเรียลไทม์ (Python 3)
                  </h5>
                  <span className="text-slate-500" aria-hidden="true">·</span>
                  <span className="text-xs text-slate-300 font-medium tabular-nums">
                    {editorNodes.length} บล็อก / {pythonLines.length} บรรทัด
                  </span>
                  {editorActiveStep !== null && (
                    <>
                      <span className="text-slate-500" aria-hidden="true">·</span>
                      <span className="text-xs font-semibold text-amber-300 tabular-nums">
                        กำลังทำงาน: ขั้นที่ {editorActiveStep + 1} / {editorNodes.length}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFcPyComments((prev) => !prev)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      showFcPyComments
                        ? 'bg-slate-800 border-slate-600 text-amber-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {showFcPyComments ? '💬 ซ่อนคำอธิบาย #' : '💬 แสดงคำอธิบาย #'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyFlowchartPython}
                    disabled={editorNodes.length === 0}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                      fcPyCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {fcPyCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>คัดลอกโค้ดแล้ว!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>คัดลอกโค้ด Python</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPythonPanel((prev) => !prev)}
                    aria-expanded={showPythonPanel}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {showPythonPanel ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>ย่อ</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>แสดงโค้ด</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {showPythonPanel && (
                <>
                  <div
                    ref={pythonScrollRef}
                    className="p-3 sm:p-4 max-h-[300px] overflow-auto font-mono text-xs leading-relaxed"
                  >
                    {(() => {
                      let attachedActiveRef = false;
                      return pythonLines.map((lineObj, lineIdx) => {
                        const isActiveLine =
                          editorActiveStep !== null && lineObj.nodeIdx === editorActiveStep;
                        const assignRef = isActiveLine && !attachedActiveRef;
                        if (assignRef) attachedActiveRef = true;
                        return (
                          <div
                            key={lineIdx}
                            ref={assignRef ? activePythonRowRef : undefined}
                            className={`flex items-start gap-3 px-2 py-0.5 rounded transition-colors ${
                              isActiveLine
                                ? 'bg-indigo-500/25 ring-1 ring-indigo-400/50'
                                : 'hover:bg-slate-800/60'
                            }`}
                          >
                            <span className="w-7 text-right select-none text-slate-500 shrink-0 tabular-nums">
                              {lineIdx + 1}
                            </span>
                            <pre className="whitespace-pre font-mono flex-1 overflow-x-auto">
                              {lineObj.text ? highlightFlowchartPythonLine(lineObj.text) : ' '}
                            </pre>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  <div className="px-4 sm:px-5 py-2.5 bg-slate-950/60 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span>
                      💡 เทียบสัญลักษณ์:{' '}
                      <code className="text-sky-300">รับค่า (Input)</code> ➔{' '}
                      <code className="text-purple-300">input()</code> ·{' '}
                      <code className="text-amber-300">เงื่อนไข (Decision ◇)</code> ➔{' '}
                      <code className="text-purple-300">if / else / while</code> ·{' '}
                      <code className="text-cyan-300">แสดงผล (Output)</code> ➔{' '}
                      <code className="text-purple-300">print()</code>
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      ไฮไลต์บรรทัดตามขั้นตอนอัตโนมัติเมื่อกด &quot;ตรวจ &amp; รันผังงาน&quot;
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })()}
      </div>

      {/* Section 4: Interactive Flowchart Mini-Quiz (5 Questions) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              ภารกิจทบทวนความเข้าใจ Flowchart
            </span>
            <h4 className="text-lg font-bold text-slate-900 mt-0.5">
              แบบฝึกหัด 5 ข้อ: ทายสัญลักษณ์และหลักการผังงาน
            </h4>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
            <Award className="w-4 h-4 text-amber-600" />
            <span>
              ตอบถูก {quizCorrectCount} / {FLOWCHART_QUIZ.length} ข้อ {quizRewarded && ' (+20 XP แล้ว!)'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {FLOWCHART_QUIZ.map((item, qIdx) => {
            const chosen = quizAnswers[qIdx];
            return (
              <div key={qIdx} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs sm:text-sm font-bold text-slate-900 mb-3">
                  ข้อ {qIdx + 1}. {item.q}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {item.options.map((opt, optIdx) => {
                    const isPicked = chosen === optIdx;
                    const isRight = optIdx === item.correct;
                    let cls = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100';
                    if (chosen !== undefined) {
                      if (isRight) cls = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold';
                      else if (isPicked) cls = 'bg-rose-50 border-rose-300 text-rose-800';
                    }
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleAnswerQuiz(qIdx, optIdx)}
                        className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${cls}`}
                      >
                        <span>{opt}</span>
                        {chosen !== undefined && isRight && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        {chosen !== undefined && isPicked && !isRight && (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {chosen !== undefined && (
                  <div
                    className={`mt-2.5 p-2.5 rounded-lg text-xs border ${
                      chosen === item.correct
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <strong>เฉลย:</strong> {item.explanation}
                  </div>
                )}
              </div>
            );
          })}

          {/* O-NET Style Complex Choice Flowchart Question */}
          {(() => {
            const fcComplex = [
              {
                text: 'ผังงานที่มีสัญลักษณ์รูปข้าวหลามตัด ◇ ต้องมีลูกศรทางออกอย่างน้อย 2 ทิศทาง (ใช่/จริง และ ไม่ใช่/เท็จ)',
                isTrue: true,
              },
              {
                text: 'สัญลักษณ์สี่เหลี่ยมผืนผ้า (Process) ใช้สำหรับตั้งคำถามเงื่อนไขและเปรียบเทียบค่าตัวแปร',
                isTrue: false,
              },
              {
                text: 'หากลูกศรชี้วนย้อนกลับขึ้นไปยังกล่องด้านบนก่อนถึง End แสดงว่ามีการทำงานแบบวนซ้ำ (Loop)',
                isTrue: true,
              },
            ];
            const allPicked = fcComplex.every((_, i) => complexQuizAns[i] !== undefined);
            const allOk = fcComplex.every((st, i) => complexQuizAns[i] === st.isTrue);
            return (
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-3">
                <div className="text-xs sm:text-sm font-bold text-slate-900">
                  ข้อ 6 (รูปแบบ O-NET เลือกตอบเชิงซ้อน): พิจารณาข้อความเกี่ยวกับผังงาน Flowchart แล้วระบุว่า &quot;ถูกต้อง&quot; หรือ &quot;ไม่ถูกต้อง&quot;
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-800">
                        <th className="py-2.5 px-3">ข้อความ</th>
                        <th className="py-2.5 px-3 text-center w-24">ถูกต้อง</th>
                        <th className="py-2.5 px-3 text-center w-24">ไม่ถูกต้อง</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {fcComplex.map((st, idx) => {
                        const v = complexQuizAns[idx];
                        const ok = complexQuizChecked && v === st.isTrue;
                        const bad = complexQuizChecked && v !== st.isTrue;
                        return (
                          <tr key={idx} className={ok ? 'bg-emerald-50/70' : bad ? 'bg-rose-50/70' : ''}>
                            <td className="py-2.5 px-3 text-slate-800">
                              {idx + 1}. {st.text}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                disabled={complexQuizChecked}
                                onClick={() => setComplexQuizAns((prev) => ({ ...prev, [idx]: true }))}
                                className={`px-2.5 py-1 rounded border text-[11px] font-bold cursor-pointer ${
                                  v === true ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-300 text-slate-600'
                                }`}
                              >
                                ถูกต้อง
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                disabled={complexQuizChecked}
                                onClick={() => setComplexQuizAns((prev) => ({ ...prev, [idx]: false }))}
                                className={`px-2.5 py-1 rounded border text-[11px] font-bold cursor-pointer ${
                                  v === false ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-slate-300 text-slate-600'
                                }`}
                              >
                                ไม่ถูกต้อง
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {complexQuizChecked ? (
                    <span className="text-xs font-semibold text-indigo-900">
                      {allOk
                        ? 'ตอบถูกต้องทุกข้อย่อย! (+10 XP)'
                        : 'เฉลย: ข้อ 1 ถูก (Decision มี 2 ทาง), ข้อ 2 ผิด (Process คือลงมือทำ ไม่ใช่เงื่อนไข), ข้อ 3 ถูก (ลูกศรย้อนกลับคือ Loop)'}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500">เลือกคำตอบครบ 3 ข้อย่อยแล้วกดตรวจ</span>
                  )}
                  {!complexQuizChecked && (
                    <button
                      type="button"
                      disabled={!allPicked}
                      onClick={() => {
                        setComplexQuizChecked(true);
                        if (allOk && addPoints) addPoints(10);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold cursor-pointer"
                    >
                      ตรวจข้อเลือกตอบเชิงซ้อน
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
