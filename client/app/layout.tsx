import React from 'react';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Providers } from './providers';
import PageViewTracker from './PageViewTracker';
import { AppLayout } from '../src/layouts/AppLayout';
import '../src/index.css';

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.othrhalff.in'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Othrhalff',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  formatDetection: {
    telephone: false,
  },
  title: {
    default: 'Othrhalff – Beyond Dating • Verified Campus Connections & Community',
    template: '%s | Othrhalff'
  },
  description: "We are beyond dating. Meet verified college students on your campus for study sessions, gym partners, real friendships, anonymous confessions, 24-hour Sparx stories, and authentic campus belonging.",
  keywords: [
    'othrhalff',
    'othr halff',
    'campus connection app',
    'college social network',
    'university friends finder',
    'anonymous campus confessions',
    'college study partner app',
    'gym partner finder campus',
    'student community app India',
    'campus radar',
    'sparx stories college',
    'college meetup app'
  ],
  authors: [{ name: 'Othrhalff Team' }],
  creator: 'Othrhalff',
  applicationName: 'Othrhalff',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.webp', type: 'image/webp' },
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
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
    title: 'Othrhalff – Beyond Dating • Verified Campus Connections & Community',
    description: "We are beyond dating. Meet verified college students on your campus for study sessions, gym partners, real friendships, anonymous confessions, and authentic campus belonging.",
    images: [
      {
        url: 'https://www.othrhalff.in/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Othrhalff Campus Connections & Beyond',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Othrhalff – Beyond Dating • Verified Campus Connections & Community',
    description: 'We are beyond dating. Meet verified college students on your campus for study sessions, gym partners, real friendships, anonymous confessions, and authentic community.',
    creator: '@othrhalff',
    images: ['https://www.othrhalff.in/og-image.webp'],
  },
  // NOTE: no site-wide `alternates.canonical` here — a canonical on the root
  // layout is inherited by every child page that lacks its own metadata, which
  // made /discover, /confessions, /reddit etc. declare themselves duplicates of
  // the homepage ("Alternate page with proper canonical tag" in Search Console).
  // Canonicals belong on leaf pages only.
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID || 'G-1SMGFPR49Z';

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
            "description": "Campus-verified student connection platform. Meet verified peers between classes for study sessions, gym partners, real friendships, anonymous confessions, 24h Sparx, and authentic campus belonging.",
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
            "description": "Campus-verified student community platform connecting university students for study partnerships, genuine friendships, anonymous confessions, and real campus life.",
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
            <PageViewTracker />
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
