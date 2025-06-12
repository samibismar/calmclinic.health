import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function getClinicSettings(slug: string) {
  const { data, error } = await supabaseServer
    .from("clinics")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data;
}

// Simple server client function using your existing supabase setup
export function createSupabaseServerClient() {
  return supabaseServer;
}