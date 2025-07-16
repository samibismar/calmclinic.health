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

export async function GET() {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: hours, error } = await supabase
      .from('clinic_hours')
      .select('*')
      .eq('clinic_id', clinic.id)
      .order('day_of_week', { ascending: true });

    if (error) {
      console.error('Error fetching clinic hours:', error);
      return NextResponse.json({ error: 'Failed to fetch clinic hours' }, { status: 500 });
    }

    return NextResponse.json({ hours: hours || [] });
  } catch (error) {
    console.error('Error in GET /api/clinic-intelligence/clinic-hours:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { day_of_week, open_time, close_time, is_closed, notes } = await request.json();

    if (day_of_week === undefined || day_of_week < 0 || day_of_week > 6) {
      return NextResponse.json({ error: 'Valid day of week (0-6) is required' }, { status: 400 });
    }

    const { data: hours, error } = await supabase
      .from('clinic_hours')
      .insert([
        {
          clinic_id: clinic.id,
          day_of_week,
          open_time: is_closed ? null : open_time,
          close_time: is_closed ? null : close_time,
          is_closed: is_closed || false,
          notes: notes || '',
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating clinic hours:', error);
      return NextResponse.json({ error: 'Failed to create clinic hours' }, { status: 500 });
    }

    return NextResponse.json({ hours });
  } catch (error) {
    console.error('Error in POST /api/clinic-intelligence/clinic-hours:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, day_of_week, open_time, close_time, is_closed, notes } = await request.json();

    if (!id || day_of_week === undefined) {
      return NextResponse.json({ error: 'ID and day of week are required' }, { status: 400 });
    }

    const { data: hours, error } = await supabase
      .from('clinic_hours')
      .update({
        day_of_week,
        open_time: is_closed ? null : open_time,
        close_time: is_closed ? null : close_time,
        is_closed: is_closed || false,
        notes: notes || ''
      })
      .eq('id', id)
      .eq('clinic_id', clinic.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating clinic hours:', error);
      return NextResponse.json({ error: 'Failed to update clinic hours' }, { status: 500 });
    }

    return NextResponse.json({ hours });
  } catch (error) {
    console.error('Error in PUT /api/clinic-intelligence/clinic-hours:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Hours ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('clinic_hours')
      .delete()
      .eq('id', id)
      .eq('clinic_id', clinic.id);

    if (error) {
      console.error('Error deleting clinic hours:', error);
      return NextResponse.json({ error: 'Failed to delete clinic hours' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/clinic-intelligence/clinic-hours:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}