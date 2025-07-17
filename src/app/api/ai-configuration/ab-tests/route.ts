import { NextResponse } from 'next/server';
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

// Get A/B testing configuration and tests
export async function GET() {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    // For now, return the basic A/B testing configuration from the clinic
    // In the future, you might want to create a separate ab_tests table
    const abTestingConfig = {
      enabled: clinic.ab_testing_enabled || false,
      traffic_percentage: clinic.ab_test_percentage || 10,
      tests: [] // No active tests for now - this would come from an ab_tests table
    };

    return NextResponse.json(abTestingConfig);

  } catch (error) {
    console.error('Error fetching A/B tests:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch A/B tests',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}