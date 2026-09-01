import { Metadata } from 'next';
import { Landing } from '../src/views/Landing';

export const metadata: Metadata = {
  title: 'OthrHalff - Where anonymous meets destiny.',
  description: 'We are beyond dating. The anonymous campus connection and social network built for university students. Discover real friendships, study buddies, and connections without superficial swiping.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'OthrHalff - Where anonymous meets destiny',
    description: 'We are beyond dating. The anonymous campus connection network built for university students.',
    images: ['/blog/home-screen.webp'],
  }
};

export default function Page() {
  return <Landing />;
}
