export type BattlePlatform = 'Scratch' | 'Micro:bit';
export type BattleDifficulty = 'easy' | 'medium' | 'hard';
export type BattleSetFilter = 'Scratch' | 'Micro:bit' | 'mixed';
export type BattleDifficultyFilter = 'all' | BattleDifficulty;

export interface BattleQuestionItem {
  id: string;
  platform: BattlePlatform;
  difficulty: BattleDifficulty;
  title: string;
  codeSnippet: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  source: 'builtin' | 'cloud' | 'local';
  createdByName?: string;
}

export const DIFFICULTY_META: Record<
  BattleDifficulty,
  { label: string; emoji: string; badgeClass: string; timeSeconds: number; basePoints: number }
> = {
  easy: {
    label: 'ง่าย',
    emoji: '🟢',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    timeSeconds: 18,
    basePoints: 50,
  },
  medium: {
    label: 'ปานกลาง',
    emoji: '🟡',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    timeSeconds: 15,
    basePoints: 75,
  },
  hard: {
    label: 'ยาก',
    emoji: '🔴',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    timeSeconds: 15,
    basePoints: 100,
  },
};

export const BUILTIN_BATTLE_QUESTIONS: BattleQuestionItem[] = [
  // =========================================================================
  // SCRATCH — ง่าย (Easy) x 6
  // =========================================================================
  {
    id: 'scratch_easy_01',
    platform: 'Scratch',
    difficulty: 'easy',
    title: 'แมว Scratch ไม่ยอมเดินเมื่อกดธงเขียว!',
    codeSnippet:
      '[เคลื่อนที่ 10 ก้าว]\n[พูด "สวัสดี!" เป็นเวลา 2 วินาที]\n// ไม่มีบล็อกหมวก (Hat Block) ด้านบน',
    options: [
      'ต้องวางบล็อก [เมื่อคลิกธงเขียว] ไว้บนสุดเพื่อให้โปรแกรมเริ่มทำงาน',
      'ต้องเปลี่ยนจาก 10 ก้าว เป็น 1,000 ก้าว',
      'ต้องลบคำสั่งพูด "สวัสดี!" ออกก่อน',
      'แมว Scratch เดินได้เฉพาะตอนกลางคืน',
    ],
    correctIndex: 0,
    explanation:
      'ทุกสคริปต์ใน Scratch ต้องมีบล็อกเหตุการณ์ (Events) เช่น [เมื่อคลิกธงเขียว] อยู่ด้านบนสุดเพื่อสั่งเริ่มทำงาน',
    source: 'builtin',
  },
  {
    id: 'scratch_easy_02',
    platform: 'Scratch',
    difficulty: 'easy',
    title: 'อยากให้แมวพูดแนะนำตัวแล้วหายไปอัตโนมัติใน 2 วินาที',
    codeSnippet:
      '[เมื่อคลิกธงเขียว]\n[พูด "สวัสดี ฉันคือโค้ดเดอร์!"]  <-- ข้อความค้างตลอดเวลา',
    options: [
      'เปลี่ยนมาใช้บล็อก [พูด "..." เป็นเวลา 2 วินาที]',
      'ใช้บล็อก [ซ่อนตัวละคร] ทันที',
      'เพิ่มบล็อก [หมุนขวา 15 องศา]',
      'เปลี่ยนสีพื้นหลังเป็นสีดำ',
    ],
    correctIndex: 0,
    explanation:
      'บล็อก [พูด "..."] แบบไม่ระบุเวลาจะแสดงกล่องคำพูดค้างไว้ตลอด ต้องใช้ [พูด "..." เป็นเวลา ... วินาที] เพื่อให้หายไปเอง',
    source: 'builtin',
  },
  {
    id: 'scratch_easy_03',
    platform: 'Scratch',
    difficulty: 'easy',
    title: 'สั่งให้ตัวละครเดินไปข้างหน้าแต่เดินทะลุขอบเวทีหายไป!',
    codeSnippet:
      '[เมื่อคลิกธงเขียว]\n[วนซ้ำตลอด]\n  [เคลื่อนที่ 10 ก้าว]\n  // ขาดคำสั่งกันชนขอบจอ',
    options: [
      'เพิ่มบล็อก [ถ้าชนขอบให้สะท้อนกลับ] ภายในลูปวนซ้ำตลอด',
      'เพิ่มบล็อก [ลบตัวละครนี้]',
      'เปลี่ยน [เคลื่อนที่ 10 ก้าว] เป็น 100 ก้าว',
      'ใส่บล็อก [หยุดทั้งหมด] ไว้บรรทัดแรก',
    ],
    correctIndex: 0,
    explanation:
      'บล็อก [ถ้าชนขอบให้สะท้อนกลับ] ในหมวด Motion จะช่วยบังคับให้ตัวละครหันกลับทันทีเมื่อแตะขอบเวที',
    source: 'builtin',
  },
  {
    id: 'scratch_easy_04',
    platform: 'Scratch',
    difficulty: 'easy',
    title: 'แมวเดินชนขอบแล้วสะท้อนกลับแบบ "หัวทิ่มลงพื้น"!',
    codeSnippet:
      '[เมื่อคลิกธงเขียว]\n[วนซ้ำตลอด]\n  [เคลื่อนที่ 10 ก้าว]\n  [ถ้าชนขอบให้สะท้อนกลับ]',
    options: [
      'เพิ่มบล็อก [ตั้งรูปแบบการหมุน ซ้าย-ขวา] ก่อนเข้าลูป',
      'ลดขนาดตัวละครเหลือ 10%',
      'เปลี่ยนเสียงแมวเป็นเสียงกลอง',
      'ลบบล็อก [เคลื่อนที่ 10 ก้าว] ออก',
    ],
    correctIndex: 0,
    explanation:
      'ค่าเริ่มต้นการหมุนของ Scratch คือหมุนรอบทิศ 360° ทำให้ตอนหันซ้ายตัวละครกลับหัว ต้องตั้งค่าเป็น "ซ้าย-ขวา" (left-right)',
    source: 'builtin',
  },
  {
    id: 'scratch_easy_05',
    platform: 'Scratch',
    difficulty: 'easy',
    title: 'อยากให้แมวเปลี่ยนท่าเดินสลับขาไปมาดูเหมือนกำลังวิ่ง',
    codeSnippet:
      '[เมื่อคลิกธงเขียว]\n[วนซ้ำตลอด]\n  [เคลื่อนที่ 10 ก้าว]\n  [รอ 0.2 วินาที]',
    options: [
      'เพิ่มบล็อก [ชุดถัดไป (Next Costume)] ในลูปวนซ้ำตลอด',
      'เพิ่มบล็อก [เปลี่ยนขนาดทีละ 50]',
      'ใช้บล็อก [ไปที่ x: 0 y: 0] ทุกครั้ง',
      'ปิดเสียงทั้งหมด',
    ],
    correctIndex: 0,
    explanation:
      'การสลับ Costume ด้วยบล็อก [ชุดถัดไป] ควบคู่กับการหน่วงเวลาเล็กน้อยจะสร้างภาพเคลื่อนไหว (Animation) ให้ตัวละครดูมีชีวิตชีวา',
    source: 'builtin',
  },
  {
    id: 'scratch_easy_06',
    platform: 'Scratch',
    difficulty: 'easy',
    title: 'ต้องการย้ายตัวละครกลับมากลางเวทีทุกครั้งที่เริ่มเกมใหม่',
    codeSnippet: '[เมื่อคลิกธงเขียว]\n// ควรวางบล็อกพิกัดใดเพื่อให้แมวอยู่ตรงกลางเป๊ะ?',
    options: [
      '[ไปที่ x: 0 y: 0]',
      '[ไปที่ x: 240 y: 180]',
      '[ไปที่ x: -240 y: -180]',
      '[เปลี่ยน y ทีละ 100]',
    ],
    correctIndex: 0,
    explanation:
      'ระบบพิกัดของเวที Scratch มีจุดศูนย์กลาง (Origin) อยู่ที่ x = 0 และ y = 0 พอดี',
    source: 'builtin',
  },

  // =========================================================================
  // SCRATCH — ปานกลาง (Medium) x 6
  // =========================================================================
  {
    id: 'scratch_medium_01',
    platform: 'Scratch',
    difficulty: 'medium',
    title: 'แมว Scratch วาดรูปแต่เส้นปากกาไม่ขึ้นบนเวที!',
    codeSnippet:
      '[เมื่อคลิกธงเขียว]\n[ลบทั้งหมด]\n[เคลื่อนที่ 100 ก้าว]\n[จรดปากกา (Pen Down)]',
    options: [
      'ต้องวางบล็อก [จรดปากกา (Pen Down)] ก่อน [เคลื่อนที่ 100 ก้าว]',
      'ต้องเปลี่ยนจำนวนก้าวเป็น 500 ก้าว',
      'แมว Scratch ไม่สามารถวาดเส้นตรงได้',
      'ต้องลบบล็อก [ลบทั้งหมด] ออก',
    ],
    correctIndex: 0,
    explanation:
      'ลำดับการทำงานสำคัญมาก! ต้องจรดปากกาลงบนกระดาษก่อน (Pen Down) แล้วจึงสั่งเคลื่อนที่จึงจะเกิดเส้นวาด',
    source: 'builtin',
  },
  {
    id: 'scratch_medium_02',
    platform: 'Scratch',
    difficulty: 'medium',
    title: 'ตัวละครเดินทะลุกำแพงเขาวงกตสีดำ!',
    codeSnippet:
      '[เมื่อกดปุ่มลูกศรขวา]\n[เปลี่ยน x ทีละ 10]\n[ถ้า <กำลังแตะสี ดำ?> แล้ว]\n  [เปลี่ยน x ทีละ 10]',
    options: [
      'เมื่อแตะสีดำต้องสั่ง [เปลี่ยน x ทีละ -10] เพื่อถอยกลับ ไม่ใช่ +10',
      'ต้องเปลี่ยนสีดำเป็นสีขาว',
      'ต้องเปลี่ยนจากลูกศรขวาเป็นปุ่ม Spacebar',
      'ต้องใส่บล็อก [ซ่อน] เมื่อแตะกำแพง',
    ],
    correctIndex: 0,
    explanation:
      'หลักการกันชนกำแพง (Collision Detection) คือเมื่อขยับ +10 แล้วชนกำแพง ให้เด้งถอยหลังกลับมา -10 ทันที',
    source: 'builtin',
  },
  {
    id: 'scratch_medium_03',
    platform: 'Scratch',
    difficulty: 'medium',
    title: 'อยากวาดรูปสี่เหลี่ยมจัตุรัส แต่ได้เส้นตรงยาวเส้นเดียว!',
    codeSnippet:
      '[จรดปากกา]\n[ทำซ้ำ 4 ครั้ง]\n  [เคลื่อนที่ 80 ก้าว]\n  // ลืมคำสั่งเปลี่ยนทิศทาง!',
    options: [
      'เพิ่มบล็อก [หันขวา 90 องศา] ภายในลูปทำซ้ำ 4 ครั้ง',
      'เปลี่ยนจำนวนรอบเป็นทำซ้ำ 2 ครั้ง',
      'เพิ่มบล็อก [หันขวา 180 องศา]',
      'เปลี่ยนขนาดปากกาเป็น 20',
    ],
    correctIndex: 0,
    explanation:
      'รูปสี่เหลี่ยมจัตุรัสมี 4 ด้าน มุมภายนอกแต่ละมุมเท่ากับ 360 ÷ 4 = 90 องศา จึงต้องหัน 90° ทุกรอบ',
    source: 'builtin',
  },
  {
    id: 'scratch_medium_04',
    platform: 'Scratch',
    difficulty: 'medium',
    title: 'กดเก็บแอปเปิลในเกมแต่คะแนนเพิ่มรัวๆ ทีละหลายสิบแต้ม!',
    codeSnippet:
      '[วนซ้ำตลอด]\n  [ถ้า <กำลังแตะ แอปเปิล?> แล้ว]\n    [เปลี่ยน คะแนน ทีละ 1]\n    // ลืมย้ายหรือซ่อนแอปเปิล!',
    options: [
      'หลังเพิ่มคะแนน ต้องสั่งย้ายแอปเปิลไปตำแหน่งสุ่มหรือซ่อน/รอจนกว่าจะไม่แตะ',
      'ต้องเปลี่ยน [เปลี่ยน คะแนน ทีละ 1] เป็น 100',
      'ต้องลบลูป [วนซ้ำตลอด] ออก',
      'ห้ามใช้ตัวแปรชื่อ "คะแนน"',
    ],
    correctIndex: 0,
    explanation:
      'ลูป [วนซ้ำตลอด] ทำงานประมาณ 30 ครั้ง/วินาที หากตัวละครยังซ้อนทับแอปเปิลอยู่ คะแนนจะบวกซ้ำทุกเฟรม',
    source: 'builtin',
  },
  {
    id: 'scratch_medium_05',
    platform: 'Scratch',
    difficulty: 'medium',
    title: 'เริ่มเกมใหม่รอบที่ 2 แต่คะแนนเก่าจากรอบก่อนยังค้างอยู่!',
    codeSnippet:
      '[เมื่อคลิกธงเขียว]\n[วนซ้ำตลอด]\n  [ถ้า <กำลังแตะ ดาว?> แล้ว]\n    [เปลี่ยน คะแนน ทีละ 10]',
    options: [
      'เพิ่มบล็อก [ตั้งค่า คะแนน เป็น 0] ไว้ใต้ [เมื่อคลิกธงเขียว] ก่อนเข้าลูป',
      'ปิดเบราว์เซอร์แล้วเปิดใหม่ทุกครั้ง',
      'เปลี่ยนตัวแปรคะแนนให้เป็นค่าลบ',
      'ลบบล็อก [เมื่อคลิกธงเขียว] ออก',
    ],
    correctIndex: 0,
    explanation:
      'การกำหนดค่าเริ่มต้นของตัวแปร (Initialization) เช่น [ตั้งค่า คะแนน เป็น 0] เมื่อเริ่มเกม เป็นหลักปฏิบัติสำคัญของการเขียนโปรแกรม',
    source: 'builtin',
  },
  {
    id: 'scratch_medium_06',
    platform: 'Scratch',
    difficulty: 'medium',
    title: 'ต้องการส่งสัญญาณให้ตัวละครอื่นเปลี่ยนฉากพร้อมกันเมื่อชนะเกม',
    codeSnippet:
      '// ตัวละครผู้เล่นเก็บครบ 10 เหรียญแล้ว\n[ถ้า <คะแนน = 10> แล้ว]\n  // ควรใช้บล็อกใดสื่อสารกับตัวละครทุกตัว?',
    options: [
      '[กระจายข้อความ (Broadcast) "Win"]',
      '[พูด "Win" เป็นเวลา 2 วินาที]',
      '[รอ 10 วินาที]',
      '[เปลี่ยนสีทีละ 25]',
    ],
    correctIndex: 0,
    explanation:
      'บล็อก [กระจายข้อความ (Broadcast)] ใช้ส่งเหตุการณ์ข้ามตัวละครและฉากหลัง เพื่อให้ทุกส่วนตอบสนองพร้อมกันผ่าน [เมื่อฉันได้รับข้อความ]',
    source: 'builtin',
  },

  // =========================================================================
  // SCRATCH — ยาก (Hard) x 6
  // =========================================================================
  {
    id: 'scratch_hard_01',
    platform: 'Scratch',
    difficulty: 'hard',
    title: 'วาดรูปสามเหลี่ยมด้านเท่า แต่หัน 60 องศาแล้วได้รูปหกเหลี่ยมแทน!',
    codeSnippet:
      '[จรดปากกา]\n[ทำซ้ำ 3 ครั้ง]\n  [เคลื่อนที่ 100 ก้าว]\n  [หันขวา 60 องศา]  <-- ไม่ปิดเป็นสามเหลี่ยม!',
    options: [
      'ต้องหันมุมภายนอก 360 ÷ 3 = 120 องศา ไม่ใช่ 60 องศา',
      'ต้องเปลี่ยนเป็นทำซ้ำ 10 ครั้ง',
      'ต้องเปลี่ยนเป็น [หันขวา 30 องศา]',
      'Scratch ไม่รองรับการวาดรูปสามเหลี่ยม',
    ],
    correctIndex: 0,
    explanation:
      'มุมที่เต่าวาดรูปต้องหมุนคือ "มุมภายนอก" = 360° ÷ จำนวนด้าน สำหรับสามเหลี่ยมด้านเท่าคือ 360 ÷ 3 = 120°',
    source: 'builtin',
  },
  {
    id: 'scratch_hard_02',
    platform: 'Scratch',
    difficulty: 'hard',
    title: 'เกมยิงจรวดเกิดอาการกระตุกและยิงไม่ออกหลังเล่นไป 1 นาที!',
    codeSnippet:
      '[เมื่อฉันเริ่มเป็นโคลน]\n[ทำซ้ำจนกว่า <กำลังแตะขอบ?>]\n  [เปลี่ยน y ทีละ 12]\n[ซ่อน]  <-- ยังไม่ลบโคลน!',
    options: [
      'ต้องใช้บล็อก [ลบโคลนนี้] แทน [ซ่อน] เพราะโคลนสะสมจนเต็มลิมิต 300 ตัว',
      'ต้องเพิ่มความเร็วเป็น 100 ก้าว',
      'ต้องสร้างตัวละครกระสุนเพิ่มอีก 50 ตัว',
      'ต้องใส่บล็อก [หยุดเสียงทั้งหมด]',
    ],
    correctIndex: 0,
    explanation:
      'Scratch จำกัดจำนวน Clone สูงสุดที่ 300 ตัว หากใช้แค่ [ซ่อน] โคลนจะยังค้างอยู่ในหน่วยความจำ ต้องใช้ [ลบโคลนนี้] เสมอ',
    source: 'builtin',
  },
  {
    id: 'scratch_hard_03',
    platform: 'Scratch',
    difficulty: 'hard',
    title: 'ต้องการสุ่มตำแหน่งเกิดเหรียญทั่วเวทีแต่ไม่ให้หลุดขอบจอ',
    codeSnippet:
      '[ไปที่ x: (สุ่มจาก -500 ถึง 500) y: (สุ่มจาก -400 ถึง 400)]\n// เหรียญชอบไปกระจุกติดขอบเวทีตลอด!',
    options: [
      'เวที Scratch มีช่วง x: -240 ถึง 240 และ y: -180 ถึง 180 ควรสุ่มช่วงประมาณ -200 ถึง 200 และ -140 ถึง 140',
      'ควรสุ่ม x จาก 0 ถึง 1,000',
      'ควรสุ่ม y จาก -10 ถึง 10 เท่านั้น',
      'ห้ามใช้บล็อกสุ่มร่วมกับพิกัด x, y',
    ],
    correctIndex: 0,
    explanation:
      'ขนาดเวที Scratch กว้าง 480 (x: -240..240) สูง 360 (y: -180..180) การสุ่มเลขเกินขอบจะถูกบีบให้ติดขอบจอ',
    source: 'builtin',
  },
  {
    id: 'scratch_hard_04',
    platform: 'Scratch',
    difficulty: 'hard',
    title: 'เงื่อนไขให้ผ่านด่านเมื่อได้คะแนน ≥ 50 และยังมีชีวิต > 0',
    codeSnippet:
      '[ถ้า <(คะแนน >= 50) หรือ (ชีวิต > 0)> แล้ว]\n  [กระจายข้อความ "ผ่านด่าน"]\n// คะแนน 0 แต่ชีวิตเหลือ 3 ก็ผ่านด่านเฉยเลย!',
    options: [
      'ต้องเปลี่ยนตัวดำเนินการตรรกะจาก "หรือ (OR)" เป็น "และ (AND)"',
      'ต้องใช้ตัวดำเนินการ "ไม่ (NOT)" แทน',
      'ต้องสลับตำแหน่งของคะแนนกับชีวิต',
      'ต้องเปลี่ยนเป็น คะแนน = 0',
    ],
    correctIndex: 0,
    explanation:
      'ตัวดำเนินการ AND (และ) จะเป็นจริงก็ต่อเมื่อเงื่อนไขทั้งสองข้อเป็นจริงพร้อมกัน ส่วน OR (หรือ) แค่ข้อเดียวจริงก็ผ่านแล้ว',
    source: 'builtin',
  },
  {
    id: 'scratch_hard_05',
    platform: 'Scratch',
    difficulty: 'hard',
    title: 'สร้างบล็อกของฉัน (My Blocks) เพื่อวาดดอกไม้ 6 กลีบแบบ Nested Loop',
    codeSnippet:
      'กำหนด [วาดสี่เหลี่ยม (ขนาด)]\n  [ทำซ้ำ 4 ครั้ง]: [เคลื่อนที่ (ขนาด)] [หันขวา 90]\n\n[ทำซ้ำ 6 ครั้ง]\n  [วาดสี่เหลี่ยม (60)]\n  // ต้องหันกี่องศาเพื่อกระจาย 6 กลีบรอบวงกลม?',
    options: [
      '[หันขวา 60 องศา] (เพราะ 360 ÷ 6 = 60)',
      '[หันขวา 90 องศา]',
      '[หันขวา 120 องศา]',
      '[หันขวา 15 องศา]',
    ],
    correctIndex: 0,
    explanation:
      'ลูปซ้อนลูป (Nested Loop) วาด 6 กลีบรอบจุดศูนย์กลาง 360 องศา ต้องหมุนเพิ่มทีละ 360 ÷ 6 = 60 องศาในลูปนอก',
    source: 'builtin',
  },
  {
    id: 'scratch_hard_06',
    platform: 'Scratch',
    difficulty: 'hard',
    title: 'จับเวลาถอยหลัง 30 วินาที แต่ตัวเลขวิ่งติดลบ -1, -2 ไม่ยอมจบเกม!',
    codeSnippet:
      '[ตั้งค่า เวลา เป็น 30]\n[วนซ้ำตลอด]\n  [รอ 1 วินาที]\n  [เปลี่ยน เวลา ทีละ -1]',
    options: [
      'เปลี่ยนเป็น [ทำซ้ำจนกว่า <เวลา = 0>] แล้วตามด้วย [กระจายข้อความ "หมดเวลา"]',
      'เปลี่ยน [เปลี่ยน เวลา ทีละ -1] เป็น +1',
      'ลบบล็อก [รอ 1 วินาที] ออก',
      'ตั้งค่าเวลาเริ่มต้นเป็น 0',
    ],
    correctIndex: 0,
    explanation:
      'ลูป [วนซ้ำตลอด] ไม่มีเงื่อนไขหยุด ต้องใช้ [ทำซ้ำจนกว่า <เวลา = 0>] หรือดักด้วย [ถ้า <เวลา <= 0> หยุดทั้งหมด]',
    source: 'builtin',
  },

  // =========================================================================
  // MICRO:BIT — ง่าย (Easy) x 6
  // =========================================================================
  {
    id: 'microbit_easy_01',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'อยากให้รูปหัวใจแสดงแค่ครั้งเดียวตอนเปิดเครื่อง Micro:bit',
    codeSnippet:
      'basic.forever(() => {\n  basic.showIcon(IconNames.Heart)\n  basic.showString("HI")\n})\n// ข้อความวิ่งวนซ้ำไม่ยอมหยุด!',
    options: [
      'ย้ายคำสั่งไปไว้ในบล็อก [on start (เมื่อเริ่มต้น)] แทน forever',
      'ถอดสาย USB ออกทันที',
      'เปลี่ยนชื่อไอคอนเป็น Happy',
      'เพิ่มคำสั่ง basic.pause(10)',
    ],
    correctIndex: 0,
    explanation:
      'บล็อก on start ทำงานเพียงครั้งเดียวเมื่อเปิดบอร์ด ส่วน forever จะวนทำงานซ้ำไปเรื่อยๆ ตลอดเวลา',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_02',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'Micro:bit ไฟหัวใจติดค้าง ไม่ยอมกะพริบ!',
    codeSnippet:
      'basic.forever(() => {\n  basic.showIcon(IconNames.Heart)\n  basic.pause(500)\n  // ขาดคำสั่งดับหน้าจอ LED\n})',
    options: [
      'เพิ่ม basic.clearScreen() และ basic.pause(500) ต่อท้าย',
      'เปลี่ยน pause เป็น 10000 มิลลิวินาที',
      'ห้ามใช้ basic.pause ใน forever',
      'กดปุ่ม Reset ทุกรอบ',
    ],
    correctIndex: 0,
    explanation:
      'การทำให้ไฟกะพริบต้องสลับระหว่างเปิดไฟ (showIcon) -> รอ (pause) -> ดับไฟ (clearScreen) -> รอ (pause)',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_03',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'ต้องการกดปุ่ม A แล้วให้ Micro:bit แสดงหน้ายิ้ม',
    codeSnippet:
      '// ควรเลือกบล็อกเหตุการณ์ (Input) ใดในการรับค่าการกดปุ่ม A?',
    options: [
      'input.onButtonPressed(Button.A, () => { basic.showIcon(IconNames.Happy) })',
      'input.onGesture(Gesture.Shake, () => { ... })',
      'basic.showNumber(10)',
      'radio.sendNumber(1)',
    ],
    correctIndex: 0,
    explanation:
      'input.onButtonPressed(Button.A, ...) ใช้ตรวจจับเหตุการณ์เมื่อผู้ใช้กดปุ่ม A บนบอร์ด Micro:bit',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_04',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'หน้าจอ LED ของ Micro:bit มีจำนวนหลอดไฟกี่ดวง?',
    codeSnippet:
      '// เมทริกซ์ LED ด้านหน้าบอร์ด Micro:bit\n// แถว (Row) = 0 ถึง 4\n// หลัก (Column) = 0 ถึง 4',
    options: [
      '25 ดวง (ตาราง 5 × 5)',
      '16 ดวง (ตาราง 4 × 4)',
      '9 ดวง (ตาราง 3 × 3)',
      '100 ดวง (ตาราง 10 × 10)',
    ],
    correctIndex: 0,
    explanation:
      'บอร์ด Micro:bit มีจอแสดงผล LED แบบเมทริกซ์ขนาด 5 แถว × 5 หลัก รวม 25 ดวง โดยพิกัดเริ่มนับจาก (0, 0) มุมบนซ้าย',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_05',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'อยากทำลูกเต๋าดิจิทัล เมื่อเขย่าบอร์ดแล้วสุ่มเลข 1 ถึง 6',
    codeSnippet:
      'input.onGesture(Gesture.Shake, () => {\n  basic.showNumber(randint(1, 3))\n})\n// ทอยยังไงก็ไม่เคยออกแต้ม 4, 5, 6 เลย!',
    options: [
      'แก้ช่วงการสุ่มจาก randint(1, 3) เป็น randint(1, 6)',
      'เปลี่ยน Gesture.Shake เป็น Button.B',
      'ลบคำสั่ง basic.showNumber ออก',
      'เปลี่ยน randint(1, 3) เป็น randint(0, 1)',
    ],
    correctIndex: 0,
    explanation:
      'ลูกเต๋าปกติมี 6 หน้า (1–6) จึงต้องใช้ฟังก์ชันสุ่ม randint(1, 6) เพื่อให้สุ่มครอบคลุมทุกแต้ม',
    source: 'builtin',
  },
  {
    id: 'microbit_easy_06',
    platform: 'Micro:bit',
    difficulty: 'easy',
    title: 'อยากให้บอร์ดหยุดรอ 2 วินาที ต้องใส่ตัวเลขเท่าไหร่ใน basic.pause()?',
    codeSnippet:
      'basic.showIcon(IconNames.Yes)\nbasic.pause(2)  // ทำไมไฟหายเร็วมาก แทบมองไม่ทัน!',
    options: [
      'ต้องใส่ 2000 เพราะหน่วยของ pause คือมิลลิวินาที (1 วินาที = 1000 ms)',
      'ต้องใส่ 20',
      'ต้องใส่ 200',
      'ต้องใส่ 0.2',
    ],
    correctIndex: 0,
    explanation:
      'ฟังก์ชัน basic.pause(ms) รับหน่วยเป็นมิลลิวินาที (milliseconds) ดังนั้น 2 วินาที = 2,000 มิลลิวินาที',
    source: 'builtin',
  },

  // =========================================================================
  // MICRO:BIT — ปานกลาง (Medium) x 6
  // =========================================================================
  {
    id: 'microbit_medium_01',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'Micro:bit 2 เครื่องส่งสัญญาณวิทยุ (Radio) หากันไม่ติด!',
    codeSnippet:
      '// เครื่องส่ง: radio.setGroup(7)\n// เครื่องรับ: radio.setGroup(1)\nradio.sendString("SOS")',
    options: [
      'เลข Group ของเครื่องส่ง (7) และเครื่องรับ (1) ไม่ตรงกัน ต้องตั้งให้เหมือนกัน',
      'คลื่นวิทยุของ Micro:bit ส่งได้ไม่เกิน 1 เซนติเมตร',
      'ต้องปิดไฟหน้าจอ LED ก่อนส่งวิทยุ',
      'Micro:bit ส่งข้อความภาษาอังกฤษไม่ได้',
    ],
    correctIndex: 0,
    explanation:
      'การสื่อสารไร้สายด้วย Radio เหมือนการจูนช่องวิทยุสื่อสาร เครื่องส่งและเครื่องรับต้องตั้ง radio.setGroup() เป็นเลขช่องเดียวกัน',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_02',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'เครื่องนับก้าวเดิน (Step Counter) เขย่าแล้วเลขไม่เพิ่มจาก 0!',
    codeSnippet:
      'let steps = 0\ninput.onGesture(Gesture.Shake, () => {\n  steps = 1\n  basic.showNumber(steps)\n})',
    options: [
      'ต้องใช้ steps += 1 (change steps by 1) ไม่ใช่ steps = 1 ที่ตั้งค่าทับเป็น 1 ทุกครั้ง',
      'ต้องเปลี่ยนชื่อตัวแปร steps เป็น x',
      'ต้องลบ let steps = 0 ออก',
      'ต้องกดปุ่ม A พร้อมเขย่าทุกครั้ง',
    ],
    correctIndex: 0,
    explanation:
      'คำสั่ง steps = 1 คือการกำหนดค่าใหม่ทับเป็น 1 ตลอด หากต้องการนับสะสมต้องใช้ steps += 1 (บวกเพิ่มทีละ 1)',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_03',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'ไฟเปิดอัตโนมัติในห้องมืด แต่กลับติดตอนแดดจ้าแทน!',
    codeSnippet:
      'basic.forever(() => {\n  if (input.lightLevel() > 100) {\n    basic.showLeds("# # # # # ...")\n  } else {\n    basic.clearScreen()\n  }\n})',
    options: [
      'ค่าแสงน้อยคือมืด ต้องเปลี่ยนเงื่อนไขจาก > 100 เป็น < 100 (หรือ < 50)',
      'เซนเซอร์แสงของ Micro:bit วัดได้เฉพาะอุณหภูมิ',
      'ต้องเปลี่ยน > 100 เป็น == 255',
      'ต้องเอาคำสั่ง else ออก',
    ],
    correctIndex: 0,
    explanation:
      'input.lightLevel() คืนค่า 0 (มืดสนิท) ถึง 255 (สว่างมาก) ดังนั้นถ้าอยากให้ไฟติดตอนมืดต้องเช็ก lightLevel() < ค่าเกณฑ์',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_04',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'อยากจุดไฟ LED ดวงตรงกลางเป๊ะของหน้าจอ 5×5 ต้องใช้พิกัดใด?',
    codeSnippet:
      '// led.plot(x, y) โดย x คือคอลัมน์ (0..4) และ y คือแถว (0..4)\nled.plot(?, ?)',
    options: [
      'led.plot(2, 2)',
      'led.plot(3, 3)',
      'led.plot(0, 0)',
      'led.plot(5, 5)',
    ],
    correctIndex: 0,
    explanation:
      'พิกัด LED เริ่มนับที่ 0, 1, 2, 3, 4 ดังนั้นตำแหน่งกึ่งกลางทั้งแกน x และแกน y คือ (2, 2)',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_05',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'ระบบเตือนอากาศร้อน (> 35°C) ส่งเสียงเตือนไม่หยุดแม้ยังไม่ร้อน!',
    codeSnippet:
      'basic.forever(() => {\n  if (input.temperature() < 35) {\n    music.playTone(523, 200)\n  }\n})',
    options: [
      'เครื่องหมายเปรียบเทียบกลับด้าน ต้องใช้ input.temperature() > 35',
      'ต้องใช้ input.compassHeading() แทนอุณหภูมิ',
      'ห้ามใช้ music.playTone ร่วมกับ if',
      'ต้องเปลี่ยน 35 เป็น 0',
    ],
    correctIndex: 0,
    explanation:
      'เครื่องหมาย < 35 แปลว่าอุณหภูมิต่ำกว่า 35 องศา (อากาศปกติ) จึงดังตลอด ต้องเปลี่ยนเป็น > 35 เพื่อแจ้งเตือนเมื่อร้อนเกินกำหนด',
    source: 'builtin',
  },
  {
    id: 'microbit_medium_06',
    platform: 'Micro:bit',
    difficulty: 'medium',
    title: 'เกมเป่ายิ้งฉุบ Micro:bit เมื่อสุ่มได้เลข 3 แต่ไม่แสดงกรรไกร!',
    codeSnippet:
      'let hand = randint(1, 3)\nif (hand == 1) { /* ค้อน */ }\nelse if (hand == 2) { /* กระดาษ */ }\n// ลืมกรณี hand == 3!',
    options: [
      'เพิ่มบล็อก else { /* แสดงรูปกรรไกร */ } เพื่อรองรับค่า 3',
      'เปลี่ยน randint(1, 3) เป็น randint(1, 2)',
      'เพิ่มตัวแปร hand อีกตัว',
      'ลบบล็อก if ออกทั้งหมด',
    ],
    correctIndex: 0,
    explanation:
      'เมื่อมีทางเลือก 3 ทาง (1, 2, 3) โครงสร้างเงื่อนไขควรครอบคลุมครบด้วย if / else if / else เพื่อไม่ให้กรณีที่ 3 หายไป',
    source: 'builtin',
  },

  // =========================================================================
  // MICRO:BIT — ยาก (Hard) x 6
  // =========================================================================
  {
    id: 'microbit_hard_01',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'เข็มทิศดิจิทัลไม่ชี้ทิศเหนือเมื่อหมุนบอร์ดไปที่ 350 องศา!',
    codeSnippet:
      'let deg = input.compassHeading()\nif (deg < 45) {\n  basic.showString("N")\n}\n// แต่ช่วง 315°–360° ก็คือทิศเหนือเหมือนกัน!',
    options: [
      'ต้องใช้เงื่อนไข (deg < 45 || deg > 315) ด้วยตัวดำเนินการ OR (||)',
      'ต้องใช้ (deg < 45 && deg > 315) ด้วย AND',
      'ต้องเปลี่ยน 45 เป็น 180',
      'เข็มทิศมีค่าสูงสุดแค่ 100 องศา',
    ],
    correctIndex: 0,
    explanation:
      'ทิศเหนืออยู่รอบ 0°/360° จึงกินช่วง 0°–44° หรือ 316°–360° ต้องเชื่อมด้วย OR (||) เพราะตัวเลขเดียวไม่สามารถทั้ง < 45 และ > 315 พร้อมกันได้',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_02',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'สั่งจุด LED วิ่งไล่ครบทุกดวงทั้ง 25 ดวงด้วย Nested Loop แต่แถวสุดท้ายหาย!',
    codeSnippet:
      'for (let y = 0; y < 4; y++) {\n  for (let x = 0; x < 5; x++) {\n    led.plot(x, y)\n  }\n}',
    options: [
      'ลูปนอก y < 4 ทำงานแค่แถว 0–3 ต้องแก้เป็น y < 5 (หรือ y <= 4) เพื่อให้ครบ 5 แถว',
      'ต้องแก้ x < 5 เป็น x < 4',
      'ต้องสลับ x กับ y ใน led.plot',
      'Micro:bit ไม่รองรับลูปซ้อนลูป',
    ],
    correctIndex: 0,
    explanation:
      'แถว y มี index 0, 1, 2, 3, 4 (รวม 5 แถว) เงื่อนไข y < 4 จะหยุดที่ 3 (Off-by-one bug) ต้องแก้เป็น y < 5',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_03',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'ต่อปั๊มน้ำอัตโนมัติวัดความชื้นดินที่ขา Pin 0 แต่ค่าอ่านได้ไม่คงที่!',
    codeSnippet:
      '// เซนเซอร์ความชื้นดินแบบ Analog ส่งค่า 0–1023\nlet moisture = pins.digitalReadPin(DigitalPin.P0)',
    options: [
      'ต้องใช้ pins.analogReadPin(AnalogPin.P0) เพราะ digitalRead อ่านได้แค่ 0 หรือ 1',
      'ต้องเปลี่ยนไปใช้ขา GND แทน P0',
      'ต้องใช้ radio.receiveNumber() แทน',
      'Analog Pin อ่านได้เฉพาะค่าลบ',
    ],
    correctIndex: 0,
    explanation:
      'Digital Read อ่านได้เพียง 2 สถานะ (0/1) ส่วนเซนเซอร์ที่ให้ค่าระดับละเอียด 0–1023 ต้องใช้ Analog Read (analogReadPin)',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_04',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'ระบบสัญญาณกันขโมยตั้งค่าให้เริ่มทำงานเมื่อกดปุ่ม A แต่กดแล้วไม่จับความเคลื่อนไหว!',
    codeSnippet:
      'let armed = false\ninput.onButtonPressed(Button.A, () => { armed = true })\ninput.onGesture(Gesture.Shake, () => {\n  if (armed = false) { music.playTone(880, 500) }\n})',
    options: [
      'ใน if ใช้เครื่องหมาย = (กำหนดค่า) แทน == และควรเช็ก if (armed == true)',
      'ห้ามใช้ตัวแปรชนิด Boolean (true/false)',
      'ต้องลบ input.onButtonPressed ออก',
      'ต้องตั้งค่า armed เริ่มต้นเป็น 100',
    ],
    correctIndex: 0,
    explanation:
      'การใช้ = ในเงื่อนไขเป็นการกำหนดค่าทับแทนการเปรียบเทียบ และเงื่อนไขควรตรวจว่าเปิดระบบแล้ว (armed == true)',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_05',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'ระบบโหวตในห้องเรียนผ่าน Radio: นักเรียน 1 คนกดปุ่ม A รัวๆ เพื่อปั๊มคะแนน!',
    codeSnippet:
      '// เครื่องนักเรียน:\ninput.onButtonPressed(Button.A, () => {\n  radio.sendString("VOTE_A")\n})',
    options: [
      'เพิ่มตัวแปร Flag เช่น let voted = false แล้วเช็ก if (!voted) ส่งโหวตและตั้ง voted = true',
      'ลดความสว่างหน้าจอ LED ลง',
      'เปลี่ยนข้อความเป็น "VOTE_B"',
      'เปลี่ยนไปใช้ปุ่ม B แทน',
    ],
    correctIndex: 0,
    explanation:
      'การใช้ตัวแปรสถานะ (State Flag) เช่น voted = true หลังส่งครั้งแรก จะป้องกันการโหวตซ้ำได้อย่างมีประสิทธิภาพ',
    source: 'builtin',
  },
  {
    id: 'microbit_hard_06',
    platform: 'Micro:bit',
    difficulty: 'hard',
    title: 'บันทึกข้อมูล Data Logger แต่อุณหภูมิเฉลี่ยคำนวณผิดพลาด!',
    codeSnippet:
      'let sum = 0\nlet count = 0\n// เมื่อเก็บข้อมูล 5 ครั้ง:\nlet avg = sum / 10  // ทำไมค่าเฉลี่ยต่ำกว่าความจริงครึ่งหนึ่ง?',
    options: [
      'ตัวหารควรเป็นตัวแปร count (จำนวนครั้งที่เก็บจริง) และควรดัก count > 0 ก่อนหาร',
      'ต้องนำ sum คูณ 10 แทนการหาร',
      'ต้องตั้งค่า sum เริ่มต้นเป็น 100',
      'ห้ามใช้เครื่องหมาย / ใน Micro:bit',
    ],
    correctIndex: 0,
    explanation:
      'ค่าเฉลี่ย = ผลรวม ÷ จำนวนข้อมูลจริง (sum / count) ไม่ควรฮาร์ดโค้ดเลข 10 และควรตรวจสอบ count > 0 เพื่อป้องกันหารด้วยศูนย์',
    source: 'builtin',
  },
];
