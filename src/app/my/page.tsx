'use client';

import { useEffect, useState } from 'react';
import { Loader2, ChevronRight, CalendarDays, Camera, MessageCircle } from 'lucide-react';

/**
 * Portal home — everything this customer has with RO, and the one list that
 * matters: what needs them, across all projects. Each project opens INSIDE
 * the portal (/my/project/<id>).
 */
type Project = {
  id: string; number: string; name: string; address: string | null;
  stage: 'proposal' | 'signed' | 'in_progress' | 'complete' | 'closed'; percent: number; total: number;
  href: string | null;
  latest: { date: string; text: string; photos: number } | null;
  needs: string[]; next: { date: string; title: string } | null; questions_waiting: number; next_service?: { title: string; date: string } | null;
};
const STAGE: Record<Project['stage'], { label: string; color: string; bg: string }> = {
  in_progress: { label: 'In progress', color: '#8a6d20', bg: '#fdf6e7' },
  signed: { label: 'Signed — starting soon', color: '#187a4b', bg: '#e9f7ef' },
  proposal: { label: 'Estimate to review', color: '#8a6d20', bg: '#fdf6e7' },
  complete: { label: 'Complete', color: '#187a4b', bg: '#e9f7ef' },
  closed: { label: 'Closed', color: '#6b7280', bg: '#f3f4f6' },
};
const day = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

export default function PortalHome() {
  const [data, setData] = useState<{ name: string | null; email: string; projects: Project[]; has_password: boolean } | null>(null);
  useEffect(() => { fetch('/api/my/projects', { cache: 'no-store' }).then((r) => r.json()).then(setData).catch(() => setData({ name: null, email: '', projects: [], has_password: true })); }, []);
  if (!data) return <div className="py-24 flex justify-center"><Loader2 className="animate-spin text-gray-400" size={28} /></div>;
  const { name, projects } = data;
  const needs = projects.flatMap((p) => p.needs.map((n) => ({ project: p, text: n })));
  const open = (p: Project) => `/my/project/${p.id}`;

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-4">
      <h1 className="text-[24px] sm:text-[30px] font-bold text-[#1a1a1a] leading-tight" style={{ textWrap: 'balance' } as any}>{name ? `${name}, here’s where things stand.` : 'Here’s where things stand.'}</h1>

      {!data.has_password && (
        <a href="/my/account#password" className="block rounded-2xl border p-4 active:scale-[0.995]" style={{ background: '#fff', borderColor: '#ead9ac' }}>
          <p className="text-[17px] font-semibold text-[#2a2a2a]">Set a password so you can sign in here any time without an email link. <span style={{ color: '#8a6d20' }}>Account →</span></p>
        </a>
      )}

      {/* The one list that matters */}
      <section className="rounded-2xl border p-5" style={{ background: needs.length ? '#fdf6e7' : '#f7f7f5', borderColor: needs.length ? '#ead9ac' : '#e8e4da' }}>
        <p className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: needs.length ? '#8a6d20' : '#6b7280' }}>Needs you</p>
        {needs.length === 0 ? (
          <p className="text-[17px] text-[#2a2a2a]">Nothing needed from you right now. We&rsquo;ll post here the moment something is.</p>
        ) : (
          <div className="space-y-2">
            {needs.map((n, i) => (
              <a key={i} href={open(n.project) + '#needs-you'} className="block rounded-xl px-4 py-3 min-h-[56px] active:scale-[0.99]" style={{ background: '#fff', border: '1px solid #ead9ac' }}>
                <span className="block text-[17px] font-semibold text-[#2a2a2a]">{n.text}</span>
                {projects.length > 1 && <span className="block text-[15px] text-gray-500">{n.project.name}</span>}
              </a>
            ))}
          </div>
        )}
      </section>

      {projects.length === 0 && (
        <section className="rounded-2xl border bg-white p-5" style={{ borderColor: '#f0ece2' }}>
          <p className="text-[17px] text-[#2a2a2a]">We don&rsquo;t have any projects on file under <strong>{data.email}</strong> yet. If that doesn&rsquo;t sound right, call (864) 304-0139 and we&rsquo;ll fix it.</p>
        </section>
      )}

      {projects.length > 0 && <p className="text-[13px] font-bold uppercase tracking-wide pt-2" style={{ color: '#8a6d20' }}>Your projects</p>}
      {projects.map((p) => {
        const st = STAGE[p.stage];
        return (
          <a key={p.id} href={open(p)} className="block rounded-2xl border bg-white p-5 sm:p-6 active:scale-[0.995]" style={{ borderColor: '#f0ece2' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[21px] font-bold text-[#1a1a1a] leading-tight">{p.name}</p>
                {p.address && <p className="text-[15px] text-gray-500 mt-0.5">{p.address}</p>}
              </div>
              <ChevronRight size={22} className="text-gray-400 shrink-0 mt-1" />
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="px-3 py-1 rounded-full text-[14px] font-bold" style={{ background: st.bg, color: st.color }}>{st.label}</span>
              {p.stage === 'in_progress' && <span className="text-[15px] font-semibold text-[#2a2a2a]">{p.percent}% complete</span>}
              {p.needs.length > 0 && <span className="px-3 py-1 rounded-full text-[14px] font-bold" style={{ background: '#fdf6e7', color: '#8a6d20' }}>{p.needs.length} thing{p.needs.length === 1 ? '' : 's'} need you</span>}
            </div>
            {p.stage === 'in_progress' && (
              <div className="h-2.5 rounded-full mt-2 overflow-hidden" style={{ background: '#f0ece2' }}><div className="h-full rounded-full" style={{ width: p.percent + '%', background: 'linear-gradient(90deg, #D4B965, #a8893d)' }} /></div>
            )}
            {p.latest && (
              <div className="mt-4">
                <p className="text-[13px] font-bold uppercase tracking-wide text-gray-400">Latest from RO · {day(p.latest.date)}</p>
                <p className="text-[17px] text-[#2a2a2a] mt-1 leading-snug">{p.latest.text}{p.latest.photos > 0 && <span className="inline-flex items-center gap-1 ml-2 text-[14px] font-semibold text-gray-500"><Camera size={14} /> {p.latest.photos} photo{p.latest.photos === 1 ? '' : 's'}</span>}</p>
              </div>
            )}
            {p.next && <p className="mt-3 text-[16px] text-[#4b5563] inline-flex items-center gap-2"><CalendarDays size={16} className="text-gray-400" /> Next up: {p.next.title} &mdash; {day(p.next.date)} (estimated)</p>}
            {p.questions_waiting > 0 && <p className="mt-2 text-[15px] font-semibold inline-flex items-center gap-2" style={{ color: '#8a6d20' }}><MessageCircle size={15} /> Your question is with RO &mdash; the answer will post on the project.</p>}
            {p.stage === 'complete' && <p className="mt-3 text-[16px] text-[#4b5563]">Your binder is here: contract, invoices, inspections, photos and warranty.{p.next_service ? <> Next maintenance: {p.next_service.title} &mdash; {day(p.next_service.date)}.</> : null}</p>}
          </a>
        );
      })}
    </main>
  );
}
