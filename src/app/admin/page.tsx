'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Pencil, Mail, Camera, Settings, ExternalLink, Video, Image, FileText, ClipboardList } from 'lucide-react';
import { gsap } from 'gsap';

interface SiteSettings {
  heroVideoUrl?: string;
  heroVideoId?: string;
}

export default function AdminDashboard() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [projectCount, setProjectCount] = useState(0);

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(setSettings).catch(() => {});
    fetch('/api/admin/projects').then(r => r.json()).then(d => setProjectCount(Array.isArray(d) ? d.length : 0)).catch(() => {});
  }, []);

  const checklistRef = useRef<HTMLAnchorElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  // GSAP entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Stats cards stagger in from below
      if (statsRef.current) {
        gsap.fromTo(statsRef.current.children,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
        );
      }

      // Nav cards stagger in
      if (cardsRef.current) {
        gsap.fromTo(cardsRef.current.children,
          { y: 40, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.08, ease: 'power3.out', delay: 0.4 }
        );
      }

      // Launch Checklist card — ELITE perpetual animation system
      if (checklistRef.current) {
        const card = checklistRef.current;
        const introTl = gsap.timeline({ delay: 1.2 });

        // === PHASE 1: Initial dramatic entrance ===
        // Border ignition flash
        introTl.to(card, {
          borderColor: 'rgba(201,168,76,0.7)',
          boxShadow: '0 0 40px rgba(201,168,76,0.3), inset 0 0 40px rgba(201,168,76,0.08)',
          duration: 0.3, ease: 'power3.in',
        });
        // Scale punch
        introTl.to(card, { scale: 1.02, duration: 0.1, ease: 'power2.out' });
        introTl.to(card, { scale: 1, duration: 0.5, ease: 'elastic.out(1.2, 0.3)' });
        // Settle
        introTl.to(card, {
          borderColor: 'rgba(201,168,76,0.25)',
          boxShadow: '0 0 20px rgba(201,168,76,0.08)',
          duration: 0.4,
        });

        // === PHASE 2: Perpetual border glow runner ===
        // Create a conic-gradient border that rotates continuously
        introTl.call(() => {
          // Inject a rotating border element
          const wrapper = document.createElement('div');
          wrapper.style.cssText = 'position:absolute;inset:-2px;border-radius:inherit;z-index:0;pointer-events:none;overflow:hidden;opacity:0;';
          wrapper.innerHTML = `
            <div style="position:absolute;inset:0;border-radius:inherit;padding:2px;background:conic-gradient(from 0deg, transparent 0%, transparent 60%, rgba(201,168,76,0.6) 75%, rgba(201,168,76,1) 80%, rgba(201,168,76,0.6) 85%, transparent 100%);-webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;" class="conic-spinner"></div>
          `;
          card.insertBefore(wrapper, card.firstChild);

          // Fade in the wrapper
          gsap.to(wrapper, { opacity: 1, duration: 0.5 });

          // Spin the conic gradient continuously
          const spinner = wrapper.querySelector('.conic-spinner') as HTMLElement;
          if (spinner) {
            gsap.to(spinner, {
              rotation: 360,
              duration: 4,
              ease: 'none',
              repeat: -1,
              transformOrigin: 'center center',
            });
          }

          // Make sure card children are above
          Array.from(card.children).forEach((child: any) => {
            if (child !== wrapper) {
              child.style.position = 'relative';
              child.style.zIndex = '2';
            }
          });
        });

        // === PHASE 3: Continuous ambient glow breathing ===
        gsap.to(card, {
          boxShadow: '0 0 50px rgba(201,168,76,0.1), 0 0 100px rgba(201,168,76,0.03)',
          duration: 2.5, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 3,
        });

        // === PHASE 4: Status text "Action needed" pulsing ===
        const statusEl = card.querySelector('[data-checklist-status]');
        if (statusEl) {
          // Glow pulse on the text
          gsap.to(statusEl, {
            textShadow: '0 0 8px rgba(201,168,76,0.6), 0 0 16px rgba(201,168,76,0.3)',
            duration: 1, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 2.5,
          });
          // Subtle scale bounce
          gsap.to(statusEl, {
            scale: 1.08, duration: 0.6, ease: 'sine.inOut',
            repeat: -1, yoyo: true, delay: 2.5,
          });
        }

        // === PHASE 5: Periodic attention re-grab every 8 seconds ===
        gsap.timeline({ repeat: -1, delay: 8, repeatDelay: 8 })
          .to(card, {
            borderColor: 'rgba(201,168,76,0.5)',
            boxShadow: '0 0 50px rgba(201,168,76,0.2)',
            duration: 0.3, ease: 'power2.in',
          })
          .to(card, { scale: 1.008, duration: 0.1 })
          .to(card, { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' })
          .to(card, {
            borderColor: 'rgba(201,168,76,0.25)',
            boxShadow: '0 0 20px rgba(201,168,76,0.08)',
            duration: 0.5,
          });
      }
    });

    return () => ctx.revert();
  }, []);

  const cards = [
    {
      title: 'Launch Checklist',
      description: 'Everything needed to get your site 100% launch ready.',
      href: '/admin/checklist',
      icon: ClipboardList,
      status: 'Action needed',
      statusColor: 'text-[#C9A84C]',
      accent: '#C9A84C',
    },
    {
      title: 'Site Editor',
      description: 'Upload hero video, division videos, and manage media.',
      href: '/admin/site-editor',
      icon: Pencil,
      status: settings.heroVideoUrl ? 'Hero video active' : 'No hero video',
      statusColor: settings.heroVideoUrl ? 'text-green-400' : 'text-yellow-400',
      accent: '#C9A84C',
    },
    {
      title: 'Project Portfolio',
      description: 'Add and organize project photos for each division.',
      href: '/admin/projects',
      icon: Camera,
      status: projectCount > 0 ? projectCount + ' projects' : 'No projects yet',
      statusColor: projectCount > 0 ? 'text-green-400' : 'text-yellow-400',
      accent: '#C9A84C',
    },
    {
      title: 'Leads',
      description: 'View contact form submissions and inquiries.',
      href: '/admin/leads',
      icon: Mail,
      status: 'Coming soon',
      statusColor: 'text-white/30',
      accent: '#444',
    },
    {
      title: 'Settings',
      description: 'SEO, contact info, and general site configuration.',
      href: '/admin/settings',
      icon: Settings,
      status: 'Coming soon',
      statusColor: 'text-white/30',
      accent: '#444',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0f0f0f]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#C9A84C] flex items-center justify-center rounded">
              <span className="text-black font-bold text-sm tracking-wider">RoU</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Admin Dashboard</h1>
              <p className="text-[11px] text-white/30 tracking-wide uppercase">RO Unlimited Site Manager</p>
            </div>
          </div>
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/20 rounded transition-all"
          >
            <ExternalLink size={12} /> View Live Site
          </a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Quick Stats */}
        <div ref={statsRef} className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-[#111] border border-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Video size={14} className="text-[#C9A84C]" />
              <span className="text-[10px] text-white/30 uppercase tracking-wider">Hero Video</span>
            </div>
            <div className={`text-sm font-medium ${settings.heroVideoUrl ? 'text-green-400' : 'text-yellow-400'}`}>
              {settings.heroVideoUrl ? 'Active' : 'Not Set'}
            </div>
          </div>
          <div className="bg-[#111] border border-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Image size={14} className="text-[#C9A84C]" />
              <span className="text-[10px] text-white/30 uppercase tracking-wider">Projects</span>
            </div>
            <div className="text-sm font-medium text-white/60">{projectCount} uploaded</div>
          </div>
          <div className="bg-[#111] border border-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={14} className="text-[#C9A84C]" />
              <span className="text-[10px] text-white/30 uppercase tracking-wider">Pages</span>
            </div>
            <div className="text-sm font-medium text-white/60">6 live</div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div ref={cardsRef} className="grid grid-cols-2 gap-4">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              ref={card.title === 'Launch Checklist' ? checklistRef : undefined}
              className={`group bg-[#111] border rounded-lg p-6 transition-all hover:bg-[#111]/80 ${
                card.title === 'Launch Checklist'
                  ? 'border-[#C9A84C]/20 col-span-2 relative overflow-hidden'
                  : 'border-white/5 hover:border-[#C9A84C]/20'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-white/5 group-hover:bg-[#C9A84C]/10 flex items-center justify-center rounded transition-colors">
                  <card.icon size={18} className="text-white/30 group-hover:text-[#C9A84C] transition-colors" />
                </div>
                <span className={`text-[10px] font-mono ${card.statusColor}`} {...(card.title === 'Launch Checklist' ? {'data-checklist-status': true} : {})}>{card.status}</span>
              </div>
              <h2 className={`text-base font-semibold mb-1 transition-colors ${card.title === 'Launch Checklist' ? 'text-[#C9A84C] text-lg' : 'group-hover:text-[#C9A84C]'}`}>{card.title}</h2>
              <p className="text-xs text-white/30 leading-relaxed">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}



