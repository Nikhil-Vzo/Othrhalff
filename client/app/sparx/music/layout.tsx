import React from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Sparx FM – 24/7 Campus Radio & Synchronized Student Jukebox | Othrhalff',
  description:
    'Tune in to Sparx FM, the 24/7 synchronized campus radio station. Stream trending Bollywood hits, Punjabi anthems, and indie lo-fi with real-time scrolling lyrics, live chat reactions, and student song requests.',
  keywords: [
    'sparx fm',
    'campus radio',
    'college radio 24/7',
    'synchronized music radio',
    'student jukebox',
    'campus live radio',
    'bollywood lo-fi',
    'college song requests',
    'live lyrics radio',
    'othrhalff radio'
  ],
  alternates: {
    canonical: 'https://www.othrhalff.in/sparx/music',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.othrhalff.in/sparx/music',
    title: 'Sparx FM – 24/7 Campus Radio & Synchronized Student Jukebox | Othrhalff',
    description:
      'Listen together on Sparx FM. 24/7 synchronized campus airwaves, live scrolling lyrics, real-time student chat, and instant song requests.',
    images: [
      {
        url: 'https://www.othrhalff.in/sparxfm-wall.webp',
        width: 1200,
        height: 630,
        alt: 'Sparx FM 24/7 Campus Radio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sparx FM – 24/7 Campus Radio | Othrhalff',
    description: '24/7 synchronized campus radio with live lyrics, chat, and song requests.',
    images: ['https://www.othrhalff.in/sparxfm-wall.webp'],
  },
};

export default function SparxMusicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RadioBroadcastService',
    name: 'Sparx FM Campus Radio',
    url: 'https://www.othrhalff.in/sparx/music',
    broadcastDisplayName: 'Sparx FM 24/7',
    broadcaster: {
      '@type': 'Organization',
      name: 'Othrhalff',
      url: 'https://www.othrhalff.in',
    },
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
    genre: ['Bollywood', 'Punjabi', 'Lo-Fi', 'Indie Pop', 'Campus Jukebox'],
    inLanguage: ['hi', 'en', 'pa'],
    description:
      'The 24/7 synchronized campus radio station and live interactive jukebox for university students worldwide.',
  };

  return (
    <>
      <Script
        id="schema-sparxfm"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
