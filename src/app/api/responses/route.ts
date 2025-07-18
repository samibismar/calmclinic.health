import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getClinicServices(clinicId: number) {
  try {
    const { data, error } = await supabase
      .from('clinic_services')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);
    
    if (error) throw error;
    
    return data?.map(service => ({
      name: service.service_name,
      description: service.description,
      category: service.service_category
    })) || [];
  } catch (error) {
    console.error('Error fetching clinic services:', error);
    return [];
  }
}

async function getClinicHours(clinicId: number) {
  try {
    const { data, error } = await supabase
      .from('clinic_hours')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('day_of_week');
    
    if (error) throw error;
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return data?.map(hour => ({
      day: days[hour.day_of_week],
      open_time: hour.open_time,
      close_time: hour.close_time,
      is_closed: hour.is_closed
    })) || [];
  } catch (error) {
    console.error('Error fetching clinic hours:', error);
    return [];
  }
}

async function getInsuranceInfo(clinicId: number) {
  try {
    const { data, error } = await supabase
      .from('clinic_insurance')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);
    
    if (error) throw error;
    
    return data?.map(insurance => ({
      plan_name: insurance.plan_name,
      plan_type: insurance.plan_type,
      coverage_notes: insurance.coverage_notes
    })) || [];
  } catch (error) {
    console.error('Error fetching insurance info:', error);
    return [];
  }
}

async function getContactInfo(clinicId: number) {
  try {
    const { data, error } = await supabase
      .from('clinic_contact_info')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);
    
    if (error) throw error;
    
    return data?.map(contact => ({
      type: contact.contact_type,
      value: contact.contact_value,
      label: contact.contact_label,
      is_primary: contact.is_primary
    })) || [];
  } catch (error) {
    console.error('Error fetching contact info:', error);
    return [];
  }
}

async function getAppointmentPolicies(clinicId: number) {
  try {
    const { data, error } = await supabase
      .from('clinic_policies')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .eq('policy_category', 'appointment');
    
    if (error) throw error;
    
    return data?.map(policy => ({
      name: policy.policy_name,
      description: policy.policy_description,
      value: policy.policy_value
    })) || [];
  } catch (error) {
    console.error('Error fetching appointment policies:', error);
    return [];
  }
}

async function getConditionsTreated(clinicId: number) {
  try {
    const { data, error } = await supabase
      .from('clinic_conditions')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);
    
    if (error) throw error;
    
    return data?.map(condition => ({
      name: condition.condition_name,
      description: condition.condition_description,
      is_specialty: condition.is_specialty
    })) || [];
  } catch (error) {
    console.error('Error fetching conditions treated:', error);
    return [];
  }
}

async function getProviderInfo(providerId: number) {
  try {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('id', providerId)
      .eq('is_active', true)
      .single();
    
    if (error) throw error;
    
    return data ? {
      name: data.name,
      title: data.title,
      specialties: data.specialties || [],
      bio: data.bio,
      experience: data.experience,
      languages: data.languages || []
    } : null;
  } catch (error) {
    console.error('Error fetching provider info:', error);
    return null;
  }
}


const tools = [
  {
    type: "function" as const,
    function: {
      name: "get_clinic_services",
      description: "Get services offered by the clinic",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_clinic_hours", 
      description: "Get clinic operating hours",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_insurance_info",
      description: "Get accepted insurance plans and coverage information",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_contact_info",
      description: "Get clinic contact information like phone numbers and addresses",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_appointment_policies",
      description: "Get appointment scheduling and cancellation policies",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_conditions_treated",
      description: "Get medical conditions treated at the clinic",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_provider_info",
      description: "Get information about the healthcare provider",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false
      }
    }
  }
];

export async function POST(request: Request) {
  try {
    console.log('📝 Response API called');
    
    const body = await request.json();
    const { messages, providerId } = body;

    let clinicId = null;
    if (providerId) {
      const { data: provider } = await supabase
        .from('providers')
        .select('clinic_id')
        .eq('id', providerId)
        .single();
      
      clinicId = provider?.clinic_id;
    }

    if (!clinicId) {
      console.log('No clinic found, using fallback');
      return NextResponse.json({ 
        message: "Hello! I'm here to help you while you wait for your appointment. How can I assist you today?",
        tools_used: []
      });
    }

    const systemPrompt = `You are an intelligent medical assistant with access to comprehensive clinic information.

AVAILABLE TOOLS:
- get_clinic_services: Get services offered by the clinic
- get_clinic_hours: Get clinic operating hours  
- get_insurance_info: Get accepted insurance plans
- get_contact_info: Get clinic contact information
- get_appointment_policies: Get scheduling and cancellation policies
- get_conditions_treated: Get medical conditions treated at the clinic
- get_provider_info: Get healthcare provider details

Use these tools to provide accurate, up-to-date information to help patients prepare for their appointments and answer their questions about the clinic.`;

    console.log('🤖 Calling OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      tools: tools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0].message;

    if (response.tool_calls && response.tool_calls.length > 0) {
      console.log(`🔧 Processing ${response.tool_calls.length} tool calls`);
      
      const toolResults = [];
      
      for (const toolCall of response.tool_calls) {
        let result;
        const args = JSON.parse(toolCall.function.arguments || '{}');
        
        switch (toolCall.function.name) {
          case 'get_clinic_services':
            result = await getClinicServices(clinicId);
            break;
          case 'get_clinic_hours':
            result = await getClinicHours(clinicId);
            break;
          case 'get_insurance_info':
            result = await getInsuranceInfo(clinicId);
            break;
          case 'get_contact_info':
            result = await getContactInfo(clinicId);
            break;
          case 'get_appointment_policies':
            result = await getAppointmentPolicies(clinicId);
            break;
          case 'get_conditions_treated':
            result = await getConditionsTreated(clinicId);
            break;
          case 'get_provider_info':
            result = await getProviderInfo(providerId || 0);
            break;
          default:
            result = { error: 'Unknown tool' };
        }
        
        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool" as const,
          content: JSON.stringify(result)
        });
      }

      const finalCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
          response,
          ...toolResults
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return NextResponse.json({ 
        message: finalCompletion.choices[0].message.content,
        tools_used: response.tool_calls.map(tc => tc.function.name)
      });
    }

    return NextResponse.json({ 
      message: response.content,
      tools_used: []
    });

  } catch (error) {
    console.error('❌ Response API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}