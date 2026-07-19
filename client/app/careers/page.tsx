import { Metadata } from 'next';
import { Careers } from '../../src/views/Careers';

export const metadata: Metadata = {
  title: 'Careers | OthrHalff',
  description: 'Join the Ghost Crew. We are a small, passionate team building the next generation of social discovery.',
  alternates: {
    canonical: '/careers',
  },
};

export default function Page() {
  return <Careers />;
}
