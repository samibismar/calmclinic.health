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

export async function GET() {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    // Get the current prompt from ai_prompt_history
    const { data: currentPrompt } = await supabase
      .from('ai_prompt_history')
      .select('prompt_text, version, created_at')
      .eq('clinic_id', clinic.id)
      .eq('is_current', true)
      .single();

    let systemPrompt = '';
    let version = clinic.ai_version || 1;
    let lastUpdated = clinic.updated_at || clinic.created_at;

    if (currentPrompt) {
      systemPrompt = currentPrompt.prompt_text;
      version = currentPrompt.version;
      lastUpdated = currentPrompt.created_at;
    } else {
      // Fallback to clinic.ai_instructions if no current prompt in history
      systemPrompt = clinic.ai_instructions || '';
    }

    // Build AI configuration from clinic data
    const config = {
      system_prompt: systemPrompt,
      tone: clinic.tone || 'professional',
      languages: clinic.languages || ['English'],
      custom_instructions: systemPrompt,
      ai_always_include: clinic.ai_always_include || [],
      ai_never_include: clinic.ai_never_include || [],
      fallback_responses: {
        uncertain: clinic.fallback_uncertain || "I'm not sure about that. Let me connect you with our staff who can help you better.",
        after_hours: clinic.fallback_after_hours || "We're currently closed. For urgent matters, please call our emergency line. Otherwise, I'm happy to help you schedule an appointment.",
        emergency: clinic.fallback_emergency || "This sounds like it might be urgent. Please call 911 for emergencies, or contact our clinic directly for immediate medical concerns."
      },
      last_updated: lastUpdated,
      version: version
    };

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching AI configuration:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch AI configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, string | string[] | number> = {};

    // Map AI configuration fields to database columns
    if (body.system_prompt !== undefined) updates.ai_instructions = body.system_prompt;
    if (body.tone !== undefined) updates.tone = body.tone;
    if (body.languages !== undefined) updates.languages = body.languages;
    if (body.fallback_responses !== undefined) {
      updates.fallback_uncertain = body.fallback_responses.uncertain;
      updates.fallback_after_hours = body.fallback_responses.after_hours;
      updates.fallback_emergency = body.fallback_responses.emergency;
    }

    updates.updated_at = new Date().toISOString();
    updates.ai_version = (clinic.ai_version || 1) + 1;

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

    return NextResponse.json({ 
      success: true, 
      config: updateResult?.[0] 
    });

  } catch (error) {
    console.error('Error saving AI configuration:', error);
    return NextResponse.json({ 
      error: 'Failed to save AI configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}