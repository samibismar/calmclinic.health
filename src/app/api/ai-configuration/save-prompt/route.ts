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

    // Save to prompt history first
    try {
      await supabase
        .from('ai_prompt_history')
        .insert({
          clinic_id: clinic.id,
          prompt_text: system_prompt.trim(),
          version: newVersion,
          created_at: new Date().toISOString(),
          created_by: 'manual-edit'
        });
    } catch (historyError) {
      console.error('Error saving to prompt history:', historyError);
      // Continue anyway, we'll still update the main record
    }

    // Update the clinic with new prompt
    const { data: updateResult, error: updateError } = await supabase
      .from('clinics')
      .update({
        ai_instructions: system_prompt.trim(),
        ai_version: newVersion,
        updated_at: new Date().toISOString()
      })
      .eq('id', clinic.id)
      .select('*');

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to save system prompt', 
        details: updateError 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      clinic: updateResult?.[0],
      version: newVersion
    });

  } catch (error) {
    console.error('Error saving system prompt:', error);
    return NextResponse.json({ 
      error: 'Failed to save system prompt',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}