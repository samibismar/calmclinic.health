import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if clinic exists with this email
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('id, email, practice_name, doctor_name')
      .eq('email', email)
      .single();

    if (clinicError || !clinic) {
      return NextResponse.json(
        { error: 'No clinic assistant found with this email address' },
        { status: 404 }
      );
    }

    // Generate secure login token (valid for 1 hour)
    const loginToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store login token in database
    const { error: tokenError } = await supabase
      .from('login_tokens')
      .insert([
        {
          clinic_id: clinic.id,
          token: loginToken,
          expires_at: expiresAt.toISOString(),
          used: false
        }
      ]);

    if (tokenError) {
      console.error('Token storage error:', tokenError);
      return NextResponse.json(
        { error: 'Failed to generate login link' },
        { status: 500 }
      );
    }

    // Create login URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://calmclinic-health.vercel.app';
    const loginUrl = `${baseUrl}/dashboard?token=${loginToken}`;

    // In a real app, you'd send this via email
    // For now, we'll just return it (you can log it to console)
    console.log(`Login link for ${email}: ${loginUrl}`);

    // TODO: Send email here using Resend, SendGrid, or similar
    // await sendLoginEmail(email, loginUrl, clinic.practice_name);

    return NextResponse.json({ 
      success: true,
      message: 'Login link sent! (Check your server logs for now)',
      // In development, return the link. Remove this in production.
      loginUrl: process.env.NODE_ENV === 'development' ? loginUrl : undefined
    });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}