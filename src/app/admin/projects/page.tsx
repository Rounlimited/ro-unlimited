'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  Plus, FolderOpen, MapPin, Calendar, Camera, FileText,
  Globe, Loader2, ChevronRight, Check, X, Home, Building2, Mountain,
  Clock, Send, AlertCircle
} from 'lucide-react';

interface ProjectSummary {
  _id: string;
  title: string;
  division: string;
  status: 'active' | 'complete' | 'archived';
  reviewStatus?: 'draft' | 'pending' | 'changes_requested' | 'approved' | 'unpublished';
  city: string;
  state: string;
  startDate: string | null;
  completionDate: string | null;
  publishedToSite: boolean;
  photoCount: number;
  docCount: number;
  heroUrl: string | null;
}

const DIVISION_CONFIG: Record<string, {
  label: string; icon: any;
  color: string; neon: string; neonSoft: string; borderColor: string;
}> = {
  residential: {
    label: 'Residential', icon: Home,
    color: '#4488FF', neon: 'rgba(68,136,255,0.7)', neonSoft: 'rgba(68,136,255,0.12)',
    borderColor: 'rgba(68,136,255,0.6)',
  },
  commercial: {
    label: 'Commercial', icon: Building2,
    color: '#C9A84C', neon: 'rgba(255,208,96,0.7)', neonSoft: 'rgba(201,168,76,0.12)',
    borderColor: 'rgba(201,168,76,0.6)',
  },
  grading: {
    label: 'Land Grading', icon: Mountain,
    color: '#34D399', neon: 'rgba(52,211,153,0.7)', neonSoft: 'rgba(52,211,153,0.12)',
    borderColor: 'rgba(52,211,153,0.6)',
  },
};

type ReviewStatus = 'draft' | 'pending' | 'changes_requested' | 'approved' | 'unpublished';

function ReviewBadge({ status }: { status?: ReviewStatus }) {
  if (!status || status === 'draft') return (
    <span className="text-[9px] px-2 py-0.5 rounded-full font-medium"
      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
      Draft
    </span>
  );
  if (status === 'pending') return (
    <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold animate-review-pulse"
      style={{ background: 'rgba(255,208,96,0.12)', color: '#FFD060', border: '1px solid rgba(255,208,96,0.35)' }}>
      ⏳ With NexaVision
    </span>
  );
  if (status === 'changes_requested') return (
    <span className="text-[9px] px-2 py-0.5 rounded-full font-medium"
      style={{ background: 'rgba(251,191,36,0.1)', color: '#FBB024', border: '1px solid rgba(251,191,36,0.3)' }}>
      <AlertCircle size={7} className="inline mr-0.5" />Needs Update
    </span>
  );
  if (status === 'approved') return (
    <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold animate-live-pulse"
      style={{ background: 'rgba(52,211,153,0.12)', color: '#34D399', border: '1px solid rgba(52,211,153,0.35)' }}>
      <Globe size={7} className="inline mr-0.5" />Live
    </span>
  );
  if (status === 'unpublished') return (
    <span className="text-[9px] px-2 py-0.5 rounded-full font-medium"
      style={{ background: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.5)', border: '1px solid rgba(239,68,68,0.15)' }}>
      Taken Down
    </span>
  );
  return null;
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'residential', label: 'Residential' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'grading', label: 'Grading' },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/projects');
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch { setProjects([]); }
    finally { setLoading(false); }
  };

  const filtered = filter === 'all' ? projects : projects.filter(p => p.division === filter);

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : null;

  return (
    <div className="min-h-screen" style={{ background: '#050810' }}>
      <AdminHeader title="Job Files" subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''}`} backHref="/admin" />

      {/* Neon grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(42,74,138,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(42,74,138,0.05) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        zIndex: 0,
      }} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-4 pb-24">

        {/* Message toast */}
        {message && (
          <div className={`mb-4 p-3 rounded-xl border text-sm flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <Check size={13} /> : <X size={13} />}
              {message.text}
            </div>
            <button onClick={() => setMessage(null)}><X size={13} className="opacity-50" /></button>
          </div>
        )}

        {/* Filter bar + New button */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(f => {
              const count = f.id === 'all' ? projects.length : projects.filter(p => p.division === f.id).length;
              const div = DIVISION_CONFIG[f.id];
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className="px-3 py-1.5 text-xs rounded-lg transition-all font-medium"
                  style={{
                    background: active
                      ? div ? div.neonSoft : 'rgba(255,255,255,0.08)'
                      : 'rgba(255,255,255,0.03)',
                    border: active
                      ? div ? `1px solid ${div.borderColor}` : '1px solid rgba(255,255,255,0.2)'
                      : '1px solid rgba(255,255,255,0.06)',
                    color: active
                      ? div ? div.color : '#fff'
                      : 'rgba(255,255,255,0.3)',
                    boxShadow: active && div ? `0 0 10px ${div.neonSoft}` : 'none',
                  }}
                >
                  {f.label}
                  <span className="ml-1.5 opacity-50">({count})</span>
                </button>
              );
            })}
          </div>

          <Link
            href="/admin/projects/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #d4b55a, #C9A84C)',
              color: '#000',
              boxShadow: '0 0 16px rgba(201,168,76,0.35), 0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            <Plus size={13} /> New Job
          </Link>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="animate-spin" size={22} style={{ color: '#C9A84C' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{
            background: '#0F1F3D',
            border: '1px solid rgba(42,74,138,0.3)',
          }}>
            <FolderOpen size={34} className="mx-auto mb-3" style={{ color: 'rgba(68,136,255,0.2)' }} />
            <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>No job files yet</p>
            <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.15)' }}>
              Create your first project to get started.
            </p>
            <Link href="/admin/projects/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold"
              style={{
                background: 'linear-gradient(135deg, #d4b55a, #C9A84C)',
                color: '#000',
                boxShadow: '0 0 16px rgba(201,168,76,0.3)',
              }}>
              <Plus size={12} /> Create First Job File
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((project, i) => {
              const div = DIVISION_CONFIG[project.division] || DIVISION_CONFIG.residential;
              const DivIcon = div.icon;
              return (
                <Link
                  key={project._id}
                  href={`/admin/projects/${project._id}`}
                  className="block rounded-2xl overflow-hidden transition-all group active:scale-[0.99]"
                  style={{
                    background: '#0F1F3D',
                    border: '1px solid rgba(42,74,138,0.3)',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
                    animation: `cardSlideUp 0.35s cubic-bezier(0.16,1,0.3,1) ${i * 40}ms both`,
                  }}
                >
                  <div className="flex items-stretch">
                    {/* Division left stripe — neon glow bar */}
                    <div className="w-1 flex-shrink-0 rounded-l-2xl" style={{
                      background: `linear-gradient(to bottom, ${div.color}, ${div.neon})`,
                      boxShadow: `0 0 12px ${div.neon}, inset 0 0 4px ${div.neonSoft}`,
                    }} />

                    {/* Thumbnail */}
                    <div className="w-[60px] h-[68px] flex-shrink-0 m-3 rounded-xl overflow-hidden" style={{
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      {project.heroUrl
                        ? <img src={project.heroUrl} alt="" className="w-full h-full object-cover" />
                        : (
                          <div className="w-full h-full flex items-center justify-center">
                            <DivIcon size={20} style={{ color: div.color, opacity: 0.3 }} />
                          </div>
                        )
                      }
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0 py-3 pr-2">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold leading-tight truncate text-white/90">
                          {project.title}
                        </h3>
                        <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.15)', flexShrink: 0, marginTop: 1 }} />
                      </div>

                      {/* Division + location */}
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="text-[10px] font-semibold" style={{ color: div.color }}>
                          {div.label}
                        </span>
                        {(project.city || project.state) && (
                          <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            <MapPin size={8} />
                            {[project.city, project.state].filter(Boolean).join(', ')}
                          </span>
                        )}
                        {project.startDate && (
                          <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                            <Calendar size={8} />
                            {formatDate(project.startDate)}
                          </span>
                        )}
                      </div>

                      {/* Bottom row: media count + review badge */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                          <Camera size={8} /> {project.photoCount}
                        </span>
                        <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                          <FileText size={8} /> {project.docCount}
                        </span>
                        <div className="flex-1" />
                        <ReviewBadge status={project.reviewStatus || (project.publishedToSite ? 'approved' : 'draft')} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
