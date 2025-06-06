import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Look up the clinic by email
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (clinicError || !clinic) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if clinic has a password_hash (real password)
    if (!clinic.password_hash) {
      return NextResponse.json(
        { error: 'This account needs to be migrated. Please contact support.' },
        { status: 400 }
      );
    }

    // Verify the password
    const passwordValid = await bcrypt.compare(password, clinic.password_hash);
    
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate a session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

    // Store the session
    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        clinic_id: clinic.id,
        token: sessionToken,
        expires_at: expiresAt.toISOString()
      });

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      token: sessionToken,
      clinic: {
        id: clinic.id,
        slug: clinic.slug,
        practiceName: clinic.practice_name,
        doctorName: clinic.doctor_name,
        email: clinic.email,
        specialty: clinic.specialty
      }
    });

    response.cookies.set('session_token', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
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