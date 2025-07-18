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

    // Update the clinic with new current prompt (without creating new version)
    const { data: updateResult, error: updateError } = await supabase
      .from('clinics')
      .update({
        ai_instructions: system_prompt.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', clinic.id)
      .select('*');

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to make prompt current', 
        details: updateError 
      }, { status: 500 });
    }

    // Log the configuration change
    try {
      await supabase
        .from('ai_configuration_log')
        .insert({
          clinic_id: clinic.id,
          change_type: 'system_prompt_made_current',
          change_data: {
            prompt_text: system_prompt.trim(),
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
      clinic: updateResult?.[0]
    });

  } catch (error) {
    console.error('Error making prompt current:', error);
    return NextResponse.json({ 
      error: 'Failed to make prompt current',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}