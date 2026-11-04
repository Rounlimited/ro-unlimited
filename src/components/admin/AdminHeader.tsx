'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, LogOut, HelpCircle, MoreHorizontal } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useDeviceContext } from '@/components/animations/useMediaQuery';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  showLogout?: boolean;
  showBack?: boolean; // explicitly control back arrow (the AppShell bar already has one on phones)
}

/**
 * Page header inside the admin. On phones it is ONE compact row: title and a
 * quiet subtitle on the left, Help and a "more" menu (Live Site, Sign Out)
 * on the right. The AppShell bar above already carries the back arrow, the
 * logo, the AI bubble and the bell — nothing is repeated here.
 */
export default function AdminHeader({ title, subtitle, backHref, showLogout = true, showBack }: AdminHeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const { isDesktop } = useDeviceContext();
  const [more, setMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!more) return;
    const close = (e: MouseEvent | TouchEvent) => { if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMore(false); };
    document.addEventListener('mousedown', close); document.addEventListener('touchstart', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('touchstart', close); };
  }, [more]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  // Back arrow only when a page asks for it explicitly — the AppShell bar has one.
  const shouldShowBack = showBack === true;
  const shouldShowLogout = showLogout && !isDesktop;

  return (
    <header className={`border-b border-white/5 bg-[#0f0f0f] sticky top-0 z-50 ${isDesktop ? 'lg:bg-transparent lg:border-none' : ''}`}>
      <div className="max-w-6xl lg:max-w-none mx-auto px-4 lg:px-8 py-2.5 lg:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {shouldShowBack && (
            <button onClick={() => backHref ? router.push(backHref) : router.back()} aria-label="Back" className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full text-white/40 hover:text-white">
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="min-w-0">
            <h1 className={`font-bold tracking-tight leading-tight ${isDesktop ? 'text-[22px]' : 'text-[19px]'} line-clamp-2`}>{title}</h1>
            {subtitle && <p className={`text-white/45 leading-snug ${isDesktop ? 'text-[13px] uppercase tracking-wide' : 'text-[13px] truncate'}`}>{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Help lives here rather than floating over the page — it used to
              sit on top of whatever you were trying to tap. */}
          <button
            onClick={() => window.dispatchEvent(new Event('open-help-menu'))}
            aria-label="Help and tours"
            title="Help — show me how"
            className="relative w-10 h-10 flex items-center justify-center rounded-lg text-white/35 hover:text-[#C9A84C] transition-colors"
          >
            <HelpCircle size={20} />
            <span data-help-dot className="hidden absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#D4772C' }} />
          </button>
          {!isDesktop && (
            <div className="relative" ref={moreRef}>
              <button onClick={() => setMore((v) => !v)} aria-label="More" aria-expanded={more} className="w-10 h-10 flex items-center justify-center rounded-lg text-white/35 hover:text-white transition-colors">
                <MoreHorizontal size={22} />
              </button>
              {more && (
                <div className="absolute right-0 top-11 w-52 rounded-xl overflow-hidden z-50" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 30px rgba(0,0,0,0.5)' }}>
                  <a href="/" target="_blank" className="flex items-center gap-3 min-h-[48px] px-4 text-[15px] font-semibold text-white/80 active:bg-white/5"><ExternalLink size={16} /> Open the live site</a>
                  {shouldShowLogout && (
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 min-h-[48px] px-4 text-[15px] font-semibold text-red-300 active:bg-white/5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}><LogOut size={16} /> Sign out</button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
