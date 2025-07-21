"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function AnimationTestPage() {
  const [currentDemo, setCurrentDemo] = useState<'current' | 'slidein' | 'fadein' | 'scale' | 'combo' | 'typing' | 'tooluse'>('current');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I know medical appointments can bring up questions and maybe some nerves. I'm Dr. Johnson's assistant, and I'm here to help you feel more prepared and at ease. I can answer questions about what to expect, help you organize your concerns, or just listen to what's on your mind. What would help you feel most ready for your visit?" }
  ]);
  const [typingContent, setTypingContent] = useState("");
  const [message, setMessage] = useState("");
  const [newMessageAppearing, setNewMessageAppearing] = useState(false);
  const [showTypingCursor, setShowTypingCursor] = useState(false);

  // Demo data
  const doctorConfig = {
    name: "Dr. Johnson",
    title: "Dr. Johnson",
    accentColor: '#5BBAD5',
    logoUrl: null,
    specialty: 'General Practice',
  };

  const demos = {
    current: {
      title: "Current (Baseline)",
      description: "Standard dots, no message animations"
    },
    slidein: {
      title: "Message Slide-in",
      description: "Messages appear with subtle upward slide"
    },
    fadein: {
      title: "Message Fade-in",
      description: "Messages appear with gentle opacity transition"
    },
    scale: {
      title: "Message Scale-in",
      description: "Messages appear with subtle scale animation"
    },
    combo: {
      title: "Slide + Scale Combo",
      description: "Combines slide-in and scale-in together"
    },
    typing: {
      title: "Typing Cursor Effect",
      description: "Shows blinking cursor while AI is typing"
    },
    tooluse: {
      title: "Tool Use Loading",
      description: "Enhanced loading for longer AI tool calls"
    }
  };

  const handleDemo = async (demoType: typeof currentDemo) => {
    if (isAiTyping) return;
    
    setCurrentDemo(demoType);
    setIsAiTyping(true);
    setTypingContent("");
    setNewMessageAppearing(false);
    setShowTypingCursor(false);

    // Add user message first (with animation based on demo type)
    const userMessage = "I'm nervous about my blood pressure check today. What should I expect?";
    const newMessages = [...messages, { role: "user", content: userMessage }];
    
    // Animate user message appearance
    if (demoType !== 'current') {
      setNewMessageAppearing(true);
      setTimeout(() => setNewMessageAppearing(false), 400);
    }
    
    setMessages(newMessages);

    // Demo responses - same timing for all (1.8s)
    const response = "I understand your concern about the blood pressure check. It's completely normal to feel nervous, and I'm here to help ease those worries. The process is quick and painless - just a cuff around your arm that inflates briefly. Would you like me to walk you through exactly what happens during the measurement?";

    // Show typing cursor for typing demo
    if (demoType === 'typing') {
      setShowTypingCursor(true);
    }

    // Wait for loading animation - longer for tool use
    const loadingTime = demoType === 'tooluse' ? 3500 : 1800;
    await new Promise(resolve => setTimeout(resolve, loadingTime));
    
    // Start AI response with appropriate animation
    if (demoType !== 'current') {
      setNewMessageAppearing(true);
    }
    
    await typeResponse(response, demoType);
    
    setIsAiTyping(false);
    setNewMessageAppearing(false);
    setShowTypingCursor(false);
  };

  const typeResponse = async (responseContent: string, demoType: typeof currentDemo) => {
    // Add empty assistant message
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);
    
    let index = 0;
    const typingSpeed = 15;
    
    return new Promise<void>((resolve) => {
      const typeChar = () => {
        if (index < responseContent.length) {
          setTypingContent(responseContent.slice(0, index + 1));
          index++;
          setTimeout(typeChar, typingSpeed);
        } else {
          // Complete typing
          setMessages(prev => prev.map((msg, i) => 
            i === prev.length - 1 ? { ...msg, content: responseContent } : msg
          ));
          setTypingContent("");
          resolve();
        }
      };
      typeChar();
    });
  };

  const resetDemo = () => {
    setMessages([
      { role: "assistant", content: "Hi! I know medical appointments can bring up questions and maybe some nerves. I'm Dr. Johnson's assistant, and I'm here to help you feel more prepared and at ease. I can answer questions about what to expect, help you organize your concerns, or just listen to what's on your mind. What would help you feel most ready for your visit?" }
    ]);
    setIsAiTyping(false);
    setTypingContent("");
    setNewMessageAppearing(false);
    setShowTypingCursor(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Animation Test Page</h1>
          <p className="text-gray-600">Compare different loading animation approaches for the chat interface</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 lg:p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Demo Selection Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Animation Demos</h2>
            <div className="space-y-3">
              {Object.entries(demos).map(([key, demo]) => (
                <button
                  key={key}
                  onClick={() => handleDemo(key as typeof currentDemo)}
                  disabled={isAiTyping}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    currentDemo === key 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } ${isAiTyping ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="font-medium text-gray-900">{demo.title}</div>
                  <div className="text-sm text-gray-600 mt-1">{demo.description}</div>
                </button>
              ))}
              
              <button
                onClick={resetDemo}
                disabled={isAiTyping}
                className="w-full mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset Demo
              </button>
            </div>
          </div>

          {/* Chat Interface Demo */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[500px] lg:h-[600px] flex flex-col">
              
              {/* Header */}
              <div className="px-6 pt-4 pb-0 bg-white border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
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
                    <div className="text-left">
                      <h2 className="text-base font-bold text-gray-900 leading-tight">
                        {doctorConfig.title}
                      </h2>
                      <p className="text-xs text-gray-600 font-medium">
                        {doctorConfig.specialty}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    Demo Mode
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-6 pt-4 pb-4 min-h-0 chat-messages">
                <div className="space-y-4">
                  {messages.map((msg, index) => {
                    const isNewMessage = newMessageAppearing && index === messages.length - 1;
                    const animationClass = 
                      currentDemo === 'slidein' && isNewMessage ? 'message-slide-in' :
                      currentDemo === 'fadein' && isNewMessage ? 'message-fade-in' :
                      currentDemo === 'scale' && isNewMessage ? 'message-scale-in' :
                      currentDemo === 'combo' && isNewMessage ? 'message-combo' : '';
                    
                    return (
                      <div 
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${animationClass}`}
                      >
                        <div 
                          className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                            msg.role === 'user' 
                              ? 'text-white rounded-br-md' 
                              : 'bg-gray-100 text-gray-800 rounded-bl-md'
                          }`}
                          style={msg.role === 'user' ? { backgroundColor: doctorConfig.accentColor } : {}}
                        >
                          <p className="text-sm leading-relaxed">
                            {index === messages.length - 1 && msg.role === 'assistant' && typingContent ? (
                              <>
                                {typingContent}
                                {currentDemo === 'typing' && showTypingCursor ? (
                                  <span className="typing-cursor ml-1 text-gray-600 font-bold">|</span>
                                ) : (
                                  <span className="animate-pulse ml-1 text-blue-600 font-bold">|</span>
                                )}
                              </>
                            ) : (
                              msg.content
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Loading States - Current typing dots animation for all demos */}
                  {isAiTyping && !typingContent && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                        <div className="flex items-center space-x-1">
                          <div className="typing-dot w-2 h-2 bg-gray-500 rounded-full" style={{ animationDelay: '0ms' }}></div>
                          <div className="typing-dot w-2 h-2 bg-gray-500 rounded-full" style={{ animationDelay: '200ms' }}></div>
                          <div className="typing-dot w-2 h-2 bg-gray-500 rounded-full" style={{ animationDelay: '400ms' }}></div>
                          {currentDemo === 'tooluse' && (
                            <span className="text-xs text-gray-600 ml-3 font-medium">Using clinic tools...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Input Area */}
              <div className="sticky bottom-0 flex-shrink-0 px-6 py-4 bg-white border-t border-gray-100">
                <div className="flex gap-3 items-end">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-sm text-gray-900 placeholder-gray-500"
                    disabled={isAiTyping}
                  />
                  <button
                    disabled={isAiTyping || !message.trim()}
                    className="px-4 py-3 text-white rounded-2xl transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-w-[60px] hover:opacity-90"
                    style={{ backgroundColor: doctorConfig.accentColor }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Panel */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">UX Enhancement Analysis</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(demos).map(([key, demo]) => (
              <div key={key} className={`p-4 rounded-lg border ${
                currentDemo === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}>
                <h4 className="font-medium text-gray-900 text-sm mb-2">{demo.title}</h4>
                <p className="text-xs text-gray-600 mb-3">{demo.description}</p>
                
                {/* Analysis based on subtle improvements */}
                <div className="text-xs space-y-1">
                  {key === 'current' && (
                    <div className="space-y-1">
                      <div className="text-gray-600">• No message animations</div>
                      <div className="text-gray-600">• Standard dots only</div>
                      <div className="text-gray-600">• Baseline experience</div>
                    </div>
                  )}
                  {key === 'slidein' && (
                    <div className="space-y-1">
                      <div className="text-blue-600">• 8px upward slide</div>
                      <div className="text-blue-600">• 300ms duration</div>
                      <div className="text-blue-600">• Professional polish</div>
                    </div>
                  )}
                  {key === 'fadein' && (
                    <div className="space-y-1">
                      <div className="text-green-600">• Gentle opacity transition</div>
                      <div className="text-green-600">• Smooth appearance</div>
                      <div className="text-green-600">• Very subtle effect</div>
                    </div>
                  )}
                  {key === 'scale' && (
                    <div className="space-y-1">
                      <div className="text-purple-600">• Subtle scale from 95%</div>
                      <div className="text-purple-600">• Natural growing effect</div>
                      <div className="text-purple-600">• Draws attention gently</div>
                    </div>
                  )}
                  {key === 'combo' && (
                    <div className="space-y-1">
                      <div className="text-orange-600">• Slide + Scale together</div>
                      <div className="text-orange-600">• 8px slide + 95% scale</div>
                      <div className="text-orange-600">• Most polished effect</div>
                    </div>
                  )}
                  {key === 'typing' && (
                    <div className="space-y-1">
                      <div className="text-indigo-600">• Custom blinking cursor</div>
                      <div className="text-indigo-600">• More like real typing</div>
                      <div className="text-indigo-600">• Enhanced realism</div>
                    </div>
                  )}
                  {key === 'tooluse' && (
                    <div className="space-y-1">
                      <div className="text-red-600">• Same dots + contextual text</div>
                      <div className="text-red-600">• Longer duration (3.5s)</div>
                      <div className="text-red-600">• "Using clinic tools..." message</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">🎯 Design Philosophy</h4>
            <p className="text-sm text-gray-700">
              All improvements maintain the professional, medical-appropriate aesthetic while adding subtle enhancements 
              that improve user experience without being distracting or flashy. Each enhancement serves a specific 
              functional purpose rather than being purely decorative.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}