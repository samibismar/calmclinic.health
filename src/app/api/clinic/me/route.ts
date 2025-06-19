import { NextResponse } from 'next/server';
import { getClinicWithPaymentStatus } from '@/lib/auth';

export async function GET() {
  console.log('🔍 GET /api/clinic/me called');
  
  try {
    const result = await getClinicWithPaymentStatus();
    
    console.log('🏥 Clinic result:', result);
    
    if (!result.clinic) {
      return NextResponse.json(
        { error: 'No clinic found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      clinic: result.clinic,
      isPaid: result.isPaid,
      error: result.error
    });

  } catch (error) {
    console.error('❌ Error in /api/clinic/me:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}