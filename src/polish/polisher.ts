import { CONFIG, SYSTEM_PROMPT } from '../config';
import { sanitizeOutput, validatePrompt } from './sanitizer';
import type { Env, PolishResult, PolishingOptions } from '../types';

export async function polishPrompt(
  prompt: string,
  options: PolishingOptions = {},
  env: Env
): Promise<PolishResult> {
  const validation = validatePrompt(prompt);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const fullPrompt = `${SYSTEM_PROMPT}\n\n<user_prompt>${prompt}</user_prompt>`;
    const response = await callAIModel(fullPrompt, env);
    const polished = sanitizeOutput(response);

    const result: PolishResult = {
      success: true,
      polished,
      metadata: {
        model: CONFIG.AI_MODELS[0],
        tokens: estimateTokens(polished),
        processingTime: Date.now() - Date.now(), // Will be updated
      },
    };

    return result;
  } catch (error: any) {
    return { success: false, error: `AI processing error: ${error.message}` };
  }
}

async function callAIModel(prompt: string, env: Env): Promise<string> {
  for (const model of CONFIG.AI_MODELS) {
    try {
      const response = await env.AI.run(model, {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      });
      return response;
    } catch (error) {
      console.warn(`Model ${model} failed, trying next...`, error);
      continue;
    }
  }
  throw new Error('All AI models failed');
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
