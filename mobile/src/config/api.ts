// PromptGlow Mobile API Configuration
export const API_BASE_URL = 'https://promptglow-web-backend.onrender.com';

export function getApiUrl(path: string): string {
  const normalizedBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
