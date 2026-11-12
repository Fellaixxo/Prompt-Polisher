import { CONFIG } from './config';
import { verifyGumroadLicense } from './auth/gumroad';
import { RateLimiter, checkFreeTrialEligibility, recordFreeUsage } from './auth/rateLimiter';
import { getClientIP, validateUserAgent, getCompositeFingerprint } from './auth/fingerprint';
import { polishPrompt } from './polish/polisher';
import { validatePrompt, sanitizeOutput } from './polish/sanitizer';
import { HTML_FRONTEND } from './handlers/frontend';
import { Env, PolishRequest } from './types';

const rateLimiter = new RateLimiter();

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimit = await rateLimiter.check(env, clientIP, CONFIG.MAX_REQUESTS_PER_IP, CONFIG.RATE_LIMIT_WINDOW);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: rateLimit.error }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }

    // User agent check
    const uaCheck = validateUserAgent(request);
    if (!uaCheck.valid) {
      return new Response(JSON.stringify({ error: uaCheck.reason }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // API route
    if (path.startsWith('/api/v1/polish') && request.method === 'POST') {
      return await handlePolish(request, env);
    }

    // Frontend
    return new Response(HTML_FRONTEND, { headers: { 'Content-Type': 'text/html' } });
  }
};

async function handlePolish(request: Request, env: Env): Promise<Response> {
  try {
    const body: PolishRequest = await request.json();
    const { prompt, licenseKey, deviceHash = 'unknown' } = body;

    // Validate
    const validation = validatePrompt(prompt);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Check license
    let isPro = false;
    let remainingPrompts = CONFIG.FREE_PROMPTS;

    if (licenseKey) {
      const licenseCheck = await verifyGumroadLicense(licenseKey);
      if (licenseCheck.status === 'valid') {
        isPro = true;
        remainingPrompts = CONFIG.PRO_PROMPTS;
      }
    }

    // Get fingerprint
    const compositeHash = await getCompositeFingerprint(request, deviceHash);
    const clientIP = getClientIP(request);

    // Check trial
    if (!isPro) {
      const trialCheck = await checkFreeTrialEligibility(env, compositeHash, deviceHash, clientIP);
      if (!trialCheck.allowed) {
        return new Response(JSON.stringify({ error: trialCheck.reason }), { status: 402, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Polish
    const result = await polishPrompt(prompt, { isPro }, env);
    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Record usage
    if (!isPro) {
      await recordFreeUsage(env, compositeHash, deviceHash, clientIP);
    }

    return new Response(JSON.stringify({
      success: true,
      polished: sanitizeOutput(result.polished || ''),
      metadata: result.metadata,
      remainingPrompts
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
// Bump: 20261112131913
// Bump: 1794494994
