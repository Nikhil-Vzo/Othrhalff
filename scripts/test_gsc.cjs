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

function createJwt() {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

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

async function listSites() {
  try {
    console.log('Authenticating service account:', key.client_email);
    const token = await getAccessToken();
    console.log('✓ Successfully authenticated with Google OAuth2!');

    console.log('Fetching Search Console properties...');
    const req = https.request(
      'https://www.googleapis.com/webmasters/v3/sites',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          const data = JSON.parse(body);
          if (data.siteEntry && data.siteEntry.length > 0) {
            console.log('\n✓ Connected Properties in Search Console:');
            data.siteEntry.forEach((s) => {
              console.log(` - ${s.siteUrl} (Permission: ${s.permissionLevel})`);
            });
          } else {
            console.log('\n! No Search Console properties found for this service account yet.');
            console.log('Please make sure to add this email as a User in Search Console:');
            console.log(key.client_email);
          }
        });
      }
    );

    req.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

listSites();
