// backend/server.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Example: Crisis24-style intelligence endpoint
// Adjust the URL and mapping logic to match your real upstream feed.
app.get("/intel", async (req, res) => {
  try {
    // Replace this with your real data source URL
    const upstreamUrl = "https://example-intel-feed.com/api/incidents";

    const response = await fetch(upstreamUrl);
    if (!response.ok) {
      return res.status(502).json({
        status: "error",
        message: "Upstream feed unavailable",
      });
    }

    const data = await response.json();

    // Optionally normalize/transform data here before sending to UI
    // For now, just pass it through:
    res.json({
      status: "ok",
      source: "backend",
      incidents: data,
    });
  } catch (error) {
    console.error("Backend /intel error:", error);
    res.status(500).json({
      status: "error",
      message: "Backend failed to fetch intelligence feed",
    });
  }
});

// Health check for Render + debugging
app.get("/", (req, res) => {
  res.json({ status: "online", message: "Warroom backend is running" });
});

// IMPORTANT: use Render's PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Warroom backend listening on port ${PORT}`);
});

