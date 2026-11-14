export interface Env {
  PROMPT_KEYS: KVNamespace;
  AI: any;
}
export interface PolishRequest {
  prompt: string;
  licenseKey?: string;
  deviceHash?: string;
  context?: string;
}
export type PolishStatus = 'polished' | 'needs_clarification' | 'unsafe_or_unsupported';
export interface PolishStructured {
  status: PolishStatus;
  detected_domain: string;
  task_type: string;
  confidence: number;
  assumptions: string[];
  clarifying_questions: string[];
  polished_prompt: string;
  why_this_works: string[];
  optional_upgrades: string[];
  safety_notes: string[];
}
export interface PolishResponse {
  success: boolean;
  result?: PolishStructured;
  error?: string;
  metadata?: { model: string; tokens: number; processingTime: number };
  remainingPrompts?: number;
}
