const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const path = require('path');

const keyPath = path.join(__dirname, 'gsc-key.json');
if (!fs.existsSync(keyPath)) {
  console.error('Key file not found at:', keyPath);
  process.exit(1);
}

const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
const SITE_URL = 'sc-domain:othrhalff.in';

function createJwt() {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodeBase64Url = (obj) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const encodedHeader = encodeBase64Url(header);
  const encodedClaim = encodeBase64Url(claim);
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = signer
    .sign(key.private_key, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signatureInput}.${signature}`;
}

function getAccessToken() {
  return new Promise((resolve, reject) => {
    const jwt = createJwt();
    const postData = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;

    const req = https.request(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.access_token) {
              resolve(data.access_token);
            } else {
              reject(new Error(JSON.stringify(data)));
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function fetchGscData(token, endpoint, bodyData = null, method = 'GET') {
  return new Promise((resolve, reject) => {
    const postData = bodyData ? JSON.stringify(bodyData) : '';
    const req = https.request(
      endpoint,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(bodyData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        });
      }
    );

    req.on('error', reject);
    if (bodyData) req.write(postData);
    req.end();
  });
}

async function analyzeSearchPerformance() {
  try {
    const token = await getAccessToken();

    // 1. Get Date Range (last 28 days)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 2); // Search console has a 2-day reporting lag
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`\n======================================================`);
    console.log(`  OTHRHALFF SEARCH PERFORMANCE REPORT (Google Search Console)`);
    console.log(`  Property: ${SITE_URL}`);
    console.log(`  Date Range: ${startDateStr} to ${endDateStr}`);
    console.log(`======================================================\n`);

    const encodedSite = encodeURIComponent(SITE_URL);
    const searchAnalyticsUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`;

    // A. Overall Totals
    const totalsRes = await fetchGscData(
      token,
      searchAnalyticsUrl,
      {
        startDate: startDateStr,
        endDate: endDateStr,
        dimensions: ['date'],
      },
      'POST'
    );

    let totalClicks = 0;
    let totalImpressions = 0;
    let avgCtr = 0;
    let avgPosition = 0;

    if (totalsRes.rows && totalsRes.rows.length > 0) {
      totalsRes.rows.forEach((r) => {
        totalClicks += r.clicks;
        totalImpressions += r.impressions;
        avgPosition += r.position;
      });
      avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;
      avgPosition = (avgPosition / totalsRes.rows.length).toFixed(1);
    }

    console.log(`📊 TOTAL SUMMARY:`);
    console.log(` • Total Clicks:      ${totalClicks}`);
    console.log(` • Total Impressions: ${totalImpressions}`);
    console.log(` • Average CTR:       ${avgCtr}%`);
    console.log(` • Average Position:  ${avgPosition}\n`);

    // B. Top Queries / Keywords
    const queryRes = await fetchGscData(
      token,
      searchAnalyticsUrl,
      {
        startDate: startDateStr,
        endDate: endDateStr,
        dimensions: ['query'],
        rowLimit: 25,
      },
      'POST'
    );

    console.log(`🔍 TOP SEARCH QUERIES / KEYWORDS:`);
    if (queryRes.rows && queryRes.rows.length > 0) {
      console.table(
        queryRes.rows.map((r) => ({
          Keyword: r.keys[0],
          Clicks: r.clicks,
          Impressions: r.impressions,
          CTR: `${(r.ctr * 100).toFixed(1)}%`,
          'Avg Position': r.position.toFixed(1),
        }))
      );
    } else {
      console.log('  No keyword query data recorded for this period yet.\n');
    }

    // C. Top Landing Pages
    const pageRes = await fetchGscData(
      token,
      searchAnalyticsUrl,
      {
        startDate: startDateStr,
        endDate: endDateStr,
        dimensions: ['page'],
        rowLimit: 25,
      },
      'POST'
    );

    console.log(`\n📄 TOP LANDING PAGES IN GOOGLE SEARCH:`);
    if (pageRes.rows && pageRes.rows.length > 0) {
      console.table(
        pageRes.rows.map((r) => ({
          Page: r.keys[0].replace('https://othrhalff.in', '').replace('http://othrhalff.in', '') || '/',
          Clicks: r.clicks,
          Impressions: r.impressions,
          CTR: `${(r.ctr * 100).toFixed(1)}%`,
          'Avg Position': r.position.toFixed(1),
        }))
      );
    } else {
      console.log('  No landing page data recorded for this period yet.\n');
    }

    // D. Sitemaps
    const sitemapsUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps`;
    const sitemapsRes = await fetchGscData(token, sitemapsUrl, null, 'GET');

    console.log(`\n🗺️ SITEMAP STATUS:`);
    if (sitemapsRes.sitemap && sitemapsRes.sitemap.length > 0) {
      sitemapsRes.sitemap.forEach((s) => {
        console.log(` • ${s.path} (Status: ${s.isPending ? 'Pending' : 'Indexed'}, Warnings: ${s.warnings || 0}, Errors: ${s.errors || 0})`);
      });
    } else {
      console.log(' • No sitemaps submitted yet via Search Console API.');
    }

    console.log(`\n======================================================\n`);
  } catch (err) {
    console.error('Error fetching Search Console report:', err.message);
  }
}

analyzeSearchPerformance();
