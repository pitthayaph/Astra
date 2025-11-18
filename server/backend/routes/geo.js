import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config(); // เรียก dotenv อีกครั้งเพื่อแน่ใจว่า env ถูกโหลด

const router = express.Router();
const API_KEY = process.env.GEOAPIFY_API_KEY; // แนะนำใส่ .env

router.get("/autocomplete", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing query" });

  const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${API_KEY}&limit=5&format=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Geoapify status ${response.status}`);
    const data = await response.json();

    // ส่งแค่ข้อมูลจำเป็น
    const results = data.results.map(place => ({
      formatted: place.formatted,
      lat: place.lat,
      lon: place.lon
    }));

    res.json({ results });
  } catch (err) {
    console.error("Geoapify error:", err);
    res.status(500).json({ error: "Geoapify failed" });
  }
});

export default router;
