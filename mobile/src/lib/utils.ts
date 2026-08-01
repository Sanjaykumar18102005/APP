export function cleanOutput(text: string): string {
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

export function getApiUrl(path: string): string {
  const base = "https://promptglow-web-backend.onrender.com";
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
