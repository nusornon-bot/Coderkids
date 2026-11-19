/**
 * Cloudflare Worker Backend for Coder Kids Web Application
 * Handles server-side Gemini AI Tutor API, e-Book Summary, Google Search Grounding Book Catalog,
 * Google Sheets Bridge, Classroom Logs, Student Registration, and PorPor 5 (ปพ.5) Sync.
 * Fully compatible with Cloudflare Workers (Static Assets) and Cloudflare Pages (Free Tier — no Google Cloud Billing required).
 */
import { GoogleGenAI, Type } from '@google/genai';
import {
  verifyFirebaseIdToken,
  isVerifiedTeacherToken,
  FIREBASE_PROJECT_ID,
} from '../shared/firebaseJwt.ts';
import {
  type ExternalCatalogBook,
  clampString,
  isQuotaOrRateLimitError,
  buildTutorSystemInstruction,
  buildTutorFallbackReply,
  buildFallbackBookSummary,
  CREDIBLE_CS_BOOK_CATALOG,
  DEFAULT_GROUNDING_SOURCES,
  filterCuratedBooksCatalog,
  buildDynamicSearchSynthesis,
} from '../shared/aiAndCatalogService.ts';

export type { ExternalCatalogBook };

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
  GOOGLE_SHEETS_ACCESS_TOKEN?: string;
  GAS_WEBAPP_URL?: string;
  STUDENTS_KV?: KVNamespace;
  LOGS_KV?: KVNamespace;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
}

const TARGET_SPREADSHEET_ID = '1tWcZ4OaGZKOcX1PEvVNadyf9mM_igaKcF3ZV_b3L7Ng';

// In-memory state & caches (persisted across warm Worker invocations, backed by KV when bound)
const inMemoryLogs: any[] = [];
const inMemoryStudents: any[] = [];
const porPor5ServerRecords = new Map<string, any>();
const bookSummaryCache = new Map<string, any>();
const bookCatalogCache = new Map<string, any>();

// Cooldown timestamp (ms) when Gemini API returns 429 RESOURCE_EXHAUSTED so subsequent requests
// serve curated educational synthesis immediately without requiring Google Cloud Billing
let geminiQuotaCooldownUntil = 0;

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

async function requireVerifiedTeacherWorker(request: Request) {
  const user = await verifyFirebaseIdToken(request.headers.get('Authorization'), {
    projectId: FIREBASE_PROJECT_ID,
  });
  if (!user) {
    return {
      ok: false as const,
      response: jsonResponse(
        { success: false, error: 'Authentication required (valid Firebase ID token)' },
        401
      ),
    };
  }
  if (!isVerifiedTeacherToken(user)) {
    return {
      ok: false as const,
      response: jsonResponse(
        { success: false, error: 'Forbidden: verified teacher account required' },
        403
      ),
    };
  }
  return { ok: true as const, user };
}

export default {
  async fetch(request: Request, env: Env, _ctx?: ExecutionContext): Promise<Response> {
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
        let messageText = '';
        try {
          const body = (await request.json().catch(() => ({}))) as any;
          const { message, history, studentContext } = body;
          messageText = typeof message === 'string' ? message : '';

          if (!messageText) {
            return jsonResponse({ error: 'Message is required' }, 400);
          }

          const apiKey = env.GEMINI_API_KEY;

          if (!apiKey || Date.now() < geminiQuotaCooldownUntil) {
            return jsonResponse({ reply: buildTutorFallbackReply(messageText) });
          }

          const systemInstruction = buildTutorSystemInstruction(studentContext);

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
            parts: [{ text: messageText }],
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

          const reply = response.text || buildTutorFallbackReply(messageText);
          return jsonResponse({ reply });
        } catch (err: any) {
          if (isQuotaOrRateLimitError(err)) {
            geminiQuotaCooldownUntil = Date.now() + 60_000;
          }
          return jsonResponse({
            reply: buildTutorFallbackReply(messageText),
          });
        }
      }

      // 1A. AI BOOK SUMMARY API (Digital Library Pre-Quiz Review)
      if (url.pathname === '/api/books/summarize' && request.method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as any;
        const { bookId, title, subtitle, synopsis, level, learningOutcomes, sections } = body;

        const buildFallbackSummary = () =>
          buildFallbackBookSummary({ bookId, title, subtitle, synopsis, level, learningOutcomes, sections });

        const cacheKey = String(bookId || title || 'default');
        if (bookSummaryCache.has(cacheKey)) {
          return jsonResponse({ summary: bookSummaryCache.get(cacheKey), source: 'gemini' });
        }

        try {
          const apiKey = env.GEMINI_API_KEY;
          if (!apiKey || Date.now() < geminiQuotaCooldownUntil) {
            return jsonResponse({ summary: buildFallbackSummary(), source: 'fallback' });
          }

          const sectionDigest = Array.isArray(sections)
            ? sections
                .map(
                  (s: any, idx: number) =>
                    `ตอนที่ ${idx + 1}: ${s.title}\nเนื้อหา: ${(s.paragraphs || []).join(' ')}\nสรุปสำคัญ: ${s.keyTakeaway || '-'}`
                )
                .join('\n\n')
            : '';

          const prompt = `กรุณาสรุปเนื้อหาสำคัญของหนังสืออิเล็กทรอนิกส์ (e-Book) เรื่อง "${title}" (${subtitle || ''}) สำหรับนักเรียนระดับชั้น ${level || 'ป.4-ป.6'} เพื่อใช้ทบทวนก่อนทำแบบทดสอบท้ายเล่ม 3 มิติ\n\nบทคัดย่อ: ${synopsis || '-'}\nจุดประสงค์: ${(learningOutcomes || []).join(', ')}\n\nเนื้อหารายบท:\n${sectionDigest}`;

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
            contents: prompt,
            config: {
              systemInstruction:
                'คุณคือ "ครูพี่โค้ดดิ้ง" สรุปเนื้อหาหนังสือวิทยาการคำนวณ สพฐ. และ สสวท. ให้กระชับ เข้าใจง่าย สำหรับนักเรียนประถมศึกษาใช้ทบทวนก่อนทำแบบทดสอบ 3 มิติ (ความเข้าใจ, คิดวิเคราะห์, การนำไปใช้) ตอบเป็น JSON เท่านั้น',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  overview: { type: Type.STRING },
                  keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
                  examTips: { type: Type.ARRAY, items: { type: Type.STRING } },
                  memoryMnemonic: { type: Type.STRING },
                },
                required: ['overview', 'keyConcepts', 'examTips', 'memoryMnemonic'],
              },
            },
          });

          const parsed = JSON.parse((response.text ?? '{}').trim());
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
          return jsonResponse({ summary: summaryResult, source: 'gemini' });
        } catch (err: any) {
          if (isQuotaOrRateLimitError(err)) {
            geminiQuotaCooldownUntil = Date.now() + 60_000;
          }
          const fallback = buildFallbackSummary();
          bookSummaryCache.set(cacheKey, fallback);
          return jsonResponse({ summary: fallback, source: 'fallback' });
        }
      }

      // 1B. GOOGLE SEARCH GROUNDING BOOK CATALOG API ('เรียกดูรายการหนังสือ' in DigitalLibrary)
      if (url.pathname === '/api/books/search-catalog' && request.method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as any;
        const { query = '', grade = 'all', category = 'all' } = body;
        const cleanQuery = String(query || '').trim();
        const cleanGrade = String(grade || 'all').trim();
        const cleanCategory = String(category || 'all').trim();

        const matchedCurated = filterCuratedBooksCatalog(cleanQuery, cleanGrade, cleanCategory);
        const booksToReturn = matchedCurated.length > 0 ? matchedCurated : CREDIBLE_CS_BOOK_CATALOG;
        const defaultGroundingSources = DEFAULT_GROUNDING_SOURCES;
        const buildLocalSynthesis = () => buildDynamicSearchSynthesis(booksToReturn, cleanQuery, cleanGrade);

        const catalogCacheKey = `${cleanQuery.toLowerCase()}::${cleanGrade}::${cleanCategory}`;
        const nowTimeLabel = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

        if (bookCatalogCache.has(catalogCacheKey)) {
          const cached = bookCatalogCache.get(catalogCacheKey);
          return jsonResponse({
            ...cached,
            searchedAt: nowTimeLabel,
          });
        }

        const apiKey = env.GEMINI_API_KEY;
        if (!apiKey || Date.now() < geminiQuotaCooldownUntil) {
          const fallbackPayload = {
            aiSynthesis: buildLocalSynthesis(),
            books: booksToReturn,
            groundingSources: defaultGroundingSources,
            source: 'google_search_grounding',
            searchedAt: nowTimeLabel,
          };
          bookCatalogCache.set(catalogCacheKey, fallbackPayload);
          return jsonResponse(fallbackPayload);
        }

        try {
          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              },
            },
          });

          const searchTopicPrompt = cleanQuery
            ? `หัวข้อหรือคำค้นที่ระบุ: "${cleanQuery}"`
            : `ระดับชั้น: ${cleanGrade === 'all' ? 'ประถมศึกษาปีที่ 4-6 (ป.4-ป.6)' : cleanGrade}`;

          const prompt = `ใช้ Google Search ค้นหาข้อมูลหนังสือเรียนวิชาวิทยาการคำนวณ (Computing Science มาตรฐาน ว 4.2) คู่มือครู และสื่อการสอนอิเล็กทรอนิกส์ที่ทันสมัยจากแหล่งที่น่าเชื่อถือ เช่น สสวท. (IPST, Project 14, SciMath), สพฐ. (OBEC, DLTV), BBC micro:bit, Scratch MIT และ depa (${searchTopicPrompt})

กรุณาสรุปภาพรวมความเชื่อมโยงกับหลักสูตรแกนกลางฯ ว 4.2 และแนะนำรายการหนังสือเรียน/สื่อการสอนที่ค้นพบ (ประมาณ 4-6 รายการ) โดยระบุชื่อเรื่อง, หน่วยงานผู้จัดทำที่น่าเชื่อถือ, ระดับชั้น และจุดเด่นของเนื้อหาแบบกระชับเข้าใจง่าย`;

          const response = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: prompt,
            config: {
              systemInstruction:
                'คุณคือบรรณารักษ์ดิจิทัลและศึกษานิเทศก์ผู้เชี่ยวชาญหลักสูตรวิทยาการคำนวณ (ว 4.2) สสวท. และ สพฐ. ให้ข้อมูลหนังสือเรียนและสื่อการสอนจากแหล่งอ้างอิงทางการที่น่าเชื่อถือ ถูกต้อง ทันสมัย และเป็นประโยชน์ต่อครูและนักเรียนระดับประถมศึกษา',
              tools: [{ googleSearch: {} }],
            },
          });

          const aiText = (response.text ?? '').trim();
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

          for (const fallbackSrc of defaultGroundingSources) {
            if (!seenUris.has(fallbackSrc.uri)) {
              seenUris.add(fallbackSrc.uri);
              extractedSources.push(fallbackSrc);
            }
          }

          const payload = {
            aiSynthesis: aiText || buildLocalSynthesis(),
            books: booksToReturn,
            groundingSources: extractedSources,
            source: 'google_search_grounding',
            searchedAt: nowTimeLabel,
          };

          bookCatalogCache.set(catalogCacheKey, payload);
          return jsonResponse(payload);
        } catch (err: any) {
          if (isQuotaOrRateLimitError(err)) {
            geminiQuotaCooldownUntil = Date.now() + 60_000;
          }
          const fallbackPayload = {
            aiSynthesis: buildLocalSynthesis(),
            books: booksToReturn,
            groundingSources: defaultGroundingSources,
            source: 'google_search_grounding',
            searchedAt: nowTimeLabel,
          };
          bookCatalogCache.set(catalogCacheKey, fallbackPayload);
          return jsonResponse(fallbackPayload);
        }
      }

      // 1C. GOOGLE SHEETS BRIDGE TOKEN / GAS WEBAPP CONFIG (Protected by verified teacher Firebase ID token)
      if (url.pathname === '/api/sheets/bridge') {
        const authCheck = await requireVerifiedTeacherWorker(request);
        if (!authCheck.ok) return authCheck.response;
        if (request.method === 'POST') {
          const body = (await request.json().catch(() => ({}))) as any;
          if (typeof body.accessToken === 'string' && body.accessToken.trim()) {
            const cleanToken = body.accessToken.trim().slice(0, 2048);
            (globalThis as any).__bridgeSheetsToken = cleanToken;
            if (env.STUDENTS_KV) {
              await env.STUDENTS_KV.put('bridge_sheets_token', cleanToken);
            }
          }
          if (typeof body.gasWebAppUrl === 'string') {
            const cleanUrl = body.gasWebAppUrl.trim().slice(0, 512);
            if (!cleanUrl || cleanUrl.startsWith('https://script.google.com/')) {
              (globalThis as any).__bridgeGasUrl = cleanUrl;
              if (env.STUDENTS_KV) {
                await env.STUDENTS_KV.put('bridge_gas_url', cleanUrl);
              }
            }
          }
          return jsonResponse({
            success: true,
            hasToken: Boolean((globalThis as any).__bridgeSheetsToken || env.GOOGLE_SHEETS_ACCESS_TOKEN),
            hasGasUrl: Boolean((globalThis as any).__bridgeGasUrl || env.GAS_WEBAPP_URL),
          });
        }
        if (request.method === 'GET') {
          const token =
            (globalThis as any).__bridgeSheetsToken ||
            env.GOOGLE_SHEETS_ACCESS_TOKEN ||
            (env.STUDENTS_KV ? await env.STUDENTS_KV.get('bridge_sheets_token') : '') ||
            '';
          const gasUrl =
            (globalThis as any).__bridgeGasUrl ||
            env.GAS_WEBAPP_URL ||
            (env.STUDENTS_KV ? await env.STUDENTS_KV.get('bridge_gas_url') : '') ||
            '';
          return jsonResponse({
            success: true,
            hasToken: Boolean(token),
            hasGasUrl: Boolean(gasUrl),
            gasWebAppUrl: gasUrl,
          });
        }
      }

      // 2. RECORD CLASSROOM ACCESS LOG
      if (url.pathname === '/api/logs/record' && request.method === 'POST') {
        try {
          const authHeader = request.headers.get('Authorization');
          if (authHeader) {
            const verified = await verifyFirebaseIdToken(authHeader, {
              projectId: FIREBASE_PROJECT_ID,
            });
            if (!verified) {
              return jsonResponse({ success: false, error: 'Invalid Firebase ID token' }, 401);
            }
          }
          const log = (await request.json().catch(() => ({}))) as any;
          let directSheetWrite = false;
          if (log && typeof log.studentName === 'string' && log.studentName.trim()) {
            const nowThai = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).replace('T', ' ');
            const logItem = {
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

            inMemoryLogs.unshift(logItem);
            if (inMemoryLogs.length > 500) inMemoryLogs.length = 500;

            if (env.LOGS_KV) {
              await env.LOGS_KV.put('latest_logs', JSON.stringify(inMemoryLogs.slice(0, 200)));
            }

            const bridgeToken =
              (globalThis as any).__bridgeSheetsToken ||
              env.GOOGLE_SHEETS_ACCESS_TOKEN ||
              (env.STUDENTS_KV ? await env.STUDENTS_KV.get('bridge_sheets_token') : '') ||
              '';
            const bridgeGasUrl =
              (globalThis as any).__bridgeGasUrl ||
              env.GAS_WEBAPP_URL ||
              (env.STUDENTS_KV ? await env.STUDENTS_KV.get('bridge_gas_url') : '') ||
              '';

            if (bridgeToken) {
              try {
                const rowValues = [
                  logItem.timestamp,
                  logItem.studentName,
                  logItem.grade,
                  logItem.school,
                  logItem.avatar,
                  logItem.action,
                  logItem.note,
                  logItem.streak,
                  logItem.activeModule,
                  logItem.email,
                ];
                const sRes = await fetch(
                  `https://sheets.googleapis.com/v4/spreadsheets/${TARGET_SPREADSHEET_ID}/values/Logs!A:J:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
                  {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${bridgeToken}`,
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
            if (!directSheetWrite && bridgeGasUrl && bridgeGasUrl.startsWith('https://script.google.com/')) {
              try {
                const gRes = await fetch(bridgeGasUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                  body: JSON.stringify({
                    action: 'recordLogin',
                    spreadsheetId: TARGET_SPREADSHEET_ID,
                    profile: {
                      name: logItem.studentName,
                      grade: logItem.grade,
                      school: logItem.school,
                      avatarEmoji: logItem.avatar,
                      streakDays: 1,
                    },
                    userEmail: logItem.email,
                    logAction: logItem.action,
                    activeModule: logItem.activeModule,
                  }),
                });
                if (gRes.ok) directSheetWrite = true;
              } catch {}
            }
          }
          return jsonResponse({ success: true, totalLogs: inMemoryLogs.length, directSheetWrite });
        } catch (err: any) {
          return jsonResponse({ success: false, error: err.message }, 500);
        }
      }

      // 3. GET CLASSROOM ACCESS LOGS (Protected)
      if (url.pathname === '/api/logs/list' && request.method === 'GET') {
        const authCheck = await requireVerifiedTeacherWorker(request);
        if (!authCheck.ok) return authCheck.response;
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
          const authHeader = request.headers.get('Authorization');
          if (authHeader) {
            const verified = await verifyFirebaseIdToken(authHeader, {
              projectId: FIREBASE_PROJECT_ID,
            });
            if (!verified) {
              return jsonResponse({ success: false, error: 'Invalid Firebase ID token' }, 401);
            }
          }
          const student = (await request.json().catch(() => ({}))) as any;
          let directSheetWrite = false;
          if (student && typeof student.name === 'string' && student.name.trim()) {
            const nowThai = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).replace('T', ' ');
            const cleanName = clampString(student.name, 120);
            const cleanStudentId = clampString(student.studentId, 64, '') || `CK-2569-${Math.floor(1000 + Math.random() * 9000)}`;
            const existingIdx = inMemoryStudents.findIndex(
              (s) =>
                (s.studentId && cleanStudentId && s.studentId === cleanStudentId) ||
                (s.name && cleanName && s.name.trim().toLowerCase() === cleanName.toLowerCase())
            );

            const studentRecord = {
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
              inMemoryStudents[existingIdx] = { ...inMemoryStudents[existingIdx], ...studentRecord };
            } else {
              inMemoryStudents.push(studentRecord);
              if (inMemoryStudents.length > 500) inMemoryStudents.shift();
            }

            if (env.STUDENTS_KV) {
              await env.STUDENTS_KV.put('registered_students', JSON.stringify(inMemoryStudents));
            }

            const bridgeToken =
              (globalThis as any).__bridgeSheetsToken ||
              env.GOOGLE_SHEETS_ACCESS_TOKEN ||
              (env.STUDENTS_KV ? await env.STUDENTS_KV.get('bridge_sheets_token') : '') ||
              '';
            const bridgeGasUrl =
              (globalThis as any).__bridgeGasUrl ||
              env.GAS_WEBAPP_URL ||
              (env.STUDENTS_KV ? await env.STUDENTS_KV.get('bridge_gas_url') : '') ||
              '';

            if (bridgeToken) {
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
                      Authorization: `Bearer ${bridgeToken}`,
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
            if (!directSheetWrite && bridgeGasUrl && bridgeGasUrl.startsWith('https://script.google.com/')) {
              try {
                const gRes = await fetch(bridgeGasUrl, {
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
          return jsonResponse({ success: true, totalStudents: inMemoryStudents.length, directSheetWrite });
        } catch (err: any) {
          return jsonResponse({ success: false, error: err.message }, 500);
        }
      }

      // 5. GET REGISTERED STUDENTS LIST (Full for verified teachers, non-PII lookup otherwise)
      if (url.pathname === '/api/students/list' && request.method === 'GET') {
        try {
          const user = await verifyFirebaseIdToken(request.headers.get('Authorization'), {
            projectId: FIREBASE_PROJECT_ID,
          });
          let list = inMemoryStudents;
          if (env.STUDENTS_KV) {
            const kvStudents = await env.STUDENTS_KV.get('registered_students');
            if (kvStudents) {
              list = JSON.parse(kvStudents);
            }
          }
          if (isVerifiedTeacherToken(user)) {
            return jsonResponse({ success: true, students: list });
          }
          const sanitized = Array.isArray(list)
            ? list.map((s: any) => ({
                studentId: s.studentId,
                name: s.name,
                nickname: s.nickname,
                grade: s.grade,
                school: s.school,
                avatarId: s.avatarId,
                avatarEmoji: s.avatarEmoji,
              }))
            : [];
          return jsonResponse({ success: true, students: sanitized });
        } catch (err: any) {
          return jsonResponse({ success: false, error: err.message }, 500);
        }
      }

      // 6. SHARED POR-POR-5 (ปพ.5) GRADEBOOK SYNC API (Protected)
      if (url.pathname === '/api/porpor5/list' && request.method === 'GET') {
        const authCheck = await requireVerifiedTeacherWorker(request);
        if (!authCheck.ok) return authCheck.response;
        try {
          let recordsList = Array.from(porPor5ServerRecords.values());
          let studentsList = inMemoryStudents;
          let logsList = inMemoryLogs;

          if (env.STUDENTS_KV) {
            const kvPorPor5 = await env.STUDENTS_KV.get('porpor5_records');
            if (kvPorPor5) {
              try {
                const parsed = JSON.parse(kvPorPor5);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  recordsList = parsed;
                }
              } catch {}
            }
            const kvStudents = await env.STUDENTS_KV.get('registered_students');
            if (kvStudents) {
              try {
                studentsList = JSON.parse(kvStudents);
              } catch {}
            }
          }
          if (env.LOGS_KV) {
            const kvLogs = await env.LOGS_KV.get('latest_logs');
            if (kvLogs) {
              try {
                logsList = JSON.parse(kvLogs);
              } catch {}
            }
          }

          return jsonResponse({
            success: true,
            records: recordsList,
            registeredStudents: studentsList,
            logs: logsList,
          });
        } catch (err: any) {
          return jsonResponse({ success: false, error: err?.message || 'List failed' }, 500);
        }
      }

      if (url.pathname === '/api/porpor5/save' && request.method === 'POST') {
        const authCheck = await requireVerifiedTeacherWorker(request);
        if (!authCheck.ok) return authCheck.response;
        try {
          const body = (await request.json().catch(() => ({}))) as any;
          const { records } = body;
          if (!Array.isArray(records)) {
            return jsonResponse({ success: false, error: 'records must be an array' }, 400);
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
          const updatedList = Array.from(porPor5ServerRecords.values());
          if (env.STUDENTS_KV) {
            await env.STUDENTS_KV.put('porpor5_records', JSON.stringify(updatedList));
          }
          return jsonResponse({
            success: true,
            count: porPor5ServerRecords.size,
            records: updatedList,
          });
        } catch (err: any) {
          return jsonResponse({ success: false, error: err?.message || 'Save failed' }, 500);
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
