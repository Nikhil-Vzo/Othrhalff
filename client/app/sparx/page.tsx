import { Metadata } from 'next';
import { Sparx } from '../../src/views/Sparx';

export const metadata: Metadata = {
  title: 'Sparx – Campus Playground & 24x7 Radio | Othrhalff',
  description:
    'Play on the interactive campus map, hang out in the pixel playground and tune into SparxFM — the 24x7 campus radio run by students.',
  alternates: {
    canonical: '/sparx',
  },
  openGraph: {
    title: 'Sparx – Campus Playground & 24x7 Radio | Othrhalff',
    description: 'Play on the interactive campus map, hang out in the pixel playground and tune into SparxFM — the 24x7 campus radio run by students.',
    url: 'https://www.othrhalff.in/sparx',
    images: ['https://www.othrhalff.in/og-image.webp'],
  },
};

export default function Page() {
  return <Sparx />;
}
