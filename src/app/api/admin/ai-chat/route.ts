import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { recalcEstimateTotals } from '@/lib/estimates';

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

// ── READ TOOLS ──
const READ_TOOLS = [
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

// ── WRITE TOOLS ──
const WRITE_TOOLS = [
  {
    name: 'create_customer',
    description: 'Create a new customer in the database. Requires first_name and last_name at minimum. Returns the created customer record with its ID.',
    input_schema: {
      type: 'object' as const,
      properties: {
        first_name: { type: 'string', description: 'Customer first name (required)' },
        last_name: { type: 'string', description: 'Customer last name (required)' },
        company_name: { type: 'string', description: 'Company name (optional)' },
        email: { type: 'string', description: 'Email address' },
        phone: { type: 'string', description: 'Phone number' },
        address: { type: 'string', description: 'Street address' },
        city: { type: 'string', description: 'City' },
        state: { type: 'string', description: 'State (default SC)' },
        zip: { type: 'string', description: 'ZIP code' },
        type: { type: 'string', description: 'Customer type: residential or commercial (default residential)' },
        source: { type: 'string', description: 'How they found us: referral, website, google, etc.' },
      },
      required: ['first_name', 'last_name'],
    },
  },
  {
    name: 'update_customer',
    description: 'Update an existing customer record. Requires the customer ID. Pass any fields you want to change.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Customer UUID (required)' },
        first_name: { type: 'string', description: 'Customer first name' },
        last_name: { type: 'string', description: 'Customer last name' },
        company_name: { type: 'string', description: 'Company name' },
        email: { type: 'string', description: 'Email address' },
        phone: { type: 'string', description: 'Phone number' },
        address: { type: 'string', description: 'Street address' },
        city: { type: 'string', description: 'City' },
        state: { type: 'string', description: 'State' },
        zip: { type: 'string', description: 'ZIP code' },
        type: { type: 'string', description: 'residential or commercial' },
        source: { type: 'string', description: 'Lead source' },
        notes: { type: 'string', description: 'Notes about the customer' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_estimate',
    description: 'Create a new estimate/proposal/change order/quick quote. Requires customer_id. Returns the created estimate with auto-generated estimate number. After creating, navigate the user to the estimate editor.',
    input_schema: {
      type: 'object' as const,
      properties: {
        customer_id: { type: 'string', description: 'Customer UUID (required)' },
        document_mode: { type: 'string', description: 'Type: estimate, contract, change_order, quick_quote (default estimate)' },
        project_name: { type: 'string', description: 'Project name/title' },
        division: { type: 'string', description: 'Division value (use exact lowercase): residential, commercial, grading, concrete, foundation, framing, roofing, siding, electrical, plumbing, hvac, painting, flooring, demolition, drywall, landscaping, fencing, other' },
        estimate_type: { type: 'string', description: 'Estimate type (use exact value): new_construction, renovation, repair, addition, remodel, commercial, quick_quote, preliminary, detailed, change_order, time_materials' },
        contract_type: { type: 'string', description: 'Contract type (use exact value): fixed_price, cost_plus, time_materials, unit_price' },
        project_address: { type: 'string', description: 'Project street address' },
        project_city: { type: 'string', description: 'Project city' },
        project_state: { type: 'string', description: 'Project state (default SC)' },
        project_zip: { type: 'string', description: 'Project ZIP code' },
        scope_of_work: { type: 'string', description: 'Scope of work / project description text' },
        overhead_percent: { type: 'number', description: 'Overhead percentage (default 0)' },
        markup_percent: { type: 'number', description: 'Markup percentage (default 0)' },
        tax_percent: { type: 'number', description: 'Tax percentage (default 0)' },
        contingency_percent: { type: 'number', description: 'Contingency percentage (default 0)' },
        permit_fees: { type: 'number', description: 'Permit fees amount (default 0)' },
      },
      required: ['customer_id'],
    },
  },
  {
    name: 'update_estimate',
    description: 'Update fields on an existing estimate. Pass the estimate ID and any fields to change. scope_of_work maps to the project_description column. Financial field changes will auto-recalculate totals.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Estimate UUID (required)' },
        project_name: { type: 'string', description: 'Project name' },
        division: { type: 'string', description: 'Division (exact value): residential, commercial, grading, concrete, foundation, framing, roofing, siding, electrical, plumbing, hvac, painting, flooring, demolition, drywall, landscaping, fencing, other' },
        estimate_type: { type: 'string', description: 'Estimate type (exact value): quick_quote, preliminary, detailed, change_order, time_materials' },
        contract_type: { type: 'string', description: 'Contract type (exact value): fixed_price, cost_plus, time_materials, unit_price' },
        document_mode: { type: 'string', description: 'Document mode: estimate, contract, change_order, quick_quote' },
        scope_of_work: { type: 'string', description: 'Scope of work text (maps to project_description)' },
        project_address: { type: 'string', description: 'Project street address' },
        project_city: { type: 'string', description: 'Project city' },
        project_state: { type: 'string', description: 'Project state' },
        project_zip: { type: 'string', description: 'Project ZIP code' },
        overhead_percent: { type: 'number', description: 'Overhead %' },
        markup_percent: { type: 'number', description: 'Markup %' },
        tax_percent: { type: 'number', description: 'Tax %' },
        contingency_percent: { type: 'number', description: 'Contingency %' },
        permit_fees: { type: 'number', description: 'Permit fees $' },
        valid_until: { type: 'string', description: 'Expiration date ISO string' },
        notes: { type: 'string', description: 'Internal notes' },
        inclusions: { type: 'string', description: 'Inclusions text' },
        project_start_date: { type: 'string', description: 'Start date ISO string' },
        project_duration_days: { type: 'number', description: 'Project duration in days' },
        schedule_notes: { type: 'string', description: 'Schedule notes' },
      },
      required: ['id'],
    },
  },
  {
    name: 'add_line_items',
    description: 'Add one or more line items to an estimate. Each item has phase, description, category, quantity, unit, unit_cost, and optional markup_percent. Totals are auto-recalculated.',
    input_schema: {
      type: 'object' as const,
      properties: {
        estimate_id: { type: 'string', description: 'Estimate UUID (required)' },
        items: {
          type: 'array',
          description: 'Array of line items to add',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string', description: 'Phase name (e.g., "Site Prep", "Framing", "Finishing")' },
              description: { type: 'string', description: 'Line item description (required)' },
              category: { type: 'string', description: 'Category: material, labor, equipment, subcontractor' },
              quantity: { type: 'number', description: 'Quantity (default 1)' },
              unit: { type: 'string', description: 'Unit: sqft, lnft, cuyd, each, hour, day, lump_sum, etc.' },
              unit_cost: { type: 'number', description: 'Cost per unit (required)' },
              markup_percent: { type: 'number', description: 'Markup % on this item (default 0)' },
            },
          },
        },
      },
      required: ['estimate_id', 'items'],
    },
  },
  {
    name: 'update_estimate_status',
    description: 'Update the status of an estimate. Valid transitions: draft->sent, sent->viewed/accepted/declined/expired/revised, viewed->accepted/declined/expired/revised, accepted/declined/expired->revised, revised->sent.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Estimate UUID (required)' },
        status: { type: 'string', description: 'New status: draft, sent, viewed, accepted, declined, expired, revised (required)' },
        notes: { type: 'string', description: 'Optional notes about the status change' },
      },
      required: ['id', 'status'],
    },
  },
  {
    name: 'send_estimate',
    description: 'Send an estimate to a customer via email with PDF attachment. The estimate must exist and have line items. This will also update the status to "sent".',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Estimate UUID (required)' },
        to_email: { type: 'string', description: 'Recipient email address (required)' },
        to_name: { type: 'string', description: 'Recipient name' },
        message: { type: 'string', description: 'Custom message to include in the email' },
        from_email: { type: 'string', description: 'Sender email address (defaults to company default)' },
      },
      required: ['id', 'to_email'],
    },
  },
  {
    name: 'generate_share_link',
    description: 'Generate a shareable link for an estimate. The link allows the customer to view the estimate without logging in. Links expire after 60 days.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Estimate UUID (required)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'duplicate_estimate',
    description: 'Create a revision/duplicate of an existing estimate. Copies all line items, payment schedule, and settings. The new estimate gets a revision number suffix (e.g., RO-EST-2026-001-R1).',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Estimate UUID to duplicate/revise (required)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'check_estimate_pricing',
    description: 'Run a pricing validation check on an estimate. Returns warnings about missing data, unusual markups, or pricing issues. Use before sending to catch problems.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Estimate UUID (required)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'compose_email',
    description: 'Send a general email (not estimate-specific). For sending follow-ups, thank yous, or any other email. Uses Resend email service.',
    input_schema: {
      type: 'object' as const,
      properties: {
        to_email: { type: 'string', description: 'Recipient email address (required)' },
        to_name: { type: 'string', description: 'Recipient name' },
        subject: { type: 'string', description: 'Email subject line (required)' },
        body: { type: 'string', description: 'Email body text (required). Can include HTML or plain text.' },
        from_email: { type: 'string', description: 'Sender email (defaults to company default)' },
      },
      required: ['to_email', 'subject', 'body'],
    },
  },
  {
    name: 'search_templates',
    description: 'Search estimate templates by division and/or estimate type. Templates contain pre-built line items for common project types.',
    input_schema: {
      type: 'object' as const,
      properties: {
        division: { type: 'string', description: 'Filter by division' },
        estimate_type: { type: 'string', description: 'Filter by estimate type' },
      },
    },
  },
  {
    name: 'search_disclaimers',
    description: 'Search available disclaimers/terms & conditions by category. These are added to estimates before sending.',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: { type: 'string', description: 'Filter by category' },
      },
    },
  },
  {
    name: 'navigate',
    description: 'Navigate the user to a specific page in the admin app. Use when the user asks to go somewhere, open something, or when you created a record and want to take them to it. Do NOT use this for fetching data — use search tools instead.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'The app path to navigate to, e.g. /admin/estimates, /admin/customers, /admin/estimates/[uuid]' },
        description: { type: 'string', description: 'Brief description of what is at this destination, e.g. "Opening the new estimate wizard"' },
      },
      required: ['path'],
    },
  },
];

const TOOLS = [...READ_TOOLS, ...WRITE_TOOLS];

// ═══════════════════════════════════════════
// TOOL EXECUTION
// ═══════════════════════════════════════════
async function executeTool(name: string, input: any, supabase: ReturnType<typeof createAdminClient>): Promise<{ result: string; action?: { type: string; path: string; description: string } }> {
  switch (name) {
    // ── READ TOOLS ──
    case 'search_customers': {
      const q = input.query?.toLowerCase() || '';
      const limit = input.limit || 15;
      const { data } = await supabase
        .from('customers')
        .select('id, first_name, last_name, company_name, email, phone, address, city, state, zip, created_at')
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,company_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (!data?.length) return { result: `No customers found matching "${input.query}".` };
      return { result: JSON.stringify(data, null, 2) };
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
        const { data: byCustomer } = await supabase
          .from('estimates')
          .select('id, estimate_number, project_name, total, status, division, document_mode, created_at, customer:customers!inner(first_name, last_name, company_name)')
          .or(`customers.first_name.ilike.%${q}%,customers.last_name.ilike.%${q}%,customers.company_name.ilike.%${q}%`, { referencedTable: 'customers' })
          .order('created_at', { ascending: false })
          .limit(limit);
        if (!byCustomer?.length) return { result: `No estimates found matching "${input.query}".` };
        return { result: JSON.stringify(byCustomer, null, 2) };
      }
      return { result: JSON.stringify(data, null, 2) };
    }

    case 'get_estimate_details': {
      let estimateQuery = supabase
        .from('estimates')
        .select('*, customer:customers(first_name, last_name, company_name, email, phone)');
      if (input.estimate_id) {
        estimateQuery = estimateQuery.eq('id', input.estimate_id);
      } else if (input.estimate_number) {
        estimateQuery = estimateQuery.eq('estimate_number', input.estimate_number);
      } else {
        return { result: 'Please provide an estimate_id or estimate_number.' };
      }
      const { data: estimate } = await estimateQuery.single();
      if (!estimate) return { result: 'Estimate not found.' };

      const [{ data: lineItems }, { data: payments }, { data: history }] = await Promise.all([
        supabase.from('estimate_line_items').select('*').eq('estimate_id', estimate.id).order('sort_order'),
        supabase.from('estimate_payment_schedules').select('*').eq('estimate_id', estimate.id).order('sort_order'),
        supabase.from('estimate_status_history').select('*').eq('estimate_id', estimate.id).order('changed_at', { ascending: false }),
      ]);

      return {
        result: JSON.stringify({
          ...estimate,
          line_items: lineItems || [],
          payment_schedule: payments || [],
          status_history: history || [],
        }, null, 2),
      };
    }

    case 'search_employees': {
      const q = input.query?.toLowerCase() || '';
      let query = supabase
        .from('employee_profiles')
        .select('id, first_name, last_name, title, department, status, phone, email, hire_date, pay_rate, pay_type, employment_type')
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,title.ilike.%${q}%,department.ilike.%${q}%`);
      if (input.status) query = query.eq('status', input.status);
      const { data } = await query.order('created_at', { ascending: false }).limit(15);
      if (!data?.length) return { result: `No employees found matching "${input.query}".` };
      return { result: JSON.stringify(data, null, 2) };
    }

    case 'search_vendors': {
      const q = input.query?.toLowerCase() || '';
      const { data } = await supabase
        .from('vendors')
        .select('id, company_name, contact_name, trade, type, phone, email, is_preferred, is_active')
        .or(`company_name.ilike.%${q}%,contact_name.ilike.%${q}%,trade.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(15);
      if (!data?.length) return { result: `No vendors found matching "${input.query}".` };
      return { result: JSON.stringify(data, null, 2) };
    }

    case 'get_activity_log': {
      const limit = input.limit || 15;
      let query = supabase.from('activity_log').select('*');
      if (input.action_filter) query = query.ilike('action', `%${input.action_filter}%`);
      const { data } = await query.order('created_at', { ascending: false }).limit(limit);
      if (!data?.length) return { result: 'No activity log entries found.' };
      return { result: JSON.stringify(data, null, 2) };
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
      if (!data?.length) return { result: `No cost items found matching "${input.query}".` };
      return { result: JSON.stringify(data, null, 2) };
    }

    case 'web_search': {
      return { result: await webSearch(input.query) };
    }

    case 'save_memory': {
      await supabase.from('ai_memories').insert({
        content: input.content,
        category: input.category || 'general',
        source: 'ai',
      });
      return { result: `Memory saved: "${input.content}" (category: ${input.category})` };
    }

    case 'forget_memory': {
      const { data: deleted } = await supabase
        .from('ai_memories')
        .delete()
        .ilike('content', `%${input.keyword}%`)
        .select('content');
      if (deleted?.length) return { result: `Deleted ${deleted.length} memory/memories matching "${input.keyword}".` };
      return { result: `No memories found matching "${input.keyword}".` };
    }

    // ── WRITE TOOLS ──
    case 'create_customer': {
      if (!input.first_name || !input.last_name) {
        return { result: 'Error: first_name and last_name are required to create a customer.' };
      }
      const { data, error } = await supabase
        .from('customers')
        .insert({
          first_name: input.first_name,
          last_name: input.last_name,
          company_name: input.company_name || null,
          email: input.email || null,
          phone: input.phone || null,
          address: input.address || null,
          city: input.city || null,
          state: input.state || 'SC',
          zip: input.zip || null,
          type: input.type || 'residential',
          source: input.source || null,
        })
        .select()
        .single();
      if (error) return { result: `Error creating customer: ${error.message}` };
      return { result: `Customer created successfully:\n${JSON.stringify(data, null, 2)}` };
    }

    case 'update_customer': {
      if (!input.id) return { result: 'Error: customer id is required.' };
      const { id, ...fields } = input;
      if (Object.keys(fields).length === 0) return { result: 'Error: no fields provided to update.' };
      const { data, error } = await supabase
        .from('customers')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) return { result: `Error updating customer: ${error.message}` };
      if (!data) return { result: 'Customer not found.' };
      return { result: `Customer updated successfully:\n${JSON.stringify(data, null, 2)}` };
    }

    case 'create_estimate': {
      if (!input.customer_id) return { result: 'Error: customer_id is required to create an estimate.' };

      const year = new Date().getFullYear();
      const docMode = input.document_mode || 'estimate';
      const prefixMap: Record<string, string> = {
        estimate: 'RO-EST',
        contract: 'RO-CON',
        change_order: 'RO-CO',
        quick_quote: 'RO-QQ',
      };
      const docPrefix = prefixMap[docMode] || 'RO-EST';
      const prefix = `${docPrefix}-${year}-`;

      const { data: existing } = await supabase
        .from('estimates')
        .select('estimate_number')
        .like('estimate_number', `${prefix}%`)
        .order('estimate_number', { ascending: false })
        .limit(1);

      let nextNum = 1;
      if (existing && existing.length > 0) {
        const lastNum = parseInt(existing[0].estimate_number.replace(prefix, ''), 10);
        if (!isNaN(lastNum)) nextNum = lastNum + 1;
      }
      const estimate_number = `${prefix}${String(nextNum).padStart(4, '0')}`;

      const { data, error } = await supabase
        .from('estimates')
        .insert({
          estimate_number,
          customer_id: input.customer_id,
          document_mode: docMode,
          status: 'draft',
          version: 1,
          project_name: input.project_name || null,
          project_address: input.project_address || null,
          project_city: input.project_city || null,
          project_state: input.project_state || 'SC',
          project_zip: input.project_zip || null,
          estimate_type: input.estimate_type || null,
          contract_type: input.contract_type || null,
          division: input.division || null,
          project_description: input.scope_of_work || null,
          overhead_percent: input.overhead_percent ?? 0,
          markup_percent: input.markup_percent ?? 0,
          tax_percent: input.tax_percent ?? 0,
          contingency_percent: input.contingency_percent ?? 0,
          permit_fees: input.permit_fees ?? 0,
        })
        .select()
        .single();
      if (error) return { result: `Error creating estimate: ${error.message}` };
      return {
        result: `Estimate created successfully:\n${JSON.stringify(data, null, 2)}`,
        action: { type: 'navigate', path: `/admin/estimates/${data.id}`, description: `Opening estimate ${estimate_number}` },
      };
    }

    case 'update_estimate': {
      if (!input.id) return { result: 'Error: estimate id is required.' };
      const { id, ...fields } = input;

      // Map scope_of_work to project_description
      if (fields.scope_of_work !== undefined) {
        fields.project_description = fields.scope_of_work;
        delete fields.scope_of_work;
      }

      if (Object.keys(fields).length === 0) return { result: 'Error: no fields provided to update.' };

      // Check if financial fields changed — recalculate if so
      const financialFields = ['overhead_percent', 'markup_percent', 'tax_percent', 'contingency_percent', 'permit_fees'];
      const financialChanged = financialFields.some((f) => (fields as any)[f] !== undefined);

      if (financialChanged) {
        const [{ data: currentEst }, { data: lineItems }] = await Promise.all([
          supabase.from('estimates').select('*').eq('id', id).single(),
          supabase.from('estimate_line_items').select('*').eq('estimate_id', id),
        ]);
        if (currentEst) {
          const merged = { ...currentEst, ...fields };
          const totals = recalcEstimateTotals(lineItems || [], merged);
          Object.assign(fields, totals);
        }
      }

      const { data, error } = await supabase
        .from('estimates')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) return { result: `Error updating estimate: ${error.message}` };
      if (!data) return { result: 'Estimate not found.' };
      return { result: `Estimate updated successfully:\n${JSON.stringify(data, null, 2)}` };
    }

    case 'add_line_items': {
      if (!input.estimate_id) return { result: 'Error: estimate_id is required.' };
      if (!input.items?.length) return { result: 'Error: items array is required and must not be empty.' };

      const results: any[] = [];
      for (const item of input.items) {
        const quantity = item.quantity || 1;
        const unit_cost = item.unit_cost || 0;
        const markup_percent = item.markup_percent || 0;
        const total = quantity * unit_cost * (1 + markup_percent / 100);

        const { data, error } = await supabase
          .from('estimate_line_items')
          .insert({
            estimate_id: input.estimate_id,
            phase: item.phase || null,
            category: item.category || null,
            description: item.description || null,
            quantity,
            unit: item.unit || null,
            unit_cost,
            markup_percent,
            total,
            sort_order: item.sort_order ?? 0,
          })
          .select()
          .single();
        if (error) {
          results.push({ error: error.message, item });
        } else {
          results.push(data);
        }
      }

      // Recalculate estimate totals
      const [{ data: est }, { data: allItems }] = await Promise.all([
        supabase.from('estimates').select('*').eq('id', input.estimate_id).single(),
        supabase.from('estimate_line_items').select('*').eq('estimate_id', input.estimate_id),
      ]);
      if (est) {
        const totals = recalcEstimateTotals(allItems || [], est);
        await supabase.from('estimates').update({ ...totals, updated_at: new Date().toISOString() }).eq('id', input.estimate_id);
      }

      return { result: `Added ${results.filter(r => !r.error).length} line item(s):\n${JSON.stringify(results, null, 2)}` };
    }

    case 'update_estimate_status': {
      if (!input.id || !input.status) return { result: 'Error: id and status are required.' };

      const VALID_TRANSITIONS: Record<string, string[]> = {
        draft: ['sent'],
        sent: ['viewed', 'accepted', 'declined', 'expired', 'revised'],
        viewed: ['accepted', 'declined', 'expired', 'revised'],
        accepted: ['revised'],
        declined: ['revised'],
        expired: ['revised'],
        revised: ['sent'],
      };

      const { data: current } = await supabase.from('estimates').select('status').eq('id', input.id).single();
      if (!current) return { result: 'Estimate not found.' };

      const allowed = VALID_TRANSITIONS[current.status] || [];
      if (!allowed.includes(input.status)) {
        return { result: `Invalid status transition: ${current.status} -> ${input.status}. Allowed transitions from "${current.status}": ${allowed.join(', ') || 'none'}` };
      }

      const STATUS_TIMESTAMPS: Record<string, string> = {
        sent: 'sent_at',
        viewed: 'viewed_at',
        accepted: 'accepted_at',
        declined: 'declined_at',
      };

      const updateFields: any = { status: input.status, updated_at: new Date().toISOString() };
      if (STATUS_TIMESTAMPS[input.status]) {
        updateFields[STATUS_TIMESTAMPS[input.status]] = new Date().toISOString();
      }

      const { error: updateErr } = await supabase.from('estimates').update(updateFields).eq('id', input.id);
      if (updateErr) return { result: `Error updating status: ${updateErr.message}` };

      // Insert status history
      await supabase.from('estimate_status_history').insert({
        estimate_id: input.id,
        old_status: current.status,
        new_status: input.status,
        notes: input.notes || null,
        changed_by: 'ai-assistant',
      });

      return { result: `Status updated: ${current.status} -> ${input.status}` };
    }

    case 'send_estimate': {
      if (!input.id || !input.to_email) return { result: 'Error: id and to_email are required.' };

      // Use internal HTTP call for send because it generates PDF and uses Resend
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
      try {
        const res = await fetch(`${baseUrl}/api/admin/estimates/${input.id}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to_email: input.to_email,
            to_name: input.to_name || '',
            message: input.message || '',
            from_email: input.from_email || '',
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }));
          return { result: `Error sending estimate: ${err.error || res.statusText}` };
        }
        const data = await res.json();
        return { result: `Estimate sent successfully to ${input.to_email}.\n${JSON.stringify(data, null, 2)}` };
      } catch (err: any) {
        return { result: `Error sending estimate: ${err.message}` };
      }
    }

    case 'generate_share_link': {
      if (!input.id) return { result: 'Error: estimate id is required.' };

      const { data: estimate } = await supabase
        .from('estimates')
        .select('share_token, share_token_expires_at, estimate_number')
        .eq('id', input.id)
        .single();
      if (!estimate) return { result: 'Estimate not found.' };

      let token = estimate.share_token;
      const now = new Date();
      const expiresAt = estimate.share_token_expires_at ? new Date(estimate.share_token_expires_at) : null;

      if (!token || !expiresAt || expiresAt < now) {
        const crypto = await import('crypto');
        token = crypto.randomBytes(16).toString('hex');
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 60);

        await supabase.from('estimates').update({
          share_token: token,
          share_token_expires_at: newExpiry.toISOString(),
        }).eq('id', input.id);
      }

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
      const link = `${baseUrl}/estimate/${token}`;
      return { result: `Share link generated for ${estimate.estimate_number}:\n${link}\n\nExpires in 60 days.` };
    }

    case 'duplicate_estimate': {
      if (!input.id) return { result: 'Error: estimate id is required.' };

      // Use internal HTTP call for revise because it has complex duplication logic
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
      try {
        const res = await fetch(`${baseUrl}/api/admin/estimates/${input.id}/revise`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }));
          return { result: `Error duplicating estimate: ${err.error || res.statusText}` };
        }
        const data = await res.json();
        return {
          result: `Estimate duplicated successfully:\n${JSON.stringify(data, null, 2)}`,
          action: { type: 'navigate', path: `/admin/estimates/${data.id}`, description: `Opening revised estimate ${data.estimate_number}` },
        };
      } catch (err: any) {
        return { result: `Error duplicating estimate: ${err.message}` };
      }
    }

    case 'check_estimate_pricing': {
      if (!input.id) return { result: 'Error: estimate id is required.' };

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
      try {
        const res = await fetch(`${baseUrl}/api/admin/estimates/${input.id}/pricing-check`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }));
          return { result: `Error checking pricing: ${err.error || res.statusText}` };
        }
        const data = await res.json();
        return { result: JSON.stringify(data, null, 2) };
      } catch (err: any) {
        return { result: `Error checking pricing: ${err.message}` };
      }
    }

    case 'compose_email': {
      if (!input.to_email || !input.subject || !input.body) {
        return { result: 'Error: to_email, subject, and body are required.' };
      }

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
      try {
        const res = await fetch(`${baseUrl}/api/email/compose`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to_email: input.to_email,
            to_name: input.to_name || '',
            subject: input.subject,
            body: input.body,
            from_email: input.from_email || '',
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }));
          return { result: `Error sending email: ${err.error || res.statusText}` };
        }
        return { result: `Email sent successfully to ${input.to_email} with subject "${input.subject}".` };
      } catch (err: any) {
        return { result: `Error sending email: ${err.message}` };
      }
    }

    case 'search_templates': {
      let query = supabase
        .from('estimate_templates')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (input.division) query = query.eq('division', input.division);
      if (input.estimate_type) query = query.eq('estimate_type', input.estimate_type);
      const { data, error } = await query;
      if (error) return { result: `Error searching templates: ${error.message}` };
      if (!data?.length) return { result: 'No templates found matching the criteria.' };
      return { result: JSON.stringify(data, null, 2) };
    }

    case 'search_disclaimers': {
      let query = supabase
        .from('disclaimers')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (input.category) query = query.eq('category', input.category);
      const { data, error } = await query;
      if (error) return { result: `Error searching disclaimers: ${error.message}` };
      if (!data?.length) return { result: 'No disclaimers found.' };
      return { result: JSON.stringify(data, null, 2) };
    }

    case 'navigate': {
      return {
        result: `Navigation action: taking user to ${input.path}`,
        action: { type: 'navigate', path: input.path, description: input.description || `Navigating to ${input.path}` },
      };
    }

    default:
      return { result: `Unknown tool: ${name}` };
  }
}

// ═══════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════
const SYSTEM_PROMPT = `You are RO Assistant — the AI for RO Unlimited Construction & Development (Greenville, SC — serving SC, GA, NC).

## CRITICAL RULES
1. **NEVER fabricate business data.** ALWAYS use tools to query real database records. When presenting data from tools, reference exact numbers and names from the results.
2. **ALWAYS use tools for data queries.** If someone asks "pull up Sherry's quote" — call search_estimates with query "Sherry". Present ONLY what the tool returns.
3. **Be concise.** Short answers unless detail is asked for.
4. **Use markdown** for formatting: **bold**, bullet lists, tables for data.
5. **For construction questions:** practical answers with SC code references.
6. **If a tool returns no results:** say "I couldn't find any matching records" — never make up data.
7. **For write operations:** Confirm what you're about to do before executing destructive or irreversible actions (sending emails, changing status).
8. **Navigate after creating:** When you create an estimate or customer, use the navigate tool to take the user to the new record.

## ESTIMATE BUILDER — DRAFT-FIRST RULE (CRITICAL)
When the user asks you to "make an estimate", "build a quote", "create an estimate" or anything similar:
1. **NEVER immediately create the estimate in the database.**
2. First, gather info — ask what's needed if unclear (customer, project type, scope, location).
3. Then present a **FULL DRAFT in the chat** using this format:

**[Project Name] — [Customer Name]**
Division: [division] | Type: [estimate_type] | Contract: [contract_type]
Address: [address if provided]

**[Phase Name]**
- [Description] — [qty] [unit] @ $[unit_cost]/[unit] = $[total]
- [Description] — [qty] [unit] @ $[unit_cost]/[unit] = $[total]
Phase subtotal: $X,XXX

**[Next Phase]**
- ...

---
**Subtotal:** $XX,XXX
**Overhead (X%):** $X,XXX
**Tax (X%):** $X,XXX
**Contingency (X%):** $X,XXX
**Grand Total:** $XX,XXX

**Payment Schedule:**
- Deposit (30%): $X,XXX — due at signing
- Progress (40%): $X,XXX — due at rough-in
- Final (30%): $X,XXX — due at completion

> Ready to commit this estimate? Say **"yes"** or tell me what to change.

4. Wait for the user to say "yes", "commit", "looks good", "go ahead", etc.
5. ONLY THEN call create_estimate, add_line_items, and navigate to the new estimate.
6. If the user wants changes ("make the tile $12/sqft", "add a second vanity"), update the draft in the chat and present it again.
7. The user may come back hours or days later to continue — the conversation is saved. Pick up where you left off.

## ESTIMATE TYPE → RECOMMENDED PHASES
Use these as templates when building estimates. Adjust based on the specific project.

**New Construction:**
- Site Prep (clearing, grading, erosion control)
- Foundation (footings, slab/crawlspace, waterproofing)
- Framing (walls, roof structure, sheathing)
- Roofing (underlayment, shingles/metal, flashing, gutters)
- Exterior (siding, windows, doors, trim)
- Plumbing Rough-In (supply lines, drain/waste/vent, fixtures)
- Electrical Rough-In (panel, circuits, outlets, switches, fixtures)
- HVAC (ductwork, equipment, controls)
- Insulation (walls, attic, crawlspace)
- Drywall (hang, tape, finish, texture)
- Flooring (subfloor prep, LVP/tile/hardwood/carpet)
- Paint (interior walls, trim, ceilings; exterior)
- Trim & Finish (baseboards, crown, doors, hardware)
- Landscaping (grading, sod, plants, irrigation)
- Cleanup (construction debris, final clean)

**Renovation / Remodel:**
- Demo (selective demolition, haul-off)
- Structural (any load-bearing changes, headers, beams)
- Plumbing Updates (relocate/add fixtures, re-pipe)
- Electrical Updates (new circuits, panel upgrade, fixtures)
- HVAC Modifications (extend ductwork, add returns)
- Framing (new walls, soffits, blocking)
- Insulation (where opened up)
- Drywall (patch, new walls, finish)
- Flooring (remove old, prep, install new)
- Tile (backsplash, shower, floor)
- Cabinets & Countertops (install, trim)
- Paint (walls, trim, ceilings)
- Fixtures & Hardware (faucets, lights, handles)
- Cleanup (debris removal, final clean)

**Repair:**
- Assessment & Diagnosis
- Materials
- Labor
- Cleanup

**Addition:**
- Site Prep (excavation, utilities locate)
- Foundation (footings, stem wall/slab)
- Framing (walls, roof tie-in to existing)
- Roofing (new section + tie-in)
- Exterior Envelope (siding match, windows, doors)
- Plumbing (extend from existing)
- Electrical (extend from existing, sub-panel if needed)
- HVAC (extend ductwork, additional tonnage)
- Insulation
- Drywall
- Flooring
- Paint
- Trim & Finish
- Transition Work (blend old and new — flooring, paint, trim)
- Cleanup

**Commercial:**
- Site Work (parking, grading, utilities)
- Foundation & Slab
- Structural Steel / Framing
- Roofing (commercial flat/TPO/metal)
- Exterior (curtain wall, storefront, masonry)
- Plumbing (commercial fixtures, grease traps, backflow)
- Electrical (3-phase, commercial panel, fire alarm)
- HVAC (commercial units, VAV, controls)
- Fire Suppression (sprinkler system)
- Insulation & Vapor Barrier
- Drywall / Metal Stud
- Flooring (commercial tile, polished concrete, carpet tile)
- Paint
- ADA Compliance (ramps, restrooms, signage)
- Specialty (kitchen equipment, built-ins, security)
- Cleanup & Commissioning

**Quick Quote:**
- Keep it simple — 1-3 phases, ballpark pricing
- Include a note: "This is a preliminary estimate. Final pricing may vary after site inspection."

**Change Order:**
- Original Scope Reference
- Added/Changed Work (itemized)
- Credit for Removed Work (if applicable)
- Net Change Amount

## ADMIN APP PAGES & NAVIGATION

### Dashboard (/admin)
- Overview with KPIs: revenue, estimates sent/accepted, conversion rate
- Recent activity feed, upcoming deadlines
- Quick action buttons for new estimate, new customer

### Estimates (/admin/estimates)
- List view with filters: status, division, document type, date range
- Search by customer name, project name, estimate number
- Status badges: draft (gray), sent (blue), viewed (yellow), accepted (green), declined (red), expired (orange)
- Click any estimate to open the editor

### Estimate Editor (/admin/estimates/[id])
- **8-step wizard:**
  1. **Document Setup** — document type (Estimate/Proposal/Change Order/Quick Quote), customer selection
  2. **Project Info** — project name, division (19 options + Other), estimate type (new construction/renovation/repair/addition/commercial), contract type, project address
  3. **Scope of Work** — rich text editor for project description (stored as project_description column)
  4. **Line Items** — add items by phase, each with: description, category (material/labor/equipment/subcontractor), quantity, unit, unit cost, markup %. AI can auto-generate line items.
  5. **Financials** — overhead %, markup %, tax %, contingency %, permit fees. Auto-calculates subtotal, overhead, markup, tax, contingency, grand total.
  6. **Schedule & Payments** — project start date, duration, weather days, payment milestones (% or fixed amounts with due descriptions)
  7. **Terms & Disclaimers** — select from disclaimer library, add inclusions/exclusions
  8. **Review & Send** — preview PDF, pricing check, send via email, generate share link

### Email Client (/admin/inbox)
- Multi-account Gmail-style email client
- Compose new emails, reply, forward
- Drag-and-drop file attachments
- Thread view with conversation history
- Labels and folders

### Customers (/admin/customers)
- List with search, filter by type (residential/commercial)
- Customer detail page with contact info, address, associated estimates, email history
- Create new customer form: first name, last name, company, email, phone, address, type, source

### Vendors (/admin/vendors)
- List with search, filter by trade, preferred status
- Vendor detail: company name, contact, trade, type, phone, email, insurance info, W9 status

### Employees (/admin/employees)
- List with search, filter by department, status (active/suspended/terminated)
- **8 tabs per employee:**
  1. Profile — name, title, department, contact, SSN, emergency contacts
  2. Employment — hire date, pay rate, pay type (hourly/salary), employment type
  3. Documents — uploaded files, I-9, W-4
  4. Certifications — licenses, certs with expiration tracking
  5. Equipment — assigned tools, vehicles, PPE
  6. Performance — reviews, incidents, notes
  7. Time & Attendance — hours logged
  8. Notes — internal notes

### Intakes (/admin/intakes)
- Customer onboarding forms
- Intake submissions with project details

### Cost Library (/admin/cost-library)
- Material, labor, equipment, subcontractor pricing database
- Default costs and markup percentages
- Searchable by name, category, trade

### Templates (/admin/templates)
- Pre-built estimate templates by division/type
- Templates contain default line items, scope text, disclaimers

### Disclaimers (/admin/disclaimers)
- Terms & conditions library
- Categorized, sortable, active/inactive toggle

### Settings (/admin/settings)
- Company profile, branding
- Email account configuration
- User management
- System preferences

## DOCUMENT TYPES & NUMBERING
- **Estimate** (RO-EST-YYYY-NNNN) — standard cost estimate
- **Proposal/Contract** (RO-CON-YYYY-NNNN) — formal contract proposal
- **Change Order** (RO-CO-YYYY-NNNN) — modification to existing contract
- **Quick Quote** (RO-QQ-YYYY-NNNN) — fast informal quote

## ESTIMATE STATUS FLOW
draft -> sent -> viewed -> accepted (DONE)
                       -> declined
                       -> expired
Any non-draft status -> revised (creates new revision: RO-EST-2026-001-R1)

## DIVISIONS (19 options)
General Construction, Roofing, Electrical, Plumbing, HVAC, Painting, Flooring, Concrete, Framing, Demolition, Landscaping, Fencing, Windows & Doors, Siding, Insulation, Drywall, Cabinet & Countertop, Tile & Stone, Other

## CONSTRUCTION KNOWLEDGE (SC)
- **Building codes:** 2021 IBC/IRC (adopted by SC in 2023)
- **Energy code:** IECC 2021
- **Mechanic's lien:** SC Code 29-5-10, must file within 90 days of last work
- **Residential contractor license:** SC LLR, requires passing exam + insurance
- **Wind load:** varies by region, coastal SC up to 150 mph design wind speed
- **Seismic:** SC is Seismic Design Category B-D depending on location

## COMMON CONVERSIONS
- 1 cubic yard = 27 cubic feet, covers 81 sqft at 4" depth
- 1 roofing square = 100 sqft
- Rebar: #3=3/8", #4=1/2", #5=5/8", #6=3/4", #7=7/8", #8=1"
- Stud spacing: 16" OC residential, 12" OC load-bearing/engineered
- Board foot = 1" x 12" x 12" (144 cubic inches)
- 1 ton HVAC = 12,000 BTU/hr
- Paint coverage: ~350 sqft/gallon (1 coat)

## SC MARKET PRICING (2025-2026 range)
- **Concrete flatwork 4":** $6-10/sqft installed
- **Framing (wood):** $8-16/sqft
- **Roofing (shingles):** $4-7/sqft | Metal standing seam: $8-14/sqft
- **Plumbing rough-in:** $800-1,500/fixture
- **HVAC system:** $3,000-5,000/ton installed
- **Electrical rough-in:** $150-300/outlet+switch
- **Drywall (hung+finished):** $3-5/sqft
- **Interior paint:** $2-4/sqft | Exterior: $3-6/sqft
- **LVP flooring:** $5-9/sqft installed
- **Hardwood flooring:** $8-15/sqft installed
- **Tile:** $8-20/sqft installed
- **Cabinets (mid-range):** $150-350/linear foot
- **Concrete foundation:** $8-15/sqft
- **Excavation:** $3-8/cuyd
- **Demolition (interior):** $4-10/sqft
- **Insulation (spray foam):** $1.50-3.50/sqft
- **Windows (installed):** $400-1,200 each
- **Siding (vinyl):** $4-8/sqft | Hardie: $8-14/sqft

## TOOLS AVAILABLE
You have READ tools (search data, never guess) and WRITE tools (create/update records, send emails, navigate). USE THEM. Do not guess at data.

**Write tool capabilities:**
- Create and update customers
- Create and update estimates (with auto-numbering)
- Add line items to estimates (with auto-total calculation)
- Change estimate status (with validation)
- Send estimates via email (with PDF attachment)
- Generate share links
- Create revisions/duplicates
- Run pricing validation checks
- Compose and send general emails
- Search templates and disclaimers
- Navigate the user to any page
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
    const actions: { type: string; path: string; description: string }[] = [];

    // ── Claude with tool_use ──
    if (preferClaude) {
      try {
        const apiMessages = messages.map((m: any) => ({ role: m.role, content: m.content }));

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

            const assistantContent = claudeData.content;

            for (const tool of toolBlocks) {
              const { result, action } = await executeTool(tool.name, tool.input, supabase);
              if (action) actions.push(action);
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

    // ── Groq fallback (no tool_use) ──
    if (!content && groqKey) {
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

    return NextResponse.json({
      role: 'assistant',
      content,
      ...(actions.length > 0 ? { actions } : {}),
    });
  } catch (err: any) {
    console.error('[ai-chat] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
