"use client";

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { ErrorBoundary } from '../../../src/components/ErrorBoundary';

const CampusPcoRadio = dynamic(
  () => import('../../../src/views/CampusPcoRadio').then(mod => mod.CampusPcoRadio),
  { ssr: false }
);

const MusicDate = dynamic(
  () => import('../../../src/views/virtual-dates/MusicDate').then(mod => mod.MusicDate),
  { ssr: false }
);

export default function Page() {
  const searchParams = useSearchParams();
  const room = searchParams?.get('room') || '';

  const isRadioMode = !room || room.includes('Campus_PCO') || room.toLowerCase() === 'radio';

  return (
    <ErrorBoundary>
      {isRadioMode ? <CampusPcoRadio /> : <MusicDate />}
    </ErrorBoundary>
  );
}
