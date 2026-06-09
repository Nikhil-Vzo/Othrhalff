import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const Login = dynamic(() => import('../../src/views/Login').then(mod => mod.Login), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen w-full bg-black flex items-center justify-center">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#ff007f] animate-bounce [animation-delay:0ms]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#ff007f] animate-bounce [animation-delay:150ms]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#ff007f] animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  ),
});

export const metadata: Metadata = {
  title: 'Log In | OthrHalff',
  description: 'Sign in to OthrHalff with Google or Magic Link. Start connecting with students on your campus.',
};

export default function Page() {
  return <Login />;
}
