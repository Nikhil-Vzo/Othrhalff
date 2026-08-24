import { Metadata } from 'next';
import { Discover } from '../../src/views/Discover';

export const metadata: Metadata = {
  title: 'Discover Campus Students – Swipe, Match, Vibe | Othrhalff',
  description:
    'Swipe through verified students from your campus and beyond. Ghost-match, blur reveals and real college connections — only on Othrhalff.',
  alternates: {
    canonical: '/discover',
  },
};

export default function Page() {
  return <Discover />;
}
