import { supabase } from '@/lib/supabase';
import { AssembledSystemPrompt, PromptAssemblyConfig } from '@/types/ai-setup';

// Tool definitions and instructions
export function buildToolInstructions(): string {
  return `
AVAILABLE TOOLS:
- get_clinic_services: Get services offered by the clinic
- get_clinic_hours: Get clinic operating hours  
- get_insurance_info: Get accepted insurance plans
- get_contact_info: Get clinic contact information
- get_appointment_policies: Get scheduling and cancellation policies
- get_conditions_treated: Get medical conditions treated at the clinic
- get_provider_info: Get healthcare provider details
- web_search_preview: Search the internet for current medical information or clinic details

TOOL USAGE GUIDELINES:
Use these tools to provide accurate, up-to-date information to help patients prepare for their appointments and answer their questions about the clinic. ALWAYS prioritize using the clinic-specific tools first before using web search. When a patient asks about specific clinic information, immediately use the appropriate tool to get the most current data.`;
}

// Conversation management rules
export function buildConversationRules(): string {
  return `
CONVERSATION MANAGEMENT:
- Maintain context throughout the conversation
- Ask follow-up questions when appropriate
- If unsure about something, use the available tools to get accurate information
- Always provide helpful, actionable responses
- Keep responses concise but informative
- Use a warm, professional tone that matches the clinic's personality
- If you cannot help with something medical, politely direct them to schedule an appointment or speak with clinical staff`;
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
Use context-aware analysis to determine when to use fallback responses. Consider the full intent and urgency of the message, not just keywords.

FALLBACK RESPONSE GUIDELINES:
- Uncertainty situations (when you don't know or are unsure): "${customFallbacks.uncertain}"
- After-hours inquiries (when asked about clinic availability outside hours): "${customFallbacks.after_hours}" 
- Emergency situations (clear medical urgency or emergency): "${customFallbacks.emergency}"

CONTEXT ANALYSIS RULES:
- For uncertainty: Trigger when expressing genuine uncertainty about clinic-specific information or when you cannot provide accurate information
- For after-hours: Trigger when patients ask about current availability, hours, or scheduling during closed times
- For emergencies: Trigger when detecting genuine medical urgency, emergency symptoms, or urgent health concerns - NOT casual mentions of "help"

EXAMPLES:
- "How can you help me today?" → Normal response (not emergency despite containing "help")
- "I'm having chest pain, help!" → Emergency fallback (clear medical urgency)
- "What are your hours?" → After-hours fallback (if currently closed)
- "I'm not sure what's wrong with me" → Uncertainty fallback (patient expressing confusion)`;
  } else {
    // Keyword-based fallback detection
    const triggers = clinicData?.ai_fallback_triggers ? JSON.parse(clinicData.ai_fallback_triggers) : {
      uncertain: ['not sure', 'don\'t know', 'uncertain', 'unclear'],
      after_hours: ['closed', 'hours', 'open', 'when'],
      emergency: ['emergency', 'urgent', 'pain', 'bleeding', 'help']
    };

    fallbackInstructions = `
KEYWORD-BASED FALLBACK DETECTION:
Use simple keyword matching to trigger fallback responses.

FALLBACK TRIGGERS:
- Uncertainty keywords: ${triggers.uncertain.join(', ')} → "${customFallbacks.uncertain}"
- After-hours keywords: ${triggers.after_hours.join(', ')} → "${customFallbacks.after_hours}"
- Emergency keywords: ${triggers.emergency.join(', ')} → "${customFallbacks.emergency}"

When you detect any of these keywords in the user's message, use the corresponding fallback response.`;
  }

  return `
ESCALATION GUIDELINES:
- For medical advice, diagnosis, or treatment recommendations: "I'm not able to provide medical advice. Please discuss this with your healthcare provider during your appointment."
- For emergency situations: "If this is a medical emergency, please call 911 or go to the nearest emergency room immediately."
- For urgent non-emergency concerns: "For urgent medical concerns, please call our clinic directly or use our patient portal if available."
- For complex questions requiring clinical judgment: "This is something our clinical team would be better positioned to help you with. I'd recommend discussing this during your appointment."
- For insurance or billing specific details: "For specific insurance or billing questions, please contact our billing department directly."

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

  // 1. TONE/PERSONALITY SETTINGS
  if (clinicData.tone && clinicData.tone !== 'professional') {
    personalityInstructions += `\nCOMMUNICATION TONE: Always maintain a ${clinicData.tone} tone in all interactions.`;
  }

  // 2. LANGUAGE SETTINGS
  if (clinicData.languages && clinicData.languages.length > 0) {
    const languages = Array.isArray(clinicData.languages) ? clinicData.languages : [clinicData.languages];
    personalityInstructions += `\nSUPPORTED LANGUAGES: You can communicate in ${languages.join(', ')}. If a patient communicates in any of these languages, respond in their preferred language.`;
  }

  // 3. ALWAYS INCLUDE SETTINGS
  if (clinicData.ai_always_include && clinicData.ai_always_include.length > 0) {
    const alwaysInclude = Array.isArray(clinicData.ai_always_include) ? clinicData.ai_always_include : [clinicData.ai_always_include];
    personalityInstructions += `\nALWAYS INCLUDE: You must always mention or include these elements when relevant: ${alwaysInclude.join(', ')}.`;
  }

  // 4. NEVER INCLUDE SETTINGS  
  if (clinicData.ai_never_include && clinicData.ai_never_include.length > 0) {
    const neverInclude = Array.isArray(clinicData.ai_never_include) ? clinicData.ai_never_include : [clinicData.ai_never_include];
    personalityInstructions += `\nNEVER INCLUDE: You must never mention or include these elements: ${neverInclude.join(', ')}.`;
  }

  // 5. INTERVIEW RESPONSES (DETAILED PERSONALITY)
  if (clinicData.interview_responses) {
    const responses = clinicData.interview_responses;
    personalityInstructions += `\nCLINIC PERSONALITY DETAILS:`;
    
    if (responses.communicationStyle) {
      personalityInstructions += `\n- Communication Style: ${responses.communicationStyle}`;
    }
    if (responses.anxietyHandling) {
      personalityInstructions += `\n- Anxiety Management: ${responses.anxietyHandling}`;
    }
    if (responses.practiceUniqueness) {
      personalityInstructions += `\n- Practice Uniqueness: ${responses.practiceUniqueness}`;
    }
    if (responses.medicalDetailLevel) {
      personalityInstructions += `\n- Medical Detail Level: ${responses.medicalDetailLevel}`;
    }
    if (responses.escalationPreference) {
      personalityInstructions += `\n- Escalation Preference: ${responses.escalationPreference}`;
    }
    if (responses.culturalApproach) {
      personalityInstructions += `\n- Cultural Approach: ${responses.culturalApproach}`;
    }
    if (responses.formalityLevel) {
      personalityInstructions += `\n- Formality Level: ${responses.formalityLevel}`;
    }
  }

  return personalityInstructions.trim() ? `\nPERSONALITY & CONFIGURATION SETTINGS:${personalityInstructions}` : '';
}

// Main function to assemble the complete system prompt
export async function assembleSystemPrompt(clinicId: number, basePromptOverride?: string): Promise<string> {
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

  // Assemble the complete prompt
  const fullPrompt = `${basePrompt}${personalityGuidelines}

${toolInstructions}

${conversationRules}

${fallbackGuidelines}`;

  return fullPrompt;
}

// Utility function to validate prompt assembly
export function validatePromptAssembly(assembled: AssembledSystemPrompt): boolean {
  return !!(
    assembled.fullPrompt &&
    assembled.fullPrompt.length > 100 &&
    assembled.components.basePrompt &&
    assembled.components.toolInstructions &&
    assembled.components.conversationRules &&
    assembled.components.fallbackGuidelines
  );
}