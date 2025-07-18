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

interface ContactInfo {
  contact_type: string;
  contact_value: string;
}

interface HourInfo {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

interface ServiceInfo {
  service_name: string;
  description: string;
  category: string;
}

interface InsuranceInfo {
  plan_name: string;
  accepted: boolean;
  notes: string;
}

interface QuestionInfo {
  id: number;
  question_text: string;
  is_active: boolean;
  category?: string;
}

interface PolicyInfo {
  id: number;
  policy_type: string;
  policy_description: string;
  is_active: boolean;
}

interface ConditionInfo {
  id: number;
  condition_name: string;
  description?: string;
  is_active: boolean;
}

interface ProfileInfo {
  id: number;
  mission?: string;
  values?: string;
  approach?: string;
  experience?: string;
}

async function fetchClinicIntelligenceData(clinicId: number) {
  try {
    const [
      contactResponse, 
      hoursResponse, 
      servicesResponse, 
      insuranceResponse,
      questionsResponse,
      policiesResponse,
      conditionsResponse,
      profileResponse
    ] = await Promise.all([
      supabase.from('clinic_contact_info').select('*').eq('clinic_id', clinicId),
      supabase.from('clinic_hours').select('*').eq('clinic_id', clinicId),
      supabase.from('clinic_services').select('*').eq('clinic_id', clinicId),
      supabase.from('clinic_insurance').select('*').eq('clinic_id', clinicId),
      supabase.from('clinic_common_questions').select('*').eq('clinic_id', clinicId),
      supabase.from('clinic_policies').select('*').eq('clinic_id', clinicId),
      supabase.from('clinic_conditions').select('*').eq('clinic_id', clinicId),
      supabase.from('clinic_profile').select('*').eq('clinic_id', clinicId)
    ]);

    return {
      contacts: (contactResponse.data || []) as ContactInfo[],
      hours: (hoursResponse.data || []) as HourInfo[],
      services: (servicesResponse.data || []) as ServiceInfo[],
      insurance: (insuranceResponse.data || []) as InsuranceInfo[],
      questions: (questionsResponse.data || []) as QuestionInfo[],
      policies: (policiesResponse.data || []) as PolicyInfo[],
      conditions: (conditionsResponse.data || []) as ConditionInfo[],
      profile: (profileResponse.data || []) as ProfileInfo[]
    };
  } catch (error) {
    console.error('Error fetching clinic intelligence data:', error);
    return { contacts: [], hours: [], services: [], insurance: [], questions: [], policies: [], conditions: [], profile: [] };
  }
}

export async function POST(request: NextRequest) {
  try {
    const clinic = await getClinicFromSession();
    
    if (!clinic) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const body = await request.json();
    const { template = '', custom_instructions = '' } = body;

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

    // Fetch comprehensive clinic data
    const intelligenceData = await fetchClinicIntelligenceData(clinic.id);

    // Build contact information summary
    const contacts = intelligenceData.contacts.reduce((acc: Record<string, string>, contact: ContactInfo) => {
      acc[contact.contact_type] = contact.contact_value;
      return acc;
    }, {});

    // Build hours summary
    const hours = intelligenceData.hours.map((hour: HourInfo) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return {
        day: days[hour.day_of_week],
        open_time: hour.open_time,
        close_time: hour.close_time,
        is_closed: hour.is_closed
      };
    });

    // Build services list
    const services = intelligenceData.services.map((service: ServiceInfo) => ({
      name: service.service_name,
      description: service.description,
      category: service.category
    }));

    // Build insurance list
    const insurance = intelligenceData.insurance.map((ins: InsuranceInfo) => ({
      plan_name: ins.plan_name,
      accepted: ins.accepted,
      notes: ins.notes
    }));

    // Build common questions list  
    const questions = intelligenceData.questions
      .filter((q: QuestionInfo) => q.is_active)
      .map((q: QuestionInfo) => q.question_text);

    // Build policies list
    const policies = intelligenceData.policies
      .filter((p: PolicyInfo) => p.is_active)
      .map((p: PolicyInfo) => `${p.policy_type}: ${p.policy_description}`);

    // Build conditions list
    const conditions = intelligenceData.conditions
      .filter((c: ConditionInfo) => c.is_active)
      .map((c: ConditionInfo) => `${c.condition_name}${c.description ? ` - ${c.description}` : ''}`);

    // Build profile information
    const profile = intelligenceData.profile.length > 0 ? intelligenceData.profile[0] : null;

    // Create comprehensive prompt for GPT
    const userPrompt = `
You are an expert in crafting system prompts for AI assistants in healthcare clinics. Create a comprehensive, intelligent system prompt for an AI assistant based on the detailed clinic information provided below.

CLINIC INFORMATION:
Practice Name: ${clinic.practice_name}
Primary Doctor: ${clinic.doctor_name}
Specialty: ${clinic.specialty}
Primary Color: ${clinic.primary_color}

CONTACT INFORMATION:
${Object.entries(contacts).map(([type, value]) => `${type}: ${value}`).join('\n')}

OPERATING HOURS:
${hours.map(h => `${h.day}: ${h.is_closed ? 'Closed' : `${h.open_time} - ${h.close_time}`}`).join('\n')}

SERVICES OFFERED:
${services.map(s => `• ${s.name}${s.description ? ` - ${s.description}` : ''}`).join('\n')}

INSURANCE ACCEPTED:
${insurance.filter(i => i.accepted).map(i => `• ${i.plan_name}${i.notes ? ` (${i.notes})` : ''}`).join('\n')}

COMMON PATIENT QUESTIONS:
${questions.length > 0 ? questions.map(q => `• ${q}`).join('\n') : 'None specified'}

CLINIC POLICIES:
${policies.length > 0 ? policies.map(p => `• ${p}`).join('\n') : 'None specified'}

CONDITIONS TREATED:
${conditions.length > 0 ? conditions.map(c => `• ${c}`).join('\n') : 'None specified'}

CLINIC PROFILE:
${profile ? `
Mission: ${profile.mission || 'Not specified'}
Values: ${profile.values || 'Not specified'}
Approach: ${profile.approach || 'Not specified'}
Experience: ${profile.experience || 'Not specified'}
` : 'No profile information available'}

TEMPLATE APPROACH: ${templateDescription}
ADDITIONAL INSTRUCTIONS: ${template !== 'custom' ? (custom_instructions || 'None specified') : 'Use the template description above as the primary guidance for tone and approach'}

REQUIREMENTS:
Create a system prompt that:
1. Establishes the AI as a highly specialized assistant for this specific clinic
2. Embodies the template approach described above throughout the entire prompt
3. Optimizes the AI to answer practically any question related to this clinic using the provided data
4. Leverages the AI's existing medical knowledge while specializing it for this clinic's specific approach
5. Includes all relevant clinic information naturally woven throughout the prompt
6. Sets appropriate boundaries (no medical advice, diagnoses, prescriptions)
7. Provides clear guidance on when to escalate to human staff
8. Maintains a tone and style that matches the template approach
9. Incorporates the clinic's specialty and services in a way that aligns with the template
10. Includes emergency and after-hours guidance
11. Mentions accepted insurance and payment policies
12. Provides appointment scheduling guidance
13. Creates a specialized knowledge base that combines the AI's general medical knowledge with this clinic's specific information
14. Enables the AI to provide detailed, clinic-specific answers about procedures, conditions, and treatments relevant to this practice

SPECIALIZATION GOAL:
The system prompt should transform the AI into a specialized assistant that can answer practically any clinic-related question by combining its existing medical knowledge with the comprehensive clinic data provided. The AI should be able to discuss medical topics (like dilation, procedures, conditions) while always relating them back to this specific clinic's approach, services, and policies.

The prompt should be comprehensive but natural, avoiding bullet points or overly structured formatting. Write it as if speaking directly to the AI assistant about its role and responsibilities.

Return only the system prompt text, ready to be used directly with the AI assistant.
`;

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

    const prompt = completion.choices[0]?.message?.content?.trim();

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
          created_by: 'auto-generator',
          generation_data: {
            template,
            custom_instructions,
            intelligence_data_used: true
          }
        });
    } catch (historyError) {
      console.error('Error saving to prompt history:', historyError);
      // Continue anyway, history is optional
    }

    return NextResponse.json({ 
      prompt,
      clinic_data_used: {
        contacts: Object.keys(contacts).length,
        hours: hours.length,
        services: services.length,
        insurance: insurance.length,
        questions: questions.length,
        policies: policies.length,
        conditions: conditions.length,
        profile: profile ? 1 : 0
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