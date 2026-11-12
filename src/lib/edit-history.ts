// System-wide Undo / Redo.
//
// Row edits: every PATCH on a supported table records the columns that
// changed (before + after) in app_settings under  history:<table>:<id>.
// Deletes: the whole deleted row is pushed onto  history:deleted  (newest
// first, last 40) so it can be restored.
//
// Nothing here may throw — history must never be able to break a save.

export const UNDOABLE_TABLES: Record<string, string> = {
  estimates: 'Estimate',
  invoices: 'Invoice',
  customers: 'Customer',
  vendors: 'Vendor',
  estimate_templates: 'Template',
  cost_items: 'Cost item',
  tasks: 'Task',
  job_schedule_items: 'Schedule item',
  company_letters: 'Letter',
  job_costs: 'Job cost',
};

const MAX = 30;
const MAX_DELETED = 40;
const SKIP = new Set(['updated_at', 'created_at', 'id']);

export type HistEntry = { at: string; label: string; before: Record<string, any>; after: Record<string, any> };
export type Hist = { stack: HistEntry[]; pos: number }; // pos = number of applied entries
export type DeletedEntry = { at: string; table: string; label: string; row: Record<string, any> };

const rowKey = (table: string, id: string) => `history:${table}:${id}`;
const DEL_KEY = 'history:deleted';

async function getVal(supabase: any, key: string): Promise<any> {
  try {
    const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle();
    return data?.value ?? null;
  } catch { return null; }
}
async function setVal(supabase: any, key: string, value: any) {
  try { await supabase.from('app_settings').upsert({ key, value, updated_at: new Date().toISOString() }); } catch { /* ignore */ }
}

export async function loadHistory(supabase: any, table: string, id: string): Promise<Hist> {
  const v = await getVal(supabase, rowKey(table, id));
  if (v && Array.isArray(v.stack)) return { stack: v.stack, pos: Math.min(Number(v.pos ?? v.stack.length), v.stack.length) };
  return { stack: [], pos: 0 };
}
export const saveHistory = (supabase: any, table: string, id: string, h: Hist) => setVal(supabase, rowKey(table, id), h);

function labelFor(table: string, fields: string[]): string {
  if (table === 'estimates') {
    if (fields.includes('total_override')) return 'fixed price';
    if (fields.some((f) => f.startsWith('adjustment_'))) return 'credit/charge';
    if (fields.includes('project_description')) return 'scope of work';
  }
  if (fields.includes('line_items')) return 'line items';
  const f = fields.slice(0, 2).join(', ').replace(/_/g, ' ');
  return f || 'change';
}

/** Read the row before a write (null if it can't be read). */
export async function snapshotRow(supabase: any, table: string, id: string): Promise<Record<string, any> | null> {
  try {
    const { data } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
    return data || null;
  } catch { return null; }
}

/** After a write: diff the prior row against the saved row and push an entry. */
export async function recordEdit(supabase: any, table: string, id: string, prior: Record<string, any> | null, saved: Record<string, any> | null) {
  try {
    if (!prior || !saved) return;
    const before: Record<string, any> = {};
    const after: Record<string, any> = {};
    for (const k of Object.keys(prior)) {
      if (SKIP.has(k) || !(k in saved)) continue;
      const a = prior[k] ?? null; const b = saved[k] ?? null;
      if (typeof b === 'object' && b !== null && !Array.isArray(b) && typeof a !== 'object') continue; // joined objects
      if (JSON.stringify(a) === JSON.stringify(b)) continue;
      before[k] = a; after[k] = b;
    }
    const fields = Object.keys(after);
    if (!fields.length) return;
    if (fields.length === 1 && fields[0] === 'status' && table === 'estimates') return; // has its own history
    const h = await loadHistory(supabase, table, id);
    const stack = h.stack.slice(0, h.pos); // a new edit clears redo
    stack.push({ at: new Date().toISOString(), label: labelFor(table, fields), before, after });
    const trimmed = stack.slice(-MAX);
    await saveHistory(supabase, table, id, { stack: trimmed, pos: trimmed.length });
  } catch { /* ignore */ }
}

/** Before a delete: stash the whole row so it can be restored. */
export async function recordDelete(supabase: any, table: string, row: Record<string, any> | null, label?: string) {
  try {
    if (!row) return;
    const list: DeletedEntry[] = (await getVal(supabase, DEL_KEY)) || [];
    const name = label || row.name || row.title || row.project_name || row.invoice_number || row.description || row.company_name || row.first_name || String(row.id).slice(0, 8);
    list.unshift({ at: new Date().toISOString(), table, label: `${UNDOABLE_TABLES[table] || table}: ${String(name).slice(0, 80)}`, row });
    await setVal(supabase, DEL_KEY, list.slice(0, MAX_DELETED));
  } catch { /* ignore */ }
}

export const loadDeleted = async (supabase: any): Promise<DeletedEntry[]> => (await getVal(supabase, DEL_KEY)) || [];
export const saveDeleted = (supabase: any, list: DeletedEntry[]) => setVal(supabase, DEL_KEY, list);
