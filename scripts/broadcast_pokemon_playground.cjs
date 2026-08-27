const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../server/.env') });
dotenv.config({ path: path.join(__dirname, '../client/.env') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function broadcastNotification() {
  console.log('====================================================');
  console.log('  BROADCAST NOTIFICATION: 2D CAMPUS PLAYGROUND');
  console.log('====================================================\n');

  // 1. Fetch all users
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id, real_name, anonymous_id, university');

  if (userError || !users) {
    console.error('❌ Failed to fetch user profiles:', userError);
    process.exit(1);
  }

  console.log(`Found ${users.length} registered users to notify.`);

  const title = '🎮 Roam Your Campus in 2D!';
  const message = 'Explore your campus like Pokémon! Walk your retro avatar around campus, bump into nearby students, and chat live in the 2D Playground.';
  const actionUrl = '/playground';

  const notificationsToInsert = users.map((user) => ({
    user_id: user.id,
    from_user_id: null,
    type: 'system',
    title: title,
    message: message,
    action_url: actionUrl,
    read: false,
    created_at: new Date().toISOString(),
  }));

  // Chunk inserts in batches of 50
  const chunkSize = 50;
  let insertedCount = 0;

  for (let i = 0; i < notificationsToInsert.length; i += chunkSize) {
    const chunk = notificationsToInsert.slice(i, i + chunkSize);
    const { error: insertError } = await supabase.from('notifications').insert(chunk);

    if (insertError) {
      console.error(`❌ Error inserting chunk ${i} - ${i + chunk.length}:`, insertError);
    } else {
      insertedCount += chunk.length;
      console.log(`✓ Inserted ${insertedCount}/${notificationsToInsert.length} notifications...`);
    }
  }

  console.log('\n====================================================');
  console.log(`🎉 SUCCESS! Sent 2D Playground notification to ${insertedCount} users.`);
  console.log('====================================================\n');
}

broadcastNotification();
