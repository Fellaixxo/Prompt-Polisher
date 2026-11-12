import { CONFIG } from '../config';
import { Env } from '../types';

export class RateLimiter {
  async check(env: Env, identifier: string, limit: number, windowSeconds: number = CONFIG.RATE_LIMIT_WINDOW): Promise<{ allowed: boolean; retryAfter?: number; error?: string }> {
    if (!env.PROMPT_KEYS) return { allowed: true };
    const now = Math.floor(Date.now() / 1000);
    const bucket = Math.floor(now / windowSeconds);
    const kvKey = `ratelimit:${identifier}:${bucket}`;
    const current = parseInt(await env.PROMPT_KEYS.get(kvKey) || "0", 10);
    if (current >= limit) {
      return { allowed: false, retryAfter: windowSeconds - (now % windowSeconds), error: "Rate limit exceeded." };
    }
    await env.PROMPT_KEYS.put(kvKey, (current + 1).toString(), { expirationTtl: windowSeconds * 2 });
    return { allowed: true };
  }
}

export async function checkFreeTrialEligibility(env: Env, compositeHash: string, deviceHash: string, ip: string): Promise<{ allowed: boolean; reason?: string }> {
  if (!env.PROMPT_KEYS) return { allowed: false, reason: "Service unavailable for free tier." };
  const ipCount = parseInt(await env.PROMPT_KEYS.get(`trial_ip:${ip}`) || "0", 10);
  if (ipCount >= CONFIG.IP_TRIAL_LIMIT) return { allowed: false, reason: "Free trial limit reached for this network." };
  const deviceCount = parseInt(await env.PROMPT_KEYS.get(`trial_dev:${deviceHash}`) || "0", 10);
  if (deviceCount >= CONFIG.FREE_PROMPTS) return { allowed: false, reason: "Free trial limit reached for this device." };
  const comboCount = parseInt(await env.PROMPT_KEYS.get(`trial_combo:${compositeHash}`) || "0", 10);
  if (comboCount >= CONFIG.FREE_PROMPTS) return { allowed: false, reason: "Free trial limit reached." };
  return { allowed: true };
}

export async function recordFreeUsage(env: Env, compositeHash: string, deviceHash: string, ip: string): Promise<void> {
  if (!env.PROMPT_KEYS) return;
  await env.PROMPT_KEYS.put(`trial_ip:${ip}`, (parseInt(await env.PROMPT_KEYS.get(`trial_ip:${ip}`) || "0", 10) + 1).toString(), { expirationTtl: CONFIG.TRIAL_TTL_SECONDS });
  await env.PROMPT_KEYS.put(`trial_dev:${deviceHash}`, (parseInt(await env.PROMPT_KEYS.get(`trial_dev:${deviceHash}`) || "0", 10) + 1).toString(), { expirationTtl: CONFIG.TRIAL_TTL_SECONDS });
  await env.PROMPT_KEYS.put(`trial_combo:${compositeHash}`, (parseInt(await env.PROMPT_KEYS.get(`trial_combo:${compositeHash}`) || "0", 10) + 1).toString(), { expirationTtl: CONFIG.TRIAL_TTL_SECONDS });
}
