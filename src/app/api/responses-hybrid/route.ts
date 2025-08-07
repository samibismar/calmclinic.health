import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { HybridRAGService } from '@/lib/hybrid-rag-service';

// Define interfaces for better type safety
interface ClinicData {
  id: number;
  clinic_name: string;
  website_url?: string;
  [key: string]: unknown;
}

interface ProviderData {
  id: number;
  name: string;
  title?: string;
  specialties?: string[];
  clinics?: ClinicData;
  [key: string]: unknown;
}

interface ClinicContextData {
  contact_info?: {
    phone_numbers?: { main?: string };
    address?: { full_address?: string };
    website?: string;
  };
  hours_info?: {
    regular_hours?: Record<string, string>;
  };
  services_info?: {
    medical_services?: string[];
    conditions_treated?: string[];
  };
  insurance_info?: {
    accepted_plans?: string[];
  };
  [key: string]: unknown;
}

interface OpenAIResponseOutputItem {
  type: string;
  name?: string;
  call_id?: string;
  id?: string;
  arguments?: string;
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
  usage?: unknown;
  [key: string]: unknown;
}

// Initialize OpenAI client with latest SDK
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Hybrid RAG service
const ragService = new HybridRAGService();

// Clinic Intelligence Tools (for structured data)
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

export async function POST(request: NextRequest) {
  try {
    const { 
      messages, 
      clinicId,
      providerId,
      language = 'en',
      maxWebPages = 3
    } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // Get clinic and provider information
    let clinicData = null;
    let providerData = null;
    
    if (providerId) {
      const { data: provider } = await supabase
        .from('providers')
        .select('*, clinics!providers_clinic_id_fkey(*)')
        .eq('id', providerId)
        .single();
      
      if (provider) {
        providerData = provider;
        clinicData = provider.clinics;
      }
    } else if (clinicId) {
      const { data: clinic } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();
      
      clinicData = clinic;
    }

    if (!clinicData) {
      return NextResponse.json(
        { error: 'Clinic not found' },
        { status: 404 }
      );
    }

    // Get the user's last message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Last message must be from user' },
        { status: 400 }
      );
    }

    // Build system prompt
    const systemPrompt = await buildSystemPrompt(clinicData, providerData, language);

    // Prepare tools for Responses API
    const tools = [
      // Clinic Intelligence Tools (for structured data - PREFERRED for common questions)
      {
        type: "function" as const,
        function: {
          name: "get_clinic_services",
          description: "Get the complete list of services offered by the clinic - USE THIS for questions about 'services', 'treatments offered', 'what do you do', etc.",
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
          description: "Get clinic operating hours and scheduling information",
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
      // Hybrid RAG Tool (for medical procedures and specific treatments)
      {
        type: "function" as const,
        function: {
          name: "clinic_rag_search",
          description: "REQUIRED for questions about specific medical procedures, treatments, or conditions (balloon sinuplasty, sleep apnea, hearing aids, etc.). Searches clinic website for detailed procedure information, preparation instructions, and clinic-specific approach.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The specific medical procedure or treatment question to search for"
              },
              force_web_search: {
                type: "boolean",
                description: "Force a fresh web search even if cached content exists",
                default: false
              }
            },
            required: ["query"]
          }
        }
      }
    ];

    // Get the last user message for the Responses API
    const lastUserMessage = messages[messages.length - 1];
    const userInput = lastUserMessage?.content || "";

    // Get conversation history for context (excluding the last message since it goes in input)
    const conversationContext = messages.slice(0, -1);
    const contextString = conversationContext.length > 0 
      ? `Previous conversation:\n${conversationContext.map((m: {role: string, content: string}) => `${m.role}: ${m.content}`).join('\n')}\n\nSystem: ${systemPrompt}\n\nCurrent question: `
      : `${systemPrompt}\n\nQuestion: `;

    // Prepare tools for Responses API
    const responsesAPITools = [
      // Convert clinic intelligence tools
      ...tools.filter(tool => tool.function.name !== 'clinic_rag_search').map(tool => ({
        type: "function" as const,
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters
      })),
      // Convert hybrid RAG tool
      {
        type: "function" as const,
        name: "clinic_rag_search",
        description: tools.find(t => t.function.name === 'clinic_rag_search')?.function.description || "",
        parameters: tools.find(t => t.function.name === 'clinic_rag_search')?.function.parameters || {}
      }
    ];

    // Use the actual Responses API
    const response = await ((openai as unknown) as {responses: {create: (params: unknown) => Promise<OpenAIResponsesAPIResult>}}).responses.create({
      model: "gpt-4o",
      input: `${contextString}${userInput}`,
      tools: responsesAPITools,
      temperature: 0.7,
      max_output_tokens: 600,
      store: true,
    });

    // Check if the response contains function calls that need execution
    const toolCalls = (response as OpenAIResponsesAPIResult).output?.filter((item: OpenAIResponseOutputItem) => item.type === 'function_call') || [];

    if (toolCalls.length > 0) {
      console.log(`🔧 Found ${toolCalls.length} tool calls to execute`);
      
      // Execute the tools on our server
      const toolResults: ToolResult[] = [];
      for (const toolCall of toolCalls) {
        console.log('🔧 Processing tool call:', JSON.stringify(toolCall, null, 2));
        
        let result;
        const functionName = toolCall.name; // Use toolCall.name for Responses API format
        
        console.log(`🔧 Tool called: ${functionName}`);
        
        try {
          // Handle clinic intelligence tools
          if (functionName === 'get_clinic_services') {
            result = await getClinicServices(clinicData.id);
            console.log(`📋 Services found: ${result.length} services`);
          } else if (functionName === 'get_clinic_hours') {
            result = await getClinicHours(clinicData.id);
            console.log(`🕐 Hours found: ${result.length} entries`);
          } else if (functionName === 'get_insurance_info') {
            result = await getInsuranceInfo(clinicData.id);
            console.log(`🏥 Insurance plans: ${result.length} plans`);
          } else if (functionName === 'get_contact_info') {
            result = await getContactInfo(clinicData.id);
            console.log(`📞 Contact info: ${result.length} entries`);
          } 
          // Handle hybrid RAG search
          else if (functionName === "clinic_rag_search") {
            const args = toolCall.arguments ? JSON.parse(toolCall.arguments) : {};
            
            console.log(`🔍 RAG search requested: "${args.query}"`);
            
            // Perform hybrid RAG search
            const ragResult = await ragService.query({
              query: args.query,
              clinicId: clinicData.id,
              maxWebPages,
              forceWebSearch: args.force_web_search
            });

            // Format RAG result for the assistant
            result = {
              answer: ragResult.answer,
              confidence: ragResult.confidence,
              sources: ragResult.sources.map(s => ({
                title: s.title,
                url: s.url,
                summary: s.summary.substring(0, 200) + (s.summary.length > 200 ? '...' : ''),
                type: s.type
              })),
              usedWebSearch: ragResult.usedWebSearch,
              cacheHit: ragResult.cacheHit
            };
          } else {
            result = { error: 'Unknown tool' };
          }
          
          toolResults.push({
            function_call_id: toolCall.call_id || toolCall.id || '',
            result: result
          });
          
          console.log('🔧 Tool result for', functionName, ':', JSON.stringify(result, null, 2));
        } catch (error) {
          console.error(`❌ Tool ${functionName} failed:`, error);
          toolResults.push({
            function_call_id: toolCall.call_id || toolCall.id || '',
            result: {
              error: "Failed to get information",
              fallback: "Please contact the clinic directly for this information"
            }
          });
        }
      }

      // Now send the tool results back to continue the response using Responses API
      console.log('📤 Sending tool results back to Responses API');
      
      // Continue the response with tool results
      const continueParams = {
        model: "gpt-4o",
        input: toolResults.map(tr => ({
          type: "function_call_output",
          call_id: tr.function_call_id,
          output: JSON.stringify(tr.result)
        })),
        previous_response_id: (response as OpenAIResponsesAPIResult).id,
        temperature: 0.7,
        max_output_tokens: 600,
        store: true
      };
      
      console.log('📤 Continue params:', JSON.stringify(continueParams, null, 2));
      
      // Continue the response by creating a new response with tool outputs
      const followUpResponse = await ((openai as unknown) as {responses: {create: (params: unknown) => Promise<OpenAIResponsesAPIResult>}}).responses.create(continueParams);
      
      console.log('📥 Final response with tool results:', JSON.stringify(followUpResponse, null, 2));

      // Determine which type of tools were used
      const toolsUsed = toolCalls.map((tc: OpenAIResponseOutputItem) => tc.name).filter((name): name is string => Boolean(name));
      const usedClinicIntelligence = toolsUsed.some((tool: string) => 
        ['get_clinic_services', 'get_clinic_hours', 'get_insurance_info', 'get_contact_info'].includes(tool)
      );
      const usedHybridRAG = toolsUsed.includes('clinic_rag_search');

      return NextResponse.json({
        message: followUpResponse.output_text || followUpResponse.text,
        model: "gpt-4o",
        usage: followUpResponse.usage || {},
        clinic_intelligence_used: usedClinicIntelligence,
        hybrid_rag_used: usedHybridRAG,
        tool_calls: toolCalls.length,
        tools_used: toolsUsed,
        response_id: followUpResponse.id
      });

    } else {
      // No tool calls - return the direct response
      return NextResponse.json({
        message: (response as OpenAIResponsesAPIResult).output_text || (response as OpenAIResponsesAPIResult).text,
        model: "gpt-4o",
        usage: (response as OpenAIResponsesAPIResult).usage || {},
        clinic_intelligence_used: false,
        hybrid_rag_used: false,
        tool_calls: 0,
        response_id: (response as OpenAIResponsesAPIResult).id
      });
    }

  } catch (error) {
    console.error('❌ Responses API error:', error);
    
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { 
          error: 'OpenAI API error',
          details: error.message,
          type: error.type
        },
        { status: error.status || 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

/**
 * Build comprehensive system prompt
 */
async function buildSystemPrompt(
  clinic: ClinicData,
  provider: ProviderData | null,
  language: string
): Promise<string> {
  const clinicName = clinic.clinic_name || 'the clinic';
  const providerName = provider ? provider.name : 'your healthcare provider';
  const providerTitle = provider ? provider.title || 'Doctor' : 'Doctor';
  const specialties = provider ? (provider.specialties || []).join(', ') : 'General Practice';

  // Get existing clinic data if available
  let clinicContext = '';
  try {
    const { data: existingData } = await supabase
      .from('clinic_data')
      .select('*')
      .eq('clinic_id', clinic.id)
      .single();

    if (existingData) {
      clinicContext = buildClinicContext(existingData);
    }
  } catch {
    console.log('No existing clinic data found, using basic info');
  }

  if (language === 'es') {
    return `Eres un asistente médico inteligente para ${clinicName}. ${provider ? `Trabajas con ${providerName} (${providerTitle}) quien se especializa en ${specialties}.` : ''}

Tu rol es:
- Ayudar a los pacientes a prepararse para sus citas
- Responder preguntas sobre la clínica usando información actualizada
- Proporcionar información precisa sobre servicios, horarios, ubicación, seguros, y procedimientos
- Usar la función clinic_rag_search cuando necesites información específica sobre la clínica
- Brindar respuestas útiles, cálidas y profesionales

${clinicContext}

INSTRUCCIONES IMPORTANTES:
- Siempre busca información específica usando clinic_rag_search cuando los pacientes pregunten sobre:
  * Horarios de atención
  * Ubicación y estacionamiento  
  * Servicios médicos específicos
  * Información de seguros
  * Formularios requeridos
  * Instrucciones de preparación
  * Información de contacto
- Si no tienes información suficiente después de buscar, recomienda contactar la clínica directamente
- Mantén un tono profesional pero amigable
- Responde SIEMPRE en español

Recuerda: Esto es solo para fines educativos e informativos. Los pacientes deben consultar directamente con ${providerName} para consejos médicos específicos.`;
  } else {
    return `You are an intelligent medical assistant for ${clinicName}. ${provider ? `You work with ${providerName} (${providerTitle}) who specializes in ${specialties}.` : ''}

Your role is to:
- Help patients prepare for their appointments
- Answer questions about the clinic using up-to-date information
- Provide accurate information about services, hours, location, insurance, and procedures
- Use the clinic_rag_search function when you need specific information about the clinic
- Provide helpful, warm, and professional responses

${clinicContext}

IMPORTANT INSTRUCTIONS:
- Use tools to get clinic-specific information, then BLEND that with your medical knowledge for comprehensive answers:
  * For "services", "treatments", "what do you do" → use get_clinic_services
  * For "hours", "schedule", "when open" → use get_clinic_hours  
  * For "insurance", "coverage", "accepted plans" → use get_insurance_info
  * For "contact", "phone", "address", "location" → use get_contact_info
  * For medical procedures → use clinic_rag_search to get clinic-specific info, then combine with your medical knowledge

APPROACH FOR MEDICAL QUESTIONS:
1. Use clinic_rag_search to get the clinic's specific information and approach
2. Combine that clinic-specific content with your comprehensive medical knowledge
3. Provide a detailed, educational answer that includes both general medical info AND clinic-specific details
4. Include source citations for clinic-specific information: "According to [clinic source]..."

EXAMPLES:
- "What is balloon sinuplasty?" → Search clinic info + your medical knowledge = comprehensive explanation with clinic's specific approach
- "What services do you offer?" → MUST use get_clinic_services only

- Always provide thorough, educational medical information
- Include clinic sources when you use clinic_rag_search information
- Always mention consulting with the doctor for personalized advice
- Maintain a professional but friendly tone

Remember: This is for educational and informational purposes only. Patients should consult directly with ${providerName} for specific medical advice.`;
  }
}

/**
 * Build clinic context from existing data
 */
function buildClinicContext(clinicData: ClinicContextData): string {
  let context = '\n--- CURRENT CLINIC INFORMATION ---\n';
  
  if (clinicData.contact_info) {
    const contact = clinicData.contact_info;
    if (contact.phone_numbers?.main) {
      context += `Main Phone: ${contact.phone_numbers.main}\n`;
    }
    if (contact.address?.full_address) {
      context += `Address: ${contact.address.full_address}\n`;
    }
    if (contact.website) {
      context += `Website: ${contact.website}\n`;
    }
  }
  
  if (clinicData.hours_info?.regular_hours) {
    context += '\nOffice Hours:\n';
    Object.entries(clinicData.hours_info.regular_hours).forEach(([day, hours]) => {
      context += `${day}: ${hours}\n`;
    });
  }
  
  if (clinicData.services_info) {
    const services = clinicData.services_info;
    if (services.medical_services && services.medical_services.length > 0) {
      context += `\nMedical Services: ${services.medical_services.join(', ')}\n`;
    }
    if (services.conditions_treated && services.conditions_treated.length > 0) {
      context += `Conditions Treated: ${services.conditions_treated.join(', ')}\n`;
    }
  }
  
  if (clinicData.insurance_info?.accepted_plans && clinicData.insurance_info.accepted_plans.length > 0) {
    context += `\nInsurance Accepted: ${clinicData.insurance_info.accepted_plans.join(', ')}\n`;
  }
  
  context += '\nNote: Use clinic_rag_search to get the most current information when patients ask specific questions.\n';
  
  return context;
}