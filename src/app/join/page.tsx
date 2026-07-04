'use client';

import { COMPANY } from '@/lib/constants';
import { ArrowRight, Phone, Shield, CheckCircle2, ChevronDown, Zap, Clock, Users, Wrench, Flame, HardHat, CircuitBoard, Droplets, Wind, Hammer, Send } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/components/animations/GSAPProvider';
import { usePrefersReducedMotion } from '@/components/animations/GSAPProvider';

const TRADES = [
  { id: 'electrician', title: 'Master Electricians', tagline: 'Commercial-grade. Code-current. No callbacks.', icon: Zap },
  { id: 'plumber', title: 'Licensed Plumbers', tagline: 'Rough-in through finish. Clean work, clean sites.', icon: Droplets },
  { id: 'framer', title: 'Structural Framers', tagline: 'Complex roofs, engineered trusses, custom floor plans.', icon: Hammer },
  { id: 'concrete', title: 'Concrete & Foundation', tagline: 'Footings, slabs, retaining walls — done right the first time.', icon: HardHat },
  { id: 'hvac', title: 'HVAC Professionals', tagline: 'Residential and commercial systems. Sized right, installed right.', icon: Wind },
  { id: 'finish', title: 'Finish Carpenters', tagline: 'The details that make a house a home.', icon: Wrench },
  { id: 'operator', title: 'Heavy Equipment Operators', tagline: 'Grading, excavation, and site work across three states.', icon: Flame },
  { id: 'pm', title: 'Project Managers', tagline: 'Run the job. Own the schedule. Deliver the result.', icon: CircuitBoard },
];

const STANDARDS = [
  { title: 'Licensed & Insured', desc: 'Current state licensing, liability insurance, and workers\' comp. Non-negotiable. We verify before you set foot on site.' },
  { title: 'Proven Track Record', desc: 'We don\'t work with unknowns. References checked. Work inspected. Callbacks tracked.' },
  { title: 'Shows Up On Time', desc: 'Every time. Not most of the time. Every time. Our clients depend on our schedule — and our schedule depends on you.' },
  { title: 'Communicates Like a Pro', desc: 'Returns calls. Sends updates. Flags issues before they become problems. Professionalism isn\'t optional.' },
  { title: 'Pride in the Work', desc: 'You don\'t just do the job — you own it. Your name is on every connection, every cut, every finish.' },
];

const BENEFITS = [
  { title: 'Consistent, Quality Projects', desc: 'No low-bid chaos. Real projects with real budgets and professional management.' },
  { title: 'Professional Job Sites', desc: 'One point of contact. Clear scope. Organized schedules. No runaround.' },
  { title: 'A Reputation Worth Having', desc: 'RO has been building trust for 25 years. Your work carries that name.' },
  { title: 'Tri-State Pipeline', desc: 'Georgia, South Carolina, North Carolina. Steady work across three states.' },
];

const TRADE_OPTIONS = [
  'Master Electrician', 'Licensed Plumber', 'Structural Framer', 'Concrete & Foundation',
  'HVAC Professional', 'Finish Carpenter / Trim', 'Heavy Equipment Operator',
  'Project Manager / Superintendent', 'Roofing', 'Painting', 'Drywall / Plaster',
  'Insulation', 'Tile / Flooring', 'Landscaping / Hardscape', 'Other',
];

export default function JoinPage() {
  const [mounted, setMounted] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const tradesRef = useRef<HTMLElement>(null);
  const standardsRef = useRef<HTMLElement>(null);
  const benefitsRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLElement>(null);

  // Form state
  const [form, setForm] = useState({ name: '', trade: '', yearsExperience: '', licensed: '', insured: '', serviceArea: '', specialty: '', phone: '', email: '', portfolioLink: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.trade || !form.phone) { setError('Name, trade, and phone are required.'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/trade-apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, licensed: form.licensed === 'yes', insured: form.insured === 'yes' }) });
      if (!res.ok) throw new Error('Submission failed');
      setSubmitted(true);
    } catch (e: any) { setError(e.message || 'Something went wrong.'); }
    setSubmitting(false);
  };

  // ═══ GSAP — industrial, precise, elite ═══
  useEffect(() => {
    if (!mounted || !containerRef.current || reducedMotion) return;
    const ctx = gsap.context(() => {

      if (heroRef.current) {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        const badge = heroRef.current.querySelector('.hero-badge');
        const h1 = heroRef.current.querySelector('h1');
        const line = heroRef.current.querySelector('.hero-gold-line');
        const desc = heroRef.current.querySelector('.hero-desc');
        if (badge) tl.fromTo(badge, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7 }, 0.2);
        if (h1) tl.fromTo(h1, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 0.3);
        if (line) tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 0.8, transformOrigin: 'left' }, 0.8);
        if (desc) tl.fromTo(desc, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 1.0);
      }

      if (tradesRef.current) {
        const cards = tradesRef.current.querySelectorAll('.trade-card');
        cards.forEach((c, i) => {
          gsap.fromTo(c, { y: 50, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 0.7, delay: i * 0.06, ease: 'power2.out',
              scrollTrigger: { trigger: c, start: 'top 90%', toggleActions: 'play none none reverse' } });
        });
      }

      if (standardsRef.current) {
        const items = standardsRef.current.querySelectorAll('.standard-item');
        items.forEach((item, i) => {
          gsap.fromTo(item, { x: i % 2 === 0 ? -80 : 80, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
              scrollTrigger: { trigger: item, start: 'top 88%', toggleActions: 'play none none reverse' } });
        });
      }

      if (benefitsRef.current) {
        const cards = benefitsRef.current.querySelectorAll('.benefit-card');
        gsap.fromTo(cards, { y: 40, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.1, duration: 0.7, ease: 'power2.out',
            scrollTrigger: { trigger: benefitsRef.current, start: 'top 80%' } });
      }

      if (formRef.current) {
        gsap.fromTo(formRef.current.querySelector('.form-inner'),
          { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: formRef.current, start: 'top 75%' } });
      }

    }, containerRef);
    return () => ctx.revert();
  }, [mounted, reducedMotion]);

  // NOTE: no !mounted gate here — the full page must be in the SSR HTML for SEO.
  // GSAP entrance animations still run post-mount via the mounted-gated effects.

  return (
    <div ref={containerRef}>

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 blueprint-overlay opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-ro-black/95 to-ro-black" />
        {/* Subtle structural grid lines */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute left-[15%] top-0 bottom-0 w-px bg-ro-gold" />
          <div className="absolute left-[50%] top-0 bottom-0 w-px bg-ro-gold" />
          <div className="absolute left-[85%] top-0 bottom-0 w-px bg-ro-gold" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
          <div className="max-w-3xl">
            <div className="hero-badge inline-flex items-center gap-2 px-5 py-2 border border-ro-gold/30 bg-ro-gold/5 mb-8">
              <Users size={14} className="text-ro-gold" />
              <span className="text-ro-gold text-xs font-mono tracking-[0.25em] uppercase">The RO Network</span>
            </div>
            <h1 className="text-ro-white font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight uppercase leading-[0.85] mb-6">
              We Don&apos;t<br /><span className="gradient-text-gold">Hire.</span><br />
              We <span className="gradient-text-gold">Partner.</span>
            </h1>
            <div className="hero-gold-line w-32 h-[2px] bg-gradient-to-r from-ro-gold via-ro-gold-light to-transparent mb-8" />
            <p className="hero-desc text-ro-gray-300 text-lg sm:text-xl leading-[1.8] max-w-xl">
              RO Unlimited is built on a network of elite trade professionals who hold themselves to the same standard we do.
              If you&apos;re the best at what you do, we want to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ WHO WE'RE LOOKING FOR ═══ */}
      <section ref={tradesRef} className="py-28 sm:py-36 relative overflow-hidden">
        <div className="absolute inset-0 steel-texture" />
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black/95 via-ro-black/90 to-ro-black/95" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">Who We&apos;re Looking For</span>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl tracking-tight uppercase">
              Elite <span className="gradient-text-gold">Trades</span>
            </h2>
            <p className="text-ro-gray-500 text-sm sm:text-base mt-4 max-w-lg mx-auto">
              We don&apos;t work with everyone. We work with the best.
            </p>
            <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ro-gold to-transparent mx-auto mt-6" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {TRADES.map((trade) => {
              const Icon = trade.icon;
              return (
                <div key={trade.id} className="trade-card group relative p-5 sm:p-6 border border-ro-gray-800/40 bg-ro-black/40 hover:border-ro-gold/30 hover:bg-ro-gold/[0.03] transition-all duration-500">
                  {/* Left accent line */}
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-ro-gold/10 group-hover:bg-ro-gold/50 transition-all duration-500" />
                  <div className="w-10 h-10 flex items-center justify-center border border-ro-gold/20 bg-ro-gold/5 mb-4 group-hover:border-ro-gold/40 group-hover:bg-ro-gold/10 transition-all duration-500">
                    <Icon size={18} className="text-ro-gold/70 group-hover:text-ro-gold transition-colors duration-500" />
                  </div>
                  <h3 className="text-ro-white font-heading text-sm sm:text-base tracking-wider uppercase mb-1 group-hover:text-ro-gold-light transition-colors duration-500">{trade.title}</h3>
                  <p className="text-ro-gray-600 text-xs leading-relaxed">{trade.tagline}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ THE STANDARD ═══ */}
      <section ref={standardsRef} className="py-28 sm:py-36 relative overflow-hidden">
        <div className="absolute inset-0 blueprint-overlay opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black to-ro-black/98" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">What We Expect</span>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl tracking-tight uppercase">
              The <span className="gradient-text-gold">Standard</span>
            </h2>
            <p className="text-ro-gray-500 text-sm mt-4 max-w-md mx-auto">
              This isn&apos;t a job application. It&apos;s a professional introduction. Here&apos;s what it takes.
            </p>
            <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ro-gold to-transparent mx-auto mt-6" />
          </div>
          <div className="space-y-4">
            {STANDARDS.map((s, i) => (
              <div key={i} className="standard-item relative flex gap-6 sm:gap-8 p-6 sm:p-8 border border-ro-gray-800/40 bg-ro-black/30 hover:border-ro-gold/20 transition-all duration-500 group">
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-ro-gold/20 group-hover:bg-ro-gold transition-all duration-500" />
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center border border-ro-gold/30 bg-ro-gold/5">
                  <span className="font-mono text-ro-gold text-xs font-bold">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div>
                  <h3 className="text-ro-white font-heading text-base sm:text-lg tracking-wider uppercase mb-1 group-hover:text-ro-gold-light transition-colors duration-500">{s.title}</h3>
                  <p className="text-ro-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHAT YOU GET ═══ */}
      <section ref={benefitsRef} className="py-28 sm:py-36 relative overflow-hidden">
        <div className="absolute inset-0 steel-texture" />
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black/95 to-ro-black" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">What You Get</span>
            <h2 className="text-ro-white font-heading text-4xl sm:text-5xl tracking-tight uppercase">
              Why <span className="gradient-text-gold">RO</span>
            </h2>
            <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-ro-gold to-transparent mx-auto mt-6" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {BENEFITS.map((b, i) => (
              <div key={i} className="benefit-card group relative p-8 border border-ro-gray-800/40 bg-ro-black/30 hover:border-ro-gold/20 hover:bg-ro-gold/[0.02] transition-all duration-500">
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-ro-gold/20 group-hover:border-ro-gold/50 transition-colors duration-500" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-ro-gold/20 group-hover:border-ro-gold/50 transition-colors duration-500" />
                <h3 className="text-ro-white font-heading text-base sm:text-lg tracking-wider uppercase mb-2 group-hover:text-ro-gold-light transition-colors duration-500">{b.title}</h3>
                <p className="text-ro-gray-500 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ APPLICATION FORM ═══ */}
      <section ref={formRef} className="py-28 sm:py-36 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-[#111] to-ro-black" />
        <div className="absolute inset-0 blueprint-overlay opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ro-gold/[0.03] rounded-full blur-3xl" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="form-inner">
            <div className="text-center mb-12">
              <span className="text-ro-gold text-xs font-mono tracking-[0.4em] uppercase block mb-4">Professional Inquiry</span>
              <h2 className="text-ro-white font-heading text-4xl sm:text-5xl tracking-tight uppercase mb-4">
                Submit Your <span className="gradient-text-gold">Interest</span>
              </h2>
              <p className="text-ro-gray-500 text-sm max-w-md mx-auto">
                This isn&apos;t a job application. It&apos;s a professional introduction. Tell us who you are and what you do.
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-16 border border-ro-gold/20 bg-ro-gold/[0.03]">
                <CheckCircle2 size={48} className="text-ro-gold mx-auto mb-6" />
                <h3 className="text-ro-white font-heading text-2xl tracking-wider uppercase mb-3">Received.</h3>
                <p className="text-ro-gray-400 text-sm max-w-sm mx-auto">
                  We review every submission personally. If your work aligns with our standard, we&apos;ll be in touch.
                </p>
              </div>
            ) : (
              <div className="border border-ro-gray-800/60 bg-ro-black/50 p-6 sm:p-10 relative">
                {/* Corner accents */}
                <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-ro-gold/20" />
                <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-ro-gold/20" />
                <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-ro-gold/20" />
                <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-ro-gold/20" />

                <div className="space-y-5">
                  {/* Row 1 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-ro-gray-500 text-xs uppercase tracking-wider mb-2">Full Name *</label>
                      <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                        className="w-full bg-ro-black border border-ro-gray-700 px-4 py-3 text-ro-white text-sm focus:border-ro-gold/50 focus:outline-none transition-colors" placeholder="Your name" />
                    </div>
                    <div>
                      <label className="block text-ro-gray-500 text-xs uppercase tracking-wider mb-2">Phone *</label>
                      <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                        className="w-full bg-ro-black border border-ro-gray-700 px-4 py-3 text-ro-white text-sm focus:border-ro-gold/50 focus:outline-none transition-colors" placeholder="(864) 000-0000" />
                    </div>
                  </div>
                  {/* Row 2 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-ro-gray-500 text-xs uppercase tracking-wider mb-2">Trade / Specialty *</label>
                      <select value={form.trade} onChange={e => setForm({...form, trade: e.target.value})}
                        className="w-full bg-ro-black border border-ro-gray-700 px-4 py-3 text-ro-white text-sm focus:border-ro-gold/50 focus:outline-none transition-colors">
                        <option value="">Select your trade</option>
                        {TRADE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-ro-gray-500 text-xs uppercase tracking-wider mb-2">Years of Experience</label>
                      <input type="text" value={form.yearsExperience} onChange={e => setForm({...form, yearsExperience: e.target.value})}
                        className="w-full bg-ro-black border border-ro-gray-700 px-4 py-3 text-ro-white text-sm focus:border-ro-gold/50 focus:outline-none transition-colors" placeholder="e.g. 10+" />
                    </div>
                  </div>

                  {/* Row 3 — Licensed / Insured */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-ro-gray-500 text-xs uppercase tracking-wider mb-2">Currently Licensed?</label>
                      <select value={form.licensed} onChange={e => setForm({...form, licensed: e.target.value})}
                        className="w-full bg-ro-black border border-ro-gray-700 px-4 py-3 text-ro-white text-sm focus:border-ro-gold/50 focus:outline-none transition-colors">
                        <option value="">Select</option><option value="yes">Yes</option><option value="no">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-ro-gray-500 text-xs uppercase tracking-wider mb-2">Currently Insured?</label>
                      <select value={form.insured} onChange={e => setForm({...form, insured: e.target.value})}
                        className="w-full bg-ro-black border border-ro-gray-700 px-4 py-3 text-ro-white text-sm focus:border-ro-gold/50 focus:outline-none transition-colors">
                        <option value="">Select</option><option value="yes">Yes</option><option value="no">No</option>
                      </select>
                    </div>
                  </div>
                  {/* Row 4 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-ro-gray-500 text-xs uppercase tracking-wider mb-2">Email</label>
                      <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                        className="w-full bg-ro-black border border-ro-gray-700 px-4 py-3 text-ro-white text-sm focus:border-ro-gold/50 focus:outline-none transition-colors" placeholder="your@email.com" />
                    </div>
                    <div>
                      <label className="block text-ro-gray-500 text-xs uppercase tracking-wider mb-2">Service Area</label>
                      <input type="text" value={form.serviceArea} onChange={e => setForm({...form, serviceArea: e.target.value})}
                        className="w-full bg-ro-black border border-ro-gray-700 px-4 py-3 text-ro-white text-sm focus:border-ro-gold/50 focus:outline-none transition-colors" placeholder="e.g. Upstate SC, North GA" />
                    </div>
                  </div>

                  {/* Specialty description */}
                  <div>
                    <label className="block text-ro-gray-500 text-xs uppercase tracking-wider mb-2">Tell Us About Your Work</label>
                    <textarea rows={4} value={form.specialty} onChange={e => setForm({...form, specialty: e.target.value})}
                      className="w-full bg-ro-black border border-ro-gray-700 px-4 py-3 text-ro-white text-sm focus:border-ro-gold/50 focus:outline-none transition-colors resize-none"
                      placeholder="What's your specialty? What kind of projects have you worked on? What sets you apart?" />
                  </div>
                  {/* Portfolio link */}
                  <div>
                    <label className="block text-ro-gray-500 text-xs uppercase tracking-wider mb-2">Portfolio / Website / Social (optional)</label>
                    <input type="url" value={form.portfolioLink} onChange={e => setForm({...form, portfolioLink: e.target.value})}
                      className="w-full bg-ro-black border border-ro-gray-700 px-4 py-3 text-ro-white text-sm focus:border-ro-gold/50 focus:outline-none transition-colors" placeholder="https://..." />
                  </div>
                  {/* Error */}
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  {/* Submit */}
                  <button onClick={handleSubmit} disabled={submitting}
                    className="group flex items-center justify-center gap-3 w-full px-8 py-4 bg-ro-gold text-ro-black font-heading text-sm tracking-[0.15em] uppercase hover:bg-ro-gold-light transition-all duration-300 disabled:opacity-50">
                    <Send size={16} />
                    {submitting ? 'Submitting...' : 'Submit Your Interest'}
                    {!submitting && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                  </button>
                </div>
              </div>
            )}

            {/* Bottom note */}
            <p className="text-ro-gray-700 text-xs text-center mt-8 max-w-sm mx-auto">
              We review every submission personally. No automated screening. No AI filtering.
              A real person reads every one.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
