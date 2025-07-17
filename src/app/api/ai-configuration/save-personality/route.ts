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
    const { tone, languages, always_include, never_include } = body;

    const updates: Record<string, string | string[]> = {};

    // Update personality settings
    if (tone !== undefined) {
      updates.tone = tone;
    }

    if (languages !== undefined && Array.isArray(languages)) {
      updates.languages = languages;
    }

    if (always_include !== undefined && Array.isArray(always_include)) {
      updates.ai_always_include = always_include;
    }

    if (never_include !== undefined && Array.isArray(never_include)) {
      updates.ai_never_include = never_include;
    }

    updates.updated_at = new Date().toISOString();

    // Update the clinic record
    const { data: updateResult, error: updateError } = await supabase
      .from('clinics')
      .update(updates)
      .eq('id', clinic.id)
      .select('*');

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to save personality settings', 
        details: updateError 
      }, { status: 500 });
    }

    // Log the configuration change
    try {
      await supabase
        .from('ai_configuration_log')
        .insert({
          clinic_id: clinic.id,
          change_type: 'personality_update',
          change_data: {
            tone,
            languages,
            always_include,
            never_include
          },
          changed_by: 'user',
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging personality change:', logError);
      // Continue anyway, logging is optional
    }

    return NextResponse.json({ 
      success: true, 
      clinic: updateResult?.[0]
    });

  } catch (error) {
    console.error('Error saving personality settings:', error);
    return NextResponse.json({ 
      error: 'Failed to save personality settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}