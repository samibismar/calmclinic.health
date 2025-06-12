// Replace app/api/auth/login/route.ts with this:

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Use your existing supabase client
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      console.error('Login error:', authError);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get clinic data
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (clinicError || !clinic) {
      console.error('Clinic lookup error:', clinicError);
      return NextResponse.json(
        { error: 'Clinic data not found' },
        { status: 404 }
      );
    }

    // Create a simple response with session data
    const response = NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email
      },
      clinic: {
        id: clinic.id,
        slug: clinic.slug,
        practiceName: clinic.practice_name,
        doctorName: clinic.doctor_name,
        email: clinic.email,
        specialty: clinic.specialty
      }
    });

    // Set a simple auth cookie with the user ID
    response.cookies.set('auth_user_id', authData.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}