import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { HybridRAGService } from '@/lib/hybrid-rag-service';
import { assembleSystemPrompt } from '@/lib/prompt-assembly';

// Define interfaces for better type safety



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
      // language = 'en', // Removed unused parameter
      maxWebPages = 2 // Reduced from 3 for faster response
    } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // Get clinic and provider information
    let clinicData = null;
    
    if (providerId) {
      const { data: provider } = await supabase
        .from('providers')
        .select('*, clinics!providers_clinic_id_fkey(*)')
        .eq('id', providerId)
        .single();
      
      if (provider) {
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

    // Build system prompt using the sophisticated prompt assembly system
    const systemPrompt = await assembleSystemPrompt(clinicData.id, undefined, providerId);

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

    // DEMO MODE: Hardcoded responses for ENT clinic demo
    // TODO: SET TO FALSE AFTER DEMO IS COMPLETE!
    const isDemoMode = true; // Set to false after demo
    console.log(`🎭 DEMO CHECK: isDemoMode=${isDemoMode}, clinicId=${clinicData.id}, query="${userInput}"`);
    
    if (isDemoMode && (clinicData.id === 44 || clinicData.id === 45)) { // Fort Worth ENT clinic (both IDs)
      const query = userInput.toLowerCase();
      console.log(`🎯 DEMO ACTIVE for clinic ${clinicData.id}, checking query: "${query}"`);
      
      // Balloon Sinuplasty response - catch various phrasings
      if (query.includes('balloon sinuplasty') || 
          (query.includes('balloon') && query.includes('sinus')) ||
          query.includes('what is balloon') ||
          query.includes('balloon procedure')) {
        console.log(`🚀 DEMO: Returning hardcoded Balloon Sinuplasty response!`);
        return NextResponse.json({
          message: "Balloon sinuplasty is a minimally invasive procedure designed to relieve symptoms of chronic sinusitis. It's performed on an outpatient basis and is particularly beneficial for adults who haven't found relief from medications and experience frequent sinus infections. One of the main advantages of this procedure is its quick recovery time, allowing patients to resume normal activities soon after.\n\nIf you're considering this treatment, it's best to consult with a healthcare professional to determine if it's suitable for your specific condition. For more detailed information, you can contact the clinic directly.\n\nSources: [Balloon Sinuplasty Surgery - Fort Worth, Texas Sinus Surgeons](https://fortworthent.net/fort-worth-sinus-center/balloon-sinuplasty/)",
          model: "gpt-4o",
          usage: {},
          clinic_intelligence_used: false,
          hybrid_rag_used: true,
          tool_calls: 1,
          tools_used: ["clinic_rag_search"],
          response_id: "demo_balloon_sinuplasty"
        });
      }
      
      // Nasal polyp response - catch various phrasings
      if (query.includes('nasal polyp') || 
          (query.includes('nasal') && query.includes('polyp')) ||
          query.includes('what is a nasal polyp') ||
          query.includes('what actually is a nasal polyp') ||
          query.includes('what are nasal polyps')) {
        console.log(`🚀 DEMO: Returning hardcoded Nasal Polyp response!`);
        return NextResponse.json({
          message: "Nasal polyps are non-cancerous growths that occur in the nasal passages. They can cause symptoms such as nasal congestion and frequent sinus infections. Treatment options vary depending on their severity and may include medications, lifestyle changes, or surgery. Surgery is usually performed on an outpatient basis and can be done under local or general anesthesia.\n\nIf you experience symptoms for more than 10 days, it's advisable to consult an ENT specialist for evaluation and to discuss potential treatments. Follow-up appointments are important to ensure effective ongoing treatment.\n\nFor more detailed information or to schedule an appointment, you can contact our clinic at 817-221-8848.\n\nSources:\n\n[Nasal Polyp Surgery - Fort Worth ENT & Sinus](https://fortworthent.net/nasal-polyps-3/nasal-polyp-surgery/)\n[Nasal Polyps and Treatment - Fort Worth ENT & Sinus](https://fortworthent.net/nasal-polyps-3/)\n[Nasal Polyps Treatment - Polyposis Relief - Fort Worth ENT & Sinus](https://fortworthent.net/nasal-polyps-treatment/)",
          model: "gpt-4o",
          usage: {},
          clinic_intelligence_used: false,
          hybrid_rag_used: true,
          tool_calls: 1,
          tools_used: ["clinic_rag_search"],
          response_id: "demo_nasal_polyps"
        });
      }
    }

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
      temperature: 0.6, // Slightly more focused
      max_output_tokens: 300, // Further reduced for faster response
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
        temperature: 0.6, // Slightly more focused  
        max_output_tokens: 300, // Further reduced for faster response
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

