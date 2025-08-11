import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!clinicId) {
      return NextResponse.json({ error: 'Clinic ID is required' }, { status: 400 });
    }

    // Get sessions with basic info
    const { data: sessions, error, count } = await supabase
      .from('analytics_sessions')
      .select(`
        id,
        started_at,
        ended_at,
        total_messages,
        user_messages,
        ai_messages,
        first_response_time_ms,
        avg_response_time_ms,
        session_status,
        total_session_duration_ms,
        language,
        provider_id,
        providers:provider_id(name, title),
        analytics_qr_scans:qr_scan_id(scan_timestamp, scan_source)
      `, { count: 'exact' })
      .eq('clinic_id', clinicId)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    // Get first user message for each session for preview
    const sessionIds = sessions?.map(s => s.id) || [];
    const { data: firstMessages } = await supabase
      .from('analytics_messages')
      .select('session_id, content')
      .in('session_id', sessionIds)
      .eq('role', 'user')
      .eq('message_order', 1);

    // Create a map of first messages by session ID
    const firstMessageMap = (firstMessages || []).reduce((acc: Record<string, string>, msg) => {
      acc[msg.session_id] = msg.content;
      return acc;
    }, {});

    // Enhance sessions with first message preview
    const enhancedSessions = sessions?.map(session => ({
      ...session,
      firstMessage: firstMessageMap[session.id] || null,
      provider: session.providers || null,
      qrScan: session.analytics_qr_scans || null
    }));

    return NextResponse.json({
      sessions: enhancedSessions,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}