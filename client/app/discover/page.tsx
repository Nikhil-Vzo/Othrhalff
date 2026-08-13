"use client";

import dynamic from 'next/dynamic';

const Discover = dynamic(
  () => import('../../src/views/Discover').then(mod => mod.Discover),
  { ssr: false }
);

export default function Page() {
  return <Discover />;
}
