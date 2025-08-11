import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { 
      clinicSlug, 
      qrScanId, 
      providerId,
      sessionId, // Optional: if we want to specify the UUID
      language = 'en',
      userAgent
    } = await request.json();

    if (!clinicSlug) {
      return NextResponse.json({ error: 'Clinic slug is required' }, { status: 400 });
    }

    // Get clinic ID from slug
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id')
      .eq('slug', clinicSlug)
      .single();

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    // Create analytics session
    type AnalyticsSessionInsert = {
      id?: string;
      clinic_id: number;
      clinic_slug: string;
      started_at: string;
      language: string;
      session_status: 'active' | 'completed';
      user_agent: string;
      qr_scan_id?: string;
      provider_id?: number;
    };

    const sessionData: AnalyticsSessionInsert = {
      clinic_id: clinic.id,
      clinic_slug: clinicSlug,
      started_at: new Date().toISOString(),
      language,
      session_status: 'active',
      user_agent: userAgent || request.headers.get('user-agent') || ''
    };

    if (sessionId) {
      sessionData.id = sessionId;
    }
    if (qrScanId) {
      sessionData.qr_scan_id = qrScanId as string;
    }
    if (providerId) {
      sessionData.provider_id = Number(providerId);
    }

    const { data: session, error } = await supabase
      .from('analytics_sessions')
      .insert([sessionData])
      .select()
      .single();

    if (error) {
      console.error('Error creating analytics session:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      sessionId: session.id,
      startedAt: session.started_at
    });

  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { 
      sessionId, 
      status = 'ended',
      abandonmentReason,
      endedAt
    } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Calculate session duration
    const { data: session } = await supabase
      .from('analytics_sessions')
      .select('started_at')
      .eq('id', sessionId)
      .single();

    const sessionEndTime = endedAt ? new Date(endedAt) : new Date();
    const duration = session ? sessionEndTime.getTime() - new Date(session.started_at).getTime() : null;

    // Update session
    const { error } = await supabase
      .from('analytics_sessions')
      .update({
        session_status: status,
        ended_at: sessionEndTime.toISOString(),
        total_session_duration_ms: duration,
        abandonment_reason: abandonmentReason || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session:', error);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}