import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { recalcEstimateTotals } from '@/lib/estimates';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════
// SEARCH: Tavily (primary) + DuckDuckGo (fallback)
// ═══════════════════════════════════════════
async function braveSearch(query: string): Promise<string | null> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) { console.log('[brave] No API key'); return null; }
  try {
    const encoded = encodeURIComponent(query);
    // Use LLM Context endpoint — returns pre-chunked, ranked content optimized for LLM injection
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encoded}&count=5&result_filter=web&extra_snippets=true`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('[brave] HTTP', res.status, errText.slice(0, 200));
      return null;
    }
    const data = await res.json();
    const results = data.web?.results || [];
    if (!results.length) { console.log('[brave] No results'); return null; }
    const parts: string[] = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const snippet = r.extra_snippets?.join(' ') || r.description || '';
      parts.push(`${i + 1}. **${r.title}**\n   ${snippet.slice(0, 400)}\n   Source: ${r.url}`);
    }
    console.log('[brave] OK — results:', results.length);
    return parts.join('\n\n');
  } catch (e) {
    console.error('[brave] Exception:', e);
    return null;
  }
}

async function duckDuckGoSearch(query: string): Promise<string> {
  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      cache: 'no-store',
    });
    if (!res.ok) { console.error('[ddg] HTTP', res.status); return 'Search unavailable.'; }
    const html = await res.text();
    const titles: { url: string; title: string }[] = [];
    const snippets: string[] = [];
    const titleRegex = /<a class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
    const snippetRegex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let match;
    while ((match = titleRegex.exec(html)) !== null && titles.length < 6) {
      const url = match[1].replace(/.*uddg=/, '').split('&')[0];
      const title = match[2].replace(/<[^>]*>/g, '').trim();
      try { titles.push({ url: decodeURIComponent(url), title }); } catch { titles.push({ url, title }); }
    }
    while ((match = snippetRegex.exec(html)) !== null && snippets.length < 6) {
      snippets.push(match[1].replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim());
    }
    console.log('[ddg] titles:', titles.length, 'snippets:', snippets.length);
    const results: string[] = [];
    for (let i = 0; i < titles.length; i++) {
      results.push(`${i + 1}. **${titles[i].title}**\n   ${snippets[i] || ''}\n   Source: ${titles[i].url}`);
    }
    return results.length > 0 ? results.join('\n\n') : 'No results found.';
  } catch (e) {
    console.error('[ddg] Exception:', e);
    return 'Search unavailable.';
  }
}

async function smartSearch(query: string): Promise<string> {
  const brave = await braveSearch(query);
  if (brave) return brave;
  return duckDuckGoSearch(query);
}

// ═══════════════════════════════════════════
// PROPERTY ENRICHMENT — free data sources
// ═══════════════════════════════════════════

// Geocode address → lat/lon via Nominatim (OSM) — free, no key
async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const encoded = encodeURIComponent(address);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`, {
      headers: { 'User-Agent': 'ROAssistant/1.0 (rounlimited.com)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.length) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch { return null; }
}

// FEMA flood zone via NFHL ArcGIS REST — free, no key, official source
async function getFEMAFloodZone(lat: number, lon: number): Promise<string> {
  try {
    const params = new URLSearchParams({
      geometry: `${lon},${lat}`,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: 'FLD_ZONE,SFHA_TF,ZONE_SUBTY',
      returnGeometry: 'false',
      f: 'json',
    });
    const res = await fetch(
      `https://hazards.fema.gov/arcgis/rest/services/FIRMette/NFHLREST_FIRMette/MapServer/20/query?${params}`
    );
    if (!res.ok) return 'Flood zone: lookup unavailable';
    const data = await res.json();
    const attrs = data.features?.[0]?.attributes;
    if (!attrs) return 'Flood zone: no data for this location';
    const zone = attrs.FLD_ZONE || 'Unknown';
    const subtype = attrs.ZONE_SUBTY ? ` (${attrs.ZONE_SUBTY})` : '';
    const sfha = attrs.SFHA_TF === 'T' ? '⚠️ HIGH RISK — Special Flood Hazard Area' : 'Minimal flood risk';
    const zoneDesc: Record<string, string> = {
      'X': 'Zone X — minimal flood hazard (outside 500-yr floodplain)',
      'AE': 'Zone AE — high risk, base flood elevations determined',
      'A': 'Zone A — high risk, no base flood elevation',
      'VE': 'Zone VE — coastal high risk with wave action',
      'AO': 'Zone AO — shallow flooding/sheet flow',
    };
    return `Flood Zone: ${zone}${subtype} — ${zoneDesc[zone] || zone} · ${sfha}`;
  } catch { return 'Flood zone: lookup error'; }
}

// OSM Overpass — building/business data near address (free, no key)
async function getOSMData(lat: number, lon: number): Promise<string | null> {
  try {
    const query = `[out:json][timeout:10];(
      way[building](around:40,${lat},${lon});
      node[amenity](around:60,${lat},${lon});
      node[shop](around:60,${lat},${lon});
    );out tags;`;
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const elements = data.elements || [];
    if (!elements.length) return null;
    const parts: string[] = [];
    for (const el of elements.slice(0, 3)) {
      const t = el.tags || {};
      const info: string[] = [];
      if (t.building) info.push(`Building type: ${t.building}`);
      if (t['building:levels']) info.push(`Stories: ${t['building:levels']}`);
      if (t['roof:material']) info.push(`Roof material: ${t['roof:material']}`);
      if (t['roof:shape']) info.push(`Roof shape: ${t['roof:shape']}`);
      if (t.name) info.push(`Name: ${t.name}`);
      if (t.amenity) info.push(`Type: ${t.amenity}`);
      if (t['contact:phone'] || t.phone) info.push(`Phone: ${t['contact:phone'] || t.phone}`);
      if (t.opening_hours) info.push(`Hours: ${t.opening_hours}`);
      if (t['addr:street']) info.push(`OSM address: ${t['addr:housenumber'] || ''} ${t['addr:street']}`);
      if (info.length) parts.push(info.join(' · '));
    }
    return parts.length ? parts.join('\n') : null;
  } catch { return null; }
}

// Satellite map URL — no API key, opens Google Maps satellite view
function getSatelliteMapUrl(lat: number, lon: number, address: string): string {
  const encoded = encodeURIComponent(address);
  return `https://www.google.com/maps?q=${lat},${lon}&t=k&z=19 — or search "${encoded}" in Google Maps (satellite mode)`;
}

// ═══════════════════════════════════════════
// TOOL DEFINITIONS (Claude native tool_use)
// ═══════════════════════════════════════════

// ── READ TOOLS ──
const READ_TOOLS = [
  { name: 'search_customers', description: 'Search customers by name/email/phone/company.',
    input_schema: { type: 'object' as const, properties: { query: { type: 'string' }, limit: { type: 'number' } }, required: ['query'] } },
  { name: 'search_estimates', description: 'Search estimates by customer name, project, number, or status.',
    input_schema: { type: 'object' as const, properties: { query: { type: 'string' }, status: { type: 'string', description: 'draft|sent|viewed|accepted|declined|expired' }, limit: { type: 'number' } }, required: ['query'] } },
  { name: 'get_estimate_details', description: 'Get full estimate with line items, payments, history.',
    input_schema: { type: 'object' as const, properties: { estimate_id: { type: 'string' }, estimate_number: { type: 'string' } } } },
  { name: 'search_employees', description: 'Search employees by name/title/department.',
    input_schema: { type: 'object' as const, properties: { query: { type: 'string' }, status: { type: 'string' } }, required: ['query'] } },
  { name: 'search_vendors', description: 'Search vendors by company/trade/contact.',
    input_schema: { type: 'object' as const, properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'get_activity_log', description: 'Get recent activity log entries.',
    input_schema: { type: 'object' as const, properties: { limit: { type: 'number' }, action_filter: { type: 'string' } } } },
  { name: 'search_cost_library', description: 'Search cost items for pricing.',
    input_schema: { type: 'object' as const, properties: { query: { type: 'string' }, category: { type: 'string', description: 'material|labor|equipment|subcontractor' } }, required: ['query'] } },
  { name: 'web_search', description: 'Search the web (Tavily AI search + DuckDuckGo fallback) for current info — pricing, SC codes, regulations, permits, material costs. Returns AI-summarized answers plus source links.',
    input_schema: { type: 'object' as const, properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'property_lookup', description: 'Look up a property by address. Returns lot size, building sqft, year built, construction features, estimated value, owner, FEMA flood zone, OSM building/business data, and satellite map link. Use for any job site address.',
    input_schema: { type: 'object' as const, properties: { address: { type: 'string', description: 'Full property address including city and state (e.g. "123 Main St, Greenville, SC")' } }, required: ['address'] } },
  { name: 'save_memory', description: 'Save to persistent memory. Use when user says "remember".',
    input_schema: { type: 'object' as const, properties: { content: { type: 'string' }, category: { type: 'string', description: 'general|pricing|preferences|projects|codes|materials' } }, required: ['content', 'category'] } },
  { name: 'forget_memory', description: 'Delete a saved memory by keyword.',
    input_schema: { type: 'object' as const, properties: { keyword: { type: 'string' } }, required: ['keyword'] } },
  { name: 'list_tasks', description: 'List tasks. Use for "what\'s on my schedule", "what do I have today", "what\'s overdue", "upcoming tasks", etc.',
    input_schema: { type: 'object' as const, properties: { filter: { type: 'string', description: 'today|overdue|upcoming|all (default: all)' }, category: { type: 'string', description: 'job_site|customer|vendor|permit|employee|financial|general' }, limit: { type: 'number', description: 'Max results (default 20)' } } } },
  { name: 'get_daily_briefing', description: 'Get a summary of today\'s tasks, overdue items, upcoming deadlines, and business status. Use when user asks "what\'s going on today", "morning briefing", "give me a rundown", etc.',
    input_schema: { type: 'object' as const, properties: {} } },
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
    description: 'Add one or more line items to an estimate. Items are auto-numbered by sort_order based on array position. Totals are auto-recalculated.',
    input_schema: {
      type: 'object' as const,
      properties: {
        estimate_id: { type: 'string', description: 'Estimate UUID (required)' },
        items: {
          type: 'array',
          description: 'Array of line items to add IN ORDER (first item = sort_order 1, etc.)',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string', description: 'Phase name — use standard construction order: Site Prep, Foundation, Framing, Roofing, Exterior, Plumbing, Electrical, HVAC, Insulation, Drywall, Flooring, Paint, Trim, Landscaping, Cleanup' },
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
    name: 'update_line_items',
    description: 'Update existing line items on an estimate. Can change any field: phase, description, quantity, unit, unit_cost, markup_percent, sort_order, category. Use get_estimate_details first to get item IDs. Totals auto-recalculate.',
    input_schema: {
      type: 'object' as const,
      properties: {
        estimate_id: { type: 'string', description: 'Estimate UUID (required)' },
        items: {
          type: 'array',
          description: 'Array of items to update (each must have id)',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Line item UUID (required)' },
              phase: { type: 'string', description: 'Phase name' },
              description: { type: 'string', description: 'Item description' },
              category: { type: 'string', description: 'material, labor, equipment, subcontractor' },
              quantity: { type: 'number', description: 'Quantity' },
              unit: { type: 'string', description: 'Unit of measure' },
              unit_cost: { type: 'number', description: 'Cost per unit' },
              sort_order: { type: 'number', description: 'Display order (lower = first)' },
              markup_percent: { type: 'number' },
            },
            required: ['id'],
          },
        },
      },
      required: ['estimate_id', 'items'],
    },
  },
  {
    name: 'delete_line_items',
    description: 'Delete line items from an estimate by their IDs. Use get_estimate_details first to get item IDs. Totals are auto-recalculated.',
    input_schema: {
      type: 'object' as const,
      properties: {
        estimate_id: { type: 'string', description: 'Estimate UUID (required)' },
        item_ids: { type: 'array', items: { type: 'string' }, description: 'Array of line item UUIDs to delete (required)' },
      },
      required: ['estimate_id', 'item_ids'],
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
        path: { type: 'string', description: 'The app path to navigate to, e.g. /admin/estimates, /admin/customers, /admin/estimates/[uuid], /admin/tasks' },
        description: { type: 'string', description: 'Brief description of what is at this destination, e.g. "Opening the new estimate wizard"' },
      },
      required: ['path'],
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task or reminder. Use when user says "remind me", "add a task", "schedule", "don\'t let me forget", "create a reminder", etc. Infer the category, priority, and due_date from context.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Task title (required, short and clear)' },
        description: { type: 'string', description: 'Optional details' },
        category: { type: 'string', description: 'job_site|customer|vendor|permit|employee|financial|general (infer from context)' },
        priority: { type: 'string', description: 'low|medium|high|urgent (infer from context, default medium)' },
        due_date: { type: 'string', description: 'ISO date string YYYY-MM-DD. Infer from "tomorrow", "Friday", "next week", etc.' },
        due_time: { type: 'string', description: 'HH:MM format (24hr), e.g. "09:00" for 9am' },
        remind_minutes_before: { type: 'number', description: 'Minutes before due time to send reminder. Common: 15, 30, 60, 1440 (1 day). Omit if no reminder needed.' },
        recurrence_type: { type: 'string', description: 'none|daily|weekdays|weekly|monthly (default none)' },
        linked_label: { type: 'string', description: 'What this task is linked to, e.g. "Johnson estimate", "ABC Supply", "permit #12345"' },
        notes: { type: 'string', description: 'Extra notes to attach to the task' },
      },
      required: ['title'],
    },
  },
  {
    name: 'complete_task',
    description: 'Mark a task as done/completed. Use when user says "done", "finished", "mark complete", "check off", etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        task_id: { type: 'string', description: 'Task UUID. Get from list_tasks first if unknown.' },
        title_search: { type: 'string', description: 'If no task_id, search by title keyword to find the right task.' },
      },
    },
  },
  {
    name: 'snooze_task',
    description: 'Snooze a task to a later date/time. Use when user says "snooze", "push to tomorrow", "remind me later", "do it later", etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        task_id: { type: 'string', description: 'Task UUID. Get from list_tasks first if unknown.' },
        title_search: { type: 'string', description: 'Search by title keyword if no task_id.' },
        snooze_until: { type: 'string', description: 'ISO datetime to snooze until (e.g. "2026-04-01T09:00:00"). Infer from "tomorrow morning" = 9am next day, "next week" = next Monday 9am, "this weekend" = Saturday 9am.' },
      },
      required: ['snooze_until'],
    },
  },
  {
    name: 'update_task',
    description: 'Update a task\'s title, due date, priority, notes, or other fields.',
    input_schema: {
      type: 'object' as const,
      properties: {
        task_id: { type: 'string', description: 'Task UUID (required). Use list_tasks to find the ID first.' },
        title: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string', description: 'job_site|customer|vendor|permit|employee|financial|general' },
        priority: { type: 'string', description: 'low|medium|high|urgent' },
        due_date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
        due_time: { type: 'string', description: 'HH:MM 24hr format' },
        remind_minutes_before: { type: 'number' },
        notes: { type: 'string' },
        linked_label: { type: 'string' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'delete_task',
    description: 'Delete or cancel a task. Use when user says "cancel", "remove", "delete this task", etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        task_id: { type: 'string', description: 'Task UUID. Use list_tasks to find it first.' },
        title_search: { type: 'string', description: 'Search by title keyword if no task_id.' },
      },
    },
  },
];

const ALL_TOOLS = [...READ_TOOLS, ...WRITE_TOOLS];

// ── Smart tool selection based on user message ──
// Only send tools relevant to the user's intent to save ~3000 tokens/request
function selectTools(lastMessage: string, messageCount?: number): typeof ALL_TOOLS {
  const msg = lastMessage.toLowerCase();

  // If conversation has history (>2 messages), always send tools — user is in a workflow
  if (messageCount && messageCount > 2) return ALL_TOOLS;

  // Simple greetings on FIRST message only — no tools needed
  if (/^(hi|hey|hello|thanks|thank you)\b/.test(msg) && msg.length < 40) {
    return [];
  }

  const tools: typeof ALL_TOOLS = [];
  const needs = {
    search: /search|find|look|check|show me|list|get|pull up|who|how many/i.test(msg),
    estimate: /estimate|proposal|quote|bid|contract|change order|line item|pricing|price|cost|phase|markup|overhead/i.test(msg),
    customer: /customer|client|contact|homeowner|property owner/i.test(msg),
    employee: /employee|worker|staff|crew|team/i.test(msg),
    vendor: /vendor|supplier|sub|subcontractor/i.test(msg),
    email: /email|send|compose|mail|message/i.test(msg),
    navigate: /go to|open|navigate|take me|show me.*page|switch to/i.test(msg),
    memory: /remember|forget|memory|save.*note/i.test(msg),
    web: /search.*web|google|look.*up|current.*price|what.*cost|code.*require/i.test(msg),
    property: /property|lot size|sqft|square feet|address|parcel|acres|assessed value|look up.*address|\d+\s+\w+.*\b(st|ave|rd|blvd|dr|ln|ct|way|pl)\b|flood zone|building.*info|site.*info|tavern|restaurant|business.*address/i.test(msg),
    tasks: /task|remind|schedule|calendar|todo|to.do|due today|overdue|briefing|rundown|what.*today|today.*tasks|don.t.*forget|follow.?up|check in|appointment|meeting|deadline/i.test(msg),
  };

  // Always include these lightweight tools
  if (needs.memory) { tools.push(...READ_TOOLS.filter(t => t.name === 'save_memory' || t.name === 'forget_memory')); }
  // web_search always included — AI needs it for prices, codes, regulations; it's read-only and cheap
  tools.push(...READ_TOOLS.filter(t => t.name === 'web_search'));
  if (needs.property) { tools.push(...READ_TOOLS.filter(t => t.name === 'property_lookup')); }
  if (needs.navigate) { tools.push(...WRITE_TOOLS.filter(t => t.name === 'navigate')); }
  if (needs.tasks) {
    tools.push(...READ_TOOLS.filter(t => t.name === 'list_tasks' || t.name === 'get_daily_briefing'));
    tools.push(...WRITE_TOOLS.filter(t => ['create_task', 'complete_task', 'snooze_task', 'update_task', 'delete_task'].includes(t.name)));
  }

  // Search tools
  if (needs.search || needs.customer) tools.push(...READ_TOOLS.filter(t => t.name === 'search_customers'));
  if (needs.search || needs.estimate) tools.push(...READ_TOOLS.filter(t => t.name === 'search_estimates' || t.name === 'get_estimate_details' || t.name === 'search_cost_library'));
  if (needs.search || needs.employee) tools.push(...READ_TOOLS.filter(t => t.name === 'search_employees'));
  if (needs.search || needs.vendor) tools.push(...READ_TOOLS.filter(t => t.name === 'search_vendors'));
  if (needs.search) tools.push(...READ_TOOLS.filter(t => t.name === 'get_activity_log'));

  // Write tools — only when action words present
  if (/create|make|build|add|new/i.test(msg)) {
    if (needs.customer) tools.push(...WRITE_TOOLS.filter(t => t.name === 'create_customer'));
    if (needs.estimate) tools.push(...WRITE_TOOLS.filter(t => ['create_estimate', 'add_line_items'].includes(t.name)));
  }
  if (/update|change|edit|modify|set|remove|delete|swap|replace|adjust|fix/i.test(msg)) {
    if (needs.customer) tools.push(...WRITE_TOOLS.filter(t => t.name === 'update_customer'));
    if (needs.estimate) tools.push(...WRITE_TOOLS.filter(t => ['update_estimate', 'update_estimate_status', 'update_line_items', 'delete_line_items'].includes(t.name)));
  }
  if (needs.estimate && /send|share|duplicate|copy|check|validate|revise/i.test(msg)) {
    tools.push(...WRITE_TOOLS.filter(t => ['send_estimate', 'generate_share_link', 'duplicate_estimate', 'check_estimate_pricing'].includes(t.name)));
  }
  if (needs.email) tools.push(...WRITE_TOOLS.filter(t => t.name === 'compose_email'));
  if (needs.estimate && /template|disclaimer/i.test(msg)) {
    tools.push(...WRITE_TOOLS.filter(t => t.name === 'search_templates' || t.name === 'search_disclaimers'));
  }

  // If nothing matched but message is complex, send all (safety net)
  if (tools.length === 0 && msg.length > 80) return ALL_TOOLS;

  // Deduplicate
  const seen = new Set<string>();
  return tools.filter(t => { if (seen.has(t.name)) return false; seen.add(t.name); return true; });
}

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
      return { result: await smartSearch(input.query) };
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

      // Get current max sort_order for this estimate
      const { data: existingItems } = await supabase
        .from('estimate_line_items')
        .select('sort_order')
        .eq('estimate_id', input.estimate_id)
        .order('sort_order', { ascending: false })
        .limit(1);
      let nextSort = (existingItems?.[0]?.sort_order || 0) + 1;

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
            sort_order: nextSort++,
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

      return { result: `Added ${results.filter(r => !r.error).length} line item(s) (sorted ${nextSort - input.items.length} to ${nextSort - 1}):\n${JSON.stringify(results, null, 2)}` };
    }

    case 'update_line_items': {
      if (!input.estimate_id) return { result: 'Error: estimate_id is required.' };
      if (!input.items?.length) return { result: 'Error: items array is required.' };

      const updateResults: any[] = [];
      for (const item of input.items) {
        if (!item.id) { updateResults.push({ error: 'Missing id', item }); continue; }
        const updates: Record<string, any> = {};
        if (item.phase !== undefined) updates.phase = item.phase;
        if (item.description !== undefined) updates.description = item.description;
        if (item.category !== undefined) updates.category = item.category;
        if (item.quantity !== undefined) updates.quantity = item.quantity;
        if (item.unit !== undefined) updates.unit = item.unit;
        if (item.unit_cost !== undefined) updates.unit_cost = item.unit_cost;
        if (item.markup_percent !== undefined) updates.markup_percent = item.markup_percent;
        if (item.sort_order !== undefined) updates.sort_order = item.sort_order;
        // Recalc total
        const q = updates.quantity ?? item.quantity;
        const uc = updates.unit_cost ?? item.unit_cost;
        const mp = updates.markup_percent ?? item.markup_percent ?? 0;
        if (q !== undefined && uc !== undefined) updates.total = q * uc * (1 + mp / 100);

        const { data, error } = await supabase.from('estimate_line_items').update(updates).eq('id', item.id).eq('estimate_id', input.estimate_id).select().single();
        updateResults.push(error ? { error: error.message, id: item.id } : data);
      }

      // Recalculate estimate totals
      const [{ data: est2 }, { data: allItems2 }] = await Promise.all([
        supabase.from('estimates').select('*').eq('id', input.estimate_id).single(),
        supabase.from('estimate_line_items').select('*').eq('estimate_id', input.estimate_id),
      ]);
      if (est2) {
        const totals = recalcEstimateTotals(allItems2 || [], est2);
        await supabase.from('estimates').update({ ...totals, updated_at: new Date().toISOString() }).eq('id', input.estimate_id);
      }

      return { result: `Updated ${updateResults.filter(r => !r.error).length} line item(s):\n${JSON.stringify(updateResults, null, 2)}` };
    }

    case 'delete_line_items': {
      if (!input.estimate_id) return { result: 'Error: estimate_id is required.' };
      if (!input.item_ids?.length) return { result: 'Error: item_ids array is required.' };

      const { error: delErr, count } = await supabase
        .from('estimate_line_items')
        .delete()
        .in('id', input.item_ids)
        .eq('estimate_id', input.estimate_id);

      if (delErr) return { result: `Error deleting: ${delErr.message}` };

      // Recalculate estimate totals
      const [{ data: est3 }, { data: allItems3 }] = await Promise.all([
        supabase.from('estimates').select('*').eq('id', input.estimate_id).single(),
        supabase.from('estimate_line_items').select('*').eq('estimate_id', input.estimate_id),
      ]);
      if (est3) {
        const totals = recalcEstimateTotals(allItems3 || [], est3);
        await supabase.from('estimates').update({ ...totals, updated_at: new Date().toISOString() }).eq('id', input.estimate_id);
      }

      return { result: `Deleted ${count || input.item_ids.length} line item(s). Totals recalculated.` };
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

    case 'property_lookup': {
      if (!input.address) return { result: 'Error: address is required.' };
      const rentcastKey = process.env.RENTCAST_API_KEY;
      if (!rentcastKey) return { result: 'Property lookup not configured (no API key).' };

      // Hard cap: 50 calls/month
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { count } = await supabase
        .from('api_usage_log')
        .select('id', { count: 'exact', head: true })
        .eq('service', 'rentcast')
        .gte('created_at', monthStart);
      const used = count || 0;
      if (used >= 50) {
        return { result: `Monthly property lookup limit reached (${used}/50). Estimate based on neighborhood knowledge instead.` };
      }

      try {
        const encoded = encodeURIComponent(input.address);
        const res = await fetch(`https://api.rentcast.io/v1/properties?address=${encoded}`, {
          headers: { 'X-Api-Key': rentcastKey, Accept: 'application/json' },
        });
        if (!res.ok) {
          const err = await res.text();
          return { result: `Property lookup failed (${res.status}): ${err.slice(0, 200)}` };
        }
        const data = await res.json();

        // Log usage (fail silently if table doesn't exist)
        await supabase.from('api_usage_log').insert({ service: 'rentcast', endpoint: 'properties' }).then(() => {}).catch(() => {});

        const props = Array.isArray(data) ? data : [data];
        if (!props.length) return { result: `No property data found for "${input.address}".` };

        const p = props[0];
        const lotSqft = p.lotSize || p.lotSquareFeet || 0;
        const lotAcres = lotSqft ? (lotSqft / 43560).toFixed(2) : '?';

        let assessedValue = p.assessedValue || null;
        let taxAmount = p.taxAmount || null;
        if (!assessedValue && p.taxAssessments) {
          const years = Object.keys(p.taxAssessments).sort().reverse();
          if (years.length) assessedValue = p.taxAssessments[years[0]]?.value;
        }
        if (!taxAmount && p.propertyTaxes) {
          const years = Object.keys(p.propertyTaxes).sort().reverse();
          if (years.length) taxAmount = p.propertyTaxes[years[0]]?.total;
        }

        const ownerName = p.ownerName || (p.owner?.names ? p.owner.names.join(', ') : p.owner) || 'N/A';

        let estimatedValue = 'N/A';
        if (p.lastSalePrice && p.lastSaleDate) {
          const saleYear = new Date(p.lastSaleDate).getFullYear();
          const yearsAgo = new Date().getFullYear() - saleYear;
          const appreciated = Math.round(p.lastSalePrice * Math.pow(1.04, yearsAgo));
          estimatedValue = `~$${appreciated.toLocaleString()} (based on $${p.lastSalePrice.toLocaleString()} sale in ${saleYear} + ~4%/yr appreciation)`;
        } else if (assessedValue) {
          const marketEst = Math.round(assessedValue * 1.2);
          estimatedValue = `~$${marketEst.toLocaleString()} (est. from $${assessedValue.toLocaleString()} assessed value)`;
        }

        const features: string[] = [];
        if (p.features) {
          if (p.features.cooling) features.push(`Cooling: ${p.features.coolingType || 'Yes'}`);
          if (p.features.heating) features.push(`Heating: ${p.features.heatingType || 'Yes'}`);
          if (p.features.garage) features.push(`Garage: ${p.features.garageType || 'Yes'}`);
          if (p.features.roofType) features.push(`Roof: ${p.features.roofType}`);
          if (p.features.exteriorType) features.push(`Exterior: ${p.features.exteriorType}`);
          if (p.features.floorCount) features.push(`Floors: ${p.features.floorCount}`);
        }

        // Enrichment: geocode + FEMA + OSM — all run in parallel
        const lat = p.latitude || p.lat || null;
        const lon = p.longitude || p.lon || null;
        let coords: { lat: number; lon: number } | null = (lat && lon) ? { lat, lon } : null;
        if (!coords) coords = await geocodeAddress(p.formattedAddress || input.address);

        const [floodZone, osmData] = coords
          ? await Promise.all([
              getFEMAFloodZone(coords.lat, coords.lon),
              getOSMData(coords.lat, coords.lon),
            ])
          : ['Flood zone: coordinates unavailable', null];

        const satelliteUrl = coords ? getSatelliteMapUrl(coords.lat, coords.lon, p.formattedAddress || input.address) : null;

        const lines = [
          `**Property: ${p.formattedAddress || p.addressLine1 || input.address}**`,
          `Lot Size: ${lotSqft ? lotSqft.toLocaleString() + ' sqft (' + lotAcres + ' acres)' : 'Not available'}`,
          `Building: ${p.squareFootage ? p.squareFootage.toLocaleString() + ' sqft' : 'N/A'}`,
          `Bedrooms: ${p.bedrooms ?? 'N/A'} | Bathrooms: ${p.bathrooms ?? 'N/A'}`,
          `Year Built: ${p.yearBuilt || 'N/A'}`,
          `Property Type: ${p.propertyType || 'N/A'}`,
          features.length ? `Features: ${features.join(' | ')}` : '',
          `Estimated Value: ${estimatedValue}`,
          `Assessed Value: ${assessedValue ? '$' + assessedValue.toLocaleString() : 'N/A'}`,
          `Annual Tax: ${taxAmount ? '$' + taxAmount.toLocaleString() + '/yr' : 'N/A'}`,
          `Owner: ${ownerName}`,
          ``,
          `**Site Intelligence**`,
          floodZone,
          osmData ? `OSM Data:\n${osmData}` : '',
          satelliteUrl ? `Satellite: ${satelliteUrl}` : '',
          `(Rentcast usage: ${used + 1}/50 this month)`,
        ].filter(Boolean);

        return { result: lines.join('\n') };
      } catch (err: any) {
        return { result: `Property lookup error: ${err.message}` };
      }
    }

    // ── TASK TOOLS ──
    case 'list_tasks': {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com';
      const params = new URLSearchParams();
      if (input.filter) params.set('filter', input.filter);
      if (input.category) params.set('category', input.category);
      if (input.limit) params.set('limit', String(input.limit));
      try {
        const res = await fetch(`${siteUrl}/api/admin/tasks?${params}`, {
          headers: { 'x-push-secret': process.env.PUSH_SECRET || '' },
        });
        if (!res.ok) return { result: 'Failed to fetch tasks.' };
        const data = await res.json();
        const tasks = data.tasks || [];
        if (!tasks.length) {
          const filter = input.filter || 'all';
          return { result: filter === 'today' ? 'No tasks due today. Great — you\'re all caught up!' : 'No tasks found.' };
        }
        const todayStr = new Date().toISOString().split('T')[0];
        const lines: string[] = [`Found ${tasks.length} task${tasks.length !== 1 ? 's' : ''}:`];
        tasks.forEach((t: any) => {
          const isOverdue = t.due_date && t.due_date < todayStr && t.status !== 'done' && t.status !== 'cancelled';
          const tag = isOverdue ? ' ⚠️ OVERDUE' : '';
          const due = t.due_date ? ` (due ${t.due_date}${t.due_time ? ' ' + t.due_time : ''})` : '';
          const linked = t.linked_label ? ` — ${t.linked_label}` : '';
          lines.push(`- [${t.id}] ${t.title}${tag}${due}${linked} [${t.priority}/${t.category}/${t.status}]`);
        });
        if (data.overdue > 0) lines.push(`\n⚠️ ${data.overdue} overdue task${data.overdue !== 1 ? 's' : ''}`);
        if (data.dueToday > 0) lines.push(`📅 ${data.dueToday} due today`);
        if (data.upcoming > 0) lines.push(`📆 ${data.upcoming} upcoming this week`);
        return { result: lines.join('\n') };
      } catch (err: any) {
        return { result: `Error fetching tasks: ${err.message}` };
      }
    }

    case 'get_daily_briefing': {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const sevenDaysOut = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0];
      const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString();

      const [
        { data: todayTasks },
        { data: overdueTasks },
        { data: upcomingTasks },
        { data: staleEstimates },
        { data: unreadEmails },
      ] = await Promise.all([
        supabase.from('tasks').select('title, priority, category, due_time, linked_label').eq('due_date', todayStr).not('status', 'in', '("done","cancelled")').order('due_time', { ascending: true }),
        supabase.from('tasks').select('title, due_date').lt('due_date', todayStr).not('status', 'in', '("done","cancelled")'),
        supabase.from('tasks').select('title, due_date').gt('due_date', todayStr).lte('due_date', sevenDaysOut).not('status', 'in', '("done","cancelled")').order('due_date').limit(5),
        supabase.from('estimates').select('estimate_number, project_name, total, sent_at, customer:customers(first_name, last_name)').eq('status', 'sent').lt('sent_at', threeDaysAgo).order('sent_at').limit(5),
        supabase.from('email_messages').select('id').eq('direction', 'inbound').eq('read', false),
      ]);

      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
      const lines: string[] = [`📅 **${dayName} Briefing — ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}**\n`];

      if (todayTasks?.length) {
        lines.push(`**Tasks Due Today (${todayTasks.length}):**`);
        todayTasks.forEach((t: any) => {
          const time = t.due_time ? formatTimeLocal(t.due_time) + ' — ' : '';
          lines.push(`• ${time}${t.title}${t.linked_label ? ` (${t.linked_label})` : ''} [${t.priority}]`);
        });
      } else {
        lines.push('**No tasks due today** ✅');
      }

      if (overdueTasks?.length) {
        lines.push(`\n⚠️ **Overdue: ${overdueTasks.length} task${overdueTasks.length !== 1 ? 's' : ''}**`);
        overdueTasks.slice(0, 5).forEach((t: any) => {
          const days = Math.floor((now.getTime() - new Date(t.due_date).getTime()) / 86400000);
          lines.push(`• ${t.title} (${days}d overdue)`);
        });
        if (overdueTasks.length > 5) lines.push(`• ...and ${overdueTasks.length - 5} more`);
      }

      if (upcomingTasks?.length) {
        lines.push(`\n**Upcoming This Week:**`);
        upcomingTasks.forEach((t: any) => {
          const d = new Date(t.due_date + 'T12:00:00');
          lines.push(`• ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${t.title}`);
        });
      }

      if (staleEstimates?.length) {
        lines.push(`\n**Estimates Needing Follow-Up (${staleEstimates.length}):**`);
        staleEstimates.forEach((e: any) => {
          const c = e.customer as any;
          const name = c ? `${c.first_name} ${c.last_name}` : 'Customer';
          const days = Math.floor((now.getTime() - new Date(e.sent_at).getTime()) / 86400000);
          lines.push(`• ${e.estimate_number} (${name}) — $${(e.total || 0).toLocaleString()} — ${days}d ago`);
        });
      }

      if (unreadEmails?.length) lines.push(`\n📧 **${unreadEmails.length} unread email${unreadEmails.length !== 1 ? 's' : ''} in inbox**`);

      return { result: lines.join('\n') };
    }

    case 'create_task': {
      if (!input.title) return { result: 'Error: task title is required.' };
      const taskBody: any = {
        title: input.title,
        description: input.description || null,
        category: input.category || 'general',
        priority: input.priority || 'medium',
        status: 'pending',
        due_date: input.due_date || null,
        due_time: input.due_time || null,
        linked_label: input.linked_label || null,
        notes: input.notes || null,
        recurrence_type: input.recurrence_type || 'none',
      };

      // Compute remind_at
      if (input.due_date && input.remind_minutes_before != null) {
        const timeStr = input.due_time || '09:00';
        const dt = new Date(`${input.due_date}T${timeStr}:00`);
        dt.setMinutes(dt.getMinutes() - input.remind_minutes_before);
        taskBody.remind_at = dt.toISOString();
        taskBody.reminder_sent = false;
      }

      const { data, error } = await supabase.from('tasks').insert(taskBody).select().single();
      if (error) return { result: `Error creating task: ${error.message}` };

      const dueStr = data.due_date ? ` due ${data.due_date}${data.due_time ? ' at ' + formatTimeLocal(data.due_time) : ''}` : '';
      const reminderStr = data.remind_at ? ` (reminder set)` : '';
      return { result: `✅ Task created: **${data.title}**${dueStr}${reminderStr} [${data.priority} priority]` };
    }

    case 'complete_task': {
      let taskId = input.task_id;
      if (!taskId && input.title_search) {
        const { data: found } = await supabase.from('tasks').select('id, title').ilike('title', `%${input.title_search}%`).not('status', 'in', '("done","cancelled")').limit(1).single();
        if (!found) return { result: `No active task found matching "${input.title_search}".` };
        taskId = found.id;
      }
      if (!taskId) return { result: 'Please provide a task_id or title_search to identify the task.' };
      const { data, error } = await supabase.from('tasks').update({ status: 'done', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', taskId).select().single();
      if (error) return { result: `Error completing task: ${error.message}` };
      if (!data) return { result: 'Task not found.' };
      return { result: `✅ Task completed: **${data.title}**` };
    }

    case 'snooze_task': {
      let taskId = input.task_id;
      if (!taskId && input.title_search) {
        const { data: found } = await supabase.from('tasks').select('id, title').ilike('title', `%${input.title_search}%`).not('status', 'in', '("done","cancelled")').limit(1).single();
        if (!found) return { result: `No active task found matching "${input.title_search}".` };
        taskId = found.id;
      }
      if (!taskId) return { result: 'Please provide a task_id or title_search.' };
      if (!input.snooze_until) return { result: 'Please provide a snooze_until datetime.' };
      const snoozeDate = input.snooze_until.split('T')[0];
      const { data, error } = await supabase.from('tasks').update({ status: 'snoozed', snoozed_until: input.snooze_until, due_date: snoozeDate, updated_at: new Date().toISOString() }).eq('id', taskId).select().single();
      if (error) return { result: `Error snoozing task: ${error.message}` };
      if (!data) return { result: 'Task not found.' };
      const snoozeLabel = new Date(input.snooze_until).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      return { result: `💤 Task snoozed: **${data.title}** — see you ${snoozeLabel}` };
    }

    case 'update_task': {
      if (!input.task_id) return { result: 'Error: task_id is required. Use list_tasks to find the ID.' };
      const allowed = ['title', 'description', 'category', 'priority', 'due_date', 'due_time', 'notes', 'linked_label', 'recurrence_type'];
      const updates: any = { updated_at: new Date().toISOString() };
      for (const key of allowed) {
        if (key in input) updates[key] = input[key];
      }
      if (input.due_date && input.remind_minutes_before != null) {
        const timeStr = input.due_time || '09:00';
        const dt = new Date(`${input.due_date}T${timeStr}:00`);
        dt.setMinutes(dt.getMinutes() - input.remind_minutes_before);
        updates.remind_at = dt.toISOString();
        updates.reminder_sent = false;
      }
      const { data, error } = await supabase.from('tasks').update(updates).eq('id', input.task_id).select().single();
      if (error) return { result: `Error updating task: ${error.message}` };
      if (!data) return { result: 'Task not found.' };
      return { result: `✅ Task updated: **${data.title}**` };
    }

    case 'delete_task': {
      let taskId = input.task_id;
      let taskTitle = '';
      if (!taskId && input.title_search) {
        const { data: found } = await supabase.from('tasks').select('id, title').ilike('title', `%${input.title_search}%`).limit(1).single();
        if (!found) return { result: `No task found matching "${input.title_search}".` };
        taskId = found.id;
        taskTitle = found.title;
      }
      if (!taskId) return { result: 'Please provide a task_id or title_search.' };
      const { data: t } = await supabase.from('tasks').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', taskId).select('title').single();
      return { result: `🗑️ Task cancelled: **${t?.title || taskTitle}**` };
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
// LAYERED SYSTEM PROMPTS
// PROMPT_CORE is always sent (cached on Claude).
// Domain blocks appended only when those tools are active — saves tokens on simple queries.
// ═══════════════════════════════════════════

// Block 1 — always included, always cached
const PROMPT_CORE = `<role>
You are RO Assistant — the AI for RO Unlimited Construction (Greenville SC, serving SC/GA/NC). Say "RO Assistant" if asked who you are. Do not name your underlying model or company.
</role>

<principles>
- Use tools for all data — never fabricate numbers, names, or IDs.
- Be concise: bold key terms, use bullet lists. No triple-backtick code blocks (they render as raw text in this UI).
- Call independent tools in parallel when possible to save time.
- If uncertain about an ID, date, or value: say so and look it up rather than guessing.
- Never paste raw URLs or UUIDs in chat. Use the navigate tool for links. Refer to estimates by number (e.g. RO-EST-2026-0005).
- Confirm before sending emails or changing document status.
- After creating any record, navigate the user to it.
</principles>

<pages>
/admin · /admin/estimates · /admin/inbox · /admin/customers · /admin/vendors · /admin/employees · /admin/intakes · /admin/cost-library · /admin/templates · /admin/disclaimers · /admin/settings · /admin/tasks
</pages>`;

// Block 2 — estimates, pricing, doc types (appended when estimate tools are active)
const PROMPT_ESTIMATES = `<estimates>
Building a new estimate:
1. Gather: customer, type, scope, location
2. Draft fully in chat — phases, line items (qty × unit_cost = total), subtotals, grand total, payment schedule
3. Ask "Ready to commit?" — wait for confirmation
4. Then: create_estimate → add_line_items → navigate to it
5. Revisions: update the draft in chat and re-present before committing

Editing an existing estimate:
1. get_estimate_details → get real UUIDs for all line items
2. update_line_items (price/qty/phase/desc/order) · delete_line_items to remove · add_line_items to append
3. Only use UUIDs from get_estimate_details — never guess an ID
4. Show updated totals after every change

"The estimate" / "this estimate" → check ACTIVE PROJECT CONTEXT first → conversation history → then call get_estimate_details

Phase sequences (user can adjust — array position sets sort_order):
- New Construction: Site Prep → Foundation → Framing → Roofing → Exterior → Plumbing → Electrical → HVAC → Insulation → Drywall → Flooring → Paint → Trim → Landscaping → Cleanup
- Renovation: Demo → Structural → Plumbing → Electrical → HVAC → Framing → Insulation → Drywall → Flooring → Tile → Cabinets → Paint → Fixtures → Cleanup
- Commercial: Site Work → Foundation → Steel/Framing → Roofing → Exterior → MEP → Fire Suppression → Insulation → Drywall → Flooring → Paint → ADA → Specialty → Cleanup

Doc prefixes: Estimate=RO-EST · Proposal=RO-CON · Change Order=RO-CO · Quick Quote=RO-QQ
Status: draft→sent→viewed→accepted/declined/expired · any→revised
Divisions: residential, commercial, grading, concrete, foundation, framing, roofing, siding, electrical, plumbing, hvac, painting, flooring, demolition, drywall, landscaping, fencing, other
Types: new_construction, renovation, repair, addition, remodel, commercial, quick_quote, preliminary, detailed, change_order, time_materials

SC pricing (2025–26): Concrete $6-10/sqft · Framing $8-16 · Shingles $4-7 · Metal roof $8-14 · Plumbing $800-1500/fixture · HVAC $3-5K/ton · Electrical $150-300/outlet · Drywall $3-5 · Paint $2-4 · LVP $5-9 · Tile $8-20 · Cabinets $150-350/lnft · Demo $4-10 · Windows $400-1200ea · Insulation $1.50-3.50/sqft
</estimates>`;

// Block 3 — task management (appended when task tools are active)
const PROMPT_TASKS = `<tasks>
Intent → tool:
- "remind me" / "add task" / "schedule" → create_task (parse natural dates; default 09:00 if no time given)
- "what's today" / "what's due" → list_tasks(filter=today)
- "all tasks" / "what do I have" → list_tasks(filter=all)
- "briefing" / "rundown" / "what's going on" → get_daily_briefing
- "done" / "finished" / "mark complete" → complete_task
- "snooze" / "push to later" → snooze_task
Always call list_tasks first to get real IDs before completing or snoozing by title.
Categories: job_site · customer · vendor · permit · employee · financial · general
</tasks>`;

// Block 4 — property data and SC codes (appended when property_lookup is active)
const PROMPT_PROPERTY = `<property>
When given any property address or job site — always call property_lookup AND web_search in parallel:
- property_lookup → official data (lot size, sqft, year built, features, owner, value) + FEMA flood zone + OSM building data + satellite link
- web_search → county assessor records, parcel ID, business details, permit history, anything not in the API

Present results as a unified report. Always show the satellite link so the user can view the site.

SC property tax: Assessed value ≠ market value. SC assesses residential at 4% of FMV, commercial at 6%.
Example: $18,000 assessed ÷ 0.06 = $300,000 market value. Always calculate and show implied market value.

FEMA flood zones: X = minimal risk · AE/A = high risk (flood insurance required) · VE = coastal high risk
Flag AE/A/VE zones prominently — they affect foundation type, site work cost, and insurance.

Codes: IBC/IRC 2021 (SC adopted 2023). Lien law: SC 29-5-10, 90-day window.
Conversions: 1 cu yd = 27 cu ft = 81 sqft @ 4" depth · 1 roofing sq = 100 sqft · 1 ton HVAC = 12,000 BTU/hr
</property>`;

// Builds the full system prompt from only the blocks needed for this request
const ESTIMATE_TOOL_NAMES = new Set(['create_estimate','get_estimate_details','search_estimates','add_line_items','update_line_items','delete_line_items','update_estimate','update_estimate_status','send_estimate','duplicate_estimate','check_estimate_pricing','search_cost_library','search_templates','search_disclaimers','generate_share_link']);
const TASK_TOOL_NAMES = new Set(['create_task','list_tasks','complete_task','snooze_task','update_task','delete_task','get_daily_briefing']);

function buildSystemPrompt(selectedTools: typeof ALL_TOOLS, dynamicContext: string): string {
  const names = selectedTools.map(t => t.name);
  const hasEstimates = names.some(n => ESTIMATE_TOOL_NAMES.has(n));
  const hasTasks = names.some(n => TASK_TOOL_NAMES.has(n));
  const hasProperty = names.includes('property_lookup');

  const blocks = [PROMPT_CORE];
  if (hasEstimates) blocks.push(PROMPT_ESTIMATES);
  if (hasTasks) blocks.push(PROMPT_TASKS);
  if (hasProperty) blocks.push(PROMPT_PROPERTY);
  if (dynamicContext) blocks.push(dynamicContext);

  console.log('[ai-chat] Prompt blocks:', ['core', hasEstimates && 'estimates', hasTasks && 'tasks', hasProperty && 'property'].filter(Boolean).join('+'));
  return blocks.join('\n\n');
}

// ═══════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const { messages, currentPage, projectContext, useModel } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

    const grokKey = process.env.GROK_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    console.log('[ai-chat] Keys available: grok=', !!grokKey, 'claude=', !!claudeKey, 'groq=', !!groqKey, 'useModel=', useModel);
    if (!grokKey && !claudeKey && !groqKey) {
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

    // Build dynamic context block (memories, current page, active project)
    const dynamicContext = contextParts.length ? '\n' + contextParts.join('\n') : '';
    let content = '';
    let usedModel = '';
    const actions: { type: string; path: string; description: string }[] = [];

    // Smart tool selection — only send tools relevant to the user's message
    const lastUserMsg = messages.filter((m: any) => m.role === 'user').pop()?.content || '';
    const selectedTools = selectTools(typeof lastUserMsg === 'string' ? lastUserMsg : JSON.stringify(lastUserMsg), messages.length);

    // Convert tools to OpenAI function-calling format (for Grok)
    const openaiTools = (tools: typeof ALL_TOOLS) => tools.map(t => ({
      type: 'function' as const,
      function: { name: t.name, description: t.description, parameters: t.input_schema },
    }));

    // ── Priority 1: Grok 4.1 Fast (cheapest + best tool use) ──
    const preferGrok = useModel !== 'claude' && useModel !== 'groq' && !!grokKey;
    if (preferGrok) {
      try {
        const apiMessages = [
          { role: 'system', content: buildSystemPrompt(selectedTools, dynamicContext) },
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        ];
        const grokTools = selectedTools.length > 0 ? openaiTools(selectedTools) : undefined;

        let grokRes = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${grokKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'grok-4-1-fast',
            max_tokens: 4000,
            messages: apiMessages,
            ...(grokTools ? { tools: grokTools } : {}),
          }),
        });

        if (!grokRes.ok) {
          console.error('[ai-chat] Grok error:', grokRes.status, await grokRes.text());
        } else {
          let grokData = await grokRes.json();
          console.log('[ai-chat] Grok initial response:', grokData.choices?.[0]?.finish_reason, 'tool_calls:', grokData.choices?.[0]?.message?.tool_calls?.length || 0);

          // Tool use loop (max 5 rounds)
          let rounds = 0;
          while (grokData.choices?.[0]?.finish_reason === 'tool_calls' && rounds < 5) {
            rounds++;
            const toolCalls = grokData.choices[0].message.tool_calls || [];
            const assistantMsg = grokData.choices[0].message;
            console.log(`[ai-chat] Grok tool loop round ${rounds}:`, toolCalls.map((tc: any) => tc.function.name).join(', '));

            // Add assistant message with tool calls
            apiMessages.push(assistantMsg);

            // Execute tools and add results
            for (const tc of toolCalls) {
              const args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments;
              console.log(`[ai-chat] Executing tool: ${tc.function.name}`, JSON.stringify(args).substring(0, 200));
              const { result, action } = await executeTool(tc.function.name, args, supabase);
              console.log(`[ai-chat] Tool result: ${tc.function.name}`, typeof result === 'string' ? result.substring(0, 150) : 'object');
              if (action) actions.push(action);
              apiMessages.push({
                role: 'tool',
                tool_call_id: tc.id,
                content: typeof result === 'string' ? result : JSON.stringify(result),
              } as any);
            }

            // Continue with all tools available
            const allGrokTools = openaiTools(ALL_TOOLS);
            grokRes = await fetch('https://api.x.ai/v1/chat/completions', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${grokKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'grok-4-1-fast',
                max_tokens: 4000,
                messages: apiMessages,
                tools: allGrokTools,
              }),
            });

            if (!grokRes.ok) {
              console.error('[ai-chat] Grok tool loop error:', grokRes.status);
              break;
            }
            grokData = await grokRes.json();
          }

          content = grokData.choices?.[0]?.message?.content || '';
          usedModel = 'grok-4-1-fast';
        }
      } catch (err) {
        console.error('[ai-chat] Grok failed:', err);
      }
    }

    // ── Priority 2: Claude Haiku fallback (if Grok fails or user selects) ──
    if (!content && claudeKey && useModel !== 'groq') {
      try {
        const apiMessages = messages.map((m: any) => ({ role: m.role, content: m.content }));
        // Cache PROMPT_CORE (never changes). Domain blocks + dynamic context in second block (no cache — varies per query).
        const names = selectedTools.map(t => t.name);
        const hasEstBlocks = names.some(n => ESTIMATE_TOOL_NAMES.has(n));
        const hasTaskBlocks = names.some(n => TASK_TOOL_NAMES.has(n));
        const hasPropertyBlock = names.includes('property_lookup');
        const domainBlocks = [hasEstBlocks && PROMPT_ESTIMATES, hasTaskBlocks && PROMPT_TASKS, hasPropertyBlock && PROMPT_PROPERTY].filter(Boolean).join('\n\n');
        const systemBlocks: any[] = [
          { type: 'text', text: PROMPT_CORE, cache_control: { type: 'ephemeral' } },
        ];
        if (domainBlocks || dynamicContext) {
          systemBlocks.push({ type: 'text', text: [domainBlocks, dynamicContext].filter(Boolean).join('\n\n') });
        }

        let claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': claudeKey!, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 4000,
            system: systemBlocks,
            messages: apiMessages,
            ...(selectedTools.length > 0 ? { tools: selectedTools } : {}),
          }),
        });

        if (!claudeRes.ok) {
          console.error('[ai-chat] Claude error:', claudeRes.status, await claudeRes.text());
        } else {
          let claudeData = await claudeRes.json();
          let rounds = 0;
          while (claudeData.stop_reason === 'tool_use' && rounds < 5) {
            rounds++;
            const toolBlocks = claudeData.content.filter((b: any) => b.type === 'tool_use');
            const toolResults: any[] = [];
            const assistantContent = claudeData.content;
            for (const tool of toolBlocks) {
              const { result, action } = await executeTool(tool.name, tool.input, supabase);
              if (action) actions.push(action);
              toolResults.push({ type: 'tool_result', tool_use_id: tool.id, content: result });
            }
            claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: { 'x-api-key': claudeKey!, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001', max_tokens: 4000, system: systemBlocks,
                messages: [...apiMessages, { role: 'assistant', content: assistantContent }, { role: 'user', content: toolResults }],
                tools: ALL_TOOLS,
              }),
            });
            if (!claudeRes.ok) break;
            claudeData = await claudeRes.json();
          }
          const textBlocks = claudeData.content?.filter((b: any) => b.type === 'text') || [];
          content = textBlocks.map((b: any) => b.text).join('\n');
          usedModel = 'claude-haiku-4.5';
        }
      } catch (err) {
        console.error('[ai-chat] Claude failed:', err);
      }
    }

    // ── Priority 3: Groq fallback (no tool_use) ──
    if (!content && groqKey) {
      const groqPrompt = buildSystemPrompt(selectedTools, dynamicContext) + '\n\nNote: You do not have database tools in this mode. Answer from context and general knowledge only. Be clear when you are estimating vs stating facts.';
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
          usedModel = 'groq-llama-3.3';
    }

    if (!content) return NextResponse.json({ error: 'No AI service available' }, { status: 502 });

    return NextResponse.json({
      role: 'assistant',
      content,
      model: usedModel,
      ...(actions.length > 0 ? { actions } : {}),
    });
  } catch (err: any) {
    console.error('[ai-chat] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function formatTimeLocal(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, '0')}${ampm}`;
}
