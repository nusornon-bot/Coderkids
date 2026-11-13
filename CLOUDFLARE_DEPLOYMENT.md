# 🚀 คู่มือการ Deploy แอปพลิเคชัน Coder Kids บน Cloudflare Workers (100% ฟรี ไม่ต้องผูกบัตร/ไม่ต้องเปิด Google Cloud Billing)

แอปพลิเคชัน **Coder Kids โปรแกรมเมอร์รุ่นจิ๋ว** ได้รับการออกแบบสถาปัตยกรรมแบบ **Dual-Runtime (Express + Cloudflare Workers Edge Runtime)** ที่พร้อมสำหรับการนำไปเผยแพร่บน **Cloudflare Workers** หรือ **Cloudflare Pages** ทันที โดยครบถ้วนตามข้อกำหนดทั้งหมด:

1. **รักษาฟีเจอร์และ UI เดิมครบ 100%**: บทเรียนทั้ง 4 โมดูล, ห้องปฏิบัติการ Scratch & Micro:bit, มินิเกมเขาวงกต 20 ด่าน, คลังโครงงาน STEM 10 โครงงาน, กราฟสรุปแต้ม 4 หมวดหมู่ (Points Summary Card), ระบบธีมอัตโนมัติ Day/Night Cycle และระบบเข้าสู่ระบบโรงเรียนอนุบาลนราธิวาส (`@anubalnara.ac.th`)
2. **ประมวลผล Gemini API ฝั่งเซิร์ฟเวอร์เท่านั้น (Server-Side Only)**: เรียกใช้ผ่าน `@google/genai` SDK ใน `worker/index.ts` และ `functions/api/[[catchall]].ts` ที่ Endpoint `/api/tutor`
3. **ใช้ `GEMINI_API_KEY` เป็น Server-Side Secret**: อ่านค่าจาก `env.GEMINI_API_KEY` บน Cloudflare Worker เท่านั้น
4. **ไม่เปิดเผย API Key ในโค้ด Frontend เด็ดขาด**: ไม่มีคีย์หรือการเรียก Gemini SDK ในโค้ดฝั่งเบราว์เซอร์ (`src/`)
5. **ไม่ต้องเปิดใช้งาน Google Cloud Billing**: รองรับการใช้งานร่วมกับ Cloudflare Workers Free Tier (ฟรี 100,000 requests/วัน) และใช้ Gemini Free Tier API Key ได้ทันที
6. **รองรับการใช้งานบนมือถือและแท็บเล็ต (Mobile-First & Responsive PWA)**: รองรับ Touch Controls, หน้าจอสมาร์ตโฟน/แท็บเล็ต และการติดตั้งเป็น Web App

---

## 📂 ไฟล์กำหนดค่าสำหรับ Cloudflare Workers ที่เตรียมไว้ให้แล้ว

| ไฟล์ | หน้าที่ |
| :--- | :--- |
| `wrangler.jsonc` | ไฟล์ตั้งค่าหลักของ Cloudflare Workers กำหนด `main: "worker/index.ts"` และ Static Assets (`./dist`) พร้อมโหมด `single-page-application` |
| `wrangler.toml` | ไฟล์ตั้งค่า Wrangler รูปแบบ TOML สำหรับผู้ที่ใช้งานผ่าน CLI มาตรฐาน |
| `worker/index.ts` | โค้ด Backend สำหรับ Cloudflare Workers จัดการ `/api/health`, `/api/tutor` (Gemini AI), `/api/logs/record`, `/api/logs/list`, `/api/students/register`, `/api/students/list` และเสิร์ฟไฟล์หน้าเว็บ SPA |
| `functions/api/[[catchall]].ts` | โค้ด Edge Functions สำหรับกรณีเลือก Deploy ผ่าน Cloudflare Pages |
| `.dev.vars.example` | ไฟล์ตัวอย่างสำหรับการตั้งค่า `GEMINI_API_KEY` เมื่อรันทดสอบ `npx wrangler dev` ในเครื่อง |
| `server.ts` | เซิร์ฟเวอร์ Express สำหรับรันในสภาพแวดล้อมพัฒนา (AI Studio Preview / Local Node.js) |

---

## 🛠️ ขั้นตอนการ Deploy ขึ้น Cloudflare Workers (ผ่าน Wrangler CLI)

### ขั้นตอนที่ 1: ติดตั้ง Dependencies และ Build โปรเจกต์
เปิด Terminal ในโฟลเดอร์โปรเจกต์ แล้วรันคำสั่ง:
```bash
npm install
npm run build
```
*(คำสั่งนี้จะสร้างไฟล์ Static Assets ของระบบทั้งหมดไว้ในโฟลเดอร์ `dist/`)*

### ขั้นตอนที่ 2: เข้าสู่ระบบบัญชี Cloudflare
รันคำสั่งด้านล่างเพื่อเชื่อมต่อกับบัญชี Cloudflare ของคุณ (สมัครใช้งานฟรี ไม่ต้องใช้บัตรเครดิต):
```bash
npx wrangler login
```

### ขั้นตอนที่ 3: ตั้งค่า `GEMINI_API_KEY` เป็น Server-Side Secret
ตั้งค่าคีย์ Gemini API เก็บไว้ในระบบความลับของ Cloudflare Worker:
```bash
npx wrangler secret put GEMINI_API_KEY
```
*(เมื่อระบบแสดงข้อความ `Enter a secret value:` ให้วางค่า `GEMINI_API_KEY` ของคุณแล้วกด Enter)*

### ขั้นตอนที่ 4: สั่ง Deploy ขึ้น Cloudflare Workers
รันคำสั่ง:
```bash
npm run deploy:cloudflare
```
*(หรือรัน `npx wrangler deploy` โดยตรง)*

เมื่อเสร็จสิ้น Terminal จะแสดง URL ของเว็บไซต์ เช่น:
- `https://coderkids.<ชื่อบัญชีของคุณ>.workers.dev`
- สามารถตรวจสอบสถานะ API ได้ที่ `https://coderkids.<ชื่อบัญชีของคุณ>.workers.dev/api/health`

---

## 🌐 ทางเลือกเสริม: การ Deploy ผ่าน Cloudflare Dashboard (GitHub Integration)

1. นำโค้ดขึ้น GitHub Repository ของคุณ
2. เข้าไปที่ **[Cloudflare Dashboard](https://dash.cloudflare.com/) ➔ Workers & Pages ➔ Create**
3. เชื่อมต่อกับ GitHub Repository ของโปรเจกต์นี้
4. ตั้งค่า Build Configuration:
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy` (สำหรับ Workers) หรือกำหนด **Build output directory:** `dist` (สำหรับ Pages)
5. ไปที่แท็บ **Settings ➔ Variables and Secrets** ของ Worker:
   - กด **Add** ➔ เลือกประเภท **Secret**
   - ตั้งชื่อตัวแปรเป็น `GEMINI_API_KEY` แล้วใส่ค่า API Key ของคุณ

---

## 💾 การเปิดใช้งานฐานข้อมูลถาวร Cloudflare KV (ตัวเลือกเสริม ไม่บังคับ)

โดยค่าเริ่มต้น `worker/index.ts` จะเก็บข้อมูลรายชื่อนักเรียนและประวัติการเข้าเรียนไว้ในหน่วยความจำของ Edge Worker พร้อมเชื่อมโยงกับ Google Sheets อัตโนมัติ หากต้องการผูก Cloudflare KV เพิ่มเติม สามารถรันคำสั่ง:
```bash
npx wrangler kv namespace create STUDENTS_KV
npx wrangler kv namespace create LOGS_KV
```
แล้วนำ `id` ที่ได้ไปใส่ใน `wrangler.jsonc` เพื่อเก็บข้อมูลลง KV แบบถาวรได้ทันที
