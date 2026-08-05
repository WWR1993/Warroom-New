// backend/server.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ======================================================
// ORIGINAL HEALTH CHECK (kept exactly as in your file)
// ======================================================
app.get("/", (req, res) => {
  res.json({ status: "online", message: "Warroom backend is running" });
});

// ======================================================
// LIVE INTEL SOURCES (UPDATED + RECONNECT SAFE)
// ======================================================

// U.S. State Department Travel Advisories (RSS)
const TRAVEL_ADVISORY_URL = "https://travel.state.gov/_res/rss/TWs.xml";

// Global News Feeds (RSS → JSON via rss2json)
const NEWS_FEEDS = [
  "https://rss.cnn.com/rss/edition_world.rss",
  "https://feeds.bbci.co.uk/news/world/rss.xml",
  "https://www.aljazeera.com/xml/rss/all.xml"
];

// Safe RSS fetch wrapper
async function safeRSS(url) {
  try {
    const res = await fetch(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`,
      { timeout: 8000 }
    );
    const data = await res.json();

    if (!data.items || !Array.isArray(data.items)) {
      console.log("RSS returned no items:", url);
      return [];
    }

    return data.items;
  } catch (err) {
    console.error("RSS fetch failed:", url, err);
    return [];
  }
}

// Normalize travel advisory items
function normalizeTravel(item) {
  let severity = "Medium";
  const title = item.title || "";
  if (title.includes("Level 4")) severity = "Critical";
  else if (title.includes("Level 3")) severity = "High";
  else if (title.includes("Level 2")) severity = "Medium";
  else if (title.includes("Level 1")) severity = "Low";

  return {
    type: "travel-advisory",
    title: item.title || "Travel Advisory",
    description: item.description || "",
    location: item.title?.replace("Travel Advisory:", "").trim() || "",
    severity,
    timestamp: item.pubDate || "",
    lat: null,
    lng: null
  };
}

// Normalize news items
function normalizeNews(item) {
  return {
    type: "news",
    title: item.title || "News",
    description: item.description || "",
    location: "Global",
    severity: "Low",
    timestamp: item.pubDate || "",
    lat: null,
    lng: null
  };
}

// ======================================================
// /intel ENDPOINT (REWRITTEN + EXPANDED + RECONNECT SAFE)
// ======================================================
app.get("/intel", async (req, res) => {
  try {
    // 1. Travel advisories
    const travelRaw = await safeRSS(TRAVEL_ADVISORY_URL);
    const travel = travelRaw.map(normalizeTravel);

    // 2. Global news
    let news = [];
    for (const feed of NEWS_FEEDS) {
      const items = await safeRSS(feed);
      news.push(...items.map(normalizeNews));
    }

    // Combine all intel
    const incidents = [...travel, ...news];

    // Always return valid JSON
    res.json({
      status: "ok",
      count: incidents.length,
      incidents
    });
  } catch (err) {
    console.error("INTEL ERROR:", err);
    res.json({
      status: "error",
      incidents: []
    });
  }
});

// ======================================================
// ORIGINAL PORT LOGIC (kept exactly as in your file)
// ======================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Warroom backend listening on port ${PORT}`);
});
