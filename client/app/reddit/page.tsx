"use client";

import dynamic from 'next/dynamic';

const RedditHub = dynamic(
  () => import('../../src/seo/views/RedditHub').then(mod => mod.RedditHub),
  { ssr: false }
);

export default function Page() {
  return <RedditHub />;
}
