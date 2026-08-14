"use client";

import { CampusPage } from '../../../src/seo/views/CampusPage';

export default function CampusPageClient({ campusSlug }: { campusSlug: string }) {
  return <CampusPage campusSlug={campusSlug} />;
}
