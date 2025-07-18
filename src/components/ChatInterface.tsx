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
  
  // Get language from URL parameters
  const searchParams = useSearchParams();
  const langParam = searchParams.get('lang');
  const [language, setLanguage] = useState(langParam === 'es' ? 'es' : 'en');
  
  useEffect(() => {
    async function fetchClinic() {
      if (clinicSlug) {
        try {
          const { data, error } = await supabase
            .from('clinics')
            .select('*')
            .eq('slug', clinicSlug)
            .single();
          
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
      // Add user message
      const userMessage = { role: "user", content: message };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setMessage("");
      setIsAiTyping(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages,
            doctorName: doctorConfig.name,
            specialty: doctorConfig.specialty,
            language,
            aiInstructions: clinic?.ai_instructions || null,
            providerId: providerId,
            providerSpecialties: doctorConfig.allSpecialties,
            providerTitle: doctorConfig.providerTitle,
          }),
        });

        if (!response.ok) throw new Error("Failed to get response");

        const data = await response.json();

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

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-2xl p-8 text-center backdrop-blur-sm bg-white/95">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl shadow-lg animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 bg-gray-300 rounded-lg animate-pulse"></div>
        </div>
        <div className="space-y-3">
          <div className="h-6 bg-gray-100 rounded-xl w-3/4 mx-auto animate-pulse"></div>
          <div className="h-4 bg-gray-100 rounded-xl w-full mx-auto animate-pulse"></div>
        </div>
        <p className="text-gray-500 text-sm mt-4 animate-pulse">Loading assistant...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full min-h-0 backdrop-blur-sm bg-white/95 max-h-[90vh]">
      {/* Header */}
      <div className="px-6 py-6 text-center border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        {/* Top Controls */}
        <div className="flex justify-between items-center mb-4">
          {/* Clear Chat Button */}
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-all duration-200 text-xs font-medium shadow-md"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>{t.clearMessages}</span>
            </button>
          )}
          
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 text-white transition-all duration-200 text-xs font-medium shadow-md hover:shadow-lg"
          >
            <span>{language === 'en' ? '🇺🇸 EN' : '🇪🇸 ES'}</span>
          </button>
        </div>

        {/* Logo/Icon */}
        {doctorConfig.logoUrl ? (
          <Image 
            src={doctorConfig.logoUrl} 
            alt={`${doctorConfig.name} logo`}
            width={64}
            height={64}
            className="mx-auto mb-4 rounded-2xl object-cover shadow-lg border-4 border-white"
          />
        ) : (
          <div 
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white"
            style={{ backgroundColor: doctorConfig.accentColor }}
          >
            <svg 
              className="w-8 h-8 text-white" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M8 3a2 2 0 00-2 2H4a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2-2H8zm0 2h4v1H8V5zM4 7h12v9H4V7z"/>
              <path d="M10 10a1 1 0 011 1v2a1 1 0 01-2 0v-2a1 1 0 011-1z"/>
            </svg>
          </div>
        )}
        
        {/* Doctor Info */}
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          {doctorConfig.title}
        </h1>
        
        {/* Only show specialties if different from provider title */}
        {doctorConfig.allSpecialties.length > 0 && 
         doctorConfig.allSpecialties.some(specialty => specialty.toLowerCase() !== doctorConfig.providerTitle.toLowerCase()) && (
          <p className="text-xs text-blue-600 mb-3 font-medium">
            {doctorConfig.allSpecialties.filter(specialty => specialty.toLowerCase() !== doctorConfig.providerTitle.toLowerCase()).join(", ")}
          </p>
        )}
        
        {/* Show provider title only if no specialties or if title is different */}
        {(!doctorConfig.allSpecialties.length || 
          !doctorConfig.allSpecialties.some(specialty => specialty.toLowerCase() === doctorConfig.providerTitle.toLowerCase())) && (
          <p className="text-sm text-gray-500 mb-3 font-medium">
            {doctorConfig.providerTitle}
          </p>
        )}
        <p className="text-gray-700 text-sm leading-relaxed">
          {doctorConfig.welcomeMessage}
        </p>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0 chat-scroll">
        {messages.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-3 font-medium">
              {language === 'en' ? 'Tap a question to get started:' : 'Toca una pregunta para comenzar:'}
            </p>
            <div className="mt-6">
              <a
                href="https://forms.gle/aGKvuwzUwrH7HuEy8"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm font-medium text-blue-600 hover:underline"
              >
                💬 Help us improve → Leave feedback
              </a>
            </div>
            <div className="mb-6">
              <div className="space-y-2">
                {getSuggestedPrompts().map((prompt, index) => (
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
            </div>
          </div>
        )}
        
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
          
          {/* AI Typing Indicator */}
          {isAiTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex gap-3 items-end">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
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