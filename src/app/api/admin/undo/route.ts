import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { syncScheduleAmounts } from '@/lib/estimates';
import { UNDOABLE_TABLES, loadHistory, saveHistory, loadDeleted, saveDeleted } from '@/lib/edit-history';

// GET  ?table=estimates&id=...  → { canUndo, canRedo, undoLabel, redoLabel }
// GET  ?deleted=1               → recently deleted items (restorable)
// POST { table, id, action: 'undo' | 'redo' }
// POST { restore: '<deleted entry timestamp>' }

const state = (h: { stack: any[]; pos: number }) => ({
  canUndo: h.pos > 0,
  canRedo: h.pos < h.stack.length,
  undoLabel: h.pos > 0 ? h.stack[h.pos - 1].label : null,
  redoLabel: h.pos < h.stack.length ? h.stack[h.pos].label : null,
});

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const sp = req.nextUrl.searchParams;
  if (sp.get('deleted')) {
    const list = await loadDeleted(supabase);
    return NextResponse.json({ items: list.map((d) => ({ at: d.at, table: d.table, label: d.label })) });
  }
  const table = sp.get('table') || '';
  const id = sp.get('id') || '';
  if (!UNDOABLE_TABLES[table] || !id) return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  return NextResponse.json(state(await loadHistory(supabase, table, id)));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createAdminClient();

    if (body.restore) {
      const list = await loadDeleted(supabase);
      const idx = list.findIndex((d) => d.at === body.restore);
      if (idx < 0) return NextResponse.json({ error: 'Already restored or expired' }, { status: 404 });
      const entry = list[idx];
      if (!UNDOABLE_TABLES[entry.table]) return NextResponse.json({ error: 'Not restorable' }, { status: 400 });
      const { error } = await supabase.from(entry.table).insert(entry.row);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      list.splice(idx, 1);
      await saveDeleted(supabase, list);
      return NextResponse.json({ ok: true, restored: entry.label });
    }

    const { table, id, action } = body;
    if (!UNDOABLE_TABLES[table] || !id) return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    const h = await loadHistory(supabase, table, id);
    let fields: Record<string, any>;
    if (action === 'undo') {
      if (h.pos <= 0) return NextResponse.json({ error: 'Nothing to undo' }, { status: 400 });
      fields = h.stack[h.pos - 1].before;
      h.pos -= 1;
    } else if (action === 'redo') {
      if (h.pos >= h.stack.length) return NextResponse.json({ error: 'Nothing to redo' }, { status: 400 });
      fields = h.stack[h.pos].after;
      h.pos += 1;
    } else {
      return NextResponse.json({ error: 'Bad action' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from(table)
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (table === 'estimates' && 'total' in fields) await syncScheduleAmounts(supabase, id, Number(data.total) || 0);
    await saveHistory(supabase, table, id, h);
    return NextResponse.json({ ok: true, ...state(h) });
  } catch (e) {
    console.error('[admin/undo]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
