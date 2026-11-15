'use client';
import { trackEvent } from '@/components/analytics/SiteAnalytics';
import { useState } from 'react';
import { COMPANY } from '@/lib/constants';
import { Phone, Mail, MapPin, Send, Facebook, CheckCircle, AlertCircle, Loader2, Clock, FileText, CalendarDays, Ruler } from 'lucide-react';
import SubPageAnimator from '@/components/animations/SubPageAnimator';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const WHAT_TO_SEND = [
  { icon: MapPin, title: 'The Address', text: 'Street address or parcel number of the property, and the county or city it sits in.' },
  { icon: FileText, title: 'Plans or Drawings', text: 'Architectural plans, civil drawings, a survey or a sketch. Whatever stage they are in is fine, and so is no plans yet.' },
  { icon: Ruler, title: 'The Scope', text: 'What you want built or done: a new building, site work and grading, utilities, a build-out or a repair.' },
  { icon: CalendarDays, title: 'Your Timeline', text: 'When you want to start and any date the work has to be finished by.' },
];

const NEXT_STEPS = [
  { num: '01', title: 'We Call You Back', text: 'Your message goes straight to our office. We call the number you give us to talk through the project.' },
  { num: '02', title: 'We Look at the Site', text: 'For most projects we visit the property and review your plans before pricing anything.' },
  { num: '03', title: 'You Get a Written Estimate', text: 'The scope and the price in writing, with what is included and what is not.' },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', projectType: '', message: '' });
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

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
      trackEvent('contact_form_submitted');
      setFormData({ name: '', email: '', phone: '', projectType: '', message: '' });
    } catch {
      setErrorMsg('Network error. Please call us directly at (864) 304-0139.');
      setStatus('error');
    }
  };

  return (
    <SubPageAnimator>
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 blueprint-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-ro-black/95 to-ro-black" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 text-center">
          <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">Contact Us</span>
          <h1 className="text-ro-white font-heading text-5xl sm:text-6xl tracking-tight uppercase mb-4">
            Let&apos;s <span className="gradient-text-gold">Build</span>
          </h1>
          <div className="mx-auto w-24 gold-line mb-6" />
          <p className="text-ro-gray-400 text-lg max-w-xl mx-auto">{COMPANY.cta}</p>
          <p className="text-ro-gray-600 text-sm mt-3 max-w-md mx-auto">Reputation built on actions. <a href="/our-story" className="text-ro-gold/60 hover:text-ro-gold transition-colors">Learn who we are &rarr;</a></p>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h3 className="text-ro-gold font-heading text-sm tracking-[0.2em] uppercase mb-6">Direct Contact</h3>
                <div className="space-y-4">
                  <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-4 text-ro-gray-300 hover:text-ro-gold transition-colors group">
                    <div className="w-10 h-10 border border-ro-gray-700 group-hover:border-ro-gold/30 flex items-center justify-center transition-colors"><Phone size={16} className="text-ro-gold/60" /></div>
                    <div><div className="text-xs text-ro-gray-500 uppercase tracking-wider">Phone</div><div className="font-mono">{COMPANY.phone}</div></div>
                  </a>
                  <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-4 text-ro-gray-300 hover:text-ro-gold transition-colors group">
                    <div className="w-10 h-10 border border-ro-gray-700 group-hover:border-ro-gold/30 flex items-center justify-center transition-colors"><Mail size={16} className="text-ro-gold/60" /></div>
                    <div><div className="text-xs text-ro-gray-500 uppercase tracking-wider">Email</div><div className="text-sm">{COMPANY.email}</div></div>
                  </a>
                  <div className="flex items-center gap-4 text-ro-gray-300">
                    <div className="w-10 h-10 border border-ro-gray-700 flex items-center justify-center"><MapPin size={16} className="text-ro-gold/60" /></div>
                    <div><div className="text-xs text-ro-gray-500 uppercase tracking-wider">Service Area</div><div className="text-sm">{COMPANY.serviceArea}</div></div>
                  </div>
                  <div className="flex items-center gap-4 text-ro-gray-300">
                    <div className="w-10 h-10 border border-ro-gray-700 flex items-center justify-center"><Clock size={16} className="text-ro-gold/60" /></div>
                    <div><div className="text-xs text-ro-gray-500 uppercase tracking-wider">Hours</div><div className="text-sm">{COMPANY.hours}</div></div>
                  </div>
                  <a href={COMPANY.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-ro-gray-300 hover:text-ro-gold transition-colors group">
                    <div className="w-10 h-10 border border-ro-gray-700 group-hover:border-ro-gold/30 flex items-center justify-center transition-colors"><Facebook size={16} className="text-ro-gold/60" /></div>
                    <div><div className="text-xs text-ro-gray-500 uppercase tracking-wider">Facebook</div><div className="text-sm">Follow RO Unlimited</div></div>
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="relative border border-ro-gray-800 bg-ro-gray-900/30 p-8 sm:p-10">
                <div className="absolute top-3 left-3 w-2 h-2 border-t border-l border-ro-gold/20" />
                <div className="absolute top-3 right-3 w-2 h-2 border-t border-r border-ro-gold/20" />
                <div className="absolute bottom-3 left-3 w-2 h-2 border-b border-l border-ro-gold/20" />
                <div className="absolute bottom-3 right-3 w-2 h-2 border-b border-r border-ro-gold/20" />

                {status === 'success' ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <CheckCircle size={48} className="text-ro-gold mb-4" />
                    <h3 className="text-ro-white font-heading text-2xl uppercase tracking-wider mb-3">Message Sent</h3>
                    <p className="text-ro-gray-400 max-w-sm">We&apos;ve received your project inquiry and will be in touch shortly. Expect a call from (864) 304-0139.</p>
                    <button onClick={() => setStatus('idle')} className="mt-8 text-ro-gold/60 hover:text-ro-gold text-sm uppercase tracking-wider transition-colors">
                      Submit Another →
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-ro-white font-heading text-xl tracking-wider uppercase mb-8">Send Us Your Project</h3>

                    {status === 'error' && (
                      <div className="flex items-start gap-3 mb-6 p-4 bg-red-900/20 border border-red-800/50 text-red-400 text-sm">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-ro-gray-500 text-xs uppercase tracking-wider mb-2">Name *</label>
                          <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-ro-black border border-ro-gray-700 px-4 py-3 text-ro-white text-sm focus:border-ro-gold/50 focus:outline-none transition-colors" placeholder="Your name" />
                        </div>
                        <div>
                          <label className="block text-ro-gray-500 text-xs uppercase tracking-wider mb-2">Phone *</label>
                          <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-ro-black border border-ro-gray-700 px-4 py-3 text-ro-white text-sm focus:border-ro-gold/50 focus:outline-none transition-colors" placeholder="(864) 000-0000" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-ro-gray-500 text-xs uppercase tracking-wider mb-2">Email</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-ro-black border border-ro-gray-700 px-4 py-3 text-ro-white text-sm focus:border-ro-gold/50 focus:outline-none transition-colors" placeholder="your@email.com" />
                      </div>
                      <div>
                        <label className="block text-ro-gray-500 text-xs uppercase tracking-wider mb-2">Project Type</label>
                        <select value={formData.projectType} onChange={(e) => setFormData({...formData, projectType: e.target.value})} className="w-full bg-ro-black border border-ro-gray-700 px-4 py-3 text-ro-white text-sm focus:border-ro-gold/50 focus:outline-none transition-colors">
                          <option value="">Select a project type</option>
                          <option value="commercial">Commercial Build</option>
                          <option value="residential">Residential / Custom Home</option>
                          <option value="grading">Land Grading / Site Prep</option>
                          <option value="renovation">Renovation / Remodel</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-ro-gray-500 text-xs uppercase tracking-wider mb-2">Project Details</label>
                        <textarea rows={5} value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full bg-ro-black border border-ro-gray-700 px-4 py-3 text-ro-white text-sm focus:border-ro-gold/50 focus:outline-none transition-colors resize-none" placeholder="Tell us about your project..." />
                      </div>
                      <button type="submit" disabled={status === 'submitting'} className="group flex items-center gap-3 px-8 py-4 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-all duration-300 w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed">
                        {status === 'submitting' ? (
                          <><Loader2 size={16} className="animate-spin" />Sending...</>
                        ) : (
                          <><Send size={16} />Submit Project</>
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

      <section className="py-20 sm:py-24 relative border-t border-ro-gray-800">
        <div className="absolute inset-0 blueprint-overlay opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">For a Faster, Tighter Number</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase">What to Send for an Estimate</h2>
            <div className="mx-auto w-24 gold-line mt-4" />
            <p className="text-ro-gray-300 text-base sm:text-lg leading-relaxed mt-5 max-w-2xl mx-auto">You do not need all of this to reach out. The more of it we have, the sooner we can give you a real number. Put it in the form above, or email files to <a href={`mailto:${COMPANY.email}`} className="text-ro-gold underline underline-offset-4">{COMPANY.email}</a>.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHAT_TO_SEND.map(({ icon: Ic, title, text }) => (
              <div key={title} className="p-6 border border-ro-gray-800 bg-ro-black/50">
                <div className="w-11 h-11 flex items-center justify-center border border-ro-gold/30 bg-ro-gold/5 mb-4"><Ic size={20} className="text-ro-gold" /></div>
                <h3 className="text-ro-white font-heading text-xl tracking-wider uppercase mb-2">{title}</h3>
                <p className="text-ro-gray-300 text-base leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 relative border-t border-ro-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">After You Hit Send</span>
            <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase">What Happens Next</h2>
            <div className="mx-auto w-24 gold-line mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {NEXT_STEPS.map((n) => (
              <div key={n.num} className="p-6 border border-ro-gray-800 bg-ro-black/50">
                <div className="w-12 h-12 flex items-center justify-center border border-ro-gold/40 text-ro-gold font-heading text-lg mb-4">{n.num}</div>
                <h3 className="text-ro-white font-heading text-xl tracking-wider uppercase mb-2">{n.title}</h3>
                <p className="text-ro-gray-300 text-base leading-relaxed">{n.text}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-ro-gray-400 text-base mt-8">Want the whole sequence? <a href="/process" className="text-ro-gold underline underline-offset-4">See how a project runs from first call to final inspection</a>.</p>
        </div>
      </section>

      <section className="py-16 sm:py-20 relative border-t border-ro-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-ro-gold text-xs font-mono tracking-[0.3em] uppercase mb-4 block">Service Area</span>
          <h2 className="text-ro-white font-heading text-3xl sm:text-4xl tracking-tight uppercase">Upstate South Carolina &amp; Northeast Georgia</h2>
          <div className="mx-auto w-24 gold-line mt-4 mb-6" />
          <p className="text-ro-gray-300 text-base sm:text-lg leading-relaxed mb-4">RO Unlimited is based in Easley, South Carolina. We build and do site work and underground utilities across the Upstate, including Greenville, Greer, Spartanburg and Anderson, and into Northeast Georgia. We are licensed in South Carolina and Georgia.</p>
          <p className="text-ro-gray-300 text-base sm:text-lg leading-relaxed">Office hours are {COMPANY.hours}. Call <a href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`} className="text-ro-gold underline underline-offset-4 whitespace-nowrap">{COMPANY.phone}</a> or email <a href={`mailto:${COMPANY.email}`} className="text-ro-gold underline underline-offset-4">{COMPANY.email}</a>.</p>
        </div>
      </section>
    </SubPageAnimator>
  );
}
