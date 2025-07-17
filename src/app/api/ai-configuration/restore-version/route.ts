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
    const { version } = body;

    if (!version) {
      return NextResponse.json({ error: 'Version number is required' }, { status: 400 });
    }

    // Fetch the specific version from history
    const { data: versionData, error: versionError } = await supabase
      .from('ai_prompt_history')
      .select('*')
      .eq('clinic_id', clinic.id)
      .eq('version', version)
      .single();

    if (versionError || !versionData) {
      return NextResponse.json({ 
        error: 'Version not found', 
        details: versionError 
      }, { status: 404 });
    }

    const newVersion = (clinic.ai_version || 1) + 1;

    // Create a new history entry for the restoration
    try {
      await supabase
        .from('ai_prompt_history')
        .insert({
          clinic_id: clinic.id,
          prompt_text: versionData.prompt_text,
          version: newVersion,
          created_at: new Date().toISOString(),
          created_by: `restored-from-v${version}`,
          restoration_data: {
            restored_from_version: version,
            original_created_at: versionData.created_at,
            original_created_by: versionData.created_by
          }
        });
    } catch (historyError) {
      console.error('Error creating restoration history:', historyError);
      // Continue anyway, we'll still update the main record
    }

    // Update the clinic with the restored prompt
    const { data: updateResult, error: updateError } = await supabase
      .from('clinics')
      .update({
        ai_instructions: versionData.prompt_text,
        ai_version: newVersion,
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
            restored_from_version: version,
            new_version: newVersion,
            prompt_text: versionData.prompt_text
          },
          changed_by: 'user',
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging restoration:', logError);
      // Continue anyway, logging is optional
    }

    return NextResponse.json({ 
      success: true, 
      clinic: updateResult?.[0],
      restored_version: version,
      new_version: newVersion
    });

  } catch (error) {
    console.error('Error restoring version:', error);
    return NextResponse.json({ 
      error: 'Failed to restore version',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}