export const CONFIG = {
  FREE_PROMPTS: 2,
  PRO_PROMPTS: 600,
  TRIAL_TTL_SECONDS: 60 * 24 * 60 * 60,
  PRO_TTL_SECONDS: 90 * 24 * 60 * 60,
  RATE_LIMIT_WINDOW: 60,
  MAX_REQUESTS_PER_IP: 10,
  MAX_FAILED_KEY_ATTEMPTS: 5,
  BLOCK_DURATION_SECONDS: 3600,
  IP_TRIAL_LIMIT: 3,
  GUMROAD_PERMALINK: "xpmzi",
  PAYMENT_LINK: "https://felixjude.gumroad.com/l/xpmzi",
  AI_MODELS: [
    "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    "@cf/qwen/qwen2.5-72b-instruct",
    "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b"
  ]
};
