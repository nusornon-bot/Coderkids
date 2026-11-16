# 🚀 คู่มือการเผยแพร่ระบบ Coder Kids บน Cloudflare Workers (Free Tier - ไม่ต้องผูกบัตร Google Cloud Billing)

แอปพลิเคชัน **Coder Kids โปรแกรมเมอร์รุ่นจิ๋ว (ว 4.2 สพฐ. & สสวท.)** ได้รับการปรับแต่งโครงสร้างให้รองรับการรันบน **Cloudflare Workers (Static Assets + Serverless API)** และ **Cloudflare Pages** อย่างสมบูรณ์ โดยรักษาฟีเจอร์เดิมทั้งหมด 100%

---

## ✅ คุณสมบัติความพร้อมของระบบ (Deployment Checklist)

1. **รักษาฟีเจอร์และ UI เดิมครบ 100% (Preserve All Features & UI)**
   - บทเรียนหลัก 4 ก้าว (PDPA, การคิดเชิงคำนวณ & Flowchart, Scratch & Micro:bit V2, โครงงาน & เกียรติบัตร)
   - ห้องแล็บ & มินิเกม 21 ระบบ, คลังข้อสอบ O-NET 10 ชุด, โครงงาน STEM Project Hub & โมเดล 3D Micro:bit V2
   - คลังสื่อการเรียนรู้อิเล็กทรอนิกส์ (Digital Library) พร้อมปุ่ม **"เรียกดูรายการหนังสือ"** (Google Search Grounding) และแบบทดสอบท้ายเล่ม 3 มิติ
   - ศูนย์คุณครู ว 4.2 & บันทึก ปพ.5 และ ระบบรายงานผลสัมฤทธิ์ ปพ.5 ที่ซิงค์รายชื่อนักเรียนที่กำลังใช้งานจริงแบบเรียลไทม์
2. **เรียกใช้งาน Gemini API ฝั่ง Server เท่านั้น (Server-Side Only)**
   - ใช้ `@google/genai` SDK ใน `worker/index.ts` (และ `server.ts` สำหรับโหมดพัฒนา)
   - รองรับ `/api/tutor`, `/api/books/summarize`, และ `/api/books/search-catalog`
3. **ใช้ `GEMINI_API_KEY` เป็น Server-Side Secret (`env.GEMINI_API_KEY`)**
   - ไม่มีการฝังหรือส่งคีย์ API ออกไปที่โค้ดฝั่ง Frontend (`src/`) เด็ดขาด
4. **ไม่จำเป็นต้องเปิดใช้งาน Google Cloud Billing (Zero Billing Requirement)**
   - ทำงานบน **Cloudflare Workers Free Plan** (100,000 requests/day ฟรี)
   - ใช้คีย์ฟรีจาก [Google AI Studio](https://aistudio.google.com/apikey) ได้ทันที พร้อมระบบ **Smart Quota Cooldown & In-Memory Cache** ที่สลับไปใช้คลังความรู้มาตรฐาน สสวท./สพฐ. อัตโนมัติหากเกินโควตาฟรี (429 Rate Limit)
5. **รองรับการใช้งานบนมือถือและแท็บเล็ต (Mobile-Ready & PWA)**
   - รองรับ Responsive Breakpoints, Touch Controls, Mobile Drawer Menu และติดตั้งเป็นแอป PWA บน iOS/Android ได้ทันที

---

## 📁 ไฟล์ตั้งค่าสำหรับ Cloudflare Workers ที่เตรียมไว้ให้แล้ว

| ไฟล์ | หน้าที่การทำงาน |
| :--- | :--- |
| `wrangler.jsonc` / `wrangler.toml` | ไฟล์กำหนดค่าหลักของ Cloudflare Workers (`name: "coderkids"`, `main: "worker/index.ts"`, `assets: "./dist"`) |
| `worker/index.ts` | โค้ด Serverless Backend สำหรับ Cloudflare Workers รองรับทุก API Endpoints และ SPA Fallback |
| `functions/api/[[catchall]].ts` | ตัวเชื่อม API อัตโนมัติกรณีเลือก Deploy ผ่าน Cloudflare Pages |
| `.dev.vars.example` | ตัวอย่างไฟล์ตัวแปรความลับสำหรับการรันทดสอบ `wrangler dev` ในเครื่อง |
| `.env.example` | ตัวอย่างไฟล์ Environment Variables สำหรับการพัฒนาในเครื่อง |

---

## 🛠️ ขั้นตอนการ Deploy ขึ้น Cloudflare Workers (ทีละขั้นตอน)

### ขั้นตอนที่ 1: ติดตั้ง Dependencies และเข้าสู่ระบบ Cloudflare
เปิด Terminal ในโฟลเดอร์โปรเจกต์แล้วรันคำสั่ง:
```bash
npm install
npx wrangler login
```
*(ระบบจะเปิดเบราว์เซอร์ให้ล็อกอินด้วยบัญชี Cloudflare ฟรีของคุณ)*

---

### ขั้นตอนที่ 2: ตั้งค่า `GEMINI_API_KEY` เป็นความลับฝั่ง Server (Server-Side Secret)
ตั้งค่าคีย์ Gemini API ที่ได้จาก Google AI Studio (Free Tier) เก็บไว้ใน Cloudflare Secret Vault:
```bash
npx wrangler secret put GEMINI_API_KEY
```
เมื่อระบบถาม `Enter a secret value:` ให้วางคีย์ Gemini API ของคุณลงไปแล้วกด **Enter**
*(คีย์จะถูกเข้ารหัสบนเซิร์ฟเวอร์ของ Cloudflare และเข้าถึงได้เฉพาะใน `worker/index.ts` ผ่าน `env.GEMINI_API_KEY` เท่านั้น)*

---

### ขั้นตอนที่ 3: Build และ Deploy ขึ้น Cloudflare Workers
รันคำสั่งเดียวเพื่อสร้างไฟล์ Production (`dist/`) และอัปโหลดขึ้น Cloudflare Workers:
```bash
npm run deploy:cloudflare
```
หรือรันแยกทีละคำสั่ง:
```bash
npm run build
npx wrangler deploy
```

เมื่อเสร็จสิ้น คุณจะได้รับ URL สำหรับใช้งานจริง เช่น:
`https://coderkids.<your-subdomain>.workers.dev`

---

### ขั้นตอนที่ 4: (สำคัญสำหรับปุ่มล็อกอิน Google) เพิ่มโดเมนใน Firebase Authorized Domains
เพื่อให้ปุ่ม **"ล็อกอินด้วยบัญชี Google"** ทำงานได้บนโดเมน Cloudflare Workers ของคุณ:
1. ไปที่ [Firebase Console](https://console.firebase.google.com/) > เลือกโปรเจกต์ `gen-lang-client-0756366544`
2. ไปที่เมนู **Authentication** > แท็บ **Settings** > **Authorised domains**
3. กดปุ่ม **Add domain** แล้วเพิ่มโดเมน `coderkids.<your-subdomain>.workers.dev`
*(หมายเหตุ: นักเรียนและครูยังสามารถล็อกอินด้วย **รหัสประจำตัวนักเรียน** หรือ **รหัสคุณครู** ได้ทันทีโดยไม่ต้องตั้งค่าเพิ่ม)*

---

## 🔌 รายการ API Endpoints ที่รองรับบน Cloudflare Worker (`worker/index.ts`)

- `GET /api/health` — ตรวจสอบสถานะการทำงานของ Cloudflare Worker และการตั้งค่า `GEMINI_API_KEY`
- `POST /api/tutor` — ระบบครูพี่โค้ดดิ้ง AI Tutor ตอบคำถามวิชาวิทยาการคำนวณ (Server-side Gemini)
- `POST /api/books/summarize` — สรุปเนื้อหาสำคัญของ e-Book 3 มิติก่อนทำแบบทดสอบท้ายเล่ม
- `POST /api/books/search-catalog` — ค้นหาและเรียกดูรายการหนังสือเรียนวิทยาการคำนวณจากแหล่งอ้างอิงทางการด้วย Google Search Grounding
- `GET & POST /api/sheets/bridge` — สะพานเชื่อม Token/Google Apps Script สำหรับบันทึกข้อมูลลง Google Sheet (`1tWcZ4OaGZKOcX1PEvVNadyf9mM_igaKcF3ZV_b3L7Ng`)
- `POST /api/logs/record` & `GET /api/logs/list` — บันทึกและดึงประวัติการเข้าเรียน/การส่งงานแบบเรียลไทม์
- `POST /api/students/register` & `GET /api/students/list` — ลงทะเบียนและซิงค์รายชื่อนักเรียนที่เข้าใช้งานจริง
- `GET /api/porpor5/list` & `POST /api/porpor5/save` — ซิงค์คะแนนระหว่าง **ศูนย์คุณครู ว 4.2 & บันทึก ปพ.5** และ **ระบบรายงานผลสัมฤทธิ์ ปพ.5**

---

## 💻 การทดสอบโหมด Cloudflare Worker ในเครื่อง (Local Preview)

1. คัดลอกไฟล์ `.dev.vars.example` เป็น `.dev.vars` แล้วใส่ค่า `GEMINI_API_KEY`:
   ```bash
   cp .dev.vars.example .dev.vars
   ```
2. รันคำสั่งจำลอง Cloudflare Worker ในเครื่อง:
   ```bash
   npm run preview:cloudflare
   ```
