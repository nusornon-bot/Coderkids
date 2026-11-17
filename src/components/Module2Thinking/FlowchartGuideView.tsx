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
}

interface EditorPaletteItem {
  kind: EditorSymbolKind;
  nameTh: string;
  visualName: string;
  visualEmoji: string;
  defaultLabel: string;
  badgeText: string;
  cardClass: string;
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
  },
  {
    kind: 'input',
    nameTh: 'รับข้อมูลเข้า (Input)',
    visualName: '🎤 รับข้อมูลเข้า (Input)',
    visualEmoji: '🎤',
    defaultLabel: 'รับค่าข้อมูลจากผู้ใช้',
    badgeText: 'Input',
    cardClass: 'bg-sky-50 border-sky-300 text-sky-900',
  },
  {
    kind: 'process',
    nameTh: 'ลงมือทำ / ประมวลผล (Process)',
    visualName: '⚙️ ลงมือทำ (Process)',
    visualEmoji: '⚙️',
    defaultLabel: 'คำนวณหรือทำงานตามคำสั่ง',
    badgeText: 'Process',
    cardClass: 'bg-indigo-50 border-indigo-300 text-indigo-900',
  },
  {
    kind: 'decision',
    nameTh: 'ตรวจสอบเงื่อนไข (Decision)',
    visualName: '🤔 ทางแยกตัดสินใจ (Decision)',
    visualEmoji: '🤔',
    defaultLabel: 'ตรวจสอบเงื่อนไข ใช่หรือไม่?',
    badgeText: 'Decision ◇',
    cardClass: 'bg-amber-50 border-amber-400 text-amber-900',
  },
  {
    kind: 'output',
    nameTh: 'แสดงผลลัพธ์ (Output)',
    visualName: '📺 แสดงผลบนจอ (Output)',
    visualEmoji: '📺',
    defaultLabel: 'แสดงผลลัพธ์บนหน้าจอ',
    badgeText: 'Output',
    cardClass: 'bg-cyan-50 border-cyan-300 text-cyan-900',
  },
  {
    kind: 'end',
    nameTh: 'จุดสิ้นสุด (End)',
    visualName: '🏁 เส้นชัย (End)',
    visualEmoji: '🏁',
    defaultLabel: 'จบการทำงาน (End)',
    badgeText: 'Terminator',
    cardClass: 'bg-rose-50 border-rose-300 text-rose-900',
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
];

export const FlowchartGuideView: React.FC<FlowchartGuideViewProps> = ({ addPoints }) => {
  const [selectedSymbolId, setSelectedSymbolId] = useState<string>('terminator');
  const [symbolDisplayMode, setSymbolDisplayMode] = useState<'visual' | 'text'>('visual');
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
  const [activeMissionId, setActiveMissionId] = useState<string>('mission_free');
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [editorHistory, setEditorHistory] = useState<{
    past: EditorNode[][];
    present: EditorNode[];
    future: EditorNode[][];
  }>({
    past: [],
    present: [
      { uid: 'init_1', kind: 'start', label: 'เริ่มต้น (Start)' },
      { uid: 'init_2', kind: 'process', label: 'ลงมือทำขั้นตอนที่ 1' },
    ],
    future: [],
  });
  const editorNodes = editorHistory.present;
  const lastTextEditMetaRef = React.useRef<{ key: string; time: number }>({ key: '', time: 0 });
  const [draggedPaletteKind, setDraggedPaletteKind] = useState<EditorSymbolKind | null>(null);
  const [draggedNodeIndex, setDraggedNodeIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [isCanvasDragOver, setIsCanvasDragOver] = useState<boolean>(false);
  const [editorValidation, setEditorValidation] = useState<{
    valid: boolean;
    message: string;
    tips: string[];
  } | null>(null);
  const [editorActiveStep, setEditorActiveStep] = useState<number | null>(null);
  const [editorIsRunning, setEditorIsRunning] = useState<boolean>(false);
  const [editorRewarded, setEditorRewarded] = useState<boolean>(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const exportFeedbackTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
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
  };

  const handleRedo = () => {
    if (!canRedo) return;
    lastTextEditMetaRef.current = { key: '', time: 0 };
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
    commitEditorNodes(() => []);
    setActiveTemplateId(null);
    setActiveMissionId('mission_free');
    setEditorValidation(null);
    setEditorActiveStep(null);
    setExportFeedback(null);
    setDraggedPaletteKind(null);
    setDraggedNodeIndex(null);
    setDropTargetIndex(null);
    setIsCanvasDragOver(false);
  };

  useEffect(() => {
    return () => {
      if (exportFeedbackTimerRef.current) {
        clearTimeout(exportFeedbackTimerRef.current);
      }
    };
  }, []);

  const showExportFeedback = (message: string) => {
    setExportFeedback(message);
    if (exportFeedbackTimerRef.current) {
      clearTimeout(exportFeedbackTimerRef.current);
    }
    exportFeedbackTimerRef.current = setTimeout(() => {
      setExportFeedback(null);
    }, 4000);
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
      nodeCount: editorNodes.length,
      nodes: editorNodes.map((n, index) => ({
        step: index + 1,
        kind: n.kind,
        label: n.label,
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

  const createEditorNode = (kind: EditorSymbolKind): EditorNode => {
    const meta = EDITOR_PALETTE.find((p) => p.kind === kind) || EDITOR_PALETTE[2];
    return {
      uid: `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      kind,
      label: meta.defaultLabel,
      ...(kind === 'decision'
        ? { trueAction: 'ทำคำสั่งฝั่งใช่ ✅', falseAction: 'ทำคำสั่งฝั่งไม่ใช่ ❌' }
        : {}),
    };
  };

  const addNodeToCanvas = (kind: EditorSymbolKind, insertAt?: number) => {
    if (editorIsRunning) return;
    const newNode = createEditorNode(kind);
    commitEditorNodes((prev) => {
      if (typeof insertAt === 'number' && insertAt >= 0 && insertAt <= prev.length) {
        const copy = [...prev];
        copy.splice(insertAt, 0, newNode);
        return copy;
      }
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
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    });
    setEditorValidation(null);
  };

  const loadEditorMission = (missionId: string) => {
    const found = EDITOR_MISSIONS.find((m) => m.id === missionId);
    if (!found) return;
    setActiveMissionId(missionId);
    setActiveTemplateId(null);
    commitEditorNodes(() =>
      found.starterNodes.map((n, idx) => ({
        ...n,
        uid: `mission_${missionId}_${idx}_${Date.now()}`,
      }))
    );
    setEditorValidation(null);
    setEditorActiveStep(null);
    setEditorIsRunning(false);
  };

  const loadFlowchartTemplate = (templateId: string) => {
    if (editorIsRunning) return;
    const tpl = FLOWCHART_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setActiveTemplateId(templateId);
    setActiveMissionId('mission_free');
    commitEditorNodes(() =>
      tpl.nodes.map((n, idx) => ({
        ...n,
        uid: `tpl_${templateId}_${idx}_${Date.now()}`,
      }))
    );
    setEditorActiveStep(null);
    setEditorValidation({
      valid: true,
      message: `✨ โหลดแม่แบบ "${tpl.patternTag}" ลงกระดานเรียบร้อยแล้ว! ลองแก้ไขข้อความ ย้ายลำดับ หรือกด "ตรวจ & รันผังงาน" ได้เลย`,
      tips: [`โครงสร้างแม่แบบ: ${tpl.previewFlow}`],
    });
  };

  const handleCanvasDrop = (e: React.DragEvent, insertIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCanvasDragOver(false);
    setDropTargetIndex(null);

    if (draggedPaletteKind) {
      addNodeToCanvas(draggedPaletteKind, insertIndex);
      setDraggedPaletteKind(null);
      return;
    }

    if (draggedNodeIndex !== null && typeof insertIndex === 'number') {
      commitEditorNodes((prev) => {
        if (draggedNodeIndex < 0 || draggedNodeIndex >= prev.length) return prev;
        const copy = [...prev];
        const [moved] = copy.splice(draggedNodeIndex, 1);
        const adjustedIdx = draggedNodeIndex < insertIndex ? insertIndex - 1 : insertIndex;
        copy.splice(Math.max(0, Math.min(copy.length, adjustedIdx)), 0, moved);
        return copy;
      });
      setDraggedNodeIndex(null);
      setEditorValidation(null);
    }
  };

  const validateAndRunEditorFlowchart = async () => {
    if (editorIsRunning) return;
    const tips: string[] = [];

    if (editorNodes.length === 0) {
      setEditorValidation({
        valid: false,
        message: 'ผังงานยังว่างอยู่เลย! ลองลากสัญลักษณ์จากด้านซ้ายมาวางบนกระดานก่อนนะครับ',
        tips: ['ต้องมีจุดเริ่มต้น (Start) และจุดสิ้นสุด (End)'],
      });
      return;
    }

    if (editorNodes[0].kind !== 'start') {
      tips.push('กล่องแรกสุดควรเป็น "จุดเริ่มต้น (Start)" รูปวงรีครับ');
    }
    if (editorNodes[editorNodes.length - 1].kind !== 'end') {
      tips.push('กล่องสุดท้ายควรเป็น "จุดสิ้นสุด (End)" รูปวงรีครับ');
    }
    const middleNodes = editorNodes.slice(1, -1);
    if (editorNodes.length < 3 || middleNodes.length === 0) {
      tips.push('ควรมีขั้นตอนการทำงาน (Process / Input / Decision / Output) อย่างน้อย 1 กล่องระหว่างจุดเริ่มต้นและสิ้นสุด');
    }
    if (activeMissionId === 'mission_door' && !editorNodes.some((n) => n.kind === 'decision')) {
      tips.push('ภารกิจประตูอัตโนมัติต้องมีกล่อง "ตรวจสอบเงื่อนไข (Decision ◇)" ด้วยนะครับ');
    }

    // Run step-by-step highlight animation through student's logic chain
    setEditorIsRunning(true);
    for (let i = 0; i < editorNodes.length; i++) {
      setEditorActiveStep(i);
      await new Promise((resolve) => setTimeout(resolve, 550));
    }
    setEditorActiveStep(null);
    setEditorIsRunning(false);

    if (tips.length === 0) {
      setEditorValidation({
        valid: true,
        message: `🎉 ยอดเยี่ยมมาก! ผังงานของคุณมีโครงสร้างถูกต้องตามกฎทองครบทุกข้อ (ทั้งหมด ${editorNodes.length} ขั้นตอน)`,
        tips: ['ลองบันทึกภาพหน้าจอหรืออธิบายลำดับขั้นให้เพื่อนฟังได้เลย!'],
      });
      if (!editorRewarded && addPoints) {
        setEditorRewarded(true);
        addPoints(25);
      }
    } else {
      setEditorValidation({
        valid: false,
        message: 'ผังงานรันจบแล้ว แต่ยังปรับให้สมบูรณ์ตามกฎ Flowchart ได้อีกนิดนะ:',
        tips,
      });
    }
  };

  const renderFlowNodeBox = (node: FlowchartStepNode, idx: number) => {
    const isCurrent = idx === activeStepIdx;
    const isPassed = idx < activeStepIdx;

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
        {idx < traceNodes.length - 1 && (
          <div className="my-1 flex flex-col items-center text-slate-400">
            <ArrowDown className={`w-4 h-4 ${isPassed || isCurrent ? 'text-indigo-500' : ''}`} />
          </div>
        )}
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
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
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
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              1. คลังสัญลักษณ์ (ลากไปวาง หรือคลิกเพิ่ม)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {EDITOR_PALETTE.map((item) => (
                <div
                  key={item.kind}
                  draggable={!editorIsRunning}
                  onDragStart={() => {
                    setDraggedPaletteKind(item.kind);
                    setDraggedNodeIndex(null);
                  }}
                  onDragEnd={() => {
                    setDraggedPaletteKind(null);
                    setDropTargetIndex(null);
                    setIsCanvasDragOver(false);
                  }}
                  onClick={() => addNodeToCanvas(item.kind)}
                  className={`p-3 rounded-xl border-2 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing hover:shadow-sm transition-all select-none ${item.cardClass}`}
                  title="ลากไปวางบนกระดาน หรือคลิกเพื่อเพิ่มต่อท้าย"
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
                  <span className="w-6 h-6 rounded-lg bg-white/80 flex items-center justify-center shrink-0">
                    <Plus className="w-3.5 h-3.5" />
                  </span>
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
                  title="ย้อนกลับ (Undo)"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>ย้อนกลับ</span>
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
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 hover:bg-sky-50 hover:text-sky-700 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FileJson className="w-3.5 h-3.5" />
                    <span>บันทึก JSON</span>
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
                  disabled={editorIsRunning}
                  onClick={validateAndRunEditorFlowchart}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{editorIsRunning ? 'กำลังรันทีละขั้น...' : 'ตรวจ & รันผังงาน'}</span>
                </button>
              </div>
            </div>

            {exportFeedback && (
              <div className="mb-2.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between gap-2">
                <span>{exportFeedback}</span>
                <button
                  type="button"
                  onClick={() => setExportFeedback(null)}
                  className="text-emerald-700 hover:text-emerald-950 font-bold text-[11px] cursor-pointer"
                >
                  ปิด
                </button>
              </div>
            )}

            {/* Drop Canvas Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsCanvasDragOver(true);
              }}
              onDragLeave={() => setIsCanvasDragOver(false)}
              onDrop={(e) => handleCanvasDrop(e, editorNodes.length)}
              className={`min-h-[360px] max-h-[680px] overflow-auto rounded-2xl border-2 border-dashed p-4 sm:p-6 flex flex-col items-center transition-colors ${
                isCanvasDragOver
                  ? 'bg-indigo-50/70 border-indigo-400'
                  : 'bg-slate-50 border-slate-300'
              }`}
            >
              {editorNodes.length === 0 ? (
                <div className="my-auto text-center text-slate-400 space-y-2 py-8">
                  <div className="text-3xl">🧩</div>
                  <div className="text-sm font-bold text-slate-600">
                    ลากสัญลักษณ์มาวางที่นี่ เพื่อเริ่มสร้างสายโซ่ตรรกะของคุณ!
                  </div>
                  <div className="text-xs">
                    แนะนำ: เริ่มด้วย <strong>จุดเริ่มต้น (Start)</strong> → <strong>ขั้นตอนทำ/ตัดสินใจ</strong> → <strong>จุดสิ้นสุด (End)</strong>
                  </div>
                </div>
              ) : (
                <div className={`w-full max-w-md mx-auto flex flex-col items-center transition-all ${currentZoom.className}`}>
                  {editorNodes.map((node, idx) => {
                    const isRunningHere = editorActiveStep === idx;
                    const isDroppingAbove = dropTargetIndex === idx;

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

                    const kindLabel =
                      symbolDisplayMode === 'visual'
                        ? EDITOR_PALETTE.find((p) => p.kind === node.kind)?.visualName
                        : EDITOR_PALETTE.find((p) => p.kind === node.kind)?.nameTh;

                    return (
                      <React.Fragment key={node.uid}>
                        {/* Inter-node drop zone */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDropTargetIndex(idx);
                          }}
                          onDrop={(e) => handleCanvasDrop(e, idx)}
                          className={`w-full transition-all flex items-center justify-center ${
                            isDroppingAbove
                              ? 'h-8 my-1 rounded-lg bg-indigo-100 border-2 border-dashed border-indigo-400 text-[10px] font-bold text-indigo-700'
                              : 'h-2'
                          }`}
                        >
                          {isDroppingAbove && 'วางแทรกตรงนี้'}
                        </div>

                        <div
                          draggable={!editorIsRunning}
                          onDragStart={() => {
                            setDraggedNodeIndex(idx);
                            setDraggedPaletteKind(null);
                          }}
                          onDragEnd={() => {
                            setDraggedNodeIndex(null);
                            setDropTargetIndex(null);
                          }}
                          className={`w-full border-2 p-3 transition-all shadow-xs ${nodeContainerShape} ${nodeColor} ${
                            isRunningHere ? 'ring-4 ring-indigo-300 scale-[1.03] shadow-md bg-indigo-50!' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-80">
                              <GripVertical className="w-3.5 h-3.5 cursor-grab" />
                              <span>
                                #{idx + 1} · {kindLabel}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={editorIsRunning || idx === 0}
                                onClick={() => moveEditorNode(idx, 'up')}
                                className="p-1 rounded bg-white/80 hover:bg-white text-slate-600 disabled:opacity-30 cursor-pointer"
                                title="เลื่อนขึ้น"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={editorIsRunning || idx === editorNodes.length - 1}
                                onClick={() => moveEditorNode(idx, 'down')}
                                className="p-1 rounded bg-white/80 hover:bg-white text-slate-600 disabled:opacity-30 cursor-pointer"
                                title="เลื่อนลง"
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
                                <div className="text-[9px] font-bold text-emerald-700 mb-0.5">✔️ ถ้า ใช่ (True):</div>
                                <input
                                  type="text"
                                  value={node.trueAction || ''}
                                  disabled={editorIsRunning}
                                  onChange={(e) => updateDecisionBranch(node.uid, 'trueAction', e.target.value)}
                                  className="w-full px-1.5 py-1 rounded bg-white border border-emerald-200 text-[11px] font-semibold text-slate-800 focus:outline-none"
                                />
                              </div>
                              <div className="bg-rose-50 border border-rose-200 rounded-lg p-1.5">
                                <div className="text-[9px] font-bold text-rose-700 mb-0.5">❌ ถ้า ไม่ใช่ (False):</div>
                                <input
                                  type="text"
                                  value={node.falseAction || ''}
                                  disabled={editorIsRunning}
                                  onChange={(e) => updateDecisionBranch(node.uid, 'falseAction', e.target.value)}
                                  className="w-full px-1.5 py-1 rounded bg-white border border-rose-200 text-[11px] font-semibold text-slate-800 focus:outline-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {idx < editorNodes.length - 1 && (
                          <div className="my-1 text-slate-400">
                            <ArrowDown className={`w-4 h-4 ${isRunningHere ? 'text-indigo-600 scale-125' : ''}`} />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Bottom drop hint */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDropTargetIndex(editorNodes.length);
                    }}
                    onDrop={(e) => handleCanvasDrop(e, editorNodes.length)}
                    className={`w-full mt-2 py-2 rounded-xl border border-dashed text-center text-[11px] transition-colors ${
                      dropTargetIndex === editorNodes.length
                        ? 'bg-indigo-100 border-indigo-400 text-indigo-800 font-bold'
                        : 'border-slate-300 text-slate-400'
                    }`}
                  >
                    + ลากสัญลักษณ์มาปล่อยที่นี่เพื่อต่อท้าย
                  </div>
                </div>
              )}
            </div>

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
        </div>
      </div>
    </div>
  );
};
