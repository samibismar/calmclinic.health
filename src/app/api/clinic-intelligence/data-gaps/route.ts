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

    const { data: gaps, error } = await supabase
      .from('clinic_data_gaps')
      .select('*')
      .eq('clinic_id', clinic.id)
      .order('priority_level', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching data gaps:', error);
      return NextResponse.json({ error: 'Failed to fetch data gaps' }, { status: 500 });
    }

    return NextResponse.json({ gaps: gaps || [] });
  } catch (error) {
    console.error('Error in GET /api/clinic-intelligence/data-gaps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gap_category, gap_description, priority_level } = await request.json();

    if (!gap_category || !gap_description) {
      return NextResponse.json({ error: 'Gap category and description are required' }, { status: 400 });
    }

    const { data: gap, error } = await supabase
      .from('clinic_data_gaps')
      .insert([
        {
          clinic_id: clinic.id,
          gap_category,
          gap_description,
          priority_level: priority_level || 1,
          is_filled: false
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating data gap:', error);
      return NextResponse.json({ error: 'Failed to create data gap' }, { status: 500 });
    }

    return NextResponse.json({ gap });
  } catch (error) {
    console.error('Error in POST /api/clinic-intelligence/data-gaps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, gap_category, gap_description, priority_level, is_filled } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Gap ID is required' }, { status: 400 });
    }

    const updateData: {
      gap_category?: string;
      gap_description?: string;
      priority_level?: number;
      is_filled?: boolean;
      filled_at?: string | null;
    } = {};
    if (gap_category !== undefined) updateData.gap_category = gap_category;
    if (gap_description !== undefined) updateData.gap_description = gap_description;
    if (priority_level !== undefined) updateData.priority_level = priority_level;
    if (is_filled !== undefined) {
      updateData.is_filled = is_filled;
      updateData.filled_at = is_filled ? new Date().toISOString() : null;
    }

    const { data: gap, error } = await supabase
      .from('clinic_data_gaps')
      .update(updateData)
      .eq('id', id)
      .eq('clinic_id', clinic.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating data gap:', error);
      return NextResponse.json({ error: 'Failed to update data gap' }, { status: 500 });
    }

    return NextResponse.json({ gap });
  } catch (error) {
    console.error('Error in PUT /api/clinic-intelligence/data-gaps:', error);
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
      return NextResponse.json({ error: 'Data gap ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('clinic_data_gaps')
      .delete()
      .eq('id', id)
      .eq('clinic_id', clinic.id);

    if (error) {
      console.error('Error deleting data gap:', error);
      return NextResponse.json({ error: 'Failed to delete data gap' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/clinic-intelligence/data-gaps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}