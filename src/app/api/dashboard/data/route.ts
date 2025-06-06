import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookies
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    console.log('Dashboard API - Session token exists:', !!sessionToken);
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    // Look up the session and get clinic info
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        clinic_id,
        expires_at,
        clinics!inner (
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

    console.log('Dashboard API - Session lookup error:', sessionError);
    console.log('Dashboard API - Session data:', session);

    if (sessionError || !session) {
      console.error('Dashboard API - Failed to get session:', sessionError);
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Fix: Access the clinic data correctly - it's an array from the join
    const clinicData = session.clinics;
    if (!clinicData || (Array.isArray(clinicData) && clinicData.length === 0)) {
      console.error('Dashboard API - No clinic data found');
      return NextResponse.json({ error: 'No clinic data found' }, { status: 404 });
    }

    // If it's an array, get the first item
    const clinic = Array.isArray(clinicData) ? clinicData[0] : clinicData;


    // Get the correct base URL for chat links
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const baseUrl = `${protocol}://${host}`;

    // TODO: Get real stats from your database
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
    console.error('Dashboard API - Unexpected error:', error);
    console.error('Dashboard API - Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}