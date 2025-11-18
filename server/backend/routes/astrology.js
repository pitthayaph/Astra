import express from "express";
import { askGemini } from "../services/geminiService.js";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const promptsPath = path.join(__dirname, "../data/prompts.json");
const promptsData = JSON.parse(fs.readFileSync(promptsPath, "utf8"));

const router = express.Router();

// ✅ ฟังก์ชันแปลง current_sign (1-12) เป็นชื่อราศี
function getZodiacSign(signId) {
  const signs = {
    1: "Aries (เมษ)", 2: "Taurus (พฤษภ)", 3: "Gemini (เมถุน)", 4: "Cancer (กรกฎ)",
    5: "Leo (สิงห์)", 6: "Virgo (กันย์)", 7: "Libra (ตุล)", 8: "Scorpio (พิจิก)",
    9: "Sagittarius (ธนู)", 10: "Capricorn (มังกร)", 11: "Aquarius (กุมภ์)", 12: "Pisces (มีน)"
  };
  return signs[signId] || "Unknown";
}

// ✅ ฟังก์ชันแปลงข้อมูลดาวจาก API format เป็น array
function parsePlanetsData(apiOutput) {
  if (!apiOutput || !Array.isArray(apiOutput) || apiOutput.length === 0) {
    return null;
  }

  const planetsObj = apiOutput[1];
  if (!planetsObj) return null;

  const planets = [];
  
  for (const [name, data] of Object.entries(planetsObj)) {
    if (name === 'debug' || name === 'ayanamsa') continue;
    
    planets.push({
      name: name,
      full_degree: data.fullDegree,
      norm_degree: data.normDegree,
      speed: 0,
      is_retro: data.isRetro,
      sign_id: data.current_sign,
      sign: getZodiacSign(data.current_sign),
      house: data.house_number || null
    });
  }

  console.log("🌟 Parsed planets:", planets.length);
  return planets;
}

// ✅ ฟังก์ชันลบ markdown formatting ออก
function cleanMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')  // ลบ **bold**
    .replace(/\*(.*?)\*/g, '$1')       // ลบ *italic*
    .replace(/__(.*?)__/g, '$1')       // ลบ __underline__
    .replace(/_(.*?)_/g, '$1')         // ลบ _italic_
    .replace(/~~(.*?)~~/g, '$1')       // ลบ ~~strikethrough~~
    .replace(/`(.*?)`/g, '$1');        // ลบ `code`
}

// ✅ อัปเดตฟังก์ชัน getPlanetsData
async function getPlanetsData(birthData) {
  const ASTROLOGY_API_KEY = process.env.ASTROLOGY_API_KEY;

  const url = "https://json.freeastrologyapi.com/planets";
  
  const payload = {
    year: parseInt(birthData.year),
    month: parseInt(birthData.month),
    date: parseInt(birthData.day),
    hours: parseInt(birthData.hour),
    minutes: parseInt(birthData.minute),
    seconds: 0,
    latitude: parseFloat(birthData.lat),
    longitude: parseFloat(birthData.lon),
    timezone: 7,
    settings: {
      observation_point: "topocentric",
      ayanamsha: "lahiri"
    }
  };
  
  console.log("🔍 Payload to send:", JSON.stringify(payload, null, 2));
  
  if (isNaN(payload.year) || isNaN(payload.month) || isNaN(payload.date) ||
      isNaN(payload.hours) || isNaN(payload.minutes) ||
      isNaN(payload.latitude) || isNaN(payload.longitude)) {
    throw new Error("Invalid data: Some values are NaN");
  }
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ASTROLOGY_API_KEY
      },
      body: JSON.stringify(payload)
    });

    console.log("📡 Astrology API Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Astrology API Error Response:", errorText);
      throw new Error(`Astrology API error: ${response.status}`);
    }

    const data = await response.json();
    const planets = parsePlanetsData(data.output);
    
    if (!planets || planets.length === 0) {
      throw new Error("No planets data found in API response");
    }
    
    console.log("✅ Planets parsed successfully:", planets.length);
    return planets;
    
  } catch (error) {
    console.error("❌ Error fetching planets:", error);
    throw error;
  }
}

// ✅ ฟังก์ชันแปลงข้อมูลดาวเป็นข้อความแบบ plain text
function formatPlanetsData(planets) {
  if (!planets || planets.length === 0) {
    return "ไม่สามารถดึงข้อมูลดาวเคราะห์ได้";
  }
  
  let formatted = "ตำแหน่งดาวเคราะห์ในดวงชะตา\n\n";
  
  planets.forEach(planet => {
    let planetDesc = `${planet.name} อยู่ในราศี${planet.sign} ที่ ${planet.norm_degree.toFixed(2)} องศา`;
    
    if (planet.house) {
      planetDesc += ` ตกอยู่ในบ้านที่ ${planet.house}`;
    }
    
    if (planet.is_retro === "true") {
      planetDesc += ` และกำลังถอยหลัง (Retrograde)`;
    } else {
      planetDesc += ` เคลื่อนที่ปกติ`;
    }
    
    formatted += planetDesc + "\n\n";
  });
  
  return formatted;
}

// ✅ Main Route
router.post("/", async (req, res) => {
  console.log("📥 Received request body:", req.body);
  
  const { userMessage, options } = req.body;

  if (!userMessage) {
    return res.status(400).json({ error: "Missing userMessage" });
  }

  try {
    const birthData = {};
    
    const dateMatch = userMessage.match(/วันเกิด:\s*(\d+)\/(\d+)\/(\d+)/);
    if (dateMatch) {
      birthData.day = dateMatch[1];
      birthData.month = dateMatch[2];
      birthData.year = dateMatch[3];
    }
    
    const timeMatch = userMessage.match(/เวลาเกิด:\s*(\d+):(\d+)/);
    if (timeMatch) {
      birthData.hour = timeMatch[1];
      birthData.minute = timeMatch[2];
    }
    
    const latMatch = userMessage.match(/latitude\s+([-\d.]+)/);
    const lonMatch = userMessage.match(/longitude\s+([-\d.]+)/);
    if (latMatch) birthData.lat = latMatch[1];
    if (lonMatch) birthData.lon = lonMatch[1];

    console.log("📅 Parsed Birth Data:", birthData);

    if (!birthData.day || !birthData.month || !birthData.year || 
        !birthData.hour || !birthData.minute || 
        !birthData.lat || !birthData.lon) {
      return res.status(400).json({ 
        error: "ข้อมูลไม่ครบถ้วน",
        received: birthData
      });
    }

    let planets;
    let planetsText = "";
    
    try {
      planets = await getPlanetsData(birthData);
      planetsText = formatPlanetsData(planets);
      console.log("🌟 Planets formatted successfully");
    } catch (apiError) {
      console.warn("⚠️ Astrology API failed:", apiError.message);
      planetsText = "ไม่สามารถดึงข้อมูลดาวเคราะห์จาก API ได้ในขณะนี้";
    }

    // ✅ ดึง prompt จาก JSON
    const astrologyPrompt = promptsData.astrology;
    const interpretationGuide = planets 
      ? astrologyPrompt.interpretation_guide.with_planets 
      : astrologyPrompt.interpretation_guide.without_planets;

    const promptText = `
${astrologyPrompt.description}

${astrologyPrompt.instructions.join("\n")}

ข้อมูลผู้ใช้:
${userMessage}

${planetsText}

${interpretationGuide}
`;

    console.log("🤖 Calling Gemini API...");
    let reply = await askGemini(promptText);
    console.log("✅ Gemini response received");

    reply = cleanMarkdown(reply);
    
    res.json({ 
      reply,
      planetsData: planets || null,
      success: true
    });

  } catch (err) {
    console.error("❌ Astrology Error:", err);
    
    res.status(500).json({ 
      error: err.message,
      success: false
    });
  }
});

export default router;
