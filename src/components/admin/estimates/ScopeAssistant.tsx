'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Sparkles, Check, Loader2, AlertTriangle, Lightbulb, RotateCcw } from 'lucide-react';
import ScopeView from '@/components/estimates/ScopeView';
import { applyScopeOps, cleanScopeHtml, diffScope, scopeText, type ScopeOp } from '@/lib/scope-doc';

/**
 * The AI working on the scope that is already in the box.
 *
 *  - With an instruction ("take out the Sarah line", "put the plumbing fixtures in a table",
 *    "add a line that permits are by the owner"): it proposes the edit.
 *  - Without one ("Look it over"): it reads the scope and proposes fixes for anything that came
 *    in wrong, plus ideas it leaves to the contractor.
 *
 * It only sends back the parts it changes, never the whole document, so it is cheap. Nothing
 * changes until "Apply" is tapped, each change can be switched off, and the screen states
 * exactly which words and numbers the selected changes add or remove.
 */
type Change = { title: string; why: string; ops: ScopeOp[] };
type Idea = { title: string; why: string };
type Reply = { summary: string; changes: Change[]; suggestions: Idea[] };

export default function ScopeAssistant({ currentHtml, instruction, onApply, onClose }: {
  currentHtml: string; instruction: string; onApply: (html: string) => void; onClose: () => void;
}) {
  const [phase, setPhase] = useState<'working' | 'done' | 'error'>('working');
  const [reply, setReply] = useState<Reply | null>(null);
  const [on, setOn] = useState<boolean[]>([]);
  const [error, setError] = useState('');
  const abort = useRef<AbortController | null>(null);
  const started = useRef(false);

  const run = async () => {
    setPhase('working'); setError(''); setReply(null);
    const ctl = new AbortController(); abort.current = ctl;
    try {
      const r = await fetch('/api/admin/estimates/scope-organize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl.signal,
        body: JSON.stringify({ action: 'edit', html: currentHtml, instruction }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !Array.isArray(d.changes)) throw new Error(d.error || 'The AI is unavailable right now. Nothing was changed.');
      setReply({ summary: String(d.summary || ''), changes: d.changes, suggestions: Array.isArray(d.suggestions) ? d.suggestions : [] });
      setOn(d.changes.map(() => true));
      setPhase('done');
    } catch (e) {
      if (ctl.signal.aborted) return;
      setError(e instanceof Error && e.message && e.message !== 'Failed to fetch' ? e.message : 'Lost the connection. Nothing was changed.');
      setPhase('error');
    }
  };

  useEffect(() => {
    if (!started.current) { started.current = true; run(); }
    return () => abort.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const picked = useMemo(() => (reply ? reply.changes.filter((_, i) => on[i]) : []), [reply, on]);
  const next = useMemo(() => (picked.length ? cleanScopeHtml(applyScopeOps(currentHtml, picked.flatMap((c) => c.ops))) : ''), [picked, currentHtml]);
  const diff = useMemo(() => (next ? diffScope(scopeText(currentHtml), next) : null), [next, currentHtml]);
  const title = instruction ? 'AI edit' : 'AI look-over';

  return (
    <div className="fixed inset-0 z-[210] bg-[#0a0a0a] flex flex-col" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex items-center gap-3 px-4 border-b border-white/10" style={{ paddingTop: 'calc(12px + env(safe-area-inset-top))', paddingBottom: 12 }}>
        <span className="w-10 h-10 rounded-xl bg-[#C9A84C]/15 text-[#D4B965] flex items-center justify-center shrink-0"><Sparkles size={20} /></span>
        <h2 className="flex-1 text-[20px] font-bold text-white leading-tight">{title}</h2>
        <button type="button" onClick={() => { abort.current?.abort(); onClose(); }} aria-label="Close"
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white/80 active:bg-white/10"><X size={24} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-3xl mx-auto">
          {instruction && (
            <div className="mb-4 rounded-xl bg-white/5 border border-white/15 px-4 py-3">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-white/55">You asked</p>
              <p className="text-[17px] text-white leading-snug mt-0.5">{instruction}</p>
            </div>
          )}

          {phase === 'working' && (
            <div className="flex items-center gap-3 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 px-4 py-3.5">
              <Loader2 size={22} className="animate-spin text-[#D4B965] shrink-0" />
              <p className="text-[17px] font-semibold text-white">{instruction ? 'Working out the change…' : 'Reading the scope…'}</p>
            </div>
          )}

          {phase === 'error' && (
            <div className="rounded-xl bg-red-500/12 border border-red-500/40 px-4 py-4 flex items-start gap-3">
              <AlertTriangle size={22} className="text-red-300 shrink-0 mt-0.5" />
              <p className="text-[17px] text-red-100 leading-snug">{error}</p>
            </div>
          )}

          {phase === 'done' && reply && (
            <div className="space-y-5">
              {reply.summary && <p className="text-[17px] text-white/90 leading-relaxed">{reply.summary}</p>}

              {reply.changes.length === 0 && reply.suggestions.length === 0 && (
                <div className="flex items-start gap-3 rounded-xl bg-[#35d07f]/12 border border-[#35d07f]/45 px-4 py-3">
                  <Check size={21} className="text-[#5fe0a0] shrink-0 mt-0.5" />
                  <p className="text-[17px] text-white leading-snug">{instruction ? 'There was nothing to change for that.' : 'It reads clean. Nothing to fix.'}</p>
                </div>
              )}

              {reply.changes.length > 0 && (
                <div>
                  <p className="text-[14px] font-bold uppercase tracking-wide text-[#E5C76B] mb-2">{reply.changes.length === 1 ? 'The change' : `${reply.changes.length} changes — switch off any you don’t want`}</p>
                  <div className="space-y-2.5">
                    {reply.changes.map((c, i) => (
                      <button key={i} type="button" role="switch" aria-checked={!!on[i]}
                        onClick={() => setOn((v) => v.map((x, k) => (k === i ? !x : x)))}
                        className={`w-full text-left rounded-xl border px-4 py-3 flex items-start gap-3 ${on[i] ? 'border-[#C9A84C]/60 bg-[#C9A84C]/10' : 'border-white/15 bg-white/[0.03]'}`}>
                        <span className={`shrink-0 mt-0.5 w-7 h-7 rounded-md border-2 flex items-center justify-center ${on[i] ? 'bg-[#C9A84C] border-[#C9A84C] text-black' : 'border-white/40 text-transparent'}`}><Check size={18} /></span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[17px] font-semibold text-white leading-snug">{c.title}</span>
                          {c.why && <span className="block text-[16px] text-white/75 leading-snug mt-0.5">{c.why}</span>}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {reply.suggestions.length > 0 && (
                <div>
                  <p className="text-[14px] font-bold uppercase tracking-wide text-white/60 mb-2">For you to decide</p>
                  <ul className="space-y-2.5">
                    {reply.suggestions.map((s, i) => (
                      <li key={i} className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 flex items-start gap-3">
                        <Lightbulb size={20} className="text-[#D4B965] shrink-0 mt-0.5" />
                        <span><span className="block text-[17px] font-semibold text-white leading-snug">{s.title}</span>
                          {s.why && <span className="block text-[16px] text-white/75 leading-snug mt-0.5">{s.why}</span>}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {diff && (diff.removed.length > 0 || diff.added.length > 0) && (
                <div className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3">
                  <p className="text-[14px] font-bold uppercase tracking-wide text-white/60">Exactly what the selected changes do to the wording</p>
                  {diff.removed.length > 0 && <p className="text-[16px] text-white mt-2 leading-snug"><strong className="text-red-300">Taken out:</strong> {diff.removed.join(', ')}</p>}
                  {diff.added.length > 0 && <p className="text-[16px] text-white mt-2 leading-snug"><strong className="text-[#5fe0a0]">Put in:</strong> {diff.added.join(', ')}</p>}
                </div>
              )}
              {diff && diff.removed.length === 0 && diff.added.length === 0 && picked.length > 0 && (
                <p className="text-[16px] text-white/75">The selected changes rearrange the scope without adding or removing any words or numbers.</p>
              )}

              {next && (
                <div>
                  <p className="text-[14px] font-bold uppercase tracking-wide text-white/60 mb-3">How it will look</p>
                  <ScopeView html={next} theme="dark" size={16} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 px-4 bg-[#0d0d0d]" style={{ paddingTop: 12, paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-2.5">
          {phase === 'working' && (
            <button type="button" onClick={() => { abort.current?.abort(); onClose(); }}
              className="flex-1 min-h-[56px] rounded-xl border border-white/25 text-white text-[17px] font-semibold active:bg-white/5">Stop</button>
          )}
          {phase === 'error' && (
            <>
              <button type="button" onClick={run} className="flex-1 min-h-[56px] rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold flex items-center justify-center gap-2"><RotateCcw size={19} /> Try again</button>
              <button type="button" onClick={onClose} className="min-h-[56px] px-5 rounded-xl border border-white/25 text-white text-[17px] font-semibold">Close</button>
            </>
          )}
          {phase === 'done' && (
            <>
              {picked.length > 0 && (
                <button type="button" onClick={() => onApply(next)}
                  className="flex-1 min-h-[56px] rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold flex items-center justify-center gap-2 active:scale-[0.99]">
                  <Check size={21} /> {picked.length === 1 ? 'Apply this change' : `Apply ${picked.length} changes`}
                </button>
              )}
              <button type="button" onClick={onClose}
                className={`min-h-[56px] px-5 rounded-xl text-[17px] font-semibold ${picked.length ? 'text-white/85 active:bg-white/5' : 'flex-1 bg-[#C9A84C] text-black font-bold'}`}>
                {picked.length ? 'Leave it as it is' : 'Close'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
