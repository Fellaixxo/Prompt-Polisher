export function getClientIP(request: Request): string {
  return request.headers.get("cf-connecting-ip") || "0.0.0.0";
}

export function validateUserAgent(request: Request): { valid: boolean; reason?: string } {
  const ua = request.headers.get("user-agent") || "";
  const uaLower = ua.toLowerCase();
  if (!ua) {
    return { valid: false, reason: "Browser identification required." };
  }
  const blocked = [
    "headlesschrome", "phantomjs", "selenium", "puppeteer", "playwright",
    "cypress", "webdriver", "slimerjs", "zombie", "curl", "wget", "python-requests",
    "scrapy", "httpclient", "java/", "libwww-perl", "go-http-client"
  ];
  if (blocked.some(sig => uaLower.includes(sig))) {
    return { valid: false, reason: "Automated clients are not permitted." };
  }
  return { valid: true };
}

export async function getCompositeFingerprint(request: Request, deviceHash: string): Promise<string> {
  const ip = getClientIP(request);
  const ua = request.headers.get("user-agent") || "";
  const lang = request.headers.get("accept-language") || "";
  const country = request.headers.get("cf-ipcountry") || "";
  const accept = request.headers.get("accept") || "";
  const secUa = request.headers.get("sec-ch-ua") || "";
  const platform = request.headers.get("sec-ch-ua-platform") || "";
  const raw = [ip, ua, lang, country, accept, secUa, platform, deviceHash].join("|");
  const buf = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}
