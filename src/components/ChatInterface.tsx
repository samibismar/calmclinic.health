"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, type Clinic } from "@/lib/supabase";
import Image from "next/image";

// Add the clinic prop type that your wrapper expects
type ChatInterfaceProps = {
  clinic: string;
  providerId?: number | null;
  providerInfo?: {
    id: number;
    name: string;
    title: string;
    specialties: string[];
    bio?: string;
    experience?: string;
    languages?: string[];
    avatar_url?: string;
    is_active: boolean;
    is_default: boolean;
    is_legacy?: boolean;
  };
};

interface CommonQuestion {
  id: number;
  question_text: string;
  is_active: boolean;
  category?: string;
}

export default function ChatInterface({ clinic: clinicSlug, providerId, providerInfo }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [commonQuestions, setCommonQuestions] = useState<string[]>([]);
  const [conversationResponseId, setConversationResponseId] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Interactive onboarding state
  const [onboardingStage, setOnboardingStage] = useState<'loading' | 'intro' | 'typing' | 'awaiting_response' | 'complete'>('loading');
  const [typedMessage, setTypedMessage] = useState("");
  const [showInterface, setShowInterface] = useState(false);
  
  // Get language from URL parameters
  const searchParams = useSearchParams();
  const langParam = searchParams.get('lang');
  const [language, setLanguage] = useState(langParam === 'es' ? 'es' : 'en');
  
  // Feature flag for Response API (enable with ?responses=true)
  const useResponseAPI = searchParams.get('responses') === 'true';
  
  useEffect(() => {
    async function fetchClinic() {
      if (clinicSlug) {
        try {
          // Try to fetch by slug first, then fallback to ID if that fails
          let { data, error } = await supabase
            .from('clinics')
            .select('*')
            .eq('slug', clinicSlug)
            .single();
          
          // If slug lookup failed, try by ID (for compatibility with ?c=id format)
          if (error && clinicSlug) {
            const { data: dataById, error: errorById } = await supabase
              .from('clinics')
              .select('*')
              .eq('id', parseInt(clinicSlug))
              .single();
            
            if (!errorById && dataById) {
              data = dataById;
              error = null;
            }
          }
          
          if (error) throw error;
          if (data) setClinic(data);
        } catch (error) {
          console.error('Error fetching clinic:', error);
        }
      }
      setLoading(false);
    }
    
    fetchClinic();
  }, [clinicSlug]);

  // Fetch common questions from database
  useEffect(() => {
    async function fetchCommonQuestions() {
      if (clinic?.slug) {
        try {
          const response = await fetch(`/api/clinic-intelligence/common-questions?clinic=${clinic.slug}`);
          if (response.ok) {
            const data = await response.json();
            // Extract question texts from the database questions
            const questions = (data.questions || [])
              .filter((q: CommonQuestion) => q.is_active)
              .map((q: CommonQuestion) => q.question_text)
              .slice(0, 4); // Limit to 4 questions for UI
            setCommonQuestions(questions);
          }
        } catch (error) {
          console.error('Error fetching common questions:', error);
        }
      }
    }
    
    fetchCommonQuestions();
  }, [clinic]);

  // Interactive onboarding flow: progressive disclosure with typing animation
  useEffect(() => {
    if (clinic && !hasInitialized && !loading) {
      // Start the engaging onboarding sequence - MUCH SLOWER
      setTimeout(() => setOnboardingStage('intro'), 1500);
      setTimeout(() => setOnboardingStage('typing'), 4000);
      setHasInitialized(true);
    }
  }, [clinic, loading, hasInitialized]);

  // Real-time typing animation for opening message
  useEffect(() => {
    if (onboardingStage === 'typing' && clinic) {
      const doctorName = providerInfo?.name || clinic?.doctor_name;
      const formattedDoctorName = formatProviderName(doctorName || 'Assistant');
      
      // Get specialty for contextualized messaging
      const specialty = doctorConfig.specialty || 'medical';
      const isEyeCare = specialty.toLowerCase().includes('ophthalmology') || specialty.toLowerCase().includes('eye');
      
      let openingContent;
      if (language === 'es') {
        if (isEyeCare) {
          openingContent = `¡Hola! Sé que las citas oftalmológicas pueden generar preguntas sobre su visión. Soy el asistente de ${formattedDoctorName}, y estoy aquí para ayudarle a sentirse más preparado y tranquilo. Puedo responder preguntas sobre qué esperar, ayudarle a organizar sus inquietudes, o simplemente escuchar lo que tiene en mente. ¿Qué le ayudaría a sentirse más listo para su cita?`;
        } else {
          openingContent = `¡Hola! Sé que las citas médicas pueden generar preguntas y tal vez algunos nervios. Soy el asistente de ${formattedDoctorName}, y estoy aquí para ayudarle a sentirse más preparado y tranquilo. Puedo responder preguntas sobre qué esperar, ayudarle a organizar sus inquietudes, o simplemente escuchar lo que tiene en mente. ¿Qué le ayudaría a sentirse más listo para su cita?`;
        }
      } else {
        if (isEyeCare) {
          openingContent = `Hi! I know eye appointments can bring up questions and maybe some concerns about your vision. I'm ${formattedDoctorName}'s assistant, and I'm here to help you feel more prepared and at ease. I can answer questions about what to expect, help you organize your concerns, or just listen to what's on your mind. What would help you feel most ready for your visit?`;
        } else {
          openingContent = `Hi! I know medical appointments can bring up questions and maybe some nerves. I'm ${formattedDoctorName}'s assistant, and I'm here to help you feel more prepared and at ease. I can answer questions about what to expect, help you organize your concerns, or just listen to what's on your mind. What would help you feel most ready for your visit?`;
        }
      }

      let index = 0;
      const typingSpeed = 45; // ms per character - FASTER (humans read faster)
      
      const typeMessage = () => {
        if (index < openingContent.length) {
          setTypedMessage(openingContent.slice(0, index + 1));
          index++;
          setTimeout(typeMessage, typingSpeed);
        } else {
          // Typing complete - STAY in engaging mode, show prompts, DON'T transition yet
          setTimeout(() => {
            setMessages([{ role: "assistant", content: openingContent }]);
            setOnboardingStage('awaiting_response'); // NEW STAGE - waiting for patient to respond
          }, 1500); // Longer pause to let them read
        }
      };
      
      typeMessage();
    }
  }, [onboardingStage, clinic, language, providerInfo]);

  // Reset initialization when language changes to update opening message
  useEffect(() => {
    if (hasInitialized && clinic) {
      const doctorName = providerInfo?.name || clinic?.doctor_name;
      const formattedDoctorName = formatProviderName(doctorName || 'Assistant');
      
      // Get specialty for contextualized messaging
      const specialty = doctorConfig.specialty || 'medical';
      const isEyeCare = specialty.toLowerCase().includes('ophthalmology') || specialty.toLowerCase().includes('eye');
      
      let openingContent;
      if (language === 'es') {
        if (isEyeCare) {
          openingContent = `¡Hola! Sé que las citas oftalmológicas pueden generar preguntas sobre su visión. Soy el asistente de ${formattedDoctorName}, y estoy aquí para ayudarle a sentirse más preparado y tranquilo. Puedo responder preguntas sobre qué esperar, ayudarle a organizar sus inquietudes, o simplemente escuchar lo que tiene en mente. ¿Qué le ayudaría a sentirse más listo para su cita?`;
        } else {
          openingContent = `¡Hola! Sé que las citas médicas pueden generar preguntas y tal vez algunos nervios. Soy el asistente de ${formattedDoctorName}, y estoy aquí para ayudarle a sentirse más preparado y tranquilo. Puedo responder preguntas sobre qué esperar, ayudarle a organizar sus inquietudes, o simplemente escuchar lo que tiene en mente. ¿Qué le ayudaría a sentirse más listo para su cita?`;
        }
      } else {
        if (isEyeCare) {
          openingContent = `Hi! I know eye appointments can bring up questions and maybe some concerns about your vision. I'm ${formattedDoctorName}'s assistant, and I'm here to help you feel more prepared and at ease. I can answer questions about what to expect, help you organize your concerns, or just listen to what's on your mind. What would help you feel most ready for your visit?`;
        } else {
          openingContent = `Hi! I know medical appointments can bring up questions and maybe some nerves. I'm ${formattedDoctorName}'s assistant, and I'm here to help you feel more prepared and at ease. I can answer questions about what to expect, help you organize your concerns, or just listen to what's on your mind. What would help you feel most ready for your visit?`;
        }
      }
      
      // Update the first message if it's an assistant message (the opening message)
      if (messages.length > 0 && messages[0]?.role === 'assistant') {
        const updatedMessages = [...messages];
        updatedMessages[0] = { role: "assistant", content: openingContent };
        setMessages(updatedMessages);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]); // Only re-run when language changes (intentionally limited dependencies)
  
  // Translations
  const translations = {
    en: {
      welcomePrefix: "Hello! I'm Dr.",
      welcomeSuffix: "'s assistant. How can I help today?",
      placeholder: "Type a question about your symptoms...",
      send: "Send",
      clearMessages: "Clear",
      errorMessage: "I apologize, but I'm having trouble connecting right now. Please try again later."
    },
    es: {
      welcomePrefix: "¡Hola! Soy el asistente del Dr.",
      welcomeSuffix: ". ¿Cómo puedo ayudarte hoy?",
      placeholder: "Escribe una pregunta sobre tus síntomas...",
      send: "Enviar",
      clearMessages: "Borrar",
      errorMessage: "Lo siento, tengo problemas para conectarme ahora. Por favor, inténtalo más tarde."
    }
  };
  
  const t = translations[language as keyof typeof translations];
  
  // Helper function to format provider name properly
  const formatProviderName = (name: string) => {
    if (!name) return 'Dr. Assistant';
    
    // Check if name already starts with Dr.
    if (name.toLowerCase().startsWith('dr.') || name.toLowerCase().startsWith('doctor')) {
      return name;
    }
    
    // Add Dr. prefix if not present
    return `Dr. ${name}`;
  };

  // Helper function to format welcome message properly
  const formatWelcomeMessage = (name: string) => {
    if (!name) return `${t.welcomePrefix} Assistant${t.welcomeSuffix}`;
    
    // Check if name already starts with Dr.
    if (name.toLowerCase().startsWith('dr.') || name.toLowerCase().startsWith('doctor')) {
      // For Spanish, use different prefix
      if (language === 'es') {
        return `¡Hola! Soy ${name}${t.welcomeSuffix}`;
      }
      return `Hello! I'm ${name}${t.welcomeSuffix}`;
    }
    
    // Add Dr. prefix if not present
    return `${t.welcomePrefix} ${name}${t.welcomeSuffix}`;
  };

  // Use provider data if available, otherwise fallback to clinic data
  const doctorConfig = {
    name: providerInfo?.name || clinic?.doctor_name || 'Dr. Assistant',
    title: formatProviderName(providerInfo?.name || clinic?.doctor_name || 'Assistant'),
    welcomeMessage: clinic?.welcome_message || formatWelcomeMessage(providerInfo?.name || clinic?.doctor_name || 'Assistant'),
    accentColor: clinic?.primary_color || '#5BBAD5',
    logoUrl: clinic?.logo_url || null,
    specialty: (providerInfo?.specialties && providerInfo.specialties.length > 0) 
      ? providerInfo.specialties[0] 
      : clinic?.specialty || 'General Practice',
    allSpecialties: providerInfo?.specialties || (clinic?.specialty ? [clinic.specialty] : ['General Practice']),
    bio: providerInfo?.bio || null,
    experience: providerInfo?.experience || null,
    providerTitle: providerInfo?.title || 'Doctor'
  };


  // Suggested prompts based on database common questions or fallback prompts
  const getSuggestedPrompts = () => {
    // First check if we have common questions from the database
    if (commonQuestions.length > 0) {
      return commonQuestions;
    }
    
    // Then check if clinic has custom prompts
    if (clinic?.suggested_prompts) {
      const prompts = clinic.suggested_prompts[language as keyof typeof clinic.suggested_prompts];
      if (prompts && prompts.length > 0) {
        return prompts;
      }
    }
    
    // Fallback to default prompts based on specialty
    const specialtyPrompts: Record<string, { en: string[], es: string[] }> = {
      'Gastroenterology': {
        en: [
          "What should I mention about my stomach pain?",
          "I'm nervous about this visit",
          "What questions should I ask the doctor?",
          "How do I describe my symptoms?"
        ],
        es: [
          "¿Qué debo mencionar sobre mi dolor de estómago?",
          "Estoy nervioso por esta visita",
          "¿Qué preguntas debo hacerle al doctor?",
          "¿Cómo describo mis síntomas?"
        ]
      },
      'General Practice': {
        en: [
          "What should I tell the doctor?",
          "I have multiple concerns today",
          "How long will the appointment take?",
          "Should I mention all my symptoms?"
        ],
        es: [
          "¿Qué debo decirle al doctor?",
          "Tengo varias preocupaciones hoy",
          "¿Cuánto durará la cita?",
          "¿Debo mencionar todos mis síntomas?"
        ]
      }
    };
    
    const prompts = specialtyPrompts[doctorConfig.specialty] || specialtyPrompts['General Practice'];
    return prompts[language as keyof typeof prompts] || prompts.en;
  };

  const handleSend = async () => {
    if (message.trim()) {
      // If this is their first response, transition to static interface
      if (onboardingStage === 'awaiting_response') {
        setOnboardingStage('complete');
        setTimeout(() => setShowInterface(true), 200);
      }
      
      // Add user message
      const userMessage = { role: "user", content: message };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setMessage("");
      setIsAiTyping(true);

      try {
        // Choose API endpoint based on feature flag
        const apiEndpoint = useResponseAPI ? "/api/responses" : "/api/chat";
        
        const requestBody: {
          messages: Array<{role: string, content: string}>;
          doctorName: string;
          specialty: string;
          language: string;
          aiInstructions: string | null;
          providerId: number | null | undefined;
          providerSpecialties: string[];
          providerTitle: string;
          clinicName: string | undefined;
          previousResponseId?: string;
        } = {
          messages: updatedMessages,
          doctorName: doctorConfig.name,
          specialty: doctorConfig.specialty,
          language,
          aiInstructions: clinic?.ai_instructions || null,
          providerId: providerId,
          providerSpecialties: doctorConfig.allSpecialties,
          providerTitle: doctorConfig.providerTitle,
          clinicName: clinic?.slug,
        };

        // Add conversation continuity for Responses API
        if (useResponseAPI && conversationResponseId) {
          requestBody.previousResponseId = conversationResponseId;
        }

        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) throw new Error("Failed to get response");

        const data = await response.json();

        // Store response ID for conversation continuity (Responses API)
        if (useResponseAPI && data.response_id) {
          setConversationResponseId(data.response_id);
          console.log('🔗 Stored conversation response ID:', data.response_id);
        }

        setMessages([...updatedMessages, {
          role: "assistant",
          content: data.message,
        }]);
      } catch (error) {
        console.error("Error:", error);
        setMessages([...updatedMessages, {
          role: "assistant",
          content: t.errorMessage,
        }]);
      } finally {
        setIsAiTyping(false);
      }
    }
  };

  // Interactive onboarding experience
  if (loading || onboardingStage !== 'complete') {
    return (
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full min-h-0 backdrop-blur-sm bg-white/95 max-h-[90vh]">
        
        {/* Seamlessly integrated header */}
        <div className={`px-6 pt-4 pb-0 bg-white transition-all duration-2000 ease-out ${
          onboardingStage === 'loading' ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
        }`}>
          
          <div className="flex items-center justify-between">
            {/* Compact doctor info */}
            <div className={`flex items-center space-x-3 transition-all duration-1500 delay-1000 ease-out ${
              onboardingStage === 'loading' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}>
              {/* Small logo/icon */}
              {doctorConfig.logoUrl ? (
                <Image 
                  src={doctorConfig.logoUrl} 
                  alt={`${doctorConfig.name} logo`}
                  width={36}
                  height={36}
                  className="rounded-lg object-cover shadow-sm border-2 border-gray-100"
                />
              ) : (
                <div 
                  className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm border-2 border-gray-100"
                  style={{ backgroundColor: doctorConfig.accentColor }}
                >
                  <svg 
                    className="w-5 h-5 text-white" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M8 3a2 2 0 00-2 2H4a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2-2H8zm0 2h4v1H8V5zM4 7h12v9H4V7z"/>
                    <path d="M10 10a1 1 0 011 1v2a1 1 0 01-2 0v-2a1 1 0 011-1z"/>
                  </svg>
                </div>
              )}
              
              {/* Compact text info */}
              <div className="text-left">
                <h2 className="text-base font-bold text-gray-900 leading-tight">
                  {doctorConfig.title}
                </h2>
                <p className="text-xs text-gray-600 font-medium">
                  {doctorConfig.allSpecialties.length > 0 ? doctorConfig.allSpecialties[0] : doctorConfig.providerTitle}
                </p>
              </div>
            </div>
            
            {/* Right side controls */}
            <div className={`flex items-center space-x-2 transition-all duration-1500 delay-1800 ease-out ${
              onboardingStage === 'loading' ? 'opacity-0' : 'opacity-100'
            }`}>
              <button
                onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 text-xs font-medium"
              >
                <span>{language === 'en' ? '🇺🇸' : '🇪🇸'}</span>
                <span>{language === 'en' ? 'EN' : 'ES'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Interactive typing area - seamlessly flows from header */}
        <div className="flex-1 overflow-y-auto px-6 pt-4 pb-4 min-h-0">
          <div className="space-y-4">
            
            {/* Loading state */}
            {onboardingStage === 'loading' && (
              <div className="flex justify-center">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center space-x-1">
                    <div className="typing-dot w-2 h-2 bg-gray-500 rounded-full" style={{ animationDelay: '0ms' }}></div>
                    <div className="typing-dot w-2 h-2 bg-gray-500 rounded-full" style={{ animationDelay: '200ms' }}></div>
                    <div className="typing-dot w-2 h-2 bg-gray-500 rounded-full" style={{ animationDelay: '400ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Intro stage - assistant preparing - SLOWER with BETTER COLORS */}
            {onboardingStage === 'intro' && (
              <div className={`flex justify-start transition-all duration-1200 ease-out ${
                onboardingStage === 'intro' ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
              }`}>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl rounded-bl-md px-6 py-4 shadow-lg max-w-[85%]">
                  <div className="flex items-center space-x-3">
                    <div className="typing-dot w-3 h-3 bg-blue-600 rounded-full" style={{ animationDelay: '0ms' }}></div>
                    <div className="typing-dot w-3 h-3 bg-blue-600 rounded-full" style={{ animationDelay: '300ms' }}></div>
                    <div className="typing-dot w-3 h-3 bg-blue-600 rounded-full" style={{ animationDelay: '600ms' }}></div>
                    <span className="text-sm text-gray-800 font-medium ml-3">Assistant is preparing...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Typing stage - real-time message reveal - MUCH BETTER COLORS */}
            {onboardingStage === 'typing' && typedMessage && (
              <div className={`flex justify-start transition-all duration-800 ease-out ${
                onboardingStage === 'typing' ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
              }`}>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl rounded-bl-md px-6 py-4 shadow-lg max-w-[85%]">
                  <p className="text-base leading-relaxed text-gray-900 font-medium">
                    {typedMessage}
                    <span className="animate-pulse ml-1 text-blue-600 font-bold">|</span>
                  </p>
                </div>
              </div>
            )}
            
            {/* AWAITING RESPONSE STAGE - Show prompts and keep engaging */}
            {onboardingStage === 'awaiting_response' && (
              <div className="space-y-4">
                {/* Show the completed message */}
                <div className={`flex justify-start transition-all duration-800 ease-out opacity-100`}>
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl rounded-bl-md px-6 py-4 shadow-lg max-w-[85%]">
                    <p className="text-base leading-relaxed text-gray-900 font-medium">
                      {messages[0]?.content}
                    </p>
                  </div>
                </div>
                
                {/* Show suggested prompts with engaging animations */}
                <div className="mt-8 space-y-3">
                  {getSuggestedPrompts().slice(0, 3).map((prompt, index) => {
                    const delayClass = index === 0 ? 'delay-200' : index === 1 ? 'delay-500' : 'delay-700';
                    return (
                    <div
                      key={index}
                      className={`transition-all duration-1000 ${delayClass} ease-out opacity-100 transform translate-y-0`}
                    >
                      <button
                        onClick={() => {
                          setMessage(prompt);
                          setTimeout(() => handleSend(), 200);
                        }}
                        className="w-full px-6 py-4 bg-white border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded-2xl text-base text-gray-800 font-medium transition-all duration-300 text-left shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                      >
                        {prompt}
                      </button>
                    </div>
                    );
                  })}
                </div>
                
                
                {/* Feedback link */}
                <div className="mt-6 text-center">
                  <a
                    href="https://forms.gle/aGKvuwzUwrH7HuEy8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline"
                  >
                    💬 Help us improve → Leave feedback
                  </a>
                </div>
              </div>
            )}
            
          </div>
        </div>
        
        {/* Fixed bottom input area */}
        <div className="px-6 py-4 bg-white border-t border-gray-100">
          <div className="flex gap-3 items-end">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={language === 'es' ? "Escribe tu mensaje aquí..." : "Type your message here..."}
              className="flex-1 px-4 py-3 border-2 border-blue-200 rounded-2xl focus:outline-none focus:border-blue-500 bg-white shadow-sm text-base text-gray-900 placeholder-gray-600 font-medium"
              disabled={isAiTyping}
            />
            <button
              onClick={handleSend}
              disabled={isAiTyping || !message.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all duration-200 font-semibold text-base shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
            >
              {language === 'es' ? 'Enviar' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full min-h-0 backdrop-blur-sm bg-white/95 max-h-[90vh] transition-all duration-700 ${
        showInterface ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-95'
      }`}>
      {/* Seamlessly integrated header - static version */}
      <div className={`px-6 pt-4 pb-0 bg-white transition-all duration-600 delay-100 ${
        showInterface ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
      }`}>
        
        <div className="flex items-center justify-between">
          {/* Compact doctor info */}
          <div className={`flex items-center space-x-3 transition-all duration-600 delay-200 ${
            showInterface ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}>
            {/* Small logo/icon */}
            {doctorConfig.logoUrl ? (
              <Image 
                src={doctorConfig.logoUrl} 
                alt={`${doctorConfig.name} logo`}
                width={36}
                height={36}
                className="rounded-lg object-cover shadow-sm border-2 border-gray-100"
              />
            ) : (
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm border-2 border-gray-100"
                style={{ backgroundColor: doctorConfig.accentColor }}
              >
                <svg 
                  className="w-5 h-5 text-white" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M8 3a2 2 0 00-2 2H4a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2-2H8zm0 2h4v1H8V5zM4 7h12v9H4V7z"/>
                  <path d="M10 10a1 1 0 011 1v2a1 1 0 01-2 0v-2a1 1 0 011-1z"/>
                </svg>
              </div>
            )}
            
            {/* Compact text info */}
            <div className="text-left">
              <h2 className="text-base font-bold text-gray-900 leading-tight">
                {doctorConfig.title}
              </h2>
              <p className="text-xs text-gray-600 font-medium">
                {doctorConfig.allSpecialties.length > 0 ? doctorConfig.allSpecialties[0] : doctorConfig.providerTitle}
              </p>
            </div>
          </div>
          
          {/* Right side controls */}
          <div className={`flex items-center space-x-2 transition-all duration-600 delay-300 ${
            showInterface ? 'opacity-100' : 'opacity-0'
          }`}>
            {/* Clear Chat Button */}
            {messages.length > 1 && (
              <button
                onClick={() => {
                  // Reset to just the opening message
                  const doctorName = providerInfo?.name || clinic?.doctor_name;
                  const formattedDoctorName = formatProviderName(doctorName || 'Assistant');
                  
                  // Get specialty for contextualized messaging
                  const specialty = doctorConfig.specialty || 'medical';
                  const isEyeCare = specialty.toLowerCase().includes('ophthalmology') || specialty.toLowerCase().includes('eye');
                  
                  let openingContent;
                  if (language === 'es') {
                    if (isEyeCare) {
                      openingContent = `¡Hola! Sé que las citas oftalmológicas pueden generar preguntas sobre su visión. Soy el asistente de ${formattedDoctorName}, y estoy aquí para ayudarle a sentirse más preparado y tranquilo. Puedo responder preguntas sobre qué esperar, ayudarle a organizar sus inquietudes, o simplemente escuchar lo que tiene en mente. ¿Qué le ayudaría a sentirse más listo para su cita?`;
                    } else {
                      openingContent = `¡Hola! Sé que las citas médicas pueden generar preguntas y tal vez algunos nervios. Soy el asistente de ${formattedDoctorName}, y estoy aquí para ayudarle a sentirse más preparado y tranquilo. Puedo responder preguntas sobre qué esperar, ayudarle a organizar sus inquietudes, o simplemente escuchar lo que tiene en mente. ¿Qué le ayudaría a sentirse más listo para su cita?`;
                    }
                  } else {
                    if (isEyeCare) {
                      openingContent = `Hi! I know eye appointments can bring up questions and maybe some concerns about your vision. I'm ${formattedDoctorName}'s assistant, and I'm here to help you feel more prepared and at ease. I can answer questions about what to expect, help you organize your concerns, or just listen to what's on your mind. What would help you feel most ready for your visit?`;
                    } else {
                      openingContent = `Hi! I know medical appointments can bring up questions and maybe some nerves. I'm ${formattedDoctorName}'s assistant, and I'm here to help you feel more prepared and at ease. I can answer questions about what to expect, help you organize your concerns, or just listen to what's on your mind. What would help you feel most ready for your visit?`;
                    }
                  }
                  setMessages([{ role: "assistant", content: openingContent }]);
                  setConversationResponseId(null); // Reset conversation for fresh start
                  setHasInitialized(true); // Mark as initialized since we just set the opening message
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 text-xs font-medium"
                title={t.clearMessages}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            
            {/* Response API Indicator */}
            {useResponseAPI && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Smart</span>
              </div>
            )}
            
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 text-xs font-medium"
            >
              <span>{language === 'en' ? '🇺🇸' : '🇪🇸'}</span>
              <span>{language === 'en' ? 'EN' : 'ES'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages Area - seamlessly integrated */}
      <div className={`flex-1 overflow-y-auto px-6 pt-4 pb-4 min-h-0 chat-scroll transition-all duration-600 delay-300 ${
        showInterface ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
      }`}>
        
        {/* Messages */}
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div 
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  msg.role === 'user' 
                    ? 'text-white rounded-br-md' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}
                style={msg.role === 'user' ? { backgroundColor: doctorConfig.accentColor } : {}}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {/* Show suggested prompts after opening message */}
          {messages.length === 1 && messages[0]?.role === 'assistant' && (
            <div className="mt-6">
              <div className="space-y-2">
                {getSuggestedPrompts().slice(0, 3).map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setMessage(prompt);
                      setTimeout(() => handleSend(), 100);
                    }}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-sm text-gray-700 transition-all duration-200 border border-gray-100 text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="mt-4 text-center">
                <a
                  href="https://forms.gle/aGKvuwzUwrH7HuEy8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs font-medium text-blue-600 hover:underline"
                >
                  💬 Help us improve → Leave feedback
                </a>
              </div>
            </div>
          )}
          
          {/* AI Typing Indicator - Apple-style bouncing dots */}
          {isAiTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex items-center space-x-1">
                  <div className="typing-dot w-2 h-2 bg-gray-500 rounded-full" style={{ animationDelay: '0ms' }}></div>
                  <div className="typing-dot w-2 h-2 bg-gray-500 rounded-full" style={{ animationDelay: '200ms' }}></div>
                  <div className="typing-dot w-2 h-2 bg-gray-500 rounded-full" style={{ animationDelay: '400ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Input Area - always visible */}
      <div className={`px-6 py-4 bg-white border-t border-gray-100 transition-all duration-600 delay-400 ${
        showInterface ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
      }`}>
        <div className="flex gap-3 items-end">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t.placeholder}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-sm text-gray-900 placeholder-gray-500"
            disabled={isAiTyping}
          />
          <button
            onClick={handleSend}
            disabled={isAiTyping || !message.trim()}
            className="px-4 py-3 text-white rounded-2xl transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-w-[60px]"
            style={{ 
              backgroundColor: doctorConfig.accentColor,
            }}
          >
            {t.send}
          </button>
        </div>
      </div>
      </div>
    </>
  );
}