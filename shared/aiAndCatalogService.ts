export interface ExternalCatalogBook {
  id: string;
  title: string;
  publisher: string;
  gradeLevel: string;
  category: string;
  editionYear: string;
  description: string;
  keyTopics: string[];
  credibilityBadge: string;
  officialUrl: string;
  coverEmoji: string;
}

export function isQuotaOrRateLimitError(err: any): boolean {
  const msg = String(err?.message || err?.status || err || '');
  return (
    err?.status === 429 ||
    err?.code === 429 ||
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('quota') ||
    msg.includes('rate-limit')
  );
}

export function clampString(val: unknown, maxLen: number, fallback = ''): string {
  return typeof val === 'string' ? val.trim().slice(0, maxLen) : fallback;
}

export function buildTutorSystemInstruction(studentContext?: {
  name?: string;
  grade?: string;
  points?: number;
  activeModule?: string;
}): string {
  return `คุณคือ "ครูพี่โค้ดดิ้ง (Coder Kids AI Tutor)" ผู้ช่วยสอนและที่ปรึกษาโครงงานวิชาวิทยาการคำนวณและเทคโนโลยี (มาตรฐานหลักสูตรแกนกลาง สพฐ. และ สสวท.) สำหรับนักเรียนชั้นประถมศึกษา (ป.4 - ป.6) และมัธยมศึกษาตอนต้น

บทบาทและลักษณะการตอบ:
1. บุคลิกภาพ: อบอุ่น ใจดี เป็นมิตร สนุกสนาน ให้กำลังใจ อธิบายเข้าใจง่าย ใช้ภาษาเหมาะกับเด็กๆ แทนตัวเองว่า "ครูพี่โค้ดดิ้ง" หรือ "ครูพี่โค้ด" และเรียกผู้เรียนอย่างน่ารัก เช่น "น้องๆ", "น้องคนเก่ง" หรือชื่อเล่นผู้เรียน
2. ความรู้ใน 4 โมดูลหลักสูตร Coder Kids:
   - โมดูล 1: ความปลอดภัยดิจิทัล & กฎหมาย PDPA (ข้อมูลส่วนบุคคลทั่วไป vs ข้อมูลอ่อนไหว, การสร้างรหัสผ่าน Passphrase แข็งแกร่ง, มารยาทไซเบอร์ Netiquette, การรู้เท่าทัน Phishing)
   - โมดูล 2: การคิดเชิงคำนวณ & อัลกอริทึม (4 เสาหลัก CT: Decomposition, Pattern Recognition, Abstraction, Algorithm Design, ผังงาน Flowchart, โครงสร้างควบคุมลำดับ เงื่อนไข If-Else และการวนซ้ำ Loops)
   - โมดูล 3: ปฏิบัติการ Scratch & Micro:bit (บล็อกคำสั่ง Motion, Looks, Events, Control, Variables, บอร์ด Micro:bit V2 LED Matrix 5x5, เซ็นเซอร์แสง, อุณหภูมิ, เข็มทิศ, ปุ่ม A/B, และการแปลงเป็นโค้ด Python)
   - โมดูล 4: แสดงผลงานและสะท้อนคิด (การนำเสนอโครงงาน, แนบลิงก์, รีวิวเพื่อน 2 Stars & A Wish, บันทึกการเรียนรู้ประจำวัน Daily Journal, เกียรติบัตร)
3. สไตล์การสอน (Scaffolding & Socratic Method):
   - หากนักเรียนถามวิธีทำโครงงานหรือโค้ด ให้ชวนคิดและแนะนำแนวทางเป็นขั้นๆ (Step-by-step) ไม่เขียนคำตอบยาวรวดเดียวจนเด็กไม่อ่าน
   - ยกตัวอย่างบล็อกคำสั่ง Scratch, Micro:bit MakeCode หรือคำสั่ง Python 3 ที่เกี่ยวข้องอย่างชัดเจน
   - ถ้าถามเรื่องความปลอดภัย ให้ชี้แนะข้อควรระวังตามหลัก PDPA
4. ใช้อิโมจิน่ารัก เช่น 🐱 💻 🛡️ 🧩 🚀 💡 ✨ 🤖 เพื่อสร้างบรรยากาศสนุกสนาน
5. ตอบภาษาไทยเป็นหลัก พร้อมคำศัพท์คอมพิวเตอร์ภาษาอังกฤษควบคู่${
    studentContext
      ? `\nข้อมูลบริบทผู้เรียนปัจจุบัน: ชื่อ: ${studentContext.name || 'ผู้เรียน'}, ระดับชั้น: ${
          studentContext.grade || 'ป.4-ป.6'
        }, แต้มสะสม: ${studentContext.points || 0} แต้ม, โมดูลที่กำลังเรียน: ${
          studentContext.activeModule || 'Dashboard'
        }`
      : ''
  }`;
}

export function buildTutorFallbackReply(message: string): string {
  const lower = (message || '').toLowerCase();
  let reply = 'สวัสดีครับน้องๆ! ครูพี่โค้ดดิ้งพร้อมช่วยตอบคำถามเสมอนะครับ 🤖✨\n\n';
  if (
    lower.includes('pdpa') ||
    lower.includes('ความปลอดภัย') ||
    lower.includes('รหัสผ่าน') ||
    lower.includes('ส่วนตัว')
  ) {
    reply +=
      '🛡️ **คำแนะนำเรื่องความปลอดภัยไซเบอร์ & PDPA:**\n- ข้อมูลส่วนบุคคลทั่วไป เช่น ชื่อเล่น กิจกรรมที่ชอบ สามารถแลกเปลี่ยนเรียนรู้ได้\n- ข้อมูลอ่อนไหวที่ห้ามแชร์สู่สาธารณะเด็ดขาด: เลขบัตรประชาชน 13 หลัก, วันเดือนปีเกิด, รหัสผ่าน, และรหัส OTP\n- การตั้งรหัสผ่านที่ดีควรใช้หลัก Passphrase ผสมตัวเลขและสัญลักษณ์ เช่น `CoderKid@2026!`';
  } else if (
    lower.includes('scratch') ||
    lower.includes('บล็อก') ||
    lower.includes('เด้ง') ||
    lower.includes('ชน') ||
    lower.includes('เดิน')
  ) {
    reply +=
      '🐱 **เทคนิคการเขียนบล็อกคำสั่ง Scratch:**\n1. ใช้บล็อก `when green flag clicked` เพื่อเริ่มต้นการทำงาน\n2. ลากบล็อก `forever` วนซ้ำตลอดเวลา แล้วใส่ `move (10) steps`\n3. เพิ่มบล็อก `if on edge, bounce` เพื่อให้ตัวละครเด้งกลับเมื่อชนขอบจอแคนวาส\n4. ตรวจจับการชน: ใช้บล็อก `if <touching [obstacle v]?> then` เพื่อลดพลังหรือเริ่มใหม่!';
  } else if (
    lower.includes('micro:bit') ||
    lower.includes('microbit') ||
    lower.includes('อุณหภูมิ') ||
    lower.includes('บอร์ด')
  ) {
    reply +=
      '📟 **การเขียนโค้ดกับบอร์ด Micro:bit V2 เสมือน:**\n1. ตรวจจับอุณหภูมิ: ดึงบล็อก `temperature (°C)` จากหมวด Input\n2. ตรวจสอบเงื่อนไข: ใช้บล็อก `if <temperature > 30> then`\n3. แสดงผลหน้าจอ LED Matrix 5x5: ใช้บล็อก `show icon [Surprised v]` หรือ `show string "HOT"`\n4. สามารถเปิดทดลองจริงใน **โมดูล 3: ปฏิบัติการ Scratch & Micro:bit** ได้เลยครับ!';
  } else if (
    lower.includes('python') ||
    lower.includes('error') ||
    lower.includes('syntax') ||
    lower.includes('บั๊ก')
  ) {
    reply +=
      '🐍 **เคล็ดลับการแก้บั๊กโค้ด Python สำหรับน้องๆ:**\n1. ตรวจดูเครื่องหมายโคลอน `:` ท้ายบรรทัด `if`, `elif`, `else`, `for`, `while`\n2. ตรวจดูการย่อหน้า (Indentation 4 เคาะ) ใต้คำสั่งเงื่อนไขหรือลูป\n3. ตรวจดูวงเล็บ `(...)` และเครื่องหมายคำพูด `"..."` ในคำสั่ง `print(...)` ว่าเปิด-ปิดครบคู่หรือไม่';
  } else if (
    lower.includes('โครงงาน') ||
    lower.includes('ไอเดีย') ||
    lower.includes('สิ่งประดิษฐ์') ||
    lower.includes('แนะนำ')
  ) {
    reply +=
      '💡 **3 ไอเดียโครงงานวิทยาการคำนวณยอดนิยมสำหรับน้องๆ ป.4 - ป.6:**\n1. **ระบบแจ้งเตือนน้ำท่วมในชุมชน (Flood Alert IoT):** ใช้ Micro:bit ตรวจวัดระดับน้ำและส่งเสียงเตือนผ่าน Buzzer\n2. **เกมเขาวงกตแยกขยะรักษ์โลก:** เขียนด้วย Scratch ให้ตัวละครเก็บขยะแยกประเภทลงถังขยะถูกต้อง\n3. **เครื่องวัดอุณหภูมิห้องเรียนประหยัดพลังงาน:** ถ้าอุณหภูมิสูงกว่า 27 องศาให้แสดงเตือนเปิดพัดลมระบายอากาศ!';
  } else {
    reply +=
      'น้องๆ สามารถถามคำถามได้ทั้งเรื่องกฎหมาย PDPA, 4 เสาหลักการคิดเชิงคำนวณ, ผังงาน Flowchart, บล็อกคำสั่ง Scratch, โค้ด Python และบอร์ดทดลอง Micro:bit เลยครับ! ลองเลือกหัวข้อคำถามแนะนำด้านล่างได้เลยนะครับ 💡🚀';
  }
  return reply;
}

export function buildFallbackBookSummary(params: {
  bookId?: string;
  title?: string;
  subtitle?: string;
  synopsis?: string;
  level?: string;
  learningOutcomes?: string[];
  sections?: Array<{ title?: string; keyTakeaway?: string; paragraphs?: string[] }>;
}) {
  const { bookId, title, subtitle, synopsis, level, learningOutcomes, sections } = params;
  const sectionPoints = Array.isArray(sections)
    ? sections
        .map((s, idx) =>
          s?.keyTakeaway
            ? `บทที่ ${idx + 1} (${s.title}): ${s.keyTakeaway}`
            : s?.title
            ? `บทที่ ${idx + 1}: ${s.title}`
            : ''
        )
        .filter(Boolean)
    : [];

  const outcomes = Array.isArray(learningOutcomes) ? learningOutcomes.filter(Boolean) : [];

  return {
    bookId: bookId || 'book',
    overview: `${title || 'e-Book'} (${level || 'ป.4-6'}) — ${
      synopsis ||
      subtitle ||
      'สรุปสาระสำคัญเพื่อทบทวนความรู้ความเข้าใจ การคิดวิเคราะห์ และการนำไปใช้ก่อนทำแบบทดสอบท้ายเล่ม'
    }`,
    keyConcepts:
      sectionPoints.length > 0
        ? sectionPoints
        : outcomes.length > 0
        ? outcomes
        : [
            'เข้าใจหลักการพื้นฐานของบทเรียน',
            'วิเคราะห์ขั้นตอนการทำงานและหาจุดผิดพลาด (Debugging)',
            'ประยุกต์ใช้ความรู้สร้างโครงงานแก้ปัญหาในชีวิตจริง',
          ],
    examTips: [
      '📘 มิติความเข้าใจ: ทบทวนคำศัพท์สำคัญ โครงสร้างการทำงาน และหน้าที่ของคำสั่ง/อุปกรณ์หลักในแต่ละบท',
      '🔍 มิติการคิดวิเคราะห์: สังเกตลำดับการทำงาน (Sequence) เงื่อนไข (if-else) และการวนซ้ำ (forever/while) ว่าถ้าขาดส่วนใดไปจะเกิดผลอย่างไร',
      '🚀 มิติการนำไปใช้: เชื่อมโยงความรู้ในหนังสือเข้ากับการแก้ปัญหาจริงในโรงเรียนหรือชีวิตประจำวันอย่างปลอดภัย',
    ],
    memoryMnemonic:
      'จำง่ายก่อนสอบ: "รับค่า (Input) ➔ ประมวลผลเงื่อนไข (Process) ➔ แสดงผลลัพธ์ (Output) ➔ ตรวจสอบแก้ไข (Debug)"',
  };
}

export const CREDIBLE_CS_BOOK_CATALOG: ExternalCatalogBook[] = [
  {
    id: 'ipst-cs-p4',
    title: 'หนังสือเรียนรายวิชาพื้นฐานวิทยาศาสตร์และเทคโนโลยี (วิทยาการคำนวณ) ชั้นประถมศึกษาปีที่ 4',
    publisher: 'สถาบันส่งเสริมการสอนวิทยาศาสตร์และเทคโนโลยี (สสวท.) กระทรวงศึกษาธิการ',
    gradeLevel: 'ป.4',
    category: 'หนังสือเรียนมาตรฐาน ว 4.2',
    editionYear: 'หลักสูตรแกนกลาง พ.ศ. 2551 (ฉบับปรับปรุง พ.ศ. 2560 / อัปเดตสื่อดิจิทัล 2568)',
    description:
      'ปูพื้นฐานการใช้เหตุผลเชิงตรรกะในการแก้ปัญหา การออกแบบอัลกอริทึมเบื้องต้น การเขียนโปรแกรมแบบบล็อก (Scratch) การรวบรวมข้อมูลและการใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย',
    keyTopics: [
      'ขั้นตอนวิธีและเหตุผลเชิงตรรกะ',
      'การเขียนโปรแกรมสั่งงานตัวละคร Scratch',
      'การค้นหาข้อมูลบนอินเทอร์เน็ตอย่างฉลาด',
      'การปกป้องข้อมูลส่วนตัวและรหัสผ่าน',
    ],
    credibilityBadge: '✓ หนังสือเรียนทางการ สสวท. & สพฐ.',
    officialUrl: 'https://proj14.ipst.ac.th/p4/p4-cs/',
    coverEmoji: '📘',
  },
  {
    id: 'ipst-cs-p5',
    title: 'หนังสือเรียนรายวิชาพื้นฐานวิทยาศาสตร์และเทคโนโลยี (วิทยาการคำนวณ) ชั้นประถมศึกษาปีที่ 5',
    publisher: 'สถาบันส่งเสริมการสอนวิทยาศาสตร์และเทคโนโลยี (สสวท.) กระทรวงศึกษาธิการ',
    gradeLevel: 'ป.5',
    category: 'หนังสือเรียนมาตรฐาน ว 4.2',
    editionYear: 'หลักสูตรแกนกลาง พ.ศ. 2551 (ฉบับปรับปรุง พ.ศ. 2560 / อัปเดตสื่อดิจิทัล 2568)',
    description:
      'เน้นการแก้ปัญหาด้วยเหตุผลเชิงตรรกะ การเขียนโปรแกรมที่มีการใช้คำสั่งวนซ้ำ (Loop) และเงื่อนไข การประมวลผลข้อมูลสถิติเบื้องต้น และจริยธรรมพลเมืองดิจิทัล',
    keyTopics: [
      'การออกแบบโปรแกรมด้วยการวนซ้ำ (Repeat / Forever)',
      'การตรวจสอบข้อผิดพลาดของโปรแกรม (Debugging)',
      'การรวบรวมและประมวลผลข้อมูลด้วยซอฟต์แวร์ตารางทำงาน',
      'รู้เท่าทันข่าวปลอม (Fake News) และลิขสิทธิ์ดิจิทัล',
    ],
    credibilityBadge: '✓ หนังสือเรียนทางการ สสวท. & สพฐ.',
    officialUrl: 'https://proj14.ipst.ac.th/p5/p5-cs/',
    coverEmoji: '📗',
  },
  {
    id: 'ipst-cs-p6',
    title: 'หนังสือเรียนรายวิชาพื้นฐานวิทยาศาสตร์และเทคโนโลยี (วิทยาการคำนวณ) ชั้นประถมศึกษาปีที่ 6',
    publisher: 'สถาบันส่งเสริมการสอนวิทยาศาสตร์และเทคโนโลยี (สสวท.) กระทรวงศึกษาธิการ',
    gradeLevel: 'ป.6',
    category: 'หนังสือเรียนมาตรฐาน ว 4.2',
    editionYear: 'หลักสูตรแกนกลาง พ.ศ. 2551 (ฉบับปรับปรุง พ.ศ. 2560 / อัปเดตสื่อดิจิทัล 2568)',
    description:
      'บูรณาการการแก้ปัญหาด้วยผังงาน (Flowchart) การเขียนโปรแกรมแบบมีตัวแปรและเงื่อนไขซับซ้อน (If-Else) การเชื่อมต่อบอร์ดสมองกลฝังตัว และการเตรียมความพร้อมสอบ O-NET ว 4.2',
    keyTopics: [
      'การออกแบบผังงาน (Flowchart) แบบลำดับ ทางเลือก และวนซ้ำ',
      'การสร้างเกมและโครงงานด้วยตัวแปร (Variables) และเงื่อนไข',
      'การใช้งานอินเทอร์เน็ตและการค้นหาขั้นสูง',
      'ความปลอดภัยไซเบอร์ กฎหมาย PDPA และพลเมืองยุค AI',
    ],
    credibilityBadge: '✓ หนังสือเรียนทางการ สสวท. & สพฐ.',
    officialUrl: 'https://proj14.ipst.ac.th/p6/p6-cs/',
    coverEmoji: '📙',
  },
  {
    id: 'scimath-eb-coding',
    title: 'คลังสื่อและหนังสืออิเล็กทรอนิกส์ (e-Book) วิทยาการคำนวณ & Unplugged Coding',
    publisher: 'คลังความรู้ SciMath สถาบันส่งเสริมการสอนวิทยาศาสตร์และเทคโนโลยี (สสวท.)',
    gradeLevel: 'ป.4–ป.6',
    category: 'คลัง e-Book & ใบกิจกรรม Unplugged',
    editionYear: 'อัปเดตสื่อเสริมล่าสุด พ.ศ. 2567–2568',
    description:
      'รวมหนังสืออ่านเพิ่มเติม บทความวิชาการ แผนการจัดกิจกรรม Coding แบบไม่ใช้คอมพิวเตอร์ (Unplugged Coding) และสื่ออินโฟกราฟิกพัฒนาทักษะการคิดเชิงคำนวณ 4 เสาหลัก',
    keyTopics: [
      'กิจกรรม Unplugged Coding สำหรับห้องเรียนประถม',
      '4 เสาหลักการคิดเชิงคำนวณ (Decomposition, Pattern, Abstraction, Algorithm)',
      'คู่มือครูและเฉลยใบกิจกรรมวิทยาการคำนวณ',
      'โจทย์ฝึกทักษะ Bebras Computational Thinking',
    ],
    credibilityBadge: '✓ คลังความรู้ทางการ SciMath สสวท.',
    officialUrl: 'https://www.scimath.org/ebooks',
    coverEmoji: '📚',
  },
  {
    id: 'microbit-org-curriculum',
    title: 'คู่มือการจัดการเรียนรู้ BBC micro:bit V2 & MakeCode Primary Computing',
    publisher: 'Micro:bit Educational Foundation (แปลและเทียบเคียงตัวชี้วัด ว 4.2)',
    gradeLevel: 'ป.4–ป.6',
    category: 'ฮาร์ดแวร์ & สมองกลฝังตัว IoT',
    editionYear: 'Micro:bit V2 Edition (2024–2025)',
    description:
      'หลักสูตรและคู่มือปฏิบัติการเขียนโปรแกรมควบคุมบอร์ดสมองกลฝังตัว BBC micro:bit V2 ครอบคลุมการแสดงผล LED 5x5 เซ็นเซอร์วัดแสง อุณหภูมิ ความเร่ง ลำโพง ไมโครโฟน และการสื่อสารไร้สาย Radio',
    keyTopics: [
      'สถาปัตยกรรมบอร์ด BBC micro:bit V2 และขาพอร์ต GPIO',
      'การเขียนโค้ดบล็อก Microsoft MakeCode และ MicroPython',
      'โครงงาน STEM นวัตกรรมฟาร์มอัจฉริยะและระบบแจ้งเตือนภัย',
      'การจำลองการทำงานด้วย Simulator ก่อนอัปโหลดลงบอร์ดจริง',
    ],
    credibilityBadge: '✓ มาตรฐานสากล Micro:bit Foundation',
    officialUrl: 'https://microbit.org/teach/lessons/',
    coverEmoji: '🤖',
  },
  {
    id: 'scratch-mit-creative-computing',
    title: 'Creative Computing Curriculum Guide with Scratch 3.0 (คู่มือสร้างสรรค์โค้ดดิ้งด้วย Scratch)',
    publisher: 'Scratch Foundation & Harvard Graduate School of Education',
    gradeLevel: 'ป.4–ป.6',
    category: 'การเขียนโปรแกรมแบบบล็อก (Block-based Coding)',
    editionYear: 'Scratch 3.0 Modern Curriculum',
    description:
      'คู่มือการออกแบบกิจกรรมการเรียนรู้การเขียนโปรแกรมเชิงสร้างสรรค์ด้วย Scratch 3.0 ตั้งแต่การสร้างแอนิเมชัน นิทานโต้ตอบ ดนตรีดิจิทัล ไปจนถึงการสร้างเกมและการตรวจจับด้วยกล้อง AI Sensing',
    keyTopics: [
      'ลำดับคำสั่ง เหตุการณ์ (Events) และการกระจายข้อความ (Broadcast)',
      'การสร้างตัวแปร คะแนน เวลา และระบบฟิสิกส์เบื้องต้นในเกม',
      'การสร้างบล็อกคำสั่งของตนเอง (My Blocks / Functions)',
      'ส่วนขยาย Pen, Music และ Video Sensing',
    ],
    credibilityBadge: '✓ มาตรฐาน MIT Media Lab & Scratch Foundation',
    officialUrl: 'https://scratch.mit.edu/educators',
    coverEmoji: '🐱',
  },
  {
    id: 'dltv-cs-primary',
    title: 'ชุดสื่อการสอนและแผนการจัดการเรียนรู้ทางไกล วิชาวิทยาการคำนวณ ป.4–ป.6 (DLTV)',
    publisher: 'มูลนิธิการศึกษาทางไกลผ่านดาวเทียม ในพระบรมราชูปถัมภ์ & สพฐ.',
    gradeLevel: 'ป.4–ป.6',
    category: 'แผนการสอน & สื่อวิดีโอพระราชทาน',
    editionYear: 'ภาคเรียนที่ 1–2 ปีการศึกษาปัจจุบัน',
    description:
      'รวมแผนการจัดการเรียนรู้รายชั่วโมง สไลด์ประกอบการสอน ใบงาน และสื่อวิดีทัศน์วิชาวิทยาการคำนวณ ระดับชั้น ป.4, ป.5 และ ป.6 ตามมาตรฐานการเรียนรู้และตัวชี้วัด ว 4.2 สพฐ.',
    keyTopics: [
      'แผนการจัดการเรียนรู้รายชั่วโมงครบทั้งปีการศึกษา',
      'ใบงานและแบบฝึกหัดวัดผลตามตัวชี้วัด ว 4.2',
      'คลิปการสอนและสาธิตการเขียนโปรแกรมทีละขั้นตอน',
      'แนวทางการวัดและประเมินผลสมรรถนะผู้เรียนในชั้นเรียน',
    ],
    credibilityBadge: '✓ มูลนิธิ DLTV & สพฐ. กระทรวงศึกษาธิการ',
    officialUrl: 'https://www.dltv.ac.th/',
    coverEmoji: '📺',
  },
  {
    id: 'depa-ai-digital-citizenship',
    title: 'คู่มือพลเมืองดิจิทัล ความปลอดภัยไซเบอร์ และปัญญาประดิษฐ์สำหรับเยาวชน (Coding & AI Literacy)',
    publisher: 'สำนักงานส่งเสริมเศรษฐกิจดิจิทัล (depa) & สำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.)',
    gradeLevel: 'ป.4–ป.6',
    category: 'พลเมืองดิจิทัล & ปัญญาประดิษฐ์ (AI/PDPA)',
    editionYear: 'ฉบับทันสมัย พ.ศ. 2567–2568',
    description:
      'สื่อการเรียนรู้เสริมทักษะความฉลาดทางดิจิทัล (DQ) การคุ้มครองข้อมูลส่วนบุคคล (PDPA สำหรับนักเรียน) การรับมือภัยคุกคามออนไลน์ และพื้นฐานการทำงานของปัญญาประดิษฐ์ (AI Literacy)',
    keyTopics: [
      'สิทธิเจ้าของข้อมูลส่วนบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)',
      'ทักษะความฉลาดทางดิจิทัล (Digital Intelligence: DQ)',
      'หลักการทำงานของ Machine Learning และการใช้ AI อย่างมีจริยธรรม',
      'การป้องกันภัย Phishing, มัลแวร์ และการกลั่นแกล้งบนโลกไซเบอร์',
    ],
    credibilityBadge: '✓ หน่วยงานภาครัฐ depa & สคส. (PDPC)',
    officialUrl: 'https://www.depa.or.th/',
    coverEmoji: '🛡️',
  },
];

export const DEFAULT_GROUNDING_SOURCES = [
  {
    title: 'Project 14 สสวท. - สื่อการสอนวิชาวิทยาการคำนวณ ประถมศึกษา ป.4-ป.6',
    uri: 'https://proj14.ipst.ac.th/',
  },
  {
    title: 'คลังความรู้ SciMath สสวท. - หนังสืออิเล็กทรอนิกส์และสื่อวิทยาการคำนวณ',
    uri: 'https://www.scimath.org/ebooks',
  },
  {
    title: 'สถาบันส่งเสริมการสอนวิทยาศาสตร์และเทคโนโลยี (สสวท. IPST)',
    uri: 'https://www.ipst.ac.th/',
  },
  {
    title: 'Micro:bit Educational Foundation - Primary Computing Lessons & Guides',
    uri: 'https://microbit.org/teach/lessons/',
  },
  {
    title: 'Scratch Foundation for Educators - Creative Computing Guides',
    uri: 'https://scratch.mit.edu/educators',
  },
  {
    title: 'มูลนิธิการศึกษาทางไกลผ่านดาวเทียม (DLTV) สพฐ.',
    uri: 'https://www.dltv.ac.th/',
  },
];

export function filterCuratedBooksCatalog(
  cleanQuery: string,
  cleanGrade: string,
  cleanCategory: string
): ExternalCatalogBook[] {
  const matched = CREDIBLE_CS_BOOK_CATALOG.filter((b) => {
    if (cleanGrade !== 'all' && !b.gradeLevel.includes(cleanGrade) && b.gradeLevel !== 'ป.4–ป.6') {
      return false;
    }
    if (cleanCategory !== 'all' && !b.category.toLowerCase().includes(cleanCategory.toLowerCase())) {
      return false;
    }
    if (cleanQuery) {
      const q = cleanQuery.toLowerCase();
      const hay = `${b.title} ${b.publisher} ${b.description} ${b.keyTopics.join(' ')} ${b.gradeLevel}`.toLowerCase();
      return hay.includes(q);
    }
    return true;
  });
  return matched.length > 0 ? matched : CREDIBLE_CS_BOOK_CATALOG;
}

export function buildDynamicSearchSynthesis(
  books: ExternalCatalogBook[],
  cleanQuery: string,
  cleanGrade: string
): string {
  const gradeLabel =
    cleanGrade === 'all' ? 'ระดับชั้นประถมศึกษาปีที่ 4–6 (ป.4–ป.6)' : `ระดับชั้น ${cleanGrade}`;
  const queryLabel = cleanQuery ? `ตามคำค้นหา "${cleanQuery}" ` : '';
  const highlights = books
    .slice(0, 4)
    .map((b, i) => `${i + 1}) ${b.title} (${b.publisher})`)
    .join('\n');

  return `ผลการสืบค้นรายการหนังสือเรียนวิทยาการคำนวณและสื่อการสอนมาตรฐาน ว 4.2 ${queryLabel}สำหรับ${gradeLabel} พบสื่อการเรียนรู้จากแหล่งอ้างอิงทางการที่น่าเชื่อถือ จำนวน ${books.length} รายการหลัก:\n${highlights}\n\nครอบคลุมเนื้อหาการคิดเชิงคำนวณ (Computational Thinking), การเขียนโปรแกรมแบบบล็อก Scratch 3.0, สมองกลฝังตัว BBC micro:bit V2 และทักษะพลเมืองดิจิทัลตามกฎหมาย PDPA`;
}
