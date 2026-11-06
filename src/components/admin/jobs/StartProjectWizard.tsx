'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Loader2, Search, UserPlus, FileText, Sparkles, Check, ChevronLeft, Copy, Mail, MessageSquare, CalendarDays, ShieldCheck, Camera, HardHat, ExternalLink, Plus, Trash2 } from 'lucide-react';

/**
 * Start a Project Page — from any point in a job's life.
 *
 *  0. Is it already in the app?  → pick the estimate, mark it a yes, done.
 *     Or start fresh:
 *  1. Who's it for   (search existing customers, or add one — email = portal sign-in)
 *  2. The job        (name, address, type, contract amount)
 *  3. Where is it now (not started / underway / finished + each phase's %)
 *  4. What they see  (the Job Room switches + how often they get reports)
 *  → Done: send them the Project Page, then jump to the Job Room panels to
 *    add what's coming up, permits, and a first update.
 * JR-sized: 17px text, 52px targets, words over icons.
 */
type Customer = { id: string; first_name: string | null; last_name: string | null; company_name: string | null; email: string | null; phone: string | null };
type Est = { id: string; estimate_number: string; project_name: string; status: string; total: number; signed_at: string | null; customer: { id: string; first_name: string; last_name: string; company_name: string | null } | null };
type Phase = { phase: string; percent: number };
type Created = { id: string; number: string; name: string; link: string | null; customerId: string | null; customerName: string; email: string | null; phone: string | null };

const DIVISIONS: [string, string][] = [['commercial', 'Commercial'], ['grading', 'Site work / grading'], ['utilities', 'Utilities'], ['septic', 'Septic'], ['residential', 'Residential']];
const SUGGESTED: Record<string, string[]> = {
  commercial: ['Site work', 'Foundation', 'Structure', 'Dry-in', 'Interior', 'Final & punch list'],
  grading: ['Clearing', 'Mass grading', 'Building pad', 'Stormwater', 'Final grade & stabilize'],
  utilities: ['Locates & tap', 'Water line', 'Sewer line', 'Backfill & restore'],
  septic: ['Permit & layout', 'Tank set', 'Drain field', 'Inspection & backfill'],
  residential: ['Foundation', 'Framing', 'Dry-in', 'Rough-ins', 'Finishes'],
  '': ['Start-up', 'Main work', 'Finish & clean-up'],
};
const PCTS = [0, 25, 50, 75, 100];
const custName = (c: { first_name?: string | null; last_name?: string | null; company_name?: string | null } | null) =>
  !c ? '' : ([c.first_name, c.last_name].map((x) => String(x || '').trim()).filter(Boolean).join(' ') || String(c.company_name || '').trim() || 'Customer');
const money = (n: number) => '$' + Math.round(n || 0).toLocaleString('en-US');

const gold = '#C9A84C';
const inputCls = 'w-full min-h-[52px] px-4 rounded-xl bg-white/5 border border-white/10 text-[17px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#C9A84C]/60';
const labelCls = 'block text-[15px] font-semibold text-white/60 mb-1.5';
const chip = (on: boolean) => (on
  ? { background: 'rgba(201,168,76,0.2)', color: '#D4B965', border: '1px solid rgba(201,168,76,0.6)' }
  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' });

export default function StartProjectWizard({ onClose, onDone }: { onClose: () => void; onDone?: (jobId: string) => void }) {
  const [step, setStep] = useState<'start' | 'pick' | 'who' | 'job' | 'now' | 'see' | 'done'>('start');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // 0 — existing estimate
  const [ests, setEsts] = useState<Est[] | null>(null);
  const [estQ, setEstQ] = useState('');
  const [pickedEst, setPickedEst] = useState<Est | null>(null);

  // 1 — customer
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [cust, setCust] = useState<Customer | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [nName, setNName] = useState('');
  const [nEmail, setNEmail] = useState('');
  const [nPhone, setNPhone] = useState('');
  const [addEmail, setAddEmail] = useState('');

  // 2 — job
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [division, setDivision] = useState('');
  const [total, setTotal] = useState('');

  // 3 — where is it now
  const [stage, setStage] = useState<'not_started' | 'underway' | 'finished'>('underway');
  const [phases, setPhases] = useState<Phase[]>(SUGGESTED[''].map((p) => ({ phase: p, percent: 0 })));
  const [newPhase, setNewPhase] = useState('');
  const [phasesTouched, setPhasesTouched] = useState(false);

  // 4 — what they see
  const [show, setShow] = useState({ schedule: true, inspections: true, photos: true, assistant: true });
  const [cadence, setCadence] = useState('weekly');

  const [created, setCreated] = useState<Created | null>(null);
  const [sendNote, setSendNote] = useState('');
  const [copied, setCopied] = useState(false);

  // Suggested phases follow the job type until JR edits them.
  useEffect(() => { if (!phasesTouched) setPhases((SUGGESTED[division] || SUGGESTED['']).map((p) => ({ phase: p, percent: 0 }))); }, [division, phasesTouched]);

  // Customer search (debounced)
  useEffect(() => {
    if (step !== 'who' || isNew || cust) return;
    const term = q.trim(); if (term.length < 2) { setResults([]); return; }
    setSearching(true);
    const t = window.setTimeout(async () => {
      try { const d = await (await fetch('/api/admin/customers?search=' + encodeURIComponent(term), { cache: 'no-store' })).json(); setResults(Array.isArray(d) ? d.slice(0, 8) : []); } catch { setResults([]); }
      setSearching(false);
    }, 300);
    return () => window.clearTimeout(t);
  }, [q, step, isNew, cust]);

  // Estimates that could become this job (sent / viewed / draft, never signed)
  useEffect(() => {
    if (step !== 'pick' || ests) return;
    fetch('/api/admin/estimates', { cache: 'no-store' }).then((r) => r.json()).then((d) => {
      const list = (Array.isArray(d) ? d : []).filter((e: Est) => !e.signed_at && ['draft', 'sent', 'viewed', 'expired'].includes(e.status));
      setEsts(list);
    }).catch(() => setEsts([]));
  }, [step, ests]);

  const estList = useMemo(() => (ests || []).filter((e) => {
    if (!estQ.trim()) return true;
    const t = estQ.toLowerCase();
    return [e.project_name, e.estimate_number, custName(e.customer)].join(' ').toLowerCase().includes(t);
  }), [ests, estQ]);

  const setStageAndPhases = (s: typeof stage) => {
    setStage(s);
    if (s === 'finished') setPhases((ps) => ps.map((p) => ({ ...p, percent: 100 })));
    if (s === 'not_started') setPhases((ps) => ps.map((p) => ({ ...p, percent: 0 })));
  };
  const overall = phases.length ? Math.round(phases.reduce((a, p) => a + p.percent, 0) / phases.length) : 0;

  const back = () => {
    setErr('');
    const order: (typeof step)[] = ['start', 'who', 'job', 'now', 'see'];
    if (step === 'pick') setStep('start');
    else { const i = order.indexOf(step); if (i > 0) setStep(order[i - 1]); }
  };

  const next = () => {
    setErr('');
    if (step === 'who') {
      if (isNew) {
        if (!nName.trim()) { setErr('Type the customer’s name.'); return; }
      } else if (!cust) { setErr('Pick a customer, or tap “New customer”.'); return; }
      setStep('job');
    } else if (step === 'job') {
      if (!name.trim()) { setErr('Give the job a name.'); return; }
      setStep('now');
    } else if (step === 'now') {
      if (!phases.length) { setErr('Add at least one phase.'); return; }
      setStep('see');
    }
  };

  const create = async () => {
    setBusy(true); setErr('');
    try {
      const body: any = {
        project_name: name.trim(),
        project_address: address.trim() || null,
        division: division || null,
        total: total ? Number(total) : 0,
        reporting_cadence: cadence,
        phases,
        completed: stage === 'finished',
        show_schedule: show.schedule, show_inspections: show.inspections, show_photos: show.photos, show_assistant: show.assistant,
      };
      if (isNew) { body.customer_name = nName.trim(); body.customer_email = nEmail.trim() || null; body.customer_phone = nPhone.trim() || null; }
      else if (cust) { body.customer_id = cust.id; if (!cust.email && addEmail.trim()) body.customer_email = addEmail.trim(); }
      const d = await fetch('/api/admin/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json());
      if (d.error || !d.job) { setErr(d.error || 'Could not start it — try again.'); setBusy(false); return; }
      setCreated({
        id: d.job.id, number: d.job.estimate_number, name: name.trim(), link: d.job.share_link || null, customerId: d.job.customer_id || (cust && cust.id) || null,
        customerName: isNew ? nName.trim() : custName(cust),
        email: isNew ? (nEmail.trim() || null) : ((cust && cust.email) || addEmail.trim() || null),
        phone: isNew ? (nPhone.trim() || null) : ((cust && cust.phone) || null),
      });
      setStep('done');
    } catch { setErr('Network error — try again.'); }
    setBusy(false);
  };

  const convert = async () => {
    if (!pickedEst) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch(`/api/admin/estimates/${pickedEst.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'accepted', notes: 'Started as a Project Page — customer said yes outside the app' }) }).then((x) => x.json());
      if (!r || r.error) { setErr((r && r.error) || 'Could not convert it.'); setBusy(false); return; }
      const full = await fetch(`/api/admin/estimates/${pickedEst.id}`, { cache: 'no-store' }).then((x) => x.json()).catch(() => null);
      const e = (full && (full.estimate || full)) || {};
      const c = e.customer || null;
      setCreated({
        id: pickedEst.id, number: pickedEst.estimate_number, name: pickedEst.project_name,
        link: e.share_token ? `${window.location.origin}/estimate/${e.share_token}` : null,
        customerId: e.customer_id || (pickedEst.customer && pickedEst.customer.id) || null,
        customerName: custName(c || pickedEst.customer), email: (c && c.email) || null, phone: (c && c.phone) || null,
      });
      setStep('done');
    } catch { setErr('Network error — try again.'); }
    setBusy(false);
  };

  const emailLink = async () => {
    if (!created || !created.customerId) return;
    setSendNote('Sending…');
    const d = await fetch('/api/admin/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send_link', customer_id: created.customerId }) }).then((r) => r.json()).catch(() => null);
    setSendNote(d && !d.error ? `Sign-in link emailed to ${d.sent_to || created.email} ✓` : (d && d.error) || 'Could not send — try again.');
  };
  const copyLink = async () => {
    if (!created || !created.link) return;
    try { await navigator.clipboard.writeText(created.link); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setSendNote(created.link); }
  };
  const smsHref = created && created.link
    ? `sms:${created.phone ? created.phone.replace(/[^0-9+]/g, '') : ''}?&body=${encodeURIComponent(`Here's your RO Unlimited project page for ${created.name} — progress, schedule and updates all in one place: ${created.link}`)}`
    : '';

  const STEP_NUM: Record<string, number> = { who: 1, job: 2, now: 3, see: 4 };
  const title = step === 'start' ? 'Start a Project Page' : step === 'pick' ? 'Pick the estimate' : step === 'done' ? 'Project Page is ready' :
    step === 'who' ? 'Who’s it for?' : step === 'job' ? 'The job' : step === 'now' ? 'Where is it right now?' : 'What will they see?';

  return (
    <div className="fixed z-[80] flex items-end sm:items-center sm:justify-center" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="absolute bg-black/75" style={{ top: 0, left: 0, right: 0, bottom: 0 }} onClick={step === 'done' ? onClose : undefined} />
      <div className="relative w-full sm:max-w-lg max-h-[94vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#121212] border-t sm:border border-white/10 text-white">
        {/* header */}
        <div className="px-5 pt-4 pb-3 border-b border-white/8">
          <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-3 sm:hidden" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {!['start', 'done'].includes(step) && (
                <button onClick={back} aria-label="Back" className="w-11 h-11 -ml-2 flex items-center justify-center rounded-xl text-white/70"><ChevronLeft size={24} /></button>
              )}
              <div className="min-w-0">
                {STEP_NUM[step] && <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: '#D4B965' }}>Step {STEP_NUM[step]} of 4</p>}
                <h2 className="text-[21px] font-bold leading-tight">{title}</h2>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close" className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 flex-shrink-0"><X size={20} className="text-white/60" /></button>
          </div>
          {STEP_NUM[step] && (
            <div className="flex gap-1.5 mt-3">{[1, 2, 3, 4].map((n) => <div key={n} className="h-1.5 flex-1 rounded-full" style={{ background: n <= STEP_NUM[step] ? gold : 'rgba(255,255,255,0.1)' }} />)}</div>
          )}
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {step === 'start' && (
            <>
              <p className="text-[17px] text-white/70 leading-snug">Give a customer their Project Page at any point — before work starts, halfway through, or after it’s finished.</p>
              <button onClick={() => setStep('pick')} className="w-full text-left rounded-2xl p-5 flex gap-4 items-start active:scale-[0.99]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <FileText size={26} className="text-[#D4B965] flex-shrink-0 mt-0.5" />
                <span><span className="block text-[18px] font-bold">It’s already an estimate in here</span><span className="block text-[16px] text-white/60 mt-1">They said yes by phone or in person. Pick it and it becomes the job — scope, prices and phases carry over.</span></span>
              </button>
              <button onClick={() => setStep('who')} className="w-full text-left rounded-2xl p-5 flex gap-4 items-start active:scale-[0.99]" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.45)' }}>
                <Sparkles size={26} className="text-[#D4B965] flex-shrink-0 mt-0.5" />
                <span><span className="block text-[18px] font-bold">Start fresh</span><span className="block text-[16px] text-white/60 mt-1">A job that never went through the estimator — already running, about to start, or already done. Four quick steps.</span></span>
              </button>
            </>
          )}

          {step === 'pick' && (
            <>
              <div className="flex items-center gap-2 rounded-xl px-3 min-h-[52px] bg-white/5 border border-white/10">
                <Search size={18} className="text-white/40" />
                <input autoFocus value={estQ} onChange={(e) => setEstQ(e.target.value)} placeholder="Search job, customer or number" className="flex-1 min-w-0 bg-transparent text-[17px] outline-none placeholder:text-white/30" />
              </div>
              {!ests ? <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-white/40" /></div> :
                estList.length === 0 ? <p className="text-[16px] text-white/50 py-4">No open estimates match. Go back and choose “Start fresh”.</p> : (
                <div className="space-y-2">
                  {estList.map((e) => (
                    <button key={e.id} onClick={() => setPickedEst(e)} className="w-full text-left rounded-xl p-4 active:scale-[0.99]" style={pickedEst && pickedEst.id === e.id ? { background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.6)' } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-[17px] font-bold leading-tight">{String(e.project_name || '').trim() || e.estimate_number}</span>
                        <span className="text-[16px] font-bold text-white/80 tabular-nums">{money(e.total)}</span>
                      </span>
                      <span className="block text-[15px] text-white/50 mt-0.5">{custName(e.customer) || 'No customer'} · {e.estimate_number} · {e.status}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 'who' && (
            <>
              {!isNew && !cust && (
                <>
                  <div className="flex items-center gap-2 rounded-xl px-3 min-h-[52px] bg-white/5 border border-white/10">
                    <Search size={18} className="text-white/40" />
                    <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone or email" className="flex-1 min-w-0 bg-transparent text-[17px] outline-none placeholder:text-white/30" />
                    {searching && <Loader2 size={18} className="animate-spin text-white/40" />}
                  </div>
                  {results.length > 0 && (
                    <div className="space-y-2">
                      {results.map((c) => (
                        <button key={c.id} onClick={() => setCust(c)} className="w-full text-left rounded-xl p-4 bg-white/[0.03] border border-white/10 active:scale-[0.99]">
                          <span className="block text-[17px] font-bold">{custName(c)}{c.company_name && custName(c) !== c.company_name ? <span className="text-white/50 font-semibold"> · {c.company_name}</span> : null}</span>
                          <span className="block text-[15px] text-white/50">{[c.phone, c.email].filter(Boolean).join(' · ') || 'No phone or email on file'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {q.trim().length >= 2 && !searching && results.length === 0 && <p className="text-[16px] text-white/50">No match for “{q.trim()}”.</p>}
                  <button onClick={() => { setIsNew(true); setNName(q.trim()); }} className="w-full min-h-[52px] rounded-xl text-[17px] font-bold inline-flex items-center justify-center gap-2" style={chip(false)}><UserPlus size={18} /> New customer</button>
                </>
              )}
              {cust && (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(53,208,127,0.08)', border: '1px solid rgba(53,208,127,0.35)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[18px] font-bold">{custName(cust)}</p>
                      <p className="text-[15px] text-white/60">{[cust.phone, cust.email].filter(Boolean).join(' · ') || 'No phone or email on file'}</p>
                    </div>
                    <button onClick={() => { setCust(null); setAddEmail(''); }} className="min-h-[44px] px-3 rounded-lg text-[15px] font-bold text-white/70 bg-white/5">Change</button>
                  </div>
                  {!cust.email && (
                    <div className="mt-3">
                      <label className={labelCls}>Their email — so they can sign in to their Project Page</label>
                      <input value={addEmail} onChange={(e) => setAddEmail(e.target.value)} type="email" inputMode="email" placeholder="name@example.com" className={inputCls} />
                      <p className="text-[14px] text-white/40 mt-1">Optional — you can also just text them the link.</p>
                    </div>
                  )}
                </div>
              )}
              {isNew && (
                <>
                  <div><label className={labelCls}>Name</label><input autoFocus value={nName} onChange={(e) => setNName(e.target.value)} placeholder="Dale Miller" className={inputCls} /></div>
                  <div><label className={labelCls}>Email (how they sign in)</label><input value={nEmail} onChange={(e) => setNEmail(e.target.value)} type="email" inputMode="email" placeholder="name@example.com" className={inputCls} /></div>
                  <div><label className={labelCls}>Mobile phone</label><input value={nPhone} onChange={(e) => setNPhone(e.target.value)} type="tel" inputMode="tel" placeholder="(864) 555-0123" className={inputCls} /></div>
                  <button onClick={() => setIsNew(false)} className="text-[16px] font-bold text-[#D4B965] min-h-[44px]">← Search existing customers instead</button>
                </>
              )}
            </>
          )}

          {step === 'job' && (
            <>
              <div><label className={labelCls}>Job name</label><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Miller barn pad & drive" className={inputCls} /></div>
              <div><label className={labelCls}>Job address (optional)</label><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Easley" className={inputCls} /></div>
              <div>
                <label className={labelCls}>What kind of job?</label>
                <div className="flex flex-wrap gap-2">
                  {DIVISIONS.map(([k, l]) => <button key={k} onClick={() => setDivision(division === k ? '' : k)} className="min-h-[48px] px-4 rounded-full text-[16px] font-bold" style={chip(division === k)}>{l}</button>)}
                </div>
                <p className="text-[14px] text-white/40 mt-1.5">Sets the suggested phases on the next step.</p>
              </div>
              <div><label className={labelCls}>Contract amount (optional)</label><input value={total} onChange={(e) => setTotal(e.target.value)} type="number" inputMode="decimal" placeholder="Lump sum $" className={inputCls} /></div>
            </>
          )}

          {step === 'now' && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {([['not_started', 'Not started'], ['underway', 'Underway'], ['finished', 'Finished']] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setStageAndPhases(k)} className="min-h-[56px] rounded-xl text-[16px] font-bold" style={chip(stage === k)}>{l}</button>
                ))}
              </div>
              <p className="text-[16px] text-white/60">{stage === 'finished' ? 'Every phase is set to done. Their page opens on the finished project and binder.' : stage === 'not_started' ? 'Everything starts at 0%. Tap phases along in the Job Room as work happens.' : 'Tap how far along each phase is. Close is fine — you can fix it any time.'}</p>
              <div className="space-y-3">
                {phases.map((p, n) => (
                  <div key={n} className="rounded-xl p-3 bg-white/[0.03] border border-white/10">
                    <div className="flex items-center gap-2">
                      <input value={p.phase} onChange={(e) => { setPhasesTouched(true); setPhases(phases.map((x, j) => (j === n ? { ...x, phase: e.target.value } : x))); }} className="flex-1 min-w-0 min-h-[44px] px-3 rounded-lg bg-transparent border border-white/10 text-[17px] font-semibold focus:outline-none focus:border-[#C9A84C]/60" />
                      <button onClick={() => { setPhasesTouched(true); setPhases(phases.filter((_, j) => j !== n)); }} aria-label={'Remove ' + p.phase} className="w-11 h-11 flex items-center justify-center rounded-lg text-white/40"><Trash2 size={18} /></button>
                    </div>
                    {stage !== 'finished' && (
                      <div className="grid grid-cols-5 gap-1.5 mt-2">
                        {PCTS.map((v) => <button key={v} onClick={() => { if (stage === 'not_started' && v > 0) setStage('underway'); setPhases(phases.map((x, j) => (j === n ? { ...x, percent: v } : x))); }} className="min-h-[44px] rounded-lg text-[15px] font-bold" style={chip(p.percent === v)}>{v === 100 ? 'Done' : v + '%'}</button>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newPhase} onChange={(e) => setNewPhase(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newPhase.trim()) { setPhasesTouched(true); setPhases([...phases, { phase: newPhase.trim(), percent: stage === 'finished' ? 100 : 0 }]); setNewPhase(''); } }} placeholder="Add a phase" className={inputCls} />
                <button onClick={() => { if (!newPhase.trim()) return; setPhasesTouched(true); setPhases([...phases, { phase: newPhase.trim(), percent: stage === 'finished' ? 100 : 0 }]); setNewPhase(''); }} className="min-w-[52px] min-h-[52px] rounded-xl flex items-center justify-center" style={chip(true)} aria-label="Add phase"><Plus size={20} /></button>
              </div>
              <p className="text-[16px] font-bold" style={{ color: '#D4B965' }}>Overall: about {stage === 'finished' ? 100 : overall}% complete</p>
            </>
          )}

          {step === 'see' && (
            <>
              <p className="text-[16px] text-white/60">These are the same switches as in the Job Room — change them any time.</p>
              {([['schedule', 'Coming up (next two weeks)', CalendarDays], ['inspections', 'Permits & inspections', ShieldCheck], ['photos', 'Job photos', Camera], ['assistant', 'Project assistant (answers their questions)', Sparkles]] as const).map(([k, l, Icon]) => (
                <button key={k} onClick={() => setShow({ ...show, [k]: !show[k] })} className="w-full min-h-[56px] px-4 rounded-xl flex items-center justify-between gap-3 text-left" style={chip(show[k])}>
                  <span className="flex items-center gap-3 text-[17px] font-bold"><Icon size={20} /> {l}</span>
                  <span className="text-[15px] font-bold">{show[k] ? 'Showing' : 'Hidden'}</span>
                </button>
              ))}
              <div>
                <label className={labelCls}>Progress reports to the customer</label>
                <div className="grid grid-cols-4 gap-2">
                  {[['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly'], ['none', 'None']].map(([id, l]) => <button key={id} onClick={() => setCadence(id)} className="min-h-[50px] rounded-xl text-[15px] font-bold" style={chip(cadence === id)}>{l}</button>)}
                </div>
              </div>
              <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/10 text-[16px] text-white/75 leading-relaxed">
                <p className="text-[13px] font-bold uppercase tracking-wide text-white/40 mb-1">Ready to create</p>
                <p><strong className="text-white">{name}</strong> for <strong className="text-white">{isNew ? nName : custName(cust)}</strong>{total ? ` · ${money(Number(total))}` : ''}</p>
                <p>{stage === 'finished' ? 'Finished job' : `${phases.length} phases · about ${stage === 'not_started' ? 0 : overall}% done`}</p>
              </div>
            </>
          )}

          {step === 'done' && created && (
            <>
              <div className="rounded-2xl p-4 flex gap-3 items-start" style={{ background: 'rgba(53,208,127,0.1)', border: '1px solid rgba(53,208,127,0.4)' }}>
                <Check size={26} className="text-[#35d07f] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[18px] font-bold">{created.name}</p>
                  <p className="text-[16px] text-white/65">{created.customerName} · {created.number} · on the Jobs board now</p>
                </div>
              </div>
              <div>
                <p className="text-[17px] font-bold mb-2">1. Send them their Project Page</p>
                <div className="space-y-2">
                  <button onClick={emailLink} disabled={!created.email || !created.customerId} className="w-full min-h-[52px] rounded-xl text-[17px] font-bold inline-flex items-center justify-center gap-2 text-black disabled:opacity-40" style={{ background: gold }}><Mail size={18} /> {created.email ? 'Email them a sign-in link' : 'Email (no email on file)'}</button>
                  <div className="grid grid-cols-2 gap-2">
                    <a href={smsHref || undefined} className={'min-h-[52px] rounded-xl text-[16px] font-bold inline-flex items-center justify-center gap-2 ' + (created.link ? '' : 'opacity-40 pointer-events-none')} style={chip(false)}><MessageSquare size={18} /> Text the link</a>
                    <button onClick={copyLink} disabled={!created.link} className="min-h-[52px] rounded-xl text-[16px] font-bold inline-flex items-center justify-center gap-2 disabled:opacity-40" style={chip(copied)}>{copied ? <Check size={18} /> : <Copy size={18} />} {copied ? 'Copied' : 'Copy link'}</button>
                  </div>
                  {sendNote && <p className="text-[15px] text-white/70 break-all">{sendNote}</p>}
                </div>
              </div>
              <div>
                <p className="text-[17px] font-bold mb-2">2. Fill it in (in the Job Room)</p>
                <div className="space-y-2">
                  {([['room-schedule', 'Add what’s coming up', CalendarDays], ['room-inspections', 'Add permits & inspections', ShieldCheck], ['room-update', 'Post a first update with photos', Camera]] as const).map(([h, l, Icon]) => (
                    <a key={h} href={`/admin/jobs/${created.id}#${h}`} className="w-full min-h-[52px] px-4 rounded-xl text-[16px] font-bold flex items-center gap-3" style={chip(false)}><Icon size={19} className="text-[#D4B965]" /> {l}</a>
                  ))}
                </div>
              </div>
              {created.link && (
                <a href={created.link + '?from=admin&tour=1'} target="_blank" rel="noreferrer" className="w-full min-h-[48px] rounded-xl text-[16px] font-bold flex items-center justify-center gap-2 text-white/70"><ExternalLink size={17} /> See their page the way they will</a>
              )}
            </>
          )}

          {err && <p className="text-[16px] text-[#f87171]">{err}</p>}
        </div>

        {/* footer */}
        {step !== 'start' && (
          <div className="px-5 pt-3 border-t border-white/8" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
            {step === 'pick' && <button onClick={convert} disabled={!pickedEst || busy} className="w-full min-h-[56px] rounded-xl text-[17px] font-bold text-black disabled:opacity-40 flex items-center justify-center gap-2" style={{ background: gold }}>{busy ? <Loader2 className="animate-spin" size={20} /> : <HardHat size={19} />} {pickedEst ? 'They said yes — make it the job' : 'Pick an estimate above'}</button>}
            {['who', 'job', 'now'].includes(step) && <button onClick={next} className="w-full min-h-[56px] rounded-xl text-[17px] font-bold text-black" style={{ background: gold }}>Next</button>}
            {step === 'see' && <button onClick={create} disabled={busy} className="w-full min-h-[56px] rounded-xl text-[17px] font-bold text-black disabled:opacity-40 flex items-center justify-center gap-2" style={{ background: gold }}>{busy ? <Loader2 className="animate-spin" size={20} /> : <HardHat size={19} />} Create the Project Page</button>}
            {step === 'done' && (
              <div className="grid grid-cols-2 gap-2">
                <button onClick={onClose} className="min-h-[56px] rounded-xl text-[17px] font-bold" style={chip(false)}>Close</button>
                <a href={created ? `/admin/jobs/${created.id}` : '#'} onClick={() => { if (created && onDone) onDone(created.id); }} className="min-h-[56px] rounded-xl text-[17px] font-bold text-black flex items-center justify-center" style={{ background: gold }}>Open Job Room</a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
