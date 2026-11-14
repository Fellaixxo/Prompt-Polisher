import { CONFIG } from './config';
import { verifyGumroadLicense } from './auth/gumroad';
import { RateLimiter, checkFreeTrialEligibility, recordFreeUsage } from './auth/rateLimiter';
import { getClientIP, validateUserAgent, getCompositeFingerprint } from './auth/fingerprint';
import { polishPrompt } from './polish/polisher';
import { validatePrompt } from './polish/sanitizer';
import { HTML_FRONTEND } from './handlers/frontend';
import { Env, PolishRequest } from './types';

const rateLimiter = new RateLimiter();

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  // No third-party, no eval. Inline script/style only (self-contained UI). Phase 2 -> Static Assets drops 'unsafe-inline'.
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
};
const JSON_HEADERS = { ...SECURITY_HEADERS, 'Content-Type': 'application/json' };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const clientIP = getClientIP(request);

    if (request.method === 'POST' && path.startsWith('/api')) {
      const rl = await rateLimiter.check(env, clientIP, CONFIG.MAX_REQUESTS_PER_IP, CONFIG.RATE_LIMIT_WINDOW);
      if (!rl.allowed) return new Response(JSON.stringify({ error: rl.error }), { status: 429, headers: JSON_HEADERS });
      const ua = validateUserAgent(request);
      if (!ua.valid) return new Response(JSON.stringify({ error: ua.reason }), { status: 403, headers: JSON_HEADERS });
      if (path === '/api/v1/polish') return handlePolish(request, env);
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: JSON_HEADERS });
    }

    if (request.method === 'GET') return new Response(HTML_FRONTEND, { headers: { ...SECURITY_HEADERS, 'Content-Type': 'text/html;charset=UTF-8' } });
    return new Response('Method not allowed', { status: 405 });
  }
};

async function handlePolish(request: Request, env: Env): Promise<Response> {
  try {
    const body: PolishRequest = await request.json();
    const { prompt, licenseKey, deviceHash = 'unknown', context = '' } = body;

    const validation = validatePrompt(prompt);
    if (!validation.valid) return new Response(JSON.stringify({ error: validation.error }), { status: 400, headers: JSON_HEADERS });

    const compositeHash = await getCompositeFingerprint(request, deviceHash);
    const clientIP = getClientIP(request);

    let isPro = false;
    let remainingPrompts = CONFIG.FREE_PROMPTS;

    if (licenseKey) {
      const kvKey = 'key:' + licenseKey;
      let keyData: { usageCount: number; maxLimit: number; email?: string } | null = null;
      if (env.PROMPT_KEYS) {
        const raw = await env.PROMPT_KEYS.get(kvKey);
        if (raw) { try { keyData = JSON.parse(raw); } catch { keyData = null; } }
      }
      if (!keyData) {
        const g = await verifyGumroadLicense(licenseKey);
        if (g.status === 'valid') {
          keyData = { usageCount: 0, maxLimit: CONFIG.PRO_PROMPTS, email: g.email };
          if (env.PROMPT_KEYS) await env.PROMPT_KEYS.put(kvKey, JSON.stringify(keyData), { expirationTtl: CONFIG.PRO_TTL_SECONDS });
        } else if (g.status === 'invalid') {
          return new Response(JSON.stringify({ error: 'Invalid or expired license key.' }), { status: 401, headers: JSON_HEADERS });
        } else {
          return new Response(JSON.stringify({ error: 'Payment provider unreachable. Try again shortly.' }), { status: 503, headers: JSON_HEADERS });
        }
      }
      if (keyData) {
        if (keyData.usageCount >= keyData.maxLimit)
          return new Response(JSON.stringify({ error: 'Your 600-prompt allowance is exhausted. Renew to continue.' }), { status: 402, headers: JSON_HEADERS });
        keyData.usageCount += 1;
        remainingPrompts = keyData.maxLimit - keyData.usageCount;
        if (env.PROMPT_KEYS) await env.PROMPT_KEYS.put(kvKey, JSON.stringify(keyData), { expirationTtl: CONFIG.PRO_TTL_SECONDS });
        isPro = true;
      }
    }

    if (!isPro) {
      const trial = await checkFreeTrialEligibility(env, compositeHash, deviceHash, clientIP);
      if (!trial.allowed) return new Response(JSON.stringify({ error: trial.reason }), { status: 402, headers: JSON_HEADERS });
      await recordFreeUsage(env, compositeHash, deviceHash, clientIP);
      const used = parseInt((await env.PROMPT_KEYS?.get('trial_combo:' + compositeHash)) || '0', 10);
      remainingPrompts = Math.max(0, CONFIG.FREE_PROMPTS - used);
    }

    const result = await polishPrompt(prompt, { isPro }, env, context);
    if (!result.success || !result.result)
      return new Response(JSON.stringify({ error: result.error || 'Polish failed.' }), { status: 500, headers: JSON_HEADERS });

    return new Response(JSON.stringify({
      success: true, ...result.result, remainingPrompts, metadata: result.metadata
    }), { headers: JSON_HEADERS });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: JSON_HEADERS });
  }
}
