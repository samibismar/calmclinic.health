import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

async function getClinicFromSession() {
  const cookieStore = await cookies();
  const authUserId = cookieStore.get('auth_user_id')?.value;
  
  if (!authUserId) return null;

  const { data: clinic } = await supabase
    .from('clinics')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  return clinic;
}

export async function POST(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const body = await request.json();
    const { message, providerId, isPreview = true } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Use the modern responses API endpoint instead of direct OpenAI
    const apiUrl = new URL('/api/responses', request.url);
    const requestBody = {
      messages: [{ role: "user", content: message }],
      doctorName: clinic.doctor_name,
      specialty: clinic.specialty,
      language: 'en',
      aiInstructions: null, // Let it use the assembled prompt
      providerId: providerId || null,
      providerSpecialties: [],
      providerTitle: 'Doctor',
      clinicName: clinic.slug
    };

    const response = await fetch(apiUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({ 
        error: 'Failed to generate response',
        details: errorData 
      }, { status: 500 });
    }

    const data = await response.json();
    const aiResponse = data.message;

    if (!aiResponse) {
      return NextResponse.json({ 
        error: 'Failed to generate response' 
      }, { status: 500 });
    }

    // Log the test interaction (optional)
    if (!isPreview) {
      try {
        await supabase
          .from('chat_logs')
          .insert({
            clinic_id: clinic.id,
            message: message,
            response: aiResponse,
            is_test: true,
            created_at: new Date().toISOString()
          });
      } catch (logError) {
        console.error('Error logging test interaction:', logError);
        // Continue anyway, logging is optional
      }
    }

    return NextResponse.json({ 
      response: aiResponse,
      clinic: {
        practice_name: clinic.practice_name,
        doctor_name: clinic.doctor_name,
        specialty: clinic.specialty
      },
      tools_used: data.tools_used || []
    });

  } catch (error) {
    console.error('Error generating test response:', error);
    return NextResponse.json({ 
      error: 'Failed to generate response',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}