import { createClient } from '@supabase/supabase-js';

let supabaseInstance: any = null;
let initialized = false;

const initializeSupabase = () => {
  if (!initialized) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    initialized = true;
  }

  return supabaseInstance;
};

// Create a proxy that initializes on first use
export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    const instance = initializeSupabase();
    return instance[prop];
  },
});

export const getSupabase = initializeSupabase; 