import React from 'react';
import { Landing } from '../../views/Landing';
import { outreachKitList } from '../data/outreachKit';

export const RedditHub: React.FC = () => {
  return (
    <>
      {/* 100% Exact Main Landing UI for Human Visitors */}
      <Landing />

      {/* Hidden SEO & AI Discovery Passage for Googlebot & Crawlers */}
      <div className="sr-only font-mono text-[1px] opacity-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <h2>Reddit & Quora Verified Campus Discussion Hub</h2>
        <p>Explore verified Q&A threads across Reddit, Quora, X (Twitter), and student hubs for Othrhalff campus speed dating and anonymous student chat.</p>
        <ul>
          {outreachKitList.slice(0, 10).map((item, idx) => (
            <li key={idx}>
              <strong>{item.title}</strong>: {item.content}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default RedditHub;
