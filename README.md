# Astra - Horoscope & Fortune Web App

[![Node.js](https://img.shields.io/badge/Node.js-v18-green)](https://nodejs.org/) 
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE) 
[![Version](https://img.shields.io/badge/Version-1.0.0-orange)](https://github.com/username/astra)

**Astra** เป็นเว็บแอปพลิเคชันสำหรับดูดวงและเช็คโชคชะตาแบบออนไลน์ มีทั้งหมด 4 หมวดหมู่หลัก:

1. **Tarot Reading** - การอ่านไพ่ทาโรต์  
2. **Western Astrology** - ดูดวงแบบโหราศาสตร์ตะวันตก  
3. **Wheel of Fortune** - หมุนวงล้อเสี่ยงโชค  
4. **Stellar Bar** - แชทกับบาร์เทนเดอร์ AI ในธีมดวงดาว

---

## 🔧 เทคโนโลยี

**Frontend:**  
- HTML, CSS, JavaScript  

**Backend:**  
- Node.js, Express  
- dotenv สำหรับจัดการ environment variables  

---

**ทดลองใช้:**  
https://astrax-blue.vercel.app/

---


## 🚀 การติดตั้งและใช้งาน

1. **Clone โปรเจกต์**  
```bash
git clone https://github.com/username/astra.git
cd astra/server

2.ติดตั้ง dependencies ของ backend
npm install

3.สร้างไฟล์ .env
เพิ่ม API Key สำหรับแต่ละบริการ เช่น Gemini หรือ Geoapify
GEMINI_API_KEY=your_gemini_key
GEOAPIFY_API_KEY=your_geoapify_key

4.รัน backend
npm run dev

5.เปิด frontend
เปิดไฟล์ index.html

หมายเหตุ
อย่าเผยแพร่ .env หรือ API Key ของคุณใน GitHub
เว็บนี้เป็นโปรเจกต์ตัวอย่างเพื่อการศึกษาและทดลองใช้งาน




