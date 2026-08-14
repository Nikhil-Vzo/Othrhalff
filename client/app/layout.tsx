import React from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';
import { Providers } from './providers';
import { AppLayout } from '../src/layouts/AppLayout';
import '../src/index.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.othrhalff.in'),
  title: {
    default: 'Othrhalff – Campus Connections, Dating & Beyond | Find Your Vibe',
    template: '%s | Othrhalff'
  },
  description: "Go beyond dating. Connect with verified college students through anonymous random text & video chat, post awesome campus confessions & tea, and play interactive games on campus maps. Find your vibe or your other half.",
  keywords: [
    'othrhalff',
    'othr halff',
    'campus connection',
    'college dating India',
    'omegle alternative college',
    'university dating',
    'anonymous campus confessions',
    'student partner matching',
    'campus crush',
    'college social app'
  ],
  authors: [{ name: 'Othrhalff Team' }],
  creator: 'Othrhalff',
  applicationName: 'Othrhalff',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.png',
  },
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
    title: 'Othrhalff – Campus Connections, Dating & Beyond',
    description: "Go beyond dating. Random text & video partner chat, post awesome campus confessions & tea, and play on interactive maps with verified college students. Find your vibe or your other half.",
    images: [
      {
        url: 'https://www.othrhalff.in/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Othrhalff Campus Connections & Beyond',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Othrhalff – Campus Connections, Dating & Beyond',
    description: 'Go beyond dating. Random text & video partner chat, post awesome campus confessions & tea, and play on interactive maps with verified college students. Find your vibe.',
    creator: '@othrhalff',
    images: ['https://www.othrhalff.in/og-image.png'],
  },
  alternates: {
    canonical: 'https://www.othrhalff.in',
    languages: {
      'en-IN': 'https://www.othrhalff.in',
    },
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
        {/* JSON-LD: SoftwareApplication schema */}
        <Script id="schema-app" type="application/ld+json" strategy="beforeInteractive">
          {`{
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Othrhalff",
            "url": "https://www.othrhalff.in",
            "applicationCategory": "SocialNetworkingApplication",
            "operatingSystem": "Web, Android, iOS",
            "description": "Campus-verified speed dating and anonymous confession app for Indian university students. 1-on-1 text and video chat, campus confessions, and interactive campus maps.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "INR"
            },
            "author": {
              "@type": "Organization",
              "name": "Othrhalff",
              "url": "https://www.othrhalff.in"
            },
            "inLanguage": "en-IN",
            "audience": {
              "@type": "Audience",
              "audienceType": "College Students",
              "geographicArea": {
                "@type": "Country",
                "name": "India"
              }
            }
          }`}
        </Script>

        {/* JSON-LD: Organization schema */}
        <Script id="schema-org" type="application/ld+json" strategy="beforeInteractive">
          {`{
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Othrhalff",
            "url": "https://www.othrhalff.in",
            "logo": "https://www.othrhalff.in/favicon.png",
            "description": "India's campus-verified speed dating and anonymous social platform for university students.",
            "sameAs": [
              "https://www.instagram.com/othrhalff",
              "https://twitter.com/othrhalff"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "Customer Support",
              "url": "https://www.othrhalff.in/contact"
            }
          }`}
        </Script>

        {/* JSON-LD: WebSite with SearchAction */}
        <Script id="schema-website" type="application/ld+json" strategy="beforeInteractive">
          {`{
            "@context": "https://schema.org",
            "@type": "WebSite",
            "url": "https://www.othrhalff.in",
            "name": "Othrhalff",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://www.othrhalff.in/campus/{search_term_string}",
              "query-input": "required name=search_term_string"
            }
          }`}
        </Script>

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
