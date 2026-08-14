import type { Metadata } from 'next';
import { campusList } from '../../../src/seo/data/campuses';
import CampusPageClient from './client';

interface Props {
  params: { campus: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const campus = campusList.find(c => c.slug === params.campus) || campusList[0];

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
  return <CampusPageClient campusSlug={params.campus} />;
}
