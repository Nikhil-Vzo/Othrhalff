import { Metadata } from 'next';
import { Terms } from '../../src/views/StaticPages';

export const metadata: Metadata = {
  title: 'Terms of Service | OthrHalff',
  description: 'Terms of Service for OthrHalff. By using this platform, you agree to our terms and conditions.',
  alternates: {
    canonical: '/terms',
  },
};

export default function Page() {
  return <Terms />;
}
