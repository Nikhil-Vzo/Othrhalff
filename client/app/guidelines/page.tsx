import { Metadata } from 'next';
import { Guidelines } from '../../src/views/StaticPages';

export const metadata: Metadata = {
  title: 'Community Guidelines | OthrHalff',
  description: 'Our rules for keeping OthrHalff a safe, fun, and inclusive space for all university students.',
  alternates: {
    canonical: '/guidelines',
  },
  openGraph: {
    title: 'Community Guidelines | OthrHalff',
    description: 'Our rules for keeping OthrHalff a safe, fun, and inclusive space for all university students.',
    url: 'https://www.othrhalff.in/guidelines',
    images: ['https://www.othrhalff.in/og-image.webp'],
  },
};

export default function Page() {
  return <Guidelines />;
}
