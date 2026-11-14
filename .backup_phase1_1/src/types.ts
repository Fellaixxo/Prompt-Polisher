export interface Env {
  PROMPT_KEYS: KVNamespace;
  AI: any;
}

export interface PolishRequest {
  prompt: string;
  licenseKey?: string;
  deviceHash?: string;
}

export interface PolishResponse {
  success: boolean;
  polished?: string;
  error?: string;
  metadata?: { model: string; tokens: number; processingTime: number };
  remainingPrompts?: number;
}
