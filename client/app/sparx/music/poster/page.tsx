import { Metadata } from 'next';
import { SparxPosterGenerator } from '@/views/SparxPosterGenerator';

export const metadata: Metadata = {
  title: 'Sparx FM Print Poster Studio | Othrhalff',
  description: 'Generate and print high-resolution marketing posters for Sparx FM campus radio.',
  robots: { index: false, follow: false }
};

export default function SparxPosterPage() {
  return <SparxPosterGenerator />;
}
