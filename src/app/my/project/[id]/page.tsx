import { createAdminClient } from '@/lib/supabase/server';
import { getCustomerSession } from '@/lib/customer-auth';
import EstimateDocument from '@/components/public/EstimateDocument';
import PortalProjectBar from '@/components/portal/PortalProjectBar';

export const dynamic = 'force-dynamic';

/**
 * A project inside the portal. The signed-in customer may open only estimates
 * whose customer record carries their email. The document itself is the same
 * one the share link shows.
 */
export default async function PortalProjectPage({ params }: { params: { id: string } }) {
  const session = await getCustomerSession();
  if (!session) return null; // the shell shows the sign-in screen
  const supabase = createAdminClient();
  const { data: est } = await supabase.from('estimates')
    .select('id, project_name, estimate_number, share_token, customer:customers!inner(email)')
    .eq('id', params.id).ilike('customer.email', session.email).maybeSingle();
  if (!est || !est.share_token) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10">
        <section className="rounded-2xl border bg-white p-6" style={{ borderColor: '#f0ece2' }}>
          <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: '#8a6d20' }}>Not on your account</p>
          <p className="text-[18px] text-[#2a2a2a] mt-2">That project isn&rsquo;t connected to <strong>{session.email}</strong>. If it should be, call (864) 304-0139 and we&rsquo;ll link it up.</p>
          <a href="/my" className="inline-flex items-center justify-center min-h-[48px] mt-4 px-5 rounded-xl text-[16px] font-bold text-black" style={{ background: 'linear-gradient(145deg, #D4B965, #a8893d)' }}>Back to my projects</a>
        </section>
      </main>
    );
  }
  return (
    <>
      <PortalProjectBar name={est.project_name || est.estimate_number} />
      <EstimateDocument token={est.share_token} inPortal />
    </>
  );
}
