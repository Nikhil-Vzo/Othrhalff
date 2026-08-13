"use client";

import dynamic from 'next/dynamic';

const VsOmegle = dynamic(
  () => import('../../src/seo/views/VsOmegle').then(mod => mod.VsOmegle),
  { ssr: false }
);

export default function Page() {
  return <VsOmegle />;
}
