import https from 'https';

const host = 'www.othrhalff.in';
const key = '4f8b91a2c3d4e5f678901234567890ab';
const keyLocation = `https://${host}/${key}.txt`;

const urls = [
  `https://${host}/`,
  `https://${host}/discover`,
  `https://${host}/confessions`,
  `https://${host}/sparx`,
  `https://${host}/blog`,
  `https://${host}/about`,
  `https://${host}/vs-omegle`,
  `https://${host}/vs/tinder`,
  `https://${host}/vs/bumble`,
  `https://${host}/vs/hinge`,
  `https://${host}/vs/yikyak`,
  `https://${host}/campus/delhi-university`,
  `https://${host}/campus/iit-delhi`,
  `https://${host}/campus/iit-bombay`,
  `https://${host}/campus/bits-pilani`,
  `https://${host}/campus/christ-university`,
  `https://${host}/campus/manipal-university`,
  `https://${host}/campus/amity-noida`,
  `https://${host}/campus/amity-raipur`,
  `https://${host}/campus/amity-gurgaon`,
  `https://${host}/campus/amity-jaipur`,
  `https://${host}/campus/amity-lucknow`,
  `https://${host}/campus/amity-mumbai`,
  `https://${host}/campus/amity-kolkata`,
  `https://${host}/campus/sharda-university`,
  `https://${host}/campus/kiit-university`,
  `https://${host}/campus/nit-raipur`,
  `https://${host}/campus/aiims-raipur`,
  `https://${host}/campus/hnlu-raipur`,
  `https://${host}/campus/bit-durg`,
  `https://${host}/campus/ssipmt-raipur`,
  `https://${host}/campus/csvtu-bhilai`,
  `https://${host}/campus/mats-university`,
  `https://${host}/campus/itm-university-raipur`,
  `https://${host}/campus/vit-vellore`,
  `https://${host}/campus/srm-chennai`,
  `https://${host}/campus/lpu-punjab`
];

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
