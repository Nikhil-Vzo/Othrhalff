import https from 'https';
import { campusList } from '../src/seo/data/campuses.js';

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

const campusUrls = campusList.map(c => `https://${host}/campus/${c.slug}`);
const teaUrls = campusList.map(c => `https://${host}/tea/${c.slug}`);

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
