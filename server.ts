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
import {
  clampString,
  isQuotaOrRateLimitError,
  buildTutorSystemInstruction,
  buildTutorFallbackReply,
  buildFallbackBookSummary,
  CREDIBLE_CS_BOOK_CATALOG,
  DEFAULT_GROUNDING_SOURCES,
  filterCuratedBooksCatalog,
  buildDynamicSearchSynthesis,
} from './shared/aiAndCatalogService.ts';

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
      return res.json({ reply: buildTutorFallbackReply(message) });
    }

    const systemInstruction = buildTutorSystemInstruction(studentContext);

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

    const reply = response.text || buildTutorFallbackReply(message);
    return res.json({ reply });
  } catch (error: any) {
    if (isQuotaOrRateLimitError(error)) {
      geminiQuotaCooldownUntil = Date.now() + 60_000;
      console.log('[Gemini Tutor] Quota limit reached (429), serving built-in educational response.');
    } else {
      console.log('[Gemini Tutor] Using built-in educational response:', error?.message || 'fallback');
    }
    return res.json({ reply: buildTutorFallbackReply(req.body?.message || '') });
  }
});

// ------------------ AI BOOK SUMMARY API ROUTE (Digital Library Pre-Quiz Review) ------------------
app.post('/api/books/summarize', async (req, res) => {
  const { bookId, title, subtitle, synopsis, level, learningOutcomes, sections } = req.body || {};

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Book title is required' });
  }

  const buildFallbackSummary = () =>
    buildFallbackBookSummary({ bookId, title, subtitle, synopsis, level, learningOutcomes, sections });

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
app.post('/api/books/search-catalog', async (req, res) => {
  const { query = '', grade = 'all', category = 'all' } = req.body || {};
  const cleanQuery = String(query || '').trim();
  const cleanGrade = String(grade || 'all').trim();
  const cleanCategory = String(category || 'all').trim();

  const matchedCurated = filterCuratedBooksCatalog(cleanQuery, cleanGrade, cleanCategory);
  const booksToReturn = matchedCurated.length > 0 ? matchedCurated : CREDIBLE_CS_BOOK_CATALOG;
  const defaultGroundingSources = DEFAULT_GROUNDING_SOURCES;
  const buildLocalSynthesis = () => buildDynamicSearchSynthesis(booksToReturn, cleanQuery, cleanGrade);

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
      aiSynthesis: buildLocalSynthesis(),
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
      aiSynthesis: aiText || buildLocalSynthesis(),
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
      aiSynthesis: buildLocalSynthesis(),
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

// Safe same-origin proxy for reading Google Sheet tabs without browser CORS redirect failures
app.get('/api/sheets/read', async (req, res) => {
  const rawSpreadsheetId = typeof req.query.spreadsheetId === 'string' ? req.query.spreadsheetId.trim() : '';
  const spreadsheetId = rawSpreadsheetId || TARGET_SPREADSHEET_ID;
  const rawSheet = typeof req.query.sheet === 'string' ? req.query.sheet.trim() : '';
  const sheetTitle = clampString(rawSheet, 80, 'Students') || 'Students';
  const rawRange = typeof req.query.range === 'string' ? req.query.range.trim() : 'A1:M100';
  const safeRange = /^[A-Z]{1,3}\d{1,5}:[A-Z]{1,3}\d{1,5}$/.test(rawRange) ? rawRange : 'A1:M100';

  if (!/^[a-zA-Z0-9_-]{10,128}$/.test(spreadsheetId)) {
    return res.status(400).json({ ok: false, reason: 'invalid_spreadsheet_id', rows: [], csvText: '' });
  }

  // Strategy 1: If caller is a verified teacher and a bridged Sheets OAuth token is configured, query Sheets API v4
  if (bridgeSheetsAccessToken && req.headers.authorization) {
    try {
      const verifiedUser = await verifyFirebaseIdToken(req.headers.authorization, {
        projectId: FIREBASE_PROJECT_ID,
      });
      if (isVerifiedTeacherToken(verifiedUser)) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        try {
          const apiRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!${safeRange}`,
            {
              headers: { Authorization: `Bearer ${bridgeSheetsAccessToken}` },
              signal: controller.signal,
            }
          );
          if (apiRes.ok) {
            const data: any = await apiRes.json().catch(() => ({}));
            return res.json({
              ok: true,
              source: 'sheets_api',
              rows: Array.isArray(data.values) ? data.values : [],
              csvText: '',
            });
          }
        } finally {
          clearTimeout(timeoutId);
        }
      }
    } catch {
      // Fall through to public gviz lookup
    }
  }

  // Strategy 2: Server-side fetch of public Google Visualization CSV (avoids browser CORS redirect TypeError: Failed to fetch)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetTitle)}`;
    const gvizRes = await fetch(gvizUrl, {
      redirect: 'follow',
      signal: controller.signal,
    });
    const contentType = (gvizRes.headers.get('content-type') || '').toLowerCase();
    if (!gvizRes.ok || contentType.includes('text/html')) {
      return res.json({ ok: false, reason: 'auth_required', rows: [], csvText: '' });
    }
    const csvText = await gvizRes.text();
    const trimmedStart = csvText.trimStart().slice(0, 32).toLowerCase();
    if (trimmedStart.startsWith('<!doctype') || trimmedStart.startsWith('<html')) {
      return res.json({ ok: false, reason: 'auth_required', rows: [], csvText: '' });
    }
    return res.json({
      ok: true,
      source: 'public_gviz',
      rows: [],
      csvText,
    });
  } catch {
    return res.json({ ok: false, reason: 'unreachable', rows: [], csvText: '' });
  } finally {
    clearTimeout(timeoutId);
  }
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
    let verifiedUser: Awaited<ReturnType<typeof verifyFirebaseIdToken>> = null;
    if (req.headers.authorization) {
      verifiedUser = await verifyFirebaseIdToken(req.headers.authorization, {
        projectId: FIREBASE_PROJECT_ID,
      });
      if (!verifiedUser) {
        return res.status(401).json({ success: false, error: 'Invalid Firebase ID token' });
      }
    }
    const isTeacherReq = Boolean(verifiedUser && isVerifiedTeacherToken(verifiedUser));
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

      let safePoints = 65;
      const requestedPts = Number.isFinite(Number(student.points))
        ? Math.round(Number(student.points))
        : 65;

      if (existingIdx >= 0) {
        const existing = registeredStudentsList[existingIdx];
        if (
          !isTeacherReq &&
          existing.email &&
          verifiedUser?.email &&
          existing.email.toLowerCase() !== verifiedUser.email.toLowerCase()
        ) {
          return res.status(403).json({ success: false, error: 'Cannot overwrite another student record' });
        }
        const prevPts = Number(existing.points) || 65;
        safePoints = isTeacherReq
          ? Math.max(0, Math.min(100_000, requestedPts))
          : Math.max(0, Math.min(50_000, Math.min(prevPts + 250, requestedPts)));
      } else {
        safePoints = isTeacherReq
          ? Math.max(0, Math.min(100_000, requestedPts))
          : Math.max(0, Math.min(100, requestedPts));
      }

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
        email: verifiedUser?.email || clampString(student.email || student.contactEmail, 160, ''),
        points: safePoints,
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
    id: s.id,
    studentId: s.studentId,
    name: s.name,
    nickname: s.nickname,
    grade: s.grade,
    school: s.school,
    avatarId: s.avatarId,
    avatarEmoji: s.avatarEmoji,
    points: s.points,
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
