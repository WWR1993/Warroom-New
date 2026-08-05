import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const feeds = [
  "https://reliefweb.int/updates/rss.xml",
  "https://rsshub.app/liveuamap",
  "https://rsshub.app/bbc/world",
  "https://rsshub.app/aljazeera/news"
];

app.get("/intel", async (req, res) => {
  let all = [];

  for (const url of feeds) {
    try {
      const r = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${url}`);
      const data = await r.json();
      if (!data.items) continue;

      data.items.forEach(item => {
        all.push({
          source: data.feed.title,
          title: item.title,
          link: item.link,
          summary: item.description,
          timestamp: item.pubDate
        });
      });
    } catch (e) {
      console.log("Feed error:", url);
    }
  }

  res.json(all);
});

app.listen(3000, () => console.log("Backend running on port 3000"));
