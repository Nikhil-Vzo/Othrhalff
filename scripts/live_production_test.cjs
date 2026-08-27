const https = require('https');

const endpoints = [
  { name: 'Homepage', url: 'https://www.othrhalff.in/' },
  { name: 'Sitemap.xml', url: 'https://www.othrhalff.in/sitemap.xml' },
  { name: 'Robots.txt', url: 'https://www.othrhalff.in/robots.txt' },
  { name: 'LLMs.txt (GEO)', url: 'https://www.othrhalff.in/llms.txt' },
  { name: 'Yandex Verification HTML', url: 'https://www.othrhalff.in/yandex_5cf4af597ca0f9e4.html' },
  { name: 'Pakistan Campus (LUMS)', url: 'https://www.othrhalff.in/campus/lums' },
  { name: 'India Tea Page (IIT Delhi)', url: 'https://www.othrhalff.in/tea/iit-delhi' },
  { name: 'Bangladesh Campus (BUET)', url: 'https://www.othrhalff.in/campus/buet' },
  { name: 'Omegle Comparison', url: 'https://www.othrhalff.in/vs-omegle' },
  { name: 'Tinder Comparison', url: 'https://www.othrhalff.in/vs/tinder' },
  {
    name: 'Dynamic Edge OG Image Generator',
    url: 'https://www.othrhalff.in/api/og?title=LUMS+Confessions&subtitle=Lahore+Campus&students=5500+Students&type=tea',
  },
];

function checkUrl(item) {
  return new Promise((resolve) => {
    https
      .get(item.url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          if (body.length < 50000) body += chunk;
        });
        res.on('end', () => {
          const isOk = res.statusCode === 200;
          const contentType = res.headers['content-type'] || '';
          resolve({
            name: item.name,
            url: item.url,
            statusCode: res.statusCode,
            contentType,
            isOk,
            hasBreadcrumb: body.includes('BreadcrumbList'),
            hasSchema: body.includes('application/ld+json'),
            bodyLength: body.length,
          });
        });
      })
      .on('error', (err) => {
        resolve({
          name: item.name,
          url: item.url,
          statusCode: 'ERR',
          error: err.message,
          isOk: false,
        });
      });
  });
}

async function runLiveAudit() {
  console.log('====================================================');
  console.log('  LIVE PRODUCTION HEALTH & SEO VERIFICATION');
  console.log('====================================================\n');

  let allPassed = true;

  for (const ep of endpoints) {
    const result = await checkUrl(ep);
    const statusIcon = result.isOk ? '✅' : '❌';
    console.log(`${statusIcon} [${result.statusCode}] ${result.name}`);
    console.log(`   URL: ${result.url}`);
    if (result.contentType) console.log(`   Type: ${result.contentType}`);
    if (result.hasBreadcrumb) console.log(`   ✓ BreadcrumbList Schema detected`);
    if (result.hasSchema) console.log(`   ✓ JSON-LD Structured Data detected`);
    console.log('');
    if (!result.isOk) allPassed = false;
  }

  console.log('====================================================');
  if (allPassed) {
    console.log('  🎉 ALL PRODUCTION ENDPOINTS 100% OPERATIONAL & VERIFIED!');
  } else {
    console.log('  ⚠️ SOME ENDPOINTS NEED ATTENTION');
  }
  console.log('====================================================\n');
}

runLiveAudit();
