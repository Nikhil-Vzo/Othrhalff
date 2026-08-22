import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { campusList } from '../../../src/seo/data/campuses';
import CampusPageClient from './client';

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
      description: 'The requested campus dating and confession community could not be found.',
    };
  }

  const title = `Othrhalff ${campus.name} – Campus Speed Dating & Anonymous Confessions`;
  const description = `The exclusive speed dating and anonymous confession app for verified ${campus.name} students in ${campus.location}. Match 1-on-1 with campus peers via text & HD video. Join ${campus.studentsCount} students.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.othrhalff.in/campus/${campus.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.othrhalff.in/campus/${campus.slug}`,
      type: 'website',
      images: [{ url: 'https://www.othrhalff.in/og-image.webp', width: 1200, height: 630, alt: `${campus.name} Dating & Confessions` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${campus.name} Dating, Confessions & Campus Chat | Othrhalff`,
      description: `Join verified ${campus.name} students on Othrhalff. Anonymous confessions, campus-only matching, and student chat.`,
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
    '@type': 'WebPage',
    name: `Othrhalff ${campus.name} Campus Hub`,
    description: `Speed dating, 1-on-1 video chats, and anonymous confessions for ${campus.name} students.`,
    url: `https://www.othrhalff.in/campus/${campus.slug}`,
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
      <CampusPageClient campusSlug={campus.slug} />
    </>
  );
}
