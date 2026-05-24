import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();

app.use(express.json({ limit: '10mb' }));

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

function formatServerError(err: any): string {
  if (!err) return "An unexpected error occurred.";
  const msg = err.message || "";
  const errStr = typeof err === 'object' ? JSON.stringify(err) : String(err);
  
  if (
    msg.includes("API key expired") || 
    errStr.includes("API key expired") || 
    msg.includes("API_KEY_INVALID") || 
    errStr.includes("API_KEY_INVALID") || 
    msg.includes("INVALID_ARGUMENT") || 
    errStr.includes("INVALID_ARGUMENT") ||
    msg.toLowerCase().includes("api key") ||
    errStr.toLowerCase().includes("api key")
  ) {
    return "API Key Configuration Required: The current GEMINI_API_KEY is either expired, invalid, or missing. Please open the Settings menu in the top-right corner (or side navigation) of AI Studio, navigate to 'Secrets', and click to update or renew your GEMINI_API_KEY value with a fresh premium key. Afterward, your changes will sync automatically.";
  }
  return msg || "An unexpected error occurred.";
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
    res.status(500).json({ error: formatServerError(err) });
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
    res.status(500).json({ error: formatServerError(err) });
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
    res.status(500).json({ error: formatServerError(err) });
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

The text response must strictly only contain the generated prompt. Do not add conversational prefixes or wrapping markdown text unless specified.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Server Final Prompt Error:", err);
    res.status(500).json({ error: formatServerError(err) });
  }
});

export default app;
