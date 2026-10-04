import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Optionally load local env files if dotenv is installed (local testing)
try {
  const dotenv = await import('dotenv');
  dotenv.default?.config({ path: path.resolve(__dirname, '../client/.env') });
  dotenv.default?.config({ path: path.resolve(__dirname, '../client/.env.local') });
  dotenv.default?.config({ path: path.resolve(__dirname, '../server/.env') });
} catch {
  // In CI, variables are injected directly via process.env
}

const SUPABASE_URL = (
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://cthyiegohnvqtepzoqjf.supabase.co'
).trim();

const SUPABASE_ANON_KEY = (
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  ''
).trim();

let supabase = null;
if (SUPABASE_ANON_KEY) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.warn('[Keep-Alive Notice] @supabase/supabase-js not installed. Falling back to HTTP pings.');
  }
} else {
  console.warn('[Keep-Alive Notice] VITE_SUPABASE_ANON_KEY is not configured in GitHub repository secrets.');
  console.warn('[Keep-Alive Notice] Skipping direct database table queries; continuing with public health and site pings.');
}

async function sendKeepAliveRequests() {
  console.log(`[${new Date().toISOString()}] Starting Supabase Keep-Alive & Site Ping...`);

  // 1. Table REST API Queries (if client and key are available)
  if (supabase) {
    const tables = ['confessions', 'matches', 'messages', 'profiles'];
    for (const table of tables) {
      try {
        const { data, error, status } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`  ✓ Table '${table}': HTTP ${status} (Response: ${error.message})`);
        } else {
          console.log(`  ✓ Table '${table}': HTTP ${status} (Fetched ${data ? data.length : 0} record)`);
        }
      } catch (err) {
        console.warn(`  ✗ Table '${table}' request skipped:`, err?.message || err);
      }
    }
  }

  // 2. Auth API Endpoint Health Ping
  try {
    const headers = {};
    if (SUPABASE_ANON_KEY) {
      headers['apikey'] = SUPABASE_ANON_KEY;
      headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
    }
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, { headers });
    console.log(`  ✓ Supabase Auth Health Ping: HTTP ${res.status}`);
  } catch (err) {
    console.warn('  ✗ Auth API Ping skipped/failed:', err?.message || err);
  }

  // 3. Frontend Site Ping (wakes up client and server)
  const siteUrls = ['https://othrhalff.in', 'https://othrhalff.vercel.app'];
  for (const siteUrl of siteUrls) {
    try {
      const res = await fetch(siteUrl, {
        headers: { 'User-Agent': 'Othrhalff-Supabase-KeepAliveBot/1.0' }
      });
      console.log(`  ✓ Site Ping (${siteUrl}): HTTP ${res.status}`);
    } catch (err) {
      console.warn(`  ✗ Site Ping (${siteUrl}) failed:`, err?.message || err);
    }
  }

  console.log(`[${new Date().toISOString()}] Keep-Alive completed successfully.\n`);
}

// Execute immediately
await sendKeepAliveRequests();

// If --watch or --loop argument is passed, repeat every 24 hours
if (process.argv.includes('--watch') || process.argv.includes('--loop')) {
  console.log('Bot is running in continuous mode (pinging every 24 hours)...');
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  setInterval(async () => {
    await sendKeepAliveRequests();
  }, TWENTY_FOUR_HOURS);
}
