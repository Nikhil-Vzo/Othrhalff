import type { Metadata } from 'next';
import VsOmegleClient from './client';

export const metadata: Metadata = {
  title: 'Othrhalff vs Omegle – The Safe, Verified Campus Alternative for College Students',
  description:
    'Omegle shut down in 2023. Othrhalff is the safe, verified Omegle alternative for college students in India—1-on-1 speed video & text chat with verified campus peers. No strangers, no creeps.',
  alternates: {
    canonical: 'https://www.othrhalff.in/vs-omegle',
  },
  openGraph: {
    title: 'Othrhalff vs Omegle – Safe Campus Alternative',
    description:
      'Omegle is gone. Othrhalff is the campus-verified Omegle alternative—1-on-1 speed video chat with real college students in India.',
    url: 'https://www.othrhalff.in/vs-omegle',
    type: 'website',
    images: [{ url: 'https://www.othrhalff.in/og-image.webp', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Othrhalff vs Omegle – Safe Campus Alternative',
    description: 'The campus-verified Omegle alternative for Indian college students.',
  },
  keywords: [
    'omegle alternative',
    'omegle alternative india',
    'omegle for college students',
    'random video chat college',
    'safe omegle replacement',
    'campus video chat india',
    'omegle alternative 2026',
  ],
};

export default function Page() {
  return <VsOmegleClient />;
}
