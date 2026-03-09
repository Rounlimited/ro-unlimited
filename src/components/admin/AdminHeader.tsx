'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;  // kept for API compat — ignored, always uses router.back()
  showLogout?: boolean;
}

export default function AdminHeader({ title, subtitle, showLogout = true }: AdminHeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <header className="border-b border-white/5 bg-[#0f0f0f] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-white/30 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="text-[11px] text-white/30 tracking-wide uppercase">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank" className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/30 hover:text-white border border-white/5 hover:border-white/10 rounded transition-all">
            <ExternalLink size={12} /> Live Site
          </a>
          {showLogout && (
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/30 hover:text-red-400 border border-white/5 hover:border-red-400/20 rounded transition-all">
              <LogOut size={12} /> Sign Out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
