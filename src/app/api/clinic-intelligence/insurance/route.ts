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

    const { data: plans, error } = await supabase
      .from('clinic_insurance')
      .select('*')
      .eq('clinic_id', clinic.id)
      .order('plan_type', { ascending: true })
      .order('plan_name', { ascending: true });

    if (error) {
      console.error('Error fetching insurance plans:', error);
      return NextResponse.json({ error: 'Failed to fetch insurance plans' }, { status: 500 });
    }

    return NextResponse.json({ plans: plans || [] });
  } catch (error) {
    console.error('Error in GET /api/clinic-intelligence/insurance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan_name, plan_type, coverage_notes } = await request.json();

    if (!plan_name || !plan_type) {
      return NextResponse.json({ error: 'Plan name and type are required' }, { status: 400 });
    }

    const { data: plan, error } = await supabase
      .from('clinic_insurance')
      .insert([
        {
          clinic_id: clinic.id,
          plan_name,
          plan_type,
          coverage_notes: coverage_notes || '',
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating insurance plan:', error);
      return NextResponse.json({ error: 'Failed to create insurance plan' }, { status: 500 });
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error in POST /api/clinic-intelligence/insurance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, plan_name, plan_type, coverage_notes } = await request.json();

    if (!id || !plan_name || !plan_type) {
      return NextResponse.json({ error: 'ID, plan name, and type are required' }, { status: 400 });
    }

    const { data: plan, error } = await supabase
      .from('clinic_insurance')
      .update({
        plan_name,
        plan_type,
        coverage_notes: coverage_notes || ''
      })
      .eq('id', id)
      .eq('clinic_id', clinic.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating insurance plan:', error);
      return NextResponse.json({ error: 'Failed to update insurance plan' }, { status: 500 });
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error in PUT /api/clinic-intelligence/insurance:', error);
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
      return NextResponse.json({ error: 'Insurance plan ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('clinic_insurance')
      .delete()
      .eq('id', id)
      .eq('clinic_id', clinic.id);

    if (error) {
      console.error('Error deleting insurance plan:', error);
      return NextResponse.json({ error: 'Failed to delete insurance plan' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/clinic-intelligence/insurance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}