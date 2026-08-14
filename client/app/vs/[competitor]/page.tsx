import type { Metadata } from 'next';
import { competitorList } from '../../../src/seo/data/competitors';
import VsCompetitorClient from './client';

interface Props {
  params: { competitor: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const comp = competitorList.find(c => c.slug === params.competitor) || competitorList[0];

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
      images: [{ url: 'https://www.othrhalff.in/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: comp.title,
      description: comp.summary,
    },
  };
}

export async function generateStaticParams() {
  return competitorList.map(comp => ({ competitor: comp.slug }));
}

export default function Page({ params }: Props) {
  return <VsCompetitorClient competitorSlug={params.competitor} />;
}
