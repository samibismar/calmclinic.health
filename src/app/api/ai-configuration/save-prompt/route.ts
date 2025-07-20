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
    const { system_prompt } = body;

    if (!system_prompt?.trim()) {
      return NextResponse.json({ error: 'System prompt is required' }, { status: 400 });
    }

    const newVersion = (clinic.ai_version || 1) + 1;

    // First, unset all current versions for this clinic
    try {
      await supabase
        .from('ai_prompt_history')
        .update({ is_current: false })
        .eq('clinic_id', clinic.id)
        .eq('is_current', true);
    } catch (error) {
      console.error('Error unsetting current versions:', error);
    }

    // Save to prompt history with clean schema
    try {
      const { data: historyResult, error: historyError } = await supabase
        .from('ai_prompt_history')
        .insert({
          clinic_id: clinic.id,
          prompt_text: system_prompt.trim(),
          version: newVersion,
          version_name: `Version ${newVersion}`,
          is_current: true,
          created_by: 'manual-edit',
          generation_data: {
            saved_method: 'save_and_make_current',
            saved_at: new Date().toISOString()
          }
        })
        .select();

      if (historyError) {
        console.error('Database error saving to prompt history:', historyError);
        return NextResponse.json({ 
          error: 'Failed to save to prompt history', 
          details: historyError 
        }, { status: 500 });
      }

      console.log('Successfully saved to ai_prompt_history:', historyResult);
    } catch (historyError) {
      console.error('Error saving to prompt history:', historyError);
      return NextResponse.json({ 
        error: 'Failed to save to prompt history', 
        details: historyError 
      }, { status: 500 });
    }

    // Update only the clinic version (ai_instructions removed - now comes from ai_prompt_history)
    const { error: updateError } = await supabase
      .from('clinics')
      .update({
        ai_version: newVersion,
        updated_at: new Date().toISOString()
      })
      .eq('id', clinic.id);

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update clinic version', 
        details: updateError 
      }, { status: 500 });
    }

    // Log the configuration change
    try {
      await supabase
        .from('ai_configuration_log')
        .insert({
          clinic_id: clinic.id,
          change_type: 'system_prompt_saved',
          change_data: {
            prompt_text: system_prompt.trim(),
            version: newVersion,
            saved_at: new Date().toISOString()
          },
          changed_by: 'user',
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging prompt save:', logError);
    }

    return NextResponse.json({ 
      success: true, 
      version: newVersion,
      message: 'System prompt saved and made current'
    });

  } catch (error) {
    console.error('Error saving system prompt:', error);
    return NextResponse.json({ 
      error: 'Failed to save system prompt',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}