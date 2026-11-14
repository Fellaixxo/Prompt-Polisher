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
    const clientIP = getClientIP(request);

    // SECURITY HEADERS (Restored from monolith, updated for Tailwind CDN)
    const securityHeaders = {
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
      "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
    };

    // RATE LIMITING (Apply only to POST /api to prevent GET blank-page bugs)
    if (request.method === 'POST' && path.startsWith('/api')) {
      const rl = await rateLimiter.check(env, clientIP, CONFIG.MAX_REQUESTS_PER_IP, CONFIG.RATE_LIMIT_WINDOW);
      if (!rl.allowed) {
        return new Response(JSON.stringify({ error: rl.error }), { 
          status: 429, 
          headers: { ...securityHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      const uaCheck = validateUserAgent(request);
      if (!uaCheck.valid) {
        return new Response(JSON.stringify({ error: uaCheck.reason }), { 
          status: 403, 
          headers: { ...securityHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    // API ROUTE
    if (path === '/api/v1/polish' && request.method === 'POST') {
      return await handlePolish(request, env, securityHeaders);
    }

    // FRONTEND (Serve HTML with security headers)
    return new Response(HTML_FRONTEND, { 
      headers: { ...securityHeaders, 'Content-Type': 'text/html;charset=UTF-8' } 
    });
  }
};

async function handlePolish(request: Request, env: Env, baseHeaders: Record<string, string>): Promise<Response> {
  try {
    const body: PolishRequest = await request.json();
    const { prompt, licenseKey, deviceHash = 'unknown' } = body;

    const validation = validatePrompt(prompt);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), { 
        status: 400, 
        headers: { ...baseHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const compositeHash = await getCompositeFingerprint(request, deviceHash);
    const clientIP = getClientIP(request);
    
    let isPro = false;
    let remainingPrompts = CONFIG.FREE_PROMPTS;

    // --- PRO LICENSE METERING (Basic KV Implementation) ---
    if (licenseKey) {
      const kvKey = `key:${licenseKey}`;
      let keyData = null;
      
      if (env.PROMPT_KEYS) {
        const raw = await env.PROMPT_KEYS.get(kvKey);
        if (raw) {
          try { keyData = JSON.parse(raw); } catch(e) {}
        }
      }

      // If not cached in KV, verify with Gumroad and cache
      if (!keyData) {
        const gumroadResult = await verifyGumroadLicense(licenseKey);
        if (gumroadResult.status === 'valid') {
          keyData = { usageCount: 0, maxLimit: CONFIG.PRO_PROMPTS, email: gumroadResult.email };
          if (env.PROMPT_KEYS) {
            await env.PROMPT_KEYS.put(kvKey, JSON.stringify(keyData), { expirationTtl: CONFIG.PRO_TTL_SECONDS });
          }
        } else if (gumroadResult.status === 'invalid') {
          return new Response(JSON.stringify({ error: "Invalid License Key." }), { 
            status: 401, 
            headers: { ...baseHeaders, 'Content-Type': 'application/json' } 
          });
        } else {
          return new Response(JSON.stringify({ error: "Payment provider unreachable." }), { 
            status: 503, 
            headers: { ...baseHeaders, 'Content-Type': 'application/json' } 
          });
        }
      }

      if (keyData) {
        if (keyData.usageCount >= keyData.maxLimit) {
           return new Response(JSON.stringify({ error: "Pro allowance exhausted. Please renew." }), { 
             status: 402, 
             headers: { ...baseHeaders, 'Content-Type': 'application/json' } 
           });
        }
        keyData.usageCount += 1;
        remainingPrompts = keyData.maxLimit - keyData.usageCount;
        
        if (env.PROMPT_KEYS) {
          await env.PROMPT_KEYS.put(kvKey, JSON.stringify(keyData), { expirationTtl: CONFIG.PRO_TTL_SECONDS });
        }
        isPro = true;
      }
    }

    // --- FREE TIER ENFORCEMENT (Server-Side) ---
    if (!isPro) {
      const trialCheck = await checkFreeTrialEligibility(env, compositeHash, deviceHash, clientIP);
      if (!trialCheck.allowed) {
        return new Response(JSON.stringify({ error: trialCheck.reason }), { 
          status: 402, 
          headers: { ...baseHeaders, 'Content-Type': 'application/json' } 
        });
      }
      await recordFreeUsage(env, compositeHash, deviceHash, clientIP);
    }

    // POLISH
    const result = await polishPrompt(prompt, { isPro }, env);
    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), { 
        status: 500, 
        headers: { ...baseHeaders, 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({
      success: true,
      polished: sanitizeOutput(result.polished || ''),
      metadata: result.metadata,
      remainingPrompts: isPro ? remainingPrompts : Math.max(0, CONFIG.FREE_PROMPTS - (parseInt(await env.PROMPT_KEYS?.get(`trial_combo:${compositeHash}`) || '0', 10)))
    }), { 
      headers: { ...baseHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500, 
      headers: { ...baseHeaders, 'Content-Type': 'application/json' } 
    });
  }
}
