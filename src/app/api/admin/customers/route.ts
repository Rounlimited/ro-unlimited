import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { resolveCustomerName } from '@/lib/customers';

// GET — list all customers, with optional type and search filters
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const type = req.nextUrl.searchParams.get('type');
    const search = req.nextUrl.searchParams.get('search');

    let query = supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[customers] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — create a new customer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const named = resolveCustomerName(body);
    if (!named) {
      return NextResponse.json({ error: 'Enter a name or a company' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('customers')
      .insert({
        ...named,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        zip: body.zip || null,
        type: body.type || 'residential',
        source: body.source || null,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[customers] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
