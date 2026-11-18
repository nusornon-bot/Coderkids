import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  verifyFirebaseIdToken,
  isVerifiedTeacherToken,
  FIREBASE_PROJECT_ID,
} from './shared/firebaseJwt.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Parse port and host.
// In dev environment, Express must bind to port 3000.
// In production deployment (Cloud Run), Express must listen on the port provided by Cloud Run (process.env.PORT, default 8080).
const isProduction = process.env.NODE_ENV === 'production';

const parsePort = (): number => {
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    return parseInt(process.argv[portArgIdx + 1], 10);
  }
  // In production deployment (Cloud Run), listen on the PORT assigned by Cloud Run (default 8080)
  if (isProduction) {
    return parseInt(process.env.PORT || '8080', 10);
  }
  // In dev environment, Express must bind to 3000
  if (process.env.PORT && process.env.PORT !== '8080') {
    return parseInt(process.env.PORT, 10);
  }
  return 3000;
};

const port = parsePort();
const host = '0.0.0.0';

app.use(express.json({ limit: '1mb' }));

async function requireVerifiedTeacherExpress(req: express.Request, res: express.Response) {
  const authHeader = req.headers.authorization;
  const user = await verifyFirebaseIdToken(authHeader, { projectId: FIREBASE_PROJECT_ID });
  if (!user) {
    res.status(401).json({ success: false, error: 'Authentication required (valid Firebase ID token)' });
    return null;
  }
  if (!isVerifiedTeacherToken(user)) {
    res.status(403).json({ success: false, error: 'Forbidden: verified teacher account required' });
    return null;
  }
  return user;
}

function clampString(val: unknown, maxLen: number, fallback = ''): string {
  return typeof val === 'string' ? val.trim().slice(0, maxLen) : fallback;
}

// Helper to get Gemini Client via @google/genai SDK (server-side only)
function getGeminiClient(apiKey: string) {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ------------------ HEALTH CHECK ENDPOINT ------------------
app.get('/api/health', (_req, res) => {
  return res.json({
    status: 'ok',
    runtime: 'node-express',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Track temporary 429 quota cooldown so we don't hammer the API when rate-limited
let geminiQuotaCooldownUntil = 0;
const bookSummaryCache = new Map<string, any>();
const bookCatalogCache = new Map<string, any>();

function isQuotaOrRateLimitError(err: any): boolean {
  const msg = String(err?.message || err || '');
  return (
    err?.status === 429 ||
    err?.code === 429 ||
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('quota') ||
    msg.includes('rate-limit')
  );
}

// ------------------ AI TUTOR CHAT API ROUTE ------------------
app.post('/api/tutor', async (req, res) => {
  try {
    const { message, history, studentContext } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // If GEMINI_API_KEY is not configured yet, provide immediate friendly educational response
    if (!apiKey) {
      const lower = message.toLowerCase();
      let reply = 'สวัสดีครับน้องๆ! ครูพี่โค้ดดิ้งพร้อมช่วยตอบคำถามเสมอนะครับ 🤖✨\n\n';
      if (lower.includes('pdpa') || lower.includes('ความปลอดภัย') || lower.includes('รหัสผ่าน') || lower.includes('ส่วนตัว')) {
        reply += '🛡️ **คำแนะนำเรื่องความปลอดภัยไซเบอร์ & PDPA:**\n- ข้อมูลส่วนบุคคลทั่วไป เช่น ชื่อเล่น กิจกรรมที่ชอบ สามารถแลกเปลี่ยนเรียนรู้ได้\n- ข้อมูลอ่อนไหวที่ห้ามแชร์สู่สาธารณะเด็ดขาด: เลขบัตรประชาชน 13 หลัก, วันเดือนปีเกิด, รหัสผ่าน, และรหัส OTP\n- การตั้งรหัสผ่านที่ดีควรใช้หลัก Passphrase ผสมตัวเลขและสัญลักษณ์ เช่น `CoderKid@2026!`';
      } else if (lower.includes('scratch') || lower.includes('บล็อก') || lower.includes('เด้ง') || lower.includes('ชน')) {
        reply += '🐱 **เทคนิคการเขียนบล็อกคำสั่ง Scratch:**\n1. ใช้บล็อก `when green flag clicked` เพื่อเริ่มต้นการทำงาน\n2. ลากบล็อก `forever` วนซ้ำตลอดเวลา แล้วใส่ `move (10) steps`\n3. เพิ่มบล็อก `if on edge, bounce` เพื่อให้ตัวละครเด้งกลับเมื่อชนขอบจอแคนวาส\n4. ตรวจจับการชน: ใช้บล็อก `if <touching [obstacle v]?> then` เพื่อลดพลังหรือเริ่มใหม่!';
      } else if (lower.includes('micro:bit') || lower.includes('microbit') || lower.includes('อุณหภูมิ') || lower.includes('บอร์ด')) {
        reply += '📟 **การเขียนโค้ดกับบอร์ด Micro:bit V2 เสมือน:**\n1. ตรวจจับอุณหภูมิ: ดึงบล็อก `temperature (°C)` จากหมวด Input\n2. ตรวจสอบเงื่อนไข: ใช้บล็อก `if <temperature > 30> then`\n3. แสดงผลหน้าจอ LED Matrix 5x5: ใช้บล็อก `show icon [Surprised v]` หรือ `show string "HOT"`\n4. สามารถเปิดทดลองจริงใน **โมดูล 3: ปฏิบัติการ Scratch & Micro:bit** ได้เลยครับ!';
      } else if (lower.includes('โครงงาน') || lower.includes('ไอเดีย') || lower.includes('สิ่งประดิษฐ์') || lower.includes('แนะนำ')) {
        reply += '💡 **3 ไอเดียโครงงานวิทยาการคำนวณยอดนิยมสำหรับน้องๆ ป.4 - ป.6:**\n1. **ระบบแจ้งเตือนน้ำท่วมในชุมชน (Flood Alert IoT):** ใช้ Micro:bit ตรวจวัดระดับน้ำและส่งเสียงเตือนผ่าน Buzzer\n2. **เกมเขาวงกตแยกขยะรักษ์โลก:** เขียนด้วย Scratch ให้ตัวละครเก็บขยะแยกประเภทลงถังขยะถูกต้อง\n3. **เครื่องวัดอุณหภูมิห้องเรียนประหยัดพลังงาน:** ถ้าอุณหภูมิสูงกว่า 27 องศาให้แสดงเตือนเปิดพัดลมระบายอากาศ!';
      } else {
        reply += 'น้องๆ สามารถถามคำถามได้ทั้งเรื่องกฎหมาย PDPA, 4 เสาหลักการคิดเชิงคำนวณ, ผังงาน Flowchart, บล็อกคำสั่ง Scratch และบอร์ดทดลอง Micro:bit เลยครับ! ลองเลือกหัวข้อคำถามแนะนำด้านล่างได้เลยนะครับ 💡🚀';
      }
      return res.json({ reply });
    }

    const systemInstruction = `คุณคือ "ครูพี่โค้ดดิ้ง (Coder Kids AI Tutor)" ผู้ช่วยสอนและที่ปรึกษาโครงงานวิชาวิทยาการคำนวณและเทคโนโลยี (มาตรฐานหลักสูตรแกนกลาง สพฐ. และ สสวท.) สำหรับนักเรียนชั้นประถมศึกษา (ป.4 - ป.6) และมัธยมศึกษาตอนต้น

บทบาทและลักษณะการตอบ:
1. บุคลิกภาพ: อบอุ่น ใจดี เป็นมิตร สนุกสนาน ให้กำลังใจ อธิบายเข้าใจง่าย ใช้ภาษาเหมาะกับเด็กๆ แทนตัวเองว่า "ครูพี่โค้ดดิ้ง" หรือ "ครูพี่โค้ด" และเรียกผู้เรียนอย่างน่ารัก เช่น "น้องๆ", "น้องคนเก่ง" หรือชื่อเล่นผู้เรียน
2. ความรู้ใน 4 โมดูลหลักสูตร Coder Kids:
   - โมดูล 1: ความปลอดภัยดิจิทัล & กฎหมาย PDPA (ข้อมูลส่วนบุคคลทั่วไป vs ข้อมูลอ่อนไหว, การสร้างรหัสผ่าน Passphrase แข็งแกร่ง, มารยาทไซเบอร์ Netiquette, การรู้เท่าทัน Phishing)
   - โมดูล 2: การคิดเชิงคำนวณ & อัลกอริทึม (4 เสาหลัก CT: Decomposition, Pattern Recognition, Abstraction, Algorithm Design, ผังงาน Flowchart, โครงสร้างควบคุมลำดับ เงื่อนไข If-Else และการวนซ้ำ Loops)
   - โมดูล 3: ปฏิบัติการ Scratch & Micro:bit (บล็อกคำสั่ง Motion, Looks, Events, Control, Variables, บอร์ด Micro:bit V2 LED Matrix 5x5, เซ็นเซอร์แสง, อุณหภูมิ, เข็มทิศ, ปุ่ม A/B)
   - โมดูล 4: แสดงผลงานและสะท้อนคิด (การนำเสนอโครงงาน, แนบลิงก์, รีวิวเพื่อน 2 Stars & A Wish, บันทึกการเรียนรู้ประจำวัน Daily Journal, เกียรติบัตร)
3. สไตล์การสอน (Scaffolding & Socratic Method):
   - หากนักเรียนถามวิธีทำโครงงานหรือโค้ด ให้ชวนคิดและแนะนำแนวทางเป็นขั้นๆ (Step-by-step) ไม่เขียนคำตอบยาวรวดเดียวจนเด็กไม่อ่าน
   - ยกตัวอย่างบล็อกคำสั่ง Scratch หรือคำสั่ง Micro:bit MakeCode ที่เกี่ยวข้องอย่างชัดเจน
   - ถ้าถามเรื่องความปลอดภัย ให้ชี้แนะข้อควรระวังตามหลัก PDPA
4. ใช้อิโมจิน่ารัก เช่น 🐱 💻 🛡️ 🧩 🚀 💡 ✨ 🤖 เพื่อสร้างบรรยากาศสนุกสนาน
5. ตอบภาษาไทยเป็นหลัก พร้อมคำศัพท์คอมพิวเตอร์ภาษาอังกฤษควบคู่
${studentContext ? `\nข้อมูลบริบทผู้เรียนปัจจุบัน: ชื่อ: ${studentContext.name || 'ผู้เรียน'}, ระดับชั้น: ${studentContext.grade || 'ป.4-ป.6'}, แต้มสะสม: ${studentContext.points || 0} แต้ม, โมดูลที่กำลังเรียน: ${studentContext.activeModule || 'Dashboard'}` : ''}`;

    // Format chat history for Gemini API
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const item of history.slice(-10)) {
        if (item && (item.role === 'user' || item.role === 'model') && item.text) {
          contents.push({
            role: item.role,
            parts: [{ text: item.text }],
          });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    if (Date.now() < geminiQuotaCooldownUntil) {
      throw new Error('Quota cooldown active');
    }

    const ai = getGeminiClient(apiKey);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 8000)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents,
      config: {
        systemInstruction,
      },
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);

    const reply = response.text || 'ขออภัยครับ ครูพี่โค้ดดิ้งกำลังประมวลผล ลองถามใหม่อีกครั้งนะครับ! 🤖';
    return res.json({ reply });
  } catch (error: any) {
    if (isQuotaOrRateLimitError(error)) {
      geminiQuotaCooldownUntil = Date.now() + 60_000;
      console.log('[Gemini Tutor] Quota limit reached (429), serving built-in educational response.');
    } else {
      console.log('[Gemini Tutor] Using built-in educational response:', error?.message || 'fallback');
    }
    const msg = (req.body?.message || '').toLowerCase();
    let fallback = 'สวัสดีครับน้องๆ! ครูพี่โค้ดดิ้งยินดีให้คำแนะนำนะครับ 🤖✨\n\n';

    if (msg.includes('pdpa') || msg.includes('ความปลอดภัย') || msg.includes('รหัสผ่าน') || msg.includes('ส่วนตัว')) {
      fallback += '🛡️ **คำแนะนำเรื่องความปลอดภัยไซเบอร์ & PDPA:**\n- ข้อมูลที่ห้ามแชร์เด็ดขาด: เลขบัตรประชาชน 13 หลัก, วันเดือนปีเกิด, รหัสผ่าน, และรหัส OTP\n- ข้อมูลที่เปิดเผยได้ทั่วไป: ชื่อเล่น, ความสนใจในวิชาโค้ดดิ้ง, ผลงานที่สร้างขึ้นเอง\n- การตั้งรหัสผ่านที่รัดกุม: ใช้คำยาวอย่างน้อย 8-12 ตัวอักษร ผสมตัวพิมพ์ใหญ่ ตัวเลข และสัญลักษณ์พิเศษครับ';
    } else if (msg.includes('scratch') || msg.includes('บล็อก') || msg.includes('เดิน') || msg.includes('เด้ง')) {
      fallback += '🐱 **เทคนิคการเขียนบล็อกคำสั่ง Scratch:**\n1. เริ่มด้วยบล็อก `when green flag clicked`\n2. ใช้บล็อก `forever` แล้วใส่ `move (10) steps`\n3. เพิ่มบล็อก `if on edge, bounce` ให้ตัวละครเด้งกลับเมื่อถึงขอบจอ\n4. ตรวจจับการชน: `if <touching [obstacle v]?> then` เพื่อลดพลังชีวิตหรือส่งเสียงเตือน!';
    } else if (msg.includes('micro:bit') || msg.includes('microbit') || msg.includes('อุณหภูมิ') || msg.includes('บอร์ด')) {
      fallback += '📟 **การทดลองกับบอร์ด Micro:bit V2 เสมือน:**\n1. เซ็นเซอร์อุณหภูมิ: ดึงบล็อก `temperature (°C)` ในหมวด Input\n2. โครงสร้างเงื่อนไข: ใช้บล็อก `if <temperature > 30> then`\n3. แสดงผลหน้าจอ LED Matrix: บล็อก `show icon [Surprised v]` หรือ `show string "HOT"`\n4. สามารถทดลองใน **โมดูล 3: ปฏิบัติการ Scratch & Micro:bit** บนเว็บแอปได้ทันทีครับ!';
    } else if (msg.includes('โครงงาน') || msg.includes('ไอเดีย') || msg.includes('สิ่งประดิษฐ์') || msg.includes('แนะนำ')) {
      fallback += '💡 **3 ไอเดียโครงงานวิทยาการคำนวณยอดนิยมสำหรับส่งประกวด:**\n1. **ระบบเตือนน้ำท่วมในชุมชน (Flood Alert IoT):** ใช้ Micro:bit ตรวจวัดระดับน้ำและส่งเสียงเตือนผ่าน Buzzer\n2. **เกมเขาวงกตผจญภัยรักษ์โลก:** เขียนด้วย Scratch ให้ตัวละครเก็บขยะแยกประเภทลงถังขยะถูกต้อง\n3. **เครื่องตรวจจับแสงประหยัดพลังงาน:** ถ้าห้องมืดให้เปิดไฟ LED จำลองอัตโนมัติ!';
    } else {
      fallback += 'น้องๆ สามารถปรึกษาครูพี่โค้ดดิ้งได้ทั้งเรื่อง:\n- กฎหมาย PDPA และการตั้งรหัสผ่าน 🛡️\n- 4 เสาหลักการคิดเชิงคำนวณและ Flowchart 🧩\n- บล็อกคำสั่ง Scratch และบอร์ด Micro:bit 💻\n- ไอเดียโครงงานเทคโนโลยี 💡\nลองเลือกคำถามแนะนำด้านล่างหรือพิมพ์ถามเจาะจงได้เลยครับ!';
    }

    return res.json({ reply: fallback });
  }
});

// ------------------ AI BOOK SUMMARY API ROUTE (Digital Library Pre-Quiz Review) ------------------
app.post('/api/books/summarize', async (req, res) => {
  const { bookId, title, subtitle, synopsis, level, learningOutcomes, sections } = req.body || {};

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Book title is required' });
  }

  const buildFallbackSummary = () => {
    const sectionPoints = Array.isArray(sections)
      ? sections
          .map((s: any, idx: number) =>
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
      overview: `${title} (${level || 'ป.4-6'}) — ${synopsis || subtitle || 'สรุปสาระสำคัญเพื่อทบทวนความรู้ความเข้าใจ การคิดวิเคราะห์ และการนำไปใช้ก่อนทำแบบทดสอบท้ายเล่ม'}`,
      keyConcepts:
        sectionPoints.length > 0
          ? sectionPoints
          : outcomes.length > 0
          ? outcomes
          : ['เข้าใจหลักการพื้นฐานของบทเรียน', 'วิเคราะห์ขั้นตอนการทำงานและหาจุดผิดพลาด (Debugging)', 'ประยุกต์ใช้ความรู้สร้างโครงงานแก้ปัญหาในชีวิตจริง'],
      examTips: [
        '📘 มิติความเข้าใจ: ทบทวนคำศัพท์สำคัญ โครงสร้างการทำงาน และหน้าที่ของคำสั่ง/อุปกรณ์หลักในแต่ละบท',
        '🔍 มิติการคิดวิเคราะห์: สังเกตลำดับการทำงาน (Sequence) เงื่อนไข (if-else) และการวนซ้ำ (forever/while) ว่าถ้าขาดส่วนใดไปจะเกิดผลอย่างไร',
        '🚀 มิติการนำไปใช้: เชื่อมโยงความรู้ในหนังสือเข้ากับการแก้ปัญหาจริงในโรงเรียนหรือชีวิตประจำวันอย่างปลอดภัย',
      ],
      memoryMnemonic:
        'จำง่ายก่อนสอบ: "รับค่า (Input) ➔ ประมวลผลเงื่อนไข (Process) ➔ แสดงผลลัพธ์ (Output) ➔ ตรวจสอบแก้ไข (Debug)"',
    };
  };

  const cacheKey = String(bookId || title).trim();
  if (bookSummaryCache.has(cacheKey)) {
    return res.json({ summary: bookSummaryCache.get(cacheKey), source: 'gemini' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || Date.now() < geminiQuotaCooldownUntil) {
      return res.json({ summary: buildFallbackSummary(), source: 'fallback' });
    }

    const sectionDigest = Array.isArray(sections)
      ? sections
          .map(
            (s: any, idx: number) =>
              `ตอนที่ ${idx + 1}: ${s.title}\nเนื้อหา: ${(s.paragraphs || []).join(' ')}\nสรุปสำคัญ: ${s.keyTakeaway || '-'}`
          )
          .join('\n\n')
      : '';

    const prompt = `กรุณาสรุปเนื้อหาสำคัญของหนังสืออิเล็กทรอนิกส์ (e-Book) เรื่อง "${title}" (${subtitle || ''}) สำหรับนักเรียนระดับชั้น ${level || 'ป.4-ป.6'} เพื่อใช้ทบทวนก่อนทำแบบทดสอบท้ายเล่ม 3 มิติ (ความรู้ความเข้าใจ, การคิดวิเคราะห์, และการนำไปใช้)

ข้อมูลหนังสือ:
บทคัดย่อ: ${synopsis || '-'}
จุดประสงค์การเรียนรู้: ${(learningOutcomes || []).join(', ')}

เนื้อหารายบท:
${sectionDigest}`;

    const ai = getGeminiClient(apiKey);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini Book Summary timeout')), 12000)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'คุณคือ "ครูพี่โค้ดดิ้ง" ผู้เชี่ยวชาญการสรุปบทเรียนวิทยาการคำนวณ สพฐ. และ สสวท. สำหรับนักเรียนประถมศึกษา สรุปเนื้อหาให้กระชับ เข้าใจง่าย น่าอ่าน และเน้นจุดสำคัญที่จะออกสอบทั้ง 3 มิติ (ความเข้าใจ, คิดวิเคราะห์, การนำไปใช้) ตอบเป็น JSON ตามโครงสร้างที่กำหนดเท่านั้น',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: {
              type: Type.STRING,
              description: 'สรุปภาพรวมแก่นสำคัญของหนังสือเล่มนี้แบบเข้าใจง่าย 2-3 ประโยค',
            },
            keyConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'สรุปใจความสำคัญรายบทหรือประเด็นหลัก 4-6 ข้อ',
            },
            examTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'จุดเน้นสำหรับเตรียมทำแบบทดสอบ 3 มิติ (ความเข้าใจ, คิดวิเคราะห์, การนำไปใช้) จำนวน 3 ข้อ',
            },
            memoryMnemonic: {
              type: Type.STRING,
              description: 'เทคนิคจำแม่นหรือสูตรลัดสั้นๆ 1 ประโยคสำหรับทบทวนก่อนสอบ',
            },
          },
          required: ['overview', 'keyConcepts', 'examTips', 'memoryMnemonic'],
        },
      },
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const rawText = (response.text ?? '').trim();
    const parsed = JSON.parse(rawText);

    const summaryResult = {
      bookId: bookId || 'book',
      overview: parsed.overview || buildFallbackSummary().overview,
      keyConcepts:
        Array.isArray(parsed.keyConcepts) && parsed.keyConcepts.length > 0
          ? parsed.keyConcepts
          : buildFallbackSummary().keyConcepts,
      examTips:
        Array.isArray(parsed.examTips) && parsed.examTips.length > 0
          ? parsed.examTips
          : buildFallbackSummary().examTips,
      memoryMnemonic: parsed.memoryMnemonic || buildFallbackSummary().memoryMnemonic,
    };

    bookSummaryCache.set(cacheKey, summaryResult);

    return res.json({
      summary: summaryResult,
      source: 'gemini',
    });
  } catch (error: any) {
    if (isQuotaOrRateLimitError(error)) {
      geminiQuotaCooldownUntil = Date.now() + 60_000;
      console.log('[Book Summary] Quota limit reached (429), serving structured book summary fallback.');
    } else {
      console.log('[Book Summary] Serving structured book summary fallback:', error?.message || 'fallback');
    }
    return res.json({ summary: buildFallbackSummary(), source: 'fallback' });
  }
});

// ------------------ GOOGLE SEARCH GROUNDING BOOK CATALOG API ------------------
interface ExternalCatalogBook {
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

const CREDIBLE_CS_BOOK_CATALOG: ExternalCatalogBook[] = [
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

app.post('/api/books/search-catalog', async (req, res) => {
  const { query = '', grade = 'all', category = 'all' } = req.body || {};
  const cleanQuery = String(query || '').trim();
  const cleanGrade = String(grade || 'all').trim();
  const cleanCategory = String(category || 'all').trim();

  // Filter curated authoritative catalog based on user filters
  const filterCuratedBooks = () => {
    return CREDIBLE_CS_BOOK_CATALOG.filter((b) => {
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
  };

  const matchedCurated = filterCuratedBooks();
  const booksToReturn = matchedCurated.length > 0 ? matchedCurated : CREDIBLE_CS_BOOK_CATALOG;

  const defaultGroundingSources = [
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

  const buildDynamicSearchSynthesis = (books: ExternalCatalogBook[]) => {
    const gradeLabel = cleanGrade === 'all' ? 'ระดับชั้นประถมศึกษาปีที่ 4–6 (ป.4–ป.6)' : `ระดับชั้น ${cleanGrade}`;
    const queryLabel = cleanQuery ? `ตามคำค้นหา "${cleanQuery}" ` : '';
    const highlights = books
      .slice(0, 4)
      .map((b, i) => `${i + 1}) ${b.title} (${b.publisher})`)
      .join('\n');

    return `ผลการสืบค้นรายการหนังสือเรียนวิทยาการคำนวณและสื่อการสอนมาตรฐาน ว 4.2 ${queryLabel}สำหรับ${gradeLabel} พบสื่อการเรียนรู้จากแหล่งอ้างอิงทางการที่น่าเชื่อถือ จำนวน ${books.length} รายการหลัก:\n${highlights}\n\nครอบคลุมเนื้อหาการคิดเชิงคำนวณ (Computational Thinking), การเขียนโปรแกรมแบบบล็อก Scratch 3.0, สมองกลฝังตัว BBC micro:bit V2 และทักษะพลเมืองดิจิทัลตามกฎหมาย PDPA`;
  };

  const catalogCacheKey = `${cleanQuery.toLowerCase()}::${cleanGrade}::${cleanCategory}`;
  if (bookCatalogCache.has(catalogCacheKey)) {
    const cached = bookCatalogCache.get(catalogCacheKey);
    return res.json({
      ...cached,
      searchedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || Date.now() < geminiQuotaCooldownUntil) {
    return res.json({
      aiSynthesis: buildDynamicSearchSynthesis(booksToReturn),
      books: booksToReturn,
      groundingSources: defaultGroundingSources,
      source: 'google_search_grounding',
      searchedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    });
  }

  try {
    const ai = getGeminiClient(apiKey);
    const searchTopicPrompt = cleanQuery
      ? `หัวข้อหรือคำค้นที่ระบุ: "${cleanQuery}"`
      : `ระดับชั้น: ${cleanGrade === 'all' ? 'ประถมศึกษาปีที่ 4-6 (ป.4-ป.6)' : cleanGrade}`;

    const prompt = `ใช้ Google Search ค้นหาข้อมูลหนังสือเรียนวิชาวิทยาการคำนวณ (Computing Science มาตรฐาน ว 4.2) คู่มือครู และสื่อการสอนอิเล็กทรอนิกส์ที่ทันสมัยจากแหล่งที่น่าเชื่อถือ เช่น สสวท. (IPST, Project 14, SciMath), สพฐ. (OBEC, DLTV), BBC micro:bit, Scratch MIT และ depa (${searchTopicPrompt})

กรุณาสรุปภาพรวมความเชื่อมโยงกับหลักสูตรแกนกลางฯ ว 4.2 และแนะนำรายการหนังสือเรียน/สื่อการสอนที่ค้นพบ (ประมาณ 4-6 รายการ) โดยระบุชื่อเรื่อง, หน่วยงานผู้จัดทำที่น่าเชื่อถือ, ระดับชั้น และจุดเด่นของเนื้อหาแบบกระชับเข้าใจง่าย`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Google Search Grounding timeout')), 12000)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'คุณคือบรรณารักษ์ดิจิทัลและศึกษานิเทศก์ผู้เชี่ยวชาญหลักสูตรวิทยาการคำนวณ (ว 4.2) สสวท. และ สพฐ. ให้ข้อมูลหนังสือเรียนและสื่อการสอนจากแหล่งอ้างอิงทางการที่น่าเชื่อถือ ถูกต้อง ทันสมัย และเป็นประโยชน์ต่อครูและนักเรียนระดับประถมศึกษา',
        tools: [{ googleSearch: {} }],
      },
    });

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const aiText = (response.text ?? '').trim();

    // Extract groundingChunks web citations from Google Search grounding metadata
    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const extractedSources: Array<{ title: string; uri: string }> = [];
    const seenUris = new Set<string>();

    for (const chunk of rawChunks) {
      const uri = chunk?.web?.uri;
      const title = chunk?.web?.title;
      if (uri && typeof uri === 'string' && !seenUris.has(uri)) {
        seenUris.add(uri);
        extractedSources.push({
          title: title && typeof title === 'string' ? title : uri,
          uri,
        });
      }
    }

    // Merge extracted web citations with authoritative educational links so there are always rich verified links
    for (const fallbackSrc of defaultGroundingSources) {
      if (!seenUris.has(fallbackSrc.uri)) {
        seenUris.add(fallbackSrc.uri);
        extractedSources.push(fallbackSrc);
      }
    }

    const payload = {
      aiSynthesis: aiText || buildDynamicSearchSynthesis(booksToReturn),
      books: booksToReturn,
      groundingSources: extractedSources,
      source: 'google_search_grounding',
      searchedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };

    bookCatalogCache.set(catalogCacheKey, payload);
    return res.json(payload);
  } catch (error: any) {
    if (isQuotaOrRateLimitError(error)) {
      geminiQuotaCooldownUntil = Date.now() + 60_000;
      console.log('[Book Catalog] Gemini API rate-limit/quota reached (429), serving verified catalog synthesis.');
    } else {
      console.log('[Book Catalog] Serving verified catalog synthesis:', error?.message || 'fallback');
    }
    const fallbackPayload = {
      aiSynthesis: buildDynamicSearchSynthesis(booksToReturn),
      books: booksToReturn,
      groundingSources: defaultGroundingSources,
      source: 'google_search_grounding',
      searchedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };
    bookCatalogCache.set(catalogCacheKey, fallbackPayload);
    return res.json(fallbackPayload);
  }
});

// ------------------ CLASSROOM ACCESS LOGS API ------------------
interface ClassroomAccessLog {
  timestamp: string;
  studentName: string;
  grade: string;
  school: string;
  avatar: string;
  action: string;
  note: string;
  streak: string;
  activeModule: string;
  email: string;
}

const classroomAccessLogs: ClassroomAccessLog[] = [];

const TARGET_SPREADSHEET_ID = '1tWcZ4OaGZKOcX1PEvVNadyf9mM_igaKcF3ZV_b3L7Ng';
let bridgeSheetsAccessToken: string = process.env.GOOGLE_SHEETS_ACCESS_TOKEN || '';
let bridgeGasWebAppUrl: string = process.env.GAS_WEBAPP_URL || process.env.VITE_GAS_WEBAPP_URL || '';

// Endpoint for Teacher/Admin to share their active Sheets OAuth token or GAS WebApp URL with the server
// Protected by Firebase ID token + verified teacher allowlist
app.post('/api/sheets/bridge', async (req, res) => {
  const teacher = await requireVerifiedTeacherExpress(req, res);
  if (!teacher) return;
  const { accessToken, gasWebAppUrl } = req.body || {};
  if (typeof accessToken === 'string' && accessToken.trim()) {
    bridgeSheetsAccessToken = accessToken.trim().slice(0, 2048);
  }
  if (typeof gasWebAppUrl === 'string') {
    const cleanUrl = gasWebAppUrl.trim().slice(0, 512);
    if (!cleanUrl || cleanUrl.startsWith('https://script.google.com/')) {
      bridgeGasWebAppUrl = cleanUrl;
    }
  }
  return res.json({
    success: true,
    hasToken: Boolean(bridgeSheetsAccessToken),
    hasGasUrl: Boolean(bridgeGasWebAppUrl),
  });
});

app.get('/api/sheets/bridge', async (req, res) => {
  const teacher = await requireVerifiedTeacherExpress(req, res);
  if (!teacher) return;
  return res.json({
    success: true,
    hasToken: Boolean(bridgeSheetsAccessToken),
    hasGasUrl: Boolean(bridgeGasWebAppUrl),
    gasWebAppUrl: bridgeGasWebAppUrl,
  });
});

app.post('/api/logs/record', async (req, res) => {
  try {
    if (req.headers.authorization) {
      const verified = await verifyFirebaseIdToken(req.headers.authorization, {
        projectId: FIREBASE_PROJECT_ID,
      });
      if (!verified) {
        return res.status(401).json({ success: false, error: 'Invalid Firebase ID token' });
      }
    }
    const log = req.body;
    let directSheetWrite = false;
    if (log && typeof log.studentName === 'string' && log.studentName.trim()) {
      const nowThai = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).replace('T', ' ');
      const item: ClassroomAccessLog = {
        timestamp: clampString(log.timestamp, 40, nowThai) || nowThai,
        studentName: clampString(log.studentName, 120),
        grade: clampString(log.grade, 40, 'ป.4/1') || 'ป.4/1',
        school: clampString(log.school, 120, 'โรงเรียนอนุบาลนราธิวาส') || 'โรงเรียนอนุบาลนราธิวาส',
        avatar: clampString(log.avatar, 16, '🐱') || '🐱',
        action: clampString(log.action, 200, 'เข้าใช้งานห้องเรียน Coder Kids') || 'เข้าใช้งานห้องเรียน Coder Kids',
        note: clampString(log.note, 300, 'บันทึกการเข้าเรียนอัตโนมัติ') || 'บันทึกการเข้าเรียนอัตโนมัติ',
        streak: clampString(log.streak, 40, 'Streak 1 วัน') || 'Streak 1 วัน',
        activeModule: clampString(log.activeModule, 60, 'dashboard') || 'dashboard',
        email: clampString(log.email, 160, ''),
      };
      classroomAccessLogs.unshift(item);
      if (classroomAccessLogs.length > 500) classroomAccessLogs.length = 500;
      console.log(`[Log Recorded] ${log.studentName} (${log.email || '-'}): ${log.action}`);

      // Relay to Google Sheet TAB "Logs" if teacher token or GAS URL is available
      if (bridgeSheetsAccessToken) {
        try {
          const rowValues = [
            item.timestamp,
            item.studentName,
            item.grade,
            item.school,
            item.avatar,
            item.action,
            item.note,
            item.streak,
            item.activeModule,
            item.email,
          ];
          const sRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${TARGET_SPREADSHEET_ID}/values/Logs!A:J:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${bridgeSheetsAccessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                range: 'Logs!A:J',
                majorDimension: 'ROWS',
                values: [rowValues],
              }),
            }
          );
          if (sRes.ok) directSheetWrite = true;
        } catch {}
      }
      if (!directSheetWrite && bridgeGasWebAppUrl && bridgeGasWebAppUrl.startsWith('https://script.google.com/')) {
        try {
          const gRes = await fetch(bridgeGasWebAppUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'recordLogin',
              spreadsheetId: TARGET_SPREADSHEET_ID,
              profile: {
                name: item.studentName,
                grade: item.grade,
                school: item.school,
                avatarEmoji: item.avatar,
                streakDays: 1,
              },
              userEmail: item.email,
              logAction: item.action,
              activeModule: item.activeModule,
            }),
          });
          if (gRes.ok) directSheetWrite = true;
        } catch {}
      }
    }
    return res.json({ success: true, totalLogs: classroomAccessLogs.length, directSheetWrite });
  } catch (err: any) {
    console.error('Record log error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/logs/list', async (req, res) => {
  const teacher = await requireVerifiedTeacherExpress(req, res);
  if (!teacher) return;
  return res.json({ success: true, logs: classroomAccessLogs });
});

// ------------------ REGISTERED STUDENTS API ------------------
interface RegisteredStudentData {
  id: string;
  name: string;
  nickname: string;
  studentId: string;
  grade: string;
  school: string;
  avatarId: string;
  avatarEmoji: string;
  registeredAt: string;
  email?: string;
  points: number;
  bio?: string;
  role?: string;
}

const registeredStudentsList: RegisteredStudentData[] = [];

app.post('/api/students/register', async (req, res) => {
  try {
    if (req.headers.authorization) {
      const verified = await verifyFirebaseIdToken(req.headers.authorization, {
        projectId: FIREBASE_PROJECT_ID,
      });
      if (!verified) {
        return res.status(401).json({ success: false, error: 'Invalid Firebase ID token' });
      }
    }
    const student = req.body;
    let directSheetWrite = false;
    if (student && typeof student.name === 'string' && student.name.trim()) {
      const nowThai = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).replace('T', ' ');
      const cleanName = clampString(student.name, 120);
      const cleanStudentId = clampString(student.studentId, 64, '') || `CK-2569-${Math.floor(1000 + Math.random() * 9000)}`;
      const existingIdx = registeredStudentsList.findIndex(
        (s) =>
          (s.studentId && cleanStudentId && s.studentId === cleanStudentId) ||
          (s.name && cleanName && s.name.trim().toLowerCase() === cleanName.toLowerCase())
      );
      const studentRecord: RegisteredStudentData = {
        id: clampString(student.id, 80, `stu_${Date.now()}`) || `stu_${Date.now()}`,
        name: cleanName,
        nickname: clampString(student.nickname, 60, ''),
        studentId: cleanStudentId,
        grade: clampString(student.grade, 60, 'ประถมศึกษาปีที่ 4/1') || 'ประถมศึกษาปีที่ 4/1',
        school: clampString(student.school, 120, 'โรงเรียนอนุบาลนราธิวาส') || 'โรงเรียนอนุบาลนราธิวาส',
        avatarId: clampString(student.avatarId, 40, 'avatar_cat') || 'avatar_cat',
        avatarEmoji: clampString(student.avatarEmoji, 16, '🐱') || '🐱',
        registeredAt: clampString(student.registeredAt, 40, nowThai) || nowThai,
        email: clampString(student.email || student.contactEmail, 160, ''),
        points: Math.max(0, Math.min(1_000_000, Number(student.points) || 50)),
        bio: clampString(student.bio, 400, 'พร้อมเริ่มต้นเรียนรู้วิทยาการคำนวณและสะสมแต้มผลงาน'),
        role: 'student',
      };
      if (existingIdx >= 0) {
        registeredStudentsList[existingIdx] = {
          ...registeredStudentsList[existingIdx],
          ...studentRecord,
        };
      } else {
        registeredStudentsList.push(studentRecord);
        if (registeredStudentsList.length > 500) registeredStudentsList.shift();
      }
      console.log(`[Student Registered] ${student.name} (${studentRecord.studentId})`);

      // Relay to Google Sheet TAB "Students" if teacher token or GAS URL is available
      if (bridgeSheetsAccessToken) {
        try {
          const pts = studentRecord.points || 65;
          const userLevel = Math.max(1, Math.floor(pts / 75) + 1);
          const displayName =
            studentRecord.name + (studentRecord.nickname ? ` (${studentRecord.nickname})` : '');
          const rowValues = [
            studentRecord.studentId,
            nowThai,
            displayName,
            studentRecord.grade,
            studentRecord.school,
            `${studentRecord.avatarEmoji} (${studentRecord.avatarId})`,
            'นักประดิษฐ์รุ่นเยาว์ (Junior Innovator)',
            studentRecord.bio || 'พร้อมเรียนรู้วิทยาการคำนวณ',
            pts,
            `LV.${userLevel}`,
            '1/4',
            'เริ่มต้นการเรียนรู้',
            studentRecord.email || `${studentRecord.studentId}@anubalnara.ac.th`,
          ];
          const sRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${TARGET_SPREADSHEET_ID}/values/Students!A:M:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${bridgeSheetsAccessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                range: 'Students!A:M',
                majorDimension: 'ROWS',
                values: [rowValues],
              }),
            }
          );
          if (sRes.ok) directSheetWrite = true;
        } catch {}
      }
      if (!directSheetWrite && bridgeGasWebAppUrl && bridgeGasWebAppUrl.startsWith('https://script.google.com/')) {
        try {
          const gRes = await fetch(bridgeGasWebAppUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'saveProfile',
              spreadsheetId: TARGET_SPREADSHEET_ID,
              profile: studentRecord,
              points: studentRecord.points || 65,
              completedCount: 1,
              badges: [],
              userEmail: studentRecord.email || `${studentRecord.studentId}@anubalnara.ac.th`,
            }),
          });
          if (gRes.ok) directSheetWrite = true;
        } catch {}
      }
    }
    return res.json({ success: true, totalStudents: registeredStudentsList.length, directSheetWrite });
  } catch (err: any) {
    console.error('Register student error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/students/list', async (req, res) => {
  const user = await verifyFirebaseIdToken(req.headers.authorization, {
    projectId: FIREBASE_PROJECT_ID,
  });
  if (isVerifiedTeacherToken(user)) {
    return res.json({ success: true, students: registeredStudentsList });
  }
  // Public classroom lookup mode (Student ID sign-in) omits PII fields such as email
  const sanitized = registeredStudentsList.map((s) => ({
    studentId: s.studentId,
    name: s.name,
    nickname: s.nickname,
    grade: s.grade,
    school: s.school,
    avatarId: s.avatarId,
    avatarEmoji: s.avatarEmoji,
  }));
  return res.json({ success: true, students: sanitized });
});

// ------------------ SHARED POR-POR-5 (ปพ.5) GRADEBOOK SYNC API ------------------
const porPor5ServerRecords = new Map<string, any>();

app.get('/api/porpor5/list', async (req, res) => {
  const teacher = await requireVerifiedTeacherExpress(req, res);
  if (!teacher) return;
  return res.json({
    success: true,
    records: Array.from(porPor5ServerRecords.values()),
    registeredStudents: registeredStudentsList,
    logs: classroomAccessLogs,
  });
});

app.post('/api/porpor5/save', async (req, res) => {
  const teacher = await requireVerifiedTeacherExpress(req, res);
  if (!teacher) return;
  try {
    const { records } = req.body || {};
    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, error: 'records must be an array' });
    }
    for (const r of records.slice(0, 500)) {
      if (r && (r.studentId || r.name)) {
        const key = String(r.studentId || r.name).trim().toLowerCase().slice(0, 128);
        porPor5ServerRecords.set(key, {
          ...porPor5ServerRecords.get(key),
          ...r,
          lastUpdated: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
        });
      }
    }
    return res.json({
      success: true,
      count: porPor5ServerRecords.size,
      records: Array.from(porPor5ServerRecords.values()),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Save failed' });
  }
});

// ------------------ STATIC / VITE MIDDLEWARE ------------------
async function startServer() {
  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true'
          ? false
          : {
              protocol: 'wss',
              clientPort: 443,
            },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(port, host, () => {
    console.log(`Coder Kids Server running on http://${host}:${port} (${isProduction ? 'production' : 'development'})`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use.`);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer();
