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

    const { data: conditions, error } = await supabase
      .from('clinic_conditions')
      .select('*')
      .eq('clinic_id', clinic.id)
      .order('condition_name', { ascending: true });

    if (error) {
      console.error('Error fetching conditions:', error);
      return NextResponse.json({ error: 'Failed to fetch conditions' }, { status: 500 });
    }

    return NextResponse.json({ conditions: conditions || [] });
  } catch (error) {
    console.error('Error in GET /api/clinic-intelligence/conditions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { condition_name, condition_description, is_specialty } = await request.json();

    if (!condition_name) {
      return NextResponse.json({ error: 'Condition name is required' }, { status: 400 });
    }

    const { data: condition, error } = await supabase
      .from('clinic_conditions')
      .insert([
        {
          clinic_id: clinic.id,
          condition_name,
          condition_description: condition_description || '',
          is_specialty: is_specialty || false,
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating condition:', error);
      return NextResponse.json({ error: 'Failed to create condition' }, { status: 500 });
    }

    return NextResponse.json({ condition });
  } catch (error) {
    console.error('Error in POST /api/clinic-intelligence/conditions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, condition_name, condition_description, is_specialty } = await request.json();

    if (!id || !condition_name) {
      return NextResponse.json({ error: 'ID and condition name are required' }, { status: 400 });
    }

    const { data: condition, error } = await supabase
      .from('clinic_conditions')
      .update({
        condition_name,
        condition_description: condition_description || '',
        is_specialty: is_specialty || false
      })
      .eq('id', id)
      .eq('clinic_id', clinic.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating condition:', error);
      return NextResponse.json({ error: 'Failed to update condition' }, { status: 500 });
    }

    return NextResponse.json({ condition });
  } catch (error) {
    console.error('Error in PUT /api/clinic-intelligence/conditions:', error);
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
      return NextResponse.json({ error: 'Condition ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('clinic_conditions')
      .delete()
      .eq('id', id)
      .eq('clinic_id', clinic.id);

    if (error) {
      console.error('Error deleting condition:', error);
      return NextResponse.json({ error: 'Failed to delete condition' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/clinic-intelligence/conditions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}