import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET — list estimates with customer info, supports filters
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const status = req.nextUrl.searchParams.get('status');
    const estimate_type = req.nextUrl.searchParams.get('estimate_type');
    const division = req.nextUrl.searchParams.get('division');
    const document_mode = req.nextUrl.searchParams.get('document_mode');
    const search = req.nextUrl.searchParams.get('search');

    let query = supabase
      .from('estimates')
      .select('*, customer:customers(id, first_name, last_name, company_name)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (estimate_type) {
      query = query.eq('estimate_type', estimate_type);
    }
    if (division) {
      query = query.eq('division', division);
    }
    if (document_mode) {
      query = query.eq('document_mode', document_mode);
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let results = data || [];

    // Client-side search filter (searches across estimate + customer fields)
    if (search) {
      const s = search.toLowerCase();
      results = results.filter((est: any) => {
        const custName = [est.customer?.first_name, est.customer?.last_name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        const companyName = (est.customer?.company_name || '').toLowerCase();
        return (
          (est.project_name || '').toLowerCase().includes(s) ||
          (est.estimate_number || '').toLowerCase().includes(s) ||
          custName.includes(s) ||
          companyName.includes(s)
        );
      });
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error('[estimates] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — create a new estimate with auto-generated estimate_number
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer_id } = body;

    if (!customer_id) {
      return NextResponse.json({ error: 'customer_id is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const year = new Date().getFullYear();
    const docMode = body.document_mode || 'estimate';

    // Document number prefix based on mode
    const prefixMap: Record<string, string> = {
      estimate: 'RO-EST',
      contract: 'RO-CON',
      change_order: 'RO-CO',
      quick_quote: 'RO-QQ',
    };
    const docPrefix = prefixMap[docMode] || 'RO-EST';
    const prefix = `${docPrefix}-${year}-`;

    // Find the max existing number for this prefix
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
        customer_id,
        document_mode: docMode,
        status: body.status || 'draft',
        version: body.version || 1,
        project_name: body.project_name || null,
        project_address: body.project_address || null,
        project_city: body.project_city || null,
        project_state: body.project_state || 'SC',
        project_zip: body.project_zip || null,
        estimate_type: body.estimate_type || null,
        contract_type: body.contract_type || null,
        division: body.division || null,
        project_description: body.project_description || body.description || body.scope_of_work || null,
        overhead_percent: body.overhead_percent ?? 0,
        markup_percent: body.markup_percent ?? 0,
        tax_percent: body.tax_percent ?? 0,
        contingency_percent: body.contingency_percent ?? 0,
        permit_fees: body.permit_fees ?? 0,
        valid_until: body.valid_until || null,
        notes: body.notes || null,
        inclusions: body.inclusions || null,
        project_start_date: body.project_start_date || null,
        project_duration_days: body.project_duration_days || null,
        weather_days: body.weather_days ?? 0,
        schedule_notes: body.schedule_notes || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[estimates] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
