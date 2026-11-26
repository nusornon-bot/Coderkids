export interface FlowchartSymbolInfo {
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

export const FLOWCHART_SYMBOLS: FlowchartSymbolInfo[] = [
  {
    id: 'terminator',
    nameTh: 'จุดเริ่มต้น / สิ้นสุด',
    nameEn: 'Terminator (Start/End)',
    shapeType: 'terminator',
    colorClass: 'border-rose-300 bg-rose-50 text-rose-800',
    meaningForKids:
      'ใช้บอก "จุดเริ่มต้น (Start)" ตอนเปิดผังงาน และ "จุดสิ้นสุด (End)" เมื่อทำงานจบครบทุกขั้นตอน',
    sampleInside: 'เริ่มต้น (Start) / จบ (End)',
    commonMistake: 'ลืมใส่จุดเริ่มต้นหรือจุดสิ้นสุด หรือใช้สี่เหลี่ยมผืนผ้าแทนวงรี',
    visualEmoji: '🚦',
    visualTitle: 'ป้ายออกตัว & เส้นชัย',
    visualMetaphor:
      'เหมือนจุดปล่อยตัวนักวิ่ง 🏁 และเส้นชัย — ทุกการผจญภัยต้องรู้ว่าเริ่มตรงไหนและจบตรงไหน!',
    visualCue: '🟢 เริ่มต้น ➔ ... ➔ 🏁 จบ',
  },
  {
    id: 'process',
    nameTh: 'การปฏิบัติงาน / ประมวลผล',
    nameEn: 'Process',
    shapeType: 'process',
    colorClass: 'border-indigo-300 bg-indigo-50 text-indigo-800',
    meaningForKids:
      'ใช้เขียนคำสั่ง "ลงมือทำ" หรือการคำนวณ เช่น แปรงฟัน, บวกคะแนน, เดินหน้า 10 ก้าว',
    sampleInside: 'คำนวณ คะแนน = คะแนน + 10',
    commonMistake: 'เอาคำถามที่มี "ใช่/ไม่ใช่" มาใส่ในสี่เหลี่ยมผืนผ้าแทนรูปข้าวหลามตัด',
    visualEmoji: '⚙️',
    visualTitle: 'กล่องลงมือทำ',
    visualMetaphor:
      'เหมือนฟันเฟืองหุ่นยนต์ ⚙️ ที่กำลังทำงานตามคำสั่งทีละอย่าง เช่น เดินหน้า บวกเลข หรือแปรงฟัน',
    visualCue: '⚙️ ทำภารกิจ / คำนวณ',
  },
  {
    id: 'decision',
    nameTh: 'การตัดสินใจ / เงื่อนไข',
    nameEn: 'Decision',
    shapeType: 'decision',
    colorClass: 'border-amber-300 bg-amber-50 text-amber-800',
    meaningForKids:
      'ใช้ตั้ง "คำถามตรวจสอบเงื่อนไข" ที่มีคำตอบได้ 2 ทาง คือ จริง (ใช่/Yes) หรือ เท็จ (ไม่ใช่/No)',
    sampleInside: 'คะแนน >= 50 หรือไม่?',
    commonMistake:
      'ลืมเขียนคำว่า "ใช่ (จริง)" กับ "ไม่ใช่ (เท็จ)" กำกับไว้บนเส้นลูกศรที่ออกจากรูปข้าวหลามตัด',
    visualEmoji: '🤔',
    visualTitle: 'ทางแยก 2 ทาง (ใช่ / ไม่ใช่)',
    visualMetaphor:
      'เหมือนป้ายทางแยกที่มีคำถามชวนคิด 🤔 ถ้าตอบ "ใช่ ✔️" เลี้ยวทางหนึ่ง ถ้า "ไม่ใช่ ❌" ไปอีกทางหนึ่ง!',
    visualCue: '✔️ ใช่ (True) ⟷ ❌ ไม่ใช่ (False)',
  },
  {
    id: 'io',
    nameTh: 'รับข้อมูลเข้า / แสดงผลลัพธ์',
    nameEn: 'Input / Output',
    shapeType: 'io',
    colorClass: 'border-sky-300 bg-sky-50 text-sky-800',
    meaningForKids:
      'ใช้เมื่อโปรแกรม "รับค่าจากผู้ใช้" (เช่น กดปุ่ม, พิมพ์ชื่อ) หรือ "แสดงผลบนหน้าจอ"',
    sampleInside: 'รับค่าอายุ / แสดงคำว่า "ผ่าน!"',
    commonMistake: 'วาดกรอบเอียงสี่เหลี่ยมด้านขนานผิดด้าน หรือสลับกับการประมวลผล',
    visualEmoji: '🎤',
    visualTitle: 'รับเข้า & โชว์ผล',
    visualMetaphor:
      'เหมือนไมโครโฟน 🎤 รับเสียงหรือพิมพ์ข้อความเข้ามา แล้วส่งภาพ/เสียงออกไปโชว์บนหน้าจอ 📺',
    visualCue: '📥 รับค่าเข้า ➔ 📤 แสดงบนจอ',
  },
  {
    id: 'flow',
    nameTh: 'ลูกศรทิศทางการทำงาน',
    nameEn: 'Flow Line',
    shapeType: 'flow',
    colorClass: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    meaningForKids:
      'บอกลำดับว่าจะทำงานกล่องไหนก่อน-หลัง โดยนิยมลากจาก "บนลงล่าง" หรือ "ซ้ายไปขวา"',
    sampleInside: '↓ หรือ →',
    commonMistake: 'วาดเป็นเส้นตรงเฉยๆ ไม่มีหัวลูกศร ทำให้อ่านไม่ออกว่าต้องเดินไปทางไหน',
    visualEmoji: '🧭',
    visualTitle: 'ป้ายลูกศรนำทาง',
    visualMetaphor:
      'เหมือนป้ายบอกทางบนถนน 🧭 พาเดินจากกล่องหนึ่งไปยังกล่องถัดไปอย่างเป็นระเบียบ ไม่หลงทาง!',
    visualCue: '⬇️ เดินลง / ➡️ ไปขวา',
  },
  {
    id: 'connector',
    nameTh: 'จุดเชื่อมต่อ (ในหน้าเดียวกัน)',
    nameEn: 'On-Page Connector',
    shapeType: 'connector',
    colorClass: 'border-violet-300 bg-violet-50 text-violet-800',
    meaningForKids:
      'ใช้รวมเส้นลูกศรจากหลายทางให้กลับมาเชื่อมกันอย่างเป็นระเบียบ ก่อนไปขั้นตอนถัดไป',
    sampleInside: '○ จุดรวมเส้น',
    commonMistake: 'ลากเส้นตัดทับกันไปมาจนอ่านสับสนแทนที่จะใช้จุดเชื่อมต่อ',
    visualEmoji: '🔗',
    visualTitle: 'วงเวียนรวมเส้นทาง',
    visualMetaphor:
      'เหมือนวงเวียนถนน 🔗 ที่รวมรถจากทางแยก ใช่/ไม่ใช่ ให้กลับมารวมกันเป็นเส้นทางเดียว!',
    visualCue: '⭕ รวมเส้นทางให้เรียบร้อย',
  },
];

export interface FlowchartStepNode {
  id: string;
  shape: 'terminator' | 'process' | 'decision' | 'io';
  text: string;
  explanation: string;
  branchTag?: string;
}

export interface FlowchartExample {
  id: string;
  grade: 'ป.4' | 'ป.5' | 'ป.6';
  structureType: string;
  title: string;
  subtitle: string;
  interactiveMode?: 'score' | 'weather' | 'loop5' | 'light';
  pseudocode: string[];
  scratchHint: string;
}

export const FLOWCHART_EXAMPLES: FlowchartExample[] = [
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
    scratchHint:
      'เรียงบล็อกต่อกันตรงๆ: เตรียมตัว -> แปรงฟัน -> บ้วนปาก -> พูดว่า "ฟันสะอาดแล้ว!"',
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
    scratchHint:
      'เหมือนลำดับเหตุการณ์: รอ 3 วินาที (wait 3 secs) แล้วเปลี่ยนชุดตัวละครเป็นชามบะหมี่',
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
    scratchHint:
      'ใช้บล็อก if <(score) >= (50)> then [say ผ่าน] else [say ทบทวนใหม่]',
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
    scratchHint:
      'Micro:bit: forever { if (light level < 50) show LEDs ON else clear screen }',
  },
];

export const FLOWCHART_QUIZ = [
  {
    q: 'สัญลักษณ์รูป "สี่เหลี่ยมข้าวหลามตัด ◇" ในผังงาน Flowchart มีหน้าที่ทำอะไร?',
    options: [
      'แสดงจุดเริ่มต้นและจุดสิ้นสุดของการทำงานในผังงานทั้งหมด',
      'ตรวจสอบเงื่อนไขและการตัดสินใจที่มีทางออกเป็นจริงหรือเท็จ',
      'สั่งคำนวณตัวเลขทางคณิตศาสตร์หรือสั่งให้ตัวละครเดินหน้า',
    ],
    correct: 1,
    explanation:
      'ถูกต้อง! สี่เหลี่ยมข้าวหลามตัด (Decision) ใช้ตั้งคำถามตรวจสอบเงื่อนไข เช่น คะแนน >= 50 หรือไม่ โดยมีทางออกเป็น "ใช่" กับ "ไม่ใช่"',
  },
  {
    q: 'หากต้องการเขียนกล่องข้อความว่า "เริ่มต้น" และ "จบการทำงาน" ต้องใช้รูปสัญลักษณ์ใด?',
    options: [
      'รูปวงรีหรือแคปซูล (Terminator)',
      'รูปสี่เหลี่ยมผืนผ้า (Process)',
      'รูปสี่เหลี่ยมด้านขนาน (Input)',
    ],
    correct: 0,
    explanation:
      'เก่งมาก! ทุกผังงานต้องขึ้นต้นและลงท้ายด้วยรูปวงรี/แคปซูล (Terminator) เสมอ',
  },
  {
    q: 'ข้อใดใช้สัญลักษณ์ "สี่เหลี่ยมด้านขนาน ▱ (Input / Output)" ได้ถูกต้อง?',
    options: [
      'สั่งให้ตัวละครเดินหน้า 5 ก้าวและคำนวณคะแนนสะสมในเกม',
      'ตรวจสอบเงื่อนไขคำถามว่าสภาพอากาศวันนี้ฝนตกหรือไม่',
      'รับค่าชื่อนักเรียนจากคีย์บอร์ดและแสดงผลคะแนนบนหน้าจอ',
    ],
    correct: 2,
    explanation:
      'ถูกต้อง! สี่เหลี่ยมด้านขนานใช้สำหรับรับข้อมูลเข้า (Input) หรือแสดงผลลัพธ์ออกทางหน้าจอ/ลำโพง (Output)',
  },
  {
    q: 'ตามหลักการเขียนผังงาน Flowchart ที่ดี ควรวาดทิศทางลูกศรอย่างไร?',
    options: [
      'ลากเส้นจากบนลงล่างหรือซ้ายไปขวาพร้อมหัวลูกศรชัดเจน',
      'วาดสลับขึ้นลงตัดเส้นทับกันไปมาเพื่อประหยัดพื้นที่กระดาษ',
      'ใช้เพียงเส้นตรงเชื่อมต่อกันโดยไม่ต้องใส่หัวลูกศรกำกับ',
    ],
    correct: 0,
    explanation:
      'เยี่ยมมาก! การวาดจากบนลงล่างหรือซ้ายไปขวา พร้อมหัวลูกศรที่ชัดเจน จะช่วยให้ทุกคนอ่านเข้าใจตรงกัน',
  },
  {
    q: 'ในโครงสร้างแบบวนซ้ำ (Loop) ลูกศรหลังจากทำงานครบ 1 รอบจะชี้ไปที่ใด?',
    options: [
      'ชี้ตรงไปยังจุดสิ้นสุด (End) ทันทีโดยไม่ต้องตรวจสอบเงื่อนไข',
      'ชี้แยกออกไปนอกกรอบผังงานเพื่อหยุดการทำงานของโปรแกรมทั้งหมด',
      'ชี้วนย้อนกลับไปที่จุดตรวจเงื่อนไขด้านบนเพื่อดูรอบการทำงานถัดไป',
    ],
    correct: 2,
    explanation:
      'ถูกต้อง! หัวใจของ Loop คือลูกศรต้องวนย้อนกลับไปตรวจสอบเงื่อนไขซ้ำ จนกว่าเงื่อนไขจะเปลี่ยนเป็นเท็จจึงออกจาก Loop ได้',
  },
];

export type EditorSymbolKind =
  | 'start'
  | 'input'
  | 'process'
  | 'decision'
  | 'output'
  | 'end';

export interface EditorNode {
  uid: string;
  kind: EditorSymbolKind;
  label: string;
  trueAction?: string;
  falseAction?: string;
  x?: number;
  y?: number;
}

export const CANVAS_GRID_SIZE = 24;
export const CANVAS_LOGICAL_WIDTH = 720;
export const NODE_CARD_WIDTH = 336;
export const CANVAS_PADDING = 24;
export const CENTER_NODE_X = (CANVAS_LOGICAL_WIDTH - NODE_CARD_WIDTH) / 2; // 192px (8 * 24)
export const CONNECTOR_VERTICAL_GAP = 48; // 2 * 24

export const getEstimatedNodeHeight = (kind: EditorSymbolKind): number =>
  kind === 'decision' ? 168 : 96;

export const snapCoordinate = (
  value: number,
  enabled: boolean,
  gridSize = CANVAS_GRID_SIZE
): number => (enabled ? Math.round(value / gridSize) * gridSize : Math.round(value));

export const clampNodePosition = (x: number, y: number): { x: number; y: number } => ({
  x: Math.max(
    CANVAS_PADDING,
    Math.min(CANVAS_LOGICAL_WIDTH - NODE_CARD_WIDTH - CANVAS_PADDING, x)
  ),
  y: Math.max(CANVAS_PADDING, y),
});

export const layoutNodesTidily = (
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

export const ensureNodeCoordinates = (
  nodes: EditorNode[],
  snapEnabled = true
): EditorNode[] => {
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

export interface EditorPaletteItem {
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

export const EDITOR_PALETTE: EditorPaletteItem[] = [
  {
    kind: 'start',
    nameTh: 'จุดเริ่มต้น (Start)',
    visualName: '🚦 ป้ายออกตัว (Start)',
    visualEmoji: '🚦',
    defaultLabel: 'เริ่มต้นการทำงาน (Start)',
    badgeText: 'Terminator',
    cardClass: 'bg-rose-50 border-rose-300 text-rose-900',
    tooltipFunction: 'ใช้บอกจุดเริ่มต้นการทำงานของโปรแกรมหรือผังงานทุกชิ้น',
    tooltipBestUse:
      'วางเป็นกล่องแรกสุดเสมอ (เช่น "เริ่มต้นทำแซนด์วิช" หรือ "เปิดระบบไฟอัตโนมัติ")',
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
    tooltipBestUse:
      'ใช้เมื่อต้องถามข้อมูลหรือวัดค่าก่อนคิด (เช่น กดปุ่ม A, พิมพ์คะแนน, อ่านค่าความชื้นดิน)',
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
    tooltipBestUse:
      'ใช้สำหรับทุกการกระทำหรือสูตรคำนวณ (เช่น บวกคะแนน +1, เปิดปั๊มน้ำ, เดินหน้า 10 ก้าว)',
  },
  {
    kind: 'decision',
    nameTh: 'ตรวจสอบเงื่อนไข (Decision)',
    visualName: '🤔 ทางแยกตัดสินใจ (Decision)',
    visualEmoji: '🤔',
    defaultLabel: 'ตรวจสอบเงื่อนไข ใช่หรือไม่?',
    badgeText: 'Decision ◇',
    cardClass: 'bg-amber-50 border-amber-400 text-amber-900',
    tooltipFunction:
      'ใช้ตั้งคำถามเพื่อตัดสินใจแยกเส้นทางเป็น 2 ทาง คือ "ใช่ (True)" หรือ "ไม่ใช่ (False)"',
    tooltipBestUse:
      'ใช้เมื่อต้องเปรียบเทียบหรือทำซ้ำ Loop (เช่น คะแนน >= 50?, ฝนตกไหม?, ตัวนับ <= 5?)',
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
    tooltipBestUse:
      'ใช้เมื่อต้องการโชว์ผลหลังประมวลผลเสร็จ (เช่น แสดงคำว่า "สอบผ่าน!", โชว์ไอคอนหัวใจบน LED)',
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

export const EDITOR_MISSIONS: Array<{
  id: string;
  title: string;
  description: string;
  starterNodes: Omit<EditorNode, 'uid'>[];
}> = [
  {
    id: 'mission_free',
    title: '🎨 โหมดอิสระ (สร้างผังงานเอง)',
    description:
      'ลากหรือคลิกสัญลักษณ์จากฝั่งซ้ายมาเรียงต่อกัน แล้วแก้ไขข้อความในกล่องได้ตามใจชอบ!',
    starterNodes: [
      { kind: 'start', label: 'เริ่มต้น (Start)' },
      { kind: 'process', label: 'ลงมือทำขั้นตอนที่ 1' },
    ],
  },
  {
    id: 'mission_sandwich',
    title: '🥪 ภารกิจ ป.4: ผังงานทำแซนด์วิช',
    description:
      'ลองเติมกล่อง "ลงมือทำ (Process)" และ "จุดสิ้นสุด (End)" ให้ครบ 4–5 ขั้นตอน!',
    starterNodes: [
      { kind: 'start', label: 'เริ่มต้นทำแซนด์วิช' },
      { kind: 'input', label: 'เตรียมขนมปังและไส้ทูน่า' },
    ],
  },
  {
    id: 'mission_door',
    title: '🤖 ภารกิจ ป.5–ป.6: ประตูอัตโนมัติ (Decision)',
    description:
      'สร้างผังงานตรวจจับคนเดินผ่านด้วยสัญลักษณ์ "ตรวจสอบเงื่อนไข (Decision ◇)" พร้อมผลลัพธ์!',
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

export interface FlowchartTemplateItem {
  id: string;
  patternTag: string;
  title: string;
  gradeTag: string;
  description: string;
  previewFlow: string;
  badgeColor: string;
  nodes: Omit<EditorNode, 'uid'>[];
}

export const FLOWCHART_TEMPLATES: FlowchartTemplateItem[] = [
  {
    id: 'tpl_ipo',
    patternTag: 'Input–Process–Output (IPO)',
    title: '📥 รับข้อมูล → ประมวลผล → แสดงผล',
    gradeTag: 'พื้นฐาน ป.4–ป.6',
    description:
      'แม่แบบหลักของโปรแกรมคอมพิวเตอร์: รับข้อมูลเข้า คำนวณผลลัพธ์ และแสดงออกหน้าจอ',
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
    description:
      'สั่งให้ทำงานเดิมซ้ำๆ อัตโนมัติ จนกว่าเงื่อนไขตัวนับรอบจะครบแล้วค่อยหยุด',
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
    description:
      'รูปแบบสร้างเกมยอดฮิต: กำหนดคะแนนเริ่มต้น ตรวจการชนเหรียญ และบวกแต้ม',
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
    description:
      'โครงงานสมองกลฝังตัว: อ่านค่าความชื้นดินแล้วสั่งเปิด/ปิดน้ำอัตโนมัติ',
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
    description:
      'ตัวอย่างการใช้เงื่อนไข If-Then-Else เลือกรูปแบบก่อนเข้าสู่ Repeat Loop เพื่อทำงานซ้ำอย่างเป็นระบบ',
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
    description:
      'ตัวอย่างลูปซ้อนลูป: ลูปนอกนับแถว (Row 1–3) และลูปในวาดดาว ★ แถวละ 4 ดวง รวม 12 ดวง',
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

export interface SharedFlowchartPayload {
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

export const VALID_EDITOR_KINDS: ReadonlyArray<EditorSymbolKind> = [
  'start',
  'input',
  'process',
  'decision',
  'output',
  'end',
];

export const encodeShareableFlowchart = (payload: SharedFlowchartPayload): string => {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const decodeShareableFlowchart = (
  encoded: string
): {
  nodes: EditorNode[];
  missionId: string;
  templateId: string | null;
  displayMode: 'visual' | 'text';
  snapToGrid: boolean;
} | null => {
  try {
    const padded =
      encoded.replace(/-/g, '+').replace(/_/g, '/') +
      '==='.slice((encoded.length + 3) % 4);
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

export const readSharedFlowchartFromUrl = () => {
  if (typeof window === 'undefined') return null;
  const fcParam = new URLSearchParams(window.location.search).get('fc');
  if (!fcParam) return null;
  return decodeShareableFlowchart(fcParam);
};

export interface ImportedFlowchartData {
  nodes: EditorNode[];
  missionId?: string;
  templateId?: string | null;
  displayMode?: 'visual' | 'text';
  snapToGrid?: boolean;
}

const clampText = (value: unknown, maxLen = 300): string =>
  typeof value === 'string' ? value.slice(0, maxLen) : '';

/**
 * Parses uploaded Flowchart JSON files safely.
 * Supports:
 * 1) Exported JSON ({ nodes: [{ kind, label, position?: { x, y }, trueAction?, falseAction? }] })
 * 2) Compact share payload JSON ({ v: 1, n: [...] })
 * 3) Raw array of EditorNode objects
 */
export function parseImportedFlowchartJson(
  rawText: string,
  defaultSnap = true
): ImportedFlowchartData | null {
  try {
    const parsed = JSON.parse(rawText);
    if (!parsed || typeof parsed !== 'object') return null;

    if (
      !Array.isArray(parsed) &&
      (parsed as Partial<SharedFlowchartPayload>).v === 1 &&
      Array.isArray((parsed as Partial<SharedFlowchartPayload>).n)
    ) {
      const shareObj = parsed as SharedFlowchartPayload;
      const snap = shareObj.g !== 0;
      const now = Date.now();
      const rawNodes: EditorNode[] = shareObj.n.slice(0, 100).flatMap((item, idx) => {
        if (!item || !VALID_EDITOR_KINDS.includes(item.k)) return [];
        return [
          {
            uid: `import_${now}_${idx}`,
            kind: item.k,
            label: clampText(item.l),
            ...(typeof item.x === 'number' && Number.isFinite(item.x) ? { x: item.x } : {}),
            ...(typeof item.y === 'number' && Number.isFinite(item.y) ? { y: item.y } : {}),
            ...(item.k === 'decision'
              ? {
                  trueAction: clampText(item.ta),
                  falseAction: clampText(item.fa),
                }
              : {}),
          },
        ];
      });
      if (rawNodes.length === 0) return null;
      return {
        nodes: ensureNodeCoordinates(rawNodes, snap),
        missionId:
          typeof shareObj.m === 'string' && EDITOR_MISSIONS.some((m) => m.id === shareObj.m)
            ? shareObj.m
            : 'mission_free',
        templateId:
          typeof shareObj.t === 'string' && FLOWCHART_TEMPLATES.some((t) => t.id === shareObj.t)
            ? shareObj.t
            : null,
        displayMode: shareObj.d === 'text' ? 'text' : 'visual',
        snapToGrid: snap,
      };
    }

    const rawList: unknown[] | null = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { nodes?: unknown[] }).nodes)
      ? (parsed as { nodes: unknown[] }).nodes
      : null;

    if (!rawList) return null;

    const meta = !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
    const snap = typeof meta.snapToGrid === 'boolean' ? meta.snapToGrid : defaultSnap;
    const now = Date.now();

    const nodes: EditorNode[] = rawList.slice(0, 100).flatMap((item, idx) => {
      if (!item || typeof item !== 'object') return [];
      const rec = item as Record<string, unknown>;
      const kind = rec.kind as EditorSymbolKind;
      if (!VALID_EDITOR_KINDS.includes(kind)) return [];

      const pos =
        rec.position && typeof rec.position === 'object'
          ? (rec.position as Record<string, unknown>)
          : null;
      const xVal =
        typeof rec.x === 'number' && Number.isFinite(rec.x)
          ? rec.x
          : pos && typeof pos.x === 'number' && Number.isFinite(pos.x)
          ? pos.x
          : undefined;
      const yVal =
        typeof rec.y === 'number' && Number.isFinite(rec.y)
          ? rec.y
          : pos && typeof pos.y === 'number' && Number.isFinite(pos.y)
          ? pos.y
          : undefined;

      return [
        {
          uid: `import_${now}_${idx}`,
          kind,
          label: clampText(rec.label),
          ...(xVal !== undefined ? { x: xVal } : {}),
          ...(yVal !== undefined ? { y: yVal } : {}),
          ...(kind === 'decision'
            ? {
                trueAction: clampText(rec.trueAction),
                falseAction: clampText(rec.falseAction),
              }
            : {}),
        },
      ];
    });

    if (nodes.length === 0) return null;

    return {
      nodes: ensureNodeCoordinates(nodes, snap),
      missionId:
        typeof meta.missionId === 'string' &&
        EDITOR_MISSIONS.some((m) => m.id === meta.missionId)
          ? meta.missionId
          : 'mission_free',
      templateId:
        typeof meta.templateId === 'string' &&
        FLOWCHART_TEMPLATES.some((t) => t.id === meta.templateId)
          ? meta.templateId
          : null,
      snapToGrid: snap,
    };
  } catch {
    return null;
  }
}

export interface FlowchartPythonLine {
  text: string;
  nodeIdx?: number;
}

export const stripDecorForPython = (raw: string): string =>
  raw
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

export const escapePyDoubleQuote = (raw: string): string =>
  raw.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

export const buildFlowchartPythonLines = (
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

  const ensureVar = (
    varName: string,
    defaultExpr: string,
    nodeIdx: number,
    comment?: string
  ) => {
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

    if (/ตัวนับ(?:รอบ)?\s*=\s*ตัวนับ(?:รอบ)?\s*\+\s*1|รอบ\s*\+\s*1/.test(clean)) {
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
        const varName =
          genericInputCount === 1 ? 'user_input' : `user_input_${genericInputCount}`;
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
          text: includeComments
            ? `${ind}score = 0  # กำหนดค่าเริ่มต้นตัวแปร`
            : `${ind}score = 0`,
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
          const hasInnerBlockLater = nodes
            .slice(idx + 1)
            .some((n) =>
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
      const tempMatch = clean.match(
        /(?:อุณหภูมิ|temp)[^\d><=]*(>=|<=|>|<|==|!=)\s*(\d+(?:\.\d+)?)/i
      );
      const moistureMatch = clean.match(
        /(?:ความชื้น|moisture)[^\d><=]*(>=|<=|>|<|==|!=)\s*(\d+(?:\.\d+)?)/i
      );
      const scoreMatch = clean.match(
        /(?:คะแนน|score)[^\d><=]*(>=|<=|>|<|==|!=)\s*(\d+(?:\.\d+)?)/i
      );
      const asciiCmpMatch = clean.match(
        /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(>=|<=|>|<|==|!=)\s*(\d+(?:\.\d+)?)/
      );

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

// ---------------- DYNAMIC FLOWCHART TRACE SIMULATOR ----------------

export interface FlowchartSimInputs {
  score: number;
  temp: number;
  moisture: number;
  button_a: boolean;
  motion_detected: boolean;
  is_raining: boolean;
  touch_coin: boolean;
  a: number;
  b: number;
  condition_ok: boolean;
}

export const DEFAULT_FLOWCHART_SIM_INPUTS: FlowchartSimInputs = {
  score: 75,
  temp: 32,
  moisture: 25,
  button_a: true,
  motion_detected: true,
  is_raining: true,
  touch_coin: true,
  a: 12,
  b: 8,
  condition_ok: true,
};

export interface FlowchartStepTrace {
  branch: 'true' | 'false' | 'loop' | null;
  summary: string;
}

export interface FlowchartTraceResult {
  stepResults: Record<number, FlowchartStepTrace>;
  variables: Record<string, string | number | boolean>;
  detectedInputKeys: Array<keyof FlowchartSimInputs>;
}

function compareValues(lhs: number, op: string, rhs: number): boolean {
  switch (op) {
    case '>=':
      return lhs >= rhs;
    case '<=':
      return lhs <= rhs;
    case '>':
      return lhs > rhs;
    case '<':
      return lhs < rhs;
    case '==':
      return lhs === rhs;
    case '!=':
      return lhs !== rhs;
    default:
      return lhs >= rhs;
  }
}

/**
 * Evaluates a user-authored flowchart dynamically against interactive test inputs
 * so students can see live True/False branching and variable values during simulation
 * and step-through tracing.
 */
export function evaluateFlowchartTrace(
  nodes: EditorNode[],
  inputs: FlowchartSimInputs
): FlowchartTraceResult {
  const detectedSet = new Set<keyof FlowchartSimInputs>();
  const addKey = (k: keyof FlowchartSimInputs) => detectedSet.add(k);

  for (const node of nodes) {
    const clean = stripDecorForPython(node.label);
    if (node.kind === 'input') {
      if (/\bA\b.*\bB\b/i.test(clean)) {
        addKey('a');
        addKey('b');
      } else if (/อุณหภูมิ|temp/i.test(clean)) {
        addKey('temp');
      } else if (/ความชื้น|moisture/i.test(clean)) {
        addKey('moisture');
      } else if (/คะแนน|score/i.test(clean)) {
        addKey('score');
      } else if (/ปุ่ม|button|โหมด/i.test(clean)) {
        addKey('button_a');
      } else if (/เซ็นเซอร์|เคลื่อนไหว|motion/i.test(clean)) {
        addKey('motion_detected');
      }
    } else if (node.kind === 'decision') {
      const isLoop = /repeat|loop|ตัวนับ|รอบ\s*<=|\b(row|col)\s*(<=|<)/i.test(clean);
      if (!isLoop) {
        if (/อุณหภูมิ|temp/i.test(clean)) addKey('temp');
        else if (/ความชื้น|moisture/i.test(clean)) addKey('moisture');
        else if (/คะแนน|score/i.test(clean)) addKey('score');
        else if (/ปุ่ม|button/i.test(clean)) addKey('button_a');
        else if (/มีคนเดิน|เคลื่อนไหว|motion/i.test(clean)) addKey('motion_detected');
        else if (/เหรียญ|coin/i.test(clean)) addKey('touch_coin');
        else if (/ฝนตก|rain/i.test(clean)) addKey('is_raining');
        else addKey('condition_ok');
      }
    }
  }

  const variables: Record<string, string | number | boolean> = {};
  const stepResults: Record<number, FlowchartStepTrace> = {};

  nodes.forEach((node, idx) => {
    const clean = stripDecorForPython(node.label);

    if (node.kind === 'start') {
      stepResults[idx] = { branch: null, summary: 'เริ่มต้นการทำงานของโปรแกรม' };
      return;
    }

    if (node.kind === 'end') {
      stepResults[idx] = { branch: null, summary: 'จบการทำงานครบทุกขั้นตอน' };
      return;
    }

    if (node.kind === 'input') {
      if (/\bA\b.*\bB\b/i.test(clean)) {
        variables.a = inputs.a;
        variables.b = inputs.b;
        stepResults[idx] = {
          branch: null,
          summary: `รับค่า a = ${inputs.a}, b = ${inputs.b}`,
        };
      } else if (/อุณหภูมิ|temp/i.test(clean)) {
        variables.temp = inputs.temp;
        stepResults[idx] = { branch: null, summary: `อ่านค่า temp = ${inputs.temp}°C` };
      } else if (/ความชื้น|moisture/i.test(clean)) {
        variables.moisture = inputs.moisture;
        stepResults[idx] = {
          branch: null,
          summary: `อ่านค่า moisture = ${inputs.moisture}%`,
        };
      } else if (/คะแนน|score/i.test(clean)) {
        variables.score = inputs.score;
        stepResults[idx] = { branch: null, summary: `รับค่า score = ${inputs.score}` };
      } else if (/ปุ่ม|button|โหมด/i.test(clean)) {
        variables.button_a = inputs.button_a;
        stepResults[idx] = {
          branch: null,
          summary: `button_a = ${inputs.button_a ? 'True (กดปุ่ม)' : 'False (ไม่กด)'}`,
        };
      } else if (/เซ็นเซอร์|เคลื่อนไหว|motion/i.test(clean)) {
        variables.motion_detected = inputs.motion_detected;
        stepResults[idx] = {
          branch: null,
          summary: `motion_detected = ${inputs.motion_detected ? 'True (พบคน)' : 'False (ไม่มีคน)'}`,
        };
      } else {
        stepResults[idx] = { branch: null, summary: `รับข้อมูลเข้า: ${clean || 'Input'}` };
      }
      return;
    }

    if (node.kind === 'process') {
      if (/ผลรวม\s*=\s*A\s*\+\s*B|A\s*\+\s*B/i.test(clean)) {
        const aVal = typeof variables.a === 'number' ? variables.a : inputs.a;
        const bVal = typeof variables.b === 'number' ? variables.b : inputs.b;
        variables.a = aVal;
        variables.b = bVal;
        variables.total = aVal + bVal;
        stepResults[idx] = {
          branch: null,
          summary: `คำนวณ total = ${aVal} + ${bVal} = ${variables.total}`,
        };
      } else if (/คะแนน\s*=\s*0|score\s*=\s*0/i.test(clean)) {
        variables.score = 0;
        stepResults[idx] = { branch: null, summary: 'กำหนด score = 0' };
      } else if (/\brow\s*=\s*(\d+)/i.test(clean)) {
        const m = clean.match(/\brow\s*=\s*(\d+)/i);
        variables.row = Number(m ? m[1] : 1);
        stepResults[idx] = { branch: null, summary: `กำหนด row = ${variables.row}` };
      } else if (/\bcol\s*=\s*(\d+)/i.test(clean)) {
        const m = clean.match(/\bcol\s*=\s*(\d+)/i);
        variables.col = Number(m ? m[1] : 1);
        stepResults[idx] = { branch: null, summary: `กำหนด col = ${variables.col}` };
      } else if (/ตัวนับ(?:รอบ)?\s*=\s*(\d+)/.test(clean)) {
        const m = clean.match(/ตัวนับ(?:รอบ)?\s*=\s*(\d+)/);
        variables.count = Number(m ? m[1] : 1);
        stepResults[idx] = { branch: null, summary: `กำหนด count = ${variables.count}` };
      } else {
        stepResults[idx] = { branch: null, summary: clean || 'ประมวลผลขั้นตอน' };
      }
      return;
    }

    if (node.kind === 'decision') {
      const isLoop = /repeat|loop|ตัวนับ|รอบ\s*<=|\b(row|col)\s*(<=|<)/i.test(clean);
      if (isLoop) {
        const isRow = /outer loop|\brow\s*(<=|<)/i.test(clean);
        const isCol = /inner loop|\bcol\s*(<=|<)/i.test(clean);
        if (isRow) {
          const m = clean.match(/\brow\s*(<=|<)\s*(\d+)/i);
          const limit = m ? Number(m[2]) : 3;
          variables.row = limit + 1;
          stepResults[idx] = {
            branch: 'loop',
            summary: `ลูปนอกทำงานครบ ${limit} แถว (row = 1..${limit})`,
          };
        } else if (isCol) {
          const m = clean.match(/\bcol\s*(<=|<)\s*(\d+)/i);
          const limit = m ? Number(m[2]) : 4;
          variables.col = limit + 1;
          stepResults[idx] = {
            branch: 'loop',
            summary: `ลูปในวาดครบ ${limit} ดวงต่อแถว (col = 1..${limit})`,
          };
        } else {
          const limit =
            typeof variables.blink_limit === 'number'
              ? variables.blink_limit
              : Number((clean.match(/(<=|<)\s*(\d+)/) || [])[2] || 4);
          variables.count = limit + 1;
          stepResults[idx] = {
            branch: 'loop',
            summary: `วนซ้ำจนครบ ${limit} รอบ แล้วออกจาก Loop`,
          };
        }
        return;
      }

      let isTrue = inputs.condition_ok;
      let detail = '';

      const tempMatch = clean.match(
        /(?:อุณหภูมิ|temp)[^\d><=]*(>=|<=|>|<|==|!=)\s*(\d+(?:\.\d+)?)/i
      );
      const moistureMatch = clean.match(
        /(?:ความชื้น|moisture)[^\d><=]*(>=|<=|>|<|==|!=)\s*(\d+(?:\.\d+)?)/i
      );
      const scoreMatch = clean.match(
        /(?:คะแนน|score)[^\d><=]*(>=|<=|>|<|==|!=)\s*(\d+(?:\.\d+)?)/i
      );

      if (tempMatch) {
        const t = typeof variables.temp === 'number' ? variables.temp : inputs.temp;
        isTrue = compareValues(t, tempMatch[1], Number(tempMatch[2]));
        detail = `temp (${t}) ${tempMatch[1]} ${tempMatch[2]} ➔ ${isTrue ? 'ใช่ (True)' : 'ไม่ใช่ (False)'}`;
      } else if (moistureMatch) {
        const m =
          typeof variables.moisture === 'number' ? variables.moisture : inputs.moisture;
        isTrue = compareValues(m, moistureMatch[1], Number(moistureMatch[2]));
        detail = `moisture (${m}) ${moistureMatch[1]} ${moistureMatch[2]} ➔ ${isTrue ? 'ใช่ (True)' : 'ไม่ใช่ (False)'}`;
      } else if (scoreMatch) {
        const s = typeof variables.score === 'number' ? variables.score : inputs.score;
        isTrue = compareValues(s, scoreMatch[1], Number(scoreMatch[2]));
        detail = `score (${s}) ${scoreMatch[1]} ${scoreMatch[2]} ➔ ${isTrue ? 'ใช่ (True)' : 'ไม่ใช่ (False)'}`;
      } else if (/ปุ่ม|button/i.test(clean)) {
        const b =
          typeof variables.button_a === 'boolean' ? variables.button_a : inputs.button_a;
        isTrue = b;
        detail = `button_a = ${b ? 'True' : 'False'}`;
      } else if (/มีคนเดิน|เคลื่อนไหว|motion/i.test(clean)) {
        const m =
          typeof variables.motion_detected === 'boolean'
            ? variables.motion_detected
            : inputs.motion_detected;
        isTrue = m;
        detail = `motion_detected = ${m ? 'True' : 'False'}`;
      } else if (/เหรียญ|coin/i.test(clean)) {
        isTrue = inputs.touch_coin;
        detail = `touch_coin = ${inputs.touch_coin ? 'True' : 'False'}`;
      } else if (/ฝนตก|rain/i.test(clean)) {
        isTrue = inputs.is_raining;
        detail = `is_raining = ${inputs.is_raining ? 'True' : 'False'}`;
      } else {
        isTrue = inputs.condition_ok;
        detail = `condition_ok = ${inputs.condition_ok ? 'True' : 'False'}`;
      }

      const chosenText = stripDecorForPython(
        isTrue ? node.trueAction || '' : node.falseAction || ''
      );

      // Apply variable side-effects from chosen branch
      const blinkM = chosenText.match(/รอบกะพริบ\s*=\s*(\d+)/);
      if (blinkM) variables.blink_limit = Number(blinkM[1]);
      const scoreIncM = chosenText.match(/คะแนน\s*=\s*คะแนน\s*\+\s*(\d+)/);
      if (scoreIncM) {
        const prevScore = typeof variables.score === 'number' ? variables.score : 0;
        variables.score = prevScore + Number(scoreIncM[1]);
      }
      if (/เปิดพัดลม/.test(chosenText)) variables.fan_on = true;
      else if (/ปิดพัดลม/.test(chosenText)) variables.fan_on = false;
      if (/เปิดปั๊ม/.test(chosenText)) variables.pump_on = true;
      else if (/พักปั๊ม|ปิดปั๊ม/.test(chosenText)) variables.pump_on = false;

      stepResults[idx] = {
        branch: isTrue ? 'true' : 'false',
        summary: `${detail} → ${chosenText || (isTrue ? 'ทำงานฝั่งใช่' : 'ทำงานฝั่งไม่ใช่')}`,
      };
      return;
    }

    if (node.kind === 'output') {
      if (variables.total !== undefined && /ผลรวม|total/i.test(clean)) {
        stepResults[idx] = {
          branch: null,
          summary: `แสดงผล: ผลรวม = ${variables.total}`,
        };
      } else if (variables.fan_on !== undefined && /พัดลม|fan/i.test(clean)) {
        stepResults[idx] = {
          branch: null,
          summary: `แสดงผล: สถานะพัดลม = ${variables.fan_on ? 'เปิด 🌀' : 'ปิด ✅'}`,
        };
      } else if (variables.score !== undefined && /คะแนน|score/i.test(clean)) {
        stepResults[idx] = {
          branch: null,
          summary: `แสดงผล: คะแนนล่าสุด = ${variables.score}`,
        };
      } else {
        stepResults[idx] = { branch: null, summary: `แสดงผล: ${clean || 'Output'}` };
      }
    }
  });

  return {
    stepResults,
    variables,
    detectedInputKeys: Array.from(detectedSet),
  };
}
