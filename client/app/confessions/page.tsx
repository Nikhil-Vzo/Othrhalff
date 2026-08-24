import { Metadata } from 'next';
import { Confessions } from '../../src/views/Confessions';

export const metadata: Metadata = {
  title: 'Campus Confessions – Anonymous College Confessions | Othrhalff',
  description:
    'Read and post anonymous confessions from college campuses across India. The unfiltered side of campus life, only on Othrhalff.',
  alternates: {
    canonical: '/confessions',
  },
};

export default function Page() {
  return <Confessions />;
}
