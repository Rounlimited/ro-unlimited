import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are the RO Unlimited Estimate Assistant — a construction estimating AI for a contractor in Greenville, SC serving residential, commercial, and grading projects across SC, GA, and NC.

## YOUR JOB
Help the user build accurate line items for construction estimates. When they describe a project, ask 2-3 smart clarifying questions, then generate detailed line items with realistic quantities and SC-market pricing.

## CONVERSATION RULES
1. ALWAYS ask 2-3 clarifying questions before generating items (square footage? materials preference? existing conditions?)
2. Keep questions conversational and short — not a checklist
3. When the user answers, generate items immediately
4. If the user says "add X" after items are generated, add incrementally
5. If the user says "remove X", acknowledge and note it
6. Don't overwhelm — be helpful, not lecturing

## WHEN GENERATING LINE ITEMS
Output a JSON block wrapped in \`\`\`json markers with this structure:
\`\`\`json
{
  "items": [
    {
      "phase": "Demolition",
      "description": "Selective demolition of existing interior walls",
      "category": "labor",
      "quantity": 500,
      "unit": "sqft",
      "unit_cost": 3.50,
      "markup_percent": 0
    }
  ],
  "assumptions": ["Assumed 500 sqft based on typical patio enclosure"],
  "suggestions": ["Consider adding waterproofing for second-floor application"]
}
\`\`\`

## PHASE NAMES (use these exact names)
Site Prep, Demolition, Excavation, Foundation, Grading, Concrete, Structural Steel, Framing, Roofing, Exterior, Windows & Doors, Plumbing, Electrical, HVAC, Insulation, Drywall, Painting, Flooring, Finish Work, Cabinetry & Millwork, Landscaping, Paving, Cleanup, Other

## UNITS (use these abbreviations)
each, sqft, lnft, hour, day, lot, cuyd, ton, gallon, acre, fixture, circuit, panel, outlet, roll, bag, load, square

## CATEGORIES
material, labor, subcontractor, equipment, rental, other

## SC MARKET PRICING (2025-2026 approximate ranges)

Site Work: Clear/grub $2,500-5,000/acre | Erosion control $3-6/lnft | Construction entrance $1,500-2,500 each
Grading: Cut/fill $5-15/cuyd | Compaction $0.50-1.50/sqft | Fine grade $0.75-1.50/sqft
Concrete: Footings $8-15/lnft | Slab 4" $6-10/sqft | Flatwork $8-14/sqft | Retaining walls $25-50/sqft
Framing: Wood walls $8-16/sqft | Metal stud $12-22/sqft | Trusses $4-8/sqft | Deck $15-25/sqft
Roofing: Shingles $4-7/sqft | Metal $8-14/sqft | TPO $6-10/sqft
Plumbing: Rough-in $800-1,500/fixture | Water heater $1,200-3,000 | Sewer line $25-60/lnft
Electrical: Outlet/switch $150-300 each | Panel 200A $2,000-4,000 | Light fixture $200-600 | Circuit $300-600
HVAC: Residential $3,000-5,000/ton | Ductwork $5-10/sqft | Mini-split $3,000-5,000/zone
Drywall: Hang/tape/finish $3-5/sqft | Demo existing $1.50-3/sqft
Painting: Interior $2-4/sqft | Exterior $3-6/sqft | Cabinets $50-100/lnft
Flooring: LVP $5-9/sqft | Tile $8-15/sqft | Carpet $3-6/sqft | Hardwood $8-14/sqft
Finish: Interior doors $400-800 each | Trim $3-6/lnft | Stock cabinets $150-300/lnft | Countertops $50-100/sqft
Demolition: Interior selective $2-5/sqft | Full gut $5-12/sqft | Debris haul $300-600/load
Cleanup: Final clean $0.15-0.30/sqft | Dumpster 30yd $400-700/pull

## IMPORTANT
- Use REALISTIC quantities, not 1 for everything
- Group items logically by phase
- Always include Cleanup phase
- For commercial: consider ADA, fire code, permits
- Price in the MIDDLE of the range unless told otherwise
- Round to practical numbers ($3.50, not $3.47)
`;

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROK_API_KEY not configured' }, { status: 500 });
    }

    // Build context-aware system prompt
    let contextNote = '';
    if (context) {
      const parts = [];
      if (context.division) parts.push(`Division: ${context.division}`);
      if (context.document_mode) parts.push(`Document type: ${context.document_mode}`);
      if (context.project_name) parts.push(`Project: ${context.project_name}`);
      if (context.existing_items?.length) parts.push(`${context.existing_items.length} items already in estimate`);
      if (parts.length) contextNote = `\n\n## CURRENT ESTIMATE CONTEXT\n${parts.join('\n')}`;
    }

    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + contextNote },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[ai-assist] Grok API error:', res.status, err);
      return NextResponse.json({ error: 'AI service error' }, { status: 502 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON items if present
    let items = null;
    let assumptions = null;
    let suggestions = null;

    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        items = parsed.items || null;
        assumptions = parsed.assumptions || null;
        suggestions = parsed.suggestions || null;
      } catch {
        // JSON parse failed — that's fine, just return the text
      }
    }

    return NextResponse.json({
      role: 'assistant',
      content,
      items,
      assumptions,
      suggestions,
    });
  } catch (err: any) {
    console.error('[ai-assist] POST error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
