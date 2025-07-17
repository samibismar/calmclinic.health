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

    // Fetch the specific version from history
    const { data: versionData, error: versionError } = await supabase
      .from('ai_prompt_history')
      .select('*')
      .eq('id', version_id)
      .eq('clinic_id', clinic.id)
      .single();

    if (versionError || !versionData) {
      return NextResponse.json({ 
        error: 'Version not found', 
        details: versionError 
      }, { status: 404 });
    }

    // Don't restore if it's already current
    if (versionData.is_current) {
      return NextResponse.json({ 
        error: 'This version is already current' 
      }, { status: 400 });
    }

    // Start a transaction-like operation
    // First, unset all current versions for this clinic
    const { error: unsetError } = await supabase
      .from('ai_prompt_history')
      .update({ is_current: false })
      .eq('clinic_id', clinic.id)
      .eq('is_current', true);

    if (unsetError) {
      return NextResponse.json({ 
        error: 'Failed to prepare for restoration', 
        details: unsetError 
      }, { status: 500 });
    }

    // Set the selected version as current
    const { error: setCurrentError } = await supabase
      .from('ai_prompt_history')
      .update({ is_current: true })
      .eq('id', version_id)
      .eq('clinic_id', clinic.id);

    if (setCurrentError) {
      return NextResponse.json({ 
        error: 'Failed to set version as current', 
        details: setCurrentError 
      }, { status: 500 });
    }

    // Update the clinic with the restored prompt
    const { data: updateResult, error: updateError } = await supabase
      .from('clinics')
      .update({
        ai_instructions: versionData.prompt_text,
        ai_version: versionData.version,
        updated_at: new Date().toISOString()
      })
      .eq('id', clinic.id)
      .select('*');

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to restore version', 
        details: updateError 
      }, { status: 500 });
    }

    // Log the restoration
    try {
      await supabase
        .from('ai_configuration_log')
        .insert({
          clinic_id: clinic.id,
          change_type: 'version_restored',
          change_data: {
            restored_version_id: version_id,
            restored_version: versionData.version,
            version_name: versionData.version_name,
            prompt_text: versionData.prompt_text
          },
          changed_by: 'user',
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging restoration:', logError);
    }

    return NextResponse.json({ 
      success: true, 
      clinic: updateResult?.[0],
      restored_version: versionData.version,
      version_name: versionData.version_name
    });

  } catch (error) {
    console.error('Error restoring version:', error);
    return NextResponse.json({ 
      error: 'Failed to restore version',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}