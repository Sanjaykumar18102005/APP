import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanOutput(text: string): string {
  if (!text) return "";
  let cleaned = text;

  // 1. If text contains closing </think> tag, everything up to and including the last </think> tag is thought process
  if (cleaned.includes("</think>")) {
    cleaned = cleaned.substring(cleaned.lastIndexOf("</think>") + 8);
  }

  // 2. Remove any remaining <think>...</think> blocks or unclosed <think> tags
  cleaned = cleaned.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '');

  // 3. Remove residual reasoning step blocks like "7. **Final Output Generation:**" or "* No thinking tags"
  cleaned = cleaned.replace(/^[\s\S]*?(?=(?:Act as|Create|Write|Design|A |An |You are|# |\*\*|Imagine|Generate|Given|Build))/i, (match) => {
    if (/No thinking|Output Generation|thinking tags|step \d/i.test(match)) {
      return "";
    }
    return match;
  });

  // 4. Clean leading/trailing quotes, dots, or stray whitespace
  cleaned = cleaned.trim();
  cleaned = cleaned.replace(/^["'.\s]+/, '');

  return cleaned.trim();
}

export function getApiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_BASE_URL || "").trim();
  if (base) {
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
  }
  return path;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

import { auth } from './firebase';

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
