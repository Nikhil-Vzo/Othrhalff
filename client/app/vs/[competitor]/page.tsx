import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { competitorList } from '../../../src/seo/data/competitors';
import VsCompetitorClient from './client';

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
      images: [{ url: 'https://www.othrhalff.in/og-image.png', width: 1200, height: 630, alt: comp.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: comp.title,
      description: comp.summary,
      images: ['https://www.othrhalff.in/og-image.png'],
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
    '@type': 'WebPage',
    name: comp.title,
    description: comp.summary,
    url: `https://www.othrhalff.in/vs/${comp.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <VsCompetitorClient competitorSlug={comp.slug} />
    </>
  );
}
