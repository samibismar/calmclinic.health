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

// Get all custom fallbacks
export async function GET() {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const { data: fallbacks, error } = await supabase
      .from('ai_custom_fallbacks')
      .select('*')
      .eq('clinic_id', clinic.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch custom fallbacks', 
        details: error 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      fallbacks: fallbacks || []
    });

  } catch (error) {
    console.error('Error fetching custom fallbacks:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch custom fallbacks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Create new custom fallback
export async function POST(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const body = await request.json();
    const { trigger_type, trigger_description, response_text } = body;

    if (!trigger_type || !trigger_description || !response_text) {
      return NextResponse.json({ 
        error: 'All fields are required (trigger_type, trigger_description, response_text)' 
      }, { status: 400 });
    }

    const { data: newFallback, error } = await supabase
      .from('ai_custom_fallbacks')
      .insert({
        clinic_id: clinic.id,
        trigger_type: trigger_type.trim(),
        trigger_description: trigger_description.trim(),
        response_text: response_text.trim(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to create custom fallback', 
        details: error 
      }, { status: 500 });
    }

    // Log the creation
    try {
      await supabase
        .from('ai_configuration_log')
        .insert({
          clinic_id: clinic.id,
          change_type: 'custom_fallback_created',
          change_data: {
            fallback_id: newFallback.id,
            trigger_type,
            trigger_description,
            response_text
          },
          changed_by: 'user',
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging custom fallback creation:', logError);
    }

    return NextResponse.json({ 
      success: true, 
      fallback: newFallback
    });

  } catch (error) {
    console.error('Error creating custom fallback:', error);
    return NextResponse.json({ 
      error: 'Failed to create custom fallback',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}