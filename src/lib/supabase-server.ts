import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export function createSupabaseServerClient() {
  return createRouteHandlerClient({
    cookies,
  });
}

export async function getClinicSettings() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("clinics").select("*").single();
  if (error) throw error;
  return data;
}
