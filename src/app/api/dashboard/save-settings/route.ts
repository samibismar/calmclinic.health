import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Step 1: Get session token from cookies
    console.log('🔍 Step 1: Getting session token from cookies...');
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    
    if (!sessionToken) {
      console.log('❌ No session token found in cookies');
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }
    
    console.log('✅ Session token found:', sessionToken.substring(0, 10) + '...');

    // Step 2: Look up the session and get clinic info
    console.log('🔍 Step 2: Looking up session in database...');
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
      console.log('❌ Session not found or expired:', sessionError);
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const clinic = session.clinics;
    console.log('✅ Valid session found for clinic:', {
      id: clinic.id,
      email: clinic.email,
      doctor_name: clinic.doctor_name
    });

    // Step 3: Get request body
    const body = await request.json();
    console.log('📦 Step 3: Request body:', body);

    // Step 4: Transform updates
    const updates: Record<string, any> = {};
    
    const fieldMapping: Record<string, string> = {
      welcomeMessage: 'welcome_message',
      tone: 'tone',
      doctorName: 'doctor_name',
      specialty: 'specialty',
      brandColor: 'primary_color',
      promptInstructions: 'prompt_instructions',
      exampleQuestions: 'example_questions',
      languages: 'languages',
      officeInstructions: 'office_instructions',
      backgroundStyle: 'background_style',
      chatAvatarName: 'chat_avatar_name'
    };

    for (const [camelKey, snakeKey] of Object.entries(fieldMapping)) {
      if (camelKey in body) {
        const value = body[camelKey];
        // Convert empty strings to null, keep arrays and other values as-is
        updates[snakeKey] = (typeof value === 'string' && value.trim() === '') ? null : value;
      }
    }

    updates.updated_at = new Date().toISOString();
    console.log('🔄 Step 4: Final update object:', updates);

    // Step 5: Update the clinic
    console.log(`🎯 Step 5: Updating clinic ID ${clinic.id}...`);
    
    const { data: updateResult, error: updateError } = await supabase
      .from('clinics')
      .update(updates)
      .eq('id', clinic.id)
      .select('*');

    console.log('📊 Update response:', {
      data: updateResult,
      error: updateError,
      dataLength: updateResult?.length || 0
    });

    if (updateError) {
      console.error('❌ Update failed:', updateError);
      return NextResponse.json({ 
        error: 'Update failed', 
        details: updateError 
      }, { status: 500 });
    }

    if (!updateResult || updateResult.length === 0) {
      console.log('⚠️ Update returned empty result');
      return NextResponse.json({ 
        error: 'Update failed - no rows affected',
        clinicId: clinic.id
      }, { status: 500 });
    }

    console.log('✅ Update successful!');
    return NextResponse.json({ 
      success: true, 
      clinic: updateResult[0] 
    });

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error'
    }, { status: 500 });
  }
}