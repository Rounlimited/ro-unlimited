import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { resolveToken } from '@/lib/project-members';
import { docStage } from '@/lib/doc-stage';

/**
 * Link-preview card for texted/emailed Project Page links. The title follows
 * the document's life: "Estimate · Miller barn pad" before signing,
 * "Project Page · Miller barn pad" after. Personal (shared) links resolve too.
 * Never indexed.
 */
export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  const fallback: Metadata = { title: 'Project Page', robots: { index: false } };
  try {
    const { token } = await resolveToken(params.token);
    const { data: e } = await createAdminClient().from('estimates')
      .select('project_name, estimate_number, document_mode, signed_at, completed_at, status, link_enabled')
      .eq('share_token', token).maybeSingle();
    if (!e || e.link_enabled === false) return fallback;
    const name = String(e.project_name || '').trim() || e.estimate_number;
    const signed = !!e.signed_at || e.status === 'accepted';
    const stage = docStage(e as any);
    const title = signed ? `Project Page · ${name}` : `${stage.label} · ${name}`; // root template appends the brand
    const description = e.completed_at
      ? 'Your finished project — binder, warranty and documents.'
      : signed
        ? 'Progress, what’s coming up, permits, inspections and updates with photos.'
        : `Review your ${stage.label.toLowerCase()}, choose options, and sign online.`;
    return { title, description, robots: { index: false }, openGraph: { title, description, siteName: 'RO Unlimited' } };
  } catch {
    return fallback;
  }
}

export default function ProjectPageTokenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
