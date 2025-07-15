"use client";

import { useState } from "react";
import { ClinicConfig } from "@/components/founder-demo/config/ClinicConfigs";

type StaticChatInterfaceProps = {
  clinicConfig: ClinicConfig;
};

export default function StaticChatInterface({ clinicConfig }: StaticChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [language, setLanguage] = useState('en');
  
  // Translations (copied from original)
  const translations = {
    en: {
      welcomePrefix: "Hello! I'm Dr.",
      welcomeSuffix: "'s assistant. How can I help today?",
      placeholder: "Type a question about your symptoms...",
      send: "Send",
      clearMessages: "Clear",
      disclaimer: "This assistant is for educational purposes only.",
      errorMessage: "I apologize, but I'm having trouble connecting right now. Please try again later."
    },
    es: {
      welcomePrefix: "¡Hola! Soy el asistente del Dr.",
      welcomeSuffix: ". ¿Cómo puedo ayudarte hoy?",
      placeholder: "Escribe una pregunta sobre tus síntomas...",
      send: "Enviar",
      clearMessages: "Borrar",
      disclaimer: "Este asistente es solo para fines educativos.",
      errorMessage: "Lo siento, tengo problemas para conectarme ahora. Por favor, inténtalo más tarde."
    }
  };
  
  const t = translations[language as keyof typeof translations];
  
  // Use static clinic config data
  const doctorConfig = {
    name: clinicConfig.doctor_name,
    title: `${clinicConfig.doctor_name}`,
    welcomeMessage: `${t.welcomePrefix} ${clinicConfig.doctor_name}${t.welcomeSuffix}`,
    accentColor: clinicConfig.colors.primary,
    logoUrl: null,
    specialty: clinicConfig.specialty
  };

  // Get suggested prompts from clinic config
  const getSuggestedPrompts = () => {
    return clinicConfig.suggested_prompts;
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
        // Simulate response delay
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
        
        // Static demo response
        const demoResponse = `Thank you for your question about "${message}". This is a demo of how your patients would interact with your AI assistant. Every response would be customized to match your practice's approach to patient care.`;
        
        setMessages([...updatedMessages, {
          role: "assistant",
          content: demoResponse,
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
        
        {/* Doctor Info */}
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          {doctorConfig.title}
        </h1>
        
        <p className="text-sm text-gray-500 mb-3 font-medium">
          {doctorConfig.specialty}
        </p>
        <p className="text-[11px] text-gray-400 font-medium mb-2">
          {t.disclaimer}
        </p>
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