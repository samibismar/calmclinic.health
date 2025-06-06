import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Get session token from cookies (same way as save-settings)
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    // Look up the session and get clinic info
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        clinic_id,
        expires_at,
        clinics (
          id,
          doctor_name,
          specialty,
          welcome_message,
          tone,
          languages,
          prompt_instructions,
          example_questions,
          office_instructions,
          primary_color,
          background_style,
          chat_avatar_name
        )
      `)
      .eq('token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    return NextResponse.json({ settings: session.clinics });
    
  } catch (err) {
    console.error('Handler error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}