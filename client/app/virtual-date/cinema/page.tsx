"use client";

import dynamic from 'next/dynamic';

const CinemaDate = dynamic(
  () => import('../../../src/views/virtual-dates/CinemaDate').then(mod => mod.CinemaDate),
  { ssr: false }
);

export default function Page() {
  return <CinemaDate />;
}
