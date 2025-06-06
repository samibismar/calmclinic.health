// /lib/auth.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export async function getClinicFromSession() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get session with detailed logging
    console.log('🔍 Getting session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return null;
    }
    
    if (!session || !session.user) {
      console.log('❌ No session or user found');
      return null;
    }

    console.log('✅ Session found for user:', {
      id: session.user.id,
      email: session.user.email,
      created_at: session.user.created_at
    });

    // Look up clinic by email with better error handling
    console.log('🔍 Looking up clinic by email:', session.user.email);
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (clinicError) {
      console.error('❌ Clinic lookup error:', {
        code: clinicError.code,
        message: clinicError.message,
        details: clinicError.details,
        hint: clinicError.hint
      });
      return null;
    }

    if (!clinic) {
      console.log('❌ No clinic found for email:', session.user.email);
      return null;
    }

    console.log('✅ Clinic found:', {
      id: clinic.id,
      email: clinic.email,
      doctor_name: clinic.doctor_name,
      slug: clinic.slug
    });

    return clinic;
    
  } catch (error) {
    console.error('💥 Unexpected error in getClinicFromSession:', error);
    return null;
  }
}

// Alternative: Get clinic by user ID instead of email
export async function getClinicFromSessionByUserId() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return null;
    }

    // If you have a user_id column in clinics table
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('user_id', session.user.id) // Assuming you have this column
      .single();

    if (clinicError || !clinic) {
      return null;
    }

    return clinic;
    
  } catch (error) {
    console.error('Error in getClinicFromSessionByUserId:', error);
    return null;
  }
}

// Debug function to check current user context
export async function debugUserContext() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Call the Supabase function we created
    const { data: userInfo } = await supabase.rpc('get_current_user_info');
    
    console.log('🐛 Debug user context:', {
      session_user_id: session?.user?.id,
      session_user_email: session?.user?.email,
      supabase_auth_uid: userInfo?.auth_uid,
      supabase_auth_email: userInfo?.auth_email,
      supabase_auth_role: userInfo?.auth_role
    });
    
    return {
      session,
      supabaseAuth: userInfo
    };
    
  } catch (error) {
    console.error('Debug context error:', error);
    return null;
  }
}