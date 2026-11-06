import crypto from 'crypto';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * English → Spanish for the customer pages (Project Page, portal, help).
 * Every phrase is translated ONCE by Claude and cached in `translations`
 * (sha1 of the source + lang), so repeat views cost nothing and switch
 * instantly. Called by /api/translate (the in-page translator).
 */
export type Lang = 'es';
const MODEL = 'claude-opus-5-5';
const BATCH = 30;            // phrases per Claude call (small = fast first paint)
const MAX_LEN = 1500;        // chars per phrase (longer is passed through untouched)

const hash = (s: string) => crypto.createHash('sha1').update(s).digest('hex');

const SYSTEM = `You translate the customer-facing pages of RO Unlimited, a licensed general contractor in Upstate South Carolina, from English to Spanish for Spanish-speaking homeowners and business owners.

Write natural, warm, plain Latin American Spanish, addressing the reader as "usted". Keep it as short as the English — these are buttons, labels, headings and short paragraphs on a phone screen.

Keep exactly as written: people's names, company names (including "RO Unlimited"), street addresses, city and state names, phone numbers, email addresses, URLs, estimate/invoice/job numbers (like RO-EST-2026-0247), dollar amounts and other numbers, and units (LF, SF, CY, PSI). Translate dates and times into normal Spanish ("Tuesday, November 3" → "martes 3 de noviembre"; "2h ago" → "hace 2 h"). Keep the same leading/trailing punctuation, symbols, arrows and emoji. Construction terms: use the common Spanish term a homeowner would know, and keep the English trade term in parentheses only when there is no common Spanish word. Contract and legal sentences: translate faithfully, no softening. If a phrase is already Spanish, return it unchanged.

You receive a JSON array of phrases. Return the translations in the same order, one per input, same count.`;

const Out = z.object({ translations: z.array(z.string()) });

let client: Anthropic | null = null;
const claude = () => (client ||= new Anthropic());

async function translateBatch(texts: string[]): Promise<string[] | null> {
  try {
    const res = await claude().messages.parse({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: 'low', format: zodOutputFormat(Out) },
      system: SYSTEM,
      messages: [{ role: 'user', content: JSON.stringify(texts) }],
    });
    if (res.stop_reason === 'refusal') return null;
    const out = res.parsed_output;
    if (!out || out.translations.length !== texts.length) return null;
    return out.translations;
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) console.warn('[translate] rate limited');
    else if (e instanceof Anthropic.APIError) console.error('[translate] API error', e.status, e.message);
    else console.error('[translate] failed', e);
    return null;
  }
}

/** Returns { source → translation } for every phrase it could translate (cache first, then Claude). */
export async function translateTexts(raw: string[], lang: Lang = 'es', opts: { cacheOnly?: boolean } = {}): Promise<Record<string, string>> {
  const texts = Array.from(new Set(raw.map((t) => String(t || '')).filter((t) => t.trim() && t.length <= MAX_LEN)));
  const out: Record<string, string> = {};
  if (!texts.length) return out;
  const supabase = createAdminClient();
  const byHash = new Map(texts.map((t) => [hash(t), t]));

  // 1. cache
  const hashes = Array.from(byHash.keys());
  for (let i = 0; i < hashes.length; i += 500) {
    const { data } = await supabase.from('translations').select('src_hash, out').eq('lang', lang).in('src_hash', hashes.slice(i, i + 500));
    for (const r of data || []) { const src = byHash.get(r.src_hash); if (src) out[src] = r.out; }
  }

  // 2. Claude for the rest, in parallel batches
  if (opts.cacheOnly) return out;
  const missing = texts.filter((t) => !(t in out));
  const batches: string[][] = [];
  for (let i = 0; i < missing.length; i += BATCH) batches.push(missing.slice(i, i + BATCH));
  const results = await Promise.all(batches.map((b) => translateBatch(b)));
  const rows: { src_hash: string; lang: string; src: string; out: string }[] = [];
  results.forEach((tr, bi) => {
    if (!tr) return;
    batches[bi].forEach((src, i) => {
      const t = String(tr[i] || '').trim() ? tr[i] : null;
      if (!t) return;
      out[src] = t; rows.push({ src_hash: hash(src), lang, src, out: t });
    });
  });
  if (rows.length) await supabase.from('translations').upsert(rows, { onConflict: 'src_hash,lang', ignoreDuplicates: true });
  return out;
}
