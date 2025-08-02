import { NextResponse } from 'next/server';
import { debugUserContext, getClinicFromSession } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get debug context
    const debugContext = await debugUserContext();
    
    // Try to get clinic from session
    const clinic = await getClinicFromSession();
    
    // Check clinic 45 specifically
    const { data: clinic45, error: clinic45Error } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', 45)
      .single();
    
    // Check insurance data for clinic 45
    const { data: insuranceData, error: insuranceError } = await supabase
      .from('clinic_insurance')
      .select('*')
      .eq('clinic_id', 45);
    
    return NextResponse.json({
      debug_context: debugContext,
      current_clinic: clinic,
      clinic_45_data: {
        clinic: clinic45,
        error: clinic45Error?.message,
      },
      insurance_data_45: {
        plans: insuranceData,
        error: insuranceError?.message,
        count: insuranceData?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
}