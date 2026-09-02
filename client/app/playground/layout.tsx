import React from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Campus Pixel Playground & Live Voice Space | Othrhalff',
  description:
    'Hang out in the interactive 2D pixel campus playground. Move your custom avatar, explore campus landmarks, play arcade mini-games, and voice chat with verified college classmates in real time.',
  keywords: [
    'campus playground',
    'college pixel space',
    'virtual campus hangout',
    'student voice chat space',
    'arcade mini games campus',
    'retro pixel campus',
    'othrhalff playground'
  ],
  alternates: {
    canonical: 'https://www.othrhalff.in/playground',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.othrhalff.in/playground',
    title: 'Campus Pixel Playground & Live Voice Space | Othrhalff',
    description:
      'Retro pixel virtual campus with live spatial voice chat, interactive mini-games, and college avatars.',
    images: [
      {
        url: 'https://www.othrhalff.in/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Othrhalff Campus Playground',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Campus Pixel Playground | Othrhalff',
    description: 'Hang out in the 2D pixel campus playground with spatial audio and arcade games.',
    images: ['https://www.othrhalff.in/og-image.webp'],
  },
};

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Othrhalff Campus Pixel Playground',
    url: 'https://www.othrhalff.in/playground',
    description:
      'Interactive 2D retro campus playground with spatial voice audio, arcade games, and college student avatars.',
    publisher: {
      '@type': 'Organization',
      name: 'Othrhalff',
      url: 'https://www.othrhalff.in',
    },
  };

  return (
    <>
      <Script
        id="schema-playground"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
