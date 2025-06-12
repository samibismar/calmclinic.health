import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const body = await req.json();
  const { practiceName, doctorName, email, phone, specialty, auth_user_id } = body;

  if (!auth_user_id) {
    return NextResponse.json({ error: 'Missing auth_user_id' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from('clinics').insert([
    {
      practice_name: practiceName,
      doctor_name: doctorName,
      email,
      phone,
      specialty,
      auth_user_id,
      slug: `${doctorName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    }
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}