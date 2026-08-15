"use client";

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '../../../src/components/ErrorBoundary';

const CinemaDate = dynamic(
  () => import('../../../src/views/virtual-dates/CinemaDate').then(mod => mod.CinemaDate),
  { ssr: false }
);

export default function Page() {
  return (
    <ErrorBoundary>
      <CinemaDate />
    </ErrorBoundary>
  );
}
