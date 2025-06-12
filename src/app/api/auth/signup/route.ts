import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    console.log('Signup route: Received request');

    const body = await request.json();
    console.log('Signup route: Parsed body', body);

    const { practiceName, doctorName, email, password, specialty, phone } = body;

    if (!email || !password || !practiceName || !doctorName) {
      console.warn('Signup route: Missing fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Supabase client for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const signUpRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
      },
      body: JSON.stringify({
        email,
        password,
        data: {},
        gotrue_meta_security: {},
        channel: "email",
        email_confirm: true,
        provider: "email"
      })
    });

    const signUpData = await signUpRes.json();

    if (!signUpRes.ok || !signUpData.user) {
      console.error('Signup route: Supabase signup error', signUpData);
      return NextResponse.json(
        { error: signUpData.error?.message || 'Signup failed' },
        { status: 400 }
      );
    }

    console.log('User created successfully:', signUpData.user.id);

    // Insert clinic data
    const { error: insertError } = await supabase
      .from('clinics')
      .insert([
        {
          email,
          doctor_name: doctorName,
          practice_name: practiceName,
          specialty,
          phone,
          auth_user_id: signUpData.user.id,
          slug: `${doctorName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}` // Generate a unique slug
        }
      ]);

    if (insertError) {
      console.error('Signup route: DB insert error', insertError);
      
      // If clinic insert fails, clean up the created user
      await supabase.auth.admin.deleteUser(signUpData.user.id);
      
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    console.log('Signup route: Successfully registered user and created clinic');
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err) {
    console.error('Signup route: Unexpected error', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}