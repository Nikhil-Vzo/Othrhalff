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
      description: 'The requested campus community could not be found.',
    };
  }

  const title = `Othrhalff ${campus.name} – Campus Community & Anonymous Confessions`;
  const description = `The exclusive campus connection and anonymous confession app for verified ${campus.name} students in ${campus.location}. Match 1-on-1 with campus peers via text & HD video. Join ${campus.studentsCount} students.`;

  // Honest share copy: no user counts. The old OG image rendered
  // "{studentsCount} Verified Students" — that is university enrolment, not
  // Othrhalff users. The meta description above still carries the old line;
  // it is fixed in the follow-up meta-cleanup change, not here.
  const ogSubtitle = `Find people from your own college in ${campus.location}`;
  const ogImageUrl = `https://www.othrhalff.in/api/og?title=${encodeURIComponent(campus.name)}&subtitle=${encodeURIComponent(ogSubtitle)}&type=campus`;
  const ogDescription = `Find people from your own college in ${campus.location} — study partners, gym buddies, anonymous confessions, and real friendships on Othrhalff.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.othrhalff.in/campus/${campus.slug}`,
    },
    openGraph: {
      title,
      description: ogDescription,
      url: `https://www.othrhalff.in/campus/${campus.slug}`,
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${campus.name} Community & Confessions`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${campus.name} Community, Confessions & Campus Chat | Othrhalff`,
      description: `Anonymous confessions, campus-only matching, and student chat for ${campus.name} students on Othrhalff.`,
      images: [ogImageUrl],
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
    '@graph': [
      {
        '@type': 'WebPage',
        name: `Othrhalff ${campus.name} Campus Hub`,
        description: `Campus connections, 1-on-1 video chats, and anonymous confessions for ${campus.name} students.`,
        url: `https://www.othrhalff.in/campus/${campus.slug}`,
        about: {
          '@type': 'CollegeOrUniversity',
          name: campus.name,
          address: {
            '@type': 'PostalAddress',
            addressLocality: campus.location,
            addressCountry: campus.country,
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
            name: 'Campuses',
            item: 'https://www.othrhalff.in/discover',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: campus.name,
            item: `https://www.othrhalff.in/campus/${campus.slug}`,
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
      <CampusPageClient campusSlug={campus.slug} />
    </>
  );
}
