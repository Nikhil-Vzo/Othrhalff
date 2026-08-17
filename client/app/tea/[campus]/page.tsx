import type { Metadata } from 'next';
import { campusList } from '../../../src/seo/data/campuses';
import CampusTeaClient from './CampusTeaClient';

interface Props {
  params: { campus: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const campus = campusList.find(c => c.slug === params.campus) || campusList[0];

  const title = `Anonymous Campus Confessions & Tea – ${campus.name} | Othrhalff`;
  const description = `Read the latest unfiltered campus tea, crushes, gossip, and confessions from verified ${campus.name} students in ${campus.location}. Join the discussion on Othrhalff.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.othrhalff.in/tea/${params.campus}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.othrhalff.in/tea/${params.campus}`,
      type: 'website',
      images: [{ url: 'https://www.othrhalff.in/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export async function generateStaticParams() {
  return campusList.map(campus => ({ campus: campus.slug }));
}

export default function Page({ params }: Props) {
  return <CampusTeaClient campusSlug={params.campus} />;
}
