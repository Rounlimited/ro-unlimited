'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { Plus, Trash2, Check, Loader2, Star, Quote, ChevronDown, ChevronUp } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  company: string;
  role: string;
  quote: string;
  projectType: string;
  rating: number;
}

const blank = (): Testimonial => ({
  id: Date.now().toString(),
  name: '', company: '', role: '', quote: '', projectType: '', rating: 5,
});

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([blank()]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ [testimonials[0].id]: true });

  useEffect(() => {
    fetch('/api/admin/checklist')
      .then(r => r.json())
      .then(data => {
        if (data?.testimonials?.length) {
          setTestimonials(data.testimonials);
          // Expand the first one
          setExpanded({ [data.testimonials[0].id]: true });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (id: string, key: keyof Testimonial, val: string | number) =>
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, [key]: val } : t));

  const add = () => {
    const t = blank();
    setTestimonials(prev => [...prev, t]);
    setExpanded(prev => ({ ...prev, [t.id]: true }));
  };

  const remove = (id: string) => setTestimonials(prev => prev.filter(t => t.id !== id));

  const save = async () => {
    setSaveStatus('saving');
    try {
      // Save testimonials data
      await fetch('/api/admin/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'testimonials', value: testimonials }),
      });
      // Mark checklist item done
      await fetch('/api/admin/checklist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: 'written_test', status: 'done' }),
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    }
  };

  const projectTypes = [
    'Commercial Build', 'Custom Home', 'Land Grading', 'Excavation',
    'Renovation', 'Foundation', 'Framing', 'Other',
  ];

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#C9A84C]" size={24} />
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      <AdminHeader title="Client Testimonials" subtitle="Let your clients sell for you" backHref="/admin/checklist" />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        <div className="bg-[#C9A84C]/8 border border-[#C9A84C]/15 rounded-xl px-6 py-4">
          <p className="text-sm text-[#C9A84C]/80 leading-relaxed">
            Even 3 short quotes from happy clients closes commercial deals. A simple "on time, on budget" from a developer carries more weight than any ad.
          </p>
        </div>

        {testimonials.map((t, i) => {
          const isOpen = expanded[t.id] ?? false;
          const preview = t.name || `Client ${i + 1}`;
          return (
            <div key={t.id} className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(prev => ({ ...prev, [t.id]: !isOpen }))}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center">
                    <Quote size={14} className="text-[#C9A84C]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">{preview}</p>
                    {t.quote && <p className="text-xs text-white/30 truncate max-w-[200px]">"{t.quote.slice(0, 40)}{t.quote.length > 40 ? '…' : ''}"</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {testimonials.length > 1 && (
                    <button
                      onClick={e => { e.stopPropagation(); remove(t.id); }}
                      className="p-1.5 text-white/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  {isOpen ? <ChevronUp size={14} className="text-white/20" /> : <ChevronDown size={14} className="text-white/20" />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-white/5 px-6 py-5 space-y-4">
                  {/* Quote first — it's the most important */}
                  <div>
                    <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">What They Said</label>
                    <textarea
                      value={t.quote}
                      onChange={e => update(t.id, 'quote', e.target.value)}
                      rows={3}
                      placeholder={`e.g. "RO built our warehouse on time and on budget. Their crew was professional and the quality was top notch. We'll be calling them again."`}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#C9A84C]/50 focus:outline-none resize-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Client Name</label>
                      <input
                        value={t.name}
                        onChange={e => update(t.id, 'name', e.target.value)}
                        placeholder="e.g. John Smith"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#C9A84C]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Company (optional)</label>
                      <input
                        value={t.company}
                        onChange={e => update(t.id, 'company', e.target.value)}
                        placeholder="e.g. Smith Properties LLC"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#C9A84C]/50 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Their Role (optional)</label>
                      <input
                        value={t.role}
                        onChange={e => update(t.id, 'role', e.target.value)}
                        placeholder="e.g. Property Developer"
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#C9A84C]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Project Type</label>
                      <select
                        value={t.projectType}
                        onChange={e => update(t.id, 'projectType', e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#C9A84C]/50 focus:outline-none"
                      >
                        <option value="">Select type...</option>
                        {projectTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Star rating */}
                  <div>
                    <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => update(t.id, 'rating', star)}>
                          <Star
                            size={20}
                            className={star <= t.rating ? 'text-[#C9A84C] fill-[#C9A84C]' : 'text-white/15'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <button
          onClick={add}
          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-white/10 hover:border-white/20 text-white/30 hover:text-white/50 text-sm rounded-xl transition-all"
        >
          <Plus size={14} /> Add Another Testimonial
        </button>

        {/* Save */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-white/20">
            {testimonials.filter(t => t.quote.trim()).length} of {testimonials.length} filled in
          </p>
          <div className="flex items-center gap-3">
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <Check size={12} /> Saved to site
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-xs text-red-400">Save failed — try again</span>
            )}
            <button
              onClick={save}
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-black text-sm font-semibold rounded-lg hover:bg-[#d4b55a] disabled:opacity-50 transition-all"
            >
              {saveStatus === 'saving' ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Testimonials'}
            </button>
          </div>
        </div>

        <div className="text-center py-4">
          <p className="text-[10px] text-white/15">Testimonials save directly to your website once submitted.</p>
        </div>
      </div>
    </div>
  );
}
