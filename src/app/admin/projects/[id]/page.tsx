'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Loader2, Save, Check, X, Camera, FileText, Home,
  Building2, Mountain, MapPin, Calendar, DollarSign,
  Ruler, ChevronRight, Send, Globe, AlertCircle,
  Users, Wrench, Lock, CheckCircle2, Image, Sparkles
} from 'lucide-react';

interface Project {
  _id: string;
  title: string;
  division: string;
  status: 'active' | 'complete' | 'archived';
  reviewStatus?: string;
  address?: string;
  city?: string;
  state?: string;
  startDate?: string;
  completionDate?: string;
  estimatedValue?: number;
  sqft?: number;
  scopeDescription?: string;
  notes?: string;
  vendors?: any[];
  files?: any[];
  publishedToSite?: boolean;
  siteData?: {
    publicTitle?: string;
    publicDescription?: string;
    heroUrl?: string;
    selectedMedia?: string[];
    displayOrder?: string[];
  };
}

const DIVISION_CONFIG: Record<string, { label: string; icon: any; color: string; neon: string; neonSoft: string }> = {
  residential: { label: 'Residential', icon: Home,      color: '#4488FF', neon: 'rgba(68,136,255,0.7)',  neonSoft: 'rgba(68,136,255,0.12)' },
  commercial:  { label: 'Commercial',  icon: Building2, color: '#C9A84C', neon: 'rgba(255,208,96,0.7)',  neonSoft: 'rgba(201,168,76,0.12)' },
  grading:     { label: 'Land Grading',icon: Mountain,  color: '#34D399', neon: 'rgba(52,211,153,0.7)', neonSoft: 'rgba(52,211,153,0.12)' },
};

const TABS = [
  { id: 'details',  label: 'Details',  icon: FileText },
  { id: 'vendors',  label: 'Vendors',  icon: Users    },
  { id: 'media',    label: 'Media',    icon: Camera   },
  { id: 'docs',     label: 'Docs',     icon: Wrench   },
  { id: 'send',     label: 'Send',     icon: Send     },
];

// ── Field input ──────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, type = 'text', prefix, multiline
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; prefix?: string; multiline?: boolean;
}) {
  const base: React.CSSProperties = {
    width: '100%', background: 'rgba(0,0,0,0.45)',
    border: '1px solid rgba(42,74,138,0.3)', borderRadius: 12,
    padding: prefix ? '14px 16px 14px 28px' : '14px 16px',
    fontSize: 14, color: '#fff', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    colorScheme: 'dark',
  };
  return (
    <div>
      <label style={{ display:'block', fontSize:10, color:'rgba(255,255,255,0.28)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>
        {label}
      </label>
      <div style={{ position:'relative' }}>
        {prefix && <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.3)', fontSize:14 }}>{prefix}</span>}
        {multiline
          ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4}
              style={{ ...base, resize:'none' }}
              onFocus={e => { e.target.style.borderColor='rgba(68,136,255,0.5)'; e.target.style.boxShadow='0 0 0 3px rgba(68,136,255,0.07)'; }}
              onBlur={e => { e.target.style.borderColor='rgba(42,74,138,0.3)'; e.target.style.boxShadow='none'; }}
            />
          : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
              style={base}
              onFocus={e => { e.target.style.borderColor='rgba(68,136,255,0.5)'; e.target.style.boxShadow='0 0 0 3px rgba(68,136,255,0.07)'; }}
              onBlur={e => { e.target.style.borderColor='rgba(42,74,138,0.3)'; e.target.style.boxShadow='none'; }}
            />
        }
      </div>
    </div>
  );
}

// ── Details Tab ──────────────────────────────────────────────
function DetailsTab({ project, onSave }: { project: Project; onSave: (patch: Partial<Project>) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [title, setTitle] = useState(project.title || '');
  const [division, setDivision] = useState(project.division || 'residential');
  const [status, setStatus] = useState(project.status || 'active');
  const [address, setAddress] = useState(project.address || '');
  const [city, setCity] = useState(project.city || '');
  const [state, setState] = useState(project.state || 'SC');
  const [startDate, setStartDate] = useState(project.startDate?.slice(0,10) || '');
  const [completionDate, setCompletionDate] = useState(project.completionDate?.slice(0,10) || '');
  const [estimatedValue, setEstimatedValue] = useState(project.estimatedValue?.toString() || '');
  const [sqft, setSqft] = useState(project.sqft?.toString() || '');
  const [scopeDescription, setScopeDescription] = useState(project.scopeDescription || '');
  const [notes, setNotes] = useState(project.notes || '');

  const save = async () => {
    setSaving(true);
    await onSave({ title, division, status, address, city, state,
      startDate: startDate || undefined, completionDate: completionDate || undefined,
      estimatedValue: estimatedValue ? parseFloat(estimatedValue) : undefined,
      sqft: sqft ? parseInt(sqft) : undefined,
      scopeDescription, notes });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const div = DIVISION_CONFIG[division] || DIVISION_CONFIG.residential;
  const DIVS = Object.entries(DIVISION_CONFIG);

  return (
    <div className="space-y-5 pb-24">
      {/* Division selector */}
      <div>
        <label style={{ display:'block', fontSize:10, color:'rgba(255,255,255,0.28)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>Division</label>
        <div className="grid grid-cols-3 gap-2">
          {DIVS.map(([id, d]) => {
            const Icon = d.icon; const sel = division === id;
            return (
              <button key={id} onClick={() => setDivision(id)} className="rounded-xl py-3 flex flex-col items-center gap-1.5 transition-all active:scale-95"
                style={{
                  background: sel ? d.neonSoft : 'rgba(255,255,255,0.03)',
                  border: sel ? `1px solid ${d.neon}` : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: sel ? `0 0 14px ${d.neonSoft}` : 'none',
                }}>
                <Icon size={16} style={{ color: sel ? d.color : 'rgba(255,255,255,0.25)' }} />
                <span style={{ fontSize:10, fontWeight:600, color: sel ? d.color : 'rgba(255,255,255,0.3)' }}>{d.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status */}
      <div>
        <label style={{ display:'block', fontSize:10, color:'rgba(255,255,255,0.28)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>Job Status</label>
        <div className="grid grid-cols-3 gap-2">
          {(['active','complete','archived'] as const).map(s => {
            const sel = status === s;
            const colors: Record<string,{bg:string;border:string;text:string;glow:string}> = {
              active:   {bg:'rgba(52,211,153,0.12)', border:'rgba(52,211,153,0.5)', text:'#34D399', glow:'rgba(52,211,153,0.2)'},
              complete: {bg:'rgba(68,136,255,0.12)', border:'rgba(68,136,255,0.5)', text:'#4488FF', glow:'rgba(68,136,255,0.2)'},
              archived: {bg:'rgba(255,255,255,0.05)', border:'rgba(255,255,255,0.12)', text:'rgba(255,255,255,0.3)', glow:'none'},
            };
            const c = colors[s];
            return (
              <button key={s} onClick={() => setStatus(s)} className="py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 capitalize"
                style={{
                  background: sel ? c.bg : 'rgba(255,255,255,0.03)',
                  border: sel ? `1px solid ${c.border}` : '1px solid rgba(255,255,255,0.06)',
                  color: sel ? c.text : 'rgba(255,255,255,0.25)',
                  boxShadow: sel ? `0 0 10px ${c.glow}` : 'none',
                }}>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <Field label="Project Name" value={title} onChange={setTitle} placeholder="Project title" />
      <div className="grid grid-cols-1 gap-4">
        <Field label="Street Address" value={address} onChange={setAddress} placeholder="Optional" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="City" value={city} onChange={setCity} />
        <Field label="State" value={state} onChange={setState} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start Date" value={startDate} onChange={setStartDate} type="date" />
        <Field label="Completion" value={completionDate} onChange={setCompletionDate} type="date" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Est. Value" value={estimatedValue} onChange={setEstimatedValue} prefix="$" placeholder="0" />
        <Field label="Sqft" value={sqft} onChange={setSqft} placeholder="0" />
      </div>
      <Field label="Scope of Work" value={scopeDescription} onChange={setScopeDescription} multiline placeholder="Describe the scope..." />
      <Field label="Internal Notes" value={notes} onChange={setNotes} multiline placeholder="Notes for your team..." />

      {/* Save button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 py-4" style={{
        background: 'linear-gradient(to top, #050810 60%, transparent)',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
      }}>
        <button onClick={save} disabled={saving}
          className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #d4b55a, #C9A84C, #a8883a)',
            color: '#000',
            boxShadow: '0 0 0 1px rgba(201,168,76,0.4), 0 6px 24px rgba(201,168,76,0.3)',
          }}>
          {saving ? <><Loader2 size={15} className="animate-spin" />Saving...</>
          : saved  ? <><Check size={15} />Saved</>
          : <><Save size={15} />Save Changes</>}
        </button>
      </div>
    </div>
  );
}

// ── Media Tab ──────────────────────────────────────────────
function MediaTab({ project }: { project: Project }) {
  return (
    <div className="pb-24">
      <div className="rounded-2xl p-8 text-center" style={{ background:'#0F1F3D', border:'1px solid rgba(42,74,138,0.3)' }}>
        <Camera size={32} className="mx-auto mb-3" style={{ color:'rgba(68,136,255,0.3)' }} />
        <p className="text-sm mb-1" style={{ color:'rgba(255,255,255,0.4)' }}>Media uploads</p>
        <p className="text-xs" style={{ color:'rgba(255,255,255,0.2)' }}>Photo & video management coming next sprint</p>
      </div>
    </div>
  );
}

// ── Vendors Tab ──────────────────────────────────────────────
function VendorsTab({ project }: { project: Project }) {
  return (
    <div className="pb-24">
      <div className="rounded-2xl p-8 text-center" style={{ background:'#0F1F3D', border:'1px solid rgba(42,74,138,0.3)' }}>
        <Users size={32} className="mx-auto mb-3" style={{ color:'rgba(68,136,255,0.3)' }} />
        <p className="text-sm mb-1" style={{ color:'rgba(255,255,255,0.4)' }}>Vendor & sub tracking</p>
        <p className="text-xs" style={{ color:'rgba(255,255,255,0.2)' }}>Manage vendors and subs per project</p>
      </div>
    </div>
  );
}

// ── Docs Tab ──────────────────────────────────────────────
function DocsTab({ project }: { project: Project }) {
  return (
    <div className="pb-24">
      <div className="rounded-2xl p-8 text-center" style={{ background:'#0F1F3D', border:'1px solid rgba(42,74,138,0.3)' }}>
        <Wrench size={32} className="mx-auto mb-3" style={{ color:'rgba(68,136,255,0.3)' }} />
        <p className="text-sm mb-1" style={{ color:'rgba(255,255,255,0.4)' }}>Document vault</p>
        <p className="text-xs" style={{ color:'rgba(255,255,255,0.2)' }}>Plans, permits, contracts per project</p>
      </div>
    </div>
  );
}

// ── Send to NexaVision Tab ──────────────────────────────────
function SendTab({ project, onSend }: { project: Project; onSend: () => Promise<void> }) {
  const [sendStep, setSendStep] = useState<'intro'|'details'|'confirm'|'sent'>('intro');
  const [publicTitle, setPublicTitle] = useState(project.siteData?.publicTitle || project.title || '');
  const [publicDesc, setPublicDesc] = useState(project.siteData?.publicDescription || '');
  const [sending, setSending] = useState(false);
  const reviewStatus = project.reviewStatus;

  if (reviewStatus === 'pending') {
    return (
      <div className="pb-24 flex flex-col items-center justify-center pt-12 px-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 animate-review-pulse"
          style={{ background:'rgba(255,208,96,0.12)', border:'2px solid rgba(255,208,96,0.4)' }}>
          <Send size={32} style={{ color:'#FFD060' }} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">In NexaVision's Hands</h3>
        <p className="text-sm text-center mb-6" style={{ color:'rgba(255,255,255,0.4)', maxWidth:280 }}>
          We're working on it. You'll get a message when your project is live on the site — usually within 24 hours.
        </p>
        <div className="w-full rounded-2xl p-4" style={{ background:'#0F1F3D', border:'1px solid rgba(255,208,96,0.2)' }}>
          <p className="text-[11px] text-center" style={{ color:'rgba(255,208,96,0.6)' }}>
            ⏳ Submitted for publishing · Awaiting NexaVision
          </p>
        </div>
      </div>
    );
  }

  if (reviewStatus === 'approved' || project.publishedToSite) {
    return (
      <div className="pb-24 flex flex-col items-center justify-center pt-12 px-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 animate-live-pulse"
          style={{ background:'rgba(52,211,153,0.12)', border:'2px solid rgba(52,211,153,0.4)' }}>
          <Globe size={32} style={{ color:'#34D399' }} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Live on the Site ✓</h3>
        <p className="text-sm text-center mb-6" style={{ color:'rgba(255,255,255,0.4)', maxWidth:280 }}>
          NexaVision published this project. It's working for you right now.
        </p>
        <div className="w-full rounded-2xl p-4" style={{ background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.25)' }}>
          <p className="text-[11px] text-center" style={{ color:'rgba(52,211,153,0.7)' }}>
            ✓ Published by NexaVision
          </p>
        </div>
      </div>
    );
  }

  // Step: intro
  if (sendStep === 'intro') {
    return (
      <div className="pb-24 px-1 pt-2">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', boxShadow:'0 0 24px rgba(201,168,76,0.15)' }}>
            <Send size={26} style={{ color:'#C9A84C' }} />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Ready to go live?</h3>
          <p className="text-xs" style={{ color:'rgba(255,255,255,0.35)', maxWidth:260, margin:'0 auto' }}>
            Hand this project off to NexaVision and we'll get it looking its best on your site.
          </p>
        </div>

        {/* Checklist */}
        <div className="rounded-2xl overflow-hidden mb-5" style={{ background:'#0F1F3D', border:'1px solid rgba(42,74,138,0.3)' }}>
          <p className="text-[10px] uppercase tracking-widest px-4 pt-3 pb-2" style={{ color:'rgba(255,255,255,0.25)' }}>What NexaVision handles</p>
          {[
            'Layout and formatting for your site',
            'Photo selection and optimization',
            'Copy review and polish',
            'Publishing and QA check',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-t" style={{ borderColor:'rgba(42,74,138,0.2)' }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background:'rgba(201,168,76,0.12)', border:'1px solid rgba(201,168,76,0.3)' }}>
                <Check size={10} style={{ color:'#C9A84C' }} strokeWidth={3} />
              </div>
              <span className="text-sm" style={{ color:'rgba(255,255,255,0.6)' }}>{item}</span>
            </div>
          ))}
        </div>

        <button onClick={() => setSendStep('details')}
          className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{
            background:'rgba(68,136,255,0.15)',
            border:'1px solid rgba(68,136,255,0.45)',
            color:'#4488FF',
            boxShadow:'0 0 20px rgba(68,136,255,0.1)',
          }}>
          Let's Do It <ChevronRight size={15} />
        </button>
      </div>
    );
  }

  // Step: public details
  if (sendStep === 'details') {
    const charCount = publicDesc.length;
    return (
      <div className="pb-24 px-1 pt-2 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white mb-1">Public Details</h3>
          <p className="text-xs" style={{ color:'rgba(255,255,255,0.3)' }}>How this project appears on your site. NexaVision will polish these before publishing.</p>
        </div>

        <div>
          <label style={{ display:'block', fontSize:10, color:'rgba(255,255,255,0.28)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Public Title</label>
          <input value={publicTitle} onChange={e => setPublicTitle(e.target.value)}
            className="w-full rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none"
            style={{ background:'rgba(0,0,0,0.45)', border:'1px solid rgba(42,74,138,0.3)', colorScheme:'dark' }}
            onFocus={e => e.target.style.borderColor='rgba(68,136,255,0.5)'}
            onBlur={e => e.target.style.borderColor='rgba(42,74,138,0.3)'}
          />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label style={{ fontSize:10, color:'rgba(255,255,255,0.28)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Description</label>
            <span style={{ fontSize:10, color: charCount > 280 ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.2)' }}>{charCount}/280</span>
          </div>
          <textarea value={publicDesc} onChange={e => setPublicDesc(e.target.value)} rows={4}
            placeholder="A brief description for visitors to your site..."
            className="w-full rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none resize-none"
            style={{ background:'rgba(0,0,0,0.45)', border:'1px solid rgba(42,74,138,0.3)', colorScheme:'dark' }}
            onFocus={e => e.target.style.borderColor='rgba(68,136,255,0.5)'}
            onBlur={e => e.target.style.borderColor='rgba(42,74,138,0.3)'}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={() => setSendStep('intro')} className="flex-1 py-3.5 rounded-xl text-sm font-medium transition-all"
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.4)' }}>
            Back
          </button>
          <button onClick={() => setSendStep('confirm')} className="flex-[2] py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
            style={{ background:'rgba(68,136,255,0.15)', border:'1px solid rgba(68,136,255,0.45)', color:'#4488FF', boxShadow:'0 0 16px rgba(68,136,255,0.1)' }}>
            Review & Send <ChevronRight size={13} className="inline" />
          </button>
        </div>
      </div>
    );
  }

  // Step: confirm
  if (sendStep === 'confirm') {
    const handleSend = async () => {
      setSending(true);
      await onSend();
      setSending(false);
      setSendStep('sent');
    };
    return (
      <div className="pb-24 px-1 pt-2 space-y-4">
        <div className="rounded-2xl overflow-hidden" style={{ background:'#0F1F3D', border:'1px solid rgba(42,74,138,0.3)' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor:'rgba(42,74,138,0.2)' }}>
            <p className="text-[10px] uppercase tracking-widest" style={{ color:'rgba(255,255,255,0.25)' }}>Sending to NexaVision</p>
          </div>
          <div className="px-4 py-3 space-y-2">
            <div>
              <p className="text-[10px] mb-0.5" style={{ color:'rgba(255,255,255,0.25)' }}>Project</p>
              <p className="text-sm font-semibold text-white">{publicTitle || project.title}</p>
            </div>
            {publicDesc && (
              <div>
                <p className="text-[10px] mb-0.5" style={{ color:'rgba(255,255,255,0.25)' }}>Description</p>
                <p className="text-xs" style={{ color:'rgba(255,255,255,0.5)' }}>{publicDesc}</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-center" style={{ color:'rgba(255,255,255,0.3)' }}>
          NexaVision will take it from here. You'll hear back within 24 hours.
        </p>

        <div className="flex gap-2">
          <button onClick={() => setSendStep('details')} className="flex-1 py-3.5 rounded-xl text-sm font-medium"
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.4)' }}>
            Edit
          </button>
          <button onClick={handleSend} disabled={sending}
            className="flex-[2] py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{
              background:'linear-gradient(135deg, #d4b55a, #C9A84C, #a8883a)',
              color:'#000',
              boxShadow:'0 0 0 1px rgba(201,168,76,0.4), 0 8px 32px rgba(201,168,76,0.35)',
              animation:'neonGoldPulse 2.2s ease-in-out infinite',
            }}>
            {sending
              ? <><Loader2 size={15} className="animate-spin" />Sending...</>
              : <><Send size={15} />Send to NexaVision to Publish</>}
          </button>
        </div>
      </div>
    );
  }

  // Step: sent
  return (
    <div className="pb-24 flex flex-col items-center justify-center pt-12 px-4">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ background:'rgba(52,211,153,0.12)', border:'2px solid rgba(52,211,153,0.4)', boxShadow:'0 0 32px rgba(52,211,153,0.2)' }}>
        <CheckCircle2 size={36} style={{ color:'#34D399' }} />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">Sent!</h3>
      <p className="text-sm text-center" style={{ color:'rgba(255,255,255,0.4)', maxWidth:260 }}>
        NexaVision has your project. We'll be in touch within 24 hours when it's live.
      </p>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('details');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/projects?id=${id}`)
      .then(r => r.json())
      .then(data => { setProject(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSave = async (patch: Partial<Project>) => {
    const res = await fetch('/api/admin/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
    const data = await res.json();
    if (!data.error) setProject(prev => prev ? { ...prev, ...patch } : prev);
  };

  const handleSend = async () => {
    await handleSave({ reviewStatus: 'pending' } as any);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#050810' }}>
      <Loader2 className="animate-spin" size={24} style={{ color:'#C9A84C' }} />
    </div>
  );

  if (!project) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:'#050810' }}>
      <p style={{ color:'rgba(255,255,255,0.3)' }}>Project not found</p>
    </div>
  );

  const div = DIVISION_CONFIG[project.division] || DIVISION_CONFIG.residential;
  const DivIcon = div.icon;

  return (
    <div className="min-h-screen" style={{ background:'#050810' }}>
      {/* Neon grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage:`linear-gradient(rgba(42,74,138,0.05) 1px, transparent 1px),linear-gradient(90deg, rgba(42,74,138,0.05) 1px, transparent 1px)`,
        backgroundSize:'48px 48px', zIndex:0,
      }} />

      {/* Header */}
      <div className="relative z-20">
        <AdminHeader title={project.title} subtitle={`${div.label} · ${[project.city, project.state].filter(Boolean).join(', ')}`} backHref="/admin/projects" />
      </div>

      {/* Division badge strip */}
      <div className="relative z-10 px-4 pb-1 pt-1 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: div.neonSoft, border:`1px solid ${div.neon}`, color: div.color, boxShadow:`0 0 12px ${div.neonSoft}` }}>
          <DivIcon size={11} /> {div.label}
        </div>
        {project.estimatedValue && (
          <span className="text-xs" style={{ color:'rgba(255,255,255,0.25)' }}>
            ${project.estimatedValue.toLocaleString()}
          </span>
        )}
        {project.sqft && (
          <span className="text-xs" style={{ color:'rgba(255,255,255,0.25)' }}>
            {project.sqft.toLocaleString()} sqft
          </span>
        )}
      </div>

      {/* Tab bar */}
      <div className="relative z-20 px-4 pt-2 pb-0">
        <div className="flex gap-1 rounded-2xl p-1" style={{ background:'rgba(15,31,61,0.8)', border:'1px solid rgba(42,74,138,0.3)' }}>
          {TABS.map(t => {
            const TIcon = t.icon;
            const active = tab === t.id;
            const isSend = t.id === 'send';
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[9px] font-semibold transition-all"
                style={{
                  background: active
                    ? isSend ? 'rgba(201,168,76,0.15)' : 'rgba(68,136,255,0.15)'
                    : 'transparent',
                  border: active
                    ? isSend ? '1px solid rgba(201,168,76,0.4)' : '1px solid rgba(68,136,255,0.3)'
                    : '1px solid transparent',
                  color: active
                    ? isSend ? '#C9A84C' : '#4488FF'
                    : 'rgba(255,255,255,0.25)',
                  boxShadow: active
                    ? isSend ? '0 0 10px rgba(201,168,76,0.12)' : '0 0 10px rgba(68,136,255,0.1)'
                    : 'none',
                }}>
                <TIcon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="relative z-10 px-4 pt-4 max-w-lg mx-auto">
        {tab === 'details' && <DetailsTab project={project} onSave={handleSave} />}
        {tab === 'vendors' && <VendorsTab project={project} />}
        {tab === 'media'   && <MediaTab project={project} />}
        {tab === 'docs'    && <DocsTab project={project} />}
        {tab === 'send'    && <SendTab project={project} onSend={handleSend} />}
      </div>
    </div>
  );
}
