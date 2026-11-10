# 🚀 คู่มือการนำแอปพลิเคชัน Coder Kids ไปเผยแพร่บน Cloudflare (100% ฟรี ไม่ต้องใช้บัตรเครดิต)

แอปพลิเคชัน **Coder Kids โปรแกรมเมอร์รุ่นจิ๋ว** ได้รับการเตรียมความพร้อมและปรับโครงสร้างแบบ **Dual-Runtime** ให้สามารถรันได้ทั้งบน Local/Dev Server (`server.ts` บน Express) และบน **Cloudflare Workers / Cloudflare Pages** โดย:
1. **เก็บความลับ API Key ไว้ฝั่งเซิร์ฟเวอร์ 100%**: ไม่มีการเปิดเผย `GEMINI_API_KEY` ในโค้ด Frontend เด็ดขาด
2. **ไม่ต้องผูกบัตรเครดิตหรือ Google Cloud Billing**: Cloudflare มี Free Tier ให้ใช้งานฟรี 100,000 Requests/วัน ตลอดไป
3. **รองรับ Responsive & Mobile 100%**: หน้าเว็บและบทเรียนทำงานได้บนสมาร์ตโฟน แท็บเล็ต และคอมพิวเตอร์
4. **รักษาฟีเจอร์เดิมครบถ้วน**: บล็อกโค้ดดิ้ง Scratch, บอร์ดเสมือน Micro:bit V2, ระบบสะสมแต้ม, Visual Syllabus Roadmap, AI Tutor Chatbot ฯลฯ

---

## 🛠️ วิธีที่ 1: Deploy ผ่าน Wrangler CLI (วิธีที่ง่ายและเร็วที่สุด)

### ขั้นตอนที่ 1: ตรวจสอบและ Build แอปพลิเคชัน
เปิด Terminal หรือ Command Line ในโฟลเดอร์โปรเจกต์ แล้วรันคำสั่ง:
```bash
npm run build
```
*(ระบบจะคอมไพล์โค้ด Frontend ทั้งหมดลงในโฟลเดอร์ `dist/`)*

### ขั้นตอนที่ 2: ติดตั้ง Wrangler และเข้าสู่ระบบ Cloudflare
หากยังไม่เคยติดตั้ง Wrangler ให้ล็อกอินเข้าสู่บัญชี Cloudflare (สมัครฟรีได้ที่ [cloudflare.com](https://dash.cloudflare.com/sign-up)):
```bash
npx wrangler login
```
*(เบราว์เซอร์จะเปิดหน้าต่างขึ้นมา ให้คลิก "Allow" เพื่อเชื่อมต่อ)*

### ขั้นตอนที่ 3: ตั้งค่ารหัสผ่านลับ GEMINI_API_KEY (Server-side Secret)
นำ API Key ของคุณมากำหนดเป็น Secret ปลอดภัยบน Cloudflare Worker:
```bash
npx wrangler secret put GEMINI_API_KEY
```
*(ระบบจะถามค่า ให้วางคีย์ Gemini API ของคุณลงไปแล้วกด Enter)*

### ขั้นตอนที่ 4: สั่ง Deploy ขึ้น Cloudflare Workers ทันที!
```bash
npx wrangler deploy
```
หรือรันผ่านคำสั่ง:
```bash
npm run deploy:cloudflare
```

🎉 **เสร็จเรียบร้อย!** แอปพลิเคชันได้รับการ Deploy ที่ URL:
`https://coderkids.nusornon.workers.dev`

คุณสามารถนำลิงก์นี้ไปให้นักเรียนและคุณครูเปิดใช้งานได้ทันทีทั่วโลก โดยรองรับทั้งสมาร์ตโฟน แท็บเล็ต และคอมพิวเตอร์ 100%!

---

## 🌐 วิธีที่ 2: Deploy ผ่าน Cloudflare Pages (ผ่าน GitHub)

หากคุณนำโปรเจกต์นี้ขึ้น GitHub สามารถตั้งค่า Deploy อัตโนมัติผ่าน Cloudflare Dashboard ได้เลย:

1. ไปที่ **Cloudflare Dashboard** -> เมนู **Workers & Pages** -> คลิก **Create Application** -> เลือกแท็บ **Pages**
2. เลือก **Connect to Git** แล้วเลือก Repository ของโปรเจกต์นี้
3. ตั้งค่าการ Build:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. ตั้งค่า **Environment Variables**:
   - เพิ่มตัวแปรชื่อ `GEMINI_API_KEY` และใส่ API Key ของคุณ (แนะนำให้เลือกประเภทเป็น *Secret*)
5. คลิก **Save and Deploy**
6. Cloudflare Pages จะรันโค้ดในโฟลเดอร์ `functions/api/` เพื่อเป็น Edge API และเสิร์ฟหน้าเว็บจาก `dist/` ให้อัตโนมัติ

---

## 📂 โครงสร้างไฟล์ที่ถูกสร้างเพื่อรองรับ Cloudflare

| ไฟล์ | หน้าที่ |
| :--- | :--- |
| `worker/index.ts` | Backend Entry Point ของ Cloudflare Worker (จัดการ `/api/tutor`, `/api/logs/*`, `/api/students/*` และเสิร์ฟ Static Assets) |
| `wrangler.jsonc` | ไฟล์คอนฟิกหลักของ Cloudflare Workers กำหนด Single Page Application (SPA) routing |
| `wrangler.toml` | ไฟล์คอนฟิกรองรับเครื่องมือ Wrangler รูปแบบ TOML |
| `functions/api/[[catchall]].ts` | Edge Functions อัตโนมัติสำหรับ Cloudflare Pages |
| `server.ts` | Backend Express เดิมสำหรับรันบน AI Studio Dev Container (ไม่กระทบการทำงานเดิม) |

---

## 🔒 ความปลอดภัย (Security Guarantee)
- โค้ด Frontend ของเบราว์เซอร์จะเรียกไปยัง `/api/tutor` เท่านั้น
- ตัว Worker / Edge Function บน Cloudflare จะอ่าน `env.GEMINI_API_KEY` จากระบบจัดการ Secret ของ Cloudflare และยิงไปประมวลผลที่ Google Generative Language API
- ผู้ใช้งานทั่วไปจะไม่สามารถ Inspect ดู API Key หรือ Token ได้อย่างเด็ดขาด
