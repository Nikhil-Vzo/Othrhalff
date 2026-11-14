import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { competitorList } from '../../../src/seo/data/competitors';
import VsCompetitorClient from './client';
import { VsOmegle } from '../../../src/seo/views/VsOmegle';

interface Props {
  params: { competitor: string };
}

function getCompetitorBySlug(slug: string) {
  const normalized = (slug || '').toLowerCase().trim();
  return competitorList.find(c => c.slug.toLowerCase() === normalized);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const comp = getCompetitorBySlug(params.competitor);
  if (!comp) {
    return {
      title: 'Comparison Not Found | Othrhalff',
      description: 'The requested comparison page could not be found.',
    };
  }

  return {
    title: comp.title,
    description: comp.summary,
    alternates: {
      canonical: `https://www.othrhalff.in/vs/${comp.slug}`,
    },
    openGraph: {
      title: comp.title,
      description: comp.summary,
      url: `https://www.othrhalff.in/vs/${comp.slug}`,
      type: 'website',
      images: [{ url: 'https://www.othrhalff.in/og-image.webp', width: 1200, height: 630, alt: comp.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: comp.title,
      description: comp.summary,
      images: ['https://www.othrhalff.in/og-image.webp'],
    },
  };
}

export async function generateStaticParams() {
  return competitorList.map(comp => ({ competitor: comp.slug }));
}

export default function Page({ params }: Props) {
  const comp = getCompetitorBySlug(params.competitor);
  if (!comp) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: comp.title,
        description: comp.summary,
        url: `https://www.othrhalff.in/vs/${comp.slug}`,
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
            item: 'https://www.othrhalff.in/vs/tinder',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: `Othrhalff vs ${comp.name}`,
            item: `https://www.othrhalff.in/vs/${comp.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* SEO-03: /vs/omegle is the single canonical Omegle page. The old
          bespoke /vs-omegle page had richer content (a "why Omegle failed"
          section and a 7-row table vs 5 here), so the canonical URL renders
          that view instead of the generic one — no content is lost in the
          merge. The old page's extra SoftwareApplication JSON-LD (including
          an unverified 4.8/1240 aggregate rating) is deliberately NOT carried
          over; that claim belongs to SEO-08's copy-truth pass. */}
      {comp.slug === 'omegle' ? <VsOmegle /> : <VsCompetitorClient competitorSlug={comp.slug} />}
    </>
  );
}
