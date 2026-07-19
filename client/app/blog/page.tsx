import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const Blog = dynamic(() => import('../../src/views/Blog').then(mod => mod.Blog), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full bg-[#05000a] flex items-center justify-center">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#ff007f] animate-bounce [animation-delay:0ms]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#ff007f] animate-bounce [animation-delay:150ms]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#ff007f] animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  ),
});

export const metadata: Metadata = {
  title: 'OthrHalff Blog - The Story Behind the App',
  description: 'Read the origin story of Othrhalff, built by engineering students in a dorm room to change how university dating works.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'OthrHalff Blog - The Origin Story',
    description: 'We took the raw energy of an immoral idea and rebuilt it with a moral compass.',
  }
};

export default function Page() {
  return <Blog />;
}
