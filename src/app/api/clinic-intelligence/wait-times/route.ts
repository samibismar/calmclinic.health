import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to get clinic ID from session
async function getClinicFromSession() {
  const cookieStore = await cookies();
  const authUserId = cookieStore.get('auth_user_id')?.value;
  
  if (!authUserId) {
    return null;
  }

  const { data: clinic } = await supabase
    .from('clinics')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  return clinic;
}

// GET - Fetch providers with wait times
export async function GET() {
  try {
    const clinic = await getClinicFromSession();

    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch providers with wait times
    const { data: providers, error } = await supabase
      .from('providers')
      .select(`
        id,
        name,
        title,
        specialties,
        is_active,
        wait_time_minutes
      `)
      .eq('clinic_id', clinic.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching providers:', error);
      return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
    }

    // Set default wait time if null
    const providersWithDefaults = providers.map(provider => ({
      ...provider,
      wait_time_minutes: provider.wait_time_minutes ?? 5 // Default 5 minutes
    }));

    return NextResponse.json({ providers: providersWithDefaults });
  } catch (error) {
    console.error('Wait times GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Update wait times
export async function POST(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();

    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { providers } = await request.json();

    if (!providers || !Array.isArray(providers)) {
      return NextResponse.json({ error: 'Invalid providers data' }, { status: 400 });
    }

    // Update each provider's wait time
    const updates = await Promise.all(
      providers.map(async (provider: { id: number; wait_time_minutes: number }) => {
        const { error } = await supabase
          .from('providers')
          .update({ wait_time_minutes: provider.wait_time_minutes })
          .eq('id', provider.id)
          .eq('clinic_id', clinic.id); // Security: ensure provider belongs to this clinic

        if (error) {
          console.error(`Error updating provider ${provider.id}:`, error);
          throw error;
        }

        return provider.id;
      })
    );

    return NextResponse.json({ 
      success: true, 
      updated_providers: updates.length 
    });
  } catch (error) {
    console.error('Wait times POST error:', error);
    return NextResponse.json({ error: 'Failed to update wait times' }, { status: 500 });
  }
}