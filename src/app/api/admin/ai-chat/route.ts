import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════
// WEB SEARCH (DuckDuckGo)
// ═══════════════════════════════════════════
async function webSearch(query: string): Promise<string> {
  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      cache: 'no-store',
    });
    if (!res.ok) return 'Search failed.';
    const html = await res.text();
    const results: string[] = [];
    const snippetRegex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    const titleRegex = /<a class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
    const titles: { url: string; title: string }[] = [];
    let match;
    while ((match = titleRegex.exec(html)) !== null && titles.length < 6) {
      const url = match[1].replace(/.*uddg=/, '').split('&')[0];
      const title = match[2].replace(/<[^>]*>/g, '').trim();
      try { titles.push({ url: decodeURIComponent(url), title }); } catch { titles.push({ url, title }); }
    }
    const snippets: string[] = [];
    while ((match = snippetRegex.exec(html)) !== null && snippets.length < 6) {
      snippets.push(match[1].replace(/<[^>]*>/g, '').trim());
    }
    for (let i = 0; i < titles.length; i++) {
      results.push(`${i + 1}. **${titles[i].title}**\n   ${snippets[i] || ''}\n   Source: ${titles[i].url}`);
    }
    return results.length > 0 ? results.join('\n\n') : 'No results found.';
  } catch {
    return 'Search failed.';
  }
}

// ═══════════════════════════════════════════
// TOOL DEFINITIONS (Claude native tool_use)
// ═══════════════════════════════════════════
const TOOLS = [
  {
    name: 'search_customers',
    description: 'Search customers by name, email, phone, or company. Returns real database records. Use this whenever the user asks about a customer.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search term — name, email, phone, or company' },
        limit: { type: 'number', description: 'Max results (default 15)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_estimates',
    description: 'Search estimates by customer name, project name, estimate number, status, or division. Returns real data with line items and totals. Use this whenever the user asks about a quote, estimate, proposal, or project pricing.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search term — customer name, project name, estimate number, status' },
        status: { type: 'string', description: 'Filter by status: draft, sent, viewed, accepted, declined, expired' },
        limit: { type: 'number', description: 'Max results (default 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_estimate_details',
    description: 'Get full details of a specific estimate including all line items, payment schedule, financials, and status history. Use when the user asks for details about a specific estimate.',
    input_schema: {
      type: 'object' as const,
      properties: {
        estimate_id: { type: 'string', description: 'The estimate UUID' },
        estimate_number: { type: 'string', description: 'The estimate number like RO-EST-2026-001' },
      },
    },
  },
  {
    name: 'search_employees',
    description: 'Search employees by name, title, department, or status. Returns real employee records.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search term — name, title, department' },
        status: { type: 'string', description: 'Filter: active, suspended, terminated' },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_vendors',
    description: 'Search vendors by company name, trade, or contact name. Returns real vendor records.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search term — company name, trade, contact' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_activity_log',
    description: 'Get recent activity/login history. Shows who did what and when.',
    input_schema: {
      type: 'object' as const,
      properties: {
        limit: { type: 'number', description: 'Number of entries (default 15)' },
        action_filter: { type: 'string', description: 'Filter by action type like login, create, update, delete' },
      },
    },
  },
  {
    name: 'search_cost_library',
    description: 'Search the cost library for material, labor, equipment, or subcontractor pricing. Returns real cost items with default costs and markup.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search term — item name, category, trade' },
        category: { type: 'string', description: 'Filter: material, labor, equipment, subcontractor' },
      },
      required: ['query'],
    },
  },
  {
    name: 'web_search',
    description: 'Search the web for current information — codes, regulations, pricing, specs, news. Use when you need up-to-date information you do not have.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'The search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'save_memory',
    description: 'Save a piece of information to persistent memory for future conversations. Use when the user says "remember this" or when you learn important facts about preferences, pricing, projects, or codes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        content: { type: 'string', description: 'The fact or preference to remember' },
        category: { type: 'string', description: 'Category: general, pricing, preferences, projects, codes, materials' },
      },
      required: ['content', 'category'],
    },
  },
  {
    name: 'forget_memory',
    description: 'Delete a previously saved memory. Use when the user says "forget" or "delete" a memory.',
    input_schema: {
      type: 'object' as const,
      properties: {
        keyword: { type: 'string', description: 'Keyword to match against stored memories for deletion' },
      },
      required: ['keyword'],
    },
  },
];

// ═══════════════════════════════════════════
// TOOL EXECUTION
// ═══════════════════════════════════════════
async function executeTool(name: string, input: any, supabase: ReturnType<typeof createAdminClient>): Promise<string> {
  switch (name) {
    case 'search_customers': {
      const q = input.query?.toLowerCase() || '';
      const limit = input.limit || 15;
      const { data } = await supabase
        .from('customers')
        .select('id, first_name, last_name, company_name, email, phone, address, city, state, zip, created_at')
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,company_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (!data?.length) return `No customers found matching "${input.query}".`;
      return JSON.stringify(data, null, 2);
    }

    case 'search_estimates': {
      const q = input.query?.toLowerCase() || '';
      const limit = input.limit || 10;
      let query = supabase
        .from('estimates')
        .select('id, estimate_number, project_name, total, status, division, document_mode, created_at, customer:customers(first_name, last_name, company_name)')
        .or(`project_name.ilike.%${q}%,estimate_number.ilike.%${q}%`);
      if (input.status) query = query.eq('status', input.status);
      const { data } = await query.order('created_at', { ascending: false }).limit(limit);
      if (!data?.length) {
        // Try searching by customer name
        const { data: byCustomer } = await supabase
          .from('estimates')
          .select('id, estimate_number, project_name, total, status, division, document_mode, created_at, customer:customers!inner(first_name, last_name, company_name)')
          .or(`customers.first_name.ilike.%${q}%,customers.last_name.ilike.%${q}%,customers.company_name.ilike.%${q}%`, { referencedTable: 'customers' })
          .order('created_at', { ascending: false })
          .limit(limit);
        if (!byCustomer?.length) return `No estimates found matching "${input.query}".`;
        return JSON.stringify(byCustomer, null, 2);
      }
      return JSON.stringify(data, null, 2);
    }

    case 'get_estimate_details': {
      let estimateQuery = supabase
        .from('estimates')
        .select('*, customer:customers(first_name, last_name, company_name, email, phone)')
      if (input.estimate_id) {
        estimateQuery = estimateQuery.eq('id', input.estimate_id);
      } else if (input.estimate_number) {
        estimateQuery = estimateQuery.eq('estimate_number', input.estimate_number);
      } else {
        return 'Please provide an estimate_id or estimate_number.';
      }
      const { data: estimate } = await estimateQuery.single();
      if (!estimate) return 'Estimate not found.';

      // Get line items
      const { data: lineItems } = await supabase
        .from('estimate_line_items')
        .select('*')
        .eq('estimate_id', estimate.id)
        .order('sort_order');

      // Get payment schedule
      const { data: payments } = await supabase
        .from('estimate_payment_schedules')
        .select('*')
        .eq('estimate_id', estimate.id)
        .order('sort_order');

      // Get status history
      const { data: history } = await supabase
        .from('estimate_status_history')
        .select('*')
        .eq('estimate_id', estimate.id)
        .order('changed_at', { ascending: false });

      return JSON.stringify({
        ...estimate,
        line_items: lineItems || [],
        payment_schedule: payments || [],
        status_history: history || [],
      }, null, 2);
    }

    case 'search_employees': {
      const q = input.query?.toLowerCase() || '';
      let query = supabase
        .from('employee_profiles')
        .select('id, first_name, last_name, title, department, status, phone, email, hire_date, pay_rate, pay_type, employment_type')
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,title.ilike.%${q}%,department.ilike.%${q}%`);
      if (input.status) query = query.eq('status', input.status);
      const { data } = await query.order('created_at', { ascending: false }).limit(15);
      if (!data?.length) return `No employees found matching "${input.query}".`;
      return JSON.stringify(data, null, 2);
    }

    case 'search_vendors': {
      const q = input.query?.toLowerCase() || '';
      const { data } = await supabase
        .from('vendors')
        .select('id, company_name, contact_name, trade, type, phone, email, is_preferred, is_active')
        .or(`company_name.ilike.%${q}%,contact_name.ilike.%${q}%,trade.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(15);
      if (!data?.length) return `No vendors found matching "${input.query}".`;
      return JSON.stringify(data, null, 2);
    }

    case 'get_activity_log': {
      const limit = input.limit || 15;
      let query = supabase.from('activity_log').select('*');
      if (input.action_filter) query = query.ilike('action', `%${input.action_filter}%`);
      const { data } = await query.order('created_at', { ascending: false }).limit(limit);
      if (!data?.length) return 'No activity log entries found.';
      return JSON.stringify(data, null, 2);
    }

    case 'search_cost_library': {
      const q = input.query?.toLowerCase() || '';
      let query = supabase
        .from('cost_items')
        .select('id, name, description, category, trade, unit, default_cost, default_markup_percent, is_active')
        .or(`name.ilike.%${q}%,description.ilike.%${q}%,trade.ilike.%${q}%`)
        .eq('is_active', true);
      if (input.category) query = query.eq('category', input.category);
      const { data } = await query.order('name').limit(20);
      if (!data?.length) return `No cost items found matching "${input.query}".`;
      return JSON.stringify(data, null, 2);
    }

    case 'web_search': {
      return await webSearch(input.query);
    }

    case 'save_memory': {
      await supabase.from('ai_memories').insert({
        content: input.content,
        category: input.category || 'general',
        source: 'ai',
      });
      return `Memory saved: "${input.content}" (category: ${input.category})`;
    }

    case 'forget_memory': {
      const { data: deleted } = await supabase
        .from('ai_memories')
        .delete()
        .ilike('content', `%${input.keyword}%`)
        .select('content');
      if (deleted?.length) return `Deleted ${deleted.length} memory/memories matching "${input.keyword}".`;
      return `No memories found matching "${input.keyword}".`;
    }

    default:
      return `Unknown tool: ${name}`;
  }
}

// ═══════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════
const SYSTEM_PROMPT = `You are RO Assistant — the AI for RO Unlimited Construction & Development (Greenville, SC — serving SC, GA, NC).

## CRITICAL RULES
1. **NEVER fabricate data.** When asked about customers, estimates, employees, vendors, or any business data — ALWAYS use the appropriate tool to fetch real data. Never guess names, numbers, prices, or totals.
2. **ALWAYS use tools for data queries.** If someone asks "pull up Sherry's quote" — call search_estimates with query "Sherry". Present ONLY what the tool returns.
3. **Be concise.** Short answers unless detail is asked for.
4. **Use markdown** for formatting: **bold**, bullet lists, tables for data.
5. **For construction questions:** practical answers with SC code references.
6. **If a tool returns no results:** say "I couldn't find any matching records" — never make up data.

## APP NAVIGATION
- Dashboard: /admin
- Estimates: /admin/estimates (create, edit, preview PDF, send, share link, duplicate, revise)
- Email: /admin/inbox (multi-account Gmail-style client)
- Employees: /admin/employees (profiles, certs, equipment, performance)
- Intakes: /admin/intakes (onboarding forms)
- Customers: /admin/customers
- Vendors: /admin/vendors
- Cost Library: /admin/cost-library
- Templates: /admin/templates
- Settings: /admin/settings

## ESTIMATE WORKFLOW
1. New Estimate → pick document type → select customer → set division/type/name
2. Pick template or start blank
3. Write scope of work
4. Add line items by phase (or AI-generate)
5. Set financials (overhead, markup, tax, permits, contingency)
6. Set payment milestones and timeline
7. Select terms/disclaimers
8. Review → preview PDF → send or share link

Document types: Estimate (RO-EST), Proposal (RO-CON), Change Order (RO-CO), Quick Quote (RO-QQ)
Statuses: draft → sent → viewed → accepted/declined/expired

## CONSTRUCTION KNOWLEDGE (SC)
- Building codes: 2021 IBC/IRC (adopted 2023)
- Energy code: IECC 2021
- Mechanic's lien: SC Code 29-5-10, file within 90 days
- 1 cuyd = 27 cuft, covers 81 sqft at 4"
- 1 roofing square = 100 sqft
- Rebar: #4=1/2", #5=5/8", #6=3/4"
- Stud spacing: 16" OC residential, 12" OC load-bearing

## SC MARKET PRICING (2025-2026)
- Concrete 4": $6-10/sqft | Framing wood: $8-16/sqft
- Roofing shingles: $4-7/sqft | Metal: $8-14/sqft
- Plumbing rough-in: $800-1,500/fixture | HVAC: $3-5K/ton
- Drywall: $3-5/sqft | Painting: $2-4/sqft | Flooring LVP: $5-9/sqft

## TOOLS AVAILABLE
You have access to tools that query the real database. USE THEM. Do not guess.
`;

// ═══════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const { messages, currentPage, projectContext, useModel } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    if (!claudeKey && !groqKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
    }

    const supabase = createAdminClient();

    // Load persistent memories
    const { data: memories } = await supabase
      .from('ai_memories')
      .select('content, category')
      .order('category')
      .order('created_at', { ascending: false })
      .limit(50);

    // Build context additions
    const contextParts: string[] = [];

    if (memories?.length) {
      contextParts.push('\n## SAVED MEMORIES');
      const grouped: Record<string, string[]> = {};
      memories.forEach((m: any) => {
        const cat = m.category || 'general';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(m.content);
      });
      Object.entries(grouped).forEach(([cat, items]) => {
        contextParts.push(`**${cat}:**`);
        items.forEach(i => contextParts.push(`- ${i}`));
      });
    }

    if (currentPage) contextParts.push(`\nUser is currently on page: ${currentPage}`);

    if (projectContext?.type === 'estimate' && projectContext.data) {
      const e = projectContext.data;
      contextParts.push(`\n## ACTIVE PROJECT CONTEXT`);
      contextParts.push(`Estimate: ${e.estimate_number} — ${e.project_name}`);
      contextParts.push(`Customer: ${e.customer?.first_name} ${e.customer?.last_name}${e.customer?.company_name ? ` (${e.customer.company_name})` : ''}`);
      contextParts.push(`Division: ${e.division} | Type: ${e.document_mode || 'estimate'} | Status: ${e.status}`);
      contextParts.push(`Total: $${e.total?.toLocaleString() || '0'}`);
      if (e.line_items?.length) {
        contextParts.push(`Line items: ${e.line_items.length} items`);
      }
    }

    const fullPrompt = SYSTEM_PROMPT + (contextParts.length ? '\n' + contextParts.join('\n') : '');
    const preferClaude = useModel !== 'groq' && !!claudeKey;
    let content = '';

    // ── Claude with tool_use ──
    if (preferClaude) {
      try {
        const apiMessages = messages.map((m: any) => ({ role: m.role, content: m.content }));

        // First call — Claude may request tool use
        let claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': claudeKey!, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 4000,
            system: fullPrompt,
            messages: apiMessages,
            tools: TOOLS,
          }),
        });

        if (!claudeRes.ok) {
          console.error('[ai-chat] Claude error:', claudeRes.status, await claudeRes.text());
        } else {
          let claudeData = await claudeRes.json();

          // Tool use loop — execute tools and feed results back (max 5 rounds)
          let rounds = 0;
          while (claudeData.stop_reason === 'tool_use' && rounds < 5) {
            rounds++;
            const toolBlocks = claudeData.content.filter((b: any) => b.type === 'tool_use');
            const toolResults: any[] = [];

            // Include any text blocks from Claude's response
            const assistantContent = claudeData.content;

            for (const tool of toolBlocks) {
              const result = await executeTool(tool.name, tool.input, supabase);
              toolResults.push({
                type: 'tool_result',
                tool_use_id: tool.id,
                content: result,
              });
            }

            // Continue conversation with tool results
            claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: { 'x-api-key': claudeKey!, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 4000,
                system: fullPrompt,
                messages: [
                  ...apiMessages,
                  { role: 'assistant', content: assistantContent },
                  { role: 'user', content: toolResults },
                ],
                tools: TOOLS,
              }),
            });

            if (!claudeRes.ok) {
              console.error('[ai-chat] Claude tool loop error:', claudeRes.status);
              break;
            }
            claudeData = await claudeRes.json();
          }

          // Extract final text response
          const textBlocks = claudeData.content?.filter((b: any) => b.type === 'text') || [];
          content = textBlocks.map((b: any) => b.text).join('\n');
        }
      } catch (err) {
        console.error('[ai-chat] Claude failed:', err);
      }
    }

    // ── Groq fallback (no tool_use, uses old regex approach) ──
    if (!content && groqKey) {
      // For Groq, inject a note about not having tools
      const groqPrompt = fullPrompt + '\n\nNote: You do not have database tools in this mode. Answer from context and general knowledge only. Be clear when you are estimating vs stating facts.';
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: groqPrompt }, ...messages],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });
      if (!groqRes.ok) {
        const err = await groqRes.text();
        console.error('[ai-chat] Groq error:', groqRes.status, err);
        return NextResponse.json({ error: groqRes.status === 429 ? 'Rate limit — wait a few seconds' : 'AI service error' }, { status: 502 });
      }
      const d = await groqRes.json();
      content = d.choices?.[0]?.message?.content || '';
    }

    if (!content) return NextResponse.json({ error: 'No AI service available' }, { status: 502 });

    return NextResponse.json({ role: 'assistant', content });
  } catch (err: any) {
    console.error('[ai-chat] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
