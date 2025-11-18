import fetch from "node-fetch";

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
];

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_BACKUP, 
].filter(Boolean);

export async function askGemini(promptText) {
  for (const key of GEMINI_KEYS) {
    console.log(`🔑 Using key: ${key.substring(0, 10)}...`);
    
    for (const model of MODELS) {
      const GEMINI_API = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      try {
        console.log(`🧠 Trying model: ${model}`);
        console.log("🤖 Prompt:", promptText.substring(0, 100) + "...");

        const url = `${GEMINI_API}?key=${key}`;
        console.log("🌐 URL:", url.replace(key, "***"));

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ 
              role: "user", 
              parts: [{ text: promptText }] 
            }],
          }),
        });

        console.log("📡 Response status:", response.status);

        const responseText = await response.text();
        console.log("📦 Raw response:", responseText);

        if (!response.ok) {
          console.warn(`⚠️ Model ${model} failed with status ${response.status}`);
          throw new Error(responseText);
        }

        const data = JSON.parse(responseText);
        if (data?.candidates?.length > 0) {
          const result = data.candidates[0].content.parts[0].text;
          console.log(`✅ Success using ${model} with key ${key.substring(0, 10)}...`);
          return result;
        }

        throw new Error("Gemini response missing candidates");

      } catch (error) {
        console.warn(`⚠️ Failed: ${model} / key ${key.substring(0, 10)}... -> ${error.message}`);
      }
    }
  }

  throw new Error("All models and keys failed (gemini ยังไม่พร้อมใช้งานในขณะนี้โปรดกลับมาใหม่ในอีก 24 ชม.)");
}
