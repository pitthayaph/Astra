import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { rateLimitMiddleware, apiLimiter } from "./middleware/rateLimiter.js";

import tarotRoutes from "./routes/tarot.js";
import astrologyRoutes from "./routes/astrology.js";
import bartenderRoutes from "./routes/bartender.js";
import geoRoutes from "./routes/geo.js";
import backgroundRoutes from "./routes/background.js";

const app = express();
app.use(express.json());

// ✅ แก้ CORS config ให้รองรับ whitelist
app.use(cors({
  origin: [
    'https://astrax-blue.vercel.app',
    'http://localhost:3000',  // สำหรับ development
    'http://localhost:5173',  // สำหรับ Vite
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesPath = path.join(__dirname, "images");
console.log("📁 Serving images from:", imagesPath);
app.use("/images", express.static(imagesPath));

// ✅ Rate Limiter ต้องอยู่ก่อน routes
app.use("/api", rateLimitMiddleware(apiLimiter));

app.use("/api/tarot", tarotRoutes);
app.use("/api/astrology", astrologyRoutes);
app.use("/api/bartender", bartenderRoutes);
app.use("/api/geo", geoRoutes);
app.use("/api/background", backgroundRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;