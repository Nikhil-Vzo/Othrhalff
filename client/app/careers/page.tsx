import { Metadata } from 'next';
import { Careers } from '../../src/views/Careers';

export const metadata: Metadata = {
  title: 'Careers | OthrHalff',
  description: 'Join the Ghost Crew. We are a small, passionate team building the next generation of social discovery.',
  alternates: {
    canonical: '/careers',
  },
  openGraph: {
    title: 'Careers | OthrHalff – Join the Ghost Crew',
    description: 'Join the Ghost Crew. We are a small, passionate team building the next generation of social discovery.',
    url: 'https://www.othrhalff.in/careers',
    images: ['https://www.othrhalff.in/og-image.webp'],
  },
};

export default function Page() {
  return <Careers />;
}
