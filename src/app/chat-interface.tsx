"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, type Clinic } from "@/lib/supabase";

export default function ChatInterface() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAiTyping, setIsAiTyping] = useState(false);

  // New local state for patient name collection
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nameSubmitted, setNameSubmitted] = useState(false);

  // (localStorage reading removed)
  const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);
  
  // Survey state
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  
  // Get clinic slug and language from URL parameters
  const searchParams = useSearchParams();
  const clinicSlug = searchParams.get('c');
  const doctorParam = searchParams.get('doctor'); // Keep backward compatibility
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
  
  // Translations
  const translations = {
    en: {
      welcomePrefix: "Hello! I'm Dr.",
      welcomeSuffix: "'s assistant. How can I help today?",
      placeholder: "Type a question about your symptoms...",
      send: "Send",
      clearMessages: "Clear Messages",
      copyChat: "Copy Chat",
      chatCopied: "Chat copied!",
      disclaimer: "This assistant is for educational purposes only.",
      errorMessage: "I apologize, but I'm having trouble connecting right now. Please try again later.",
      surveyQuestion: "Did this help you prepare for your visit?",
      thankYouMessage: "Thank you for your feedback!"
    },
    es: {
      welcomePrefix: "¡Hola! Soy el asistente del Dr.",
      welcomeSuffix: ". ¿Cómo puedo ayudarte hoy?",
      placeholder: "Escribe una pregunta sobre tus síntomas...",
      send: "Enviar",
      clearMessages: "Borrar mensajes",
      copyChat: "Copiar Chat",
      chatCopied: "¡Chat copiado!",
      disclaimer: "Este asistente es solo para fines educativos.",
      errorMessage: "Lo siento, tengo problemas para conectarme ahora. Por favor, inténtalo más tarde.",
      surveyQuestion: "¿Te ayudó esto a prepararte para tu visita?",
      thankYouMessage: "¡Gracias por tus comentarios!"
    }
  };
  
  const t = translations[language as keyof typeof translations];
  
  // Parse doctor name for backward compatibility
  const parseDoctorName = (param: string) => {
    const parts = param.toLowerCase().startsWith('dr-') 
      ? param.slice(3).split('-')
      : param.split('-');
    
    return parts.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  // Use clinic data if available, otherwise fall back to URL params or defaults
  const doctorConfig = {
    name: clinic?.doctor_name || (doctorParam ? parseDoctorName(doctorParam) : 'Sami Bismar'),
    title: clinic?.doctor_name ? `Dr. ${clinic.doctor_name}` : (doctorParam ? `Dr. ${parseDoctorName(doctorParam)}` : 'Dr. Sami Bismar'),
    welcomeMessage: clinic?.welcome_message || `${t.welcomePrefix} ${clinic?.doctor_name || (doctorParam ? parseDoctorName(doctorParam).split(' ').pop() : 'Bismar')}${t.welcomeSuffix}`,
    accentColor: clinic?.primary_color || (doctorParam === 'dr-jones' ? '#9B59B6' : '#5BBAD5'),
    logoUrl: clinic?.logo_url || null,
    specialty: clinic?.specialty || 'General Practice'
  };

  // Suggested prompts based on specialty
  const getSuggestedPrompts = () => {
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
      
      // Increment user message count
      const newUserMessageCount = userMessageCount + 1;
      setUserMessageCount(newUserMessageCount);
      
      // Show survey after 3 user messages
      if (newUserMessageCount === 3 && !surveySubmitted) {
        setShowSurvey(true);
      }

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
            patientName: `${firstName} ${lastName}`
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

  const handleCopyChat = async () => {
    if (messages.length === 0) return;
    
    const chatText = messages.map(msg => {
      const role = msg.role === 'user' ? 'You' : doctorConfig.title;
      return `${role}: ${msg.content}`;
    }).join('\n\n');
    
    try {
      await navigator.clipboard.writeText(chatText);
      setShowCopiedFeedback(true);
      setTimeout(() => setShowCopiedFeedback(false), 2000);
    } catch (error) {
      console.error('Failed to copy chat:', error);
    }
  };

  const handleFeedbackSubmit = async (feedback: 'thumbs-up' | 'thumbs-down') => {
    try {
      const { error } = await supabase
        .from('chat_feedback')
        .insert([
          {
            clinic_id: clinic?.id || null,
            patient_name: `${firstName} ${lastName}`,
            feedback,
            chat_messages: messages
          }
        ]);

      if (error) throw error;
      
      setSurveySubmitted(true);
      setShowSurvey(false);
      setShowThankYou(true);
      
      // Hide thank you message after 2 seconds
      setTimeout(() => {
        setShowThankYou(false);
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  if (!nameSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 text-center">Welcome!</h2>
          <p className="text-sm text-gray-600 text-center">Before we begin, what’s your name?</p>
          <input
            type="text"
            placeholder="First Name"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Last Name"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <button
            onClick={() => {
              if (firstName.trim() && lastName.trim()) {
                setNameSubmitted(true);
              }
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Start Chat
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mx-auto animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="text-center py-8 px-4 relative">
          {/* Top Left Copy Button */}
          <div className="absolute top-4 left-4">
            {messages.length > 0 && (
              <button
                onClick={handleCopyChat}
                className="flex items-center gap-2 px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm relative"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">{showCopiedFeedback ? t.chatCopied : t.copyChat}</span>
              </button>
            )}
          </div>

          {/* Top Right Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {/* Clear Chat Button */}
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="flex items-center gap-2 px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="font-medium">{t.clearMessages}</span>
              </button>
            )}
            
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className="flex items-center gap-2 px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium">{language === 'en' ? '🇺🇸 EN' : '🇪🇸 ES'}</span>
            </button>
          </div>
          {/* Logo or Medical Briefcase Icon */}
          {doctorConfig.logoUrl ? (
            <img 
              src={doctorConfig.logoUrl} 
              alt={`${doctorConfig.name} logo`}
              className="w-16 h-16 mx-auto mb-4 rounded-xl object-cover"
            />
          ) : (
            <div 
              className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center"
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
          
          {/* Doctor Name */}
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            {doctorConfig.title}
          </h1>
          
          {/* Specialty */}
          <p className="text-sm text-gray-500 mb-2">
            {doctorConfig.specialty}
          </p>
          
          {/* Welcome Message */}
          <p className="text-gray-600">
            {doctorConfig.welcomeMessage}
          </p>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-4 min-h-[400px] max-h-[400px] overflow-y-auto">
          {messages.length === 0 && (
            <div className="text-center py-8">
              {/* Suggested Prompts */}
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-3">
                  {language === 'en' ? 'Tap a question to get started:' : 'Toca una pregunta para comenzar:'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {getSuggestedPrompts().map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setMessage(prompt);
                        setTimeout(() => handleSend(), 100);
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
              
              <p className="text-gray-400 text-sm">
                {t.disclaimer}
              </p>
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
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user' 
                      ? 'text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                  style={msg.role === 'user' ? { backgroundColor: doctorConfig.accentColor } : {}}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {/* AI Typing Indicator */}
            {isAiTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
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

        {/* Survey Card */}
        {showSurvey && (
          <div className="border-t border-b p-4 bg-blue-50">
            <div className="text-center">
              <p className="text-gray-800 mb-4 font-medium">{t.surveyQuestion}</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleFeedbackSubmit('thumbs-up')}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors"
                  title="Thumbs up"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleFeedbackSubmit('thumbs-down')}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                  title="Thumbs down"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Thank You Message */}
        {showThankYou && (
          <div className="border-t border-b p-4 bg-green-50">
            <div className="text-center">
              <p className="text-green-800 font-medium">{t.thankYouMessage}</p>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t.placeholder}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSend}
              className="px-6 py-2 text-white rounded-lg transition-colors"
              style={{ 
                backgroundColor: doctorConfig.accentColor,
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              {t.send}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}