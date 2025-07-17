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

async function fetchClinicIntelligenceData(clinicId: number) {
  try {
    const [contactResponse, hoursResponse, servicesResponse, insuranceResponse] = await Promise.all([
      supabase.from('clinic_contact_info').select('*').eq('clinic_id', clinicId),
      supabase.from('clinic_hours').select('*').eq('clinic_id', clinicId),
      supabase.from('clinic_services').select('*').eq('clinic_id', clinicId),
      supabase.from('clinic_insurance').select('*').eq('clinic_id', clinicId)
    ]);

    return {
      contacts: (contactResponse.data || []) as ContactInfo[],
      hours: (hoursResponse.data || []) as HourInfo[],
      services: (servicesResponse.data || []) as ServiceInfo[],
      insurance: (insuranceResponse.data || []) as InsuranceInfo[]
    };
  } catch (error) {
    console.error('Error fetching clinic intelligence data:', error);
    return { contacts: [], hours: [], services: [], insurance: [] };
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

TEMPLATE PREFERENCE: ${template || 'General healthcare practice'}
ADDITIONAL INSTRUCTIONS: ${custom_instructions || 'None specified'}

REQUIREMENTS:
Create a system prompt that:
1. Establishes the AI as a helpful assistant for this specific clinic
2. Includes all relevant clinic information naturally
3. Sets appropriate boundaries (no medical advice, diagnoses, prescriptions)
4. Provides clear guidance on when to escalate to human staff
5. Maintains a professional yet approachable tone
6. Incorporates the clinic's specialty and services
7. Includes emergency and after-hours guidance
8. Mentions accepted insurance and payment policies
9. Provides appointment scheduling guidance
10. Reflects the clinic's specific character and approach

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
        insurance: insurance.length
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