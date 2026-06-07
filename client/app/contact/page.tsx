import React, { Suspense } from 'react';
import { Contact } from '../../src/views/Contact';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white/50 font-sans">Loading...</div>}>
      <Contact />
    </Suspense>
  );
}
