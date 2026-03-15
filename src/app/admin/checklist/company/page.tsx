'use client';

import { useState, useEffect, useRef } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { gsap } from 'gsap';
import {
  FileText, MapPin, ChevronDown, ChevronUp,
  Check, Loader2, Plus, Trash2, X, Award, HelpCircle,
} from 'lucide-react';

interface License {
  id: string; type: string; number: string; issuer: string; expiry: string;
}
interface SaveState { saving: boolean; saved: boolean; error: string | null; }

function useSave(field: string) {
  const [state, setState] = useState<SaveState>({ saving: false, saved: false, error: null });
  const save = async (value: unknown) => {
    setState({ saving: true, saved: false, error: null });
    try {
      const res = await fetch('/api/admin/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value }),
      });
      if (!res.ok) throw new Error('Save failed');
      const itemMap: Record<string, string> = {
        companyStory: 'story', companyLicenses: 'licenses', companyServiceArea: 'service_area',
      };
      const itemId = itemMap[field];
      if (itemId) {
        await fetch('/api/admin/checklist', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, status: 'done' }),
        });
      }
      setState({ saving: false, saved: true, error: null });
      setTimeout(() => setState(s => ({ ...s, saved: false })), 3000);
    } catch (e: any) {
      setState({ saving: false, saved: false, error: e.message });
    }
  };
  return { ...state, save };
}

function SaveButton({ saving, saved, error, onClick }: { saving: boolean; saved: boolean; error: string | null; onClick: () => void }) {
  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-xs text-red-400">{error}</span>}
      {saved && <span className="flex items-center gap-1 text-xs text-green-400"><Check size={12} /> Saved</span>}
      <button onClick={onClick} disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-black text-xs font-semibold rounded-lg hover:bg-[#d4b55a] disabled:opacity-50 transition-all">
        {saving ? <><Loader2 size={12} className="animate-spin" /> Saving...</> : 'Save'}
      </button>
    </div>
  );
}

// ── License Info Popup ────────────────────────────────────────────────────────
function LicenseInfoPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-blue-400" />
            <span className="text-sm font-semibold text-white">What to Enter Here</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

          <p className="text-xs text-white/50 leading-relaxed">
            This section is for your credentials — the paperwork that proves you are licensed, insured, and legit. Commercial clients and developers check this before signing anything. Here is what to pull together:
          </p>

          {/* SC GC License */}
          <div className="bg-blue-500/8 border border-blue-500/15 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-300 mb-1.5">🏛️ SC General Contractor License</p>
            <p className="text-xs text-white/50 leading-relaxed">
              This is your main license for commercial work in South Carolina — required by SC LLR for any commercial job over $10,000. It will be on the card or certificate SC sent you. Enter the license number exactly as it appears (example: <span className="font-mono text-white/70">GC-123456</span>) and the issuing authority is <span className="text-white/70">SC LLR / Contractor's Licensing Board</span>.
            </p>
          </div>

          {/* Residential Builder */}
          <div className="bg-[#C9A84C]/8 border border-[#C9A84C]/15 rounded-xl p-4">
            <p className="text-xs font-semibold text-[#C9A84C] mb-1.5">🏠 SC Residential Builder License</p>
            <p className="text-xs text-white/50 leading-relaxed">
              If you do residential work — custom homes, additions, renovations — you need this separate license from the SC Residential Builders Commission. Same deal: grab the number off your card. Issuing authority is <span className="text-white/70">SC Residential Builders Commission</span>.
            </p>
          </div>

          {/* Insurance */}
          <div className="bg-green-500/8 border border-green-500/15 rounded-xl p-4">
            <p className="text-xs font-semibold text-green-300 mb-1.5">🛡️ General Liability Insurance</p>
            <p className="text-xs text-white/50 leading-relaxed">
              Toggle this on and enter your coverage amount. Most commercial clients require at least $1,000,000 per occurrence. You can find this on your insurance certificate (the COI your agent sends you). This is one of the first things a developer will ask for.
            </p>
          </div>

          {/* Workers Comp note */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4">
            <p className="text-xs font-semibold text-white/60 mb-1.5">📋 Other Things Worth Adding</p>
            <ul className="text-xs text-white/40 space-y-1.5 leading-relaxed">
              <li><span className="text-white/60">Workers' Comp</span> — Required in SC if you have employees. Add it as a separate entry if you have it.</li>
              <li><span className="text-white/60">Surety Bond</span> — SC requires a bond to get your GC license. Worth listing the bond amount.</li>
              <li><span className="text-white/60">OSHA 10 or 30-Hour</span> — A lot of commercial sites require this card on the crew. If you or your guys have it, add it.</li>
              <li><span className="text-white/60">Specialty Licenses</span> — Asphalt paving, land grading, structural framing — SC has specific sub-classifications. Add any that apply.</li>
            </ul>
          </div>

          {/* Tip */}
          <div className="flex items-start gap-2.5 px-1">
            <span className="text-lg leading-none mt-0.5">💡</span>
            <p className="text-[11px] text-white/30 leading-relaxed">
              Not sure if a license is expired? You can look up any SC contractor license at <span className="text-white/50">llr.sc.gov</span> using your name or license number. It is public record.
            </p>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-white/5">
          <button onClick={onClose}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-xs font-medium rounded-lg transition-colors">
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompanyPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState<string | null>('story');
  const [showLicenseInfo, setShowLicenseInfo] = useState(false);

  const [story, setStory] = useState('');
  const [founderName, setFounderName] = useState('');
  const [yearsExp, setYearsExp] = useState('25+');
  const [tagline, setTagline] = useState('');
  const storySave = useSave('companyStory');

  const [licenses, setLicenses] = useState<License[]>([{ id: '1', type: '', number: '', issuer: '', expiry: '' }]);
  const [insured, setInsured] = useState(false);
  const [bondAmount, setBondAmount] = useState('');
  const licenseSave = useSave('companyLicenses');

  const [counties, setCounties] = useState<string[]>(['Spartanburg', 'Greenville', 'Cherokee', 'Union', 'York']);
  const [newCounty, setNewCounty] = useState('');
  const [radius, setRadius] = useState('60');
  const [baseCity, setBaseCity] = useState('Spartanburg, SC');
  const areaSave = useSave('companyServiceArea');

  useEffect(() => {
    fetch('/api/admin/checklist')
      .then(r => r.json())
      .then(data => {
        if (data?.companyStory) {
          setStory(data.companyStory.story || '');
          setFounderName(data.companyStory.founderName || '');
          setYearsExp(data.companyStory.yearsExp || '25+');
          setTagline(data.companyStory.tagline || '');
        }
        if (data?.companyLicenses) {
          if (data.companyLicenses.licenses?.length) setLicenses(data.companyLicenses.licenses);
          setInsured(data.companyLicenses.insured || false);
          setBondAmount(data.companyLicenses.bondAmount || '');
        }
        if (data?.companyServiceArea) {
          if (data.companyServiceArea.counties?.length) setCounties(data.companyServiceArea.counties);
          setRadius(data.companyServiceArea.radius || '60');
          setBaseCity(data.companyServiceArea.baseCity || 'Spartanburg, SC');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && pageRef.current) {
      gsap.fromTo(pageRef.current.querySelectorAll('.section-card'),
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power3.out', delay: 0.1 }
      );
    }
  }, [loading]);

  const addLicense = () => setLicenses(p => [...p, { id: Date.now().toString(), type: '', number: '', issuer: '', expiry: '' }]);
  const removeLicense = (id: string) => setLicenses(p => p.filter(l => l.id !== id));
  const updateLicense = (id: string, key: keyof License, val: string) =>
    setLicenses(p => p.map(l => l.id === id ? { ...l, [key]: val } : l));

  const addCounty = () => {
    if (newCounty.trim() && !counties.includes(newCounty.trim())) {
      setCounties(p => [...p, newCounty.trim()]);
      setNewCounty('');
    }
  };

  const SectionHeader = ({ id, icon: Icon, title, subtitle, color }: { id: string; icon: any; title: string; subtitle: string; color: string }) => (
    <button onClick={() => setOpenSection(openSection === id ? null : id)}
      className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div className="text-left">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <p className="text-xs text-white/40">{subtitle}</p>
        </div>
      </div>
      {openSection === id ? <ChevronUp size={14} className="text-white/20" /> : <ChevronDown size={14} className="text-white/20" />}
    </button>
  );

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#C9A84C]" size={24} />
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-white">
      <AdminHeader title="Tell Your Story" subtitle="Company Info & Credentials" backHref="/admin/checklist" />
      <div ref={pageRef} className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        <div className="section-card bg-[#C9A84C]/8 border border-[#C9A84C]/15 rounded-xl px-6 py-4">
          <p className="text-sm text-[#C9A84C]/80 leading-relaxed">
            Everything you fill in here goes directly onto your website. Your 25+ year story is your biggest competitive advantage.
          </p>
        </div>

        {/* Story */}
        <div className="section-card bg-[#111] border border-white/5 rounded-xl overflow-hidden">
          <SectionHeader id="story" icon={FileText} title="Your Story" subtitle="How RO Unlimited got started and what drives you" color="#C9A84C" />
          {openSection === 'story' && (
            <div className="border-t border-white/5 px-6 py-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Owner Name</label>
                  <input value={founderName} onChange={e => setFounderName(e.target.value)}
                    placeholder="e.g. Robert Oliver"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#C9A84C]/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Years of Experience</label>
                  <input value={yearsExp} onChange={e => setYearsExp(e.target.value)} placeholder="e.g. 25+"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#C9A84C]/50 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">One-Line Tagline</label>
                <input value={tagline} onChange={e => setTagline(e.target.value)}
                  placeholder="e.g. From ground-breaking to finished builds — we do it all."
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#C9A84C]/50 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Your Story</label>
                <p className="text-xs text-white/25 mb-2">How you got started, what drives you, what makes RO different. Even 3-4 sentences is great.</p>
                <textarea value={story} onChange={e => setStory(e.target.value)} rows={6}
                  placeholder="I started RO Unlimited back in... We specialize in... What sets us apart is..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#C9A84C]/50 focus:outline-none resize-none leading-relaxed" />
                <p className="text-[10px] text-white/20 mt-1">{story.length} characters</p>
              </div>
              <div className="flex justify-end pt-2">
                <SaveButton {...storySave} onClick={() => storySave.save({ story, founderName, yearsExp, tagline })} />
              </div>
            </div>
          )}
        </div>

        {/* Licenses */}
        <div className="section-card bg-[#111] border border-white/5 rounded-xl overflow-hidden">
          {/* Custom header with info button */}
          <div className="flex items-center justify-between pr-4">
            <div className="flex-1">
              <SectionHeader id="licenses" icon={Award} title="Licenses & Credentials" subtitle="Contractor license, insurance, bonds — shows you are legit" color="#60a5fa" />
            </div>
            <button
              onClick={e => { e.stopPropagation(); setShowLicenseInfo(true); }}
              className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-blue-400/70 hover:text-blue-300 bg-blue-500/8 hover:bg-blue-500/15 border border-blue-500/15 rounded-lg transition-all"
            >
              <HelpCircle size={12} />
              What to enter
            </button>
          </div>

          {openSection === 'licenses' && (
            <div className="border-t border-white/5 px-6 py-6 space-y-5">
              <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5">
                <div>
                  <p className="text-sm font-semibold text-white">General Liability Insurance</p>
                  <p className="text-xs text-white/30 mt-0.5">Required for all commercial contracts</p>
                </div>
                <button onClick={() => setInsured(p => !p)}
                  className={`w-12 h-6 rounded-full transition-all relative ${insured ? 'bg-green-500' : 'bg-white/10'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${insured ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
              {insured && (
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Coverage Amount (optional)</label>
                  <input value={bondAmount} onChange={e => setBondAmount(e.target.value)} placeholder="e.g. $1,000,000"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#C9A84C]/50 focus:outline-none" />
                </div>
              )}
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-3">License Entries</label>
                <div className="space-y-3">
                  {licenses.map((lic, i) => (
                    <div key={lic.id} className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/30">License #{i + 1}</span>
                        {licenses.length > 1 && (
                          <button onClick={() => removeLicense(lic.id)} className="text-white/20 hover:text-red-400 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-white/30 mb-1">Type</label>
                          <input value={lic.type} onChange={e => updateLicense(lic.id, 'type', e.target.value)}
                            placeholder="e.g. SC General Contractor"
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:border-[#C9A84C]/50 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-white/30 mb-1">License Number</label>
                          <input value={lic.number} onChange={e => updateLicense(lic.id, 'number', e.target.value)}
                            placeholder="e.g. GC-123456"
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:border-[#C9A84C]/50 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-white/30 mb-1">Issuing Authority</label>
                          <input value={lic.issuer} onChange={e => updateLicense(lic.id, 'issuer', e.target.value)}
                            placeholder="e.g. SC LLR"
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:border-[#C9A84C]/50 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-white/30 mb-1">Expiry (optional)</label>
                          <input type="date" value={lic.expiry} onChange={e => updateLicense(lic.id, 'expiry', e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/60 focus:border-[#C9A84C]/50 focus:outline-none" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={addLicense} className="mt-3 flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors">
                  <Plus size={13} /> Add Another License
                </button>
              </div>
              <div className="flex justify-end pt-2">
                <SaveButton {...licenseSave} onClick={() => licenseSave.save({ licenses, insured, bondAmount })} />
              </div>
            </div>
          )}
        </div>

        {/* Service Area */}
        <div className="section-card bg-[#111] border border-white/5 rounded-xl overflow-hidden">
          <SectionHeader id="area" icon={MapPin} title="Service Area" subtitle="Counties and cities you cover in Upstate SC" color="#34d399" />
          {openSection === 'area' && (
            <div className="border-t border-white/5 px-6 py-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Home Base City</label>
                  <input value={baseCity} onChange={e => setBaseCity(e.target.value)} placeholder="Spartanburg, SC"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#C9A84C]/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Radius (miles)</label>
                  <input value={radius} onChange={e => setRadius(e.target.value)} placeholder="60"
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#C9A84C]/50 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Counties / Cities You Serve</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {counties.map(c => (
                    <span key={c} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 text-xs rounded-lg">
                      {c}
                      <button onClick={() => setCounties(p => p.filter(x => x !== c))} className="text-green-400/50 hover:text-green-300">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newCounty} onChange={e => setNewCounty(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCounty()}
                    placeholder="Add a county or city..."
                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:border-[#C9A84C]/50 focus:outline-none" />
                  <button onClick={addCounty} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white/70 transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <SaveButton {...areaSave} onClick={() => areaSave.save({ counties, radius, baseCity })} />
              </div>
            </div>
          )}
        </div>

        <div className="section-card text-center py-4">
          <p className="text-[10px] text-white/15">All info saves directly to your website. NexaVision is notified when you update.</p>
        </div>
      </div>

      {/* License Info Popup */}
      {showLicenseInfo && <LicenseInfoPopup onClose={() => setShowLicenseInfo(false)} />}
    </div>
  );
}
