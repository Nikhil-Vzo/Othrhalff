import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { campusList } from '../../../src/seo/data/campuses';
import CampusTeaClient from './CampusTeaClient';

interface Props {
  params: { campus: string };
}

function getCampusBySlug(slug: string) {
  const normalized = (slug || '').toLowerCase().trim();
  return campusList.find(c => c.slug.toLowerCase() === normalized);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const campus = getCampusBySlug(params.campus);
  if (!campus) {
    return {
      title: 'Campus Not Found | Othrhalff',
      description: 'The requested campus confession tea hub could not be found.',
    };
  }

  const title = `Anonymous Campus Confessions & Tea – ${campus.name} | Othrhalff`;
  const description = `Read the latest unfiltered campus tea, crushes, gossip, and confessions from verified ${campus.name} students in ${campus.location}. Join the discussion on Othrhalff.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.othrhalff.in/tea/${campus.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.othrhalff.in/tea/${campus.slug}`,
      type: 'website',
      images: [{ url: 'https://www.othrhalff.in/og-image.webp', width: 1200, height: 630, alt: `${campus.name} Campus Tea` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${campus.name} Campus Tea & Confessions | Othrhalff`,
      description: `What students at ${campus.name} are actually saying right now. Read verified confessions, campus lore, and student tea.`,
      images: ['https://www.othrhalff.in/og-image.webp'],
    },
  };
}

export async function generateStaticParams() {
  return campusList.map(campus => ({ campus: campus.slug }));
}

export default function Page({ params }: Props) {
  const campus = getCampusBySlug(params.campus);
  if (!campus) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${campus.name} Anonymous Campus Confessions & Tea`,
    description: `Unfiltered anonymous confessions, student discussions, and campus tea for ${campus.name}.`,
    url: `https://www.othrhalff.in/tea/${campus.slug}`,
    about: {
      '@type': 'CollegeOrUniversity',
      name: campus.name,
      address: {
        '@type': 'PostalAddress',
        addressLocality: campus.location,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CampusTeaClient campusSlug={campus.slug} />
    </>
  );
}
