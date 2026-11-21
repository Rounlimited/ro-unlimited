'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Sparkles, Upload, FileText, Check, RotateCcw, Loader2, ClipboardPaste, AlertTriangle, Table2 } from 'lucide-react';
import ScopeView from '@/components/estimates/ScopeView';
import { cleanScopeHtml, looksLikeMarkdown, scopeStats, scopeText, type ScopeCheck } from '@/lib/scope-doc';
import { createClient as createBrowserSupabase } from '@/lib/supabase/client';

/**
 * Full-screen sheet that turns a messy scope into an organized one.
 *
 *  - "tidy":   reorganize what is already in the scope box.
 *  - "import": bring a big document in — paste it (a plain box, so a paste
 *              of any size goes in) or pick a Word file, PDF or photo.
 *
 * The result builds on screen as it is written. Nothing replaces the scope
 * until "Use this" is tapped.
 */
type Mode = 'tidy' | 'import';
type Phase = 'input' | 'working' | 'done' | 'error';

const MAX_INLINE = 3_000_000;    // above this the file goes to storage first, then is read from there
const MAX_FILE = 20_000_000;

const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(',')[1] || '');
  r.onerror = () => reject(new Error('read'));
  r.readAsDataURL(file);
});

export default function ScopeOrganizer({ mode, currentHtml, onUse, onClose }: {
  mode: Mode; currentHtml: string; onUse: (html: string) => void; onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>(mode === 'tidy' ? 'working' : 'input');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [sending, setSending] = useState(false);
  const [check, setCheck] = useState<ScopeCheck | null>(null);
  const [viaAi, setViaAi] = useState(false);
  const pastedHtml = useRef('');           // the rich version of what was pasted (keeps real tables)
  const abort = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const started = useRef(false);

  const stats = useMemo(() => scopeStats(result), [result]);
  const pastedHasTables = /<table/i.test(pastedHtml.current);
  const checks = (result.match(/CHECK:/g) || []).length;

  useEffect(() => {
    if (phase !== 'working') return;
    setSeconds(0);
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => () => abort.current?.abort(), []);

  const run = async (payload: Record<string, unknown>) => {
    setPhase('working'); setResult(''); setError(''); setCheck(null); setViaAi(!payload.direct);
    const ctl = new AbortController(); abort.current = ctl;
    try {
      const res = await fetch('/api/admin/estimates/scope-organize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctl.signal,
      });
      if (!res.ok || !res.body) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || (res.status === 413 ? 'That is too large to send. Try a smaller file.' : 'The organizer is unavailable right now.'));
      }
      if ((res.headers.get('content-type') || '').includes('application/json')) {
        const d = await res.json();
        if (d.error) throw new Error(d.error);
        setResult(cleanScopeHtml(d.html || '')); setPhase('done'); return;
      }
      const reader = res.body.getReader(); const dec = new TextDecoder();
      let acc = ''; let lastPaint = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        const now = Date.now();
        if (now - lastPaint > 350) { lastPaint = now; setResult(acc.split('\u0000')[0]); }
      }
      // The server ends a finished run with a DONE mark; without it the reply was cut off.
      const htmlOut = acc.split('\u0000')[0];
      try { const c = (acc.split('\u0000CHECK:')[1] || '').split('\u0000')[0].trim(); if (c) setCheck(JSON.parse(c)); } catch { /* no check came back */ }
      const err = (acc.split('\u0000ERROR:')[1] || '').split('\u0000')[0] || (acc.includes('\u0000DONE') ? '' : 'It stopped part way, so the end may be missing. Tap Try again.');
      const clean = cleanScopeHtml(htmlOut.replace(/^\s*```(?:html)?/i, '').replace(/```\s*$/, ''));
      setResult(clean);
      if (err && !scopeText(clean)) throw new Error(err.trim());
      if (err) setError(err.trim());
      if (!scopeText(clean)) throw new Error('Nothing came back. Your text is untouched. Try again.');
      setPhase('done');
    } catch (e) {
      if (ctl.signal.aborted) return;
      setError(e instanceof Error && e.message && e.message !== 'Failed to fetch' ? e.message : 'Lost the connection. Your text is untouched. Try again.');
      setPhase('error');
    }
  };

  // "Tidy up" starts working the moment the sheet opens.
  useEffect(() => {
    if (mode === 'tidy' && !started.current) { started.current = true; run({ html: currentHtml }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startImport = async (direct: boolean) => {
    const payload: Record<string, unknown> = { direct };
    if (file) {
      if (file.size > MAX_FILE) { setError('That file is over 20 MB. Send only the scope pages, or paste the text instead.'); setPhase('error'); return; }
      try {
        if (file.size > MAX_INLINE) {
          // Too big to travel inside the request: put it in storage, then tell the server where it is.
          setPhase('working'); setResult(''); setError(''); setSending(true);
          const u = await fetch('/api/admin/estimates/scope-organize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'upload_url', name: file.name }) });
          const d = await u.json().catch(() => ({}));
          if (!u.ok || !d.path) throw new Error(d.error || 'upload');
          const up = await createBrowserSupabase().storage.from(d.bucket).uploadToSignedUrl(d.path, d.token, file, { contentType: file.type || 'application/octet-stream' });
          if (up.error) throw new Error('upload');
          payload.file = { name: file.name, mime: file.type, stored: d.path };
        } else {
          payload.file = { name: file.name, mime: file.type, data: await toBase64(file) };
        }
      } catch (e) {
        setSending(false);
        setError(e instanceof Error && e.message && e.message !== 'upload' && e.message !== 'read' ? e.message : 'Could not send that file from this phone. Check the connection and try again.');
        setPhase('error'); return;
      }
      setSending(false);
    } else {
      payload.text = text;
      if (pastedHtml.current) payload.html = pastedHtml.current;
    }
    run(payload);
  };

  const retry = () => (mode === 'tidy' ? run({ html: currentHtml }) : setPhase('input'));
  const canGo = !!file || text.trim().length > 0;
  const isOffice = !!file && /\.(docx|txt|md|csv|html?)$/i.test(file.name);
  // Already structured (Markdown, a Word file, pasted tables): it can go in exactly as written, with no AI and no charge.
  const structured = file ? /\.(docx|md|html?)$/i.test(file.name) : (pastedHasTables || looksLikeMarkdown(text));
  const title = mode === 'tidy' ? 'Tidy up the scope' : 'Bring in a document';

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

          {phase === 'input' && (
            <div className="space-y-5">
              <p className="text-[17px] text-white/80 leading-relaxed">
                Paste the whole scope here, or pick the file. Any size. It gets sorted into sections and tables, and you check it before it goes on the estimate.
              </p>

              <div>
                <label htmlFor="scope-paste" className="flex items-center gap-2 text-[17px] font-semibold text-white mb-2"><ClipboardPaste size={19} /> Paste it</label>
                <textarea id="scope-paste" value={text} disabled={!!file}
                  onChange={(e) => { setText(e.target.value); if (!e.target.value) pastedHtml.current = ''; }}
                  onPaste={(e) => { const h = e.clipboardData?.getData('text/html') || ''; pastedHtml.current = /<(table|h[1-6]|li)\b/i.test(h) ? h : ''; }}
                  placeholder="Press and hold here, then tap Paste"
                  className="w-full min-h-[190px] rounded-xl bg-[#141414] border border-white/20 px-4 py-3.5 text-[17px] leading-relaxed text-white placeholder:text-white/45 focus:outline-none focus:border-[#C9A84C] disabled:opacity-40" />
                {text.length > 0 && (
                  <p className="mt-1.5 text-[15px] text-white/65">
                    {text.split(/\s+/).filter(Boolean).length.toLocaleString()} words in.
                    {pastedHasTables ? ' The tables came through with it.' : looksLikeMarkdown(text) ? ' This is already laid out (Markdown), so it can go in exactly, free.' : ''}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 text-[15px] text-white/50"><span className="h-px flex-1 bg-white/15" />or<span className="h-px flex-1 bg-white/15" /></div>

              <div>
                <input ref={fileInput} type="file" className="hidden"
                  accept=".docx,.pdf,.txt,.md,.csv,.html,.htm,image/jpeg,image/png,image/webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => { const f = e.target.files?.[0] || null; setFile(f); e.target.value = ''; }} />
                {file ? (
                  <div className="flex items-center gap-3 rounded-xl border border-[#C9A84C]/50 bg-[#C9A84C]/10 px-4 py-3">
                    <FileText size={22} className="text-[#D4B965] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[17px] font-semibold text-white truncate">{file.name}</p>
                      <p className="text-[15px] text-white/65">{(file.size / 1024 / 1024).toFixed(file.size > 1_000_000 ? 1 : 2)} MB{file.size > MAX_FILE ? ' — too big, 20 MB is the limit' : ''}</p>
                    </div>
                    <button type="button" onClick={() => setFile(null)} aria-label="Remove file" className="w-12 h-12 rounded-xl flex items-center justify-center text-white/80 active:bg-white/10"><X size={22} /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInput.current?.click()}
                    className="w-full min-h-[64px] rounded-xl border-2 border-dashed border-white/25 text-white flex items-center justify-center gap-3 text-[17px] font-semibold active:bg-white/5">
                    <Upload size={21} /> Pick a file
                  </button>
                )}
                <p className="mt-2 text-[15px] text-white/60">Word (.docx), PDF, a photo of the page, or a text file. Up to 20 MB.</p>
              </div>
            </div>
          )}

          {phase === 'working' && (
            <div>
              <div className="flex items-center gap-3 mb-5 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 px-4 py-3.5">
                <Loader2 size={22} className="animate-spin text-[#D4B965] shrink-0" />
                <div className="flex-1">
                  <p className="text-[17px] font-semibold text-white">
                    {sending ? 'Sending the file…' : result ? 'Building the sections and tables…' : seconds < 6 ? 'Reading it…' : 'Working out the sections and tables…'}
                  </p>
                  <p className="text-[15px] text-white/65">
                    {result ? `${stats.sections} section${stats.sections === 1 ? '' : 's'}, ${stats.tables} table${stats.tables === 1 ? '' : 's'} so far` : 'A long scope can take a minute or two. Keep this screen open.'}
                  </p>
                </div>
              </div>
              {result && <ScopeView html={result} theme="dark" size={16} />}
            </div>
          )}

          {phase === 'done' && (
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#35d07f]/15 text-[#5fe0a0] text-[15px] font-semibold"><Check size={16} /> Ready to check</span>
                {stats.sections > 0 && <span className="px-3 py-1.5 rounded-full bg-white/8 text-white/85 text-[15px] font-medium">{stats.sections} sections</span>}
                {stats.tables > 0 && <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 text-white/85 text-[15px] font-medium"><Table2 size={15} /> {stats.tables} tables</span>}
                <span className="px-3 py-1.5 rounded-full bg-white/8 text-white/85 text-[15px] font-medium">{stats.words.toLocaleString()} words</span>
              </div>
              {(checks > 0 || error) && (
                <div className="flex items-start gap-3 mb-4 rounded-xl bg-[#f0a04b]/15 border border-[#f0a04b]/50 px-4 py-3">
                  <AlertTriangle size={21} className="text-[#f0a04b] shrink-0 mt-0.5" />
                  <p className="text-[16px] text-white leading-snug">
                    {error || `${checks} spot${checks === 1 ? '' : 's'} marked CHECK: values it could not place in a table for certain. They are kept as written under that table.`}
                  </p>
                </div>
              )}
              {viaAi && check && check.available && check.ok && (
                <div className="flex items-start gap-3 mb-4 rounded-xl bg-[#35d07f]/12 border border-[#35d07f]/45 px-4 py-3">
                  <Check size={21} className="text-[#5fe0a0] shrink-0 mt-0.5" />
                  <p className="text-[16px] text-white leading-snug"><strong>Checked against your original.</strong> All {check.numbers.toLocaleString()} numbers and {check.words.toLocaleString()} words are here, and nothing was added.</p>
                </div>
              )}
              {viaAi && check && check.available && !check.ok && (
                <div className="mb-4 rounded-xl bg-red-500/12 border border-red-500/50 px-4 py-3">
                  <p className="flex items-center gap-2 text-[17px] font-bold text-white"><AlertTriangle size={21} className="text-red-300 shrink-0" /> The check found differences from your original</p>
                  {check.missingNumbers.length > 0 && <p className="text-[16px] text-white mt-2 leading-snug"><strong>Numbers in your original that are not in this:</strong> {check.missingNumbers.join(', ')}</p>}
                  {check.addedNumbers.length > 0 && <p className="text-[16px] text-white mt-2 leading-snug"><strong>Numbers in this that were not in your original:</strong> {check.addedNumbers.join(', ')}</p>}
                  {check.missingWords.length > 0 && <p className="text-[16px] text-white mt-2 leading-snug"><strong>Words in your original that are not in this:</strong> {check.missingWords.join(', ')}</p>}
                  <p className="text-[15px] text-white/75 mt-2 leading-snug">Look for these before you use it. Page headers and footers from a file are left out on purpose and can show up here.</p>
                </div>
              )}
              {viaAi && (!check || !check.available) && (
                <div className="flex items-start gap-3 mb-4 rounded-xl bg-[#f0a04b]/15 border border-[#f0a04b]/50 px-4 py-3">
                  <AlertTriangle size={21} className="text-[#f0a04b] shrink-0 mt-0.5" />
                  <p className="text-[16px] text-white leading-snug"><strong>This one could not be checked automatically</strong> (a photo or a scanned file has no text to compare). Read it against the original.</p>
                </div>
              )}
              {!viaAi && (
                <div className="flex items-start gap-3 mb-4 rounded-xl bg-[#35d07f]/12 border border-[#35d07f]/45 px-4 py-3">
                  <Check size={21} className="text-[#5fe0a0] shrink-0 mt-0.5" />
                  <p className="text-[16px] text-white leading-snug"><strong>Put in exactly as written.</strong> No AI was used, so nothing was reworded and there is no charge.</p>
                </div>
              )}
              {viaAi && <p className="text-[16px] text-white/70 mb-5 leading-relaxed">The check confirms nothing was lost or added. It cannot tell if a value sits in the wrong column, so look over the tables.</p>}
              <ScopeView html={result} theme="dark" size={16} />
            </div>
          )}

          {phase === 'error' && (
            <div className="rounded-xl bg-red-500/12 border border-red-500/40 px-4 py-4 flex items-start gap-3">
              <AlertTriangle size={22} className="text-red-300 shrink-0 mt-0.5" />
              <p className="text-[17px] text-red-100 leading-snug">{error}</p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 px-4 bg-[#0d0d0d]" style={{ paddingTop: 12, paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-2.5">
          {phase === 'input' && (
            <>
              {structured && (
                <button type="button" disabled={!canGo} onClick={() => startImport(true)}
                  className="flex-1 min-h-[56px] rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold flex items-center justify-center gap-2 disabled:opacity-35 active:scale-[0.99]">
                  <Check size={21} /> Put it in exactly (free)
                </button>
              )}
              <button type="button" disabled={!canGo} onClick={() => startImport(false)}
                className={structured
                  ? 'min-h-[56px] px-5 rounded-xl border border-white/25 text-white text-[17px] font-semibold flex items-center justify-center gap-2 disabled:opacity-35 active:bg-white/5'
                  : 'flex-1 min-h-[56px] rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold flex items-center justify-center gap-2 disabled:opacity-35 active:scale-[0.99]'}>
                <Sparkles size={20} /> {structured ? 'Organize with AI (uses credit)' : 'Organize it for me'}
              </button>
              {!structured && isOffice && (
                <button type="button" onClick={() => startImport(true)}
                  className="min-h-[56px] px-5 rounded-xl border border-white/25 text-white text-[17px] font-semibold active:bg-white/5">
                  Put it in as it is
                </button>
              )}
            </>
          )}
          {phase === 'working' && (
            <button type="button" onClick={() => { abort.current?.abort(); mode === 'tidy' ? onClose() : setPhase('input'); }}
              className="flex-1 min-h-[56px] rounded-xl border border-white/25 text-white text-[17px] font-semibold active:bg-white/5">Stop</button>
          )}
          {phase === 'done' && (
            <>
              <button type="button" onClick={() => onUse(result)}
                className="flex-1 min-h-[56px] rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold flex items-center justify-center gap-2 active:scale-[0.99]">
                <Check size={21} /> Use this
              </button>
              <button type="button" onClick={retry}
                className="min-h-[56px] px-5 rounded-xl border border-white/25 text-white text-[17px] font-semibold flex items-center justify-center gap-2 active:bg-white/5">
                <RotateCcw size={18} /> Try again
              </button>
              <button type="button" onClick={onClose}
                className="min-h-[56px] px-5 rounded-xl text-white/85 text-[17px] font-semibold active:bg-white/5">Keep mine</button>
            </>
          )}
          {phase === 'error' && (
            <>
              <button type="button" onClick={retry}
                className="flex-1 min-h-[56px] rounded-xl bg-[#C9A84C] text-black text-[18px] font-bold flex items-center justify-center gap-2"><RotateCcw size={19} /> Try again</button>
              <button type="button" onClick={onClose} className="min-h-[56px] px-5 rounded-xl border border-white/25 text-white text-[17px] font-semibold">Close</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
