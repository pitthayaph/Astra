import express from "express";
import { askGemini } from "../services/geminiService.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// สำหรับ ES module เพื่อใช้ __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// path แบบ relative จะทำงานได้ทุกเครื่อง
const promptsPath = path.join(__dirname, "../data/prompts.json");
const promptsData = JSON.parse(fs.readFileSync(promptsPath, "utf8"));

const router = express.Router();

router.post("/", async (req, res) => {
  const { userMessage, options } = req.body;

  if (!options?.cards?.selectedCardNames || !options?.cards?.selectedCardNumbers) {
    return res.status(400).json({ error: "Missing card data" });
  }

  const { selectedCardNames, selectedCardNumbers } = options.cards;

  const tarotPrompt = promptsData.tarot;
  const promptText = `
${tarotPrompt.description}

${tarotPrompt.instructions.join("\n")}

ไพ่ที่ได้คือ: ${selectedCardNames.join(", ")} (หมายเลข: ${selectedCardNumbers.join(", ")})
คำถามของผู้ใช้คือ: "${userMessage}"
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
