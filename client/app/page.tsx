import { Metadata } from 'next';
import { Landing } from '../src/pages/Landing';

export const metadata: Metadata = {
  title: 'OthrHalff - Where anonymous meets destiny.',
  description: 'The anonymous dating app built for university students. Discover connections without superficial swiping.',
  openGraph: {
    title: 'OthrHalff - Where anonymous meets destiny',
    description: 'The anonymous dating app built for university students.',
    images: ['/blog/home-screen.png'],
  }
};

export default function Page() {
  return <Landing />;
}
