const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function hideLatestConfession() {
  console.log('=== TEMPORARILY HIDING LATEST CONFESSION (6 HOURS) ===');
  
  // 1. Fetch the latest confession
  const { data: confessions, error: fetchErr } = await supabase
    .from('confessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (fetchErr) {
    console.error('Failed to fetch latest confession:', fetchErr);
    process.exit(1);
  }

  if (!confessions || confessions.length === 0) {
    console.log('No confessions found in table.');
    return;
  }

  const latest = confessions[0];
  console.log(`Found Latest Confession: ID=${latest.id}`);
  console.log(`Content: "${latest.text}"`);
  console.log(`Created At: ${latest.created_at}`);

  // 2. Fetch associated comments, reactions, poll options
  const { data: comments } = await supabase
    .from('confession_comments')
    .select('*')
    .eq('confession_id', latest.id);

  const { data: reactions } = await supabase
    .from('confession_reactions')
    .select('*')
    .eq('confession_id', latest.id);

  const { data: pollOptions } = await supabase
    .from('poll_options')
    .select('*')
    .eq('confession_id', latest.id);

  const backupData = {
    confession: latest,
    comments: comments || [],
    reactions: reactions || [],
    pollOptions: pollOptions || [],
    hiddenAt: new Date().toISOString(),
    restoreAfter: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours later
    durationHours: 6
  };

  const backupPath = path.join(__dirname, 'temp_hidden_confession.json');
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`\nBacked up confession payload to: ${backupPath}`);
  console.log(`Scheduled restoration time: ${backupData.restoreAfter} (6 hours from now)`);

  // 3. Delete the confession from Supabase
  const { error: delErr } = await supabase
    .from('confessions')
    .delete()
    .eq('id', latest.id);

  if (delErr) {
    console.error('Failed to delete confession from Supabase:', delErr);
    process.exit(1);
  }

  console.log(`\nSuccessfully removed confession ${latest.id} from live feed.`);
  console.log('You can restore it anytime with: node scripts/restore_hidden_confession.cjs');
}

hideLatestConfession().catch(console.error);
