"use client";

import { VsCompetitor } from '../../../src/seo/views/VsCompetitor';

export default function VsCompetitorClient({ competitorSlug }: { competitorSlug: string }) {
  return <VsCompetitor competitorSlug={competitorSlug} />;
}
