import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  // Only throw error in production on server-side when actually used
  throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const getSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Missing environment variables.');
  }
  return supabase;
};

export { supabase }; 