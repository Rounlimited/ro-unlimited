/**
 * Industry Pulse — the numbers a GC owner glances at: material prices
 * (BLS Producer Price Index, month over month) and active weather alerts for
 * the Upstate counties where the crews are. Both are free, no keys.
 */
export interface MaterialPrice { key: string; label: string; series: string; period: string; value: number; prev: number; mom_pct: number }
export interface WeatherAlert { id: string; event: string; severity: string; headline: string; areas: string; onset: string | null; ends: string | null; url: string }
export interface Pulse { generated_at: string; materials: MaterialPrice[]; weather: WeatherAlert[] }

// BLS PPI commodity series (not seasonally adjusted)
const SERIES: { key: string; label: string; series: string }[] = [
  { key: 'lumber', label: 'Lumber & wood', series: 'WPU081' },
  { key: 'steel', label: 'Steel mill products', series: 'WPU1017' },
  { key: 'concrete', label: 'Concrete products', series: 'WPU1332' },
  { key: 'diesel', label: 'Diesel fuel', series: 'WPU057303' },
  { key: 'copper', label: 'Copper & brass mill shapes', series: 'WPU1022' },
  { key: 'gypsum', label: 'Gypsum products', series: 'WPU1342' },
];

export async function getMaterialPrices(): Promise<MaterialPrice[]> {
  const year = new Date().getFullYear();
  try {
    const res = await fetch('https://api.bls.gov/publicAPI/v1/timeseries/data/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seriesid: SERIES.map((s) => s.series), startyear: String(year - 1), endyear: String(year) }),
      cache: 'no-store',
    });
    const json = await res.json();
    if (json.status !== 'REQUEST_SUCCEEDED') return [];
    const out: MaterialPrice[] = [];
    for (const s of json.Results?.series || []) {
      const def = SERIES.find((d) => d.series === s.seriesID); if (!def) continue;
      const data = (s.data || []).filter((d: any) => /^M\d\d$/.test(d.period)); // monthly only
      if (data.length < 2) continue;
      const cur = Number(data[0].value), prev = Number(data[1].value);
      if (!cur || !prev) continue;
      out.push({ key: def.key, label: def.label, series: def.series, period: `${data[0].periodName} ${data[0].year}`, value: cur, prev, mom_pct: Math.round(((cur - prev) / prev) * 1000) / 10 });
    }
    return out;
  } catch { return []; }
}

// Upstate SC service area — NWS forecast zones & counties
const UPSTATE = /greenville|spartanburg|anderson|pickens|oconee|laurens|greenwood|cherokee|union|abbeville|york|polk|henderson/i;

export async function getWeatherAlerts(): Promise<WeatherAlert[]> {
  try {
    const res = await fetch('https://api.weather.gov/alerts/active?area=SC', {
      headers: { 'User-Agent': 'rounlimited.com admin (build@rounlimited.com)', Accept: 'application/geo+json' }, cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.features || [])
      .map((f: any) => f.properties)
      .filter((p: any) => UPSTATE.test(p.areaDesc || ''))
      .filter((p: any) => !/test/i.test(p.status || ''))
      .map((p: any) => ({
        id: p.id, event: p.event, severity: p.severity, headline: p.headline || p.event,
        areas: String(p.areaDesc || '').split(';').map((a: string) => a.trim()).filter((a: string) => UPSTATE.test(a)).slice(0, 5).join(', '),
        onset: p.onset || p.effective || null, ends: p.ends || p.expires || null,
        url: `https://forecast.weather.gov/MapClick.php?lat=34.85&lon=-82.39`,
      }))
      .slice(0, 6);
  } catch { return []; }
}

export async function buildPulse(): Promise<Pulse> {
  const [materials, weather] = await Promise.all([getMaterialPrices(), getWeatherAlerts()]);
  return { generated_at: new Date().toISOString(), materials, weather };
}
