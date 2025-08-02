import { NextResponse } from 'next/server';
import { getClinicFromSession } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authUserId = cookieStore.get('auth_user_id')?.value;
    
    // Get clinic from session
    const clinic = await getClinicFromSession();
    
    // Check Fort Worth ENT clinic specifically
    const { data: fortworthClinic, error: fwError } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', 45)
      .single();
    
    // Check if there's an auth_user_id set for clinic 45
    const needsAuthFix = fortworthClinic && !fortworthClinic.auth_user_id;
    
    // If current user is trying to access clinic 45 and it has no auth_user_id, set it
    let authFixed = false;
    if (needsAuthFix && authUserId && clinic?.id !== 45) {
      console.log('🔧 Attempting to fix auth_user_id for Fort Worth ENT clinic...');
      
      const { error: updateError } = await supabase
        .from('clinics')
        .update({ auth_user_id: authUserId })
        .eq('id', 45);
        
      if (!updateError) {
        authFixed = true;
        console.log('✅ Successfully set auth_user_id for Fort Worth ENT clinic');
      } else {
        console.error('❌ Failed to set auth_user_id:', updateError);
      }
    }
    
    return NextResponse.json({
      current_session: {
        auth_user_id: authUserId,
        clinic: clinic
      },
      fortworth_clinic: {
        ...fortworthClinic,
        needs_auth_fix: needsAuthFix,
        auth_fixed: authFixed
      },
      error: fwError?.message
    });
    
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Auth check failed' }, { status: 500 });
  }
}