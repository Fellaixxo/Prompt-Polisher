import { CONFIG } from './config';
import { verifyGumroadLicense } from './auth/gumroad';
import { RateLimiter } from './auth/rateLimiter';
import { getClientIP, validateUserAgent, getCompositeHash } from './auth/fingerprint';
import { polishPrompt } from './polish/polisher';
import { HTML_FRONTEND } from './handlers/frontend';
import type { Env, PolishResult } from './types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith('/api/')) {
      return handleApi(request, env);
    }

    return new Response(HTML_FRONTEND, {
      headers: { 'Content-Type': 'text/html' },
    });
  },
};

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/api/v1/polish' && request.method === 'POST') {
    return handlePolish(request, env);
  }

  if (path === '/api/v1/health') {
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handlePolish(request: Request, env: Env): Promise<Response> {
  try {
    const body: { prompt?: string; licenseKey?: string; deviceHash?: string } = await request.json();
    const prompt = body.prompt;
    const licenseKey = body.licenseKey;
    const deviceHash = body.deviceHash || 'unknown';

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const clientIP = await getClientIP(request);
    const rateLimiter = new RateLimiter(env);
    const rateLimit = await rateLimiter.check(clientIP);

    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({
        error: rateLimit.error || 'Rate limit exceeded'
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const uaCheck = validateUserAgent(request);
    if (!uaCheck.valid) {
      return new Response(JSON.stringify({ error: uaCheck.reason }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const compositeHash = await getCompositeHash(request, deviceHash);

    let isPro = false;

    if (licenseKey) {
      const licenseCheck = await verifyGumroadLicense(licenseKey, env);
      if (licenseCheck.status === 'valid') {
        isPro = true;
      } else {
        return new Response(JSON.stringify({
          error: licenseCheck.message || 'Invalid license key'
        }), {
          status: 402,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      const trialCheck = await checkFreeTrialEligibility(env, compositeHash, deviceHash, clientIP);
      if (!trialCheck.allowed) {
        return new Response(JSON.stringify({
          error: trialCheck.reason || 'Free trial limit reached'
        }), {
          status: 402,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const result: PolishResult = await polishPrompt(prompt, {}, env);

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!isPro) {
      await recordFreeUsage(env, compositeHash, deviceHash, clientIP);
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function checkFreeTrialEligibility(
  env: Env,
  compositeHash: string,
  deviceHash: string,
  ip: string
): Promise<{ allowed: boolean; reason?: string }> {
  if (!env.PROMPT_KEYS) return { allowed: true };

  const ipCount = parseInt((await env.PROMPT_KEYS.get(`trial_ip:${ip}`)) || '0', 10);
  if (ipCount >= CONFIG.IP_TRIAL_LIMIT) {
    return { allowed: false, reason: 'Free trial limit reached for this network.' };
  }

  const deviceCount = parseInt((await env.PROMPT_KEYS.get(`trial_dev:${deviceHash}`)) || '0', 10);
  if (deviceCount >= CONFIG.FREE_PROMPTS) {
    return { allowed: false, reason: 'Free trial limit reached for this device.' };
  }

  const comboCount = parseInt((await env.PROMPT_KEYS.get(`trial_combo:${compositeHash}`)) || '0', 10);
  if (comboCount >= CONFIG.FREE_PROMPTS) {
    return { allowed: false, reason: 'Free trial limit reached.' };
  }

  return { allowed: true };
}

async function recordFreeUsage(
  env: Env,
  compositeHash: string,
  deviceHash: string,
  ip: string
): Promise<void> {
  if (!env.PROMPT_KEYS) return;

  const ipKey = `trial_ip:${ip}`;
  const devKey = `trial_dev:${deviceHash}`;
  const comboKey = `trial_combo:${compositeHash}`;

  const ipCount = parseInt((await env.PROMPT_KEYS.get(ipKey)) || '0', 10);
  const devCount = parseInt((await env.PROMPT_KEYS.get(devKey)) || '0', 10);
  const comboCount = parseInt((await env.PROMPT_KEYS.get(comboKey)) || '0', 10);

  await env.PROMPT_KEYS.put(ipKey, (ipCount + 1).toString(), { expirationTtl: CONFIG.TRIAL_TTL_SECONDS });
  await env.PROMPT_KEYS.put(devKey, (devCount + 1).toString(), { expirationTtl: CONFIG.TRIAL_TTL_SECONDS });
  await env.PROMPT_KEYS.put(comboKey, (comboCount + 1).toString(), { expirationTtl: CONFIG.TRIAL_TTL_SECONDS });
}
