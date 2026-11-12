export function validatePrompt(prompt: string): { valid: boolean; error?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, error: "Prompt cannot be empty." };
  }
  if (prompt.length > 10000) {
    return { valid: false, error: "Prompt is too long (max 10,000 characters)." };
  }
  return { valid: true };
}

export function sanitizeOutput(text: string): string {
  if (!text) return "";
  return text
    .replace(/^(```(?:markdown)?\s*\n?)/i, "")
    .replace(/(\n?```\s*)$/i, "")
    .replace(/^\s*(\*\*?)?\s*Polished Prompt\s*:?\s*(\*\*?)?\s*/i, "")
    .replace(/^\s*Here is the polished prompt\s*:?\s*/i, "")
    .replace(/^\s*Rewritten Prompt\s*:?\s*/i, "")
    .replace(/^\s*Meta-Prompt\s*:?\s*/i, "")
    .replace(/^\s*Prompt\s*:?\s*/i, "")
    .trim();
}
