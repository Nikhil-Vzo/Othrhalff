import type { Metadata } from 'next';
import { campusList } from '../../../../src/seo/data/campuses';
import TeaPageClient from './client';

interface Props {
  params: { campus: string; id: string };
}

// Generate a deterministic "confession preview" for metadata (won't use DB for now)
function getConfessionPreview(id: string, campusShortName: string): string {
  // In production this would fetch from DB. For static SEO, we use a templated preview.
  const previews = [
    `An anonymous ${campusShortName} student shared something everyone was thinking...`,
    `A confession from ${campusShortName} that hit different at 2am...`,
    `The ${campusShortName} campus has secrets. This one got 200+ reactions.`,
    `Someone at ${campusShortName} said the quiet part out loud.`,
    `This anonymous ${campusShortName} confession started a whole conversation.`,
  ];
  // Deterministic based on ID so it's stable for crawlers
  const idx = parseInt(id, 10) % previews.length;
  return previews[isNaN(idx) ? 0 : idx];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const campus = campusList.find(c => c.slug === params.campus) || campusList[0];
  const preview = getConfessionPreview(params.id, campus.shortName);

  const title = `Anonymous Confession at ${campus.name} #${params.id} | Othrhalff`;
  const description = `${preview} Read campus confessions, react, and connect anonymously with verified ${campus.shortName} students on Othrhalff.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.othrhalff.in/tea/${params.campus}/${params.id}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.othrhalff.in/tea/${params.campus}/${params.id}`,
      type: 'article',
      images: [{ url: 'https://www.othrhalff.in/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function Page({ params }: Props) {
  return <TeaPageClient campusSlug={params.campus} confessionId={params.id} />;
}
