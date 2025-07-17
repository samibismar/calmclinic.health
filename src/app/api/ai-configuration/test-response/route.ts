import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const { message, isPreview = true } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Build system prompt from clinic configuration
    const systemPrompt = clinic.ai_instructions || `
You are an AI assistant for ${clinic.practice_name}, a ${clinic.specialty} practice led by ${clinic.doctor_name}.

Your role is to:
- Help patients with appointment scheduling and general questions
- Provide information about the clinic's services and policies
- Offer guidance on preparation for visits
- Be professional, helpful, and compassionate

Important guidelines:
- Never provide medical diagnoses or prescription advice
- Always recommend consulting with ${clinic.doctor_name} for medical concerns
- Be clear that you're an AI assistant, not a medical professional
- If unsure about something, direct patients to contact the clinic directly

Clinic Information:
- Practice: ${clinic.practice_name}
- Doctor: ${clinic.doctor_name}
- Specialty: ${clinic.specialty}
- Contact: ${clinic.phone || 'Please call our main number'}
`;

    // Generate response using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const response = completion.choices[0]?.message?.content?.trim();

    if (!response) {
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
            response: response,
            is_test: true,
            created_at: new Date().toISOString()
          });
      } catch (logError) {
        console.error('Error logging test interaction:', logError);
        // Continue anyway, logging is optional
      }
    }

    return NextResponse.json({ 
      response,
      clinic: {
        practice_name: clinic.practice_name,
        doctor_name: clinic.doctor_name,
        specialty: clinic.specialty
      }
    });

  } catch (error) {
    console.error('Error generating test response:', error);
    return NextResponse.json({ 
      error: 'Failed to generate response',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}