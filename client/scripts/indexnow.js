import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const campusesFilePath = path.join(__dirname, '../src/seo/data/campuses.ts');
const fileContent = fs.readFileSync(campusesFilePath, 'utf8');

// Extract all slug strings from campuses.ts
const slugMatches = [...fileContent.matchAll(/slug:\s*'([^']+)'/g)].map(m => m[1]);
const uniqueSlugs = Array.from(new Set(slugMatches));

const host = 'www.othrhalff.in';
const key = '4f8b91a2c3d4e5f678901234567890ab';
const keyLocation = `https://${host}/${key}.txt`;

const staticUrls = [
  `https://${host}/`,
  `https://${host}/discover`,
  `https://${host}/confessions`,
  `https://${host}/reddit`,
  `https://${host}/sparx`,
  `https://${host}/blog`,
  `https://${host}/about`,
  `https://${host}/vs-omegle`,
  `https://${host}/vs/tinder`,
  `https://${host}/vs/bumble`,
  `https://${host}/vs/hinge`,
  `https://${host}/vs/yikyak`,
];

const campusUrls = uniqueSlugs.map(slug => `https://${host}/campus/${slug}`);
const teaUrls = uniqueSlugs.map(slug => `https://${host}/tea/${slug}`);

const urls = [...staticUrls, ...campusUrls, ...teaUrls];

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
      console.log('✅ [IndexNow] Successfully submitted all URLs for instant crawling!');
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
