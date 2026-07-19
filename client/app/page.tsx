import { Metadata } from 'next';
import { Landing } from '../src/views/Landing';

export const metadata: Metadata = {
  title: 'OthrHalff - Where anonymous meets destiny.',
  description: 'The anonymous dating app built for university students. Discover connections without superficial swiping.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'OthrHalff - Where anonymous meets destiny',
    description: 'The anonymous dating app built for university students.',
    images: ['/blog/home-screen.png'],
  }
};

export default function Page() {
  return <Landing />;
}
