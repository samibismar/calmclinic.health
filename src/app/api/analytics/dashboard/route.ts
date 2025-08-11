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
    const days = parseInt(searchParams.get('days') || '7');

    if (!clinicId) {
      return NextResponse.json({ error: 'Clinic ID is required' }, { status: 400 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    // Get basic metrics in parallel
    const [
      qrScansResult,
      sessionsResult,
      messagesResult,
      feedbackResult,
      responseTimesResult
    ] = await Promise.all([
      // QR scans count
      supabase
        .from('analytics_qr_scans')
        .select('id', { count: 'exact' })
        .eq('clinic_id', clinicId)
        .gte('scan_timestamp', startDateStr),

      // Sessions metrics
      supabase
        .from('analytics_sessions')
        .select('id, started_at, total_messages, first_response_time_ms, session_status', { count: 'exact' })
        .eq('clinic_id', clinicId)
        .gte('started_at', startDateStr),

      // Total messages
      supabase
        .from('analytics_messages')
        .select('id, role', { count: 'exact' })
        .eq('clinic_id', clinicId)
        .gte('timestamp', startDateStr),

      // Feedback summary
      supabase
        .from('analytics_feedback')
        .select('feedback_type')
        .eq('clinic_id', clinicId)
        .gte('created_at', startDateStr),

      // Response times for AI messages
      supabase
        .from('analytics_messages')
        .select('response_time_ms')
        .eq('clinic_id', clinicId)
        .eq('role', 'assistant')
        .not('response_time_ms', 'is', null)
        .gte('timestamp', startDateStr)
    ]);

    // Calculate metrics
    const qrScans = qrScansResult.count || 0;
    const totalSessions = sessionsResult.count || 0;
    const activeSessions = sessionsResult.data?.filter(s => s.session_status === 'active').length || 0;
    
    const sessions = sessionsResult.data || [];
    const sessionsByDay: Record<string, number> = {};
    
    // Group sessions by day
    sessions.forEach(session => {
      const day = new Date(session.started_at).toISOString().split('T')[0];
      sessionsByDay[day] = (sessionsByDay[day] || 0) + 1;
    });

    const totalMessages = messagesResult.count || 0;
    const userMessages = messagesResult.data?.filter(m => m.role === 'user').length || 0;
    const aiMessages = messagesResult.data?.filter(m => m.role === 'assistant').length || 0;

    // Response time calculations
    const responseTimes = responseTimesResult.data?.map(r => r.response_time_ms).filter(rt => rt > 0) || [];
    const avgResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length)
      : 0;

    // First response times
    const firstResponseTimes = sessions
      .map(s => s.first_response_time_ms)
      .filter(rt => rt && rt > 0);
    const avgFirstResponseTime = firstResponseTimes.length > 0
      ? Math.round(firstResponseTimes.reduce((sum, rt) => sum + rt, 0) / firstResponseTimes.length)
      : 0;

    // Feedback metrics
    const feedback = feedbackResult.data || [];
    const positiveFeedback = feedback.filter(f => f.feedback_type === 'positive').length;
    const negativeFeedback = feedback.filter(f => f.feedback_type === 'negative').length;
    const totalFeedback = positiveFeedback + negativeFeedback;
    const feedbackRatio = totalFeedback > 0 ? Math.round((positiveFeedback / totalFeedback) * 100) : 0;

    // Calculate activation rate (sessions with at least 1 user message / QR scans)
    const activationRate = qrScans > 0 
      ? Math.round((sessions.filter(s => s.total_messages > 0).length / qrScans) * 100)
      : 0;

    return NextResponse.json({
      clinicId: parseInt(clinicId),
      dateRange: {
        startDate: startDateStr,
        endDate: new Date().toISOString(),
        days
      },
      metrics: {
        qrScans,
        totalSessions,
        activeSessions,
        totalMessages,
        userMessages,
        aiMessages,
        avgResponseTime,
        avgFirstResponseTime,
        positiveFeedback,
        negativeFeedback,
        feedbackRatio,
        activationRate
      },
      dailyData: sessionsByDay
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}