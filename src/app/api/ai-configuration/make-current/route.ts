import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

async function getClinicFromSession() {
  const cookieStore = await cookies();
  const authUserId = cookieStore.get('auth_user_id')?.value;
  
  if (!authUserId) return null;

  const { data: clinic } = await supabase
    .from('clinics')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  return clinic;
}

export async function POST(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const body = await request.json();
    const { version_id } = body;

    if (!version_id) {
      return NextResponse.json({ error: 'Version ID is required' }, { status: 400 });
    }

    // First, unset all current versions for this clinic
    await supabase
      .from('ai_prompt_history')
      .update({ is_current: false })
      .eq('clinic_id', clinic.id)
      .eq('is_current', true);

    // Make the selected version current
    const { data: updateResult, error: updateError } = await supabase
      .from('ai_prompt_history')
      .update({ is_current: true })
      .eq('id', version_id)
      .eq('clinic_id', clinic.id)
      .select('*');

    if (updateError || !updateResult || updateResult.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to make prompt version current', 
        details: updateError 
      }, { status: 500 });
    }

    // Update clinic version tracker
    await supabase
      .from('clinics')
      .update({
        ai_version: updateResult[0].version,
        updated_at: new Date().toISOString()
      })
      .eq('id', clinic.id);

    // Log the configuration change
    try {
      await supabase
        .from('ai_configuration_log')
        .insert({
          clinic_id: clinic.id,
          change_type: 'system_prompt_made_current',
          change_data: {
            version_id: version_id,
            version: updateResult[0].version,
            made_current_at: new Date().toISOString()
          },
          changed_by: 'user',
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging prompt make current:', logError);
    }

    return NextResponse.json({ 
      success: true, 
      current_version: updateResult[0],
      message: `Version ${updateResult[0].version} is now current`
    });

  } catch (error) {
    console.error('Error making prompt current:', error);
    return NextResponse.json({ 
      error: 'Failed to make prompt current',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}