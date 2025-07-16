"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { DEMO_CLINIC_CONFIG, DEMO_CONVERSATION_HISTORY, DEMO_ACTIVITY_METRICS } from "@/components/demo/DemoClinicConfig";

export default function DemoChatInterface() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(DEMO_CONVERSATION_HISTORY);
  const [loading, setLoading] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  
  // Get language from URL parameters
  const searchParams = useSearchParams();
  const langParam = searchParams.get('lang');
  const [language, setLanguage] = useState(langParam === 'es' ? 'es' : 'en');
  
  // Translations
  const translations = {
    en: {
      placeholder: "Ask about your eye care visit...",
      send: "Send",
      clearMessages: "Clear",
      disclaimer: DEMO_CLINIC_CONFIG.disclaimer,
      errorMessage: "I apologize, but I'm having trouble connecting right now. Please try again later.",
      activityStatus: `Dr. Ranelle helped ${DEMO_ACTIVITY_METRICS.patients_helped_today} patients with vision questions today`
    },
    es: {
      placeholder: "Pregunta sobre tu visita de cuidado ocular...",
      send: "Enviar",
      clearMessages: "Borrar",
      disclaimer: "Este asistente está diseñado para ayudar con preguntas generales sobre la visión mientras esperas. Para diagnóstico o tratamiento, consulta a tu oftalmólogo.",
      errorMessage: "Lo siento, tengo problemas para conectarme ahora. Por favor, inténtalo más tarde.",
      activityStatus: `Dr. Ranelle ayudó a ${DEMO_ACTIVITY_METRICS.patients_helped_today} pacientes con preguntas sobre la visión hoy`
    }
  };
  
  const t = translations[language as keyof typeof translations];
  
  // Use demo clinic configuration
  const clinic = DEMO_CLINIC_CONFIG;
  
  // Get suggested prompts for current language
  const getSuggestedPrompts = () => {
    return clinic.suggested_prompts[language as keyof typeof clinic.suggested_prompts] || clinic.suggested_prompts.en;
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    const userMessage = { 
      role: 'user', 
      content: message.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsAiTyping(true);
    
    try {
      // Simulate realistic response time
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
      
      // Demo responses for common ophthalmology questions
      const demoResponses = getDemoResponse(userMessage.content);
      
      const assistantMessage = {
        role: 'assistant',
        content: demoResponses,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Demo chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: t.errorMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Demo response generator for ophthalmology questions
  const getDemoResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('cataract')) {
      return "Cataract surgery is one of the most common and successful procedures we perform. Dr. Ranelle uses advanced techniques with minimal recovery time. The procedure typically takes 15-20 minutes, and most patients notice improved vision within days. Would you like specific information about preparation or recovery?";
    }
    
    if (input.includes('child') || input.includes('kid') || input.includes('pediatric')) {
      return "Pediatric eye exams are designed to be comfortable and fun! Dr. Ranelle uses special techniques and equipment sized for children. We recommend bringing a favorite toy for comfort. The exam includes vision screening, eye movement tests, and checking eye health - all explained in kid-friendly terms. Most children do great!";
    }
    
    if (input.includes('contact') || input.includes('lens')) {
      return "Contact lens options have improved dramatically, especially for dry eyes! Dr. Ranelle can evaluate whether daily disposables, specialized materials, or other options might work best for you. We'll consider your lifestyle, eye health, and comfort preferences during your consultation.";
    }
    
    if (input.includes('lasik') || input.includes('laser')) {
      return "LASIK consultations include comprehensive eye measurements and corneal mapping to determine if you're a good candidate. Dr. Ranelle will discuss the procedure, expected outcomes, and any risks specific to your eyes. The consultation takes about an hour and includes detailed testing.";
    }
    
    if (input.includes('dry') || input.includes('irritated')) {
      return "Dry eye treatment has many effective options now! Dr. Ranelle will first identify the underlying cause - whether it's environmental, medication-related, or due to gland dysfunction. Treatment might include special drops, lifestyle changes, or in-office procedures. We'll create a personalized plan for you.";
    }
    
    if (input.includes('appointment') || input.includes('visit') || input.includes('prepare')) {
      return "Great question! For your visit, please bring your current glasses or contacts, insurance cards, and a list of current medications. If you're having specific symptoms, note when they occur and what seems to help or make them worse. Dr. Ranelle will want to hear about your vision concerns and goals.";
    }
    
    // Default response for other questions
    return "That's an excellent question for Dr. Ranelle to address during your visit. Our team specializes in comprehensive eye care and will be able to give you detailed, personalized information. Is there anything specific about your upcoming visit that I can help you prepare for?";
  };

  const clearMessages = () => {
    setMessages(DEMO_CONVERSATION_HISTORY);
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm bg-white/95">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-500 to-emerald-500 text-white p-6 text-center">
            <h1 className="text-xl font-bold">{clinic.practice_name}</h1>
            <p className="text-sky-100 text-sm mt-1">Dr. {clinic.doctor_name} • {clinic.specialty}</p>
            
            {/* Activity indicator */}
            <div className="mt-3 bg-white/20 rounded-full px-3 py-1 text-xs">
              <span className="inline-block w-2 h-2 bg-green-300 rounded-full mr-2 animate-pulse"></span>
              {t.activityStatus}
            </div>
          </div>
          
          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-sky-500 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-1 ${
                    msg.role === 'user' ? 'text-sky-100' : 'text-gray-500'
                  }`}>
                    {formatTime(new Date(msg.timestamp))}
                  </p>
                </div>
              </div>
            ))}
            
            {/* AI Typing Indicator */}
            {isAiTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Suggested Prompts */}
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {getSuggestedPrompts().slice(0, 2).map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(prompt)}
                  className="text-xs bg-gradient-to-r from-sky-100 to-emerald-100 text-sky-700 px-3 py-1 rounded-full hover:from-sky-200 hover:to-emerald-200 transition-colors"
                >
                  💡 {prompt}
                </button>
              ))}
            </div>
          </div>
          
          {/* Input Area */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={t.placeholder}
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                disabled={isAiTyping}
              />
              <button
                onClick={sendMessage}
                disabled={!message.trim() || isAiTyping}
                className="bg-gradient-to-r from-sky-500 to-emerald-500 text-white px-6 py-2 rounded-full hover:from-sky-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {t.send}
              </button>
            </div>
            
            {/* Clear button */}
            <div className="flex justify-center mt-2">
              <button
                onClick={clearMessages}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                {t.clearMessages}
              </button>
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="px-4 pb-4">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              {t.disclaimer}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}