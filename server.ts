import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for translation
  app.post("/api/translate", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "API key is not configured on the server." });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are a linguist assistant and translator. The user has provided the following text: "${text}".
        
Detect the languages used (it may be code-mixed, e.g., Hindi + English, Tanglish, Spanglish, etc.).
Translate the entire text cleanly into standard, fluent English. Preserve the true meaning and tone of the original message.

Return a JSON object with this exact structure:
{
  "input": "<the original text>",
  "detected_languages": ["<lang_code_1>", "<lang_code_2>"],
  "translated_text": "<the translated english text>"
}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              input: {
                type: Type.STRING,
                description: "The original text provided by the user."
              },
              detected_languages: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of detected language codes (e.g., 'hi', 'en', 'es')."
              },
              translated_text: {
                type: Type.STRING,
                description: "The cleanly translated English text."
              }
            },
            required: ["input", "detected_languages", "translated_text"]
          }
        }
      });

      const jsonStr = response.text?.trim();
      if (!jsonStr) {
        return res.status(500).json({ error: "Failed to parse model response" });
      }

      const parsed = JSON.parse(jsonStr);
      res.json(parsed);

    } catch (error: any) {
      console.error("Translation error:", error);
      res.status(500).json({ error: error.message || "Failed to translate text" });
    }
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
    // For Express 4.x
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
