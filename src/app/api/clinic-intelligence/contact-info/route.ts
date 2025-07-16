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

    const { data: contacts, error } = await supabase
      .from('clinic_contact_info')
      .select('*')
      .eq('clinic_id', clinic.id)
      .order('is_primary', { ascending: false })
      .order('contact_type', { ascending: true });

    if (error) {
      console.error('Error fetching contact info:', error);
      return NextResponse.json({ error: 'Failed to fetch contact info' }, { status: 500 });
    }

    return NextResponse.json({ contacts: contacts || [] });
  } catch (error) {
    console.error('Error in GET /api/clinic-intelligence/contact-info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contact_type, contact_value, contact_label, is_primary } = await request.json();

    if (!contact_type || !contact_value) {
      return NextResponse.json({ error: 'Contact type and value are required' }, { status: 400 });
    }

    const { data: contact, error } = await supabase
      .from('clinic_contact_info')
      .insert([
        {
          clinic_id: clinic.id,
          contact_type,
          contact_value,
          contact_label: contact_label || '',
          is_primary: is_primary || false,
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating contact info:', error);
      return NextResponse.json({ error: 'Failed to create contact info' }, { status: 500 });
    }

    return NextResponse.json({ contact });
  } catch (error) {
    console.error('Error in POST /api/clinic-intelligence/contact-info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, contact_type, contact_value, contact_label, is_primary } = await request.json();

    if (!id || !contact_type || !contact_value) {
      return NextResponse.json({ error: 'ID, contact type, and value are required' }, { status: 400 });
    }

    const { data: contact, error } = await supabase
      .from('clinic_contact_info')
      .update({
        contact_type,
        contact_value,
        contact_label: contact_label || '',
        is_primary: is_primary || false
      })
      .eq('id', id)
      .eq('clinic_id', clinic.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating contact info:', error);
      return NextResponse.json({ error: 'Failed to update contact info' }, { status: 500 });
    }

    return NextResponse.json({ contact });
  } catch (error) {
    console.error('Error in PUT /api/clinic-intelligence/contact-info:', error);
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
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('clinic_contact_info')
      .delete()
      .eq('id', id)
      .eq('clinic_id', clinic.id);

    if (error) {
      console.error('Error deleting contact info:', error);
      return NextResponse.json({ error: 'Failed to delete contact info' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/clinic-intelligence/contact-info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}