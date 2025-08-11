import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const {
      messageId,
      feedbackType, // 'positive' or 'negative'
      feedbackText = null
    } = await request.json();

    if (!messageId || !feedbackType) {
      return NextResponse.json({ 
        error: 'Message ID and feedback type are required' 
      }, { status: 400 });
    }

    if (!['positive', 'negative'].includes(feedbackType)) {
      return NextResponse.json({ 
        error: 'Feedback type must be positive or negative' 
      }, { status: 400 });
    }

    // Get message info to get session and clinic data
    const { data: message } = await supabase
      .from('analytics_messages')
      .select('session_id, clinic_id, message_order, timestamp')
      .eq('id', messageId)
      .single();

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Calculate response time (time between message and feedback)
    const responseTime = Date.now() - new Date(message.timestamp).getTime();

    // Check if feedback already exists for this message
    const { data: existingFeedback } = await supabase
      .from('analytics_feedback')
      .select('id')
      .eq('message_id', messageId)
      .single();

    if (existingFeedback) {
      // Update existing feedback
      const { error } = await supabase
        .from('analytics_feedback')
        .update({
          feedback_type: feedbackType,
          feedback_text: feedbackText,
          response_time_when_given: responseTime
        })
        .eq('message_id', messageId);

      if (error) {
        console.error('Error updating feedback:', error);
        return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
      }
    } else {
      // Create new feedback
      const { error } = await supabase
        .from('analytics_feedback')
        .insert([{
          message_id: messageId,
          session_id: message.session_id,
          clinic_id: message.clinic_id,
          feedback_type: feedbackType,
          feedback_text: feedbackText,
          message_order: message.message_order,
          response_time_when_given: responseTime
        }]);

      if (error) {
        console.error('Error creating feedback:', error);
        return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Feedback recording error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}