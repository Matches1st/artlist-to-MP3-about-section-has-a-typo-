import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import https from "https";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.post("/api/extract", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || !url.startsWith("https://artlist.io/")) {
        return res.status(400).json({ error: "Invalid Artlist URL" });
      }

      const response = await fetch(url);
      const html = await response.text();

      // Extract sitePlayableFilePath
      const match = html.match(/sitePlayableFilePath\\?":\\?"(https:\/\/[^"\\]+?)(?:\\|")/);
      
      // Extract song name
      const nameMatch = html.match(/songName\\?":\\?"([^"\\]+?)(?:\\|")/);
      const songName = nameMatch ? nameMatch[1] : "artlist-track";

      if (match && match[1]) {
        res.json({ 
          success: true, 
          audioUrl: match[1],
          songName: songName
        });
      } else {
        res.status(404).json({ error: "Could not find audio file in the provided URL" });
      }
    } catch (error) {
      console.error("Error extracting URL:", error);
      res.status(500).json({ error: "Failed to process the URL" });
    }
  });

  app.get("/api/download", (req, res) => {
    const { url, name } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).send("Missing URL");
    }

    const filename = name ? `${name}.aac` : "artlist-track.aac";
    
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "audio/aac");

    https.get(url, (audioRes) => {
      // Handle redirects
      if (audioRes.statusCode === 301 || audioRes.statusCode === 302) {
        const redirectUrl = audioRes.headers.location;
        if (redirectUrl) {
          const fullRedirectUrl = redirectUrl.startsWith('http') 
            ? redirectUrl 
            : `https://cms-public-artifacts.artlist.io${redirectUrl}`;
            
          https.get(fullRedirectUrl, (redirectedRes) => {
            redirectedRes.pipe(res);
          }).on('error', (err) => {
            res.status(500).send("Error downloading file");
          });
          return;
        }
      }
      audioRes.pipe(res);
    }).on('error', (err) => {
      res.status(500).send("Error downloading file");
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
