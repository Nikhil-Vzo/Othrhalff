const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRPC() {
  const { data, error } = await supabase.rpc('get_matches_with_preview', { current_user_id: 'da120f3d-383d-4fc0-8f17-b174bf6fac11' });
  console.log('RPC result:', JSON.stringify({ data, error }, null, 2));

  const { data: nData, error: nError } = await supabase.from('notifications')
    .select('*, fromUser:profiles!notifications_from_user_id_fkey(id, anonymous_id, avatar, university)')
    .eq('user_id', 'da120f3d-383d-4fc0-8f17-b174bf6fac11')
    .limit(1);
  console.log('Notifications result:', JSON.stringify({ data: nData, error: nError }, null, 2));
}

testRPC();
