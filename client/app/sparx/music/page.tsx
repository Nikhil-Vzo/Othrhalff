"use client";

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ErrorBoundary } from '../../../src/components/ErrorBoundary';

const CampusPcoRadio = dynamic(
  () => import('../../../src/views/CampusPcoRadio').then(mod => mod.CampusPcoRadio),
  { ssr: false }
);

const MusicDate = dynamic(
  () => import('../../../src/views/virtual-dates/MusicDate').then(mod => mod.MusicDate),
  { ssr: false }
);

function PageContent() {
  const searchParams = useSearchParams();
  const room = searchParams?.get('room') || '';

  const isRadioMode = !room || room.includes('Campus_PCO') || room.toLowerCase() === 'radio';

  return isRadioMode ? <CampusPcoRadio /> : <MusicDate />;
}

export default function Page() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="h-screen w-screen bg-[#0d070b] flex items-center justify-center text-white/70 font-mono text-xs">
            Connecting to Sparx FM...
          </div>
        }
      >
        <PageContent />
      </Suspense>
    </ErrorBoundary>
  );
}
