// routes/background.js
import express from "express";
import fetch from "node-fetch";

const router = express.Router();
const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// ✅ รายการรูปสำรอง (ใส่ URL รูปของคุณเอง)
const FALLBACK_IMAGES = [
  "https://astra-one-coral.vercel.app/images/bg1.jpg",
  "https://astra-one-coral.vercel.app/images/bg2.jpg",
  "https://astra-one-coral.vercel.app/images/bg3.jpg",
  "https://astra-one-coral.vercel.app/images/bg4.jpg",
];

// ✅ ฟังก์ชันสุ่มรูป fallback
function getRandomFallbackImage() {
  return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
}

router.get("/", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?client_id=${ACCESS_KEY}&query=space,galaxy,stars,sky&orientation=landscape`
    );

    // ✅ ตรวจสอบ rate limit (HTTP 429) หรือ error อื่นๆ
    if (!response.ok) {
      if (response.status === 429) {
        console.warn("⚠️ Unsplash rate limit exceeded, using fallback image");
      } else {
        console.warn(`⚠️ Unsplash API error (${response.status}), using fallback image`);
      }
      
      // ส่งรูป fallback กลับไป
      return res.json({ 
        imageUrl: getRandomFallbackImage(),
        source: "fallback"
      });
    }

    // ✅ ตรวจสอบว่า response เป็น JSON จริง
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn("⚠️ Unexpected response format, using fallback image");
      return res.json({ 
        imageUrl: getRandomFallbackImage(),
        source: "fallback"
      });
    }

    const data = await response.json();
    
    // ✅ ตรวจสอบว่ามีข้อมูลรูปภาพหรือไม่
    if (!data.urls || !data.urls.full) {
      console.warn("⚠️ Invalid image data, using fallback image");
      return res.json({ 
        imageUrl: getRandomFallbackImage(),
        source: "fallback"
      });
    }

    res.json({ 
      imageUrl: data.urls.full,
      source: "unsplash"
    });

  } catch (err) {
    console.error("❌ Error fetching image:", err.message);
    
    // ✅ กรณี error ใดๆ ให้ใช้รูป fallback
    res.json({ 
      imageUrl: getRandomFallbackImage(),
      source: "fallback"
    });
  }
});

export default router;

