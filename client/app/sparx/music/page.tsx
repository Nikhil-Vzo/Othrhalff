"use client";

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '../../../src/components/ErrorBoundary';

const MusicDate = dynamic(
  () => import('../../../src/views/virtual-dates/MusicDate').then(mod => mod.MusicDate),
  { ssr: false }
);

export default function Page() {
  return (
    <ErrorBoundary>
      <MusicDate />
    </ErrorBoundary>
  );
}
