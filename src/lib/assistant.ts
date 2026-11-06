import { createAdminClient } from '@/lib/supabase/server';
import { notifyTeam } from '@/lib/alerts';
import { buildCustomerFacts } from '@/lib/job-facts';

/**
 * The project assistant on the customer's page. Answers ONLY from that job's
 * customer-visible records, says which records it used, and hands anything
 * it isn't sure of to RO as a normal question — so every miss reaches JR.
 */
export type AssistantReply = { log_id: string; answer: string | null; sources: string[]; confidence: 'high' | 'low'; handoff: boolean; question_id: string | null; error?: string };

const SYSTEM = `You are the project assistant on a customer's project page for RO Unlimited Construction & Development (Easley, SC). You answer the customer's question using ONLY the FACTS provided about their job. You speak plainly, warmly and briefly (1–4 short sentences), like a helpful office manager — never like a lawyer or a robot. No emojis, no greeting, no sign-off.

Hard rules:
1. Only facts given. If the facts don't contain the answer, or the question asks for a commitment (a firm date, a price change, who will be on site, whether something is "guaranteed"), or it's a complaint, a safety issue, or anything about money beyond what's in MONEY, you hand it to RO: set "handoff": true and "answer": null. Never guess. Never make up dates, prices, results or people.
2. Dates are estimates. Say "estimated" or "should be". Never promise. Write dates the way people say them — "Sunday, November 8" — never as 2026-11-08.
3. Never promise crews, schedules or who does the work; never say "our crew", "in-house", "self-performed", "guaranteed".
4. Never mention internal notes, costs or margins (you were not given any; do not imply you have them).
5. Explain terms using the GLOSSARY when useful.
6. "sources": list the bracket tags you relied on, e.g. ["log 2026-11-03", "schedule", "inspection", "change order", "glossary"]. Use the exact tag text inside the brackets.
7. "confidence": "high" only when the facts clearly settle it; otherwise "low" (and prefer handoff when low).

Respond with ONLY a JSON object: {"answer": string|null, "sources": string[], "confidence": "high"|"low", "handoff": boolean}`;

export async function askAssistant(args: { estimateId: string; question: string; customerName?: string | null; lang?: 'en' | 'es' }): Promise<AssistantReply> {
  const supabase = createAdminClient();
  const q = String(args.question || '').trim().slice(0, 600);
  const blank: AssistantReply = { log_id: '', answer: null, sources: [], confidence: 'low', handoff: true, question_id: null };
  if (!q) return { ...blank, error: 'Ask something first' };

  // Ceiling: 20 assistant questions an hour per job.
  const hourAgo = new Date(Date.now() - 3600000).toISOString();
  const { count } = await supabase.from('assistant_logs').select('*', { count: 'exact', head: true }).eq('estimate_id', args.estimateId).gte('created_at', hourAgo);
  if ((count || 0) >= 20) return { ...blank, error: 'That is a lot of questions for one hour — RO will pick up from here. Call (864) 304-0139 if it cannot wait.' };

  const built = await buildCustomerFacts(args.estimateId);
  if (!built) return { ...blank, error: 'Project not found' };
  const key = process.env.ANTHROPIC_API_KEY;
  let answer: string | null = null, sources: string[] = [], confidence: 'high' | 'low' = 'low', handoff = true;
  if (key) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-5', max_tokens: 600, system: SYSTEM, messages: [{ role: 'user', content: `FACTS\n${built.facts}\n\nCUSTOMER QUESTION: ${q}${args.lang === 'es' ? '\n\nThe customer is reading the page in Spanish: write the answer text in natural Latin American Spanish (usted). Keep names, numbers, dates and money exact.' : ''}` }] }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('').trim();
        const m = text.match(/\{[\s\S]*\}/);
        if (m) {
          const j = JSON.parse(m[0]);
          handoff = !!j.handoff || !j.answer;
          answer = handoff ? null : String(j.answer).trim();
          sources = Array.isArray(j.sources) ? j.sources.map(String).slice(0, 8) : [];
          confidence = j.confidence === 'high' ? 'high' : 'low';
          // Belt and braces: an answer that breaks the copy rules is handed off instead.
          if (answer && /our crew|in-house|self-perform|guarantee/i.test(answer)) { handoff = true; answer = null; }
        }
      } else console.error('[assistant] Claude', res.status, await res.text().catch(() => ''));
    } catch (e) { console.error('[assistant] error', e); }
  }

  let questionId: string | null = null;
  if (handoff) questionId = await handToRO(args.estimateId, q, args.customerName || null, built.est);

  const { data: log } = await supabase.from('assistant_logs').insert({ estimate_id: args.estimateId, question: q, answer, sources, confidence, handoff, question_id: questionId }).select('id').single();
  return { log_id: log?.id || '', answer, sources, confidence, handoff, question_id: questionId };
}

/** The miss becomes a normal question in JR's inbox (Phase 0 flow), marked as coming from the assistant. */
async function handToRO(estimateId: string, question: string, name: string | null, est: any): Promise<string | null> {
  const supabase = createAdminClient();
  const { data: msg } = await supabase.from('project_messages').insert({ estimate_id: estimateId, author: 'customer', author_name: name, body: question }).select('id').single();
  const who = name || est?.customer?.first_name || est?.customer?.company_name || 'A customer';
  await notifyTeam({
    type: 'project_question', title: `${who} asked (assistant handed it to you) — ${est?.project_name || est?.estimate_number}`,
    body: question.slice(0, 160), url: `/admin/questions`, reference_id: estimateId, division: est?.division || null, tag: `project-question-${estimateId}`,
  } as any).catch(() => {});
  return msg?.id || null;
}

/** Thumbs up/down on an answer. A thumbs-down hands the question to RO so nobody is left with a bad answer. */
export async function rateAssistant(args: { estimateId: string; logId: string; helpful: boolean; customerName?: string | null }) {
  const supabase = createAdminClient();
  const { data: log } = await supabase.from('assistant_logs').select('id, question, handoff, question_id').eq('id', args.logId).eq('estimate_id', args.estimateId).maybeSingle();
  if (!log) return { error: 'Not found' };
  let questionId = log.question_id;
  if (!args.helpful && !log.question_id) {
    const { data: est } = await supabase.from('estimates').select('estimate_number, project_name, division, customer:customers(first_name, company_name)').eq('id', args.estimateId).single();
    questionId = await handToRO(args.estimateId, log.question, args.customerName || null, est);
  }
  await supabase.from('assistant_logs').update({ helpful: args.helpful, question_id: questionId }).eq('id', log.id);
  return { ok: true, question_id: questionId };
}
