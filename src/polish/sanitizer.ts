export function validatePrompt(prompt: string): { valid: boolean; error?: string } {
  if (!prompt || prompt.trim().length === 0) return { valid: false, error: "Prompt cannot be empty." };
  if (prompt.length > 10000) return { valid: false, error: "Prompt is too long (max 10,000 characters)." };
  return { valid: true };
}

// Strip XML-envelope tags a user might inject to break out of the SOP placeholders.
export function neutralizeTags(s: string): string {
  return (s || "")
    .replace(/<\/?(raw_user_prompt|optional_user_context|available_sources)>/gi, "")
    .slice(0, 10000);
}

// Clean a single free-text field coming from the model (untrusted): remove code fences,
// preamble labels, and system-prompt-leak tails. Applied to polished_prompt and list items.
export function cleanField(text: string): string {
  if (!text || typeof text !== "string") return "";
  let clean = text
    .replace(/^```(?:json|markdown)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .replace(/^\s*(\*\*?)?\s*(Polished Prompt|Rewritten Prompt|Meta-Prompt|Here is the polished prompt)\s*:?\s*(\*\*?)?\s*/i, "")
    .trim();
  const leak = /(?:\n|^)\s*(?:Why\s+This\s+Works?|Explanation|Reasoning|System\s+(?:Instructions?|Prompt)|Notes?)\s*:?[\s\S]*$/i;
  clean = clean.replace(leak, "").trim();
  return clean.slice(0, 8000);
}

export function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string").map((x) => cleanField(x)).filter((x) => x.length > 0).slice(0, 12);
}

// Robustly extract the outer JSON object from a model response (handles ``` fences, prose, trailing commas).
export function extractJson(raw: string): unknown | null {
  if (!raw || typeof raw !== "string") return null;
  let t = raw.replace(/```(?:json)?/gi, "").trim();
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  t = t.slice(first, last + 1);
  try { return JSON.parse(t); } catch { /* fall through to repair */ }
  const repaired = t.replace(/,\s*([}\]])/g, "$1");
  try { return JSON.parse(repaired); } catch { return null; }
}
