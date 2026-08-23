/**
 * Smart insights — plain-English sentences computed from the analytics data.
 * Deterministic rules, no AI: every line is backed by the numbers on the page,
 * so it never says something the data doesn't. Each insight carries a tone
 * (good / warn / info) and, where it makes sense, a link to act on it.
 */

export interface Insight {
  id: string;
  tone: 'good' | 'warn' | 'info';
  text: string;        // the sentence JR reads
  detail?: string;     // smaller second line
  href?: string;       // where tapping it goes
  priority: number;    // higher = shown first
  section: 'estimates' | 'activity' | 'website' | 'behaviour';
}

const money = (n: number) => '$' + Math.round(n || 0).toLocaleString();
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export function computeInsights(data: any, posthog: any | null): Insight[] {
  const out: Insight[] = [];
  const f = data?.funnel?.all;
  const stale: any[] = data?.stale || [];
  const a = data?.activity;
  const t = data?.traffic;
  const days = data?.days || 30;

  /* ── Estimates / money ─────────────────────────────────────── */
  const neverOpened = stale.filter((s) => !s.view_count);
  if (neverOpened.length) {
    out.push({
      id: 'never-opened', tone: 'warn', section: 'estimates', priority: 100,
      text: `${neverOpened.length === 1 ? `${neverOpened[0].estimate_number} was` : `${neverOpened.length} estimates were`} sent and never opened.`,
      detail: `${neverOpened.slice(0, 3).map((s) => `${s.estimate_number} (${s.days_since_sent}d ago)`).join(', ')} — resend the link or call.`,
      href: '/admin/estimates',
    });
  }
  const goneQuiet = stale.filter((s) => s.view_count > 0 && (s.days_since_view ?? 99) >= 7);
  if (goneQuiet.length) {
    out.push({
      id: 'gone-quiet', tone: 'warn', section: 'estimates', priority: 80,
      text: `${goneQuiet.length === 1 ? `${goneQuiet[0].estimate_number} was opened but has` : `${goneQuiet.length} estimates were opened but have`} gone quiet for a week+.`,
      detail: `Worth a follow-up call — they looked, then stalled. ${money(goneQuiet.reduce((s, e) => s + (e.total || 0), 0))} on the table.`,
      href: '/admin/estimates',
    });
  }
  if (f && f.sent >= 2) {
    out.push({
      id: 'open-rate', tone: f.opened / f.sent >= 0.7 ? 'good' : 'info', section: 'estimates', priority: 60,
      text: `${f.opened} of ${f.sent} estimates sent in the last ${days} days got opened (${pct(f.opened, f.sent)}%).`,
      detail: f.median_hours_to_open != null
        ? f.median_hours_to_open < 24
          ? `Customers usually open within ${f.median_hours_to_open < 1 ? Math.max(1, Math.round(f.median_hours_to_open * 60)) + ' minutes' : Math.round(f.median_hours_to_open) + ' hours'} — the first day is your window to follow up.`
          : `Typical first open takes ${Math.round(f.median_hours_to_open / 24)} days.`
        : undefined,
    });
  }
  if (f && f.signed > 0) {
    out.push({
      id: 'signed-value', tone: 'good', section: 'estimates', priority: 90,
      text: `${money(f.value_signed)} signed out of ${money(f.value_sent)} sent (${pct(f.signed, f.sent)}% of estimates).`,
      detail: f.median_hours_to_sign != null ? `From first look to signature: about ${f.median_hours_to_sign < 48 ? Math.max(1, Math.round(f.median_hours_to_sign)) + ' hours' : Math.round(f.median_hours_to_sign / 24) + ' days'}.` : undefined,
    });
  } else if (f && f.sent >= 2) {
    out.push({
      id: 'no-signatures', tone: 'info', section: 'estimates', priority: 55,
      text: `No signatures in the last ${days} days — ${money(f.value_sent)} is out for review.`,
      detail: 'The follow-up list below shows who to nudge.',
    });
  }

  /* ── Customer activity ─────────────────────────────────────── */
  if (a && a.views > 0) {
    const phone = a.devices.find((d: any) => d.device === 'Phone');
    const phoneShare = phone ? pct(phone.views, a.views) : 0;
    if (phoneShare >= 55) {
      out.push({
        id: 'phone-share', tone: 'info', section: 'activity', priority: 40,
        text: `${phoneShare}% of estimate opens happen on a phone.`,
        detail: 'The live link and PDF are built phone-first, so that works in your favor.',
      });
    }
    if (a.avg_seconds != null && a.avg_seconds >= 45) {
      out.push({
        id: 'read-time', tone: 'good', section: 'activity', priority: 45,
        text: `Customers spend about ${a.avg_seconds >= 90 ? Math.round(a.avg_seconds / 60) + ' minutes' : a.avg_seconds + ' seconds'} reading an estimate${a.reached_total_rate != null ? `, and ${a.reached_total_rate}% scroll all the way to the price` : ''}.`,
        detail: 'They\'re actually reading the scope — detail in the write-up is being seen.',
      });
    }
    if (a.pdf_downloads > 0) {
      out.push({
        id: 'pdf-downloads', tone: 'info', section: 'activity', priority: 35,
        text: `The PDF was downloaded ${a.pdf_downloads} time${a.pdf_downloads === 1 ? '' : 's'} — usually a sign it's being shared or filed.`,
      });
    }
    if (a.cities?.length > 1) {
      out.push({
        id: 'cities', tone: 'info', section: 'activity', priority: 20,
        text: `Estimates were opened from ${a.cities.slice(0, 3).map((c: any) => c.city.split(',')[0]).join(', ')}.`,
        detail: 'More than one city can mean the customer forwarded it — often a partner or lender.',
      });
    }
  } else if (a) {
    out.push({
      id: 'no-activity', tone: 'info', section: 'activity', priority: 10,
      text: `No customer opens recorded in the last ${days} days.`,
      detail: 'This fills in the moment a sent estimate gets opened — you\'ll also get a push when it happens.',
    });
  }

  /* ── Website traffic ───────────────────────────────────────── */
  if (t?.available && t.days?.length >= 14) {
    const half = Math.floor(t.days.length / 2);
    const prev = t.days.slice(0, half).reduce((s: number, d: any) => s + d.visits, 0);
    const cur = t.days.slice(half).reduce((s: number, d: any) => s + d.visits, 0);
    if (prev >= 5 && Math.abs(cur - prev) / prev >= 0.25) {
      const up = cur > prev;
      out.push({
        id: 'traffic-trend', tone: up ? 'good' : 'info', section: 'website', priority: 50,
        text: `Website visits are ${up ? 'up' : 'down'} ${Math.abs(Math.round(((cur - prev) / prev) * 100))}% — ${cur} in the recent half vs ${prev} before.`,
      });
    }
    const topService = (t.top_pages || []).find((p: any) => p.path !== '/');
    if (topService && topService.visits >= 5) {
      out.push({
        id: 'top-page', tone: 'info', section: 'website', priority: 30,
        text: `${topService.path.replace(/^\//, '').replace(/-/g, ' ')} is the most-read part of the site (${topService.visits} visits).`,
        detail: 'That\'s where demand is looking right now.',
      });
    }
    const google = (t.referrers || []).find((r: any) => /google/i.test(r.host));
    const refTotal = (t.referrers || []).reduce((s: number, r: any) => s + r.visits, 0);
    if (google && t.totals.visits) {
      out.push({
        id: 'google', tone: 'info', section: 'website', priority: 25,
        text: `Google sent ${google.visits} visitor${google.visits === 1 ? '' : 's'}; the rest mostly come direct (typed it in, or from a text/link).`,
      });
    } else if (t.totals.visits >= 10 && refTotal === 0) {
      out.push({
        id: 'all-direct', tone: 'info', section: 'website', priority: 25,
        text: 'Nearly all visits are direct — word of mouth and shared links, not search.',
        detail: 'Reviews and Google Business posts are the cheapest way to add a search lane.',
      });
    }
  }

  /* ── Visitor behaviour (PostHog) ───────────────────────────── */
  if (posthog?.available) {
    const conv = posthog.conversions || [];
    const calls = conv.filter((c: any) => c.event !== 'contact_form_submitted').reduce((s: number, c: any) => s + c.people, 0);
    const forms = conv.find((c: any) => c.event === 'contact_form_submitted')?.count || 0;
    if (calls + forms > 0) {
      out.push({
        id: 'conversions', tone: 'good', section: 'behaviour', priority: 70,
        text: `${calls ? `${calls} ${calls === 1 ? 'person' : 'people'} tapped to call or write` : ''}${calls && forms ? ' and ' : ''}${forms ? `${forms} contact form${forms === 1 ? '' : 's'} came in` : ''} from the website.`,
        detail: 'That\'s the site doing its job — each one is a lead.',
      });
    } else if (posthog.totals?.visitors >= 15) {
      out.push({
        id: 'no-conversions', tone: 'warn', section: 'behaviour', priority: 65,
        text: `${posthog.totals.visitors} visitors this period, but nobody tapped call or sent the form yet.`,
        detail: 'Worth watching a session replay to see where they drift off.',
      });
    }
    if (posthog.funnel?.visitors >= 10) {
      const fh = posthog.funnel;
      out.push({
        id: 'site-funnel', tone: 'info', section: 'behaviour', priority: 35,
        text: `Of ${fh.visitors} visitors, ${fh.service_page} read a service page and ${fh.converted} reached out (${pct(fh.converted, fh.visitors)}%).`,
      });
    }
    if ((posthog.recordings || []).length > 0) {
      out.push({
        id: 'replays', tone: 'info', section: 'behaviour', priority: 15,
        text: `${posthog.recordings.length} real visit${posthog.recordings.length === 1 ? '' : 's'} recorded — watch exactly what people did on the site.`,
      });
    }
  }

  return out.sort((x, y) => y.priority - x.priority);
}
