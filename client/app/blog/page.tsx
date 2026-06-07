import { Metadata } from 'next';
import { Blog } from '../../src/pages/Blog';

export const metadata: Metadata = {
  title: 'OthrHalff Blog - The Story Behind the App',
  description: 'Read the origin story of Othrhalff, built by engineering students in a dorm room to change how university dating works.',
  openGraph: {
    title: 'OthrHalff Blog - The Origin Story',
    description: 'We took the raw energy of an immoral idea and rebuilt it with a moral compass.',
  }
};

export default function Page() {
  return <Blog />;
}
