const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../server/.env') });
dotenv.config({ path: path.join(__dirname, '../client/.env') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, serviceKey);

async function inspectChatActivity() {
  console.log('====================================================');
  console.log('       OTHRHALFF SAFETY & MODERATION AUDITOR        ');
  console.log('====================================================\n');

  // 1. Check Reported Users & Support Tickets
  console.log('--- 1. RECENT USER ABUSE & REPORT TICKETS ---');
  const { data: reports, error: reportErr } = await adminSupabase
    .from('support_tickets')
    .select('id, user_id, email, category, message, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (reportErr) {
    console.error('Error fetching reports:', reportErr);
  } else if (!reports || reports.length === 0) {
    console.log('No open reports or support tickets found.\n');
  } else {
    console.log(`Found ${reports.length} recent support tickets / reports:`);
    reports.forEach((r, idx) => {
      console.log(`[${idx + 1}] Category: ${r.category} | Status: ${r.status} | Time: ${r.created_at}`);
      console.log(`    From: ${r.email} (User: ${r.user_id || 'Guest'})`);
      console.log(`    Message: ${r.message.slice(0, 120)}${r.message.length > 120 ? '...' : ''}\n`);
    });
  }

  // 2. Fetch Recent Chat Messages
  console.log('--- 2. RECENT CHAT MESSAGES (LATEST 25) ---');
  const { data: messages, error: msgErr } = await adminSupabase
    .from('messages')
    .select('id, match_id, sender_id, text, created_at')
    .order('created_at', { ascending: false })
    .limit(25);

  if (msgErr) {
    console.error('Error fetching messages:', msgErr);
  } else if (!messages || messages.length === 0) {
    console.log('No recent messages found in database.\n');
  } else {
    console.log(`Retrieved ${messages.length} recent messages for safety audit:\n`);
    messages.forEach((m, idx) => {
      console.log(`[#${idx + 1}] Match: ${m.match_id.slice(0, 8)}... | Sender: ${m.sender_id ? m.sender_id.slice(0, 8) + '...' : 'Unknown'} | Time: ${m.created_at}`);
      console.log(`     Text: "${m.text}"`);
    });
  }
}

inspectChatActivity();
