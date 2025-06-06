import { cookies } from 'next/headers';
import { createSupabaseServerClient } from './supabase-server';
import { NextRequest } from 'next/server';

export async function getClinicFromSession(req?: NextRequest) {
  const cookieStore = await cookies();
  const supabase = await createSupabaseServerClient();
  const token = cookieStore.get('session_token')?.value;

  if (!token) {
    console.log("No session token found");
    return null;
  }

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('clinic_id')
    .eq('token', token)
    .single();

  if (sessionError || !session?.clinic_id) {
    console.log("Session error or no clinic_id:", sessionError);
    return null;
  }

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', session.clinic_id)
    .single();

  if (clinicError) {
    console.log("Clinic error:", clinicError);
    return null;
  }

  return clinic;
}
