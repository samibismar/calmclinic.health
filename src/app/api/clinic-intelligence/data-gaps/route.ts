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

// Comprehensive analysis of clinic intelligence data gaps
async function analyzeClinicDataGaps(clinicId: number) {
  const gaps = [];

  try {
    // 1. Check Clinic Profile
    const { data: profile } = await supabase
      .from('clinic_profile')
      .select('*')
      .eq('clinic_id', clinicId)
      .single();

    if (!profile || !profile.mission_statement || !profile.specialties || profile.specialties.length === 0) {
      gaps.push({
        category: 'Clinic Profile',
        priority: 'high',
        description: 'Missing clinic mission statement or specialties'
      });
    }

    // 2. Check Contact Information
    const { data: contact } = await supabase
      .from('clinic_contact_info')
      .select('*')
      .eq('clinic_id', clinicId)
      .single();

    if (!contact || !contact.phone_numbers || !contact.address) {
      gaps.push({
        category: 'Contact Information',
        priority: 'high',
        description: 'Missing essential contact information'
      });
    }

    // 3. Check Clinic Hours
    const { data: hours } = await supabase
      .from('clinic_hours')
      .select('*')
      .eq('clinic_id', clinicId);

    if (!hours || hours.length === 0) {
      gaps.push({
        category: 'Clinic Hours',
        priority: 'high',
        description: 'No clinic hours configured'
      });
    }

    // 4. Check Services
    const { data: services } = await supabase
      .from('clinic_services')
      .select('*')
      .eq('clinic_id', clinicId);

    if (!services || services.length === 0) {
      gaps.push({
        category: 'Services',
        priority: 'high',
        description: 'No services listed'
      });
    }

    // 5. Check Insurance
    const { data: insurance } = await supabase
      .from('clinic_insurance')
      .select('*')
      .eq('clinic_id', clinicId);

    if (!insurance || insurance.length === 0) {
      gaps.push({
        category: 'Insurance',
        priority: 'medium',
        description: 'No insurance information provided'
      });
    }

    // 6. Check Common Questions
    const { data: questions } = await supabase
      .from('clinic_common_questions')
      .select('*')
      .eq('clinic_id', clinicId);

    if (!questions || questions.length === 0) {
      gaps.push({
        category: 'Common Questions',
        priority: 'medium',
        description: 'No common questions added'
      });
    }

    // 7. Check Policies
    const { data: policies } = await supabase
      .from('clinic_policies')
      .select('*')
      .eq('clinic_id', clinicId);

    if (!policies || policies.length === 0) {
      gaps.push({
        category: 'Policies',
        priority: 'medium',
        description: 'No clinic policies documented'
      });
    }

    // 8. Check Conditions
    const { data: conditions } = await supabase
      .from('clinic_conditions')
      .select('*')
      .eq('clinic_id', clinicId);

    if (!conditions || conditions.length === 0) {
      gaps.push({
        category: 'Conditions',
        priority: 'low',
        description: 'No conditions/treatments specified'
      });
    }

    return gaps;
  } catch (error) {
    console.error('Error analyzing clinic data gaps:', error);
    return [];
  }
}

export async function GET() {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Analyze actual clinic intelligence data to find gaps
    const gaps = await analyzeClinicDataGaps(clinic.id);

    return NextResponse.json({ gaps });
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