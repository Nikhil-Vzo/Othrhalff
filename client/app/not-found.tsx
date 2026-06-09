import Link from 'next/link';
import { Ghost, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-8 px-6 text-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#ff007f]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="relative">
          <Ghost className="w-20 h-20 text-gray-700" />
          <div className="absolute -top-2 -right-2 text-4xl font-black text-[#ff007f] drop-shadow-[0_0_15px_rgba(255,0,127,0.5)]">
            ?
          </div>
        </div>

        <div className="space-y-3 max-w-md">
          <h1 className="text-6xl font-black text-white tracking-tighter">
            4<span className="text-[#ff007f]">0</span>4
          </h1>
          <p className="text-lg text-gray-400 font-medium">
            This page ghosted you.
          </p>
          <p className="text-sm text-gray-600">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#ff007f]/10 hover:bg-[#ff007f]/20 border border-[#ff007f]/30 hover:border-[#ff007f]/60 text-white rounded-xl transition-all duration-300 text-sm font-bold tracking-wide group mt-4"
        >
          <ArrowLeft className="w-4 h-4 text-[#ff007f] group-hover:-translate-x-1 transition-transform" />
          Back to Safety
        </Link>
      </div>
    </div>
  );
}
