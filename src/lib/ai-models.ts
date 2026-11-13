/**
 * Nexa AI module — the model catalog for the admin assistant.
 *
 * Every hosted model runs through ONE OpenRouter account (OPENROUTER_API_KEY),
 * so there is one balance instead of a separate sign-in per provider. Models
 * "on the rack" are the self-hosted ones; they are optional and the hosted
 * models never depend on the rack being online.
 *
 * Prices are OpenRouter list prices in USD per 1M tokens (checked 2026-11-13).
 * The customer is charged list price x AI_MARKUP.
 */
export type AiModel = {
  key: string;            // what the client sends
  slug: string;           // OpenRouter model id (or the rack's model name)
  label: string;
  short: string;          // for the header pill on a phone
  group: 'recommended' | 'more' | 'rack';
  best: string;           // one-line "use this for"
  in: number;             // $ per 1M input tokens
  out: number;            // $ per 1M output tokens
  vision: boolean;
};

export const AI_MARKUP = Number(process.env.AI_MARKUP || 1.6);
export const DEFAULT_MODEL = 'haiku';

export const HOSTED_MODELS: AiModel[] = [
  { key: 'haiku', slug: 'anthropic/claude-haiku-5.5', label: 'Claude Haiku 5.5', short: 'Fast', group: 'recommended',
    best: 'Fast and low cost. Good for everyday questions and quick lookups.', in: 0.10, out: 0.50, vision: true },
  { key: 'sonnet', slug: 'anthropic/claude-sonnet-5.5', label: 'Claude Sonnet 5.5', short: 'Smart', group: 'recommended',
    best: 'Smarter. Use it for estimates, letters and jobs with several steps.', in: 2, out: 10, vision: true },
  { key: 'opus', slug: 'anthropic/claude-opus-5.5', label: 'Claude Opus 5.5', short: 'Expert', group: 'recommended',
    best: 'The strongest. Use it for hard bids and big decisions. Costs the most.', in: 4, out: 20, vision: true },
  { key: 'gpt', slug: 'openai/gpt-5.6-terra', label: 'GPT-5.6 Terra', short: 'GPT', group: 'more',
    best: 'OpenAI’s all-round model. A second opinion on writing and numbers.', in: 2, out: 12, vision: true },
  { key: 'gemini', slug: 'google/gemini-3.8-flash', label: 'Gemini 3.8 Flash', short: 'Gemini', group: 'more',
    best: 'Google’s fast model. Good with photos and long documents.', in: 0.83, out: 4.13, vision: true },
  { key: 'grok', slug: 'x-ai/grok-4.7', label: 'Grok 4.7', short: 'Grok', group: 'more',
    best: 'xAI’s model. Direct answers and current events.', in: 2, out: 6, vision: true },
  { key: 'deepseek', slug: 'deepseek/deepseek-v4.1-flash', label: 'DeepSeek V4.1 Flash', short: 'DeepSeek', group: 'more',
    best: 'Very low cost. Fine for simple questions.', in: 0.30, out: 1.20, vision: true },
];

export function hostedModel(key: unknown): AiModel | null {
  if (typeof key !== 'string') return null;
  return HOSTED_MODELS.find((m) => m.key === key) || null;
}

/** Rack (self-hosted) connection. Optional: unset = the rack tab shows "not connected". */
export function rackConfig(): { url: string; token: string } | null {
  const url = process.env.RACK_AI_URL;
  const token = process.env.RACK_AI_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

/** Fallback price when OpenRouter does not report a cost for the request. */
export function estimateCost(m: AiModel, tokensIn: number, tokensOut: number): number {
  return (tokensIn * m.in + tokensOut * m.out) / 1_000_000;
}
