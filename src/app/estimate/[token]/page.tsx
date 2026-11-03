'use client';

import { useParams } from 'next/navigation';
import EstimateDocument from '@/components/public/EstimateDocument';

/** The share link: the same document the portal shows, without a sign-in. */
export default function PublicEstimatePage() {
  const { token } = useParams<{ token: string }>();
  return <EstimateDocument token={token} />;
}
