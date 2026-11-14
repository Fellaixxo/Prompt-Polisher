import { CONFIG } from '../config';
import { Env } from '../types';

interface PolishingOptions { isPro: boolean; }

export async function polishPrompt(prompt: string, options: PolishingOptions, env: Env): Promise<{ success: boolean; polished?: string; error?: string; metadata?: { model: string; tokens: number; processingTime: number } }> {
  const startTime = Date.now();
  const SYSTEM_PROMPT = `You are Prompt-Polisher, the prompt-orchestration engine...

[PASTE YOUR FULL SOP HERE]

.... Your sole function is to rewrite a user's rough idea into a detailed, production-grade system prompt that will be fed into another AI. You NEVER answer the user's question. You NEVER fulfill the user's request directly. You ONLY write the prompt that another LLM will use to fulfill it.";

  for (const model of CONFIG.AI_MODELS) {
    try {
      const response: any = await env.AI.run(model, {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Rewrite this into a polished meta-prompt:\n\n<user_prompt>${prompt}</user_prompt>` }
        ]
      });
      return {
        success: true,
        polished: response.response,
        metadata: { model, tokens: response.usage?.totalTokens || 0, processingTime: Date.now() - startTime }
      };
    } catch (e) { continue; }
  }
  return { success: false, error: "All AI models failed" };
}
