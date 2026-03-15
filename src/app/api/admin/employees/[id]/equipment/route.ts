import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type RouteContext = { params: { id: string } };

// GET — list equipment for employee
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('employee_equipment')
      .select('*')
      .eq('employee_id', id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[employees/[id]/equipment] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST — assign equipment to employee
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const { name, description, serial_number, condition, notes } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('employee_equipment')
      .insert({
        employee_id: id,
        name,
        description: description || null,
        serial_number: serial_number || null,
        condition: condition || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[employees/[id]/equipment] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH — update equipment (mark returned, change condition, etc.)
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { equip_id, returned_date, condition, notes } = await req.json();

    if (!equip_id) {
      return NextResponse.json({ error: 'equip_id is required' }, { status: 400 });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (returned_date !== undefined) updates.returned_date = returned_date;
    if (condition !== undefined) updates.condition = condition;
    if (notes !== undefined) updates.notes = notes;

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('employee_equipment')
      .update(updates)
      .eq('id', equip_id)
      .eq('employee_id', params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });

    return NextResponse.json(data);
  } catch (err) {
    console.error('[employees/[id]/equipment] PATCH error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE — remove equipment record
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const equipId = req.nextUrl.searchParams.get('equip_id');

    if (!equipId) {
      return NextResponse.json({ error: 'equip_id query param required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('employee_equipment')
      .delete()
      .eq('id', equipId)
      .eq('employee_id', params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[employees/[id]/equipment] DELETE error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
