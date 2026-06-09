import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { Contact } from '../../src/views/Contact';

export const metadata: Metadata = {
  title: 'Contact Support | OthrHalff',
  description: 'Get in touch with the OthrHalff team. Report issues, submit feedback, or reach out for help.',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white/50 font-sans">Loading...</div>}>
      <Contact />
    </Suspense>
  );
}
