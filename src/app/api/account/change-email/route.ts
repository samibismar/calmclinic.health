import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getClinicFromSession } from '@/lib/auth';

// Create admin client for user management
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get the clinic from session
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { newEmail } = body;

    if (!newEmail || !newEmail.trim()) {
      return NextResponse.json({ error: 'New email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if email is already in use by another clinic
    const { data: existingClinic, error: checkError } = await supabaseAdmin
      .from('clinics')
      .select('id')
      .eq('email', newEmail)
      .neq('id', clinic.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking email availability:', checkError);
      return NextResponse.json({ error: 'Failed to check email availability' }, { status: 500 });
    }

    if (existingClinic) {
      return NextResponse.json({ error: 'Email is already in use by another account' }, { status: 400 });
    }

    // Update email in Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      clinic.auth_user_id,
      { email: newEmail }
    );

    if (authError) {
      console.error('Supabase auth email update error:', authError);
      return NextResponse.json({ 
        error: 'Failed to update email in authentication system',
        details: authError.message 
      }, { status: 500 });
    }

    // Update email in clinics table for consistency
    const { error: clinicUpdateError } = await supabaseAdmin
      .from('clinics')
      .update({ email: newEmail })
      .eq('id', clinic.id);

    if (clinicUpdateError) {
      console.error('Clinic email update error:', clinicUpdateError);
      // Note: Auth email was already updated, so we log but don't fail completely
      console.warn('Email updated in auth but failed to sync to clinics table');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email updated successfully. Please check your new email for confirmation if required.',
      newEmail 
    });

  } catch (error) {
    console.error('Email update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}