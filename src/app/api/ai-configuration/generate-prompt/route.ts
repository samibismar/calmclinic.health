import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import OpenAI from 'openai';
import { InterviewResponses } from '@/types/ai-setup';

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

// Interfaces removed since we no longer fetch clinic intelligence data
// All data access is now handled through real-time tools in the Response API

// Note: This function is kept for potential future use but is not currently used
// since we now focus on personality-based prompt generation rather than clinic intelligence data
// async function fetchClinicIntelligenceData(clinicId: number) { ... }

export async function POST(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      template = '', 
      custom_instructions = '',
      interviewResponses = null
    }: {
      template: string;
      custom_instructions: string;
      interviewResponses?: InterviewResponses | null;
    } = body;

    // Define template descriptions that match the frontend
    const templateDescriptions = {
      'general': 'Balanced approach for family medicine and general health',
      'urgent-care': 'Efficient triage and quick assessment focus',
      'specialist': 'Detailed, condition-specific guidance',
      'dental': 'Oral health and dental procedure focused',
      'mental-health': 'Compassionate, supportive, and non-judgmental',
      'pediatric': 'Child-friendly and parent-focused communication',
      'custom': custom_instructions || 'Custom practice approach'
    };

    const templateDescription = templateDescriptions[template as keyof typeof templateDescriptions] || 'General healthcare practice';

    // Always use both template and interview responses when available
    const hasInterviewData = interviewResponses && Object.values(interviewResponses).some(response => response.trim().length > 0);
    
    let personalitySection = '';
    if (hasInterviewData) {
      personalitySection = `
CLINIC PERSONALITY (from interview responses):
Communication Style: "${interviewResponses.communicationStyle}"
Anxiety Management: "${interviewResponses.anxietyHandling}"
Practice Uniqueness: "${interviewResponses.practiceUniqueness}"
Medical Detail Level: "${interviewResponses.medicalDetailLevel}"
Escalation Preference: "${interviewResponses.escalationPreference}"
Cultural Approach: "${interviewResponses.culturalApproach}"
Formality Level: "${interviewResponses.formalityLevel}"
`;
    }

    const userPrompt = `You are an expert in crafting system prompts for AI assistants in healthcare clinics. Create a comprehensive system prompt that captures this clinic's approach and communication style.

CLINIC INFORMATION:
Practice Name: ${clinic.practice_name}
Primary Doctor: ${clinic.doctor_name}
Specialty: ${clinic.specialty}
${personalitySection}
SELECTED TEMPLATE: ${templateDescription}
ADDITIONAL INSTRUCTIONS: ${custom_instructions || 'None specified'}

CRITICAL REQUIREMENTS:
This system prompt will be combined with dynamic tool instructions and real-time data access. Focus ONLY on:
- Communication personality and conversational style
- Patient interaction approach and tone
- Practice philosophy and core values
- Professional boundaries and ethical guidelines
- When to escalate to human staff
- Cultural sensitivity and inclusiveness
- Conversation flow and patient experience

DO NOT include:
- Specific clinic data (services, hours, insurance, contact info) - AI tools will provide this dynamically
- Tool definitions or technical instructions - these are added separately
- Outdated information that might change - tools fetch current data

Create a ${hasInterviewData ? 'warm, authentic system prompt that reflects this clinic\'s unique personality' : 'professional system prompt that embodies the template approach'} while maintaining medical professionalism and safety standards.`;

    let prompt: string;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert AI prompt engineer specializing in healthcare clinic assistants. Create comprehensive, intelligent system prompts that leverage all available clinic data."
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      prompt = completion.choices[0]?.message?.content?.trim() || '';
    } catch (openaiError: unknown) {
      if (openaiError instanceof Error) {
        console.warn('OpenAI API failed, using fallback prompt generation:', openaiError.message);
      } else {
        console.warn('OpenAI API failed, using fallback prompt generation:', openaiError);
      }
      // Fallback prompt generation when OpenAI is unavailable
      prompt = `You are a helpful AI assistant for ${clinic.practice_name}, a ${clinic.specialty} practice. 

${hasInterviewData ? `Your communication style reflects the clinic's personality:
${personalitySection}` : ''}

You help patients with:
- General information about the practice
- Scheduling appointments
- Understanding procedures and services
- Insurance and billing questions
- Preparing for visits

You maintain a ${hasInterviewData && interviewResponses.formalityLevel ? interviewResponses.formalityLevel.toLowerCase() : 'professional but friendly'} tone and ${hasInterviewData && interviewResponses.communicationStyle ? 'focus on ' + interviewResponses.communicationStyle.toLowerCase() : 'provide clear, helpful information'}.

You always:
- Provide accurate information using available tools
- Escalate medical questions to healthcare providers
- Maintain appropriate professional boundaries
- Show empathy and understanding for patient concerns

For emergencies, direct patients to call 911 or contact the clinic directly.`;
    }

    if (!prompt) {
      return NextResponse.json({ 
        error: 'Failed to generate prompt' 
      }, { status: 500 });
    }

    // Save the generated prompt to version history
    try {
      await supabase
        .from('ai_prompt_history')
        .insert({
          clinic_id: clinic.id,
          prompt_text: prompt,
          version: (clinic.ai_version || 1) + 1,
          created_at: new Date().toISOString(),
          created_by: 'personality-generator',
          generation_data: {
            template,
            custom_instructions,
            interview_responses: interviewResponses,
            selected_template: template,
            generation_method: hasInterviewData ? 'interview-enhanced' : 'template-based'
          }
        });
    } catch (historyError) {
      console.error('Error saving to prompt history:', historyError);
      // Continue anyway, history is optional
    }

    return NextResponse.json({ 
      prompt,
      generation_info: {
        template: template,
        has_interview_data: hasInterviewData,
        generation_method: hasInterviewData ? 'interview-enhanced' : 'template-based',
        clinic_info: {
          practice_name: clinic.practice_name,
          specialty: clinic.specialty
        }
      }
    });

  } catch (error) {
    console.error('Error generating intelligent prompt:', error);
    return NextResponse.json({ 
      error: 'Failed to generate prompt',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}