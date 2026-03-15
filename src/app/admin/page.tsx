'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import {
  Video, FileText, ArrowUpRight, CheckCircle2,
  AlertCircle, Pencil, Camera, Clock, MessageCircle, Mail
} from 'lucide-react';

interface SiteSettings { heroVideoUrl?: string; }

export default function AdminDashboard() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [projectCount, setProjectCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const emailBtnRef = useRef<HTMLAnchorElement>(null);

  // Splash refs
  const splashRef      = useRef<HTMLDivElement>(null);
  const splashRoRef    = useRef<HTMLImageElement>(null);
  const gridRef        = useRef<HTMLDivElement>(null);
  const scanRef        = useRef<HTMLDivElement>(null);
  const cornerTLRef    = useRef<HTMLDivElement>(null);
  const cornerTRRef    = useRef<HTMLDivElement>(null);
  const cornerBLRef    = useRef<HTMLDivElement>(null);
  const cornerBRRef    = useRef<HTMLDivElement>(null);
  const coordRef       = useRef<HTMLDivElement>(null);
  const hLine1Ref      = useRef<HTMLDivElement>(null);
  const hLine2Ref      = useRef<HTMLDivElement>(null);
  const vLine1Ref      = useRef<HTMLDivElement>(null);
  const vLine2Ref      = useRef<HTMLDivElement>(null);

  // Dashboard refs
  const row1Ref        = useRef<HTMLDivElement>(null);
  const row2Ref        = useRef<HTMLAnchorElement>(null);
  const row3Ref        = useRef<HTMLDivElement>(null);
  const activityRef    = useRef<HTMLDivElement>(null);
  const card1Ref       = useRef<HTMLDivElement>(null);
  const card2Ref       = useRef<HTMLDivElement>(null);
  const card3Ref       = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(setSettings).catch(() => {});
    fetch('/api/admin/projects').then(r => r.json()).then(d => setProjectCount(Array.isArray(d) ? d.length : 0)).catch(() => {});
    // Fetch unread inbox count
    fetch('/api/email/threads?folder=inbox')
      .then(r => r.json())
      .then(data => {
        if (data?.threads) {
          const unread = data.threads.reduce((sum: number, t: any) => sum + (t.unread_count || 0), 0);
          setUnreadCount(unread);
        }
      })
      .catch(() => {});
    // Poll for new mail every 30s
    const interval = setInterval(() => {
      fetch('/api/email/threads?folder=inbox')
        .then(r => r.json())
        .then(data => {
          if (data?.threads) {
            setUnreadCount(data.threads.reduce((sum: number, t: any) => sum + (t.unread_count || 0), 0));
          }
        })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ── Initial hide state ──
      gsap.set([row1Ref.current, row2Ref.current, row3Ref.current], { opacity: 0, y: 20 });
      gsap.set(activityRef.current, { opacity: 0, y: 20 });
      gsap.set([card1Ref.current, card2Ref.current, card3Ref.current], { opacity: 0, x: 50 });
      gsap.set(splashRef.current, { opacity: 1 });
      gsap.set(splashRoRef.current, { opacity: 0, scale: 0.88 });
      gsap.set(gridRef.current, { opacity: 0 });
      gsap.set(scanRef.current, { opacity: 0, scaleX: 0, transformOrigin: 'left center' });
      gsap.set([cornerTLRef.current, cornerTRRef.current, cornerBLRef.current, cornerBRRef.current], { opacity: 0, scale: 0.6 });
      gsap.set(coordRef.current, { opacity: 0 });
      gsap.set([hLine1Ref.current, hLine2Ref.current], { scaleX: 0, opacity: 0, transformOrigin: 'left center' });
      gsap.set([vLine1Ref.current, vLine2Ref.current], { scaleY: 0, opacity: 0, transformOrigin: 'center top' });

      const headerEl = document.querySelector('[data-admin-header]');
      if (headerEl) gsap.set(headerEl, { opacity: 0, y: -30 });

      const tl = gsap.timeline();

      // ── PHASE 1: RO materializes ──
      tl.to(splashRoRef.current, {
        opacity: 0.9, scale: 1,
        duration: 1.0, ease: 'power2.out',
      })

      // ── PHASE 2: Blueprint draws in while RO holds ──
      // Grid fades in
      .to(gridRef.current, { opacity: 1, duration: 0.5, ease: 'power1.out' }, '-=0.1')

      // Horizontal laser lines draw across (staggered)
      .to(hLine1Ref.current, { scaleX: 1, opacity: 1, duration: 0.6, ease: 'power2.inOut' }, '-=0.2')
      .to(hLine2Ref.current, { scaleX: 1, opacity: 1, duration: 0.6, ease: 'power2.inOut' }, '-=0.4')

      // Vertical laser lines drop down
      .to(vLine1Ref.current, { scaleY: 1, opacity: 1, duration: 0.5, ease: 'power2.inOut' }, '-=0.4')
      .to(vLine2Ref.current, { scaleY: 1, opacity: 1, duration: 0.5, ease: 'power2.inOut' }, '-=0.35')

      // Corner crosshairs lock in
      .to([cornerTLRef.current, cornerBRRef.current], {
        opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)',
      }, '-=0.2')
      .to([cornerTRRef.current, cornerBLRef.current], {
        opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)',
      }, '-=0.15')

      // Scan line sweeps down
      .to(scanRef.current, {
        opacity: 0.7, scaleX: 1, duration: 0.4, ease: 'power1.in',
        onComplete: () => {
          gsap.to(scanRef.current, { opacity: 0, duration: 0.3, delay: 0.05 });
        }
      }, '-=0.1')

      // Coordinate text flickers in
      .to(coordRef.current, {
        opacity: 1, duration: 0.15, ease: 'none',
        onComplete: () => {
          // Typewriter flicker effect
          let count = 0;
          const flicker = setInterval(() => {
            if (coordRef.current) {
              coordRef.current.style.opacity = count % 2 === 0 ? '0' : '1';
              count++;
              if (count > 5) {
                coordRef.current.style.opacity = '1';
                clearInterval(flicker);
              }
            }
          }, 80);
        }
      }, '-=0.2')

      // RO breathes while blueprint is visible
      .to(splashRoRef.current, {
        scale: 1.04, opacity: 1,
        duration: 1.1, ease: 'sine.inOut',
        yoyo: true, repeat: 1,
      }, '-=0.3')

      // ── PHASE 3: Everything dissolves, dashboard assembles ──
      .to(splashRef.current, {
        opacity: 0, duration: 0.75, ease: 'power2.inOut',
        onComplete: () => {
          if (splashRef.current) splashRef.current.style.pointerEvents = 'none';
        },
      }, '+=0.15')

      // Cards slide in from right
      .to(activityRef.current, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, '-=0.35')
      .to(card1Ref.current,    { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' }, '-=0.05')
      .to(card2Ref.current,    { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' }, '-=0.22')
      .to(card3Ref.current,    { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' }, '-=0.22')
      .to(row3Ref.current,     { opacity: 1, y: 0, duration: 0.4,  ease: 'power3.out' }, '-=0.18')
      .to(row2Ref.current,     { opacity: 1, y: 0, duration: 0.4,  ease: 'power3.out' }, '-=0.2')
      .to(row1Ref.current,     { opacity: 1, y: 0, duration: 0.4,  ease: 'power3.out' }, '-=0.2')
      .to(headerEl,            { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' }, '-=0.1');
    });

    return () => ctx.revert();
  }, []);

  const hasVideo = !!settings.heroVideoUrl;
  const BLUE = '#00d4ff';
  const GLOW = '0 0 6px #00d4ff, 0 0 18px #00aaee, 0 0 40px #0077cc';

  return (
    <>
      {/* ════════════════════════════════════
          SPLASH — black + RO + blueprint
      ════════════════════════════════════ */}
      <div
        ref={splashRef}
        className="fixed inset-0 bg-[#020b12] flex items-center justify-center"
        style={{ zIndex: 100 }}
      >
        {/* Blueprint grid */}
        <div
          ref={gridRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,180,255,0.07) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,180,255,0.07) 1px, transparent 1px)
            `,
            backgroundSize: '44px 44px',
          }}
        />

        {/* Horizontal laser lines */}
        <div ref={hLine1Ref} className="absolute left-0 right-0 pointer-events-none"
          style={{ top: '34%', height: '1px', background: BLUE, boxShadow: GLOW }} />
        <div ref={hLine2Ref} className="absolute left-0 right-0 pointer-events-none"
          style={{ top: '66%', height: '1px', background: BLUE, boxShadow: GLOW }} />

        {/* Vertical laser lines */}
        <div ref={vLine1Ref} className="absolute top-0 bottom-0 pointer-events-none"
          style={{ left: '22%', width: '1px', background: BLUE, boxShadow: GLOW }} />
        <div ref={vLine2Ref} className="absolute top-0 bottom-0 pointer-events-none"
          style={{ left: '78%', width: '1px', background: BLUE, boxShadow: GLOW }} />

        {/* Scan line */}
        <div ref={scanRef} className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: '50%',
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${BLUE}, ${BLUE}, transparent)`,
            boxShadow: GLOW,
          }} />

        {/* Corner crosshairs */}
        {/* Top-left */}
        <div ref={cornerTLRef} className="absolute pointer-events-none" style={{ top: '18%', left: '10%' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 2 L2 2 L2 14" stroke={BLUE} strokeWidth="1.5" style={{ filter: `drop-shadow(${GLOW})` }} />
            <circle cx="2" cy="2" r="2" fill={BLUE} style={{ filter: `drop-shadow(${GLOW})` }} />
          </svg>
        </div>
        {/* Top-right */}
        <div ref={cornerTRRef} className="absolute pointer-events-none" style={{ top: '18%', right: '10%' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 2 L26 2 L26 14" stroke={BLUE} strokeWidth="1.5" style={{ filter: `drop-shadow(${GLOW})` }} />
            <circle cx="26" cy="2" r="2" fill={BLUE} style={{ filter: `drop-shadow(${GLOW})` }} />
          </svg>
        </div>
        {/* Bottom-left */}
        <div ref={cornerBLRef} className="absolute pointer-events-none" style={{ bottom: '18%', left: '10%' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 26 L2 26 L2 14" stroke={BLUE} strokeWidth="1.5" style={{ filter: `drop-shadow(${GLOW})` }} />
            <circle cx="2" cy="26" r="2" fill={BLUE} style={{ filter: `drop-shadow(${GLOW})` }} />
          </svg>
        </div>
        {/* Bottom-right */}
        <div ref={cornerBRRef} className="absolute pointer-events-none" style={{ bottom: '18%', right: '10%' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M14 26 L26 26 L26 14" stroke={BLUE} strokeWidth="1.5" style={{ filter: `drop-shadow(${GLOW})` }} />
            <circle cx="26" cy="26" r="2" fill={BLUE} style={{ filter: `drop-shadow(${GLOW})` }} />
          </svg>
        </div>

        {/* RO mark */}
        <div className="relative flex flex-col items-center gap-6">
          <img
            ref={splashRoRef}
            src="/ro-icon.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none"
            style={{
              width: '72vw',
              maxWidth: '340px',
              objectFit: 'fill',
              transform: 'scaleY(1.35)',
              transformOrigin: 'center center',
            }}
          />

          {/* Coordinate readout below RO */}
          <div
            ref={coordRef}
            className="font-mono text-center pointer-events-none select-none"
            style={{ color: BLUE, textShadow: `0 0 8px ${BLUE}, 0 0 20px #0077cc` }}
          >
            <div style={{ fontSize: '9px', letterSpacing: '0.2em', opacity: 0.7 }}>
              SYS · ADMIN · PORTAL
            </div>
            <div style={{ fontSize: '8px', letterSpacing: '0.15em', opacity: 0.45, marginTop: '4px' }}>
              34.8527° N · 82.3940° W · UPSTATE SC
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════
          DASHBOARD
      ════════════════════════════════════ */}
      <div className="flex flex-col h-full px-3 py-3 gap-3 relative">

        {/* Dim RO watermark */}
        <img src="/ro-icon.svg" alt="" aria-hidden="true"
          className="absolute pointer-events-none select-none"
          style={{
            opacity: 0.05, width: '80vw', left: '10vw', top: '50%',
            transform: 'translateY(-50%) scaleY(1.4)',
            transformOrigin: 'center center', objectFit: 'fill', zIndex: 0,
          }}
        />

        {/* Row 1: Stats */}
        <div ref={row1Ref} className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">Dashboard</h2>
            <p className="text-[11px] text-white/25 uppercase tracking-wider">Site overview</p>
          </div>
          <div className="flex gap-1.5">
            <div className="bg-[#141414] border border-white/5 rounded-lg px-3 py-2 text-center min-w-[65px]">
              <p className="text-[10px] text-white/25 uppercase tracking-wider leading-none">Hero</p>
              <p className={`text-[13px] font-semibold leading-tight mt-0.5 ${hasVideo ? 'text-green-400' : 'text-yellow-400'}`}>
                {hasVideo ? 'Active' : 'None'}
              </p>
            </div>
            <div className="bg-[#141414] border border-white/5 rounded-lg px-3 py-2 text-center min-w-[65px]">
              <p className="text-[10px] text-white/25 uppercase tracking-wider leading-none">Projects</p>
              <p className="text-[13px] font-semibold text-white/50 leading-tight mt-0.5">{projectCount}</p>
            </div>
            <div className="bg-[#141414] border border-white/5 rounded-lg px-3 py-2 text-center min-w-[65px]">
              <p className="text-[10px] text-white/25 uppercase tracking-wider leading-none">Pages</p>
              <p className="text-[13px] font-semibold text-white/50 leading-tight mt-0.5">6</p>
            </div>
          </div>
        </div>

        {/* Row 2: Checklist CTA */}
        <Link ref={row2Ref} href="/admin/checklist"
          className="block bg-gradient-to-r from-[#C9A84C]/10 to-transparent border border-[#C9A84C]/20 rounded-xl px-3 py-2.5 group relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-[#C9A84C] flex-shrink-0" />
              <div>
                <h3 className="text-base font-bold text-white leading-tight">Launch Checklist</h3>
                <p className="text-[12px] text-white/25">Items needed to go live</p>
              </div>
            </div>
            <ArrowUpRight size={16} className="text-[#C9A84C] flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </Link>

        {/* Row 3: Quick Actions */}
        <div ref={row3Ref} className="grid grid-cols-4 gap-2 relative z-10">
          {/* Email — standout blue icon */}
          <Link href="/admin/inbox"
            className="relative border border-[#2a6aaa]/30 rounded-xl p-2.5 flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(145deg, #0c1a2e, #0a1220)' }}
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(145deg, #3b8dd4, #1B6AB5)',
                  boxShadow: '0 4px 15px rgba(59,141,212,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}>
                <Mail size={22} className="text-white drop-shadow-sm" />
              </div>
              {unreadCount > 0 && (
                <>
                  <span className="absolute -top-2 -right-2 min-w-[20px] h-[20px] flex items-center justify-center rounded-full text-[10px] font-bold px-1 shadow-lg"
                    style={{ background: '#ef4444', color: 'white', boxShadow: '0 2px 8px rgba(239,68,68,0.5)' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                  <span className="absolute -top-2 -right-2 min-w-[20px] h-[20px] rounded-full bg-red-500 animate-ping opacity-30" />
                </>
              )}
            </div>
            <p className="text-[11px] font-semibold text-center leading-tight" style={{ color: '#5ba3dc' }}>Email</p>
          </Link>
          {[
            { href: '/admin/site-editor', icon: Pencil, label: 'Editor' },
            { href: '/admin/projects',    icon: Camera, label: 'Portfolio' },
            { href: '/admin/checklist',   icon: FileText, label: 'Pages' },
          ].map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}
              className="bg-[#141414] border border-white/5 rounded-xl p-2.5 flex flex-col items-center gap-1.5 group">
              <div className="w-11 h-11 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center">
                <Icon size={20} className="text-[#C9A84C]" />
              </div>
              <p className="text-[11px] text-white/40 text-center leading-tight">{label}</p>
            </Link>
          ))}
        </div>

        {/* Row 4: Activity */}
        <div ref={activityRef} className="flex-1 min-h-0 flex flex-col relative z-10">
          <p className="text-[11px] text-white/20 uppercase tracking-wider mb-2 px-0.5">Recent Activity</p>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 scrollbar-hide">
            <div ref={card1Ref} className="bg-[#141414]/40 border border-white/5 rounded-lg px-3 py-2 flex items-center gap-2.5 backdrop-blur-sm">
              <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={11} className="text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-white/60 leading-tight">Hero video uploaded</p>
                <p className="text-[11px] text-white/15">Sequence 01.mp4</p>
              </div>
              <span className="text-[10px] text-white/10 flex-shrink-0">Today</span>
            </div>
            <div ref={card2Ref} className="bg-[#141414]/40 border border-white/5 rounded-lg px-3 py-2 flex items-center gap-2.5 backdrop-blur-sm">
              <div className="w-6 h-6 rounded-full bg-[#C9A84C]/10 flex items-center justify-center flex-shrink-0">
                <Clock size={11} className="text-[#C9A84C]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-white/60 leading-tight">Admin portal launched</p>
                <p className="text-[11px] text-white/15">Dashboard, checklist, editor</p>
              </div>
              <span className="text-[10px] text-white/10 flex-shrink-0">Today</span>
            </div>
            <div ref={card3Ref} className="bg-[#141414]/40 border border-white/5 rounded-lg px-3 py-2 flex items-center gap-2.5 backdrop-blur-sm">
              <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <FileText size={11} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-white/60 leading-tight">Website deployed</p>
                <p className="text-[11px] text-white/15">rounlimited.com</p>
              </div>
              <span className="text-[10px] text-white/10 flex-shrink-0">Today</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
