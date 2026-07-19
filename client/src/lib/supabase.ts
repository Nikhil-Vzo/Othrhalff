import { createClient } from '@supabase/supabase-js';

// Get environment variables from .env file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

// Create the Supabase client
// Fixed storageKey so auth sessions persist even if the URL changes
// (e.g., switching between supabase.co and jiobase.com proxy)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: 'sb-cthyiegohnvqtepzoqjf-auth-token',
    experimental: {
      passkey: true,
    },
  },
});