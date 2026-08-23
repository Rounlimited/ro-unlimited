/**
 * Cloudflare Web Analytics (RUM) + zone request stats, via the GraphQL API.
 * Free, already collecting on rounlimited.com. Read-only token in
 * CF_ANALYTICS_TOKEN (scoped: Account Analytics Read + Zone Analytics Read).
 */
const ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';

async function gql(query: string, variables: Record<string, unknown>) {
  const token = process.env.CF_ANALYTICS_TOKEN;
  if (!token) throw new Error('CF_ANALYTICS_TOKEN not set');
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 300 },
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors.map((e: any) => e.message).join('; '));
  return json.data;
}

export interface TrafficSummary {
  available: boolean;
  error?: string;
  days: { date: string; page_views: number; visits: number }[];
  top_pages: { path: string; page_views: number; visits: number }[];
  referrers: { host: string; visits: number }[];
  countries: { country: string; visits: number }[];
  devices: { device: string; visits: number }[];
  browsers: { browser: string; visits: number }[];
  totals: { page_views: number; visits: number; requests: number; uniques: number };
}

const PUBLIC_HOST = 'rounlimited.com';
const isPublicPath = (p: string) => !p.startsWith('/admin') && !p.startsWith('/api') && !p.startsWith('/estimate/') && !p.startsWith('/i/') && !p.startsWith('/intake/');

export async function getTraffic(days: number): Promise<TrafficSummary> {
  const empty: TrafficSummary = { available: false, days: [], top_pages: [], referrers: [], countries: [], devices: [], browsers: [], totals: { page_views: 0, visits: 0, requests: 0, uniques: 0 } };
  const account = process.env.CF_ACCOUNT_ID; const zone = process.env.CF_ZONE_ID;
  if (!process.env.CF_ANALYTICS_TOKEN || !account || !zone) return { ...empty, error: 'Cloudflare analytics not configured' };

  const end = new Date(); const start = new Date(end.getTime() - days * 86400000);
  const iso = (d: Date) => d.toISOString();
  const dateOnly = (d: Date) => d.toISOString().slice(0, 10);
  const host = { requestHost: PUBLIC_HOST };
  // Public pages only: keep the admin app, API and customer document links out
  // of the marketing numbers; drop headless browsers (monitors/bots).
  const filter = {
    datetime_geq: iso(start), datetime_lt: iso(end), ...host,
    AND: [
      { requestPath_notlike: '/admin%' }, { requestPath_notlike: '/api%' },
      { requestPath_notlike: '/estimate/%' }, { requestPath_notlike: '/i/%' }, { requestPath_notlike: '/intake/%' },
      { userAgentBrowser_notlike: '%Headless%' },
    ],
  };

  const query = `query($account: String!, $zone: String!, $filter: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!, $dateGeq: Date!) {
    viewer {
      accounts(filter: { accountTag: $account }) {
        byDay: rumPageloadEventsAdaptiveGroups(limit: 100, filter: $filter, orderBy: [date_ASC]) { count sum { visits } dimensions { date } }
        byPath: rumPageloadEventsAdaptiveGroups(limit: 200, filter: $filter, orderBy: [count_DESC]) { count sum { visits } dimensions { requestPath } }
        byRef: rumPageloadEventsAdaptiveGroups(limit: 30, filter: $filter, orderBy: [sum_visits_DESC]) { sum { visits } dimensions { refererHost } }
        byCountry: rumPageloadEventsAdaptiveGroups(limit: 15, filter: $filter, orderBy: [sum_visits_DESC]) { sum { visits } dimensions { countryName } }
        byDevice: rumPageloadEventsAdaptiveGroups(limit: 5, filter: $filter, orderBy: [sum_visits_DESC]) { sum { visits } dimensions { deviceType } }
        byBrowser: rumPageloadEventsAdaptiveGroups(limit: 8, filter: $filter, orderBy: [sum_visits_DESC]) { sum { visits } dimensions { userAgentBrowser } }
      }
      zones(filter: { zoneTag: $zone }) {
        reqs: httpRequests1dGroups(limit: 100, filter: { date_geq: $dateGeq }, orderBy: [date_ASC]) { dimensions { date } sum { requests pageViews } uniq { uniques } }
      }
    }
  }`;
  try {
    const data = await gql(query, { account, zone, filter, dateGeq: dateOnly(start) });
    const acc = data.viewer.accounts[0] || {};
    const zoneData = data.viewer.zones[0] || {};
    const byPath = (acc.byPath || []).filter((r: any) => isPublicPath(r.dimensions.requestPath));
    const pv = (rows: any[]) => rows.reduce((s, r) => s + (r.count || 0), 0);
    const vis = (rows: any[]) => rows.reduce((s, r) => s + (r.sum?.visits || 0), 0);
    const reqs = zoneData.reqs || [];
    return {
      available: true,
      days: (() => {
        // Cloudflare omits days with no traffic; the chart wants every day.
        const got: Record<string, { page_views: number; visits: number }> = {};
        (acc.byDay || []).forEach((r: any) => { got[r.dimensions.date] = { page_views: r.count, visits: r.sum.visits }; });
        const out: { date: string; page_views: number; visits: number }[] = [];
        for (let i = days - 1; i >= 0; i--) { const d = dateOnly(new Date(end.getTime() - i * 86400000)); out.push({ date: d, ...(got[d] || { page_views: 0, visits: 0 }) }); }
        return out;
      })(),
      top_pages: byPath.slice(0, 12).map((r: any) => ({ path: r.dimensions.requestPath, page_views: r.count, visits: r.sum.visits })),
      referrers: (acc.byRef || []).filter((r: any) => r.dimensions.refererHost && !r.dimensions.refererHost.includes(PUBLIC_HOST)).slice(0, 8).map((r: any) => ({ host: r.dimensions.refererHost, visits: r.sum.visits })),
      countries: (acc.byCountry || []).map((r: any) => ({ country: r.dimensions.countryName || 'Unknown', visits: r.sum.visits })),
      devices: (acc.byDevice || []).map((r: any) => ({ device: r.dimensions.deviceType || 'Unknown', visits: r.sum.visits })),
      browsers: (acc.byBrowser || []).map((r: any) => ({ browser: r.dimensions.userAgentBrowser || 'Unknown', visits: r.sum.visits })),
      totals: {
        page_views: pv(byPath), visits: vis(byPath),
        requests: reqs.reduce((s: number, r: any) => s + (r.sum?.requests || 0), 0),
        uniques: reqs.reduce((s: number, r: any) => s + (r.uniq?.uniques || 0), 0),
      },
    };
  } catch (err: any) {
    return { ...empty, error: err?.message || 'Cloudflare query failed' };
  }
}
