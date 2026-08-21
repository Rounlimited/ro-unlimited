import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * OG metadata for texted/emailed invoice links — the preview card reads
 * "Invoice RO-INV-2026-0245 · $14,200 due Sep 15" before anyone taps it.
 * Amounts are fine in a preview: the recipient is the customer.
 */
export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  try {
    const supabase = createAdminClient();
    const { data: inv } = await supabase
      .from('invoices')
      .select('invoice_number, total, amount_paid, due_date, status, link_enabled, share_token_expires_at, project_name')
      .eq('share_token', params.token)
      .single();

    if (!inv || !inv.link_enabled || inv.status === 'draft' ||
        (inv.share_token_expires_at && new Date(inv.share_token_expires_at) < new Date())) {
      return { title: 'Invoice', robots: { index: false } };
    }

    const balance = Number(inv.total) - Number(inv.amount_paid);
    const money = '$' + Math.round(inv.status === 'paid' ? Number(inv.total) : balance).toLocaleString();
    const due = inv.due_date
      ? new Date(inv.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : null;
    const title = `Invoice ${inv.invoice_number}`; // root template appends the brand
    const description = inv.status === 'paid'
      ? `Paid in full · ${money}${inv.project_name ? ' · ' + inv.project_name : ''}`
      : `${money} due${due ? ' ' + due : ''}${inv.project_name ? ' · ' + inv.project_name : ''}`;

    return {
      title,
      description,
      robots: { index: false }, // private business documents never get indexed
      openGraph: { title, description, siteName: 'RO Unlimited' },
    };
  } catch {
    return { title: 'Invoice', robots: { index: false } };
  }
}

export default function InvoiceTokenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
