import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { HybridRAGService } from '@/lib/hybrid-rag-service';

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

export async function POST(request: NextRequest) {
  try {
    const { 
      messages, 
      clinicId,
      providerId,
      language = 'en',
      useHybridRAG = true,
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
        .select('*, clinics(*)')
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
      {
        type: "function" as const,
        function: {
          name: "clinic_rag_search",
          description: "Search the clinic's knowledge base and website for specific information to answer patient questions",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The specific question or information to search for"
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

    // Create the Responses API request
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      tools: useHybridRAG ? tools : undefined,
      tool_choice: useHybridRAG ? "auto" : undefined,
      temperature: 0.7,
      max_tokens: 600,
    });

    const assistantMessage = response.choices[0].message;

    // Handle tool calls
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.function.name === "clinic_rag_search") {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            
            console.log(`🔍 RAG search requested: "${args.query}"`);
            
            // Perform hybrid RAG search
            const ragResult = await ragService.query({
              query: args.query,
              clinicId: clinicData.id,
              maxWebPages,
              forceWebSearch: args.force_web_search
            });

            // Format RAG result for the assistant
            const ragResponse = {
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

            toolResults.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify(ragResponse)
            });

          } catch (error) {
            console.error('❌ RAG search failed:', error);
            toolResults.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify({
                error: "Failed to search clinic information",
                fallback: "Please contact the clinic directly for this information"
              })
            });
          }
        }
      }

      // Continue conversation with tool results
      const followUpResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
          {
            role: "assistant",
            content: assistantMessage.content,
            tool_calls: assistantMessage.tool_calls
          },
          ...toolResults.map(result => ({
            role: "tool" as const,
            tool_call_id: result.tool_call_id,
            content: result.output
          }))
        ],
        temperature: 0.7,
        max_tokens: 600,
      });

      return NextResponse.json({
        message: followUpResponse.choices[0].message.content,
        model: "gpt-4o",
        usage: {
          ...response.usage,
          total_tokens: (response.usage?.total_tokens || 0) + (followUpResponse.usage?.total_tokens || 0)
        },
        hybrid_rag_used: true,
        tool_calls: assistantMessage.tool_calls.length
      });

    } else {
      // No tool calls - return the direct response
      return NextResponse.json({
        message: assistantMessage.content,
        model: "gpt-4o",
        usage: response.usage,
        hybrid_rag_used: false,
        tool_calls: 0
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
  clinic: any,
  provider: any,
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
  } catch (error) {
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
- Always search for specific information using clinic_rag_search when patients ask about:
  * Office hours and scheduling
  * Location and parking information
  * Specific medical services
  * Insurance information
  * Required forms
  * Preparation instructions
  * Contact information
- If you don't have sufficient information after searching, recommend contacting the clinic directly
- Maintain a professional but friendly tone
- Focus on being helpful and informative

Remember: This is for educational and informational purposes only. Patients should consult directly with ${providerName} for specific medical advice.`;
  }
}

/**
 * Build clinic context from existing data
 */
function buildClinicContext(clinicData: any): string {
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
    if (services.medical_services?.length > 0) {
      context += `\nMedical Services: ${services.medical_services.join(', ')}\n`;
    }
    if (services.conditions_treated?.length > 0) {
      context += `Conditions Treated: ${services.conditions_treated.join(', ')}\n`;
    }
  }
  
  if (clinicData.insurance_info?.accepted_plans?.length > 0) {
    context += `\nInsurance Accepted: ${clinicData.insurance_info.accepted_plans.join(', ')}\n`;
  }
  
  context += '\nNote: Use clinic_rag_search to get the most current information when patients ask specific questions.\n';
  
  return context;
}