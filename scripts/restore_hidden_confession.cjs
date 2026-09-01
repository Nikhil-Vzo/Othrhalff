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

async function restoreHiddenConfession() {
  console.log('=== RESTORING HIDDEN CONFESSION ===');
  const backupPath = path.join(__dirname, 'temp_hidden_confession.json');

  if (!fs.existsSync(backupPath)) {
    console.log('No backup file found at:', backupPath);
    console.log('Confession may have already been restored.');
    return;
  }

  const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  const { confession, comments, reactions, pollOptions, hiddenAt, restoreAfter } = backupData;

  console.log(`Restoring Confession: ID=${confession.id}`);
  console.log(`Content: "${confession.text}"`);
  console.log(`Originally Hidden At: ${hiddenAt}`);

  // 1. Re-insert the main confession
  const { error: confErr } = await supabase
    .from('confessions')
    .upsert([confession], { onConflict: 'id' });

  if (confErr) {
    console.error('Failed to restore confession:', confErr);
    process.exit(1);
  }
  console.log('Restored main confession record.');

  // 2. Re-insert comments if any
  if (comments && comments.length > 0) {
    const { error: commErr } = await supabase
      .from('confession_comments')
      .upsert(comments, { onConflict: 'id' });
    if (commErr) {
      console.warn('Warning restoring comments:', commErr);
    } else {
      console.log(`Restored ${comments.length} comments.`);
    }
  }

  // 3. Re-insert reactions if any
  if (reactions && reactions.length > 0) {
    const { error: reactErr } = await supabase
      .from('confession_reactions')
      .upsert(reactions, { onConflict: 'id' });
    if (reactErr) {
      console.warn('Warning restoring reactions:', reactErr);
    } else {
      console.log(`Restored ${reactions.length} reactions.`);
    }
  }

  // 4. Re-insert poll options if any
  if (pollOptions && pollOptions.length > 0) {
    const { error: pollErr } = await supabase
      .from('poll_options')
      .upsert(pollOptions, { onConflict: 'id' });
    if (pollErr) {
      console.warn('Warning restoring poll options:', pollErr);
    } else {
      console.log(`Restored ${pollOptions.length} poll options.`);
    }
  }

  // 5. Rename/archive the backup
  const archivePath = path.join(__dirname, `restored_confession_${Date.now()}.json`);
  fs.renameSync(backupPath, archivePath);
  console.log(`\nSuccessfully restored confession to live feed!`);
  console.log(`Backup archived at: ${archivePath}`);
}

restoreHiddenConfession().catch(console.error);
