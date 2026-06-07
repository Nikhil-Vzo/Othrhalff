"use client";

import dynamic from 'next/dynamic';

const MusicDate = dynamic(
  () => import('../../../src/views/virtual-dates/MusicDate').then(mod => mod.MusicDate),
  { ssr: false }
);

export default function Page() {
  return <MusicDate />;
}
