'use client';

import { useState } from 'react';
import { COMPANY } from '@/lib/constants';
import {
  RFP_PROJECT_TYPES,
  RFP_SCOPES,
  RFP_BUDGET_RANGES,
  RFP_REFERRAL_SOURCES,
} from '@/lib/rfp-contact';
import { Phone, Mail, MapPin, Send, Facebook, CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import SubPageAnimator from '@/components/animations/SubPageAnimator';

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

/**
 * Commercial RFP contact page.
 * GPT-5.4 handoff: improve layout, visual hierarchy, and motion only — keep `name` attributes,
 * option `value`s from @/lib/rfp-contact, and POST /api/contact JSON shape unchanged.
 */
export default function ContactPage() {
  const [formData, setFormData] = useState(initialForm);
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
      setFormData(initialForm);
    } catch {
      setErrorMsg('Network error. Please call us directly at (864) 304-0139.');
      setStatus('error');
    }
  };

  const inputClass =
    'w-full bg-ro-black border border-ro-gray-700 px-4 py-3 text-ro-white text-base sm:text-sm focus:border-ro-gold/50 focus:outline-none transition-colors';
  const labelClass = 'block text-ro-gray-400 text-[13px] sm:text-xs uppercase tracking-wider mb-2';

  return (
    <SubPageAnimator>
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 blueprint-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-ro-black via-ro-black/95 to-ro-black" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 text-center">
          <span className="text-ro-gold text-[11px] sm:text-xs font-mono tracking-[0.3em] uppercase mb-4 block">
            Commercial RFP
          </span>
          <h1 className="text-ro-white font-heading text-4xl sm:text-5xl md:text-6xl tracking-tight uppercase mb-4">
            Request for <span className="gradient-text-gold">Proposal</span>
          </h1>
          <div className="mx-auto w-24 gold-line mb-6" />
          <p className="text-ro-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Send the scope, location, and timing. For restaurant, retail, renovation, and build-out work, we review projects with both execution and finished presentation in mind. Residential inquiries are welcome too; use the project type dropdown accordingly.
          </p>
          <p className="text-ro-gray-600 text-sm mt-3 max-w-md mx-auto">
            <a href="/our-story" className="text-ro-gold/60 hover:text-ro-gold transition-colors">
              About RO Unlimited &rarr;
            </a>
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-24" data-page="commercial-rfp">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h3 className="text-ro-gold font-heading text-sm tracking-[0.2em] uppercase mb-6">Direct contact</h3>
                <div className="space-y-4">
                  <a
                    href={`tel:${COMPANY.phone.replace(/[^0-9]/g, '')}`}
                    className="flex items-center gap-4 text-ro-gray-300 hover:text-ro-gold transition-colors group"
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
                    className="flex items-center gap-4 text-ro-gray-300 hover:text-ro-gold transition-colors group"
                  >
                    <div className="w-10 h-10 border border-ro-gray-700 group-hover:border-ro-gold/30 flex items-center justify-center transition-colors">
                      <Mail size={16} className="text-ro-gold/60" />
                    </div>
                    <div>
                      <div className="text-[13px] sm:text-xs text-ro-gray-500 uppercase tracking-wider">Email</div>
                      <div className="text-sm sm:text-sm">{COMPANY.email}</div>
                    </div>
                  </a>
                  <div className="flex items-center gap-4 text-ro-gray-300">
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
                    className="flex items-center gap-4 text-ro-gray-300 hover:text-ro-gold transition-colors group"
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
            </div>

            <div className="lg:col-span-3">
              <div className="relative border border-ro-gray-800 bg-ro-gray-900/30 p-6 sm:p-10">
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
                    <div className="flex items-center gap-3 mb-8">
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
                      <div>
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

                      <div>
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

                      <div>
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

                      <div>
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
                        className="group flex items-center gap-3 px-8 py-4 bg-ro-gold text-ro-black font-heading text-sm tracking-wider uppercase hover:bg-ro-gold-light transition-all duration-300 w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
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
    </SubPageAnimator>
  );
}
