"use client";

import { useEffect } from 'react';
import { Ghost, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="relative">
        <Ghost className="w-16 h-16 text-red-500/80 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]" />
      </div>

      <div className="space-y-3 max-w-md">
        <h2 className="text-2xl font-black text-white tracking-tight">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          An unexpected error occurred. Don&apos;t worry — your data is safe. Try refreshing the page.
        </p>
      </div>

      <button
        onClick={reset}
        className="inline-flex items-center gap-2.5 px-6 py-3 bg-white/5 hover:bg-white/10 border border-gray-800 hover:border-[#ff007f]/50 text-white rounded-xl transition-all duration-300 text-sm font-bold tracking-wide group"
      >
        <RefreshCcw className="w-4 h-4 text-gray-400 group-hover:text-[#ff007f] group-hover:rotate-180 transition-all duration-500" />
        Try Again
      </button>
    </div>
  );
}
