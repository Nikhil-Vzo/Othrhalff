import { Metadata } from 'next';
import { Safety } from '../../src/views/StaticPages';

export const metadata: Metadata = {
  title: 'Safety Tips | OthrHalff',
  description: 'Stay safe on OthrHalff. Tips for meeting people, protecting your information, and reporting concerns.',
};

export default function Page() {
  return <Safety />;
}
