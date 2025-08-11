import { supabase } from '@/lib/supabase';

// Tool definitions and instructions for Hybrid RAG system
export function buildToolInstructions(): string {
  return `
TOOL USAGE RULES
    • Use tools to get clinic-specific information, then BLEND that with your medical knowledge for comprehensive answers
    • DO NOT over-rely on tools for questions that can be answered with general GPT knowledge (e.g., "What are common major health insurance providers?")
    • For follow-up questions, evaluate whether to use general knowledge vs. recalling the tool again. Prioritize fluidity and relevance over rigid repetition

AVAILABLE TOOLS:
    • get_clinic_services - Get the complete list of services offered by the clinic - USE THIS for questions about 'services', 'treatments offered', 'what do you do', etc.
    • get_clinic_hours - Get clinic operating hours and scheduling information
    • get_insurance_info - Get accepted insurance plans and coverage information
    • get_contact_info - Get clinic contact information like phone numbers and addresses
    • clinic_rag_search - REQUIRED for questions about specific medical procedures, treatments, or conditions (balloon sinuplasty, sleep apnea, hearing aids, etc.). Searches clinic website for detailed procedure information, preparation instructions, and clinic-specific approach.

TOOL USAGE STRATEGY:
    • For "services", "treatments", "what do you do" → use get_clinic_services
    • For "hours", "schedule", "when open" → use get_clinic_hours  
    • For "insurance", "coverage", "accepted plans" → use get_insurance_info
    • For "contact", "phone", "address", "location" → use get_contact_info
    • For medical procedures → use clinic_rag_search to get clinic-specific info, then combine with your medical knowledge

APPROACH FOR MEDICAL QUESTIONS:
1. Use clinic_rag_search to get the clinic's specific information and approach
2. Combine that clinic-specific content with your comprehensive medical knowledge
3. Provide a detailed, educational answer that includes both general medical info AND clinic-specific details
4. ALWAYS include source citations when using clinic_rag_search results

SOURCE CITATION REQUIREMENTS:
    • When using clinic_rag_search results, ALWAYS end your response with proper source citations
    • Use this format: "Source: [Page Title] - [URL]" or "Sources: [Multiple sources listed]"
    • The hybrid RAG system will provide sources in the tool results - you MUST include them
    • For general medical knowledge, no citation needed, but for clinic-specific info, citation is MANDATORY

EXAMPLES:
    • "What is balloon sinuplasty?" → Search clinic info + your medical knowledge = comprehensive explanation with clinic's specific approach + "Source: Balloon Sinuplasty - https://clinic.com/procedures"
    • "What services do you offer?" → MUST use get_clinic_services only (no citation needed for structured data)

    • Always provide thorough, educational medical information
    • Always cite sources when using clinic_rag_search information
    • Always mention consulting with the doctor for personalized advice`;
}

// Conversation management rules
export function buildConversationRules(): string {
  return `
CONVERSATION QUALITY RULES
    • Avoid repetition — Do not restate the same sentence from a previous message. Each reply should move the conversation forward.
    • Maintain context — Incorporate the previous response and patient's intention naturally, especially for follow-ups.
    • Blend tool output with GPT knowledge — For example, if the tool says "We accept major insurance plans," and the patient asks "What are examples?", use your own knowledge to list plans like:
    • Blue Cross Blue Shield
    • Aetna
    • UnitedHealthcare
    • Cigna
    • Medicare

⸻

FORMATTING GUIDELINES
    • Use simple dashes for bullet points:
- Item A  
- Item B  
- Item C

                 DO NOT use headings like "Clinic Services:"
    • One list item per line, no inline lists or nested formatting

⸻

INTERACTION STYLE
    • Warm and human — not stiff or robotic
    • Ask follow-ups where natural:
"Would you like more info about what to expect at your eye exam?"
"Have you noticed any other symptoms?"
    • Always focus on clarity and value — don't restate the same facts in follow-ups unless absolutely needed`;
}

// Fallback and escalation guidelines with intelligent detection
export async function buildFallbackGuidelines(clinicId: number): Promise<string> {
  // Fetch custom fallback responses and intelligent mode settings
  const { data: clinicData } = await supabase
    .from('clinics')
    .select('fallback_uncertain, fallback_after_hours, fallback_emergency, ai_intelligent_mode, ai_fallback_triggers')
    .eq('id', clinicId)
    .single();

  const isIntelligentMode = clinicData?.ai_intelligent_mode ?? true;
  const customFallbacks = {
    uncertain: clinicData?.fallback_uncertain || "I'm not sure about that. Let me connect you with our staff who can help you better.",
    after_hours: clinicData?.fallback_after_hours || "We're currently closed. For urgent matters, please call our emergency line at [phone]. Otherwise, I'm happy to help you schedule an appointment for when we reopen.",
    emergency: clinicData?.fallback_emergency || "This sounds like it might be urgent. Please call 911 for emergencies, or contact our clinic directly at [phone] for immediate medical concerns."
  };

  let fallbackInstructions = '';
  
  if (isIntelligentMode) {
    fallbackInstructions = `
INTELLIGENT FALLBACK DETECTION:
Use context-aware analysis to determine when to use fallback responses. These should be RARE - only use when absolutely necessary.

FALLBACK RESPONSE GUIDELINES:
- Uncertainty situations (when YOU don't know clinic-specific details): "${customFallbacks.uncertain}"
- Emergency situations (clear medical urgency): "${customFallbacks.emergency}"

CONTEXT ANALYSIS RULES:
- For uncertainty: ONLY when you genuinely don't know very specific clinic information (like exact pricing for specific procedures, very detailed policies). This should be extremely rare.
- For emergencies: Trigger when detecting genuine medical urgency, emergency symptoms, or urgent health concerns - NOT casual mentions of "help"

EXAMPLES:
- "How can you help me today?" → Normal response (not emergency despite containing "help")
- "I'm having severe chest pain and shortness of breath, HELP!" → Emergency fallback (clear medical urgency)
- "What's the exact cost for my specific insurance plan for a retinal detachment surgery?" → Uncertainty fallback (very specific pricing info you don't have access to)`;
  } else {
    // Keyword-based fallback detection (simplified)
    const triggers = clinicData?.ai_fallback_triggers ? JSON.parse(clinicData.ai_fallback_triggers) : {
      uncertain: ['not sure', 'don\'t know', 'uncertain', 'unclear'],
      emergency: ['emergency', 'urgent', 'severe pain', 'bleeding', 'chest pain', 'can\'t breathe']
    };

    fallbackInstructions = `
KEYWORD-BASED FALLBACK DETECTION:
Use simple keyword matching to trigger fallback responses. These should be RARE.

FALLBACK TRIGGERS:
- Uncertainty keywords: ${triggers.uncertain.join(', ')} → "${customFallbacks.uncertain}"
- Emergency keywords: ${triggers.emergency.join(', ')} → "${customFallbacks.emergency}"

Only use fallbacks when keywords clearly indicate the specific situation.`;
  }

  return `
MEDICAL QUESTION STRATEGY
    1. Start with empathetic acknowledgment
    2. Provide educational, non-diagnostic info
    3. Offer to explain more: "Would you like a quick explanation of what these causes mean?"
    4. End with a helpful disclaimer, only after value is delivered.

NEVER begin a response with "I can't provide medical advice."
ALWAYS begin with what you can explain.

⸻

EXAMPLE SYMPTOM RESPONSE STYLE:

"Seeing black spots may be due to eye floaters, vitreous changes, or, in some cases, more serious conditions involving the retina.
If you'd like, I can walk you through what each of those might mean and when they may be concerning.
That said, only your provider can evaluate your specific case. Be sure to mention this during your visit with Dr. [Provider Name]."

⸻

FALLBACK & ESCALATION BEHAVIOR

Emergencies:
"If this is a medical emergency, please call 911 or visit the nearest ER."

Urgent care needs:
"This might need prompt attention. Please call our clinic directly or seek care today."

Uncertainty fallback:
"I'm not sure about that one — let me connect you with our staff who can help further."

${fallbackInstructions}`;
}

// Get the current active base prompt for a clinic from ai_prompt_history
export async function getLatestClinicPrompt(clinicId: number): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('ai_prompt_history')
      .select('prompt_text')
      .eq('clinic_id', clinicId)
      .eq('is_current', true)
      .single();

    if (error || !data) {
      console.log('No current prompt found in ai_prompt_history for clinic:', clinicId);
      return null;
    }

    console.log('Found current prompt for clinic', clinicId, '- length:', data.prompt_text.length);
    return data.prompt_text;
  } catch (error) {
    console.error('Error fetching clinic prompt from ai_prompt_history:', error);
    return null;
  }
}

// Default fallback prompt for when no custom prompt exists
export function getDefaultPrompt(clinicName: string, specialty: string): string {
  return `You are a helpful AI assistant for ${clinicName}, a ${specialty} practice. You provide information about the clinic and help patients prepare for their appointments. You are warm, professional, and knowledgeable about general medical topics related to ${specialty.toLowerCase()}. 

You maintain appropriate boundaries by not providing medical advice, diagnoses, or treatment recommendations. Instead, you help patients understand what to expect during their visit and provide general information about the practice.

You always strive to be helpful, accurate, and empathetic in your responses while maintaining a professional healthcare setting tone.`;
}

// Build personality guidelines from live clinic settings
export async function buildPersonalityGuidelines(clinicId: number): Promise<string> {
  // Fetch ALL personality and config settings from clinic
  const { data: clinicData } = await supabase
    .from('clinics')
    .select('tone, languages, ai_always_include, ai_never_include, interview_responses')
    .eq('id', clinicId)
    .single();

  if (!clinicData) {
    return '';
  }

  let personalityInstructions = '';

  // SUPPORTED LANGUAGES
  if (clinicData.languages && clinicData.languages.length > 0) {
    const languages = Array.isArray(clinicData.languages) ? clinicData.languages : [clinicData.languages];
    personalityInstructions += `\n    • SUPPORTED LANGUAGES: ${languages.join(', ')} — respond in the patient's language.`;
  }

  // WHAT NOT TO INCLUDE
  if (clinicData.ai_never_include && clinicData.ai_never_include.length > 0) {
    const neverInclude = Array.isArray(clinicData.ai_never_include) ? clinicData.ai_never_include : [clinicData.ai_never_include];
    personalityInstructions += `\n    • DO NOT INCLUDE: ${neverInclude.join(', ')}.`;
  }

  // COMMUNICATION STYLE FROM INTERVIEW
  if (clinicData.interview_responses?.communicationStyle) {
    personalityInstructions += `\n    • COMMUNICATION STYLE: ${clinicData.interview_responses.communicationStyle} — never robotic or repetitive.`;
  } else if (clinicData.tone && clinicData.tone !== 'professional') {
    personalityInstructions += `\n    • COMMUNICATION STYLE: ${clinicData.tone} — never robotic or repetitive.`;
  } else {
    personalityInstructions += `\n    • COMMUNICATION STYLE: Clear, patient, warm — never robotic or repetitive.`;
  }

  return personalityInstructions.trim() ? `\nPERSONALITY & CONFIGURATION${personalityInstructions}` : '';
}

// Get provider context for system prompt
export async function getProviderContext(providerId: number): Promise<string> {
  try {
    const { data: provider, error } = await supabase
      .from('providers')
      .select('name, title, gender, specialties')
      .eq('id', providerId)
      .single();

    if (error || !provider) {
      return '';
    }

    let pronoun = 'they';
    let possessive = 'their';
    
    if (provider.gender === 'male') {
      pronoun = 'he';
      possessive = 'his';
    } else if (provider.gender === 'female') {
      pronoun = 'she';
      possessive = 'her';
    }

    // Check if this is an eye care provider
    const specialties = provider.specialties || [];
    const isEyeCareProvider = specialties.some((spec: string) => 
      spec.toLowerCase().includes('ophthalmology') || 
      spec.toLowerCase().includes('optometry') || 
      spec.toLowerCase().includes('eye')
    );

    let providerContext = `\nPROVIDER CONTEXT\n    • Speaking with a patient of ${provider.name}\n    • Use ${pronoun}/${possessive} pronouns`;
    
    if (specialties.length > 0) {
      providerContext += `\n    • Specialties: ${specialties.join(', ')}`;
    }

    if (isEyeCareProvider) {
      providerContext += `\n\n⸻\n\nDOMAIN CONTEXT\n    • Focus exclusively on vision, eye health, and ophthalmology/optometry visit preparation.\n    • Be able to explain exams, screenings, symptoms, common conditions, and general eye care tips.`;
    }

    return providerContext;
  } catch (error) {
    console.error('Error fetching provider context:', error);
    return '';
  }
}

// Main function to assemble the complete system prompt
export async function assembleSystemPrompt(clinicId: number, basePromptOverride?: string, providerId?: number): Promise<string> {
  // Use override prompt or get the base prompt from the database
  let basePrompt = basePromptOverride || await getLatestClinicPrompt(clinicId);
  
  // Fallback to default if no custom prompt exists
  if (!basePrompt) {
    // Get clinic info for default prompt
    const { data: clinicData } = await supabase
      .from('clinics')
      .select('practice_name, specialty')
      .eq('id', clinicId)
      .single();
    
    basePrompt = getDefaultPrompt(
      clinicData?.practice_name || 'this clinic', 
      clinicData?.specialty || 'healthcare'
    );
  }

  // Build the component parts
  const toolInstructions = buildToolInstructions();
  const conversationRules = buildConversationRules();
  const personalityGuidelines = await buildPersonalityGuidelines(clinicId);
  const fallbackGuidelines = await buildFallbackGuidelines(clinicId);
  const providerContext = providerId ? await getProviderContext(providerId) : '';

  // Assemble the complete prompt in the new format
  const fullPrompt = `${basePrompt}

⸻
${personalityGuidelines}${providerContext}

⸻

${toolInstructions}

⸻
${conversationRules}

⸻
${fallbackGuidelines}
⸻`;

  return fullPrompt;
}

// Utility function to validate prompt assembly
export function validatePromptAssembly(assembledPrompt: string): boolean {
  return !!(
    assembledPrompt &&
    assembledPrompt.length > 100
  );
}