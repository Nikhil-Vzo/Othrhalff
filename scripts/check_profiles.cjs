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

async function checkUsers() {
  const { data: users, error, count } = await supabase
    .from('profiles')
    .select('id, real_name, anonymous_id, university', { count: 'exact' });

  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log(`✓ Total registered user profiles: ${users.length}`);
    if (users.length > 0) {
      console.log('Sample profiles:', users.slice(0, 3));
    }
  }
}

checkUsers();
