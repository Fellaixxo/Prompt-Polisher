export interface Env {
  PROMPT_KEYS: KVNamespace;
  AI: any;
  GUMROAD_SECRET?: string;
}

export interface RequestContext {
  request: Request;
  env: Env;
  clientIP: string;
  userAgent: string;
}

export interface PolishingOptions {
  strategy?: 'balanced' | 'creative' | 'technical' | 'concise' | 'detailed';
  tone?: string;
  audience?: string;
  length?: string;
}

export interface PolishResult {
  success: boolean;
  polished?: string;
  error?: string;
  metadata?: {
    model: string;
    tokens: number;
    processingTime: number;
  };
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  error?: string;
}

export interface TrialResult {
  allowed: boolean;
  reason?: string;
}

// Gumroad API response types
export interface GumroadPurchase {
  email: string;
  id: string;
}

export interface GumroadLicense {
  id: string;
  product_permalink: string;
}

export interface GumroadResponse {
  success: boolean;
  message?: string;
  purchase?: GumroadPurchase;
  license?: GumroadLicense;
}
