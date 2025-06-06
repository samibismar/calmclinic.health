import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

// Define the shape of a clinic row
type ClinicRow = {
  id: number;
  email: string;
  doctor_name: string | null;
  slug: string;
  practice_name: string | null;
  specialty: string | null;
  status: string | null;
  trial_ends_at: string | null;
  primary_color: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        clinic_id,
        expires_at,
        clinics (
          id,
          email,
          doctor_name,
          slug,
          practice_name,
          specialty,
          status,
          trial_ends_at,
          primary_color
        )
      `)
      .eq('token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const clinic = (session.clinics as ClinicRow[])[0];

    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const baseUrl = `${protocol}://${host}`;

    const stats = {
      totalChats: 0,
      thisWeek: 0,
      avgSessionLength: "0m 0s"
    };

    return NextResponse.json({
      clinic: {
        practice_name: clinic.practice_name || 'Your Practice',
        doctor_name: clinic.doctor_name || 'Dr. Unknown',
        slug: clinic.slug,
        email: clinic.email,
        specialty: clinic.specialty || 'General Practice',
        status: clinic.status || 'trial',
        trial_ends_at: clinic.trial_ends_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        primary_color: clinic.primary_color || '#5BBAD5'
      },
      stats,
      baseUrl
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}