"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  
  // Get doctor name from URL parameters
  const searchParams = useSearchParams();
  const doctorParam = searchParams.get('doctor');
  
  // Parse doctor name, handling "dr-" prefix
  const parseDoctorName = (param: string) => {
    const parts = param.toLowerCase().startsWith('dr-') 
      ? param.slice(3).split('-')  // Remove "dr-" prefix
      : param.split('-');
    
    return parts.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  const doctorName = doctorParam ? parseDoctorName(doctorParam) : 'Sami Bismar';
  
  // Customize based on doctor
  const doctorConfig = {
    name: doctorName,
    title: `Dr. ${doctorName}`,
    welcomeMessage: `Hello! I'm Dr. ${doctorName.split(' ').pop()}'s assistant. How can I help today?`,
    accentColor: doctorParam === 'dr-jones' ? '#9B59B6' : '#5BBAD5'
  };

  const handleSend = async () => {
    if (message.trim()) {
      // Add user message
      const userMessage = { role: "user", content: message };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setMessage("");
      
      try {
        // Call API for AI response
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: updatedMessages,
            doctorName: doctorName
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
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="text-center py-8 px-4">
          {/* Medical Briefcase Icon */}
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
          
          {/* Doctor Name */}
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            {doctorConfig.title}
          </h1>
          
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
                className="text-[#FF6B6B] hover:underline"
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
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
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
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}