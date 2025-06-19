// /lib/auth.ts
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function getClinicFromSession() {
  try {
    const cookieStore = await cookies();
    const authUserId = cookieStore.get('auth_user_id')?.value;
    
    console.log('🔍 Getting clinic from session...');
    
    if (!authUserId) {
      console.log('❌ No auth user ID found in cookies');
      return null;
    }

    console.log('✅ Auth user ID found:', authUserId);

    // Look up clinic by auth_user_id
    console.log('🔍 Looking up clinic by auth_user_id:', authUserId);
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('auth_user_id', authUserId)
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
      console.log('❌ No clinic found for auth_user_id:', authUserId);
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

// Alternative: Get clinic by email (if needed)
export async function getClinicFromSessionByEmail() {
  try {
    const cookieStore = await cookies();
    const authUserId = cookieStore.get('auth_user_id')?.value;
    
    if (!authUserId) {
      return null;
    }

    // First get the user's email from Supabase Auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(authUserId);
    
    if (userError || !user) {
      return null;
    }

    // Then look up clinic by email
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('email', user.email)
      .single();

    if (clinicError || !clinic) {
      return null;
    }

    return clinic;
    
  } catch (error) {
    console.error('Error in getClinicFromSessionByEmail:', error);
    return null;
  }
}

// Debug function to check current user context
export async function debugUserContext() {
  try {
    const cookieStore = await cookies();
    const authUserId = cookieStore.get('auth_user_id')?.value;
    
    console.log('🐛 Debug user context:', {
      auth_user_id_cookie: authUserId,
      cookies_available: !!cookieStore
    });
    
    if (authUserId) {
      // Try to get user info from Supabase
      const { data: { user }, error } = await supabase.auth.admin.getUserById(authUserId);
      
      console.log('🐛 Supabase user info:', {
        user_id: user?.id,
        user_email: user?.email,
        error: error?.message
      });
      
      return {
        authUserId,
        supabaseUser: user,
        error
      };
    }
    
    return {
      authUserId: null,
      supabaseUser: null,
      error: 'No auth user ID in cookies'
    };
    
  } catch (error) {
    console.error('Debug context error:', error);
    return null;
  }
}

// NEW PAYMENT FUNCTIONS - Added for Stripe integration
export async function checkClinicPaymentStatus(clinicId: number) {
  try {
    const { data: clinic, error } = await supabase
      .from('clinics')
      .select('is_paid, subscription_status, current_period_end')
      .eq('id', clinicId)
      .single();

    if (error) {
      console.error('Error checking payment status:', error);
      return { isPaid: false, error: error.message };
    }

    // Check if subscription is active and not expired
    const isPaid = clinic.is_paid && 
                  clinic.subscription_status === 'active' &&
                  (!clinic.current_period_end || new Date(clinic.current_period_end) > new Date());

    return { 
      isPaid, 
      clinic,
      error: null 
    };
  } catch (error) {
    console.error('Error in checkClinicPaymentStatus:', error);
    return { isPaid: false, error: 'Failed to check payment status' };
  }
}

export async function getClinicWithPaymentStatus() {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return { clinic: null, isPaid: false, error: 'No clinic found' };
    }

    const paymentCheck = await checkClinicPaymentStatus(clinic.id);
    
    return {
      clinic,
      isPaid: paymentCheck.isPaid,
      error: paymentCheck.error
    };
  } catch (error) {
    console.error('Error in getClinicWithPaymentStatus:', error);
    return { clinic: null, isPaid: false, error: 'Failed to get clinic payment status' };
  }
}