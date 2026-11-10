import { CONFIG } from '../config';
import type { Env } from '../types';

// SERVER-SIDE ONLY - No browser APIs
export async function getClientIP(request: Request): Promise<string> {
  return request.headers.get('cf-connecting-ip') || '0.0.0.0';
}

export function validateUserAgent(request: Request): { valid: boolean; reason?: string } {
  const ua = request.headers.get('user-agent') || '';
  const uaLower = ua.toLowerCase();

  if (!ua || ua.length < 20) {
    return { valid: false, reason: 'Browser identification required.' };
  }

  const blocked = [
    'headlesschrome', 'phantomjs', 'selenium', 'puppeteer', 'playwright',
    'cypress', 'webdriver', 'slimerjs', 'zombie', 'curl', 'wget',
    'python-requests', 'scrapy', 'httpclient', 'java/', 'libwww-perl',
    'go-http-client'
  ];

  if (blocked.some(sig => uaLower.includes(sig))) {
    return { valid: false, reason: 'Automated clients are not permitted.' };
  }

  return { valid: true };
}

// Server-side hash using only request headers
export async function getCompositeHash(
  request: Request,
  deviceHash: string
): Promise<string> {
  const ip = getClientIP(request);
  const ua = request.headers.get('user-agent') || '';
  const lang = request.headers.get('accept-language') || '';
  const country = request.headers.get('cf-ipcountry') || '';
  const accept = request.headers.get('accept') || '';
  const secUa = request.headers.get('sec-ch-ua') || '';
  const platform = request.headers.get('sec-ch-ua-platform') || '';

  const raw = [ip, ua, lang, country, accept, secUa, platform, deviceHash].join('|');
  return await sha256(raw);
}

async function sha256(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// This will be called from frontend and passed to backend
export async function getCompositeFingerprint(
  request: Request,
  deviceHash: string
): Promise<string> {
  return await getCompositeHash(request, deviceHash);
}
