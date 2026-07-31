import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import OpenAI from 'openai';

dotenv.config();

const app = express();

// Enable CORS for all requests
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    message: 'PromptGlow Backend API (Gemma 4 vLLM) is running successfully!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    engine: 'AWS vLLM Gemma 4',
    endpoints: [
      '/api/chat',
      '/api/vision',
      '/api/transcribe',
      '/api/prompt-builder/question',
      '/api/prompt-builder/final-prompt'
    ]
  });
});

// Initialize OpenAI client pointing to AWS vLLM endpoint
const gemmaClient = new OpenAI({
  baseURL: process.env.AWS_LLM_ENDPOINT || process.env.GEMMA_API_BASE || 'http://13.60.137.114:8000/v1',
  apiKey: process.env.AWS_LLM_API_KEY || process.env.GEMMA_API_KEY || 'efffa8f665310b30a81fd6ffb70f7dc84b1380e820ce2d438a6fa8df1ac8d6b1',
});

const MODEL_NAME = process.env.AWS_LLM_MODEL || process.env.GEMMA_MODEL_NAME || 'google/gemma-4-12B-it-qat-w4a16-ct';

function stripThinking(text: string): string {
  if (!text) return "";
  let cleaned = text;

  if (cleaned.includes("</think>")) {
    cleaned = cleaned.substring(cleaned.lastIndexOf("</think>") + 8);
  }

  cleaned = cleaned.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '');
  cleaned = cleaned.replace(/^(?:\s*[\*\-]?\s*(?:No thinking|Output Generation|thinking tags|step \d|Drafting|Proceed to|Final Output|Internal thought)[\s\S]*?\n)+/gi, '');
  cleaned = cleaned.trim();
  cleaned = cleaned.replace(/^["'.\s]+/, '');

  return cleaned.trim();
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

*Note: Running in Sandbox Fallback Mode. Connect your AWS Gemma 4 vLLM instance at \`${process.env.GEMMA_API_BASE || 'http://localhost:8000/v1'}\` for live generations.*`;
  } else if (text.includes("prompt") || text.includes("write") || text.includes("create") || text.includes("generate")) {
    return `### Custom Prompt Brainstorm ✨

Here is a brilliant template to start with:
\`\`\`markdown
Role: Dual Senior UX Researcher and Prompt Architect
Task: Design an end-to-end user testing scenario for the topic: "${lastMessage?.content || 'Your Business Idea'}"
Constraints: Deliver as a high-fidelity markdown table with clear criteria.
\`\`\`

Would you like me to refine this template further? Running in sandbox fallback mode until AWS Gemma 4 server connection is established.`;
  } else {
    return `### Welcome to PromptGlow Workspace Copilot! 🧠

I am currently running in **Sandbox Fallback Mode** (AWS Gemma 4 vLLM server unreachable at \`${process.env.GEMMA_API_BASE || 'http://localhost:8000/v1'}\`).

However, we can still collaborate! I am equipped with expert pre-designed prompt engineering blueprints:
- **Structure Midjourney or Stable Diffusion artwork prompts**
- **Construct role-play system prompts**
- **Best practices for zero-shot vs few-shot learning style prompts**`;
  }
}

function getVisionFallback(aspectRatio: string = "16:9"): string {
  return `### 📷 Image Dissection & Universal Prompt Generation

*⚠️ Note: Running in Sandbox Fallback Mode. The following is a visual structural audit and universal prompt template for a high-fidelity creative layout.*

#### 🎨 Visual Composition & Style
- **Primary Art Medium:** High-fidelity UI wireframe & digital product design under glassmorphic constraints.
- **Lighting Atmosphere:** Dark neo-brutalist theme themed with glowing futuristic magenta and deep purple neon accents.
- **Visual Rhythm:** Balanced asymmetrical layout featuring interactive focus cards and high-contrast typography.

---

#### 🚀 Recommended Universal Prompts

##### 1. Master Universal Prompt
\`\`\`text
A premium dark high-fidelity digital interface designed with elegant glassmorphic components. Deep cosmic slate-gray obsidian background containing clean vector panels. Luminous glowing accent lines in neon magenta and electric violet. Sleek analytics dashboards, isometric rendering perspective. Soft volumetric studio illumination --ar ${aspectRatio}
\`\`\`

##### 2. Brief Tag-Dense Prompt
\`\`\`text
High-fidelity modern software dashboard UI, dark mode glassmorphism, luminous neon magenta and deep purple accents, sleek layout, figma template style --ar ${aspectRatio}
\`\`\``;
}

interface SandboxQuestion {
  question: string;
  options: string[];
}

function getPromptBuilderQuestionFallback(initialIdea: string, answers: any[]): SandboxQuestion {
  const idea = (initialIdea || "").toLowerCase();
  
  let category: "writing" | "technical" | "visual" | "general" = "general";
  if (idea.includes("code") || idea.includes("python") || idea.includes("react") || idea.includes("api") || idea.includes("database") || idea.includes("html") || idea.includes("css") || idea.includes("develop") || idea.includes("function")) {
    category = "technical";
  } else if (idea.includes("draw") || idea.includes("logo") || idea.includes("image") || idea.includes("picture") || idea.includes("art") || idea.includes("midjourney") || idea.includes("stable diffusion")) {
    category = "visual";
  } else if (idea.includes("write") || idea.includes("email") || idea.includes("copy") || idea.includes("blog") || idea.includes("essay") || idea.includes("article")) {
    category = "writing";
  }

  const index = answers.length;

  const pools = {
    writing: [
      {
        question: `What is the primary objective of your writing for "${initialIdea}"?`,
        options: ["Increase reader conversions and actions", "Deeply educate and inform the reader", "Initiate a personal follow-up conversation", "Express an engaging, creative story"]
      },
      {
        question: "What tone and strategic style matches your goal best?",
        options: ["Highly professional, confident, and persuasive", "Warm, conversational, and highly relatable", "Stark, direct, and zero-fluff bullet points", "Elegant, storytelling, and rich in descriptions"]
      },
      {
        question: "What length or structure constraint should the output adhere to?",
        options: ["Ultra-concise (under 120 words / 3 paragraphs)", "Medium structured layout (300-500 words) with clear headings", "Deep comprehensive guide with actionable key takeaways"]
      }
    ],
    technical: [
      {
        question: `Which programming language or tech stack is most relevant to "${initialIdea}"?`,
        options: ["TypeScript / JavaScript with React & Next.js", "Python (Django, FastAPI, or Scripting)", "SQL / Relational Schema Design & Optimization", "Systems Engineering (Go, Rust, Docker)"]
      },
      {
        question: "What level of explanation and comments would you prefer?",
        options: ["Just raw, clean, production-ready code with essential JSdocs", "Line-by-line detailed explanation with architecture rationale", "Robust error limits, test files, and security recommendations"]
      },
      {
        question: "How should the system handle errors, missing variables, or edge cases?",
        options: ["Safely wrap inside descriptive try-catch blocks with helpful fallback returns", "Let functions fail fast with custom descriptive strongly-typed errors", "Keep implementations fully optimized assuming valid parameters"]
      }
    ],
    visual: [
      {
        question: `What is the primary artistic medium or render engine for "${initialIdea}"?`,
        options: ["Cinematic Photorealism (8k resolution, volumetric rays, f/1.8)", "Ultra-modern dark minimalist glassmorphic vector graphic", "Cyberpunk / Synthwave digital neon color palette", "Stunning fantasy concept art / Unreal Engine 5 environment"]
      },
      {
        question: "What lighting style or atmosphere matches your visual aesthetic?",
        options: ["Chiaroscuro high contrast deep shadows", "Warm, pastel golden hour cinematic lens glow", "Vibrant cold neon lighting (blue, violet, magenta)", "High-key sparse studio lighting with minimal reflections"]
      },
      {
        question: "What focal depth or composition rule fits best for the camera?",
        options: ["Macro extreme close-up with intense bokeh-blurred background", "Wide-angle majestic drone shot with symmetrical perspective", "Orthographic flat view with pristine graphic proportions"]
      }
    ],
    general: [
      {
        question: `Who is the main target audience or reader for "${initialIdea}"?`,
        options: ["General public with clear non-technical terminology", "High-level executives, clients, or business partners", "Other developers or technical reviewers", "Creative colleagues, writers, or artists"]
      },
      {
        question: "What formatting construct or structure is best?",
        options: ["Pragmatic scannable bullet points and bold highlights", "Fenced code blocks and deep markdown documentation", "Natural, engaging human conversational prose"]
      },
      {
        question: "What core constraint is absolute for this prompt?",
        options: ["Strictly offline-first, no external dependencies", "Fully academic, complete citations and definitions", "Lightweight, easy to maintain, maximum efficiency"]
      }
    ]
  };

  const pool = pools[category] || pools.general;
  const safeIndex = index < pool.length ? index : pool.length - 1;
  return pool[safeIndex];
}

function getPromptBuilderFinalPromptFallback(initialIdea: string, answers: {q: string, a: string}[]): string {
  const contextStr = (answers || []).map((ans) => `- **${(ans.q || "").trim()}**: _${ans.a}_`).join('\n');
  
  return `# PROMPT TEMPLATE: EXPERT CORE ARCHITECT 🚀

## 🎭 Role & Perspective:
You are an elite, world-class expert Prompt Architect specifically assigned to: "${initialIdea}"

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

// ==================== API ROUTES ====================

// 1. WORKSPACE CHAT ROUTE (/api/chat)
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid 'messages' array in request body." });
    }

    try {
      const formattedMessages = [
        {
          role: 'system' as const,
          content: 'You are PromptGlow AI, an expert AI assistant and prompt engineering master. Provide clear, concise, and structured answers. Do NOT output internal thoughts or <think> tags.'
        },
        ...messages.map((msg: any) => ({
          role: (msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
          content: msg.content
        }))
      ];

      const completion = await gemmaClient.chat.completions.create({
        model: MODEL_NAME,
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 2048,
      });

      const rawText = completion.choices[0]?.message?.content || 'No response generated.';
      const cleaned = stripThinking(rawText);
      return res.json({ text: cleaned, response: cleaned });
    } catch (apiErr: any) {
      console.warn("Using Sandbox Fallback for chat due to vLLM error:", apiErr.message || apiErr);
      const fallbackText = getChatFallback(messages);
      const cleanedFallback = stripThinking(fallbackText);
      return res.json({ text: cleanedFallback, response: cleanedFallback });
    }
  } catch (err: any) {
    console.error("Server Chat Error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// 2. PROMPT BUILDER: QUESTION GENERATOR (/api/prompt-builder/question)
app.post('/api/prompt-builder/question', async (req, res) => {
  try {
    const initialIdea = req.body.initialIdea || req.body.idea || "";
    const answers = req.body.answers || [];

    if (!initialIdea) {
      return res.status(400).json({ error: "Missing 'initialIdea' or 'idea'." });
    }

    try {
      const historyStr = answers.map((ans: any) => `Q: ${ans.q}\nA: ${ans.a}`).join('\n\n');

      const systemPrompt = `You are an expert Prompt Engineer AI Copilot. 
The user wants to write a highly optimized prompt starting from this raw idea: "${initialIdea}"

They have already provided these clarifications:
${historyStr}

Please generate ONE multiple-choice question to further clarify their intent, format, constraints, or tone.
Provide 3-5 distinct options for the question.

Respond ONLY with valid JSON in this exact structure:
{
  "question": "Question text here?",
  "options": ["Option A", "Option B", "Option C", "Option D"]
}`;

      const completion = await gemmaClient.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: "You are a JSON generator API. Return ONLY raw JSON with keys 'question' and 'options'. Do NOT wrap in markdown or output <think> tags." },
          { role: 'user', content: systemPrompt }
        ],
        temperature: 0.4,
      });

      let content = completion.choices[0]?.message?.content || '{}';
      content = stripThinking(content);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      const parsed = JSON.parse(jsonStr);

      return res.json({
        question: parsed.question || "What is the primary target audience or tone?",
        options: parsed.options || ["Professional", "Creative", "Technical", "Casual"],
        questions: parsed.questions || undefined
      });
    } catch (apiErr: any) {
      console.warn("Using Sandbox Fallback for prompt builder question:", apiErr.message || apiErr);
      const fallback = getPromptBuilderQuestionFallback(initialIdea, answers);
      return res.json(fallback);
    }
  } catch (err: any) {
    console.error("Server PromptBuilder Question Error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// 3. PROMPT BUILDER: FINAL PROMPT GENERATOR (/api/prompt-builder/final-prompt)
app.post('/api/prompt-builder/final-prompt', async (req, res) => {
  try {
    const initialIdea = req.body.initialIdea || req.body.idea || "";
    const answers = req.body.answers || [];

    if (!initialIdea) {
      return res.status(400).json({ error: "Missing 'initialIdea' or 'idea'." });
    }

    try {
      const historyStr = answers.map((ans: any) => `Q: ${ans.q}\nA: ${ans.a}`).join('\n\n');

      const systemPrompt = `You are a master prompt engineer. Write an extremely high quality, detailed prompt based on this initial idea and clarification context:
Initial idea: "${initialIdea}"
Context:
${historyStr}

The response must strictly contain only the generated prompt template. Do not output internal thoughts or <think> tags.`;

      const completion = await gemmaClient.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: 'You output ONLY the refined prompt itself directly. Do NOT output internal thoughts or <think> tags.' },
          { role: 'user', content: systemPrompt }
        ],
        temperature: 0.5,
      });

      const rawText = completion.choices[0]?.message?.content || '';
      const cleaned = stripThinking(rawText);
      if (!cleaned) throw new Error("Model returned empty text");

      return res.json({ text: cleaned, prompt: cleaned });
    } catch (apiErr: any) {
      console.warn("Using Sandbox Fallback for final prompt due to error:", apiErr.message || apiErr);
      const fallback = getPromptBuilderFinalPromptFallback(initialIdea, answers);
      const cleaned = stripThinking(fallback);
      return res.json({ text: cleaned, prompt: cleaned });
    }
  } catch (err: any) {
    console.error("Server Final Prompt Error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// 4. VISION REVERSE ENGINEERING (/api/vision)
app.post('/api/vision', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', aspectRatio = '16:9', resolution, prompt: userPrompt } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Missing 'imageBase64' field." });
    }

    const imageUrl = imageBase64.startsWith('data:') 
      ? imageBase64 
      : `data:${mimeType};base64,${imageBase64}`;

    try {
      const promptText = userPrompt || `Examine this image in detail. Detected aspect ratio: ${aspectRatio} (${resolution || 'standard'}).

Generate a master, highly detailed, production-ready image generation prompt designed to recreate this image across ANY modern AI tool (Midjourney, DALL-E 3, Flux, Stable Diffusion).

CRITICAL REQUIREMENT: Append the aspect ratio tag \`--ar ${aspectRatio}\` at the end of both the Master Prompt and Brief Prompt!

Format your response strictly in Markdown:

# Master Image Generation Prompt
\`\`\`text
[Complete, highly detailed universal prompt ending explicitly with --ar ${aspectRatio}]
\`\`\`

### Brief Tag-Dense Prompt
\`\`\`text
[Concise tag-dense version ending explicitly with --ar ${aspectRatio}]
\`\`\`

---

### Visual Analysis & Breakdown
- **Aspect Ratio & Dimensions**: ${aspectRatio}
- **Subject & Composition**: [Short explanation]
- **Style & Medium**: [Short explanation]
- **Color & Lighting**: [Short explanation]`;

      const completion = await gemmaClient.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI vision reverse-engineering copilot. Output the master prompt first in a code block with aspect ratio parameters (--ar ...), followed by the brief prompt and short breakdown. Do NOT output internal thoughts or <think> tags.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: promptText },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 1500,
      });

      const rawText = completion.choices[0]?.message?.content || '';
      const cleaned = stripThinking(rawText);

      return res.json({
        text: cleaned,
        masterPrompt: cleaned,
        briefPrompt: cleaned,
        visualBreakdown: cleaned
      });
    } catch (apiErr: any) {
      console.warn("Using Sandbox Fallback for vision due to error:", apiErr.message || apiErr);
      const fallback = getVisionFallback(aspectRatio);
      return res.json({
        text: fallback,
        masterPrompt: fallback,
        briefPrompt: fallback,
        visualBreakdown: fallback
      });
    }
  } catch (err: any) {
    console.error("Server Vision Error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// 5. TRANSCRIBE ROUTE (/api/transcribe)
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioBase64 } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: "Missing 'audioBase64' field." });
    }

    // Voice mode handles live Web Speech API in the browser; server endpoint returns sandbox payload if invoked
    return res.json({ text: "Voice input recorded successfully (sandbox mode)." });
  } catch (err: any) {
    console.error("Server Transcribe Error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default app;
