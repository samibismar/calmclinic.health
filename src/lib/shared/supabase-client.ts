import { createClient } from '@supabase/supabase-js';

// Centralized Supabase client creation
export const createSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// Singleton instance for reuse
export const supabase = createSupabaseClient();