'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, LogOut, HelpCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useDeviceContext } from '@/components/animations/useMediaQuery';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  showLogout?: boolean;
  showBack?: boolean; // explicitly control back arrow (auto-hidden on desktop top-level)
}

export default function AdminHeader({ title, subtitle, backHref, showLogout = true, showBack }: AdminHeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const { isDesktop } = useDeviceContext();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  // On desktop, hide back arrow and logout (sidebar + top bar handle navigation)
  const shouldShowBack = showBack !== undefined ? showBack : !isDesktop;
  const shouldShowLogout = showLogout && !isDesktop;

  return (
    <header className={`border-b border-white/5 bg-[#0f0f0f] sticky top-0 z-50 ${isDesktop ? 'lg:bg-transparent lg:border-none' : ''}`}>
      <div className="max-w-6xl lg:max-w-none mx-auto px-6 lg:px-8 py-5 lg:py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {shouldShowBack && (
            <button
              onClick={() => backHref ? router.push(backHref) : router.back()}
              className="text-white/30 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className={`text-lg font-semibold tracking-tight ${isDesktop ? 'text-[22px]' : ''}`}>{title}</h1>
            {subtitle && <p className="text-[11px] text-white/30 tracking-wide uppercase">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Help lives here rather than floating over the page — it used to
              sit on top of whatever you were trying to tap. */}
          <button
            onClick={() => window.dispatchEvent(new Event('open-help-menu'))}
            aria-label="Help and tours"
            title="Help — show me how"
            className="relative w-11 h-11 flex items-center justify-center rounded-lg border border-white/5 hover:border-[#C9A84C]/40 text-white/30 hover:text-[#C9A84C] transition-all"
          >
            <HelpCircle size={19} />
            <span data-help-dot className="hidden absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#D4772C' }} />
          </button>
          {!isDesktop && (
            <a href="/" target="_blank" className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/30 hover:text-white border border-white/5 hover:border-white/10 rounded transition-all">
              <ExternalLink size={12} /> Live Site
            </a>
          )}
          {shouldShowLogout && (
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/30 hover:text-red-400 border border-white/5 hover:border-red-400/20 rounded transition-all">
              <LogOut size={12} /> Sign Out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
