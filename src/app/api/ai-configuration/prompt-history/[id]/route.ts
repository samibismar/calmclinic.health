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

// Update version name
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const { version_name } = await request.json();
    const versionId = parseInt(params.id);

    if (!version_name || !version_name.trim()) {
      return NextResponse.json({ error: 'Version name is required' }, { status: 400 });
    }

    // Verify the version belongs to this clinic
    const { data: existingVersion, error: fetchError } = await supabase
      .from('ai_prompt_history')
      .select('*')
      .eq('id', versionId)
      .eq('clinic_id', clinic.id)
      .single();

    if (fetchError || !existingVersion) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Update the version name
    const { data: updatedVersion, error: updateError } = await supabase
      .from('ai_prompt_history')
      .update({
        version_name: version_name.trim()
      })
      .eq('id', versionId)
      .eq('clinic_id', clinic.id)
      .select('*')
      .single();

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update version name', 
        details: updateError 
      }, { status: 500 });
    }

    // Log the change
    try {
      await supabase
        .from('ai_configuration_log')
        .insert({
          clinic_id: clinic.id,
          change_type: 'version_renamed',
          change_data: {
            version_id: versionId,
            old_name: existingVersion.version_name,
            new_name: version_name.trim()
          },
          changed_by: 'user',
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging version rename:', logError);
    }

    return NextResponse.json({ 
      success: true, 
      version: {
        id: updatedVersion.id,
        version: updatedVersion.version,
        version_name: updatedVersion.version_name,
        prompt_text: updatedVersion.prompt_text,
        created_at: updatedVersion.created_at,
        created_by: updatedVersion.created_by,
        is_current: Boolean(updatedVersion.is_current)
      }
    });

  } catch (error) {
    console.error('Error updating version name:', error);
    return NextResponse.json({ 
      error: 'Failed to update version name',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Delete version
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const versionId = parseInt(params.id);

    // Verify the version belongs to this clinic and is not current
    const { data: existingVersion, error: fetchError } = await supabase
      .from('ai_prompt_history')
      .select('*')
      .eq('id', versionId)
      .eq('clinic_id', clinic.id)
      .single();

    if (fetchError || !existingVersion) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Prevent deletion of current version
    if (existingVersion.is_current) {
      return NextResponse.json({ 
        error: 'Cannot delete the current version' 
      }, { status: 400 });
    }

    // Delete the version
    const { error: deleteError } = await supabase
      .from('ai_prompt_history')
      .delete()
      .eq('id', versionId)
      .eq('clinic_id', clinic.id);

    if (deleteError) {
      return NextResponse.json({ 
        error: 'Failed to delete version', 
        details: deleteError 
      }, { status: 500 });
    }

    // Log the deletion
    try {
      await supabase
        .from('ai_configuration_log')
        .insert({
          clinic_id: clinic.id,
          change_type: 'version_deleted',
          change_data: {
            version_id: versionId,
            version: existingVersion.version,
            version_name: existingVersion.version_name,
            deleted_at: new Date().toISOString()
          },
          changed_by: 'user',
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging version deletion:', logError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Version deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting version:', error);
    return NextResponse.json({ 
      error: 'Failed to delete version',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}