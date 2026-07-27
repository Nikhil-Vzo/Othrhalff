import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from client or server if present
dotenv.config({ path: path.resolve(__dirname, '../client/.env') });
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://cthyiegohnvqtepzoqjf.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('Error: VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY environment variable is missing.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function sendKeepAliveRequests() {
  console.log(`[${new Date().toISOString()}] Starting Supabase Keep-Alive & Site Ping...`);

  // 1. Table REST API Queries
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
      console.error(`  ✗ Table '${table}' request failed:`, err.message);
    }
  }

  // 2. Auth API Endpoint Health Ping
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    console.log(`  ✓ Supabase Auth Health Ping: HTTP ${res.status}`);
  } catch (err) {
    console.error('  ✗ Auth API Ping failed:', err.message);
  }

  // 3. Frontend Site Ping
  const siteUrls = ['https://othrhalff.in', 'https://othrhalff.vercel.app'];
  for (const siteUrl of siteUrls) {
    try {
      const res = await fetch(siteUrl, {
        headers: { 'User-Agent': 'Othrhalff-Supabase-KeepAliveBot/1.0' }
      });
      console.log(`  ✓ Site Ping (${siteUrl}): HTTP ${res.status}`);
    } catch (err) {
      console.error(`  ✗ Site Ping (${siteUrl}) failed:`, err.message);
    }
  }

  console.log(`[${new Date().toISOString()}] Keep-Alive finished successfully.\n`);
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
