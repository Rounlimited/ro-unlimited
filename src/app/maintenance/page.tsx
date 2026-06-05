import type { Metadata } from 'next';
import { COMPANY } from '@/lib/constants';
import { sanityClient } from '@/lib/sanity/client';

export const revalidate = 20;

export const metadata: Metadata = {
  title: 'Temporarily Under Maintenance',
  robots: { index: false, follow: false },
};

const DEFAULT_MESSAGE =
  "Our website is temporarily under maintenance while we make some updates. We'll be back online shortly — thanks for your patience.";

async function getMessage(): Promise<string> {
  try {
    const msg = await sanityClient.fetch<string | null>(
      `*[_id == "siteSettings"][0].maintenanceMessage`
    );
    return typeof msg === 'string' && msg.trim() ? msg.trim() : DEFAULT_MESSAGE;
  } catch {
    return DEFAULT_MESSAGE;
  }
}

export default async function MaintenancePage() {
  const message = await getMessage();
  const telHref = `tel:${COMPANY.phone.replace(/[^0-9+]/g, '')}`;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-6 py-16 text-center">
      <img
        src="/ro-icon.svg"
        alt=""
        aria-hidden="true"
        className="w-44 max-w-[55vw] mb-10 opacity-95 pointer-events-none select-none"
        style={{ transform: 'scaleY(1.3)', transformOrigin: 'center' }}
      />

      <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[#C9A84C] mb-5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
        Temporarily Offline
      </span>

      <h1 className="font-heading text-3xl sm:text-4xl font-semibold mb-4">
        We&rsquo;ll be right back
      </h1>

      <p className="max-w-md text-[15px] leading-relaxed text-white/55 mb-10">
        {message}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <a
          href={telHref}
          className="px-6 py-3 rounded-full bg-[#C9A84C] text-black font-semibold text-sm hover:bg-[#d4b55a] transition-colors"
        >
          Call {COMPANY.phone}
        </a>
        <a
          href={`mailto:${COMPANY.email}`}
          className="px-6 py-3 rounded-full border border-white/15 text-white/70 text-sm hover:border-white/30 hover:text-white transition-colors"
        >
          Email Us
        </a>
      </div>

      <p className="mt-12 text-[11px] uppercase tracking-[0.2em] text-white/20">
        {COMPANY.fullName}
      </p>
    </main>
  );
}
