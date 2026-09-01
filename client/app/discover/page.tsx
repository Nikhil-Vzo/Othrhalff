import { Metadata } from 'next';
import { Discover } from '../../src/views/Discover';

export const metadata: Metadata = {
  title: 'Discover Verified Campus Students – Connect, Match, Vibe | Othrhalff',
  description:
    'Meet verified students from your campus and beyond. Shared study signals, campus radar, and real college connections — only on Othrhalff.',
  alternates: {
    canonical: '/discover',
  },
};

export default function Page() {
  return <Discover />;
}
