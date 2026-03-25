'use client';

import { useRef, useState } from 'react';
import { COMPANY } from '@/lib/constants';
import {
  RFP_PROJECT_TYPES,
  RFP_SCOPES,
  RFP_BUDGET_RANGES,
  RFP_REFERRAL_SOURCES,
} from '@/lib/rfp-contact';
import { Phone, Mail, MapPin, Send, Facebook, CheckCircle, AlertCircle, Loader2, FileText, Clock3, ShieldCheck, Building2 } from 'lucide-react';
import { gsap, useGSAP } from '@/components/animations/GSAPProvider';
import SectionTransition from '@/components/animations/SectionTransition';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const initialForm = {
  organizationName: '',
  contactName: '',
  email: '',
  phone: '',
  projectType: '',
  scope: '',
  squareFootage: '',
  locationCityState: '',
  desiredStartDate: '',
  budgetRange: '',
  description: '',
  referralSource: '',
};

const CONTACT_PILLARS = [
  {
    icon: Clock3,
    title: 'Fast first response',
    copy: 'Serious scopes get a direct follow-up from RO, not a canned handoff.',
  },
  {
    icon: ShieldCheck,
    title: 'Clear next steps',
    copy: 'We look at timing, scope, site realities, and what it takes to move cleanly.',
  },
  {
    icon: Building2,
    title: 'Built for real work',
    copy: 'Restaurant, retail, build-out, ground-up, and commercial site-driven jobs all belong here.',
  },
] as const;

/**
 * Commercial RFP contact page.
 * GPT-5.4 handoff: improve layout, visual hierarchy, and motion only — keep `name` attributes,
 * option `value`s from @/lib/rfp-contact, and POST /api/contact JSON shape unchanged.
 */
export default function ContactPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const pillarRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contactCardRefs = useRef<(HTMLAnchorElement | HTMLDivElement | null)[]>([]);
  const formPanelRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState(initialForm);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useGSAP(() => {
    if (!pageRef.current) return;

    const hero = pageRef.current.querySelector('.contact-hero');
    const heroBits = hero?.querySelectorAll('.hero-bit');
    if (heroBits?.length) {
      gsap.fromTo(heroBits,
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.65, ease: 'power3.out' }
      );
    }

    pillarRefs.current.forEach((card, index) => {
      if (!card) return;
      gsap.fromTo(card,
        { y: 30, opacity: 0, scale: 0.97 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.65,
          delay: index * 0.08,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 84%', toggleActions: 'play none none none' },
        }
      );
    });

    contactCardRefs.current.forEach((card, index) => {
      if (!card) return;
      gsap.fromTo(card,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          delay: index * 0.06,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none none' },
        }
      );
    });

    if (formPanelRef.current) {
      const formBits = formPanelRef.current.querySelectorAll('.form-bit');
      gsap.fromTo(formPanelRef.current,
        { y: 36, opacity: 0, scale: 0.98, clipPath: 'inset(10% 0% 0% 0%)' },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: formPanelRef.current, start: 'top 78%', toggleActions: 'play none none none' },
        }
      );
      if (formBits.length) {
        gsap.fromTo(formBits,
          { y: 16, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.04,
            duration: 0.3,
            ease: 'power2.out',
            scrollTrigger: { trigger: formPanelRef.current, start: 'top 78%', toggleActions: 'play none none none' },
          }
        );
      }
    }
  }, { scope: pageRef });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong.');
        setStatus('error');
        return;
      }

      setStatus('success');
      setFormData(initialForm);
    } catch {
      setErrorMsg('Network error. Please call us directly at (864) 304-0139.');
      setStatus('error');
    }
  };

  const inputClass =
    'w-full bg-ro-black/72 border border-ro-gray-700 px-4 py-3 text-ro-white text-base sm:text-sm focus:border-ro-gold/50 focus:outline-none transition-colors';
  const labelClass = 'block text-ro-gray-400 text-[13px] sm:text-xs uppercase tracking-wider mb-2';

  return (
    <main ref={pageRef} className="overflow-x-hidden bg-ro-black">
      <section className="contact-hero relative flex min-h-[92svh] items-center overflow-hidden">
        <div className="absolute inset-0 blueprint-overlay opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-ro-black/95 to-ro-black" />
        <div className="absolute left-[-12%] top-[8%] h-[260px] w-[260px] rounded-full bg-ro-gold/12 blur-3xl pointer-events-none" />
        <div className="absolute right-[-10%] top-[36%] h-[240px] w-[240px] rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
          <div className="max-w-5xl">
          <span className="hero-bit text-ro-gold text-[11px] sm:text-xs font-mono tracking-[0.3em] uppercase mb-4 block">
            Commercial RFP
          </span>
          <h1 className="hero-bit text-ro-white font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight uppercase mb-4 leading-[0.9]">
            Bring the <span className="gradient-text-gold">Real Scope</span>
          </h1>
          <div className="hero-bit w-24 gold-line mb-6" />
          <div className="hero-bit relative max-w-3xl overflow-hidden border border-ro-gold/14 bg-gradient-to-br from-ro-black/72 via-ro-black/56 to-ro-black/28 p-5 shadow-[0_18px_54px_rgba(0,0,0,0.24)] sm:p-7">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ro-gold/45 to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,168,76,0.12),transparent_38%),linear-gradient(180deg,rgba(0,0,0,0.18),rgba(0,0,0,0.02))]" />
            <p className="relative text-lg max-w-2xl leading-relaxed text-ro-gray-300">
              Send the site, the timing, the budget range, or the full vision. For restaurant, retail, renovation, build-out, and ground-up work, this is where serious projects start.
            </p>
            <div className="relative mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {CONTACT_PILLARS.map((pillar, index) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    ref={(el) => { pillarRefs.current[index] = el; }}
                    className="overflow-hidden border border-ro-gold/12 bg-ro-black/26 p-4"
                  >
                    <Icon size={16} className="text-ro-gold mb-3" />
                    <h3 className="text-ro-white font-heading text-sm tracking-wider uppercase mb-2">{pillar.title}</h3>
                    <p className="text-ro-gray-400 text-sm leading-relaxed">{pillar.copy}</p>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </div>
      </section>

      <SectionTransition label="FLOOR 10" title="Direct Contact" featured sparks />

      <section className="py-16 sm:py-24" data-page="commercial-rfp">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h3 className="text-ro-gold font-heading text-sm tracking-[0.2em] uppercase mb-6">Direct contact</h3>
                <div className="space-y-4">
                  <a
                    href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`}
                    ref={(el) => { contactCardRefs.current[0] = el; }}
                    className="flex items-center gap-4 border border-ro-gray-800/60 bg-ro-black/28 p-4 text-ro-gray-300 hover:text-ro-gold hover:border-ro-gold/20 transition-colors group"
                  >
                    <div className="w-10 h-10 border border-ro-gray-700 group-hover:border-ro-gold/30 flex items-center justify-center transition-colors">
                      <Phone size={16} className="text-ro-gold/60" />
                    </div>
                    <div>
                      <div className="text-[13px] sm:text-xs text-ro-gray-500 uppercase tracking-wider">Phone</div>
                      <div className="font-mono text-base sm:text-sm">{COMPANY.phone}</div>
                    </div>
                  </a>
                  <a
                    href={`mailto:${COMPANY.email}`}
                    ref={(el) => { contactCardRefs.current[1] = el; }}
                    className="flex items-center gap-4 border border-ro-gray-800/60 bg-ro-black/28 p-4 text-ro-gray-300 hover:text-ro-gold hover:border-ro-gold/20 transition-colors group"
                  >
                    <div className="w-10 h-10 border border-ro-gray-700 group-hover:border-ro-gold/30 flex items-center justify-center transition-colors">
                      <Mail size={16} className="text-ro-gold/60" />
                    </div>
                    <div>
                      <div className="text-[13px] sm:text-xs text-ro-gray-500 uppercase tracking-wider">Email</div>
                      <div className="text-sm sm:text-sm">{COMPANY.email}</div>
                    </div>
                  </a>
                  <div
                    ref={(el) => { contactCardRefs.current[2] = el; }}
                    className="flex items-center gap-4 border border-ro-gray-800/60 bg-ro-black/28 p-4 text-ro-gray-300"
                  >
                    <div className="w-10 h-10 border border-ro-gray-700 flex items-center justify-center">
                      <MapPin size={16} className="text-ro-gold/60" />
                    </div>
                    <div>
                      <div className="text-[13px] sm:text-xs text-ro-gray-500 uppercase tracking-wider">Service area</div>
                      <div className="text-sm">{COMPANY.serviceArea}</div>
                    </div>
                  </div>
                  <a
                    href={COMPANY.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    ref={(el) => { contactCardRefs.current[3] = el; }}
                    className="flex items-center gap-4 border border-ro-gray-800/60 bg-ro-black/28 p-4 text-ro-gray-300 hover:text-ro-gold hover:border-ro-gold/20 transition-colors group"
                  >
                    <div className="w-10 h-10 border border-ro-gray-700 group-hover:border-ro-gold/30 flex items-center justify-center transition-colors">
                      <Facebook size={16} className="text-ro-gold/60" />
                    </div>
                    <div>
                      <div className="text-[13px] sm:text-xs text-ro-gray-500 uppercase tracking-wider">Facebook</div>
                      <div className="text-sm">Follow RO Unlimited</div>
                    </div>
                  </a>
                </div>
              </div>

              <div
                ref={(el) => { contactCardRefs.current[4] = el; }}
                className="border border-ro-gold/12 bg-gradient-to-br from-ro-black/60 via-ro-black/46 to-ro-black/24 p-5"
              >
                <div className="text-ro-gold text-[11px] font-mono uppercase tracking-[0.28em] mb-3">What helps us move fast</div>
                <ul className="space-y-3 text-sm leading-relaxed text-ro-gray-400">
                  <li className="flex gap-3">
                    <CheckCircle size={14} className="mt-1 text-ro-gold/70 flex-shrink-0" />
                    Location, timing, and rough budget range
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle size={14} className="mt-1 text-ro-gold/70 flex-shrink-0" />
                    Whether this is ground-up, build-out, or renovation
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle size={14} className="mt-1 text-ro-gold/70 flex-shrink-0" />
                    Any brand standards, schedule pressure, or inspection realities
                  </li>
                </ul>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div ref={formPanelRef} className="relative border border-ro-gray-800 bg-ro-gray-900/30 p-6 sm:p-10 shadow-[0_18px_54px_rgba(0,0,0,0.22)]">
                <div className="absolute top-3 left-3 w-2 h-2 border-t border-l border-ro-gold/20" />
                <div className="absolute top-3 right-3 w-2 h-2 border-t border-r border-ro-gold/20" />
                <div className="absolute bottom-3 left-3 w-2 h-2 border-b border-l border-ro-gold/20" />
                <div className="absolute bottom-3 right-3 w-2 h-2 border-b border-r border-ro-gold/20" />

                {status === 'success' ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <CheckCircle size={48} className="text-ro-gold mb-4" />
                    <h3 className="text-ro-white font-heading text-2xl uppercase tracking-wider mb-3">RFP received</h3>
                    <p className="text-ro-gray-400 max-w-md text-base leading-relaxed">
                      We&apos;ve emailed your summary to our team. Expect follow-up from <strong className="text-ro-gold/80">(864) 304-0139</strong> or{' '}
                      <strong className="text-ro-gold/80">build@rounlimited.com</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={() => setStatus('idle')}
                      className="mt-8 text-ro-gold/60 hover:text-ro-gold text-sm uppercase tracking-wider transition-colors"
                    >
                      Submit another &rarr;
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="form-bit flex items-center gap-3 mb-8">
                      <FileText className="text-ro-gold/70" size={22} />
                      <h3 className="text-ro-white font-heading text-xl tracking-wider uppercase">Project brief</h3>
                    </div>

                    {status === 'error' && (
                      <div className="flex items-start gap-3 mb-6 p-4 bg-red-900/20 border border-red-800/50 text-red-400 text-sm">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <form
                      id="rfp-contact-form"
                      className="rfp-contact-form space-y-6"
                      onSubmit={handleSubmit}
                      noValidate
                    >
                      <div className="form-bit">
                        <label htmlFor="organizationName" className={labelClass}>
                          Company / organization *
                        </label>
                        <input
                          id="organizationName"
                          name="organizationName"
                          type="text"
                          required
                          value={formData.organizationName}
                          onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                          className={inputClass}
                          placeholder="Legal or DBA name"
                          autoComplete="organization"
                        />
                      </div>

                      <div className="form-bit grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="contactName" className={labelClass}>
                            Contact name *
                          </label>
                          <input
                            id="contactName"
                            name="contactName"
                            type="text"
                            required
                            value={formData.contactName}
                            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                            className={inputClass}
                            placeholder="Full name"
                            autoComplete="name"
                          />
                        </div>
                        <div>
                          <label htmlFor="phone" className={labelClass}>
                            Phone *
                          </label>
                          <input
                            id="phone"
                            name="phone"
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className={inputClass}
                            placeholder="(864) 000-0000"
                            autoComplete="tel"
                          />
                        </div>
                      </div>

                      <div className="form-bit">
                        <label htmlFor="email" className={labelClass}>
                          Email *
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className={inputClass}
                          placeholder="you@company.com"
                          autoComplete="email"
                        />
                      </div>

                      <div className="form-bit grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="projectType" className={labelClass}>
                            Project type *
                          </label>
                          <select
                            id="projectType"
                            name="projectType"
                            required
                            value={formData.projectType}
                            onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                            className={inputClass}
                          >
                            <option value="">Select type</option>
                            {RFP_PROJECT_TYPES.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="scope" className={labelClass}>
                            Scope *
                          </label>
                          <select
                            id="scope"
                            name="scope"
                            required
                            value={formData.scope}
                            onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                            className={inputClass}
                          >
                            <option value="">Select scope</option>
                            {RFP_SCOPES.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-bit grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="squareFootage" className={labelClass}>
                            Est. square footage
                          </label>
                          <input
                            id="squareFootage"
                            name="squareFootage"
                            type="text"
                            inputMode="numeric"
                            value={formData.squareFootage}
                            onChange={(e) => setFormData({ ...formData, squareFootage: e.target.value })}
                            className={inputClass}
                            placeholder="e.g. 4500"
                          />
                        </div>
                        <div>
                          <label htmlFor="locationCityState" className={labelClass}>
                            Project location
                          </label>
                          <input
                            id="locationCityState"
                            name="locationCityState"
                            type="text"
                            value={formData.locationCityState}
                            onChange={(e) => setFormData({ ...formData, locationCityState: e.target.value })}
                            className={inputClass}
                            placeholder="City, State"
                          />
                        </div>
                      </div>

                      <div className="form-bit grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="desiredStartDate" className={labelClass}>
                            Desired start date
                          </label>
                          <input
                            id="desiredStartDate"
                            name="desiredStartDate"
                            type="date"
                            value={formData.desiredStartDate}
                            onChange={(e) => setFormData({ ...formData, desiredStartDate: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label htmlFor="budgetRange" className={labelClass}>
                            Budget range (optional)
                          </label>
                          <select
                            id="budgetRange"
                            name="budgetRange"
                            value={formData.budgetRange}
                            onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                            className={inputClass}
                          >
                            {RFP_BUDGET_RANGES.map((o) => (
                              <option key={o.value || 'none'} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-bit">
                        <label htmlFor="referralSource" className={labelClass}>
                          How did you hear about us?
                        </label>
                        <select
                          id="referralSource"
                          name="referralSource"
                          value={formData.referralSource}
                          onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
                          className={inputClass}
                        >
                          {RFP_REFERRAL_SOURCES.map((o) => (
                            <option key={o.value || 'none'} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-bit">
                        <label htmlFor="description" className={labelClass}>
                          Project description / special requirements
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          rows={6}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className={`${inputClass} resize-y min-h-[140px]`}
                          placeholder="Timeline constraints, brand standards, GC vs owner-direct, etc."
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="form-bit group flex items-center gap-3 px-8 py-4 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-all duration-300 w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {status === 'submitting' ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Sending…
                          </>
                        ) : (
                          <>
                            <Send size={16} />
                            Submit RFP
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionTransition label="FLOOR 11" title="Start the Conversation" sparks />
    </main>
  );
}
