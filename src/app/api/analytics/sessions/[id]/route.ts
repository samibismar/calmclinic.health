import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const sessionId = id;

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('analytics_sessions')
      .select(`
        *,
        providers:provider_id(name, title, specialties),
        analytics_qr_scans:qr_scan_id(scan_timestamp, scan_source, user_agent)
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get all messages for this session
    const { data: messages, error: messagesError } = await supabase
      .from('analytics_messages')
      .select(`
        *,
        analytics_feedback(feedback_type, feedback_text, created_at)
      `)
      .eq('session_id', sessionId)
      .order('message_order');

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Get RAG query logs for this session
    const { data: ragLogs } = await supabase
      .from('rag_query_logs')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at');

    // Calculate session metrics
    const sessionDuration = session.ended_at 
      ? new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()
      : Date.now() - new Date(session.started_at).getTime();

    const conversationMessages = messages?.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      responseTimeMs: msg.response_time_ms,
      toolsUsed: msg.tools_used,
      ragConfidence: msg.rag_confidence,
      messageIntent: msg.message_intent,
      containsMedicalTerms: msg.contains_medical_terms,
      feedback: msg.analytics_feedback?.[0] || null,
      order: msg.message_order
    })) || [];

    return NextResponse.json({
      session: {
        id: session.id,
        clinicId: session.clinic_id,
        clinicSlug: session.clinic_slug,
        startedAt: session.started_at,
        endedAt: session.ended_at,
        status: session.session_status,
        language: session.language,
        totalMessages: session.total_messages,
        userMessages: session.user_messages,
        aiMessages: session.ai_messages,
        firstResponseTimeMs: session.first_response_time_ms,
        avgResponseTimeMs: session.avg_response_time_ms,
        sessionDurationMs: sessionDuration,
        provider: session.providers,
        qrScan: session.analytics_qr_scans
      },
      messages: conversationMessages,
      ragLogs: ragLogs || []
    });

  } catch (error) {
    console.error('Session detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}