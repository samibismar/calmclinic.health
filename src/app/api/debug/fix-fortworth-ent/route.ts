import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    const cookieStore = await cookies();
    const authUserId = cookieStore.get('auth_user_id')?.value;
    
    console.log('🔧 Starting Fort Worth ENT fixes...');
    
    // Step 1: Check current clinic data
    const { data: clinic45, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', 45)
      .single();
    
    if (clinicError || !clinic45) {
      return NextResponse.json({ 
        error: 'Fort Worth ENT clinic not found', 
        details: clinicError 
      }, { status: 404 });
    }
    
    console.log('📋 Current clinic 45 data:', clinic45);
    
    // Step 2: Fix auth_user_id if missing and we have a current user
    let authFixed = false;
    if (!clinic45.auth_user_id && authUserId) {
      console.log('🔐 Setting auth_user_id for clinic 45...');
      
      const { error: authUpdateError } = await supabase
        .from('clinics')
        .update({ auth_user_id: authUserId })
        .eq('id', 45);
        
      if (authUpdateError) {
        console.error('❌ Failed to update auth_user_id:', authUpdateError);
      } else {
        authFixed = true;
        console.log('✅ Successfully set auth_user_id for clinic 45');
      }
    }
    
    // Step 3: Check and fix insurance plan types
    const { data: currentInsurance, error: insuranceError } = await supabase
      .from('clinic_insurance')
      .select('*')
      .eq('clinic_id', 45);
    
    if (insuranceError) {
      return NextResponse.json({ 
        error: 'Failed to fetch insurance data', 
        details: insuranceError 
      }, { status: 500 });
    }
    
    console.log('📊 Current insurance data:', currentInsurance);
    
    // Step 4: Update plan types
    const insuranceUpdates = [];
    
    for (const plan of currentInsurance || []) {
      let newPlanType = plan.plan_type;
      
      if (plan.plan_type === 'commercial') {
        newPlanType = 'major';
      } else if (plan.plan_type === 'government') {
        if (plan.plan_name === 'Medicare') {
          newPlanType = 'medicare';
        } else if (plan.plan_name === 'Medicaid') {
          newPlanType = 'medicaid';
        }
      }
      
      if (newPlanType !== plan.plan_type) {
        const { error: updateError } = await supabase
          .from('clinic_insurance')
          .update({ plan_type: newPlanType })
          .eq('id', plan.id);
          
        if (updateError) {
          console.error(`❌ Failed to update plan ${plan.id}:`, updateError);
        } else {
          insuranceUpdates.push({ 
            id: plan.id, 
            plan_name: plan.plan_name,
            old_type: plan.plan_type, 
            new_type: newPlanType 
          });
          console.log(`✅ Updated ${plan.plan_name}: ${plan.plan_type} → ${newPlanType}`);
        }
      }
    }
    
    // Step 5: Fetch updated data
    const { data: updatedInsurance } = await supabase
      .from('clinic_insurance')
      .select('*')
      .eq('clinic_id', 45)
      .order('plan_type')
      .order('plan_name');
    
    return NextResponse.json({
      message: 'Fort Worth ENT fixes completed',
      fixes_applied: {
        auth_user_id_set: authFixed,
        insurance_plan_types_updated: insuranceUpdates.length > 0
      },
      updates: {
        auth_updates: authFixed ? [{ field: 'auth_user_id', value: authUserId }] : [],
        insurance_updates: insuranceUpdates
      },
      current_data: {
        clinic: clinic45,
        insurance_plans: updatedInsurance
      }
    });
    
  } catch (error) {
    console.error('💥 Error in Fort Worth ENT fix:', error);
    return NextResponse.json({ 
      error: 'Fix operation failed', 
      details: error 
    }, { status: 500 });
  }
}