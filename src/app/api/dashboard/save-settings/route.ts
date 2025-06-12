// Replace your save-settings route with this:

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Get auth user ID from cookies (await the cookies function)
    const cookieStore = await cookies(); // Add await here
    const authUserId = cookieStore.get('auth_user_id')?.value;
    
    console.log('Save settings - Auth user ID:', authUserId);
    
    if (!authUserId) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    // Get clinic data for this user
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();

    console.log('Save settings - Clinic found:', !!clinic, 'Error:', clinicError);

    if (clinicError || !clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    // Get request body
    const body = await request.json();
    console.log('Save settings - Request body:', body);

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

    console.log('Save settings - Updates to apply:', updates);

    // Update the clinic
    const { data: updateResult, error: updateError } = await supabase
      .from('clinics')
      .update(updates)
      .eq('id', clinic.id)
      .select('*');

    console.log('Save settings - Update result:', updateResult, 'Error:', updateError);

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

    // If this is the first time setup is being completed, trigger the welcome email
    const wasPreviouslyIncomplete = !clinic.has_completed_setup;
    const isNowComplete = updateResult[0].has_completed_setup === true;

    console.log('Save settings - Setup status:', { wasPreviouslyIncomplete, isNowComplete });

    if (wasPreviouslyIncomplete && isNowComplete) {
      try {
        console.log('Save settings - Sending welcome email');
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-live-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clinicEmail: clinic.email,
            doctorName: clinic.doctor_name,
            slug: clinic.slug
          })
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      clinic: updateResult[0] 
    });

  } catch (error) {
    console.error('Save settings error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}