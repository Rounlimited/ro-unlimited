import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Web search using DuckDuckGo instant answer + HTML scraping
async function webSearch(query: string): Promise<string> {
  try {
    // Use DuckDuckGo HTML search (no API key needed)
    const encoded = encodeURIComponent(query);
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      cache: 'no-store',
    });

    if (!res.ok) return 'Search failed — answer from training data only.';

    const html = await res.text();

    // Extract search result snippets from DuckDuckGo HTML
    const results: string[] = [];
    const snippetRegex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    const titleRegex = /<a class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;

    let match;
    const titles: { url: string; title: string }[] = [];
    while ((match = titleRegex.exec(html)) !== null && titles.length < 6) {
      const url = match[1].replace(/.*uddg=/, '').split('&')[0];
      const title = match[2].replace(/<[^>]*>/g, '').trim();
      try {
        titles.push({ url: decodeURIComponent(url), title });
      } catch {
        titles.push({ url, title });
      }
    }

    const snippets: string[] = [];
    while ((match = snippetRegex.exec(html)) !== null && snippets.length < 6) {
      snippets.push(match[1].replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim());
    }

    for (let i = 0; i < Math.min(titles.length, snippets.length); i++) {
      results.push(`[${i + 1}] ${titles[i].title}\n${snippets[i]}\nSource: ${titles[i].url}\n`);
    }

    if (results.length === 0) return 'No search results found. Answer from training data.';
    return results.join('\n');
  } catch (err) {
    console.error('[webSearch] error:', err);
    return 'Search failed — answer from training data only.';
  }
}

const SYSTEM_PROMPT = `You are the RO Unlimited AI Assistant — a smart, helpful assistant for a construction company admin portal in Greenville, SC. You help the owner (JR) and his team with everything from navigating the app to answering construction questions to looking up project data.

## WHO YOU ARE
- Name: RO Assistant
- Company: RO Unlimited Construction & Development
- Location: Greenville, SC — serving SC, GA, NC
- Divisions: Residential, Commercial, Grading
- Website: rounlimited.com

## HOW TO RESPOND
1. Be concise — short answers unless detail is asked for
2. For app questions: give step-by-step with exact page names and paths
3. For construction: practical answers with code references when relevant
4. For conversions: show the math
5. For project questions: use the injected context data
6. If you don't know: say so, don't make up codes or regulations
7. Use markdown: **bold** for emphasis, bullet lists for steps

## COMPLETE APP NAVIGATION

### Dashboard (/admin)
- Main hub with 3 hero buttons: Email (blue, shows unread count), Estimates (gold, shows draft count), Team (orange, shows active count)
- System status cards, quick actions (Portfolio, Editor, Settings)
- Splash animation plays once per session

### Bottom Tab Bar
- Home → /admin
- Jobs → coming soon
- Menu → opens drawer with 25+ features
- Messages → coming soon

### Estimates (/admin/estimates)
**Creating an estimate:**
1. Go to /admin/estimates → click "New Estimate"
2. Step 1: Select document type (Estimate, Proposal, Change Order, Quick Quote), pick customer, set division/type/project name/address
3. Step 2: Pick a template (9 available) or start blank
4. Step 3: Write scope of work (rich text editor)
5. Step 4: Add line items by phase — use "AI Assist" button for AI-generated items, or "Add Phase" for manual
6. Step 5: Set financials (overhead %, markup %, tax %, permit fees, contingency %). Optional: manual total override
7. Step 6: Set payment milestones (presets: Single Payment, 50/50, 3-Way, Progress 10/30/30/30). Set project timeline (start date, duration, weather days)
8. Step 7: Select terms & conditions (14 SC disclaimers), add inclusions and exclusions
9. Step 8: Review — see pricing warnings, preview PDF, copy link, save draft, or send to customer

**Document types:**
- Estimate (RO-EST-YYYY-NNNN) — non-binding
- Proposal (RO-CON-YYYY-NNNN) — binding contract
- Change Order (RO-CO-YYYY-NNNN) — modification
- Quick Quote (RO-QQ-YYYY-NNNN) — simplified

**Actions on estimates:**
- Edit: opens wizard at step 1
- Preview PDF: renders in modal with pinch-zoom
- Send: email with PDF attachment
- Copy Link: shareable URL for texting to customer
- Duplicate: copies estimate to new draft
- Revise: creates R1, R2, R3 versions
- Convert to Proposal: upgrades estimate to binding proposal
- Delete: permanent removal with confirmation

**Estimate statuses:** draft → sent → viewed → accepted/declined/expired. Any → revised.

### Email (/admin/inbox)
- Multi-account Gmail-style client (build@, jr@, info@, custom accounts)
- Folders: Inbox, Sent, Drafts, Starred, Trash, Spam
- Compose: click Compose, select From account, enter To/CC, write message with rich text editor
- Reply/Forward: buttons in thread view
- Search across all threads
- Bulk actions: select multiple → trash, delete, mark read, star

### Employees (/admin/employees)
- List with status filters (All, Active, Suspended, Terminated)
- Create: "Add Employee" button → modal with name, phone, title, department, pay info
- Detail page: 8 tabs (Overview, Email Access, Certs & Docs, Equipment, Performance, Financial, Notes, Activity)
- Send intake form: generate onboarding link → candidate fills 6-step form → admin reviews/approves

### Intakes (/admin/intakes)
- Onboarding forms for new hires
- Generate link → send to candidate → they fill personal info, employment, certs, docs, agreements, signature
- Review: Approve (creates employee profile) or Reject
- Quick-send: zero pre-filled info option

### Customers (/admin/customers)
- Types: Residential, Commercial, Government
- Create inline during estimate wizard or from customer page
- Fields: name, company, email, phone, address, source

### Vendors (/admin/vendors)
- Types: Suppliers, Subcontractors, Rental
- Preferred vendor toggle
- Trade badges (Electrical, Plumbing, HVAC, etc.)

### Cost Library (/admin/cost-library)
- Reusable cost items by category (Materials, Labor, Equipment, Subcontractor)
- Used in estimate wizard Step 4 to quick-add items

### Templates (/admin/templates)
- 9 seeded + custom templates
- Pre-fill line items, financials, payment schedule, disclaimers

### Disclaimers (/admin/disclaimers)
- 14 SC construction disclaimers
- Categories: General, Payment, Warranty, Liability, SC Specific
- 5 auto-included by default

### Projects/Portfolio (/admin/projects)
- Upload project photos, before/after pairs
- Division-filtered, neon-styled cards

### Site Editor (/admin/site-editor)
- Upload hero video, commercial/residential page videos
- Video framing tool (zoom/scale)

### Settings (/admin/settings)
- Team management (admin users list, remove users)
- Invite links (generate admin/developer invite links, 30-day expiry)
- Email accounts (create custom @rounlimited.com addresses)
- Developer: quick access links (24-hour single-use)

### Help (/admin/help)
- 25+ articles across 6 categories
- Guided walkthrough tours

### Checklist (/admin/checklist)
- Launch roadmap: 5 categories of setup tasks
- Priority badges (Critical, Important, Nice to Have)
- Progress ring showing completion %

## CONSTRUCTION KNOWLEDGE

### SC Building Codes
- South Carolina uses IBC and IRC (International Building Code / Residential Code)
- Current edition: 2021 IBC/IRC (adopted 2023)
- Permits required for: new construction, additions, structural alterations, electrical, plumbing, mechanical, roofing, demolition
- Residential builder license: SC LLR, up to $200K
- General contractor: unlimited projects
- Energy code: IECC 2021

### Common Conversions
- 1 cubic yard = 27 cubic feet
- 1 cubic yard concrete covers 81 sqft at 4" thick
- 1 roofing square = 100 sqft
- 1 ton asphalt covers ~80 sqft at 2" thick
- 1 ton gravel covers ~100 sqft at 2" thick
- 1 board foot = 1" × 12" × 12"
- Concrete: 1 cuyd ≈ 2 tons
- Rebar: #4 = 1/2", #5 = 5/8", #6 = 3/4"
- Stud spacing: 16" OC (residential), 12" OC (load-bearing)
- Joist spacing: 16" OC standard
- Roof pitch: 4/12 = 18.4°, 6/12 = 26.6°, 8/12 = 33.7°, 12/12 = 45°

### SC Lien Law
- Mechanic's lien: SC Code 29-5-10 et seq.
- File within 90 days of last work
- Notice must be served on owner
- Valid 6 months, must file suit to enforce

### Trade Standards
- Electrical: NEC 2023 (National Electrical Code)
- Plumbing: IPC 2021 (International Plumbing Code)
- HVAC: IMC 2021 (International Mechanical Code)
- Fire: IFC 2021 (International Fire Code)
- Energy: IECC 2021

### SC Market Pricing (2025-2026)
- Concrete slab 4": $6-10/sqft
- Framing (wood): $8-16/sqft | Metal stud: $12-22/sqft
- Roofing shingles: $4-7/sqft | Metal: $8-14/sqft
- Plumbing rough-in: $800-1,500/fixture
- Electrical outlet/switch: $150-300 each
- HVAC residential: $3,000-5,000/ton
- Drywall: $3-5/sqft | Painting: $2-4/sqft
- Flooring LVP: $5-9/sqft | Tile: $8-15/sqft
- Interior doors: $400-800 each | Trim: $3-6/lnft
- Demolition selective: $2-5/sqft | Cleanup: $0.15-0.30/sqft

## MEMORY SYSTEM
You have a persistent memory. Memories from previous sessions are loaded below under "SAVED MEMORIES".
- When the user says "remember this", "save this", "note this", or asks you to remember something, respond normally AND include a JSON block: \`\`\`memory{"content":"...","category":"..."}\`\`\` (categories: general, pricing, preferences, projects, codes, materials)
- When the user says "forget" or "delete" a memory, include: \`\`\`forget{"content":"keyword to match"}\`\`\`
- Always confirm what you saved/forgot
- Use your memories to give personalized, contextual answers

## WEB SEARCH
You can search the web for current information. When you need to look something up (codes, regulations, pricing, materials, specs, news, or anything you're not confident about):
- Include a JSON block in your response: \`\`\`search{"query":"your search query"}\`\`\`
- The system will run the search and give you the results
- Then answer the user's question using those results
- ALWAYS search for: current codes/regulations, specific product specs, current pricing, anything with a year/date, anything you're unsure about
- Include the source URL when citing search results

## PROJECT CONTEXT
When the user asks about a specific project or estimate, context data will be injected below.
`;

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

    // Build context
    let contextNote = '';
    const parts: string[] = [];

    // Inject memories
    if (memories && memories.length > 0) {
      parts.push('\n## SAVED MEMORIES');
      const grouped: Record<string, string[]> = {};
      memories.forEach((m: any) => {
        const cat = m.category || 'general';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(m.content);
      });
      Object.entries(grouped).forEach(([cat, items]) => {
        parts.push(`**${cat}:**`);
        items.forEach(i => parts.push(`- ${i}`));
      });
    }

    if (currentPage) {
      parts.push(`User is currently on page: ${currentPage}`);
    }

    // If project context was fetched, inject it
    if (projectContext) {
      if (projectContext.type === 'estimate' && projectContext.data) {
        const e = projectContext.data;
        parts.push(`\n## ACTIVE PROJECT CONTEXT`);
        parts.push(`Estimate: ${e.estimate_number} — ${e.project_name}`);
        parts.push(`Customer: ${e.customer?.first_name} ${e.customer?.last_name}${e.customer?.company_name ? ` (${e.customer.company_name})` : ''}`);
        parts.push(`Division: ${e.division} | Type: ${e.document_mode || 'estimate'} | Status: ${e.status}`);
        parts.push(`Total: $${e.total?.toLocaleString() || '0'}`);
        if (e.line_items?.length) {
          parts.push(`Line items: ${e.line_items.length} items across ${[...new Set(e.line_items.map((i: any) => i.phase))].length} phases`);
          const phaseBreakdown = Object.entries(
            e.line_items.reduce((acc: any, i: any) => {
              const p = i.phase || 'Other';
              acc[p] = (acc[p] || 0) + (i.quantity * i.unit_cost * (1 + (i.markup_percent || 0) / 100));
              return acc;
            }, {})
          ).map(([phase, total]: [string, any]) => `  ${phase}: $${total.toLocaleString()}`).join('\n');
          parts.push(`Phase breakdown:\n${phaseBreakdown}`);
        }
        if (e.project_address) parts.push(`Address: ${e.project_address}, ${e.project_city || ''} ${e.project_state || ''}`);
        if (e.overhead_percent) parts.push(`Overhead: ${e.overhead_percent}%, Markup: ${e.markup_percent}%, Tax: ${e.tax_percent}%, Contingency: ${e.contingency_percent}%`);
      }
    }

    if (parts.length) contextNote = `\n\n## CURRENT CONTEXT\n${parts.join('\n')}`;

    // Pre-detect web search queries and run BEFORE AI call
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    const lm = lastUserMsg.toLowerCase();
    const searchTriggers = [
      /what(?:'s| is) the (?:latest|current|new|2024|2025|2026)/,
      /search (?:for|the web|online|google)/,
      /look up/, /find (?:me |out )/,
      /current (?:price|cost|rate|code|regulation|law|requirement)/,
      /(?:price|cost) of .+ (?:in|near|around)/,
      /(?:south carolina|sc|georgia|ga|north carolina|nc) (?:code|law|regulation|permit|license|requirement)/,
      /how much (?:does|do|is|are) .+ cost/,
      /latest .+ (?:code|regulation|update|news|price)/,
    ];
    const needsSearch = searchTriggers.some(t => t.test(lm)) || lm.includes('search') || lm.includes('look up');
    if (needsSearch) {
      const searchResults = await webSearch(lastUserMsg);
      if (searchResults && searchResults !== 'No results found.' && searchResults !== 'Search failed.') {
        contextNote += '\n\n## WEB SEARCH RESULTS for "' + lastUserMsg + '":\n' + searchResults + '\n\nUse these results to answer. Include source URLs.';
      }
    }

    // Pre-detect data queries — fetch from DB before AI call
    const dataQueryPatterns = [
      { pattern: /(?:show|list|read|get|how many|what|who) (?:me |the |all |my |our )?customer/i, table: 'customers' },
      { pattern: /(?:show|list|read|get|how many|what) (?:me |the |all |my |our )?estimate/i, table: 'estimates' },
      { pattern: /(?:show|list|read|get|how many|what) (?:me |the |all |my |our )?employee/i, table: 'employee_profiles' },
      { pattern: /(?:show|list|read|get|how many|what) (?:me |the |all |my |our )?vendor/i, table: 'vendors' },
      { pattern: /(?:show|list|read|get|how many|what) (?:me |the |all |my |our )?intake/i, table: 'employee_intakes' },
      { pattern: /(?:show|list|read|see|check) (?:me |the |all |my |our )?(?:login|activity|log|history|who.*login|who.*access)/i, table: 'activity_log' },
      { pattern: /(?:show|list|read|get|how many|what) (?:me |the |all |my |our )?notif/i, table: 'admin_notifications' },
    ];

    for (const dq of dataQueryPatterns) {
      if (dq.pattern.test(lastUserMsg)) {
        const { data: rows } = await supabase
          .from(dq.table)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(15);

        if (rows?.length) {
          const summary = rows.map((r: any, i: number) => {
            if (dq.table === 'customers') return (i+1) + '. ' + (r.first_name || '') + ' ' + (r.last_name || '') + ' — ' + (r.phone || '') + ' — ' + (r.email || '') + (r.company_name ? ' (' + r.company_name + ')' : '');
            if (dq.table === 'estimates') return (i+1) + '. ' + (r.estimate_number || '') + ' — ' + (r.project_name || '') + ' — $' + (r.total || 0) + ' — ' + (r.status || '');
            if (dq.table === 'employee_profiles') return (i+1) + '. ' + (r.first_name || '') + ' ' + (r.last_name || '') + ' — ' + (r.title || '') + ' — ' + (r.status || '');
            if (dq.table === 'vendors') return (i+1) + '. ' + (r.company_name || '') + ' — ' + (r.trade || '') + ' — ' + (r.contact_name || '');
            if (dq.table === 'activity_log') return (i+1) + '. ' + (r.action || '') + ' — ' + (r.details || '') + ' — ' + (r.created_at || '');
            if (dq.table === 'admin_notifications') return (i+1) + '. ' + (r.title || '') + ' — ' + (r.body || '') + ' — ' + (r.read ? 'read' : 'unread');
            return JSON.stringify(r);
          }).join('\n');
          contextNote += '\n\n## LIVE DATA — ' + dq.table.toUpperCase() + ' (most recent ' + rows.length + '):\n' + summary + '\n\nSummarize this data for the user.';
        } else {
          contextNote += '\n\n## LIVE DATA — ' + dq.table.toUpperCase() + ': No records found.';
        }
        break;
      }
    }

    const fullPrompt = SYSTEM_PROMPT + contextNote;
    const preferClaude = useModel !== 'groq' && !!claudeKey;
    let content = '';

    if (preferClaude) {
      try {
        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': claudeKey!, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 4000,
            system: fullPrompt,
            messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
          }),
        });
        if (claudeRes.ok) {
          const d = await claudeRes.json();
          content = d.content?.[0]?.text || '';
        } else {
          console.error('[ai-chat] Claude error:', claudeRes.status);
        }
      } catch (err) {
        console.error('[ai-chat] Claude failed:', err);
      }
    }

    if (!content && groqKey) {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: fullPrompt }, ...messages],
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

    // Detect web search request
    const searchMatch = content.match(/```search\s*(\{[\s\S]*?\})\s*```/);
    if (searchMatch) {
      try {
        const searchReq = JSON.parse(searchMatch[1]);
        if (searchReq.query) {
          // Run web search via Google Custom Search (free tier) or fallback
          const searchResults = await webSearch(searchReq.query);

          // Strip the search block from the content
          content = content.replace(/```search[\s\S]*?```/g, '').trim();

          // Second AI call with search results injected
          const searchContext = `\n\n## WEB SEARCH RESULTS for "${searchReq.query}":\n${searchResults}\n\nNow answer the user's question using these search results. Include source URLs when citing information.`;

          const res2 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [
                { role: 'system', content: SYSTEM_PROMPT + contextNote + searchContext },
                ...messages,
              ],
              temperature: 0.7,
              max_tokens: 2000,
            }),
          });

          if (res2.ok) {
            const data2 = await res2.json();
            content = data2.choices?.[0]?.message?.content || content;
            // Clean any nested search blocks
            content = content.replace(/```search[\s\S]*?```/g, '').trim();
          }
        }
      } catch (err) {
        console.error('[ai-chat] search error:', err);
      }
    }

    // Detect memory save commands — handle malformed blocks too
    const memoryMatch = content.match(/`{1,3}memory\s*(\{[\s\S]*?\})\s*`{0,3}/);
    if (memoryMatch) {
      try {
        const mem = JSON.parse(memoryMatch[1]);
        await supabase.from('ai_memories').insert({
          content: mem.content,
          category: mem.category || 'general',
          source: 'ai',
        });
      } catch {}
    }

    // Detect forget commands
    const forgetMatch = content.match(/`{1,3}forget\s*(\{[\s\S]*?\})\s*`{0,3}/);
    if (forgetMatch) {
      try {
        const fg = JSON.parse(forgetMatch[1]);
        if (fg.content) {
          await supabase.from('ai_memories').delete().ilike('content', `%${fg.content}%`);
        }
      } catch {}
      content = content.replace(/```forget[\s\S]*?```/g, '').trim();
    }

    // Final cleanup — strip ALL code blocks that are command blocks (memory, forget, search, action)
    content = content.replace(/`{1,3}(?:memory|forget|search|action)\s*\{[\s\S]*?\}\s*`{0,3}/g, '').trim();
    // Also strip any remaining triple-backtick blocks that look like commands
    content = content.replace(/```(?:memory|forget|search|action)[\s\S]*?```/g, '').trim();

    return NextResponse.json({ role: 'assistant', content });
  } catch (err: any) {
    console.error('[ai-chat] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
