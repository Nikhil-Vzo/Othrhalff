import type { Metadata } from 'next';
import VsOmegleClient from './client';

export const metadata: Metadata = {
  title: 'Othrhalff vs Omegle – The Safe, Verified Campus Alternative & Omegle Confessions',
  description:
    'Omegle shut down in 2023. Othrhalff is the safe, verified Omegle alternative for college students—1-on-1 speed video & text chat with verified campus peers and anonymous campus confessions. No strangers, no creeps.',
  alternates: {
    canonical: 'https://www.othrhalff.in/vs-omegle',
  },
  openGraph: {
    title: 'Othrhalff vs Omegle – Safe Campus Video Chat & Confessions',
    description:
      'Omegle is gone. Othrhalff is the campus-verified Omegle alternative—1-on-1 speed video chat and anonymous confessions with real college students.',
    url: 'https://www.othrhalff.in/vs-omegle',
    type: 'website',
    images: [{ url: 'https://www.othrhalff.in/og-image.webp', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Othrhalff vs Omegle – Safe Campus Alternative',
    description: 'The campus-verified Omegle alternative and anonymous confessions for college students.',
    images: ['https://www.othrhalff.in/og-image.webp'],
  },
  keywords: [
    'omegle alternative',
    'omegle confessions',
    'omegle alternative india',
    'omegle for college students',
    'random video chat college',
    'safe omegle replacement',
    'campus video chat india',
    'anonymous college chat',
    'college speed dating video',
    'omegle alternative 2026',
  ],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      name: 'Othrhalff vs Omegle – Safe Campus Video Chat & Confessions',
      description:
        'Omegle shut down in 2023. Othrhalff is the safe, verified Omegle alternative for university students with 1-on-1 speed video dating and anonymous campus confession boards.',
      url: 'https://www.othrhalff.in/vs-omegle',
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Othrhalff',
      applicationCategory: 'SocialNetworkingApplication',
      operatingSystem: 'Web, iOS, Android',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '1240',
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.othrhalff.in',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Comparisons',
          item: 'https://www.othrhalff.in/vs/omegle',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Othrhalff vs Omegle',
          item: 'https://www.othrhalff.in/vs-omegle',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is the best safe Omegle alternative for college students?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Othrhalff is the top safe Omegle alternative built specifically for university students. It requires college email verification so you only connect with real, verified students on campus without random anonymous strangers or creeps.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does Othrhalff compare to Omegle for campus confessions?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Unlike Omegle, Othrhalff provides a dedicated Anonymous Campus Confessions Board where students can share secrets, vote on campus polls, and directly match with other students from their university safely.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Othrhalff free to use?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! Othrhalff is free for university students to join, browse campus confessions, and participate in 1-on-1 speed video and text chats.',
          },
        },
      ],
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <VsOmegleClient />
    </>
  );
}
