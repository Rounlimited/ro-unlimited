import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { COMPANY, letterType, letterSystemPrompt } from '@/lib/letters';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODEL = 'claude-sonnet-5';

/** GET — recent letters. */
export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('company_letters')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(60);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ letters: data || [] });
}

/**
 * POST — write a letter from a plain-English request and save it.
 * Body: { prompt, doc_type?, recipient_name?, recipient_company?,
 *         recipient_address?, estimate_id?, customer_id?, save? }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const prompt = (body.prompt || '').trim();
    if (!prompt) return NextResponse.json({ error: 'Say what you need written' }, { status: 400 });

    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return NextResponse.json({ error: 'AI writing is not configured' }, { status: 503 });

    const type = letterType(body.doc_type);

    // Pull real job/customer facts so the letter can be specific without
    // anything being invented.
    const facts: string[] = [];
    if (body.estimate_id) {
      const { data: est } = await supabase
        .from('estimates')
        .select('estimate_number, project_name, project_address, project_city, project_state, total, signed_at, customer:customers(first_name, last_name, company_name, address, city, state, zip)')
        .eq('id', body.estimate_id)
        .single();
      if (est) {
        const c: any = est.customer;
        facts.push(`Job: ${est.project_name || est.estimate_number}`);
        if (est.estimate_number) facts.push(`Document number: ${est.estimate_number}`);
        const addr = [est.project_address, est.project_city, est.project_state].filter(Boolean).join(', ');
        if (addr) facts.push(`Job address: ${addr}`);
        if (c) {
          const nm = c.company_name || [c.first_name, c.last_name].filter(Boolean).join(' ');
          if (nm) facts.push(`Customer: ${nm}`);
        }
        if (est.signed_at) facts.push(`Contract signed: ${new Date(est.signed_at).toLocaleDateString('en-US')}`);
      }
    }
    if (body.customer_id && !body.estimate_id) {
      const { data: c } = await supabase
        .from('customers')
        .select('first_name, last_name, company_name, address, city, state, zip')
        .eq('id', body.customer_id)
        .single();
      if (c) {
        const nm = c.company_name || [c.first_name, c.last_name].filter(Boolean).join(' ');
        if (nm) facts.push(`Customer: ${nm}`);
        const addr = [c.address, c.city, c.state, c.zip].filter(Boolean).join(', ');
        if (addr) facts.push(`Customer address: ${addr}`);
      }
    }
    if (body.recipient_name) facts.push(`Addressed to: ${body.recipient_name}`);
    if (body.recipient_company) facts.push(`Recipient organization: ${body.recipient_company}`);

    const userMsg = [
      `Kind of document: ${type.label}. ${type.guidance}`,
      facts.length ? `Known facts (use these; do not invent others):\n${facts.join('\n')}` : 'No job record attached.',
      `What ${COMPANY.signer} asked for, in his words:\n"${prompt}"`,
    ].join('\n\n');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system: letterSystemPrompt(),
        messages: [{ role: 'user', content: userMsg }],
      }),
    });

    if (!res.ok) {
      console.error('[letters] Claude error', res.status, await res.text().catch(() => ''));
      return NextResponse.json({ error: 'The writer is unavailable right now' }, { status: 502 });
    }

    const data = await res.json();
    const raw = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('').trim();

    let parsed: any;
    try {
      parsed = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ''));
    } catch {
      // Never lose the writing to a parse slip — keep it as the body.
      parsed = { title: prompt.slice(0, 60), subject: '', body: raw, closing: 'Sincerely' };
    }

    const record = {
      doc_type: type.id,
      title: (parsed.title || prompt.slice(0, 60)).trim(),
      subject: (parsed.subject || '').trim() || null,
      recipient_name: (body.recipient_name || parsed.recipient_name || '').trim() || null,
      recipient_company: (body.recipient_company || '').trim() || null,
      recipient_address: (body.recipient_address || '').trim() || null,
      body: [parsed.salutation, parsed.body].filter(Boolean).join('\n\n'),
      closing: (parsed.closing || 'Sincerely').trim(),
      signer_name: body.signer_name || COMPANY.signer,
      signer_title: body.signer_title || COMPANY.signerTitle,
      prompt,
      estimate_id: body.estimate_id || null,
      customer_id: body.customer_id || null,
      created_by: body.created_by || null,
    };

    if (body.save === false) return NextResponse.json({ letter: record });

    const { data: saved, error } = await supabase
      .from('company_letters').insert(record).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ letter: saved });
  } catch (err) {
    console.error('[letters] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
