import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // First check current data
    const { data: currentData, error: fetchError } = await supabase
      .from('clinic_insurance')
      .select('*')
      .eq('clinic_id', 45);
    
    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch current data', details: fetchError }, { status: 500 });
    }

    console.log('Current insurance data for clinic 45:', currentData);

    // Update plan types to match UI expectations
    const updates = [];
    
    for (const plan of currentData || []) {
      let newPlanType = plan.plan_type;
      
      if (plan.plan_name === 'Medicare') {
        newPlanType = 'medicare';
      } else if (plan.plan_name === 'Medicaid') {
        newPlanType = 'medicaid';
      } else if (['Aetna', 'Blue Cross Blue Shield', 'Cigna', 'UnitedHealthcare'].includes(plan.plan_name)) {
        newPlanType = 'major';
      }
      
      if (newPlanType !== plan.plan_type) {
        const { error: updateError } = await supabase
          .from('clinic_insurance')
          .update({ plan_type: newPlanType })
          .eq('id', plan.id);
          
        if (updateError) {
          console.error(`Failed to update plan ${plan.id}:`, updateError);
        } else {
          updates.push({ id: plan.id, old_type: plan.plan_type, new_type: newPlanType, plan_name: plan.plan_name });
        }
      }
    }

    // Fetch updated data
    const { data: updatedData, error: updatedFetchError } = await supabase
      .from('clinic_insurance')
      .select('*')
      .eq('clinic_id', 45)
      .order('plan_type')
      .order('plan_name');

    if (updatedFetchError) {
      return NextResponse.json({ error: 'Failed to fetch updated data', details: updatedFetchError }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Insurance plan types updated successfully',
      updates_made: updates,
      updated_data: updatedData
    });

  } catch (error) {
    console.error('Error fixing insurance types:', error);
    return NextResponse.json({ error: 'Failed to fix insurance types' }, { status: 500 });
  }
}