import express from "express";
import { askGemini } from "../services/geminiService.js"; 
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// โหลด prompts.json
const promptsPath = path.join(__dirname, "../data/prompts.json");
const promptsData = JSON.parse(fs.readFileSync(promptsPath, "utf8"));
const bartenderPrompt = promptsData.bartender;

const router = express.Router();

router.post("/", async (req, res) => {
  const { userMessage, options } = req.body;
  if (!userMessage) {
    return res.status(400).json({ error: "Missing userMessage" });
  }

  const history = options?.history || [];
  let historyText = '';
  history.forEach(h => {
    historyText += `${h.role === 'user' ? 'ผู้ใช้' : 'Bartender'}: ${h.text}\n`;
  });

  // สร้าง prompt
  const promptText = `
${bartenderPrompt.description}
${bartenderPrompt.instructions.join("\n")}

ประวัติการสนทนา:
${historyText}

ผู้ใช้ถามล่าสุด:
${userMessage}
`;

  try {
    const reply = await askGemini(promptText);
    res.json({ reply });
  } catch (err) {
    console.error("Gemini API error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
