'use client';

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Camera, ArrowRight, CloudRain, Hammer, Flag, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { ProgressSection, useDocIntro } from '@/components/public/DocExperience';

/**
 * The customer's progress report — the weekly/monthly update JR sends.
 * Same light document look as the estimate and invoice links.
 */

interface Report {
  percent: number;
  prev_percent: number;
  phases: { phase: string; percent: number }[];
  completed: string[];
  log_entries: { entry_date: string; type: string; text: string | null }[];
  photos: { url: string; caption?: string | null }[];
  summary: string | null;
  next_up: string | null;
  period_start: string | null;
  period_end: string;
  sent_at: string | null;
  project_name: string | null;
  estimate_number: string | null;
  customer_name: string | null;
  contract_link: string | null;
}

const longDate = (s: string | null) =>
  s ? new Date(s.length === 10 ? s + 'T00:00:00' : s)
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

const LOG_ICON: Record<string, any> = {
  rain: CloudRain, work: Hammer, milestone: Flag, inspection: ClipboardCheck, delay: AlertTriangle,
};
const LOG_COLOR: Record<string, string> = {
  rain: '#5ba3dc', work: '#8a6d20', milestone: '#187a4b', inspection: '#7c5cd6', delay: '#c2410c',
};
const dayLabel = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

const photoSrc = (url: string) => (url.includes('cdn.sanity.io') ? url + '?w=900&auto=format' : url);

export default function ReportPage({ params }: { params: { token: string } }) {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/report/' + params.token)
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setReport(d); })
      .catch(() => setError('Could not load this report'))
      .finally(() => setLoading(false));
  }, [params.token]);

  useDocIntro(!!report);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#faf9f7' }}>
        <Loader2 size={26} className="animate-spin" style={{ color: '#C9A84C' }} />
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6" style={{ background: '#faf9f7' }}>
        <div className="text-center max-w-md">
          <h1 className="text-[24px] font-bold text-[#1a1a1a] mb-2">Report unavailable</h1>
          <p className="text-[16px] text-[#6b7280] mb-4">
            {error || 'This link may have expired.'} Give us a call at (864) 304-0139 and we'll get you a current update.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ro-unlimited-logo.png" alt="RO Unlimited" className="h-9 w-auto mx-auto opacity-60" />
        </div>
      </main>
    );
  }

  const period = report.period_start
    ? `${longDate(report.period_start)} – ${longDate(report.period_end)}`
    : `As of ${longDate(report.period_end)}`;
  const moved = report.percent - report.prev_percent;

  return (
    <main className="min-h-screen" style={{ background: '#faf9f7' }}>
      <div id="doc-main" className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Brand — visible frame one, never animated */}
        <div className="flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ro-unlimited-logo.png" alt="RO Unlimited" className="h-10 w-auto" />
          <span className="text-[13px] font-bold uppercase tracking-wide" style={{ color: '#8a6d20' }}>
            Progress Report
          </span>
        </div>

        <header className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: '#ead9ac' }}>
          <h1 className="text-[26px] sm:text-[30px] font-bold text-[#1a1a1a] leading-tight">
            {report.project_name || 'Your Project'}
          </h1>
          <p className="text-[16px] text-[#6b7280] mt-1">{period}</p>
          {report.customer_name && (
            <p className="text-[15px] text-[#9ca3af] mt-2">Prepared for {report.customer_name}</p>
          )}
          {/* Only meaningful when there WAS a previous report to move from. */}
          {report.period_start && moved > 0 && (
            <p className="text-[15px] font-semibold mt-3" style={{ color: '#187a4b' }}>
              Up {moved}% since the last update
            </p>
          )}
        </header>

        {report.summary && (
          <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: '#f0ece2' }}>
            <p className="text-[13px] font-bold uppercase tracking-wide mb-2" style={{ color: '#8a6d20' }}>
              This Period
            </p>
            <p className="text-[17px] leading-relaxed text-[#2a2a2a] whitespace-pre-line">{report.summary}</p>
          </section>
        )}

        {report.log_entries && report.log_entries.length > 0 && (
          <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: '#f0ece2' }}>
            <p className="text-[13px] font-bold uppercase tracking-wide mb-3" style={{ color: '#8a6d20' }}>
              Day by Day
            </p>
            <div className="doc-rows space-y-3">
              {report.log_entries.map((e, i) => {
                const Icon = LOG_ICON[e.type] || Hammer;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <Icon size={17} style={{ color: LOG_COLOR[e.type] || '#8a6d20' }} className="shrink-0 mt-1" />
                    <div className="min-w-0">
                      <p className="text-[14px] text-[#9ca3af]">{dayLabel(e.entry_date)}</p>
                      <p className="text-[17px] text-[#2a2a2a] leading-snug">
                        {e.text || (e.type === 'rain' ? 'Rained out — no work.' : '')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {report.completed.length > 0 && (
          <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: '#f0ece2' }}>
            <p className="text-[13px] font-bold uppercase tracking-wide mb-3" style={{ color: '#8a6d20' }}>
              Completed
            </p>
            <div className="doc-rows space-y-2">
              {report.completed.map((phase) => (
                <div key={phase} className="flex items-center gap-2.5 text-[17px] text-[#2a2a2a]">
                  <CheckCircle2 size={18} style={{ color: '#187a4b' }} className="shrink-0" />
                  {phase}
                </div>
              ))}
            </div>
          </section>
        )}

        {report.phases.length > 0 && (
          <ProgressSection
            progress={{
              percent: report.percent,
              phases: report.phases,
              in_progress: report.phases.find((p) => p.percent > 0 && p.percent < 100)?.phase || null,
              next_up: report.next_up,
              updated_at: report.sent_at,
            }}
            docWord="project"
          />
        )}

        {report.photos.length > 0 && (
          <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: '#f0ece2' }}>
            <p className="text-[13px] font-bold uppercase tracking-wide mb-3 flex items-center gap-1.5" style={{ color: '#8a6d20' }}>
              <Camera size={14} /> From the Jobsite
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report.photos.map((p, i) => (
                <figure key={i} className="rounded-xl overflow-hidden border" style={{ borderColor: '#f0ece2' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoSrc(p.url)} alt={p.caption || 'Jobsite photo'} loading="lazy"
                    className="w-full h-48 object-cover" />
                  {p.caption && (
                    <figcaption className="text-[14px] text-[#6b7280] px-3 py-2">{p.caption}</figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl border p-5 sm:p-6" style={{ background: '#fdf6e7', borderColor: '#ead9ac' }}>
          <p className="text-[17px] text-[#4a4a4a] leading-relaxed">
            Questions about anything in this update? Call <a href="tel:+18643040139" className="font-bold" style={{ color: '#8a6d20' }}>(864) 304-0139</a> — we'll walk you through it.
          </p>
          {report.contract_link && (
            <a href={report.contract_link}
              className="inline-flex items-center gap-2 mt-4 min-h-[48px] px-5 rounded-xl text-[15px] font-bold text-black"
              style={{ background: '#C9A84C' }}>
              View Your Contract <ArrowRight size={16} />
            </a>
          )}
        </section>

        <footer className="text-center py-6">
          <p className="text-[15px] font-bold text-[#4a4a4a]">RO Unlimited Construction &amp; Development</p>
          <p className="text-[14px] text-[#9ca3af] mt-1">
            {report.estimate_number ? report.estimate_number + ' · ' : ''}rounlimited.com
          </p>
        </footer>
      </div>
    </main>
  );
}
