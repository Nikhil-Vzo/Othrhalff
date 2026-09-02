import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Campus Slugs
const campusesFilePath = path.join(__dirname, '../src/seo/data/campuses.ts');
const fileContent = fs.readFileSync(campusesFilePath, 'utf8');
const slugMatches = [...fileContent.matchAll(/slug:\s*'([^']+)'/g)].map(m => m[1]);
const uniqueSlugs = Array.from(new Set(slugMatches));

// 2. Blog Post Slugs & Lastmod
const blogFilePath = path.join(__dirname, '../src/data/blogPosts.ts');
const blogContent = fs.readFileSync(blogFilePath, 'utf8');
const blogEntries = [];
const postBlocks = blogContent.split(/\{\s*slug:/).slice(1);
postBlocks.forEach(block => {
  const slugM = block.match(/^\s*'([^']+)'/);
  const modM = block.match(/modifiedDate:\s*'([^']+)'/);
  if (slugM) {
    blogEntries.push({
      slug: slugM[1],
      lastmod: modM ? modM[1] : new Date().toISOString().split('T')[0]
    });
  }
});

// 3. MBTI Personality Compatibility Slugs (16x16 = 256 matrix)
const personalityCodes = ['infp', 'intj', 'enfp', 'infj', 'intp', 'entp', 'enfj', 'entj', 'isfp', 'istp', 'esfp', 'estp', 'isfj', 'istj', 'esfj', 'estj'];
const compatibilitySlugs = [];
for (const c1 of personalityCodes) {
  for (const c2 of personalityCodes) {
    compatibilitySlugs.push(`${c1}-and-${c2}`);
  }
}

const host = 'www.othrhalff.in';
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

const staticPages = [
  { loc: `https://${host}/`, priority: '1.0', changefreq: 'daily' },
  { loc: `https://${host}/discover`, priority: '0.95', changefreq: 'daily' },
  { loc: `https://${host}/confessions`, priority: '0.90', changefreq: 'daily' },
  { loc: `https://${host}/reddit`, priority: '0.90', changefreq: 'daily' },
  { loc: `https://${host}/sparx`, priority: '0.85', changefreq: 'weekly' },
  { loc: `https://${host}/sparx/music`, priority: '0.90', changefreq: 'daily' },
  { loc: `https://${host}/playground`, priority: '0.85', changefreq: 'daily' },
  { loc: `https://${host}/vibe`, priority: '0.85', changefreq: 'weekly' },
  { loc: `https://${host}/vs-omegle`, priority: '0.90', changefreq: 'weekly' },
  { loc: `https://${host}/vs/omegle`, priority: '0.90', changefreq: 'weekly' },
  { loc: `https://${host}/vs/tinder`, priority: '0.85', changefreq: 'weekly' },
  { loc: `https://${host}/vs/bumble`, priority: '0.85', changefreq: 'weekly' },
  { loc: `https://${host}/vs/hinge`, priority: '0.85', changefreq: 'weekly' },
  { loc: `https://${host}/vs/yikyak`, priority: '0.85', changefreq: 'weekly' },
  { loc: `https://${host}/blog`, priority: '0.80', changefreq: 'weekly' },
  { loc: `https://${host}/about`, priority: '0.70', changefreq: 'monthly' },
  { loc: `https://${host}/contact`, priority: '0.70', changefreq: 'monthly' },
  { loc: `https://${host}/safety`, priority: '0.60', changefreq: 'monthly' },
  { loc: `https://${host}/guidelines`, priority: '0.60', changefreq: 'monthly' },
  { loc: `https://${host}/terms`, priority: '0.50', changefreq: 'monthly' },
  { loc: `https://${host}/privacy`, priority: '0.50', changefreq: 'monthly' },
  { loc: `https://${host}/careers`, priority: '0.50', changefreq: 'monthly' },
  { loc: `https://${host}/developers`, priority: '0.50', changefreq: 'monthly' },
];

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

// Static Core Pages
staticPages.forEach(p => {
  xml += `  <url>\n    <loc>${p.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>\n`;
});

// Blog Posts
blogEntries.forEach(b => {
  xml += `  <url>\n    <loc>https://${host}/blog/${b.slug}</loc>\n    <lastmod>${b.lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
});

// Campuses & Tea Hubs
uniqueSlugs.forEach(slug => {
  xml += `  <url>\n    <loc>https://${host}/campus/${slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>https://${host}/tea/${slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>hourly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
});

// Personality Compatibility Pairings
compatibilitySlugs.forEach(slug => {
  xml += `  <url>\n    <loc>https://${host}/compatibility/${slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.65</priority>\n  </url>\n`;
});

xml += `</urlset>\n`;

const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
fs.writeFileSync(sitemapPath, xml, 'utf8');

const totalUrls = staticPages.length + blogEntries.length + (uniqueSlugs.length * 2) + compatibilitySlugs.length;
console.log(`✓ Successfully generated sitemap.xml with ${totalUrls} URLs! (Static: ${staticPages.length}, Blogs: ${blogEntries.length}, Campuses: ${uniqueSlugs.length * 2}, Compatibility: ${compatibilitySlugs.length})`);
