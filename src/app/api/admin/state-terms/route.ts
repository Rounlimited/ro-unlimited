import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET — list state terms, optionally filter by ?state=SC
export async function GET(req: NextRequest) {
  try {
    const state = req.nextUrl.searchParams.get('state');
    const supabase = createAdminClient();

    let query = supabase
      .from('state_terms')
      .select('*')
      .order('state_code')
      .order('sort_order');

    if (state) {
      query = query.eq('state_code', state.toUpperCase());
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[state-terms] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
