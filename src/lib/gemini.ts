import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (!aiClient) {
    let key = import.meta.env.VITE_GEMINI_API_KEY;
    
    // In some environments (like AI Studio or custom Vite configs), 
    // process.env.GEMINI_API_KEY might be available.
    if (!key && typeof process !== 'undefined' && process.env) {
      key = (process.env as any).GEMINI_API_KEY || (process.env as any).VITE_GEMINI_API_KEY;
    }

    if (!key) {
      throw new Error('VITE_GEMINI_API_KEY environment variable is missing. Please add it to your Netlify Environment Variables.');
    }
    
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}
