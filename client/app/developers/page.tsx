import { Metadata } from 'next';
import { Developers } from '../../src/views/Developers';

export const metadata: Metadata = {
  title: 'The Core Team | OthrHalff',
  description: 'Meet the team behind OthrHalff — passionate students building the future of campus connection.',
};

export default function Page() {
  return <Developers />;
}
