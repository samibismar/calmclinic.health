import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Simple medical terms detection
const MEDICAL_TERMS = [
  'pain', 'hurt', 'ache', 'symptom', 'diagnosis', 'treatment', 'medication', 'prescription',
  'doctor', 'physician', 'nurse', 'appointment', 'surgery', 'procedure', 'infection',
  'disease', 'condition', 'chronic', 'acute', 'therapy', 'cancer', 'tumor', 'diabetes',
  'blood', 'pressure', 'heart', 'lung', 'kidney', 'liver', 'brain', 'fever', 'nausea'
];

// Basic intent classification
function classifyIntent(content: string): string {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('appointment') || lowerContent.includes('schedule') || lowerContent.includes('booking')) {
    return 'appointment';
  }
  if (lowerContent.includes('insurance') || lowerContent.includes('coverage') || lowerContent.includes('cost')) {
    return 'insurance';
  }
  if (lowerContent.includes('service') || lowerContent.includes('treatment') || lowerContent.includes('procedure')) {
    return 'services';
  }
  if (lowerContent.includes('hour') || lowerContent.includes('open') || lowerContent.includes('closed')) {
    return 'hours';
  }
  if (lowerContent.includes('location') || lowerContent.includes('address') || lowerContent.includes('direction')) {
    return 'location';
  }
  if (MEDICAL_TERMS.some(term => lowerContent.includes(term))) {
    return 'medical';
  }
  
  return 'general';
}

function containsMedicalTerms(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return MEDICAL_TERMS.some(term => lowerContent.includes(term));
}

export async function POST(request: NextRequest) {
  try {
    const {
      sessionId,
      role, // 'user' or 'assistant'
      content,
      responseTimeMs,
      toolsUsed = [],
      ragConfidence,
      messageOrder
    } = await request.json();

    if (!sessionId || !role || !content) {
      return NextResponse.json({ 
        error: 'Session ID, role, and content are required' 
      }, { status: 400 });
    }

    // Get session info to get clinic_id
    const { data: session } = await supabase
      .from('analytics_sessions')
      .select('clinic_id')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get the next message order if not provided
    let finalMessageOrder = messageOrder;
    if (!finalMessageOrder) {
      const { count } = await supabase
        .from('analytics_messages')
        .select('*', { count: 'exact' })
        .eq('session_id', sessionId);
      
      finalMessageOrder = (count || 0) + 1;
    }

    // Record the message
    const { data: message, error } = await supabase
      .from('analytics_messages')
      .insert([{
        session_id: sessionId,
        clinic_id: session.clinic_id,
        role,
        content,
        message_order: finalMessageOrder,
        response_time_ms: responseTimeMs || null,
        tools_used: toolsUsed,
        rag_confidence: ragConfidence || null,
        content_length: content.length,
        contains_medical_terms: containsMedicalTerms(content),
        message_intent: role === 'user' ? classifyIntent(content) : null,
        timestamp: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error logging message:', error);
      return NextResponse.json({ error: 'Failed to log message' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      messageId: message.id,
      messageOrder: finalMessageOrder
    });

  } catch (error) {
    console.error('Message logging error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}