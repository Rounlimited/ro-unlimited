'use client';

import { useEffect, useMemo, useState } from 'react';
import { BellRing, Smartphone, SmartphoneNfc, Loader2, Check, Send, Info } from 'lucide-react';
import type { AlertRouting } from '@/lib/alerts';

interface Person { id: string; email: string; name: string | null; role: string; devices: number; last_device_at: string | null }
interface Meta { id: string; label: string; about?: string }

/**
 * Settings → Alerts: who gets the customer-activity pushes.
 * Default list → per-division overrides → per-alert-type overrides.
 * Everything to JR today; as departments get leads, tick their names here.
 */
export default function AlertRoutingCard({ currentEmail }: { currentEmail: string | null }) {
  const [routing, setRouting] = useState<AlertRouting | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [types, setTypes] = useState<Meta[]>([]);
  const [divisions, setDivisions] = useState<Meta[]>([]);
  const [untagged, setUntagged] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetch('/api/admin/alert-routing', { cache: 'no-store' }).then((r) => r.json()).then((d) => {
      if (d.routing) { setRouting(d.routing); setPeople(d.people || []); setTypes(d.alert_types || []); setDivisions(d.divisions || []); setUntagged(d.untagged_devices || 0); }
    }).catch(() => {});
  }, []);

  const save = async (next: AlertRouting) => {
    setRouting(next); setSaving(true); setSaved(false);
    try {
      const r = await fetch('/api/admin/alert-routing', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) });
      if (r.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } finally { setSaving(false); }
  };
  const toggle = (list: string[], email: string) => list.includes(email) ? list.filter((e) => e !== email) : [...list, email];
  const label = (p: Person) => p.name || p.email.split('@')[0];
  const byDivision = routing?.by_division || {}; const byEvent = routing?.by_event || {};
  const overrides = useMemo(() => Object.values(byDivision).filter((l) => l.length).length + Object.values(byEvent).filter((l) => l.length).length, [byDivision, byEvent]);

  const sendTest = async () => {
    setTesting('…');
    try { const r = await fetch('/api/admin/alert-routing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"test":true}' }); const d = await r.json(); setTesting(d.sent ? `Sent to ${d.sent} device${d.sent === 1 ? '' : 's'}` : 'No registered device — open the app on your phone first'); }
    catch { setTesting('Failed'); }
    setTimeout(() => setTesting(null), 4000);
  };

  if (!routing) return null;

  const PersonToggles = ({ list, onChange }: { list: string[]; onChange: (next: string[]) => void }) => (
    <div className="flex flex-wrap gap-2">
      {people.map((p) => {
        const on = list.includes(p.email);
        return (
          <button key={p.id} type="button" onClick={() => onChange(toggle(list, p.email))} title={p.email}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium border transition-all min-h-[40px] ${on ? 'bg-[#C9A84C]/12 border-[#C9A84C]/40 text-[#C9A84C]' : 'bg-white/[0.03] border-white/10 text-white/45 hover:border-white/25'}`}>
            {on ? <Check size={13} /> : <span className="w-[13px]" />}{label(p)}
            {p.devices > 0 ? <Smartphone size={12} className={on ? 'text-[#C9A84C]/70' : 'text-white/25'} /> : <SmartphoneNfc size={12} className="text-red-400/60" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <section className="bg-[#111] border border-white/5 rounded-xl overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#C9A84C]/10 rounded-lg flex items-center justify-center"><BellRing size={16} className="text-[#C9A84C]" /></div>
          <div>
            <h2 className="text-sm font-semibold">Alerts — who gets notified</h2>
            <p className="text-[11px] text-white/25">Customer opened / downloaded / signed / messaged. Phone push + the bell.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-white/40">
          {saving ? <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Saving</span> : saved ? <span className="flex items-center gap-1 text-emerald-400"><Check size={12} /> Saved</span> : null}
        </div>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* Default */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-[13px] font-semibold text-white/80">Everything goes to</h3>
            <span className="text-[11px] text-white/30">{routing.default.length === 0 ? 'nobody picked = everyone with the app' : `${routing.default.length} ${routing.default.length === 1 ? 'person' : 'people'}`}</span>
          </div>
          <PersonToggles list={routing.default} onChange={(next) => save({ ...routing, default: next })} />
          <p className="text-[11px] text-white/25 mt-2 flex items-start gap-1.5"><Smartphone size={11} className="mt-0.5 shrink-0" /> A phone icon means that person has the app registered for push. <SmartphoneNfc size={11} className="mt-0.5 shrink-0 text-red-400/60" /> red means no device yet — they need to open the app on their phone once.</p>
          {untagged > 0 && <p className="text-[11px] text-amber-300/70 mt-1 flex items-start gap-1.5"><Info size={11} className="mt-0.5 shrink-0" /> {untagged} device{untagged === 1 ? '' : 's'} registered before today aren't tied to a person yet — they still get every alert until that phone reopens the app.</p>}
        </div>

        {/* Overrides */}
        <div>
          <button type="button" onClick={() => setShowAdvanced((v) => !v)} className="text-[13px] font-semibold text-white/80 flex items-center gap-2">
            Hand off by division or alert type
            <span className="text-[11px] font-normal text-white/30">{overrides ? `${overrides} override${overrides === 1 ? '' : 's'} set` : 'none set'} · {showAdvanced ? 'hide' : 'show'}</span>
          </button>
          {showAdvanced && (
            <div className="mt-3 space-y-5">
              <p className="text-[12px] text-white/35">Pick people here only where it differs from the default. An alert type wins over a division, and a division wins over the default. Leave a row empty to fall back.</p>
              <div>
                <h4 className="text-[11px] uppercase tracking-wide text-white/30 mb-2">By division</h4>
                <div className="space-y-3">
                  {divisions.map((d) => (
                    <div key={d.id} className="grid grid-cols-[110px_1fr] gap-3 items-start">
                      <span className="text-[13px] text-white/60 pt-2">{d.label}</span>
                      <PersonToggles list={byDivision[d.id] || []} onChange={(next) => save({ ...routing, by_division: { ...byDivision, [d.id]: next } })} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[11px] uppercase tracking-wide text-white/30 mb-2">By alert type</h4>
                <div className="space-y-3">
                  {types.map((t) => (
                    <div key={t.id} className="grid grid-cols-[110px_1fr] gap-3 items-start">
                      <div className="pt-2"><div className="text-[13px] text-white/60 leading-tight">{t.label}</div>{t.about && <div className="text-[10px] text-white/25">{t.about}</div>}</div>
                      <PersonToggles list={byEvent[t.id] || []} onChange={(next) => save({ ...routing, by_event: { ...byEvent, [t.id]: next } })} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Test */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
          <p className="text-[12px] text-white/35">Send a test push to your own phone{currentEmail ? ` (${currentEmail})` : ''}.</p>
          <button type="button" onClick={sendTest} disabled={!!testing} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium text-[#C9A84C] bg-[#C9A84C]/10 border border-[#C9A84C]/25 disabled:opacity-60 whitespace-nowrap">
            <Send size={12} /> {testing || 'Send test alert'}
          </button>
        </div>
      </div>
    </section>
  );
}
