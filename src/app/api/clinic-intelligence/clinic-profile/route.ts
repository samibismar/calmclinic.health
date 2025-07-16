import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to get clinic ID from session
async function getClinicFromSession() {
  const cookieStore = await cookies();
  const authUserId = cookieStore.get('auth_user_id')?.value;
  
  if (!authUserId) {
    return null;
  }

  const { data: clinic } = await supabase
    .from('clinics')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  return clinic;
}

export async function PUT(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { practice_name, website, email, primary_color } = await request.json();

    // Update clinic basic information
    const { data: updatedClinic, error: clinicError } = await supabase
      .from('clinics')
      .update({
        practice_name: practice_name || clinic.practice_name,
        primary_color: primary_color || clinic.primary_color
      })
      .eq('id', clinic.id)
      .select()
      .single();

    if (clinicError) {
      console.error('Error updating clinic:', clinicError);
      return NextResponse.json({ error: 'Failed to update clinic' }, { status: 500 });
    }

    // Update or create contact info for website and email
    if (website) {
      await supabase
        .from('clinic_contact_info')
        .upsert({
          clinic_id: clinic.id,
          contact_type: 'website',
          contact_value: website,
          contact_label: 'Website',
          is_primary: false,
          is_active: true
        }, {
          onConflict: 'clinic_id,contact_type'
        });
    }

    if (email) {
      await supabase
        .from('clinic_contact_info')
        .upsert({
          clinic_id: clinic.id,
          contact_type: 'email',
          contact_value: email,
          contact_label: 'Email',
          is_primary: false,
          is_active: true
        }, {
          onConflict: 'clinic_id,contact_type'
        });
    }

    return NextResponse.json({ clinic: updatedClinic });
  } catch (error) {
    console.error('Error in PUT /api/clinic-intelligence/clinic-profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}