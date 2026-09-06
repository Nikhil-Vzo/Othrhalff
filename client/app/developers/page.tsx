import { Metadata } from 'next';
import { Developers } from '../../src/views/Developers';

export const metadata: Metadata = {
  title: 'The Core Team | OthrHalff',
  description: 'Meet the team behind OthrHalff — passionate students building the future of campus connection.',
  alternates: {
    canonical: '/developers',
  },
  openGraph: {
    title: 'The Core Team | OthrHalff',
    description: 'Meet the team behind OthrHalff — passionate students building the future of campus connection.',
    url: 'https://www.othrhalff.in/developers',
    images: ['https://www.othrhalff.in/og-image.webp'],
  },
};

export default function Page() {
  return <Developers />;
}
