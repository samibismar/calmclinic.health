import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from "@supabase/supabase-js";
import { assembleSystemPrompt, validatePromptAssembly } from '@/lib/prompt-assembly';

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

interface OpenAIResponseOutputItem {
  type: string;
  name?: string;
  call_id?: string;
  id?: string;
  function?: { name: string };
  [key: string]: unknown;
}

interface ToolResult {
  function_call_id: string;
  result: unknown;
}

interface OpenAIResponsesAPIResult {
  id: string;
  output?: OpenAIResponseOutputItem[];
  output_text?: string;
  text?: string;
  [key: string]: unknown;
}

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

    // Simple tracking: just count the interaction
    if (providerId) {
      try {
        await supabase
          .from('patient_interactions')
          .insert({ provider_id: providerId });
      } catch (error) {
        console.warn('Failed to track interaction:', error);
      }
    }

    // Use our custom clinic tools - the Responses API will try to call them
    // If it fails, we'll catch the error and handle tools manually in the fallback
    const responsesAPITools = [
      // Our clinic intelligence tools
      ...tools.map(tool => ({
        type: "function" as const,
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters
      })),
      // Add OpenAI's built-in web search tool as backup
      { type: "web_search_preview" as const }
    ];

    // Assemble the system prompt dynamically
    console.log('🔧 Assembling system prompt for clinic:', clinicId);
    const systemPrompt = await assembleSystemPrompt(clinicId);
    
    if (!validatePromptAssembly(systemPrompt)) {
      console.warn('⚠️ Prompt assembly validation failed, using fallback');
    }
    console.log('✅ System prompt assembled successfully:', systemPrompt.length, 'characters');
    
    // 🎯 FULL SYSTEM PROMPT DISPLAY
    console.log('\n🎯 ==================== FULL ASSEMBLED SYSTEM PROMPT ====================');
    console.log(systemPrompt);
    console.log('🎯 ====================================================================\n');

    // Get the last user message for the Responses API
    const lastUserMessage = messages[messages.length - 1];
    const userInput = lastUserMessage?.content || "";

    // Get conversation history for context (excluding the last message since it goes in input)
    const conversationContext = messages.slice(0, -1);
    const contextString = conversationContext.length > 0 
      ? `Previous conversation:\n${conversationContext.map((m: {role: string, content: string}) => `${m.role}: ${m.content}`).join('\n')}\n\nSystem: ${systemPrompt}\n\nCurrent question: `
      : `${systemPrompt}\n\nQuestion: `;

    console.log('🚀 Attempting to use OpenAI Responses API...');
    console.log('🔧 Tools structure:', JSON.stringify(responsesAPITools, null, 2));
    
    // Check if Responses API is available
    let responseAPIAvailable = false;
    try {
      // Check if responses endpoint exists
      responseAPIAvailable = typeof openai.responses?.create === 'function';
    } catch {
      responseAPIAvailable = false;
    }

    console.log('📡 Responses API available:', responseAPIAvailable);

    if (!responseAPIAvailable) {
      console.log('⚠️ Responses API not available in current SDK, using enhanced Chat Completions with state simulation');
    }

    // Try using the new Responses API if available
    if (responseAPIAvailable) {
      try {
        const responsesAPIParams = {
          model: "gpt-4o",
          input: `${contextString}${userInput}`,
          tools: responsesAPITools,
          temperature: 0.7,
          max_output_tokens: 500, // Responses API uses max_output_tokens instead of max_tokens
          store: true, // Enable state management
        };

        // TODO: Re-enable conversation continuity after tool output handling is stable
        // Currently disabled to avoid conflicts with custom tool execution
        // if (previousResponseId) {
        //   (responsesAPIParams as Record<string, unknown>).previous_response_id = previousResponseId;
        //   console.log(`🔗 Continuing conversation from response: ${previousResponseId}`);
        // }

        console.log('📤 Sending to Responses API:', JSON.stringify(responsesAPIParams, null, 2));
        
        const response = await ((openai as unknown) as {responses: {create: (params: unknown) => Promise<OpenAIResponsesAPIResult>}}).responses.create(responsesAPIParams);

        console.log('✅ Responses API successful');
        console.log('📥 Raw response:', JSON.stringify(response, null, 2));

        // Check if the response contains function calls that need execution
        const toolCalls = response.output?.filter((item: OpenAIResponseOutputItem) => item.type === 'function_call') || [];
        
        if (toolCalls.length > 0) {
          console.log(`🔧 Found ${toolCalls.length} tool calls to execute`);
          
          // Execute the tools on our server
          const toolResults: ToolResult[] = [];
          for (const toolCall of toolCalls) {
            console.log('🔧 Processing tool call:', JSON.stringify(toolCall, null, 2));
            
            let result;
            const functionName = toolCall.name; // Use toolCall.name directly from the response structure
            
            switch (functionName) {
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
              function_call_id: toolCall.call_id || toolCall.id || '', // Try call_id first, fallback to id
              result: result
            });
            
            console.log('🔧 Tool result for', functionName, ':', JSON.stringify(result, null, 2));
          }
          
          // Now send the tool results back to continue the response
          console.log('📤 Sending tool results back to Responses API');
          
          // Continue the response with tool results - needs input parameter
          const continueParams = {
            model: "gpt-4o",
            input: toolResults.map(tr => ({
              type: "function_call_output",
              call_id: tr.function_call_id,
              output: JSON.stringify(tr.result)
            })),
            previous_response_id: response.id,
            temperature: 0.7,
            max_output_tokens: 500,
            store: true
          };
          
          console.log('📤 Continue params:', JSON.stringify(continueParams, null, 2));
          
          // Continue the response by creating a new response with tool outputs
          const finalResponse = await ((openai as unknown) as {responses: {create: (params: unknown) => Promise<OpenAIResponsesAPIResult>}}).responses.create(continueParams);
          
          console.log('📥 Final response with tool results:', JSON.stringify(finalResponse, null, 2));
          
          return NextResponse.json({ 
            message: finalResponse.output_text || finalResponse.text,
            tools_used: toolCalls.map((tc: OpenAIResponseOutputItem) => tc.function?.name).filter(Boolean),
            response_id: finalResponse.id
          });
        }
        
        // No tool calls, return the direct response
        return NextResponse.json({ 
          message: response.output_text || response.text,
          tools_used: [],
          response_id: response.id
        });

      } catch (responsesError) {
        console.warn('⚠️ Responses API failed, falling back to Chat Completions:', responsesError);
      }
    }
    
    // Fallback to Chat Completions API (use same assembled prompt)
    console.log('📞 Using Chat Completions fallback with assembled prompt');
    
    // 🎯 FULL SYSTEM PROMPT DISPLAY (FALLBACK)
    console.log('\n🎯 ==================== FULL ASSEMBLED SYSTEM PROMPT (FALLBACK) ====================');
    console.log(systemPrompt);
    console.log('🎯 ====================================================================\n');
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      tools: tools, // Use original tools without web search for fallback
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0].message;

    if (response.tool_calls && response.tool_calls.length > 0) {
      console.log(`🔧 Processing ${response.tool_calls.length} tool calls (fallback)`);
      
      const toolResults = [];
      
      for (const toolCall of response.tool_calls) {
        let result;
        
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
        tools_used: response.tool_calls.map(tc => tc.function.name),
        fallback_used: true,
        response_id: `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 11)}` // Simulated response ID
      });
    }

    return NextResponse.json({ 
      message: response.content,
      tools_used: [],
      fallback_used: true,
      response_id: `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 11)}` // Simulated response ID
    });

  } catch (error) {
    console.error('❌ Response API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}