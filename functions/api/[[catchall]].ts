/**
 * Cloudflare Pages Functions API route handler
 * Automatically executes for any /api/* request when deployed on Cloudflare Pages
 */

export interface KVNamespace {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string) => Promise<void>;
  delete?: (key: string) => Promise<void>;
}

interface Env {
  GEMINI_API_KEY?: string;
  STUDENTS_KV?: KVNamespace;
  LOGS_KV?: KVNamespace;
}

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

// In-memory fallback
const inMemoryLogs: any[] = [];
const inMemoryStudents: any[] = [];

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 1. AI TUTOR CHAT API
  if (url.pathname === '/api/tutor' && request.method === 'POST') {
    try {
      const body = (await request.json().catch(() => ({}))) as any;
      const { message, history, studentContext } = body;

      if (!message || typeof message !== 'string') {
        return jsonResponse({ error: 'Message is required' }, 400);
      }

      const apiKey = env.GEMINI_API_KEY;

      if (!apiKey) {
        return jsonResponse({
          reply: 'สวัสดีครับน้องๆ! ครูพี่โค้ดดิ้งพร้อมช่วยตอบคำถามวิชาวิทยาการคำนวณเสมอนะครับ 🤖✨ น้องๆ สามารถถามเรื่อง Scratch, Micro:bit, Flowchart หรือกฎหมาย PDPA ได้เลยครับ!',
        });
      }

      const systemInstructionText = `คุณคือ "ครูพี่โค้ดดิ้ง (Coder Kids AI Tutor)" ผู้ช่วยสอนวิชาวิทยาการคำนวณสำหรับนักเรียน ป.4-ป.6 สพฐ. และ สสวท.
ใจดี อบอุ่น เป็นมิตร ตอบสั้น กระชับ มีตัวอย่างบล็อกคำสั่ง Scratch หรือคำสั่ง Micro:bit เข้าใจง่าย ใช้อิโมจิประกอบ
${studentContext ? `บริบทผู้เรียน: ${studentContext.name || 'ผู้เรียน'}, แต้ม: ${studentContext.points || 0}` : ''}`;

      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

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

      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const apiRes = await fetch(geminiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemInstructionText }] },
          generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
        }),
      });

      if (!apiRes.ok) {
        return jsonResponse({
          reply: 'ครูพี่โค้ดดิ้งยินดีช่วยเหลือเสมอ! มีข้อสงสัยเกี่ยวกับโค้ดดิ้ง สอบถามได้เลยนะครับ 🤖✨',
        });
      }

      const apiJson = (await apiRes.json()) as any;
      const reply = apiJson.candidates?.[0]?.content?.parts?.[0]?.text || 'ครูพี่โค้ดดิ้งพร้อมตอบคำถามเสมอครับ 🚀';
      return jsonResponse({ reply });
    } catch {
      return jsonResponse({
        reply: 'ครูพี่โค้ดดิ้งพร้อมให้คำแนะนำเรื่องบทเรียน Scratch และ Micro:bit ครับ 💻✨',
      });
    }
  }

  // 2. LOGS RECORD
  if (url.pathname === '/api/logs/record' && request.method === 'POST') {
    try {
      const log = (await request.json().catch(() => ({}))) as any;
      if (log && log.studentName) {
        inMemoryLogs.unshift(log);
        if (inMemoryLogs.length > 300) inMemoryLogs.length = 300;
        if (env.LOGS_KV) {
          await env.LOGS_KV.put('latest_logs', JSON.stringify(inMemoryLogs.slice(0, 150)));
        }
      }
      return jsonResponse({ success: true, totalLogs: inMemoryLogs.length });
    } catch (err: any) {
      return jsonResponse({ success: false, error: err.message }, 500);
    }
  }

  // 3. LOGS LIST
  if (url.pathname === '/api/logs/list' && request.method === 'GET') {
    try {
      if (env.LOGS_KV) {
        const kvLogs = await env.LOGS_KV.get('latest_logs');
        if (kvLogs) return jsonResponse({ success: true, logs: JSON.parse(kvLogs) });
      }
      return jsonResponse({ success: true, logs: inMemoryLogs });
    } catch (err: any) {
      return jsonResponse({ success: false, error: err.message }, 500);
    }
  }

  // 4. STUDENTS REGISTER
  if (url.pathname === '/api/students/register' && request.method === 'POST') {
    try {
      const student = (await request.json().catch(() => ({}))) as any;
      if (student && student.name) {
        const existingIdx = inMemoryStudents.findIndex((s) => s.studentId === student.studentId || s.name === student.name);
        if (existingIdx >= 0) {
          inMemoryStudents[existingIdx] = { ...inMemoryStudents[existingIdx], ...student };
        } else {
          inMemoryStudents.push(student);
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

  // 5. STUDENTS LIST
  if (url.pathname === '/api/students/list' && request.method === 'GET') {
    try {
      if (env.STUDENTS_KV) {
        const kvStudents = await env.STUDENTS_KV.get('registered_students');
        if (kvStudents) return jsonResponse({ success: true, students: JSON.parse(kvStudents) });
      }
      return jsonResponse({ success: true, students: inMemoryStudents });
    } catch (err: any) {
      return jsonResponse({ success: false, error: err.message }, 500);
    }
  }

  return jsonResponse({ error: 'Endpoint not found' }, 404);
}
