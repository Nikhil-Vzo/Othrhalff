import React from 'react';
import { Landing } from '../../views/Landing';
import { campusList, CampusData } from '../data/campuses';

export { campusList };
export type { CampusData };

export const CampusPage: React.FC<{ campusSlug?: string }> = ({ campusSlug }) => {
  const slug = campusSlug || 'delhi-university';
  const campus = campusList.find(c => c.slug === slug) || campusList[0];

  return (
    <>
      {/* 100% Exact Main Landing UI for Human Visitors */}
      <Landing />

      {/* Hidden SEO & AI Discovery Passage for Googlebot & Crawlers */}
      <div className="sr-only font-mono text-[1px] opacity-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <h2>Othrhalff {campus.name} Campus Speed Dating & Anonymous Chat</h2>
        <p>
          The official exclusive campus connection platform for {campus.name} students in {campus.location}. 
          Speed date, text, video chat, and share anonymous confessions with verified {campus.shortName} peers on your campus today.
        </p>
        <p>
          Popular topics among {campus.shortName} students: {campus.popularTopics.join(', ')}.
        </p>
      </div>
    </>
  );
};

export default CampusPage;
