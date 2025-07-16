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

    const { data: services, error } = await supabase
      .from('clinic_services')
      .select('*')
      .eq('clinic_id', clinic.id)
      .order('service_category', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }

    return NextResponse.json({ services: services || [] });
  } catch (error) {
    console.error('Error in GET /api/clinic-intelligence/services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { service_category, service_name, description, display_order } = await request.json();

    if (!service_category || !service_name) {
      return NextResponse.json({ error: 'Service category and name are required' }, { status: 400 });
    }

    const { data: service, error } = await supabase
      .from('clinic_services')
      .insert([
        {
          clinic_id: clinic.id,
          service_category,
          service_name,
          description: description || '',
          display_order: display_order || 0,
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating service:', error);
      return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error('Error in POST /api/clinic-intelligence/services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, service_category, service_name, description, display_order } = await request.json();

    if (!id || !service_category || !service_name) {
      return NextResponse.json({ error: 'ID, service category, and name are required' }, { status: 400 });
    }

    const { data: service, error } = await supabase
      .from('clinic_services')
      .update({
        service_category,
        service_name,
        description: description || '',
        display_order: display_order || 0
      })
      .eq('id', id)
      .eq('clinic_id', clinic.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating service:', error);
      return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error('Error in PUT /api/clinic-intelligence/services:', error);
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
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('clinic_services')
      .delete()
      .eq('id', id)
      .eq('clinic_id', clinic.id);

    if (error) {
      console.error('Error deleting service:', error);
      return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/clinic-intelligence/services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}