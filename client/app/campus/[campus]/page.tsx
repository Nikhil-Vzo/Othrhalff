"use client";

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

const CampusPage = dynamic(
  () => import('../../../src/seo/views/CampusPage').then(mod => mod.CampusPage),
  { ssr: false }
);

export default function Page() {
  const params = useParams();
  const campusSlug = (params?.campus as string) || 'delhi-university';
  return <CampusPage campusSlug={campusSlug} />;
}
