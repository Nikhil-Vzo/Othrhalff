"use client";

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '../../../../src/components/ErrorBoundary';

const PcoAdminDashboard = dynamic(
  () => import('../../../../src/views/PcoAdminDashboard').then(mod => mod.PcoAdminDashboard),
  { ssr: false }
);

export default function Page() {
  return (
    <ErrorBoundary>
      <PcoAdminDashboard />
    </ErrorBoundary>
  );
}
