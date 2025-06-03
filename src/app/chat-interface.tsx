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
  
  // Get clinic slug from URL parameters
  const searchParams = useSearchParams();
  const clinicSlug = searchParams.get('c');
  const doctorParam = searchParams.get('doctor'); // Keep backward compatibility
  
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
    welcomeMessage: clinic?.welcome_message || `Hello! I'm Dr. ${clinic?.doctor_name || (doctorParam ? parseDoctorName(doctorParam).split(' ').pop() : 'Bismar')}'s assistant. How can I help today?`,
    accentColor: clinic?.primary_color || (doctorParam === 'dr-jones' ? '#9B59B6' : '#5BBAD5'),
    logoUrl: clinic?.logo_url || null,
    specialty: clinic?.specialty || 'General Practice'
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
        // Call API for AI response
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: updatedMessages,
            doctorName: doctorConfig.name,
            specialty: doctorConfig.specialty
          }),
        });

        if (!response.ok) throw new Error('Failed to get response');

        const data = await response.json();
        
        // Add AI response
        setMessages([...updatedMessages, {
          role: "assistant",
          content: data.message
        }]);
      } catch (error) {
        console.error('Error:', error);
        setMessages([...updatedMessages, {
          role: "assistant",
          content: "I apologize, but I'm having trouble connecting right now. Please try again later."
        }]);
      } finally {
        setIsAiTyping(false);
      }
    }
  };

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
        <div className="text-center py-8 px-4">
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
              <button 
                className="hover:underline"
                style={{ color: doctorConfig.accentColor }}
                onClick={() => setMessages([])}
              >
                Clear Messages
              </button>
              <p className="text-gray-400 text-sm mt-8">
                This assistant is for educational purposes only.
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

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a question about your symptoms..."
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
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}