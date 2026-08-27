import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const campusesFilePath = path.join(__dirname, '../src/seo/data/campuses.ts');
const fileContent = fs.readFileSync(campusesFilePath, 'utf8');

const slugMatches = [...fileContent.matchAll(/slug:\s*'([^']+)'/g)].map(m => m[1]);
const uniqueSlugs = Array.from(new Set(slugMatches));

const host = 'www.othrhalff.in';
const today = new Date().toISOString().split('T')[0];

const staticPages = [
  { loc: `https://${host}/`, priority: '1.0', changefreq: 'daily' },
  { loc: `https://${host}/discover`, priority: '0.95', changefreq: 'daily' },
  { loc: `https://${host}/confessions`, priority: '0.90', changefreq: 'daily' },
  { loc: `https://${host}/reddit`, priority: '0.90', changefreq: 'daily' },
  { loc: `https://${host}/sparx`, priority: '0.85', changefreq: 'weekly' },
  { loc: `https://${host}/vs-omegle`, priority: '0.90', changefreq: 'weekly' },
  { loc: `https://${host}/vs/omegle`, priority: '0.90', changefreq: 'weekly' },
  { loc: `https://${host}/vs/tinder`, priority: '0.85', changefreq: 'weekly' },
  { loc: `https://${host}/vs/bumble`, priority: '0.85', changefreq: 'weekly' },
  { loc: `https://${host}/vs/hinge`, priority: '0.85', changefreq: 'weekly' },
  { loc: `https://${host}/vs/yikyak`, priority: '0.85', changefreq: 'weekly' },
  { loc: `https://${host}/blog`, priority: '0.80', changefreq: 'weekly' },
  { loc: `https://${host}/about`, priority: '0.70', changefreq: 'monthly' },
  { loc: `https://${host}/contact`, priority: '0.70', changefreq: 'monthly' },
  { loc: `https://${host}/guidelines`, priority: '0.60', changefreq: 'monthly' },
  { loc: `https://${host}/terms`, priority: '0.50', changefreq: 'monthly' },
  { loc: `https://${host}/privacy`, priority: '0.50', changefreq: 'monthly' },
];

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

staticPages.forEach(p => {
  xml += `  <url>\n    <loc>${p.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>\n`;
});

uniqueSlugs.forEach(slug => {
  xml += `  <url>\n    <loc>https://${host}/campus/${slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>https://${host}/tea/${slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>hourly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
});

xml += `</urlset>\n`;

const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
fs.writeFileSync(sitemapPath, xml, 'utf8');
console.log(`✓ Successfully generated sitemap.xml with ${staticPages.length + (uniqueSlugs.length * 2)} URLs!`);
