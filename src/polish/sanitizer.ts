export function sanitizeOutput(text: string): string {
  if (!text) return '';

  let clean = text
    .replace(/^(```(?:markdown)?\s*\n?)/i, '')
    .replace(/(\n?```\s*)$/i, '')
    .replace(/^\s*(\*\*?)?\s*Polished Prompt\s*:?\s*(\*\*?)?\s*/i, '')
    .replace(/^\s*Here is the polished prompt\s*:?\s*/i, '')
    .replace(/^\s*Rewritten Prompt\s*:?\s*/i, '')
    .replace(/^\s*Meta-Prompt\s*:?\s*/i, '')
    .replace(/^\s*Prompt\s*:?\s*/i, '');

  const leakPatterns = [
    /(?:\n|\r|^)\s*(?:Why\s+This\s+Works?|Explanation|Reasoning|System\s+(?:Instructions?|Prompt)|How\s+This\s+Works?|Notes?)\s*:?[\s\S]*$/i,
    /(?:\n|\r|^)\s*---\s*\n\s*(?:Why|Explanation|Reasoning|System|Note)\s*:?\s*[\s\S]*$/i,
    /(?:\n|\r|^)\s*(?:P\.S\.|Postscript|Disclaimer)\s*:?[\s\S]*$/i,
  ];

  for (const pattern of leakPatterns) {
    clean = clean.replace(pattern, '');
  }

  return clean.trim();
}

export function validatePrompt(prompt: string): { valid: boolean; error?: string } {
  if (!prompt || typeof prompt !== 'string') {
    return { valid: false, error: 'Prompt is required' };
  }

  const trimmed = prompt.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Prompt cannot be empty' };
  }

  if (trimmed.length > 10000) {
    return { valid: false, error: 'Prompt too long (max 10,000 characters)' };
  }

  if (/<script|javascript:|onerror=|onload=|eval\(/i.test(trimmed)) {
    return { valid: false, error: 'Invalid characters detected' };
  }

  return { valid: true };
}
