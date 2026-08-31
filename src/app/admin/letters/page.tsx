'use client';

import { useCallback, useEffect, useState } from 'react';
import AppShell from '@/components/admin/AppShell';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Loader2, FileText, Sparkles, Download, Trash2, Save, ChevronLeft, ExternalLink, HelpCircle,
} from 'lucide-react';
import { LETTER_TYPES, letterType } from '@/lib/letters';
import { startTour } from '@/components/admin/GuidedTour';

/**
 * "Just need it to draw up whatever I ask, with company letterhead, looks
 * official." Type it the way you'd say it; it comes back as a letter and
 * prints on RO letterhead with the logo and license list.
 */

interface Letter {
  id: string;
  doc_type: string;
  title: string;
  subject: string | null;
  recipient_name: string | null;
  recipient_company: string | null;
  recipient_address: string | null;
  body: string;
  closing: string | null;
  signer_name: string | null;
  signer_title: string | null;
  created_at: string;
}

const shortDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const inputCls = 'w-full min-h-[52px] px-4 rounded-xl bg-white/5 border border-white/10 text-[17px] placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/50';
const labelCls = 'block text-[14px] font-semibold text-white/50 uppercase tracking-wide mb-1.5';

export default function LettersPage() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [docType, setDocType] = useState('letter');
  const [recipient, setRecipient] = useState('');
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Letter | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/letters');
      const d = await res.json();
      if (Array.isArray(d.letters)) setLetters(d.letters);
    } catch { /* keep last */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const write = async () => {
    if (!prompt.trim()) { setError('Say what you need written'); return; }
    setWriting(true); setError(null);
    try {
      const res = await fetch('/api/admin/letters', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), doc_type: docType, recipient_name: recipient.trim() || undefined }),
      });
      const d = await res.json();
      if (d.error) setError(d.error);
      else { setPrompt(''); setRecipient(''); await load(); setOpen(d.letter); }
    } catch { setError('Could not reach the writer'); }
    setWriting(false);
  };

  if (open) return <LetterEditor letter={open} onBack={() => { setOpen(null); load(); }} />;

  return (
    <AppShell>
      <AdminHeader title="Letters & Notices" />
      <div className="px-4 sm:px-6 pb-28 max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-3 mb-4">
          <p className="text-[16px] text-white/50 leading-relaxed">
            Tell it what you need in your own words. It writes the letter and prints it on
            company letterhead — logo, contact details and your license list.
          </p>
          <button onClick={() => startTour('tour-letters')}
            className="shrink-0 w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-95"
            title="Show me how">
            <HelpCircle size={19} className="text-white/50" />
          </button>
        </div>

        {/* ── Ask ── */}
        <div className="rounded-2xl border border-white/8 bg-[#111] p-5 mb-5">
          <label className={labelCls}>What do you need written?</label>
          <textarea data-tour="letter-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4}
            placeholder={'Letter to Greenville Water asking them to release the trench on the Miller job so we can backfill'}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[17px] leading-relaxed placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/50 mb-4" />

          <label className={labelCls}>Kind of document</label>
          <div className="flex gap-1.5 flex-wrap mb-4" data-tour="letter-types">
            {LETTER_TYPES.map((t) => (
              <button key={t.id} onClick={() => setDocType(t.id)}
                className="min-h-[46px] px-3.5 rounded-full text-[14px] font-semibold active:scale-95"
                style={docType === t.id
                  ? { background: 'rgba(201,168,76,0.18)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.45)' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-[13px] text-white/30 -mt-2 mb-4">{letterType(docType).guidance}</p>

          <label className={labelCls}>Addressed to (optional)</label>
          <input value={recipient} onChange={(e) => setRecipient(e.target.value)}
            placeholder="Mr. Dale Miller / Greenville Water" className={inputCls + ' mb-4'} />

          {error && <p className="text-[15px] text-[#f87171] mb-3">{error}</p>}

          <button data-tour="letter-write" onClick={write} disabled={writing}
            className="w-full min-h-[56px] rounded-xl text-[17px] font-bold text-black disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.99]"
            style={{ background: 'linear-gradient(145deg, #C9A84C, #a8893d)', boxShadow: '0 4px 18px rgba(201,168,76,0.35)' }}>
            {writing ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={18} />}
            {writing ? 'Writing it…' : 'Write It Up'}
          </button>
          <p className="text-[13px] text-white/30 mt-2 text-center">
            You can change every word before it prints. Nothing is sent anywhere.
          </p>
        </div>

        {/* ── History ── */}
        {loading ? (
          <div className="flex items-center gap-3 text-white/40 py-6">
            <Loader2 size={20} className="animate-spin" /> Loading…
          </div>
        ) : letters.length === 0 ? (
          <p className="text-[15px] text-white/35 px-1">Nothing written yet.</p>
        ) : (
          <div className="space-y-2">
            {letters.map((l) => (
              <button key={l.id} onClick={() => setOpen(l)}
                className="w-full text-left rounded-2xl border border-white/8 bg-[#111] p-4 active:scale-[0.99] transition-transform">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[17px] font-bold truncate">{l.title}</p>
                    <p className="text-[14px] text-white/40 truncate mt-0.5">
                      {letterType(l.doc_type).label}
                      {l.recipient_name ? ' · ' + l.recipient_name : ''}
                    </p>
                  </div>
                  <p className="text-[13px] text-white/30 shrink-0">{shortDate(l.created_at)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* ── Edit & print ─────────────────────────────────────────────── */
function LetterEditor({ letter, onBack }: { letter: Letter; onBack: () => void }) {
  const [f, setF] = useState(letter);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: keyof Letter, v: string) => { setF({ ...f, [k]: v } as Letter); setSaved(false); };

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/letters/' + letter.id, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: f.title, subject: f.subject, body: f.body, closing: f.closing,
          recipient_name: f.recipient_name, recipient_company: f.recipient_company,
          recipient_address: f.recipient_address, signer_name: f.signer_name, signer_title: f.signer_title,
        }),
      });
      setSaved(true);
    } catch { /* leave as-is */ }
    setSaving(false);
  };

  const openPdf = async (download: boolean) => {
    await save();
    window.open('/api/admin/letters/' + letter.id + '/pdf' + (download ? '?download=1' : ''), '_blank');
  };

  const remove = async () => {
    if (!confirm('Delete this letter?')) return;
    await fetch('/api/admin/letters/' + letter.id, { method: 'DELETE' }).catch(() => {});
    onBack();
  };

  return (
    <AppShell>
      <AdminHeader title="Letter" />
      <div className="px-4 sm:px-6 pb-28 max-w-3xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[15px] font-semibold mb-4 min-h-[44px]"
          style={{ color: '#D4B965' }}>
          <ChevronLeft size={18} /> All letters
        </button>

        <div className="rounded-2xl border border-white/8 bg-[#111] p-5 space-y-4">
          <div>
            <label className={labelCls}>Name (yours, not printed)</label>
            <input value={f.title} onChange={(e) => set('title', e.target.value)} className={inputCls} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Addressed to</label>
              <input value={f.recipient_name || ''} onChange={(e) => set('recipient_name', e.target.value)}
                placeholder="Mr. Dale Miller" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Company</label>
              <input value={f.recipient_company || ''} onChange={(e) => set('recipient_company', e.target.value)}
                placeholder="Greenville Water" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Their address</label>
            <textarea value={f.recipient_address || ''} onChange={(e) => set('recipient_address', e.target.value)}
              rows={2} placeholder={'407 West Broad Street\nGreenville, SC 29601'}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[17px] placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/50" />
          </div>

          <div>
            <label className={labelCls}>RE: subject line</label>
            <input value={f.subject || ''} onChange={(e) => set('subject', e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>The letter</label>
            <textarea value={f.body} onChange={(e) => set('body', e.target.value)} rows={16}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[17px] leading-relaxed focus:outline-none focus:border-[#C9A84C]/50" />
            <p className="text-[13px] text-white/30 mt-1.5">
              Anything in [brackets] is a blank to fill in. Change any word you like.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Signed by</label>
              <input value={f.signer_name || ''} onChange={(e) => set('signer_name', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Title</label>
              <input value={f.signer_title || ''} onChange={(e) => set('signer_title', e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <button onClick={save} disabled={saving}
            className="min-h-[56px] rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}>
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={17} />} {saved ? 'Saved' : 'Save'}
          </button>
          <button data-tour="letter-pdf" onClick={() => openPdf(false)}
            className="min-h-[56px] rounded-xl text-[16px] font-bold text-black flex items-center justify-center gap-2 active:scale-[0.99]"
            style={{ background: 'linear-gradient(145deg, #C9A84C, #a8893d)' }}>
            <ExternalLink size={17} /> View on Letterhead
          </button>
        </div>

        <button onClick={() => openPdf(true)}
          className="w-full min-h-[52px] mt-2.5 rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 active:scale-[0.99]"
          style={{ background: 'rgba(201,168,76,0.12)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.35)' }}>
          <Download size={17} /> Download PDF
        </button>

        <button onClick={remove}
          className="w-full min-h-[48px] mt-2 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2 text-white/35 active:scale-[0.99]">
          <Trash2 size={15} /> Delete
        </button>
      </div>
    </AppShell>
  );
}
