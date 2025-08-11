import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { 
      clinicId, 
      clinicSlug, 
      sessionId, 
      scanSource = 'qr_code',
      referrer 
    } = await request.json();
    
    let resolvedClinicId = clinicId;

    // If clinicId not provided, get it from slug
    if (!resolvedClinicId && clinicSlug) {
      const { data: clinic } = await supabase
        .from('clinics')
        .select('id')
        .eq('slug', clinicSlug)
        .single();

      if (!clinic) {
        return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
      }
      resolvedClinicId = clinic.id;
    }

    if (!resolvedClinicId) {
      return NextResponse.json({ error: 'Clinic ID or slug is required' }, { status: 400 });
    }

    // Extract request metadata
    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || '';
    const requestReferrer = referrer || request.headers.get('referer') || '';

    // Record QR scan
    const { data: scanRecord, error } = await supabase
      .from('analytics_qr_scans')
      .insert([{
        clinic_id: resolvedClinicId,
        scan_timestamp: new Date().toISOString(),
        user_agent: userAgent,
        ip_address: ipAddress || null,
        referrer: requestReferrer || null,
        scan_source: scanSource,
        session_id: sessionId || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error recording QR scan:', error);
      return NextResponse.json({ error: 'Failed to record QR scan' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      scanId: scanRecord.id,
      timestamp: scanRecord.scan_timestamp
    });

  } catch (error) {
    console.error('QR scan tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}