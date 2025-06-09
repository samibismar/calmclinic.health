import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

export function createSupabaseServerClient() {
  return createServerComponentClient<Database>({ cookies });
}

export async function getClinicSettings(slug: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clinics")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data;
}
