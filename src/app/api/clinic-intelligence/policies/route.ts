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

    const { data: policies, error } = await supabase
      .from('clinic_policies')
      .select('*')
      .eq('clinic_id', clinic.id)
      .order('policy_category', { ascending: true })
      .order('policy_name', { ascending: true });

    if (error) {
      console.error('Error fetching policies:', error);
      return NextResponse.json({ error: 'Failed to fetch policies' }, { status: 500 });
    }

    return NextResponse.json({ policies: policies || [] });
  } catch (error) {
    console.error('Error in GET /api/clinic-intelligence/policies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { policy_category, policy_name, policy_description, policy_value } = await request.json();

    if (!policy_category || !policy_name || !policy_description) {
      return NextResponse.json({ error: 'Policy category, name, and description are required' }, { status: 400 });
    }

    const { data: policy, error } = await supabase
      .from('clinic_policies')
      .insert([
        {
          clinic_id: clinic.id,
          policy_category,
          policy_name,
          policy_description,
          policy_value: policy_value || '',
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating policy:', error);
      return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
    }

    return NextResponse.json({ policy });
  } catch (error) {
    console.error('Error in POST /api/clinic-intelligence/policies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, policy_category, policy_name, policy_description, policy_value } = await request.json();

    if (!id || !policy_category || !policy_name || !policy_description) {
      return NextResponse.json({ error: 'ID, category, name, and description are required' }, { status: 400 });
    }

    const { data: policy, error } = await supabase
      .from('clinic_policies')
      .update({
        policy_category,
        policy_name,
        policy_description,
        policy_value: policy_value || ''
      })
      .eq('id', id)
      .eq('clinic_id', clinic.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating policy:', error);
      return NextResponse.json({ error: 'Failed to update policy' }, { status: 500 });
    }

    return NextResponse.json({ policy });
  } catch (error) {
    console.error('Error in PUT /api/clinic-intelligence/policies:', error);
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
      return NextResponse.json({ error: 'Policy ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('clinic_policies')
      .delete()
      .eq('id', id)
      .eq('clinic_id', clinic.id);

    if (error) {
      console.error('Error deleting policy:', error);
      return NextResponse.json({ error: 'Failed to delete policy' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/clinic-intelligence/policies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}