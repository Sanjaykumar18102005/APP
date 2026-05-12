import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (!aiClient) {
    let key = import.meta.env.VITE_GEMINI_API_KEY;
    
    // Fallback for AI Studio environment where process.env is injected
    if (!key && typeof process !== 'undefined' && process.env) {
      key = (process.env as any).GEMINI_API_KEY;
    }

    if (!key) {
      throw new Error('VITE_GEMINI_API_KEY environment variable is missing. If you are hosting on Netlify, please add it to your site settings.');
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}
