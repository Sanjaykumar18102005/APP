import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { healthRouter } from './src/lib/health';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
const PORT = Number(process.env.PORT) || 3000;

app.use(healthRouter);

// Lazy init of Gemini API client
let aiClient: GoogleGenAI | null = null;
function getGeminiServer(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid 'messages' field in request body." });
    }

    const ai = getGeminiServer();
    const contents = messages.map((msg: any) => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: "You are a helpful, expert AI assistant within an app called PromptGlow. Provide constructive, insightful feedback."
      }
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Server Chat Error:", err);
    res.status(500).json({ error: err.message || "Unknown error when generating chat response." });
  }
});

app.post('/api/vision', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: "Missing 'imageBase64' or 'mimeType' field." });
    }

    const ai = getGeminiServer();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: imageBase64
          }
        },
        {
          text: `Analyze this image in deep technical detail. Provide a breakdown of its visual components, lighting, art style, and camera settings (if it looks like a photo). Then, provide two production-ready prompts that could recreate it: 1) A Midjourney prompt, and 2) A Stable Diffusion prompt. Output in cleanly formatted markdown.`
        }
      ]
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Server Vision Error:", err);
    res.status(500).json({ error: err.message || "Unknown error when analyzing image." });
  }
});

app.post('/api/prompt-builder/question', async (req, res) => {
  try {
    const { initialIdea, answers } = req.body;
    if (!initialIdea) {
      return res.status(400).json({ error: "Missing 'initialIdea'." });
    }

    const ai = getGeminiServer();
    const historyStr = (answers || []).map((ans: any) => `Q: ${ans.q}\nA: ${ans.a}`).join('\n\n');
    
    const prompt = `You are an expert Prompt Engineer AI Copilot. 
The user wants to write a highly optimized prompt starting from this vague idea: "${initialIdea}"

They have already provided these clarifications:
${historyStr}

Please generate ONE multiple-choice question to further clarify their intent, format, constraints, or tone. The goal is to build the ultimate prompt.
Provide 3-5 distinct options for the question.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["question", "options"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (err: any) {
    console.error("Server PromptBuilder Question Error:", err);
    res.status(500).json({ error: err.message || "Unknown error when generating builder question." });
  }
});

app.post('/api/prompt-builder/final-prompt', async (req, res) => {
  try {
    const { initialIdea, answers } = req.body;
    if (!initialIdea) {
      return res.status(400).json({ error: "Missing 'initialIdea'." });
    }

    const ai = getGeminiServer();
    const historyStr = (answers || []).map((ans: any) => `Q: ${ans.q}\nA: ${ans.a}`).join('\n\n');
    
    const prompt = `You are a world-class prompt engineer. Write an extremely high quality, detailed prompt based on this initial idea and clarification context:
Initial idea: "${initialIdea}"
Context:
${historyStr}

The output Must strictly only be the generated Prompt Text itself.
Use roles, task descriptions, contexts, constraints, and format requirements as needed to make it world class.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Server Final Prompt Error:", err);
    res.status(500).json({ error: err.message || "Unknown error when generating final prompt." });
  }
});

// Vite Middleware for integration dev server
async function startViteMiddleware() {
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

startViteMiddleware();
