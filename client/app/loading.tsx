'use client';

import { LoadingState } from '../src/components/LoadingState';

export default function Loading() {
  return (
    <div className="h-screen w-full bg-black relative">
      <LoadingState />
    </div>
  );
}
