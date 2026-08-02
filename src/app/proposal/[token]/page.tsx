'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProposalRenderer from '@/components/proposal/ProposalRenderer';
import type { ProposalContent } from '@/lib/proposals/types';

interface PublicProposal {
  title: string;
  template_id: string;
  status: string;
  content: ProposalContent;
  approved_at: string | null;
}

export default function ProposalPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const [doc, setDoc] = useState<PublicProposal | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/proposal/${token}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || 'Not found');
        return r.json();
      })
      .then(setDoc)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D1524', color: '#F2EFE9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'monospace', fontSize: 13, letterSpacing: '.2em', textTransform: 'uppercase' }}>
        Breaking ground…
      </div>
    );
  }
  if (err || !doc) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D1524', color: '#F2EFE9',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div>
          <p style={{ fontFamily: 'monospace', color: '#D4772C', letterSpacing: '.2em',
            textTransform: 'uppercase', fontSize: 12, marginBottom: 12 }}>404 · Nothing buried here</p>
          <p>{err || 'This proposal link is invalid or has been removed.'}</p>
        </div>
      </div>
    );
  }

  return (
    <ProposalRenderer
      content={doc.content}
      token={token}
      initialApproved={doc.status === 'approved'}
    />
  );
}
