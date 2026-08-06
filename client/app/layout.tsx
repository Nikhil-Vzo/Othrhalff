import React from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';
import { Providers } from './providers';
import { AppLayout } from '../src/layouts/AppLayout';
import '../src/index.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.othrhalff.in'),
  title: {
    default: 'Othrhalff – Campus Dating & College Speed Text & Video Chat',
    template: '%s | Othrhalff'
  },
  description: "Othrhalff (othrhalff) is the #1 verified campus college dating, speed text & video chat, and anonymous student connection platform. Meet verified university students on your campus safely.",
  keywords: [
    'othrhalff',
    'othr halff',
    'campus dating app',
    'college dating India',
    'campus speed dating',
    'college video chat',
    'omegle alternative college',
    'university dating',
    'anonymous college chat',
    'student dating app',
    'campus matchmaking',
    'college speed dating',
    'university students India',
    'campus crush',
    'college social app'
  ],
  authors: [{ name: 'Othrhalff Team' }],
  creator: 'Othrhalff',
  publisher: 'Othrhalff',
  applicationName: 'Othrhalff',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.othrhalff.in',
    siteName: 'Othrhalff',
    title: 'Othrhalff – Campus Dating & College Speed Text & Video Chat',
    description: "The #1 campus speed dating and student social discovery platform. Speed text, speed video call, and match anonymously with verified college students.",
    images: [
      {
        url: 'https://www.othrhalff.in/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Othrhalff Campus Dating',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Othrhalff – Campus Dating & College Speed Chat',
    description: 'The #1 campus speed dating & college connection platform. Speed text & video chat with verified students on campus.',
    creator: '@othrhalff',
    images: ['https://www.othrhalff.in/og-image.png'],
  },
  alternates: {
    canonical: 'https://www.othrhalff.in',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID || 'G-OTH4HALFF1';

  return (
    <html lang="en">
      <head>
        {/* Google Analytics (GA4) Tag */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </head>
      <body>
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
