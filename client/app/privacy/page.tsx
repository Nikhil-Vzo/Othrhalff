import { Metadata } from 'next';
import { Privacy } from '../../src/views/StaticPages';

export const metadata: Metadata = {
  title: 'Privacy Policy | OthrHalff',
  description: 'How OthrHalff handles your data. We verify student status but keep you anonymous. We never sell your data.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function Page() {
  return <Privacy />;
}
