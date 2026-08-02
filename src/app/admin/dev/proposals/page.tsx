'use client';

// Dev Proposals — NexaVision-only workspace (super_admin).
// Draft interactive proposals, preview, publish, copy share link, read responses.

import { useCallback, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import ProposalRenderer from '@/components/proposal/ProposalRenderer';
import { starterContent } from '@/lib/proposals/starter';
import type { DevProposal } from '@/lib/proposals/types';

function sb() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-zinc-200 text-zinc-700',
  published: 'bg-blue-100 text-blue-700',
  viewed: 'bg-amber-100 text-amber-700',
  responded: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
};

export default function DevProposalsPage() {
  const [role, setRole] = useState<string | null>(null);
  const [list, setList] = useState<DevProposal[]>([]);
  const [sel, setSel] = useState<DevProposal | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [title, setTitle] = useState('');
  const [jsonErr, setJsonErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'edit' | 'preview' | 'responses'>('edit');
  const [toast, setToast] = useState('');

  useEffect(() => {
    sb().auth.getUser().then(({ data }) => {
      const r = (data.user?.user_metadata as any)?.role || 'admin';
      setRole(r);
    });
  }, []);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/dev-proposals');
    if (res.ok) setList((await res.json()).proposals);
  }, []);

  useEffect(() => { if (role === 'super_admin') load(); }, [role, load]);

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  async function createNew() {
    setBusy(true);
    const res = await fetch('/api/admin/dev-proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New upgrade proposal', content: starterContent() }),
    });
    setBusy(false);
    if (res.ok) {
      const { proposal } = await res.json();
      await load();
      openProposal(proposal);
    }
  }

  function openProposal(p: DevProposal) {
    setSel(p);
    setTitle(p.title);
    setJsonText(JSON.stringify(p.content, null, 2));
    setJsonErr('');
    setTab('edit');
  }

  function parsedContent(): unknown | null {
    try {
      const c = JSON.parse(jsonText);
      setJsonErr('');
      return c;
    } catch (e) {
      setJsonErr(e instanceof Error ? e.message : 'Invalid JSON');
      return null;
    }
  }

  async function save(action?: 'publish' | 'unpublish') {
    if (!sel) return;
    const content = parsedContent();
    if (!content) return;
    setBusy(true);
    const res = await fetch(`/api/admin/dev-proposals/${sel.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, ...(action ? { action } : {}) }),
    });
    setBusy(false);
    if (res.ok) {
      const { proposal } = await res.json();
      setSel(proposal);
      await load();
      flash(action === 'publish' ? 'Published — link is live' : 'Saved');
    } else {
      flash('Save failed');
    }
  }

  async function remove() {
    if (!sel || !confirm(`Delete "${sel.title}"? This kills the share link too.`)) return;
    await fetch(`/api/admin/dev-proposals/${sel.id}`, { method: 'DELETE' });
    setSel(null);
    await load();
  }

  function copyLink() {
    if (!sel?.share_token) return;
    navigator.clipboard.writeText(`${window.location.origin}/proposal/${sel.share_token}`);
    flash('Link copied');
  }

  if (role === null) return <div className="p-8 text-sm text-zinc-500">Loading…</div>;
  if (role !== 'super_admin') {
    return (
      <div className="p-8">
        <p className="text-sm text-zinc-500">This area is restricted to the NexaVision dev account.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-zinc-50 pb-24">
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-zinc-900">Dev Proposals</h1>
          <button onClick={createNew} disabled={busy}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            + New proposal
          </button>
        </div>
        <p className="text-xs text-zinc-500 mb-5">
          NexaVision workspace — interactive share-link documents. Not visible to other roles.
        </p>

        {!sel && (
          <div className="space-y-2">
            {list.length === 0 && (
              <p className="text-sm text-zinc-400 border border-dashed rounded-xl p-8 text-center">
                Nothing here yet. Create the first proposal — it seeds with the RO infrastructure plan.
              </p>
            )}
            {list.map((p) => (
              <button key={p.id} onClick={() => openProposal(p)}
                className="w-full rounded-xl border bg-white p-4 text-left hover:border-zinc-400 transition">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-zinc-900 truncate">{p.title}</span>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[p.status] || ''}`}>
                    {p.status}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {p.responses?.length || 0} response{(p.responses?.length || 0) === 1 ? '' : 's'}
                  {' · '}updated {new Date(p.updated_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        )}

        {sel && (
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button onClick={() => { setSel(null); load(); }}
                className="rounded-lg border bg-white px-3 py-1.5 text-sm">← All proposals</button>
              <div className="flex rounded-lg border bg-white p-0.5 text-sm">
                {(['edit', 'preview', 'responses'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-3 py-1 rounded-md capitalize ${tab === t ? 'bg-zinc-900 text-white' : 'text-zinc-600'}`}>
                    {t}{t === 'responses' && sel.responses?.length ? ` (${sel.responses.length})` : ''}
                  </button>
                ))}
              </div>
            </div>

            {tab === 'edit' && (
              <div className="space-y-3">
                <input value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full rounded-lg border bg-white px-3 py-2 font-semibold" placeholder="Proposal title" />
                <textarea value={jsonText} onChange={e => setJsonText(e.target.value)}
                  spellCheck={false} rows={24}
                  className="w-full rounded-lg border bg-zinc-900 px-3 py-3 font-mono text-[12.5px] leading-relaxed text-emerald-200" />
                {jsonErr && <p className="text-sm text-red-600">JSON error: {jsonErr}</p>}
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => save()} disabled={busy}
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save draft</button>
                  <button onClick={() => save('publish')} disabled={busy}
                    className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    {sel.share_token ? 'Save & republish' : 'Publish → get link'}
                  </button>
                  {sel.share_token && (
                    <>
                      <button onClick={copyLink} className="rounded-lg border bg-white px-4 py-2 text-sm">Copy share link</button>
                      <a href={`/proposal/${sel.share_token}`} target="_blank" rel="noreferrer"
                        className="rounded-lg border bg-white px-4 py-2 text-sm">Open live ↗</a>
                    </>
                  )}
                  <button onClick={remove} className="ml-auto rounded-lg border border-red-200 bg-white px-4 py-2 text-sm text-red-600">Delete</button>
                </div>
              </div>
            )}

            {tab === 'preview' && (
              <div className="rounded-xl overflow-hidden border shadow-lg">
                {(() => {
                  try {
                    const c = JSON.parse(jsonText);
                    return <ProposalRenderer content={c} />;
                  } catch {
                    return <p className="p-6 text-sm text-red-600 bg-white">Fix the JSON to see the preview.</p>;
                  }
                })()}
              </div>
            )}

            {tab === 'responses' && (
              <div className="space-y-3">
                {(!sel.responses || sel.responses.length === 0) && (
                  <p className="text-sm text-zinc-400 border border-dashed rounded-xl p-8 text-center">No responses yet.</p>
                )}
                {(sel.responses || []).slice().reverse().map((r, i) => (
                  <div key={i} className="rounded-xl border bg-white p-4 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        r.type === 'approval' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-600'}`}>
                        {r.type}
                      </span>
                      <span className="text-xs text-zinc-400">{new Date(r.at).toLocaleString()}</span>
                    </div>
                    {r.comment && <p className="text-zinc-800 whitespace-pre-wrap">{r.comment}</p>}
                    {r.answers && Object.entries(r.answers).map(([k, v]) => (
                      <p key={k} className="text-zinc-700"><span className="font-semibold">{k}:</span> {v}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
