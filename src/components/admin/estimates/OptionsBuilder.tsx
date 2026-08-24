'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Layers, Plus, X, Trash2, Pencil, Loader2, ImagePlus, Star, Lock, CheckCircle2,
} from 'lucide-react';
import { compressImage } from '@/components/admin/estimates/EstimatePhotos';
import { OPTION_PRESETS, DIVISION_LABELS, presetChoicesWithImages, type OptionPreset, type PresetDivision } from '@/lib/option-presets';

/**
 * OptionsBuilder — JR builds customer-selectable option groups on an
 * estimate/contract ("Roof Color" → photo choices with price deltas).
 * Self-contained: fetches and saves through /api/admin/estimates/[id]/options.
 * Mounted on the estimate detail Options tab and inside the wizard.
 * JR-sized: 17px text, 48px+ targets.
 */

interface Choice {
  id?: string;
  label: string;
  description: string;
  image_url: string | null;
  price_delta: string; // string in the editor, number on the wire
  is_default: boolean;
}

interface Group {
  id: string;
  label: string;
  description: string | null;
  selection_type: 'single' | 'multi' | 'addon';
  required: boolean;
  choices: {
    id: string; label: string; description: string | null; image_url: string | null;
    price_delta: number; is_default: boolean; selected: boolean;
  }[];
}

const TYPE_META: Record<string, { label: string; hint: string }> = {
  single: { label: 'Pick One', hint: 'Customer chooses exactly one (roof color, siding style)' },
  multi:  { label: 'Pick Any', hint: 'Customer can choose several (upgrades, extras)' },
  addon:  { label: 'Add-On',  hint: 'Optional yes/no extra (screened porch, generator)' },
};

const fmtDelta = (n: number) =>
  n === 0 ? 'Included' : (n > 0 ? '+' : '−') + '$' + Math.abs(n).toLocaleString();

const thumb = (url: string) => url.includes('cdn.sanity.io') ? url + '?w=200&auto=format' : url;

export default function OptionsBuilder({ estimateId }: { estimateId: string }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Group | 'new' | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [presetBusy, setPresetBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/estimates/' + estimateId + '/options');
      const data = await res.json();
      if (Array.isArray(data.options)) setGroups(data.options);
      const est = await fetch('/api/admin/estimates/' + estimateId).then((r) => r.json()).catch(() => null);
      if (est?.options_materialized_at) setLocked(true);
    } catch { /* keep last */ }
    setLoading(false);
  }, [estimateId]);

  useEffect(() => { load(); }, [load]);

  const deleteGroup = async (g: Group) => {
    if (!confirm('Delete "' + g.label + '" and its choices?')) return;
    const res = await fetch('/api/admin/estimates/' + estimateId + '/options/' + g.id, { method: 'DELETE' });
    if (res.ok) load(); else alert((await res.json()).error || 'Failed');
  };

  const addPreset = async (pr: OptionPreset) => {
    setPresetBusy(pr.label);
    try {
      const res = await fetch('/api/admin/estimates/' + estimateId + '/options', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: pr.label, description: pr.description || null, selection_type: pr.selection_type, required: pr.required !== false, choices: presetChoicesWithImages(pr) }),
      });
      const data = await res.json();
      if (!res.ok || data.error) alert(data.error || 'Could not add preset');
      else await load();
    } catch { alert('Network error'); }
    setPresetBusy(null);
  };

  if (loading) return <div className="flex items-center gap-3 text-white/40 py-6"><Loader2 size={20} className="animate-spin" /> Loading options…</div>;

  return (
    <div className="space-y-3">
      {locked && (
        <div className="flex items-center gap-2.5 rounded-xl p-3.5 text-[15px] font-semibold"
          style={{ background: 'rgba(53,208,127,0.08)', color: '#35d07f', border: '1px solid rgba(53,208,127,0.25)' }}>
          <Lock size={17} /> Signed — options are locked into the contract.
        </div>
      )}

      {groups.length === 0 && !locked && (
        <p className="text-[15px] text-white/40 leading-relaxed">
          Give the customer choices — roof colors, finishes, add-ons. Each choice can carry a photo
          and a price difference, and their picks update the total live on their link.
        </p>
      )}

      {groups.map((g) => (
        <div key={g.id} className="rounded-2xl border border-white/8 bg-[#111] overflow-hidden">
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[17px] font-bold truncate">{g.label}</p>
                <span className="text-[12px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: 'rgba(201,168,76,0.15)', color: '#D4B965' }}>
                  {TYPE_META[g.selection_type]?.label || g.selection_type}
                </span>
              </div>
              {g.description && <p className="text-[14px] text-white/40 truncate mt-0.5">{g.description}</p>}
            </div>
            {!locked && (
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => setEditing(g)} className="w-11 h-11 rounded-lg bg-white/5 flex items-center justify-center active:scale-95">
                  <Pencil size={16} className="text-white/50" />
                </button>
                <button onClick={() => deleteGroup(g)} className="w-11 h-11 rounded-lg bg-white/5 flex items-center justify-center active:scale-95">
                  <Trash2 size={16} className="text-white/40" />
                </button>
              </div>
            )}
          </div>
          <div className="px-4 pb-4 flex gap-2.5 overflow-x-auto">
            {g.choices.map((ch) => (
              <div key={ch.id} className="w-32 shrink-0 rounded-xl border overflow-hidden"
                style={{ borderColor: ch.selected ? 'rgba(53,208,127,0.5)' : 'rgba(255,255,255,0.08)' }}>
                <div className="h-20 bg-black/40 relative">
                  {ch.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={thumb(ch.image_url)} alt={ch.label} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Layers size={20} className="text-white/15" /></div>
                  )}
                  {ch.is_default && (
                    <span className="absolute top-1 left-1"><Star size={13} className="fill-[#D4B965] text-[#D4B965]" /></span>
                  )}
                  {ch.selected && (
                    <span className="absolute top-1 right-1"><CheckCircle2 size={15} className="text-[#35d07f]" /></span>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-[13px] font-semibold leading-tight truncate">{ch.label}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: ch.price_delta > 0 ? '#D4B965' : 'rgba(255,255,255,0.4)' }}>
                    {fmtDelta(Number(ch.price_delta))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {!locked && (
        <div className="grid grid-cols-2 gap-2.5">
          <button onClick={() => setShowPresets(true)}
            className="min-h-[52px] rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
            style={{ background: 'rgba(201,168,76,0.15)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.45)' }}>
            <Layers size={18} /> Add from Presets
          </button>
          <button onClick={() => setEditing('new')}
            className="min-h-[52px] rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', border: '1px dashed rgba(255,255,255,0.2)' }}>
            <Plus size={18} /> Custom Group
          </button>
        </div>
      )}

      {showPresets && (
        <PresetSheet
          existing={groups.map((g) => g.label.toLowerCase())}
          busy={presetBusy}
          onAdd={addPreset}
          onClose={() => setShowPresets(false)}
        />
      )}

      {editing && (
        <GroupSheet
          estimateId={estimateId}
          group={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

/* ── Group editor sheet ─────────────────────────────────────── */
function GroupSheet({ estimateId, group, onClose, onSaved }: {
  estimateId: string; group: Group | null; onClose: () => void; onSaved: () => void;
}) {
  const [label, setLabel] = useState(group?.label || '');
  const [description, setDescription] = useState(group?.description || '');
  const [type, setType] = useState<string>(group?.selection_type || 'single');
  const [choices, setChoices] = useState<Choice[]>(
    group
      ? group.choices.map((ch) => ({
          id: ch.id, label: ch.label, description: ch.description || '',
          image_url: ch.image_url, price_delta: String(ch.price_delta || 0), is_default: ch.is_default,
        }))
      : [
          { label: '', description: '', image_url: null, price_delta: '0', is_default: true },
          { label: '', description: '', image_url: null, price_delta: '', is_default: false },
        ]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingIdx = useRef<number>(0);

  const inputCls = 'w-full min-h-[52px] px-4 rounded-xl bg-white/5 border border-white/10 text-[17px] placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/50';
  const labelCls = 'block text-[14px] font-semibold text-white/50 uppercase tracking-wide mb-1.5';

  const pickImage = (idx: number) => { pendingIdx.current = idx; fileRef.current?.click(); };

  const uploadImage = async (file: File) => {
    const idx = pendingIdx.current;
    setUploadingIdx(idx);
    try {
      const blob = await compressImage(file);
      const fd = new FormData();
      fd.append('file', new File([blob], file.name.replace(/\.(heic|heif|png|webp)$/i, '.jpg'), { type: 'image/jpeg' }));
      fd.append('type', 'optionChoice');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setChoices((cs) => cs.map((c, i) => (i === idx ? { ...c, image_url: data.url } : c)));
      } else setError(data.error || 'Image upload failed');
    } catch { setError('Image upload failed'); }
    setUploadingIdx(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const setDefault = (idx: number) => {
    setChoices((cs) => cs.map((c, i) => ({
      ...c,
      // single/addon: one default max; multi: toggle freely
      is_default: type === 'multi' ? (i === idx ? !c.is_default : c.is_default) : i === idx,
    })));
  };

  const submit = async () => {
    setError(null);
    if (!label.trim()) { setError('Give the group a name (e.g. Roof Color)'); return; }
    const clean = choices.filter((c) => c.label.trim());
    if (!clean.length) { setError('Add at least one choice'); return; }
    setSaving(true);
    const payload = {
      label: label.trim(),
      description: description.trim() || null,
      selection_type: type,
      choices: clean.map((c) => ({
        label: c.label.trim(),
        description: c.description.trim() || null,
        image_url: c.image_url,
        price_delta: Number(c.price_delta) || 0,
        is_default: c.is_default,
      })),
    };
    try {
      const url = '/api/admin/estimates/' + estimateId + '/options' + (group ? '/' + group.id : '');
      const res = await fetch(url, {
        method: group ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || 'Save failed'); setSaving(false); return; }
      onSaved();
    } catch { setError('Network error'); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#121212] border-t sm:border border-white/10 p-5"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
        <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-4 sm:hidden" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[20px] font-bold">{group ? 'Edit' : 'New'} Option Group</h2>
          <button onClick={onClose} className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5"><X size={20} className="text-white/60" /></button>
        </div>

        <label className={labelCls}>Group name</label>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Roof Color" className={inputCls + ' mb-3'} />
        <label className={labelCls}>Description (optional)</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Architectural shingle color options" className={inputCls + ' mb-4'} />

        <label className={labelCls}>How they choose</label>
        <div className="grid grid-cols-3 gap-2 mb-1.5">
          {Object.entries(TYPE_META).map(([t, meta]) => (
            <button key={t} onClick={() => setType(t)}
              className="min-h-[48px] rounded-xl text-[15px] font-bold transition-all active:scale-95"
              style={type === t
                ? { background: 'rgba(201,168,76,0.15)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.4)' }
                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {meta.label}
            </button>
          ))}
        </div>
        <p className="text-[13px] text-white/35 mb-4">{TYPE_META[type]?.hint}</p>

        <label className={labelCls}>Choices</label>
        <div className="space-y-3 mb-3">
          {choices.map((c, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/3 p-3">
              <div className="flex gap-2.5">
                <button onClick={() => pickImage(i)}
                  className="w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center active:scale-95">
                  {uploadingIdx === i ? <Loader2 size={18} className="animate-spin text-white/40" />
                    : c.image_url
                      /* eslint-disable-next-line @next/next/no-img-element */
                      ? <img src={thumb(c.image_url)} alt="" className="w-full h-full object-cover" />
                      : <ImagePlus size={20} className="text-white/30" />}
                </button>
                <div className="flex-1 min-w-0 space-y-2">
                  <input value={c.label} onChange={(e) => setChoices(choices.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                    placeholder="Charcoal Architectural" className={inputCls} />
                  <div className="flex gap-2">
                    <input value={c.price_delta} onChange={(e) => setChoices(choices.map((x, j) => j === i ? { ...x, price_delta: e.target.value } : x))}
                      placeholder="+/− $" type="number" inputMode="decimal" step="0.01"
                      className="min-h-[48px] px-3 rounded-xl bg-white/5 border border-white/10 text-[16px] w-32 placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/50" />
                    <button onClick={() => setDefault(i)}
                      className="min-h-[48px] px-3 rounded-xl text-[14px] font-bold flex items-center gap-1.5 active:scale-95"
                      style={c.is_default
                        ? { background: 'rgba(201,168,76,0.15)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.4)' }
                        : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Star size={14} className={c.is_default ? 'fill-[#D4B965]' : ''} /> Default
                    </button>
                    {choices.length > 1 && (
                      <button onClick={() => setChoices(choices.filter((_, j) => j !== i))}
                        className="w-12 min-h-[48px] rounded-xl bg-white/4 flex items-center justify-center active:scale-95 ml-auto">
                        <Trash2 size={16} className="text-white/40" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setChoices([...choices, { label: '', description: '', image_url: null, price_delta: '', is_default: false }])}
          className="text-[15px] font-semibold mb-5 min-h-[44px] px-1" style={{ color: '#D4B965' }}>
          + Add choice
        </button>

        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />

        {error && <p className="text-[15px] text-[#f87171] mb-3">{error}</p>}
        <button disabled={saving} onClick={submit}
          className="w-full min-h-[56px] rounded-xl text-[17px] font-bold text-black disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
          style={{ background: 'linear-gradient(145deg, #C9A84C, #a8893d)', boxShadow: '0 4px 18px rgba(201,168,76,0.35)' }}>
          {saving ? <Loader2 size={20} className="animate-spin" /> : <Layers size={18} />} {group ? 'Save Changes' : 'Create Group'}
        </button>
        {group && (
          <p className="text-[13px] text-white/30 text-center mt-3">Saving replaces the choices — customer selections reset to defaults.</p>
        )}
      </div>
    </div>
  );
}


/* ── Preset picker sheet: division tabs + search, one-tap add ── */
function PresetSheet({ existing, busy, onAdd, onClose }: {
  existing: string[]; busy: string | null; onAdd: (pr: OptionPreset) => void; onClose: () => void;
}) {
  const [division, setDivision] = useState<PresetDivision | 'all'>('all');
  const [q, setQ] = useState('');
  const divisions = Object.keys(DIVISION_LABELS) as PresetDivision[];
  const list = OPTION_PRESETS.filter((pr) =>
    (division === 'all' || pr.division === division) &&
    (!q.trim() || (pr.label + ' ' + pr.choices.map((c) => c.label).join(' ')).toLowerCase().includes(q.toLowerCase()))
  );
  const fmtD = (n: number) => n === 0 ? 'incl.' : (n > 0 ? '+' : '−') + '$' + Math.abs(n).toLocaleString();

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-xl h-[88vh] sm:h-[80vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#121212] border-t sm:border border-white/10"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="p-5 pb-3">
          <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-4 sm:hidden" />
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[20px] font-bold">Option Presets</h2>
            <button onClick={onClose} className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5"><X size={20} className="text-white/60" /></button>
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search presets…"
            className="w-full min-h-[48px] px-4 rounded-xl bg-white/5 border border-white/10 text-[16px] placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/50 mb-3" />
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
            {(['all', ...divisions] as const).map((d) => (
              <button key={d} onClick={() => setDivision(d as any)}
                className="shrink-0 min-h-[38px] px-3.5 rounded-full text-[13px] font-semibold whitespace-nowrap active:scale-95"
                style={division === d
                  ? { background: 'rgba(201,168,76,0.18)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.4)' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {d === 'all' ? 'All' : DIVISION_LABELS[d as PresetDivision]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-2.5">
          {list.length === 0 && <p className="text-[15px] text-white/35 py-6 text-center">No presets match.</p>}
          {list.map((pr) => {
            const already = existing.includes(pr.label.toLowerCase());
            return (
              <div key={pr.division + pr.label} className="rounded-xl border border-white/8 bg-white/3 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[16px] font-bold">{pr.label}</p>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,168,76,0.12)', color: '#D4B965' }}>
                        {TYPE_META[pr.selection_type]?.label}
                      </span>
                      <span className="text-[11px] text-white/30">{DIVISION_LABELS[pr.division]}</span>
                    </div>
                    <p className="text-[13px] text-white/45 mt-1 leading-snug">
                      {pr.choices.map((c) => c.label + ' ' + fmtD(c.price_delta)).join(' · ')}
                    </p>
                  </div>
                  <button onClick={() => onAdd(pr)} disabled={already || busy !== null}
                    className="shrink-0 min-h-[44px] px-4 rounded-lg text-[14px] font-bold disabled:opacity-40 active:scale-95"
                    style={already
                      ? { background: 'rgba(53,208,127,0.12)', color: '#35d07f', border: '1px solid rgba(53,208,127,0.3)' }
                      : { background: 'rgba(201,168,76,0.15)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.4)' }}>
                    {busy === pr.label ? <Loader2 size={16} className="animate-spin" /> : already ? 'Added' : 'Add'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
