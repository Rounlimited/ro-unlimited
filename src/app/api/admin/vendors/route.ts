import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET — list vendors with optional filters
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const type = req.nextUrl.searchParams.get('type');
    const trade = req.nextUrl.searchParams.get('trade');
    const search = req.nextUrl.searchParams.get('search');
    const preferred = req.nextUrl.searchParams.get('preferred');

    let query = supabase
      .from('vendors')
      .select('*')
      .order('company_name', { ascending: true });

    if (type) {
      query = query.eq('type', type);
    }

    if (trade) {
      query = query.ilike('trade', `%${trade}%`);
    }

    if (search) {
      query = query.or(
        `company_name.ilike.%${search}%,contact_name.ilike.%${search}%,trade.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    if (preferred === 'true') {
      query = query.eq('is_preferred', true);
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[vendors] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — create a new vendor
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.company_name) {
      return NextResponse.json({ error: 'company_name is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('vendors')
      .insert({
        company_name: body.company_name,
        contact_name: body.contact_name || null,
        trade: body.trade || null,
        type: body.type || 'supplier',
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || 'SC',
        zip: body.zip || null,
        notes: body.notes || null,
        is_preferred: body.is_preferred || false,
        is_active: body.is_active !== undefined ? body.is_active : true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[vendors] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
