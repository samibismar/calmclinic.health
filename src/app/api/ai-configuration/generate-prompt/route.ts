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
    
    let interviewSection = '';
    if (hasInterviewData) {
      interviewSection = Object.entries(interviewResponses)
        .map(([key, value]) => `${key}: "${value}"`)
        .join('\n');
    }

    const userPrompt = `Your task is to generate the base system prompt for an AI assistant used in a medical clinic.

This is not text the assistant will say to patients. This is the invisible configuration that sets the assistant's tone, persona, and rules of behavior.

The assistant will later receive real-time tools, capabilities, and system hooks — so you do NOT need to include tool names, commands, APIs, or specific features. Focus only on the base behavioral and personality layer.

---- INPUTS ----
Clinic Profile:
Practice Name: ${clinic.practice_name}
Doctor: ${clinic.doctor_name}
Specialty: ${clinic.specialty}
Template: ${templateDescription}
Custom Instructions: ${custom_instructions || 'None specified'}
Interview Responses: ${interviewSection}

---- OUTPUT INSTRUCTIONS ----

Write a single, polished, natural-language system prompt addressed to the assistant
Write in the second person (e.g., "You are warm and professional..." or "You always escalate...")
Seamlessly integrate the input information — do not label or list inputs
Reflect tone, values, patient interaction style, escalation policy, and cultural sensitivity
Set clear professional and ethical boundaries (e.g., no diagnosis, always escalate complex issues)

DO NOT include:

Tool names, features, or APIs
Bullet points, variable names, or metadata
Any roleplay, greetings, or patient-facing text
Any implementation details — this is just the base prompt
This is the foundational configuration that will be combined later with dynamic tooling logic and response formatting.

---- FEW-SHOT EXAMPLES ----

Example 1:
INPUT:
Clinic: Sunshine Pediatrics, Dr. Maria Ortiz, Pediatrics
Template: pediatric
Custom Instructions: "Use playful, reassuring language."
Interview Responses: {"communicationStyle": "friendly and calm", "formalityLevel":"casual", "escalationPreferences":"call parents if unsure"}
OUTPUT:
You are the AI assistant for Sunshine Pediatrics. You speak in a calm, playful tone that puts children and their parents at ease. You use friendly, casual language to support open conversations and help families feel welcome. You never provide medical advice. When patients ask about medications, diagnoses, or procedures, you escalate to clinic staff. You are patient, empathetic, and reflect the warm, child-centered philosophy of the clinic.

Example 2:
INPUT:
Clinic: Peak Skin Clinic, Dr. James Wong, Dermatology
Template: specialist
Custom Instructions: "Be precise and professional."
Interview Responses: {"communicationStyle": "concise and confident", "formalityLevel": "formal", "escalationPreferences": "refer to physician for treatment questions"}
OUTPUT:
You are the AI assistant for Peak Skin Clinic. You communicate with clarity, professionalism, and confidence. You use formal language to share helpful, accurate responses about dermatology procedures and practice policies, without ever offering medical advice. When a patient asks about diagnoses or treatment options, you escalate immediately to a qualified provider. You reflect the clinic's commitment to clinical expertise, safety, and respectful care.

---- FINAL GUIDELINES ----

Do not include variable names, markup, or tool mentions
Your output should be written as if it came from a top-tier, world-class prompt engineer
The tone should be confident, clear, and deployable without edits
Treat this as the core behavioral blueprint that downstream models will build upon
Only output the final base system prompt text`;

    let prompt: string;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a senior AI prompt engineer specializing in base system prompts for production-grade assistants.\n\nYour task is to generate an internal configuration prompt that defines how a clinic-facing AI assistant behaves — its tone, persona, escalation rules, and ethical boundaries. You are writing directly TO the assistant, not describing it. Use second-person voice throughout (e.g., \"You are...\", \"You should...\", \"You never...\").\n\nThis prompt will be used as-is in a live system and later combined with tool logic. Focus only on configuring the assistant's behavior — not implementation, tool usage, or features.\n\nNo roleplay. No dialogue. Just clean, deployable configuration."
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
${interviewSection}` : ''}

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

    // Save the generated prompt to version history (NOT as current)
    try {
      await supabase
        .from('ai_prompt_history')
        .insert({
          clinic_id: clinic.id,
          prompt_text: prompt,
          version: (clinic.ai_version || 1) + 1,
          version_name: `Generated ${new Date().toLocaleDateString()}`,
          is_current: false, // Generated prompts are not automatically current
          created_by: 'ai-generator',
          generation_data: {
            template,
            custom_instructions,
            interview_responses: interviewResponses,
            selected_template: template,
            generation_method: hasInterviewData ? 'interview-enhanced' : 'template-based',
            generated_at: new Date().toISOString()
          }
        });
    } catch (historyError) {
      console.error('Error saving generated prompt to history:', historyError);
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