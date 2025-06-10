import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookies
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    // Create Supabase client
    const supabase = createSupabaseServerClient();

    // Look up the session and get clinic info
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        clinic_id,
        expires_at,
        clinics (
          id,
          email,
          doctor_name,
          slug,
          practice_name,
          specialty
        )
      `)
      .eq('token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const clinic = Array.isArray(session.clinics) ? session.clinics[0] : session.clinics;

    // Get request body
    const body = await request.json();

    // Transform updates
    const updates: Record<string, string | number | boolean | null | string[] | object> = {};
    
    const fieldMapping: Record<string, string> = {
      welcomeMessage: 'welcome_message',
      tone: 'tone',
      doctorName: 'doctor_name',
      specialty: 'specialty',
      brandColor: 'primary_color',
      promptInstructions: 'ai_instructions',
      exampleQuestions: 'example_questions',
      languages: 'languages',
      officeInstructions: 'office_instructions',
      backgroundStyle: 'background_style',
      chatAvatarName: 'chat_avatar_name',
      logoUrl: 'logo_url',
    };

    for (const [camelKey, snakeKey] of Object.entries(fieldMapping)) {
      if (camelKey in body) {
        const value: unknown = body[camelKey];
        updates[snakeKey] = (typeof value === 'string' && value.trim() === '') ? null : value as (string | number | boolean | string[] | object | null);
      }
    }

    // Convert exampleQuestions array to suggested_prompts format
    if (body.exampleQuestions && Array.isArray(body.exampleQuestions)) {
      updates.suggested_prompts = {
        en: body.exampleQuestions,
        es: body.exampleQuestions // For now, same questions in Spanish - can be enhanced later
      };
    }

    updates.updated_at = new Date().toISOString();
    updates.has_completed_setup = true;

    // Update the clinic
    const { data: updateResult, error: updateError } = await supabase
      .from('clinics')
      .update(updates)
      .eq('id', clinic.id)
      .select('*');

    if (updateError) {
      return NextResponse.json({ 
        error: 'Update failed', 
        details: updateError 
      }, { status: 500 });
    }

    if (!updateResult || updateResult.length === 0) {
      return NextResponse.json({ 
        error: 'Update failed - no rows affected'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      clinic: updateResult[0] 
    });

  } catch (error) {
    console.error('Save settings error:', error);
    return NextResponse.json({ 
      error: 'Internal server error'
    }, { status: 500 });
  }
}