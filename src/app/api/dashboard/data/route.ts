// Replace app/api/dashboard/data/route.ts with this:

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const authUserId = cookieStore.get('auth_user_id')?.value;
    
    console.log('Dashboard API - Auth user ID:', authUserId);
    
    if (!authUserId) {
      console.error('Dashboard API - No auth user ID found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get clinic data for this user
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();

    console.log('Dashboard API - Clinic found:', !!clinic, 'Error:', clinicError);

    if (clinicError || !clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    // Get the correct base URL
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const baseUrl = `${protocol}://${host}`;

    return NextResponse.json({
      clinic: {
        practice_name: clinic.practice_name || 'Your Practice',
        doctor_name: clinic.doctor_name || 'Dr. Unknown',
        slug: clinic.slug,
        email: clinic.email,
        specialty: clinic.specialty || 'General Practice',
        status: clinic.status || 'trial',
        trial_ends_at: clinic.trial_ends_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        primary_color: clinic.primary_color || '#5BBAD5',
        has_completed_setup: clinic.has_completed_setup || false
      },
      baseUrl
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}