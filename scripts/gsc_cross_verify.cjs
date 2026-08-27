const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const path = require('path');

const keyPath = path.join(__dirname, 'gsc-key.json');
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

function fetchGsc(token, bodyData) {
  return new Promise((resolve, reject) => {
    const encodedSite = encodeURIComponent(SITE_URL);
    const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`;
    const postData = JSON.stringify(bodyData);

    const req = https.request(
      endpoint,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
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
    req.write(postData);
    req.end();
  });
}

async function crossVerify() {
  try {
    const token = await getAccessToken();

    // 90 days range
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 2);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log(`\n===============================================================`);
    console.log(`  GOOGLE SEARCH CONSOLE DEEP CROSS-VERIFICATION AUDIT`);
    console.log(`  Site: ${SITE_URL}`);
    console.log(`  Historical Window: ${startDateStr} to ${endDateStr} (Last 90 Days)`);
    console.log(`===============================================================\n`);

    // 1. Query + Page + Country + Device breakdown
    const detailedData = await fetchGsc(token, {
      startDate: startDateStr,
      endDate: endDateStr,
      dimensions: ['query', 'page', 'country', 'device'],
      rowLimit: 50,
    });

    console.log(`🔬 EXACT QUERY BREAKDOWN (Keyword + Landing Page + Country + Device):`);
    if (detailedData.rows && detailedData.rows.length > 0) {
      console.table(
        detailedData.rows.map((r) => ({
          Keyword: r.keys[0],
          'Landing Page': r.keys[1].replace('https://www.othrhalff.in', '').replace('http://othrhalff.in', '') || '/',
          Country: r.keys[2].toUpperCase(),
          Device: r.keys[3],
          Clicks: r.clicks,
          Impressions: r.impressions,
          CTR: `${(r.ctr * 100).toFixed(1)}%`,
          'Avg Position': r.position.toFixed(1),
        }))
      );
    } else {
      console.log('No multidimensional rows found.');
    }

    // 2. Query + Date Timeline breakdown (When did each search happen?)
    const timelineData = await fetchGsc(token, {
      startDate: startDateStr,
      endDate: endDateStr,
      dimensions: ['date', 'query'],
      rowLimit: 50,
    });

    console.log(`\n📅 TIMELINE AUDIT (When these queries were searched on Google):`);
    if (timelineData.rows && timelineData.rows.length > 0) {
      console.table(
        timelineData.rows.map((r) => ({
          Date: r.keys[0],
          Keyword: r.keys[1],
          Clicks: r.clicks,
          Impressions: r.impressions,
          'Avg Position': r.position.toFixed(1),
        }))
      );
    } else {
      console.log('No timeline rows found.');
    }

    // 3. Country breakdown overall
    const countryData = await fetchGsc(token, {
      startDate: startDateStr,
      endDate: endDateStr,
      dimensions: ['country'],
      rowLimit: 10,
    });

    console.log(`\n🌍 TRAFFIC BY COUNTRY:`);
    if (countryData.rows && countryData.rows.length > 0) {
      console.table(
        countryData.rows.map((r) => ({
          Country: r.keys[0].toUpperCase(),
          Clicks: r.clicks,
          Impressions: r.impressions,
          CTR: `${(r.ctr * 100).toFixed(1)}%`,
          'Avg Position': r.position.toFixed(1),
        }))
      );
    }

    console.log(`\n===============================================================\n`);
  } catch (err) {
    console.error('Cross-verification error:', err.message);
  }
}

crossVerify();
