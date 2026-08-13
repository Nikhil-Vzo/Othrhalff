"use client";

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

const VsCompetitor = dynamic(
  () => import('../../../src/seo/views/VsCompetitor').then(mod => mod.VsCompetitor),
  { ssr: false }
);

export default function Page() {
  const params = useParams();
  const competitorSlug = (params?.competitor as string) || 'tinder';
  return <VsCompetitor competitorSlug={competitorSlug} />;
}
