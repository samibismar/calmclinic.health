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

// Update A/B testing settings
export async function POST(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const body = await request.json();
    const { enabled, traffic_percentage } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ 
        error: 'enabled must be a boolean' 
      }, { status: 400 });
    }

    if (traffic_percentage !== undefined && (traffic_percentage < 5 || traffic_percentage > 50)) {
      return NextResponse.json({ 
        error: 'traffic_percentage must be between 5 and 50' 
      }, { status: 400 });
    }

    const updateData: {
      ab_testing_enabled: boolean;
      updated_at: string;
      ab_test_percentage?: number;
    } = {
      ab_testing_enabled: enabled,
      updated_at: new Date().toISOString()
    };

    if (traffic_percentage !== undefined) {
      updateData.ab_test_percentage = traffic_percentage;
    }

    // Update the clinic's A/B testing settings
    const { data: updatedClinic, error: updateError } = await supabase
      .from('clinics')
      .update(updateData)
      .eq('id', clinic.id)
      .select('*')
      .single();

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update A/B testing settings', 
        details: updateError 
      }, { status: 500 });
    }

    // Log the settings change
    try {
      await supabase
        .from('ai_configuration_log')
        .insert({
          clinic_id: clinic.id,
          change_type: 'ab_testing_settings_updated',
          change_data: {
            old_settings: {
              enabled: clinic.ab_testing_enabled,
              traffic_percentage: clinic.ab_test_percentage
            },
            new_settings: {
              enabled,
              traffic_percentage: traffic_percentage || clinic.ab_test_percentage
            }
          },
          changed_by: 'user',
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging A/B testing settings update:', logError);
    }

    return NextResponse.json({ 
      success: true, 
      settings: {
        enabled: updatedClinic.ab_testing_enabled,
        traffic_percentage: updatedClinic.ab_test_percentage
      }
    });

  } catch (error) {
    console.error('Error updating A/B testing settings:', error);
    return NextResponse.json({ 
      error: 'Failed to update A/B testing settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}