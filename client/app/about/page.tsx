import { Metadata } from 'next';
import { About } from '../../src/pages/StaticPages';

export const metadata: Metadata = {
  title: 'About OthrHalff',
  description: 'Learn about our mission to bring connection back to campus life without the pressure of superficial swiping.',
};

export default function Page() {
  return <About />;
}
