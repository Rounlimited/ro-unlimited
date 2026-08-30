import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * OG metadata for texted report links — the preview reads
 * "Hartwell Ridge — 49% complete" before anyone taps it.
 */
export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  try {
    const supabase = createAdminClient();
    const { data: report } = await supabase
      .from('progress_reports')
      .select('percent, period_end, status, estimate_id')
      .eq('share_token', params.token)
      .single();

    if (!report || report.status !== 'sent') return { title: 'Progress Report', robots: { index: false } };

    const { data: estimate } = await supabase
      .from('estimates').select('project_name').eq('id', report.estimate_id).single();

    const when = new Date(report.period_end + 'T00:00:00')
      .toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const title = estimate?.project_name ? `${estimate.project_name} — Progress Report` : 'Progress Report';
    const description = `${report.percent}% complete as of ${when}`;

    return {
      title,
      description,
      robots: { index: false }, // private customer documents are never indexed
      openGraph: { title, description, siteName: 'RO Unlimited' },
    };
  } catch {
    return { title: 'Progress Report', robots: { index: false } };
  }
}

export default function ReportTokenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
