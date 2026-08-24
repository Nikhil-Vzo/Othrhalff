import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const RedditHub = dynamic(
  () => import('../../src/seo/views/RedditHub').then(mod => mod.RedditHub),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Othrhalff on Reddit – Real Campus Reviews & Discussions',
  description:
    'What real college students say about Othrhalff — reviews, discussions and honest takes from Reddit, all in one place.',
  alternates: {
    canonical: '/reddit',
  },
};

export default function Page() {
  return <RedditHub />;
}
