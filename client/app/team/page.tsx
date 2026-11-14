import { Metadata } from 'next';
import { Developers } from '../../src/views/Developers';

export const metadata: Metadata = {
  // SEO-05: /developers was a team page, not a developer page (no public API
  // exists), so the route is now /team. Title drops the brand suffix — the
  // root layout template adds ' | Othrhalff' once.
  title: 'The Core Team',
  description: 'Meet the team behind Othrhalff — passionate students building the future of campus connection.',
  alternates: {
    canonical: '/team',
  },
  openGraph: {
    title: 'The Core Team | Othrhalff',
    description: 'Meet the team behind Othrhalff — passionate students building the future of campus connection.',
    url: 'https://www.othrhalff.in/team',
    images: ['https://www.othrhalff.in/og-image.webp'],
  },
};

export default function Page() {
  return <Developers />;
}
