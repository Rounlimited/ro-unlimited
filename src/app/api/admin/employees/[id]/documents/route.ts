import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: { id: string } };

// GET — list documents for employee
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('employee_id', id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[employees/[id]/documents] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — add a document for employee
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const { name, doc_type, file_url, asset_id, expiry_date, notes } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('employee_documents')
      .insert({
        employee_id: id,
        name,
        doc_type: doc_type || null,
        file_url: file_url || null,
        asset_id: asset_id || null,
        expiry_date: expiry_date || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[employees/[id]/documents] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE — remove a document
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const docId = req.nextUrl.searchParams.get('doc_id');

    if (!docId) {
      return NextResponse.json({ error: 'doc_id query param required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('employee_documents')
      .delete()
      .eq('id', docId)
      .eq('employee_id', params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[employees/[id]/documents] DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
