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
    const { 
      fallback_responses, 
      ab_testing_enabled, 
      ab_test_percentage 
    } = body;

    const updates: Record<string, string | boolean | number> = {};

    // Update fallback responses
    if (fallback_responses) {
      if (fallback_responses.uncertain !== undefined) {
        updates.fallback_uncertain = fallback_responses.uncertain;
      }
      if (fallback_responses.after_hours !== undefined) {
        updates.fallback_after_hours = fallback_responses.after_hours;
      }
      if (fallback_responses.emergency !== undefined) {
        updates.fallback_emergency = fallback_responses.emergency;
      }
    }

    // Update A/B testing settings
    if (ab_testing_enabled !== undefined) {
      updates.ab_testing_enabled = ab_testing_enabled;
    }

    if (ab_test_percentage !== undefined) {
      updates.ab_test_percentage = ab_test_percentage;
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
        error: 'Failed to save advanced settings', 
        details: updateError 
      }, { status: 500 });
    }

    // Log the configuration change
    try {
      await supabase
        .from('ai_configuration_log')
        .insert({
          clinic_id: clinic.id,
          change_type: 'fallbacks_update',
          change_data: {
            fallback_responses,
            ab_testing_enabled,
            ab_test_percentage
          },
          changed_by: 'user',
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging fallbacks change:', logError);
      // Continue anyway, logging is optional
    }

    return NextResponse.json({ 
      success: true, 
      clinic: updateResult?.[0]
    });

  } catch (error) {
    console.error('Error saving advanced settings:', error);
    return NextResponse.json({ 
      error: 'Failed to save advanced settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}