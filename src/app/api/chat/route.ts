import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from "@supabase/supabase-js";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to resolve provider name from database
async function resolveProviderName(providerId: number | null, clinicId: number | null, doctorName: string | null): Promise<string> {
  // If we have a provider ID, fetch the provider name
  if (providerId) {
    try {
      const { data: provider, error } = await supabase
        .from('providers')
        .select('name')
        .eq('id', providerId)
        .eq('is_active', true)
        .single();

      if (!error && provider?.name) {
        return provider.name;
      }
    } catch (error) {
      console.error('Error fetching provider by ID:', error);
    }
  }

  // If we have doctorName from the request, use it
  if (doctorName) {
    return doctorName;
  }

  // If we have a clinic ID, try to find a default provider or first active provider
  if (clinicId) {
    try {
      // Try to get the default provider first
      const { data: providerData, error } = await supabase
        .from('providers')
        .select('name')
        .eq('clinic_id', clinicId)
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      let provider = providerData;
      if (error || !provider) {
        // If no default provider, get the first active provider
        const { data: providers, error: providersError } = await supabase
          .from('providers')
          .select('name')
          .eq('clinic_id', clinicId)
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .limit(1);

        if (!providersError && providers && providers.length > 0) {
          provider = providers[0];
        }
      }

      if (provider?.name) {
        return provider.name;
      }
    } catch (error) {
      console.error('Error fetching fallback provider:', error);
    }
  }

  // Final fallback - use generic "Doctor" instead of "Dr. Assistant"
  return 'Doctor';
}

// Function to generate comprehensive system prompt
async function generateComprehensivePrompt({
  language,
  nameIntro,
  providerName,
  providerTitle,
  providerSpecialties,
  clinicData,
  aiInstructions
}: {
  language: string;
  nameIntro: string;
  providerName: string;
  providerTitle: string;
  providerSpecialties: string;
  clinicData: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  aiInstructions?: string;
}) {
  // Extract clinic information
  const contactInfo = clinicData?.contact_info || {};
  const hoursInfo = clinicData?.hours_info || {};
  const servicesInfo = clinicData?.services_info || {};
  const insuranceInfo = clinicData?.insurance_info || {};
  const patientExperience = clinicData?.patient_experience || {};

  // Build clinic context sections
  const clinicSections = {
    contact: buildContactSection(contactInfo),
    hours: buildHoursSection(hoursInfo),
    services: buildServicesSection(servicesInfo, providerSpecialties),
    insurance: buildInsuranceSection(insuranceInfo),
    experience: buildPatientExperienceSection(patientExperience)
  };

  if (language === 'es') {
    return `Eres un asistente médico amigable para ${providerName} (${providerTitle}) que se especializa en ${providerSpecialties}. 
${nameIntro}Salúdalos por su nombre si lo conoces. Por ejemplo: "Hola Sarah, estoy aquí para ayudarte mientras esperas."
El paciente ya está en la sala de espera y verá a ${providerName} en breve.

Tu rol es:
- Responder preguntas generales de salud para ayudarles a prepararse para su cita
- Explicar síntomas y condiciones comunes en términos simples
- Ayudarles a pensar en preguntas que quieran hacerle a ${providerName}
- Brindar comodidad y tranquilidad mientras esperan
- Dar consejos generales de bienestar y educación sobre salud
- Enfocarte en temas relacionados con ${providerSpecialties} cuando sea relevante

${clinicSections.contact}
${clinicSections.hours}
${clinicSections.services}
${clinicSections.insurance}
${clinicSections.experience}

Mantén las respuestas útiles, cálidas y educativas. Como están por ver al doctor,
no necesitas decirles repetidamente que hagan una cita. En cambio, puedes decir
cosas como "Esa es una excelente pregunta para discutir con ${providerName} durante su visita de hoy"
cuando sea apropiado.

${aiInstructions ? `\nConocimiento especializado adicional:\n${aiInstructions}` : ''}

IMPORTANTE: Responde SIEMPRE en español.
Recuerda: Esto es solo para fines educativos.`;
  } else {
    return `You are a friendly medical assistant for ${providerName} (${providerTitle}) who specializes in ${providerSpecialties}. 
${nameIntro}Greet them by name if you know it. For example: "Hi Sarah! I'm here to help while you wait."
The patient is already in the waiting room and will see ${providerName} shortly.

Your role is to:
- Answer general health questions to help them prepare for their appointment
- Explain common symptoms and conditions in simple terms
- Help them think about questions they might want to ask ${providerName}
- Provide comfort and reassurance while they wait
- Give general wellness tips and health education
- Focus on topics related to ${providerSpecialties} when relevant

${clinicSections.contact}
${clinicSections.hours}
${clinicSections.services}
${clinicSections.insurance}
${clinicSections.experience}

Keep responses helpful, warm, and educational. Since they're about to see the doctor,
you don't need to repeatedly tell them to make an appointment. Instead, you might say
things like "That's a great question to discuss with ${providerName} during your visit today"
when appropriate.

${aiInstructions ? `\nAdditional specialized knowledge:\n${aiInstructions}` : ''}

`;
  }
}

// Helper functions to build clinic information sections
function buildContactSection(contactInfo: any): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!contactInfo || Object.keys(contactInfo).length === 0) return '';
  
  let section = '\n--- CLINIC CONTACT INFORMATION ---\n';
  
  if (contactInfo.phone_numbers) {
    const phones = contactInfo.phone_numbers;
    if (phones.main) section += `Main phone: ${phones.main}\n`;
    if (phones.optical_shop) section += `Optical shop: ${phones.optical_shop}\n`;
    if (phones.fax) section += `Fax: ${phones.fax}\n`;
  }
  
  if (contactInfo.address?.full_address) {
    section += `Address: ${contactInfo.address.full_address}\n`;
  }
  
  if (contactInfo.website) {
    section += `Website: ${contactInfo.website}\n`;
  }
  
  return section;
}

function buildHoursSection(hoursInfo: any): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!hoursInfo || Object.keys(hoursInfo).length === 0) return '';
  
  let section = '\n--- CLINIC HOURS & SCHEDULING ---\n';
  
  if (hoursInfo.regular_hours && Object.keys(hoursInfo.regular_hours).length > 0) {
    section += 'Regular hours:\n';
    Object.entries(hoursInfo.regular_hours).forEach(([day, hours]) => {
      section += `${day}: ${hours}\n`;
    });
  }
  
  if (hoursInfo.appointment_policies) {
    const policies = hoursInfo.appointment_policies;
    if (policies.scheduling_method) section += `Scheduling: ${policies.scheduling_method}\n`;
    if (policies.cancellation_policy) section += `Cancellation policy: ${policies.cancellation_policy}\n`;
    if (policies.missed_appointment_fee) section += `Missed appointment fee: ${policies.missed_appointment_fee}\n`;
  }
  
  return section;
}

function buildServicesSection(servicesInfo: any, specialties: string): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!servicesInfo || Object.keys(servicesInfo).length === 0) return '';
  
  let section = '\n--- SERVICES & SPECIALTIES ---\n';
  section += `Provider specializes in: ${specialties}\n`;
  
  const serviceTypes = [
    { key: 'medical_services', label: 'Medical Services' },
    { key: 'surgical_services', label: 'Surgical Services' },
    { key: 'diagnostic_services', label: 'Diagnostic Services' },
    { key: 'optical_services', label: 'Optical Services' },
    { key: 'specialty_programs', label: 'Specialty Programs' },
    { key: 'conditions_treated', label: 'Conditions Treated' }
  ];
  
  serviceTypes.forEach(({ key, label }) => {
    if (servicesInfo[key] && servicesInfo[key].length > 0) {
      section += `${label}: ${servicesInfo[key].join(', ')}\n`;
    }
  });
  
  return section;
}

function buildInsuranceSection(insuranceInfo: any): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!insuranceInfo || Object.keys(insuranceInfo).length === 0) return '';
  
  let section = '\n--- INSURANCE & PAYMENT ---\n';
  
  if (insuranceInfo.accepted_plans && insuranceInfo.accepted_plans.length > 0) {
    section += `Accepted insurance: ${insuranceInfo.accepted_plans.join(', ')}\n`;
  }
  
  if (insuranceInfo.payment_policies) {
    const policies = insuranceInfo.payment_policies;
    if (policies.deductibles_due_at_service) section += 'Deductibles due at time of service\n';
    if (policies.copays_due_at_service) section += 'Co-pays due at time of service\n';
    if (policies.refraction_fee) section += `Refraction fee: ${policies.refraction_fee}\n`;
    if (policies.missed_appointment_fee) section += `Missed appointment fee: ${policies.missed_appointment_fee}\n`;
  }
  
  if (insuranceInfo.special_notes && insuranceInfo.special_notes.length > 0) {
    section += `Important notes: ${insuranceInfo.special_notes.join('; ')}\n`;
  }
  
  return section;
}

function buildPatientExperienceSection(patientExperience: any): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!patientExperience || Object.keys(patientExperience).length === 0) return '';
  
  let section = '\n--- PATIENT EXPERIENCE ---\n';
  
  if (patientExperience.what_to_bring && patientExperience.what_to_bring.length > 0) {
    section += `What to bring: ${patientExperience.what_to_bring.join(', ')}\n`;
  }
  
  if (patientExperience.facility_policies && patientExperience.facility_policies.length > 0) {
    section += `Facility policies: ${patientExperience.facility_policies.join('; ')}\n`;
  }
  
  if (patientExperience.communication_preferences && patientExperience.communication_preferences.length > 0) {
    section += `Communication notes: ${patientExperience.communication_preferences.join('; ')}\n`;
  }
  
  return section;
}

// Function to enhance system prompt with personality settings
function enhanceSystemPromptWithPersonality(
  basePrompt: string, 
  clinic: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  language: string
): string {
  let enhancedPrompt = basePrompt;
  
  // Add tone guidance
  if (clinic.tone) {
    const toneGuidance = {
      'professional': 'Maintain a professional, respectful, and clinical tone in all interactions.',
      'friendly': 'Use a warm, approachable, and personable tone that puts patients at ease.',
      'calm': 'Keep a soothing, reassuring, and peaceful tone that reduces patient anxiety.',
      'empathetic': 'Show understanding, compassion, and emotional support in your responses.',
      'efficient': 'Be direct, concise, and to-the-point while remaining helpful.'
    };
    
    const guidance = toneGuidance[clinic.tone as keyof typeof toneGuidance];
    if (guidance) {
      enhancedPrompt += `\n\n--- TONE & COMMUNICATION STYLE ---\n${guidance}`;
    }
  }
  
  // Add supported languages
  if (clinic.languages && clinic.languages.length > 0) {
    enhancedPrompt += `\n\n--- LANGUAGE SUPPORT ---\nYou can communicate in: ${clinic.languages.join(', ')}`;
    
    // Add specific language instructions
    if (language === 'es' && clinic.languages.includes('Spanish')) {
      enhancedPrompt += '\nIMPORTANT: Always respond in Spanish for this conversation.';
    } else if (language === 'es') {
      enhancedPrompt += '\nIMPORTANT: Always respond in Spanish.';
    }
  }
  
  // Add always include guidance
  if (clinic.ai_always_include && clinic.ai_always_include.length > 0) {
    enhancedPrompt += '\n\n--- ALWAYS INCLUDE ---\n';
    enhancedPrompt += 'Make sure to consistently include these elements in your responses:\n';
    clinic.ai_always_include.forEach((item: string) => {
      enhancedPrompt += `• ${item}\n`;
    });
  }
  
  // Add never include guidance
  if (clinic.ai_never_include && clinic.ai_never_include.length > 0) {
    enhancedPrompt += '\n\n--- NEVER INCLUDE ---\n';
    enhancedPrompt += 'Never mention or include these things in your responses:\n';
    clinic.ai_never_include.forEach((item: string) => {
      enhancedPrompt += `• ${item}\n`;
    });
  }
  
  // Add fallback response guidance
  if (clinic.fallback_uncertain || clinic.fallback_after_hours || clinic.fallback_emergency) {
    enhancedPrompt += '\n\n--- FALLBACK RESPONSES ---\n';
    enhancedPrompt += 'When you encounter these situations, use these specific responses:\n';
    
    if (clinic.fallback_uncertain) {
      enhancedPrompt += `\nWhen uncertain or lacking information: "${clinic.fallback_uncertain}"`;
    }
    
    if (clinic.fallback_after_hours) {
      enhancedPrompt += `\nFor after-hours inquiries: "${clinic.fallback_after_hours}"`;
    }
    
    if (clinic.fallback_emergency) {
      enhancedPrompt += `\nFor emergency situations: "${clinic.fallback_emergency}"`;
    }
  }
  
  return enhancedPrompt;
}

// Function to detect if user message requires fallback response
function shouldUseFallbackResponse(userMessage: string, clinic: any): string | null { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!clinic) return null;
  
  const message = userMessage.toLowerCase();
  
  // Emergency detection keywords
  const emergencyKeywords = [
    'emergency', 'urgent', 'help', 'chest pain', 'heart attack', 'stroke',
    'bleeding', 'unconscious', 'choking', 'poison', '911', 'ambulance',
    'can\'t breathe', 'severe pain', 'accident', 'injured'
  ];
  
  // After hours detection (this would need to be enhanced with actual clinic hours)
  const afterHoursKeywords = [
    'closed', 'after hours', 'weekend', 'holiday', 'late night', 'early morning'
  ];
  
  // Emergency detection
  if (emergencyKeywords.some(keyword => message.includes(keyword))) {
    return clinic.fallback_emergency;
  }
  
  // After hours detection (simplified - in practice, you'd check actual time vs clinic hours)
  if (afterHoursKeywords.some(keyword => message.includes(keyword))) {
    return clinic.fallback_after_hours;
  }
  
  return null;
}

export async function POST(request: Request) {
  try {
    const { 
      messages, 
      doctorName, 
      specialty, 
      language = 'en', 
      aiInstructions, 
      patientName,
      providerId,
      providerSpecialties,
      providerTitle
    } = await request.json();

    // Fetch the current system prompt from AI configuration
    let systemPrompt = null;
    let clinicData = null;
    let clinicConfig = null;
    let clinicId = null;
    
    if (providerId) {
      try {
        // Get the clinic from the provider
        const { data: provider } = await supabase
          .from('providers')
          .select('clinic_id')
          .eq('id', providerId)
          .single();

        if (provider) {
          clinicId = provider.clinic_id;
          // First try to get the current system prompt from AI configuration
          const { data: currentPrompt } = await supabase
            .from('ai_prompt_history')
            .select('prompt_text')
            .eq('clinic_id', clinicId)
            .eq('is_current', true)
            .single();

          // Also fetch AI configuration settings (tone, languages, fallback responses, personality settings)
          const { data: clinic } = await supabase
            .from('clinics')
            .select('id, tone, languages, fallback_uncertain, fallback_after_hours, fallback_emergency, ai_always_include, ai_never_include')
            .eq('id', clinicId)
            .single();

          // Store clinic config for later use
          clinicConfig = clinic;

          if (currentPrompt && currentPrompt.prompt_text) {
            // Use the generated system prompt from AI configuration
            systemPrompt = currentPrompt.prompt_text;
            
            // Enhance with personality settings
            if (clinic) {
              systemPrompt = enhanceSystemPromptWithPersonality(systemPrompt, clinic, language);
            }
            
            console.log('✅ Using AI-generated system prompt with personality settings for clinic:', provider.clinic_id);
          } else {
            console.log('⚠️ No current AI-generated prompt found, falling back to legacy system');
            // Fallback to legacy system for backward compatibility
            const { data } = await supabase
              .from('clinic_data')
              .select('*')
              .eq('clinic_id', clinicId)
              .single();
            
            clinicData = data;
          }
        }
      } catch (error) {
        console.log('Error fetching AI-generated prompt, using fallback:', error);
      }
    }

    // If no AI-generated prompt found, use legacy system
    if (!systemPrompt) {
      const nameIntro = patientName ? `The patient's name is ${patientName}. ` : '';
      const providerName = await resolveProviderName(providerId, clinicId, doctorName);
      const providerSpecialtiesText = providerSpecialties && providerSpecialties.length > 0 
        ? providerSpecialties.join(', ') 
        : specialty || 'General Practice';

      // Generate comprehensive system prompt (legacy)
      const basePrompt = await generateComprehensivePrompt({
        language,
        nameIntro,
        providerName,
        providerTitle: providerTitle || 'Doctor',
        providerSpecialties: providerSpecialtiesText,
        clinicData,
        aiInstructions
      });

      systemPrompt = basePrompt;
      console.log('⚠️ Using legacy hardcoded system prompt');
    }

    // Check if we should use a fallback response instead of generating one
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'user' && clinicConfig) {
      const fallbackResponse = shouldUseFallbackResponse(lastMessage.content, clinicConfig);
      if (fallbackResponse) {
        console.log('🛡️ Using fallback response for detected situation');
        return NextResponse.json({ 
          message: fallbackResponse 
        });
      }
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = completion.choices[0].message.content;

    return NextResponse.json({ 
      message: aiResponse 
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}