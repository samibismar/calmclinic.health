import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookies
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

    // Fix: clinic comes from the join, so it's an object not array
    const clinic = session.clinics as any;

    // Get the correct base URL for chat links
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const baseUrl = `${protocol}://${host}`;

    // TODO: Get real stats from your database
    // For now, using dummy data - you can replace this with real analytics later
    const stats = {
      totalChats: 0, // Count from conversations table
      thisWeek: 0,   // Count from conversations table where created_at > week ago
      avgSessionLength: "0m 0s" // Calculate from conversation data
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
      baseUrl // Send the correct base URL to the frontend
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json({ 
      error: 'Internal server error'
    }, { status: 500 });
  }
}