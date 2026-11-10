import { CONFIG } from '../config';
import type { Env, RateLimitResult } from '../types';

export class RateLimiter {
  constructor(private env: Env) {}

  async check(ip: string, limit: number = CONFIG.MAX_REQUESTS_PER_IP): Promise<RateLimitResult> {
    if (!this.env.PROMPT_KEYS) return { allowed: true };

    const now = Math.floor(Date.now() / 1000);
    const window = CONFIG.RATE_LIMIT_WINDOW;
    const bucket = Math.floor(now / window);
    const key = `ratelimit:${ip}:${bucket}`;

    const current = parseInt((await this.env.PROMPT_KEYS.get(key)) || '0', 10);

    if (current >= limit) {
      return {
        allowed: false,
        retryAfter: window - (now % window),
        error: 'Rate limit exceeded. Please slow down.'
      };
    }

    await this.env.PROMPT_KEYS.put(key, (current + 1).toString(), {
      expirationTtl: window * 2
    });

    return { allowed: true };
  }

  async blockIp(ip: string, duration: number = CONFIG.BLOCK_DURATION_SECONDS): Promise<void> {
    if (!this.env.PROMPT_KEYS) return;
    await this.env.PROMPT_KEYS.put(`blocked:${ip}`, '1', { expirationTtl: duration });
  }

  async isBlocked(ip: string): Promise<boolean> {
    if (!this.env.PROMPT_KEYS) return false;
    const blocked = await this.env.PROMPT_KEYS.get(`blocked:${ip}`);
    return blocked === '1';
  }
}
