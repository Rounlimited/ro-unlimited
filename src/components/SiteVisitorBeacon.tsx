'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Records each page view on the public site for the admin visitor log:
 * the page, where they came from, the device, and — when they leave — how long
 * the page was actually on screen, how far they scrolled, and whether they
 * touched, scrolled or moved the mouse (robots almost never do). Never runs
 * inside /admin. Nothing here can break the page.
 */
const uuid = () => {
  try { return crypto.randomUUID(); } catch { /* older browsers */ }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16); });
};
function sessionId() {
  try {
    const k = 'ro_sid'; const now = Date.now();
    const raw = sessionStorage.getItem(k);
    if (raw) { const [id, at] = raw.split('|'); if (now - Number(at) < 30 * 60000) { sessionStorage.setItem(k, `${id}|${now}`); return id; } }
    const id = uuid().slice(0, 18); sessionStorage.setItem(k, `${id}|${now}`); return id;
  } catch { return null; }
}
function send(body: Record<string, unknown>, leaving = false) {
  try {
    const json = JSON.stringify(body);
    if (leaving && navigator.sendBeacon) { navigator.sendBeacon('/api/v', new Blob([json], { type: 'text/plain' })); return; }
    fetch('/api/v', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: json, keepalive: true, credentials: 'same-origin' }).catch(() => {});
  } catch { /* never break the page */ }
}

export default function SiteVisitorBeacon() {
  const path = usePathname();
  useEffect(() => {
    if (!path || path.startsWith('/admin')) return;
    const id = uuid();
    const start = Date.now();
    let visibleMs = 0; let visibleSince = document.visibilityState === 'visible' ? Date.now() : 0;
    let maxScroll = 0; let inter = 0; let lastMove = 0; let ended = false;
    const clicks: string[] = [];

    const q = new URLSearchParams(location.search);
    const utm: Record<string, string> = {};
    q.forEach((v, k) => { if (/^utm_|^gclid$|^fbclid$/.test(k)) utm[k] = v; });
    const nav: any = navigator;
    send({
      t: 'view', id, sid: sessionId(), path, title: document.title,
      ref: document.referrer && !document.referrer.startsWith(location.origin) ? document.referrer : (document.referrer ? document.referrer : ''),
      utm: Object.keys(utm).length ? utm : null,
      screen: `${screen.width}x${screen.height}`, vp: `${innerWidth}x${innerHeight}`, dpr: devicePixelRatio,
      tz: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return null; } })(),
      lang: navigator.language || '', touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      wd: !!nav.webdriver, cores: nav.hardwareConcurrency || null, mem: nav.deviceMemory || null, conn: nav.connection?.effectiveType || null,
    });

    const onScroll = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      if (h > 0) maxScroll = Math.max(maxScroll, Math.min(100, Math.round((scrollY / h) * 100)));
    };
    const onScrollInter = () => { onScroll(); const n = Date.now(); if (n - lastMove > 700) { inter++; lastMove = n; } };
    const onMove = () => { const n = Date.now(); if (n - lastMove > 1500) { inter++; lastMove = n; } };
    const onTap = (e: Event) => {
      inter++;
      const el = (e.target as HTMLElement | null)?.closest?.('a,button');
      if (el && clicks.length < 30) {
        const href = (el as HTMLAnchorElement).getAttribute?.('href') || '';
        const label = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50);
        clicks.push(href ? `${label} → ${href}`.slice(0, 120) : label);
      }
    };
    const onKey = () => { inter++; };
    const onVis = () => {
      if (document.visibilityState === 'visible') visibleSince = Date.now();
      else { if (visibleSince) visibleMs += Date.now() - visibleSince; visibleSince = 0; finish(true); }
    };
    const finish = (leaving: boolean) => {
      const vis = visibleMs + (visibleSince ? Date.now() - visibleSince : 0);
      send({ t: 'end', id, dur: Date.now() - start, vis, scroll: maxScroll, inter, clicks }, leaving);
      if (!leaving) ended = true;
    };
    addEventListener('scroll', onScrollInter, { passive: true });
    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('pointerdown', onTap, { passive: true });
    addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVis);
    const onHide = () => finish(true);
    addEventListener('pagehide', onHide);
    onScroll();
    return () => {
      removeEventListener('scroll', onScrollInter); removeEventListener('pointermove', onMove); removeEventListener('pointerdown', onTap);
      removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onVis); removeEventListener('pagehide', onHide);
      if (!ended) finish(false);   // moving to another page inside the site
    };
  }, [path]);
  return null;
}
