import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { personalityTypes, calculateCompatibility } from '../../../src/seo/data/personalityTypes';
import { CompatibilityView } from '../../../src/seo/views/CompatibilityView';

interface Props {
  params: { slug: string };
}

function parsePairFromSlug(slug: string) {
  const parts = (slug || '').toLowerCase().split('-and-');
  if (parts.length !== 2) return null;
  const [codeA, codeB] = parts;
  const typeA = personalityTypes.find(t => t.code.toLowerCase() === codeA);
  const typeB = personalityTypes.find(t => t.code.toLowerCase() === codeB);
  if (!typeA || !typeB) return null;
  return calculateCompatibility(typeA.code, typeB.code);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pair = parsePairFromSlug(params.slug);
  if (!pair) {
    return {
      title: 'Compatibility Not Found | Othrhalff',
      description: 'The requested personality compatibility pairing could not be found.',
    };
  }

  const { typeA, typeB, score, chemistryTier } = pair;
  const title = `${typeA.code} and ${typeB.code} Compatibility (${score}% ${chemistryTier}) | Othrhalff`;
  const description = `Psychological compatibility analysis for ${typeA.name} (${typeA.code}) and ${typeB.name} (${typeB.code}). Dating dynamics, communication prompts, and campus speed dating.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.othrhalff.in/compatibility/${params.slug.toLowerCase()}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.othrhalff.in/compatibility/${params.slug.toLowerCase()}`,
      type: 'article',
      images: [
        {
          url: `https://www.othrhalff.in/api/og?title=${encodeURIComponent(`${typeA.code} + ${typeB.code}`)}&subtitle=${encodeURIComponent(`${score}% ${chemistryTier}`)}&category=COMPATIBILITY&type=campus`,
          width: 1200,
          height: 630,
          alt: `${typeA.code} and ${typeB.code} Compatibility`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`https://www.othrhalff.in/api/og?title=${encodeURIComponent(`${typeA.code} + ${typeB.code}`)}&subtitle=${encodeURIComponent(`${score}% ${chemistryTier}`)}&category=COMPATIBILITY&type=campus`],
    },
  };
}

export async function generateStaticParams() {
  const params: { slug: string }[] = [];
  for (const t1 of personalityTypes) {
    for (const t2 of personalityTypes) {
      params.push({ slug: `${t1.code.toLowerCase()}-and-${t2.code.toLowerCase()}` });
    }
  }
  return params;
}

export default function Page({ params }: Props) {
  const pair = parsePairFromSlug(params.slug);
  if (!pair) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: `${pair.typeA.code} and ${pair.typeB.code} Romantic Compatibility Report`,
        description: pair.summary,
        author: {
          '@type': 'Organization',
          name: 'Othrhalff Research',
          url: 'https://www.othrhalff.in',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Othrhalff',
          logo: {
            '@type': 'ImageObject',
            url: 'https://www.othrhalff.in/icons/icon-512x512.png',
          },
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
            name: 'Compatibility Radar',
            item: 'https://www.othrhalff.in/vibe',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: `${pair.typeA.code} + ${pair.typeB.code}`,
            item: `https://www.othrhalff.in/compatibility/${params.slug}`,
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
      <CompatibilityView pair={pair} />
    </>
  );
}
