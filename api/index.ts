import express from 'express';
import dotenv from 'dotenv';
import Groq, { toFile } from 'groq-sdk';
import cors from 'cors';

dotenv.config();

const app = express();

// Enable CORS for all requests so your Netlify frontend can talk to Render
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Root health-check route so Render and GET requests don't return 404
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'PromptGlow Backend API is running successfully!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    endpoints: [
      '/api/chat',
      '/api/vision',
      '/api/transcribe',
      '/api/prompt-builder/question',
      '/api/prompt-builder/final-prompt'
    ]
  });
});

// Lazy init of Groq SDK client
let groqClient: Groq | null = null;
function getGroqClient(): Groq {
  const key = process.env.GROQ_API_KEY;
  if (!key || key === "YOUR_GROQ_API_KEY" || key === "placeholder" || key.startsWith("YOUR_") || key.includes("GROQ_API")) {
    throw new Error("GROQ_API_KEY invalid or placeholder detected.");
  }
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: key,
    });
  }
  return groqClient;
}

function isApiKeyError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || "").toLowerCase();
  const errStr = (typeof err === 'object' ? JSON.stringify(err) : String(err)).toLowerCase();
  const key = process.env.GROQ_API_KEY || "";
  
  const hasPlaceholderKey = !key || key === "YOUR_GROQ_API_KEY" || key === "placeholder" || key.startsWith("YOUR_") || key.includes("GROQ_API");

  return (
    hasPlaceholderKey ||
    msg.includes("api key") || 
    errStr.includes("api key") || 
    msg.includes("placeholder") ||
    errStr.includes("placeholder") ||
    msg.includes("api_key_invalid") || 
    errStr.includes("api_key_invalid") || 
    msg.includes("invalid_argument") || 
    errStr.includes("invalid_argument") ||
    msg.includes("authentication") ||
    errStr.includes("authentication") ||
    msg.includes("unauthorized") ||
    errStr.includes("unauthorized") ||
    msg.includes("forbidden") ||
    errStr.includes("forbidden") ||
    msg.includes("key expired") ||
    errStr.includes("key expired")
  );
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
    msg.includes("unauthorized") ||
    errStr.includes("unauthorized") ||
    msg.toLowerCase().includes("api key") ||
    errStr.toLowerCase().includes("api key")
  ) {
    return "API Key Configuration Required: The GROQ_API_KEY is either expired, invalid, or missing. Please configure your GROQ_API_KEY in the Environment Settings (or .env file) to restore real-time generations.";
  }
  return msg || "An unexpected error occurred.";
}

// ==================== SANDBOX FALLBACK GENERATORS ====================

function getChatFallback(messages: any[]): string {
  const lastMessage = messages[messages.length - 1];
  const text = (lastMessage?.content || "").toLowerCase();
  
  if (text.includes("help") || text.includes("how to") || text.includes("start")) {
    return `### How to Use PromptGlow 🌟

1. **PromptGlow Mode**: Input any unpolished idea. We'll ask you 3 clarification questions dynamically and craft an optimized, professional prompt template.
2. **Workspace Chat**: Discuss, brainstorm, or refine prompt elements with the copilot.
3. **Vision Analysis**: Upload any reference UI or image to dissect its design patterns and auto-generate Midjourney/Stable Diffusion prompts.

*Note: The Groq API key is currently expired or missing. I am running in local sandbox fallback mode to ensure uninterrupted workflow! Please configure/renew your key in top-right Settings -> Secrets or your env variables.*`;
  } else if (text.includes("prompt") || text.includes("write") || text.includes("create") || text.includes("generate")) {
    return `### Custom Prompt Brainstorm ✨

Here is a brilliant template to start with:
\`\`\`markdown
Role: Dual Senior UX Researcher and Prompt Architect
Task: Design an end-to-end user testing scenario for the topic: "${lastMessage?.content || 'Your Business Idea'}"
Constraints: Deliver as a high-fidelity markdown table with clear criteria.
\`\`\`

Would you like me to refine this template further? Since your GROQ_API_KEY is currently expired/missing, I am guiding you with curated patterns in sandbox fallback mode! Configure your API key to activate full real-time reasoning.`;
  } else {
    return `### Welcome to PromptGlow Workspace Copilot! 🧠

I'm currently running in **Sandbox Fallback Mode** because the configured Groq API key is expired, invalid, or missing. 

However, we can still collaborate! I am equipped with expert pre-designed prompt engineering blueprints for you. Ask me about:
- **How to structure Midjourney or Stable Diffusion artwork prompts**
- **How to construct role-play system prompts**
- **Best practices for zero-shot vs few-shot learning style prompts**

To restore fully active, real-time Groq reasoning, please open the gear icon in the top right, go to **Secrets**, and update your \`GROQ_API_KEY\`!`;
  }
}

function getVisionFallback(): string {
  return `### 📷 Image Dissection & Universal Prompt Generation

*⚠️ Note: Running in Sandbox Fallback Mode because the Groq API key is expired or missing. The following is a premium structural audit and universal prompt template generated for a sample high-fidelity creative layout.*

#### 🎨 Visual Composition & Style
- **Primary Art Medium:** High-fidelity UI wireframe & digital product design under premium glassmorphic constraints.
- **Lighting Atmosphere:** Dark neo-brutalist theme themed with glowing futuristic magenta and deep purple/violet neon accents. Deep charcoal gray glass panel layers.
- **Visual Rhythm:** Balanced asymmetrical layout, featuring interactive focus cards, clean telemetry lines, and a high-contrast sans-serif font structure.

---

#### 🚀 Recommended Universal Prompts

##### 1. Detailed Universal Prompt (Comprehensive & Universally Friendly)
> A premium dark high-fidelity digital interface designed with elegant glassmorphic components. Deep cosmic slate-gray obsidian background containing clean vector panels. Luminous glowing accent lines in neon magenta, bubblegum light, and electric violet. Sleek analytics dashboards, isometric rendering perspective, custom UI widgets. Soft volumetric studio illumination with ambient edge glow and micro-shadow details. Perfect for recreation in modern layouts, 3D rendering engines, or digital vector platforms.

##### 2. Brief Universal Prompt (Punchy & Tag-Based)
> High-fidelity modern software dashboard UI, dark mode glassmorphism, luminous neon magenta and deep purple accents, sleek layout, figma design template style.

---
*To analyze your custom uploaded images in real-time, please configure a fresh **GROQ_API_KEY** under Settings > Secrets in the top-right.*`;
}

interface SandboxQuestion {
  question: string;
  options: string[];
}

function getPromptBuilderQuestionFallback(initialIdea: string, answers: any[]): SandboxQuestion {
  const idea = initialIdea.toLowerCase();
  
  // Categorize
  let category: "writing" | "technical" | "visual" | "general" = "general";
  if (idea.includes("code") || idea.includes("python") || idea.includes("react") || idea.includes("api") || idea.includes("database") || idea.includes("html") || idea.includes("css") || idea.includes("develop") || idea.includes("function") || idea.includes("site") || idea.includes("app")) {
    category = "technical";
  } else if (idea.includes("draw") || idea.includes("logo") || idea.includes("image") || idea.includes("picture") || idea.includes("art") || idea.includes("midjourney") || idea.includes("stable diffusion") || idea.includes("photograph") || idea.includes("paint") || idea.includes("design")) {
    category = "visual";
  } else if (idea.includes("write") || idea.includes("email") || idea.includes("copy") || idea.includes("blog") || idea.includes("essay") || idea.includes("article") || idea.includes("sales") || idea.includes("resume") || idea.includes("letter")) {
    category = "writing";
  }

  const index = answers.length; // 0, 1, or 2

  const pools = {
    writing: [
      {
        question: `[Sandbox Mode] What is the primary objective of your writing for "${initialIdea}"?`,
        options: ["Increase reader conversions and actions", "Deeply educate and inform the reader", "Initiate a personal follow-up conversation", "Express an engaging, creative story"]
      },
      {
        question: "[Sandbox Mode] What tone and strategic style matches your goal best?",
        options: ["Highly professional, confident, and persuasive", "Warm, conversational, and highly relatable", "Stark, direct, and zero-fluff bullet points", "Elegant, storytelling, and rich in descriptions"]
      },
      {
        question: "[Sandbox Mode] What length or structure constraint should the output adhere to?",
        options: ["Ultra-concise (under 120 words / 3 paragraphs)", "Medium structured layout (300-500 words) with clear headings", "Deep comprehensive guide with actionable key takeaways"]
      }
    ],
    technical: [
      {
        question: `[Sandbox Mode] Which programming language or tech stack is most relevant to "${initialIdea}"?`,
        options: ["TypeScript / JavaScript with React & Next.js", "Python (Django, FastAPI, or Scripting)", "SQL / Relational Schema Design & Optimization", "Systems Engineering (Go, Rust, Docker)"]
      },
      {
        question: "[Sandbox Mode] What level of explanation and comments would you prefer?",
        options: ["Just raw, clean, production-ready code with essential JSdocs", "Line-by-line detailed explanation with architecture rationale", "Robust error limits, test files, and security recommendations"]
      },
      {
        question: "[Sandbox Mode] How should the system handle errors, missing variables, or edge cases?",
        options: ["Safely wrap inside descriptive try-catch blocks with helpful fallback returns", "Let functions fail fast with custom descriptive strongly-typed errors", "Keep implementations fully optimized assuming valid parameters"]
      }
    ],
    visual: [
      {
        question: `[Sandbox Mode] What is the primary artistic medium or render engine for "${initialIdea}"?`,
        options: ["Cinematic Photorealism (8k resolution, volumetric rays, f/1.8)", "Ultra-modern dark minimalist glassmorphic vector graphic", "Cyberpunk / Synthwave digital neon color palette", "Stunning fantasy concept art / Unreal Engine 5 environment"]
      },
      {
        question: "[Sandbox Mode] What lighting style or atmosphere matches your visual aesthetic?",
        options: ["Chiaroscuro high contrast deep shadows", "Warm, pastel golden hour cinematic lens glow", "Vibrant cold neon lighting (blue, violet, magenta)", "High-key sparse studio lighting with minimal reflections"]
      },
      {
        question: "[Sandbox Mode] What focal depth or composition rule fits best for the camera?",
        options: ["Macro extreme close-up with intense bokeh-blurred background", "Wide-angle majestic drone shot with symmetrical perspective", "Orthographic flat view with pristine graphic proportions"]
      }
    ],
    general: [
      {
        question: `[Sandbox Mode] Who is the main target audience or reader for "${initialIdea}"?`,
        options: ["General public with clear non-technical terminology", "High-level executives, clients, or business partners", "Other developers or technical reviewers", "Creative colleagues, writers, or artists"]
      },
      {
        question: "[Sandbox Mode] What formatting construct or structure is best?",
        options: ["Pragmatic scannable bullet points and bold highlights", "Fenced code blocks and deep markdown documentation", "Natural, engaging human conversational prose"]
      },
      {
        question: "[Sandbox Mode] What core constraint is absolute for this prompt?",
        options: ["Strictly offline-first, no external dependencies", "Fully academic, complete citations and definitions", "Lightweight, easy to maintain, maximum efficiency"]
      }
    ]
  };

  const pool = pools[category] || pools.general;
  const safeIndex = index < pool.length ? index : pool.length - 1;
  return pool[safeIndex];
}

function getPromptBuilderFinalPromptFallback(initialIdea: string, answers: {q: string, a: string}[]): string {
  const contextStr = answers.map((ans) => `- **${ans.q.replace(/\[Sandbox Mode\]\s*/, "").trim()}**: _${ans.a}_`).join('\n');
  
  return `# PROMPT TEMPLATE: EXPERT CORE ARCHITECT 🚀

## 🎭 Role & Perspective:
You are an elite, world-class expert Prompt Architect and Executive Consultant specifically assigned to: "${initialIdea}"

## 📋 Context & Requirements:
${contextStr}

## 🎯 Directives:
1. Provide a premium, fully customized solution addressing the core task: "${initialIdea}".
2. Adopt the selected tone, layout constraints, and visual guidelines specified above.
3. Structure your output logically: start with a scannable summary, progress to the main artifact, and conclude with implementation tips.
4. Maintain extreme precision, avoid generic placeholders, and use high-impact terminology.

## 🛠️ Execution Protocol:
- If code or structured data is requested, wrap it cleanly in markdown blocks.
- If visual/image prompts are requested, specify precise lighting, composition, and parameters.

## ⚡ Initiate Response:`;
}

function stripThinking(text: string): string {
  if (!text) return "";
  let cleaned = text;

  // 1. If text contains closing </think> tag, slice from after the last </think>
  if (cleaned.includes("</think>")) {
    cleaned = cleaned.substring(cleaned.lastIndexOf("</think>") + 8);
  }

  // 2. Remove any remaining <think>...</think> blocks or unclosed <think> tags
  cleaned = cleaned.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '');

  // 3. Strip any leading reasoning lines or meta commentary blocks
  cleaned = cleaned.replace(/^(?:\s*[\*\-]?\s*(?:No thinking|Output Generation|thinking tags|step \d|Drafting|Proceed to|Final Output|Internal thought)[\s\S]*?\n)+/gi, '');

  // 4. Remove leading quote marks or stray periods/whitespace
  cleaned = cleaned.trim();
  cleaned = cleaned.replace(/^["'.\s]+/, '');

  return cleaned.trim();
}

// ==================== END FALLBACK GENERATORS ====================

// API Routes
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid 'messages' field in request body." });
    }

    try {
      const groq = getGroqClient();
      const formattedMessages = [
        { 
          role: 'system' as const, 
          content: "You are a friendly, helpful, and conversational AI assistant within PromptGlow. Respond naturally as a chatbot answering the user's questions or chatting directly. Do NOT output internal thoughts or <think> tags." 
        },
        ...messages.map((msg: any) => ({
          role: (msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
          content: msg.content
        }))
      ];

      const response = await groq.chat.completions.create({
        model: "qwen/qwen3.6-27b",
        messages: formattedMessages,
      });

      const rawText = response.choices[0]?.message?.content || "";
      return res.json({ text: stripThinking(rawText) });
    } catch (apiErr: any) {
      if (isApiKeyError(apiErr)) {
        console.warn("Using Sandbox Fallback for chat due to API key error:", apiErr.message || apiErr);
        const text = getChatFallback(messages);
        return res.json({ text: stripThinking(text) });
      }
      throw apiErr;
    }
  } catch (err: any) {
    console.error("Server Chat Error:", err);
    res.status(500).json({ error: formatServerError(err) });
  }
});

app.post('/api/vision', async (req, res) => {
  try {
    const { imageBase64, mimeType, prompt: userPrompt, aspectRatio, resolution } = req.body;
    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: "Missing 'imageBase64' or 'mimeType' field." });
    }

    const detectedRatio = aspectRatio || "16:9";
    const detectedRes = resolution || "Detected from image dimensions";

    try {
      const groq = getGroqClient();
      const promptText = userPrompt || `Examine this image in detail. The image has a detected aspect ratio of ${detectedRatio} (${detectedRes}).

Generate a master, highly detailed, production-ready image generation prompt designed to recreate this exact image across ANY modern AI tool (Midjourney, DALL-E 3, Flux, Stable Diffusion).

CRITICAL REQUIREMENT: You MUST append the aspect ratio tag \`--ar ${detectedRatio}\` at the end of both the Master Prompt and Brief Prompt!

Format your response strictly in Markdown as follows:

# Master Image Generation Prompt
\`\`\`text
[Put the complete, highly detailed universal image generation prompt here capturing subject, layout, composition, lighting, style, color palette, textures, camera angle, fine details, ending explicitly with --ar ${detectedRatio}]
\`\`\`

### Brief Tag-Dense Prompt
\`\`\`text
[A concise, tag-dense version of the prompt, ending explicitly with --ar ${detectedRatio}]
\`\`\`

---

### Visual Analysis & Breakdown
- **Aspect Ratio & Dimensions**: ${detectedRatio} (${detectedRes})
- **Subject & Composition**: [Short explanation of subject placement, framing, and layout]
- **Style & Medium**: [Short explanation of artistic style, medium, and rendering technique]
- **Color & Lighting**: [Short explanation of lighting, color palette, and mood]`;

      const response = await groq.chat.completions.create({
        model: "qwen/qwen3.6-27b",
        messages: [
          {
            role: "system",
            content: "You are an expert AI vision prompt reverse-engineering copilot for PromptGlow. Directly output the master prompt first in a code block with aspect ratio parameters (--ar ...), followed by the brief prompt and a short analysis. Do NOT output internal thoughts or <think> tags."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: promptText
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`
                }
              }
            ]
          }
        ]
      });

      const rawText = response.choices[0]?.message?.content || "";
      return res.json({ text: stripThinking(rawText) });
    } catch (apiErr: any) {
      if (isApiKeyError(apiErr)) {
        console.warn("Using Sandbox Fallback for vision due to API key error:", apiErr.message || apiErr);
        const text = getVisionFallback();
        return res.json({ text: stripThinking(text) });
      }
      throw apiErr;
    }
  } catch (err: any) {
    console.error("Server Vision Error:", err);
    res.status(500).json({ error: formatServerError(err) });
  }
});

app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioBase64, filename } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: "Missing 'audioBase64' field in request body." });
    }

    try {
      const groq = getGroqClient();
      const buffer = Buffer.from(audioBase64, 'base64');
      const file = await toFile(buffer, filename || 'audio.wav');
      const transcription = await groq.audio.transcriptions.create({
        file,
        model: "whisper-large-v3-turbo",
        response_format: "json"
      });

      return res.json({ text: stripThinking(transcription.text || "") });
    } catch (apiErr: any) {
      if (isApiKeyError(apiErr)) {
        console.warn("Using Fallback for transcribe due to API key error:", apiErr.message || apiErr);
        return res.json({ text: "Sample audio transcription text (sandbox mode)." });
      }
      throw apiErr;
    }
  } catch (err: any) {
    console.error("Server Transcribe Error:", err);
    res.status(500).json({ error: formatServerError(err) });
  }
});

app.post('/api/prompt-builder/question', async (req, res) => {
  try {
    const { initialIdea, answers } = req.body;
    if (!initialIdea) {
      return res.status(400).json({ error: "Missing 'initialIdea'." });
    }

    try {
      const groq = getGroqClient();
      const historyStr = (answers || []).map((ans: any) => `Q: ${ans.q}\nA: ${ans.a}`).join('\n\n');
      
      const prompt = `You are an expert Prompt Engineer AI Copilot. 
The user wants to write a highly optimized prompt starting from this vague idea: "${initialIdea}"

They have already provided these clarifications:
${historyStr}

Please generate ONE multiple-choice question to further clarify their intent, format, constraints, or tone. The goal is to build the ultimate prompt.
Provide 3-5 distinct options for the question.

You MUST respond strictly in valid JSON format with the following keys:
- "question": (string)
- "options": (array of strings)

Example output format:
{
  "question": "What core style should we apply?",
  "options": [
    "High-fidelity glassmorphism with bright neon accents",
    "Clean flat vector graphics with corporate palettes",
    "Dark synthwave cyberpunk styling"
  ]
}`;

      const response = await groq.chat.completions.create({
        model: "qwen/qwen3.6-27b",
        messages: [
          {
            role: "system",
            content: "You are a JSON generator API. Return ONLY raw JSON with keys 'question' and 'options'. Do NOT wrap in markdown or output <think> tags or internal commentary."
          },
          { role: "user", content: prompt }
        ]
      });

      let responseText = response.choices[0]?.message?.content || "{}";
      responseText = stripThinking(responseText);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      return res.json(JSON.parse(jsonStr));
    } catch (apiErr: any) {
      console.warn("Using Sandbox Fallback for builder question due to API error:", apiErr.message || apiErr);
      const qData = getPromptBuilderQuestionFallback(initialIdea, answers || []);
      return res.json(qData);
    }
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

    try {
      const groq = getGroqClient();
      const historyStr = (answers || []).map((ans: any) => `Q: ${ans.q}\nA: ${ans.a}`).join('\n\n');
      
      const prompt = `You are a world-class prompt engineer. Write an extremely high quality, detailed prompt based on this initial idea and clarification context:
Initial idea: "${initialIdea}"
Context:
${historyStr}

The text response must strictly only contain the generated prompt. Do not add conversational prefixes, wrapping markdown meta text, internal thinking, or <think> tags.`;

      const response = await groq.chat.completions.create({
        model: "qwen/qwen3.6-27b",
        messages: [
          {
            role: "system",
            content: "You output ONLY the refined prompt itself directly. Do NOT output internal thoughts or <think> tags."
          },
          { role: "user", content: prompt }
        ],
      });

      const rawText = response.choices[0]?.message?.content || "";
      const cleaned = stripThinking(rawText);
      if (!cleaned) {
        throw new Error("Model returned empty text");
      }
      return res.json({ text: cleaned });
    } catch (apiErr: any) {
      console.warn("Using Fallback for final prompt due to API/model error:", apiErr.message || apiErr);
      const text = getPromptBuilderFinalPromptFallback(initialIdea, answers || []);
      return res.json({ text: stripThinking(text) });
    }
  } catch (err: any) {
    console.error("Server Final Prompt Error:", err);
    res.status(500).json({ error: formatServerError(err) });
  }
});

export default app;
