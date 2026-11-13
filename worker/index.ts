/**
 * Cloudflare Worker Backend for Coder Kids Web Application
 * Handles server-side Gemini AI Tutor API and persistent student/log endpoints
 * Fully compatible with Cloudflare Workers (Static Assets) and Cloudflare Pages
 */
import { GoogleGenAI } from '@google/genai';

export interface KVNamespace {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string) => Promise<void>;
  delete?: (key: string) => Promise<void>;
}

export interface ExecutionContext {
  waitUntil: (promise: Promise<any>) => void;
  passThroughOnException: () => void;
}

export interface Env {
  GEMINI_API_KEY?: string;
  STUDENTS_KV?: KVNamespace;
  LOGS_KV?: KVNamespace;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
}

// In-memory fallback if KV namespaces are not bound
const inMemoryLogs: any[] = [];
const inMemoryStudents: any[] = [];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
    },
  });
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // ------------------ API ROUTES ------------------
    if (url.pathname.startsWith('/api/')) {
      // 0. HEALTH CHECK ENDPOINT
      if (url.pathname === '/api/health' && request.method === 'GET') {
        return jsonResponse({
          status: 'ok',
          runtime: 'cloudflare-workers',
          geminiConfigured: Boolean(env.GEMINI_API_KEY),
        });
      }

      // 1. AI TUTOR CHAT API (Server-side Gemini API using GEMINI_API_KEY secret)
      if (url.pathname === '/api/tutor' && request.method === 'POST') {
        try {
          const body = (await request.json().catch(() => ({}))) as any;
          const { message, history, studentContext } = body;

          if (!message || typeof message !== 'string') {
            return jsonResponse({ error: 'Message is required' }, 400);
          }

          const apiKey = env.GEMINI_API_KEY;

          // If GEMINI_API_KEY is not configured yet in Cloudflare secrets, provide friendly educational response
          if (!apiKey) {
            const lower = message.toLowerCase();
            let reply = 'สวัสดีครับน้องๆ! ครูพี่โค้ดดิ้งพร้อมช่วยตอบคำถามเสมอนะครับ 🤖✨\n\n';
            if (lower.includes('pdpa') || lower.includes('ความปลอดภัย') || lower.includes('รหัสผ่าน') || lower.includes('ส่วนตัว')) {
              reply += '🛡️ **คำแนะนำเรื่องความปลอดภัยไซเบอร์ & PDPA:**\n- ข้อมูลทั่วไป เช่น ชื่อเล่น กิจกรรมที่ชอบ สามารถแลกเปลี่ยนเรียนรู้ได้\n- ข้อมูลอ่อนไหวที่ห้ามแชร์เด็ดขาด: เลขบัตรประชาชน 13 หลัก, รหัสผ่าน, และรหัส OTP\n- การตั้งรหัสผ่านที่ดีควรใช้หลัก Passphrase ผสมตัวเลขและสัญลักษณ์ เช่น `CoderKid@2026!`';
            } else if (lower.includes('scratch') || lower.includes('บล็อก') || lower.includes('เด้ง') || lower.includes('ชน')) {
              reply += '🐱 **เทคนิคการเขียนบล็อกคำสั่ง Scratch:**\n1. ใช้บล็อก `when green flag clicked` เพื่อเริ่มต้นการทำงาน\n2. ลากบล็อก `forever` แล้วใส่ `move (10) steps`\n3. เพิ่มบล็อก `if on edge, bounce` เพื่อให้ตัวละครเด้งกลับเมื่อชนขอบจอ\n4. ตรวจจับการชน: ใช้บล็อก `if <touching [obstacle v]?> then` เพื่อลดพลังหรือเริ่มใหม่!';
            } else if (lower.includes('micro:bit') || lower.includes('microbit') || lower.includes('อุณหภูมิ') || lower.includes('บอร์ด')) {
              reply += '📟 **การเขียนโค้ดกับบอร์ด Micro:bit V2 เสมือน:**\n1. ตรวจจับอุณหภูมิ: ดึงบล็อก `temperature (°C)` ในหมวด Input\n2. ตรวจสอบเงื่อนไข: ใช้บล็อก `if <temperature > 30> then`\n3. แสดงผลหน้าจอ LED Matrix 5x5: ใช้บล็อก `show icon [Surprised v]` หรือ `show string "HOT"`\n4. สามารถเปิดทดลองจริงใน **โมดูล 3: ปฏิบัติการ Scratch & Micro:bit** ได้เลยครับ!';
            } else if (lower.includes('โครงงาน') || lower.includes('ไอเดีย') || lower.includes('สิ่งประดิษฐ์') || lower.includes('แนะนำ')) {
              reply += '💡 **3 ไอเดียโครงงานวิทยาการคำนวณยอดนิยม:**\n1. **ระบบแจ้งเตือนน้ำท่วมในชุมชน (Flood Alert IoT):** ใช้ Micro:bit ตรวจวัดระดับน้ำและส่งเสียงเตือน\n2. **เกมเขาวงกตแยกขยะรักษ์โลก:** เขียนด้วย Scratch ให้ตัวละครเก็บขยะแยกประเภทลงถังขยะถูกต้อง\n3. **เครื่องวัดอุณหภูมิห้องเรียนประหยัดพลังงาน:** ถ้าอุณหภูมิสูงกว่า 27 องศาให้แสดงเตือนเปิดพัดลมระบายอากาศ!';
            } else {
              reply += 'น้องๆ สามารถถามคำถามได้ทั้งเรื่องกฎหมาย PDPA, 4 เสาหลักการคิดเชิงคำนวณ, ผังงาน Flowchart, บล็อกคำสั่ง Scratch และบอร์ดทดลอง Micro:bit เลยครับ! 💡🚀';
            }
            return jsonResponse({ reply });
          }

          // Server-side Gemini call using @google/genai SDK
          const systemInstruction = `คุณคือ "ครูพี่โค้ดดิ้ง (Coder Kids AI Tutor)" ผู้ช่วยสอนและที่ปรึกษาโครงงานวิชาวิทยาการคำนวณและเทคโนโลยี (สพฐ. และ สสวท.) สำหรับนักเรียนชั้นประถมศึกษาและมัธยมศึกษาตอนต้น
บุคลิกภาพ: อบอุ่น ใจดี เป็นมิตร สนุกสนาน แทนตัวเองว่า "ครูพี่โค้ดดิ้ง" และเรียกผู้เรียนอย่างน่ารัก เช่น "น้องๆ", "น้องคนเก่ง"
ความรู้ใน 4 โมดูลหลัก:
1. ความปลอดภัยดิจิทัล & PDPA
2. การคิดเชิงคำนวณ & Flowchart
3. บล็อกคำสั่ง Scratch & บอร์ด Micro:bit V2
4. โครงงานสะท้อนคิด แฟ้มผลงาน & เกียรติบัตร
ใช้อิโมจิน่ารักประกอบการอธิบาย สั้น กระชับ เข้าใจง่าย
${studentContext ? `\nข้อมูลบริบทผู้เรียน: ชื่อ: ${studentContext.name || 'ผู้เรียน'}, ชั้น: ${studentContext.grade || 'ป.4-ป.6'}, แต้ม: ${studentContext.points || 0}` : ''}`;

          const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

          if (Array.isArray(history)) {
            for (const item of history.slice(-8)) {
              if (item && item.text) {
                contents.push({
                  role: item.role === 'model' ? 'model' : 'user',
                  parts: [{ text: item.text }],
                });
              }
            }
          }

          contents.push({
            role: 'user',
            parts: [{ text: message }],
          });

          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              },
            },
          });

          const response = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents,
            config: {
              systemInstruction,
            },
          });

          const reply = response.text || 'ขออภัยครับ ครูพี่โค้ดดิ้งกำลังประมวลผล ลองถามคำถามใหม่อีกครั้งนะครับ! 🤖';
          return jsonResponse({ reply });
        } catch (err: any) {
          console.error('Cloudflare Worker Tutor Error:', err);
          return jsonResponse({
            reply: 'ครูพี่โค้ดดิ้งยินดีต้อนรับสู่โลกแห่งการเขียนโค้ด! มีข้อสงสัยเกี่ยวกับ Flowchart หรือ Scratch สอบถามได้เลยนะครับ 🚀✨',
          });
        }
      }

      // 2. RECORD CLASSROOM ACCESS LOG
      if (url.pathname === '/api/logs/record' && request.method === 'POST') {
        try {
          const log = (await request.json().catch(() => ({}))) as any;
          if (log && log.studentName) {
            const nowThai = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).replace('T', ' ');
            const logItem = {
              timestamp: log.timestamp || nowThai,
              studentName: log.studentName,
              grade: log.grade || 'ป.4/1',
              school: log.school || 'โรงเรียนอนุบาลนราธิวาส',
              avatar: log.avatar || '🐱',
              action: log.action || 'เข้าใช้งานห้องเรียน Coder Kids',
              note: log.note || 'บันทึกการเข้าเรียนอัตโนมัติ',
              streak: log.streak || 'Streak 1 วัน',
              activeModule: log.activeModule || 'dashboard',
              email: log.email || '',
            };

            inMemoryLogs.unshift(logItem);
            if (inMemoryLogs.length > 500) inMemoryLogs.length = 500;

            if (env.LOGS_KV) {
              await env.LOGS_KV.put('latest_logs', JSON.stringify(inMemoryLogs.slice(0, 200)));
            }
          }
          return jsonResponse({ success: true, totalLogs: inMemoryLogs.length });
        } catch (err: any) {
          return jsonResponse({ success: false, error: err.message }, 500);
        }
      }

      // 3. GET CLASSROOM ACCESS LOGS
      if (url.pathname === '/api/logs/list' && request.method === 'GET') {
        try {
          if (env.LOGS_KV) {
            const kvLogs = await env.LOGS_KV.get('latest_logs');
            if (kvLogs) {
              return jsonResponse({ success: true, logs: JSON.parse(kvLogs) });
            }
          }
          return jsonResponse({ success: true, logs: inMemoryLogs });
        } catch (err: any) {
          return jsonResponse({ success: false, error: err.message }, 500);
        }
      }

      // 4. REGISTER STUDENT PROFILE
      if (url.pathname === '/api/students/register' && request.method === 'POST') {
        try {
          const student = (await request.json().catch(() => ({}))) as any;
          if (student && student.name) {
            const nowThai = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).replace('T', ' ');
            const existingIdx = inMemoryStudents.findIndex(
              (s) =>
                (s.studentId && student.studentId && s.studentId === student.studentId) ||
                (s.name && student.name && s.name.trim().toLowerCase() === student.name.trim().toLowerCase())
            );

            const studentRecord = {
              id: student.id || `stu_${Date.now()}`,
              name: student.name.trim(),
              nickname: student.nickname ? student.nickname.trim() : '',
              studentId: student.studentId ? student.studentId.trim() : `CK-2569-${Math.floor(1000 + Math.random() * 9000)}`,
              grade: student.grade || 'ประถมศึกษาปีที่ 4/1',
              school: student.school || 'โรงเรียนอนุบาลนราธิวาส',
              avatarId: student.avatarId || 'avatar_cat',
              avatarEmoji: student.avatarEmoji || '🐱',
              registeredAt: student.registeredAt || nowThai,
              email: student.email || student.contactEmail || '',
              points: student.points || 50,
              bio: student.bio || 'พร้อมเริ่มต้นเรียนรู้วิทยาการคำนวณและสะสมแต้มผลงาน',
              role: student.role || 'student',
            };

            if (existingIdx >= 0) {
              inMemoryStudents[existingIdx] = { ...inMemoryStudents[existingIdx], ...studentRecord };
            } else {
              inMemoryStudents.push(studentRecord);
            }

            if (env.STUDENTS_KV) {
              await env.STUDENTS_KV.put('registered_students', JSON.stringify(inMemoryStudents));
            }
          }
          return jsonResponse({ success: true, totalStudents: inMemoryStudents.length });
        } catch (err: any) {
          return jsonResponse({ success: false, error: err.message }, 500);
        }
      }

      // 5. GET REGISTERED STUDENTS LIST
      if (url.pathname === '/api/students/list' && request.method === 'GET') {
        try {
          if (env.STUDENTS_KV) {
            const kvStudents = await env.STUDENTS_KV.get('registered_students');
            if (kvStudents) {
              return jsonResponse({ success: true, students: JSON.parse(kvStudents) });
            }
          }
          return jsonResponse({ success: true, students: inMemoryStudents });
        } catch (err: any) {
          return jsonResponse({ success: false, error: err.message }, 500);
        }
      }

      return jsonResponse({ error: 'Endpoint not found' }, 404);
    }

    // ------------------ STATIC ASSETS (SPA FALLBACK) ------------------
    // Cloudflare Workers Static Assets binding
    if (env.ASSETS) {
      try {
        const response = await env.ASSETS.fetch(request);
        if (response.status === 404 && request.method === 'GET' && !url.pathname.includes('.')) {
          // SPA routing fallback: serve index.html for client-side navigation
          const indexUrl = new URL('/', request.url);
          return await env.ASSETS.fetch(new Request(indexUrl.toString(), request));
        }
        return response;
      } catch (assetErr) {
        console.error('Static asset fetch error:', assetErr);
      }
    }

    return new Response('Coder Kids App - Assets binding required in production', { status: 200 });
  },
};
