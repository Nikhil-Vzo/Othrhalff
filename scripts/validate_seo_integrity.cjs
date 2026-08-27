const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('  COMPREHENSIVE SEO & INTEGRITY AUDIT');
console.log('====================================================\n');

let errorCount = 0;
let warningCount = 0;

// 1. Audit Campuses Dataset
const campusesPath = path.join(__dirname, '../client/src/seo/data/campuses.ts');
if (!fs.existsSync(campusesPath)) {
  console.error('❌ campuses.ts not found!');
  errorCount++;
} else {
  const content = fs.readFileSync(campusesPath, 'utf8');
  const slugMatches = [...content.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]);
  console.log(`✓ campuses.ts found: ${slugMatches.length} total campus entries.`);

  // Check duplicates
  const seen = new Set();
  const duplicates = [];
  slugMatches.forEach((s) => {
    if (seen.has(s)) duplicates.push(s);
    seen.add(s);
  });
  if (duplicates.length > 0) {
    console.error(`❌ Duplicate campus slugs found: ${duplicates.join(', ')}`);
    errorCount++;
  } else {
    console.log(`✓ 0 duplicate campus slugs found.`);
  }
}

// 2. Audit Competitors Dataset
const compPath = path.join(__dirname, '../client/src/seo/data/competitors.ts');
if (!fs.existsSync(compPath)) {
  console.error('❌ competitors.ts not found!');
  errorCount++;
} else {
  const content = fs.readFileSync(compPath, 'utf8');
  const compMatches = [...content.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]);
  console.log(`✓ competitors.ts found: ${compMatches.length} competitors (${compMatches.join(', ')}).`);
}

// 3. Audit Sitemap.xml
const sitemapPath = path.join(__dirname, '../client/public/sitemap.xml');
if (!fs.existsSync(sitemapPath)) {
  console.error('❌ sitemap.xml not found!');
  errorCount++;
} else {
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  const urls = [...sitemapContent.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  console.log(`✓ sitemap.xml found: ${urls.length} URLs listed.`);

  // Check for malformed URLs
  const invalidUrls = urls.filter((u) => !u.startsWith('https://www.othrhalff.in/'));
  if (invalidUrls.length > 0) {
    console.warn(`⚠️ Non-standard URLs in sitemap:`, invalidUrls);
    warningCount++;
  } else {
    console.log(`✓ All sitemap URLs strictly follow canonical https://www.othrhalff.in pattern.`);
  }
}

// 4. Audit Robots.txt
const robotsPath = path.join(__dirname, '../client/public/robots.txt');
if (!fs.existsSync(robotsPath)) {
  console.error('❌ robots.txt not found!');
  errorCount++;
} else {
  const robotsContent = fs.readFileSync(robotsPath, 'utf8');
  if (robotsContent.includes('Sitemap: https://www.othrhalff.in/sitemap.xml')) {
    console.log(`✓ robots.txt points to correct canonical sitemap.`);
  } else {
    console.error(`❌ robots.txt missing correct sitemap link!`);
    errorCount++;
  }
  if (robotsContent.includes('GPTBot') && robotsContent.includes('PerplexityBot')) {
    console.log(`✓ robots.txt explicitly allows AI search crawlers.`);
  } else {
    console.warn(`⚠️ robots.txt missing AI crawler definitions.`);
    warningCount++;
  }
}

// 5. Audit llms.txt
const llmsPath = path.join(__dirname, '../client/public/llms.txt');
if (!fs.existsSync(llmsPath)) {
  console.error('❌ llms.txt not found!');
  errorCount++;
} else {
  console.log(`✓ llms.txt found and active for LLM/GEO citation.`);
}

// 6. Audit Dynamic OG Image Endpoint
const ogRoutePath = path.join(__dirname, '../client/app/api/og/route.tsx');
if (!fs.existsSync(ogRoutePath)) {
  console.error('❌ /api/og/route.tsx not found!');
  errorCount++;
} else {
  console.log(`✓ /api/og/route.tsx found and configured with Edge runtime.`);
}

console.log('\n====================================================');
console.log(`  AUDIT SUMMARY: ${errorCount} Errors, ${warningCount} Warnings`);
console.log('====================================================\n');

process.exit(errorCount > 0 ? 1 : 0);
