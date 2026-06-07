import React, { Suspense } from 'react';
import { Onboarding } from '../../src/views/Onboarding';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white/50 font-sans">Loading...</div>}>
      <Onboarding />
    </Suspense>
  );
}
