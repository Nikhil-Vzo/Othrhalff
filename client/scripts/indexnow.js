import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Campuses
const campusesFilePath = path.join(__dirname, '../src/seo/data/campuses.ts');
const fileContent = fs.readFileSync(campusesFilePath, 'utf8');
const slugMatches = [...fileContent.matchAll(/slug:\s*'([^']+)'/g)].map(m => m[1]);
const uniqueSlugs = Array.from(new Set(slugMatches));

// 2. Blog Posts
const blogFilePath = path.join(__dirname, '../src/data/blogPosts.ts');
const blogContent = fs.readFileSync(blogFilePath, 'utf8');
const blogSlugMatches = [...blogContent.matchAll(/slug:\s*'([^']+)'/g)].map(m => m[1]);
const uniqueBlogSlugs = Array.from(new Set(blogSlugMatches));

// 3. MBTI Personality Combinations
const personalityCodes = ['infp', 'intj', 'enfp', 'infj', 'intp', 'entp', 'enfj', 'entj', 'isfp', 'istp', 'esfp', 'estp', 'isfj', 'istj', 'esfj', 'estj'];
const compatibilityUrls = [];
for (const c1 of personalityCodes) {
  for (const c2 of personalityCodes) {
    compatibilityUrls.push(`https://www.othrhalff.in/compatibility/${c1}-and-${c2}`);
  }
}

const host = 'www.othrhalff.in';
const key = '4f8b91a2c3d4e5f678901234567890ab';
const keyLocation = `https://${host}/${key}.txt`;

const staticUrls = [
  `https://${host}/`,
  `https://${host}/discover`,
  `https://${host}/confessions`,
  `https://${host}/reddit`,
  `https://${host}/sparx`,
  `https://${host}/sparx/music`,
  `https://${host}/playground`,
  `https://${host}/vibe`,
  `https://${host}/vs-omegle`,
  `https://${host}/vs/omegle`,
  `https://${host}/vs/tinder`,
  `https://${host}/vs/bumble`,
  `https://${host}/vs/hinge`,
  `https://${host}/vs/yikyak`,
  `https://${host}/blog`,
  `https://${host}/about`,
  `https://${host}/contact`,
  `https://${host}/safety`,
  `https://${host}/guidelines`,
  `https://${host}/terms`,
  `https://${host}/privacy`,
  `https://${host}/careers`,
  `https://${host}/developers`,
];

const blogUrls = uniqueBlogSlugs.map(slug => `https://${host}/blog/${slug}`);
const campusUrls = uniqueSlugs.map(slug => `https://${host}/campus/${slug}`);
const teaUrls = uniqueSlugs.map(slug => `https://${host}/tea/${slug}`);

const urls = [...staticUrls, ...blogUrls, ...campusUrls, ...teaUrls, ...compatibilityUrls];

const payload = JSON.stringify({
  host,
  key,
  keyLocation,
  urlList: urls
});

console.log(`[IndexNow] Submitting ${urls.length} URLs to IndexNow engine...`);

const req = https.request('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  console.log(`[IndexNow] Response Status Code: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 202) {
      console.log(`✅ [IndexNow] Successfully submitted all ${urls.length} URLs for instant crawling!`);
    } else {
      console.log(`[IndexNow] Result: ${data || res.statusCode}`);
    }
  });
});

req.on('error', (err) => {
  console.error('[IndexNow] Error submitting to IndexNow:', err.message);
});

req.write(payload);
req.end();
