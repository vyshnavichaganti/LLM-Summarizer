import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";
import dotenv from "dotenv";
import * as gemini from "./server/gemini.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

async function startServer() {
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Initialize Resend lazily to avoid crash if key is missing
  let resend: Resend | null = null;
  const getResend = () => {
    if (!resend) {
      const key = process.env.RESEND_API_KEY;
      if (!key) {
        throw new Error("RESEND_API_KEY environment variable is required");
      }
      resend = new Resend(key);
    }
    return resend;
  };

  // API routes
  app.post("/api/send-email", async (req, res) => {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: "Missing required fields: to, subject, html" });
    }

    try {
      const client = getResend();
      const { data, error } = await client.emails.send({
        from: "OmniSummarize <onboarding@resend.dev>", // Default Resend test domain
        to: [to],
        subject: subject,
        html: html,
      });

      if (error) {
        console.error("Resend error:", error);
        return res.status(500).json({ error: error.message });
      }

      res.json({ success: true, data });
    } catch (err: any) {
      console.error("Server error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Gemini API routes
  app.post("/api/summarize-url", async (req, res) => {
    try {
      const { url, language, dataSharing } = req.body;
      const result = await gemini.summarizeUrl(url, language, dataSharing);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/summarize-doc", async (req, res) => {
    try {
      const { fileBase64, mimeType, language, dataSharing } = req.body;
      const result = await gemini.summarizeDocument(fileBase64, mimeType, language, dataSharing);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/summarize-text", async (req, res) => {
    try {
      const { text, language, dataSharing } = req.body;
      const result = await gemini.summarizeText(text, language, dataSharing);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/generate-code", async (req, res) => {
    try {
      const { content, language } = req.body;
      const result = await gemini.generateCodeFromContent(content, language);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      const result = await gemini.translateText(text, targetLanguage);
      res.json({ text: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/translate-summary", async (req, res) => {
    try {
      const { result, targetLanguage } = req.body;
      const translated = await gemini.translateSummaryResult(result, targetLanguage);
      res.json(translated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/generate-speech", async (req, res) => {
    try {
      const { text } = req.body;
      const audio = await gemini.generateSpeech(text);
      res.json({ audio });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen if not on Vercel (Vercel handles the serverless execution)
  if (process.env.VERCEL !== "1") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
