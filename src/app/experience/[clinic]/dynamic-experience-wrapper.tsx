'use client';

import { useState, useEffect, useRef } from 'react';
import { DynamicConversationEngine, ConversationState, ConversationMessage, ConversationConfig } from '@/lib/dynamic-conversation-engine';

interface DynamicExperienceWrapperProps {
  clinicSlug: string;
}

interface ClinicData {
  name: string;
  doctor_name?: string;
}

interface Provider {
  id: string;
  name: string;
  specialty?: string;
}

interface ApiProvider {
  id: string;
  name: string;
  specialty?: string;
  is_active: boolean;
  [key: string]: unknown;
}

export default function DynamicExperienceWrapper({ clinicSlug }: DynamicExperienceWrapperProps) {
  const [clinicData, setClinicData] = useState<ClinicData | null>(null);
  const [conversationState, setConversationState] = useState<ConversationState>('initializing');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  
  const conversationEngine = useRef<DynamicConversationEngine | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice toggle logic
  useEffect(() => {
    const envVoice = process.env.NEXT_PUBLIC_ENABLE_11LABS_VOICE === 'true';
    const stored = localStorage.getItem('voiceEnabled');
    setIsVoiceEnabled(stored ? stored === 'true' : envVoice);
  }, []);

  const handleVoiceToggle = () => {
    setIsVoiceEnabled((prev) => {
      localStorage.setItem('voiceEnabled', String(!prev));
      return !prev;
    });
  };

  // Fetch clinic data
  useEffect(() => {
    async function fetchClinicData() {
      try {
        console.log('🏥 Fetching clinic data for:', clinicSlug);
        const response = await fetch(`/api/providers/${clinicSlug}`);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Clinic data loaded:', data.clinic?.name);
          setClinicData(data.clinic);
          
          // Load providers for this clinic
          if (data.providers && Array.isArray(data.providers)) {
            const activeProviders = data.providers
              .filter((p: ApiProvider) => p.is_active)
              .slice(0, 4) // Limit to 4 options
              .map((p: ApiProvider) => ({
                id: p.id,
                name: p.name,
                specialty: p.specialty
              }));
            setProviders(activeProviders);
          }
        } else {
          console.error('❌ Failed to fetch clinic data:', response.status);
          setClinicData({ name: 'the clinic' });
        }
      } catch (error) {
        console.error('❌ Error fetching clinic data:', error);
        setClinicData({ name: 'the clinic' });
      }
    }
    
    fetchClinicData();
  }, [clinicSlug]);

  // Initialize conversation engine when clinic data is ready
  useEffect(() => {
    if (!clinicData || isInitialized) return;

    console.log('🏥 Initializing conversation engine with clinic:', clinicData.name);
    
    const config: ConversationConfig = {
      clinicSlug,
      clinicName: clinicData.name || 'your clinic',
      enableVoice: isVoiceEnabled,
      onStateChange: (state) => {
        console.log('🔄 Conversation state changed to:', state);
        setConversationState(state);
      },
      onConversationUpdate: (updatedMessages) => {
        setMessages(updatedMessages);
        // Auto-scroll to bottom when new messages arrive
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
      onError: setError
    };

    conversationEngine.current = new DynamicConversationEngine(config);
    
    return () => {
      conversationEngine.current?.stop();
    };
  }, [clinicData, clinicSlug, isInitialized, isVoiceEnabled]);

  // Monitor conversation engine state
  useEffect(() => {
    if (!conversationEngine.current) return;

    const checkState = () => {
      setIsListening(conversationEngine.current?.isCurrentlyListening() || false);
      setIsSpeaking(conversationEngine.current?.isCurrentlySpeaking() || false);
    };

    const interval = setInterval(checkState, 100);
    return () => clearInterval(interval);
  }, [isInitialized]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  const startExperience = async () => {
    if (!conversationEngine.current) return;
    
    try {
      setError(null);
      console.log('🚀 Starting dynamic conversation experience...');
      await conversationEngine.current.initialize();
      setIsInitialized(true);
    } catch (err) {
      console.error('❌ Failed to start experience:', err);
      setError(err instanceof Error ? err.message : 'Failed to start voice experience');
    }
  };

  const getQuickResponses = (state: ConversationState): string[] => {
    // Get the last AI message to make responses more contextual
    const lastAIMessage = messages.filter(m => m.role === 'ai').slice(-1)[0]?.content || '';
    const userInteractionCount = messages.filter(m => m.role === 'user' && m.content.trim()).length;
    
    switch (state) {
      case 'welcome':
        return ['Yeah, I can hear you perfectly!', 'Sounds great, let\'s do this', 'I\'m ready to start'];
        
      case 'explaining_study':
        return ['That sounds really helpful', 'I\'m interested', 'Tell me more', 'I have a quick question'];
        
      case 'getting_consent':
        return ['Yeah, let\'s try it!', 'Sure, sounds good', 'I\'m in', 'Actually, I have a question first'];
        
      case 'answering_questions':
        return ['Okay, I\'m ready now', 'Let\'s do this', 'Got it, let\'s start', 'Sounds good to me'];
        
      case 'assistant_demo':
        // Support proactive value demonstration flow
        if (userInteractionCount === 0) {
          // First interaction - encourage engagement or trigger demo
          return ['I honestly don\'t know what to ask', 'What should I expect today?', 'How does this work?', 'I\'m not sure what I need to know'];
        } else if (lastAIMessage.toLowerCase().includes('show you') || lastAIMessage.toLowerCase().includes('demonstrate')) {
          // AI is offering to demonstrate capabilities
          return ['Yes, show me!', 'That would be great', 'I\'d love to see that', 'What else can you do?'];
        } else if (lastAIMessage.toLowerCase().includes('anything else') || lastAIMessage.toLowerCase().includes('other')) {
          // AI is checking if they need more help
          return ['No, I think I\'m all set', 'Actually, yes - one more thing', 'This has been so helpful', 'I feel much more prepared now'];
        } else if (lastAIMessage.toLowerCase().includes('questions for') || lastAIMessage.toLowerCase().includes('discuss with')) {
          // AI suggested questions for the doctor
          return ['That\'s a really good point', 'What else should I ask?', 'I\'ll definitely bring that up', 'I wouldn\'t have thought of that'];
        } else {
          // General walkthrough responses
          return ['Tell me more', 'That\'s interesting', 'What else should I know?', 'How does that work?', 'Really?'];
        }
        
      case 'collecting_feedback':
        // Support specific feedback questions
        if (lastAIMessage.toLowerCase().includes('helpful today')) {
          return ['Yes, super helpful!', 'Yeah, it was really useful', 'It was okay', 'Honestly, not as much as I hoped'];
        } else if (lastAIMessage.toLowerCase().includes('use this again')) {
          return ['Absolutely, I\'d love this!', 'Yeah, this was great', 'Maybe for bigger appointments', 'Probably not for routine visits'];
        } else if (lastAIMessage.toLowerCase().includes('do better') || lastAIMessage.toLowerCase().includes('improve')) {
          return ['Honestly, it was pretty great', 'Maybe be a bit faster?', 'More specific to my situation', 'Nothing major - this was good'];
        } else {
          // General feedback responses
          return ['This was really easy to use', 'I feel way less anxious now', 'I\'d definitely recommend this', 'This is actually pretty cool'];
        }
        
      default:
        return ['Yes', 'No', 'Tell me more'];
    }
  };

  const sendResponse = (text: string) => {
    if (conversationEngine.current) {
      conversationEngine.current.sendTextInput(text);
    }
  };

  const selectProvider = (providerName: string, providerId?: string) => {
    if (conversationEngine.current) {
      conversationEngine.current.selectProvider(providerName, providerId);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center bg-white rounded-2xl p-8 shadow-lg">
          
          {/* Header */}
          <div className="mb-8 animate-fadeIn">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              <svg className="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.419L3 21l2.419-5.094A8.959 8.959 0 013 12a8 8 0 018-8 8 8 0 018 8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4 animate-slideUp">
              Hey there! Welcome to {clinicData?.name || 'your clinic'} 👋
            </h1>
            <p className="text-gray-600 text-lg animate-slideUp animation-delay-200">
              I&apos;m your friendly AI assistant - think of me as your prep buddy for today&apos;s visit!
            </p>
          </div>

          {/* Voice Toggle */}
          <div className="mb-8 animate-slideUp animation-delay-400">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-100 hover:border-blue-200 transition-all duration-300">
              <label className="flex items-center justify-center space-x-4 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={isVoiceEnabled} 
                    onChange={handleVoiceToggle}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <div className="absolute inset-0 bg-blue-500 rounded opacity-0 group-hover:opacity-10 transition-opacity"></div>
                </div>
                <span className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                  {isVoiceEnabled ? '🎤 Voice conversation' : '💬 Text conversation'}
                </span>
              </label>
              <p className="text-sm text-gray-600 mt-3 text-center">
                {isVoiceEnabled 
                  ? 'We\'ll have a natural voice conversation together ✨' 
                  : 'We\'ll chat by typing back and forth ✍️'}
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-700 font-medium">Voice setup needed</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <p className="text-red-600 text-sm">You can still continue with text conversation</p>
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={startExperience}
            disabled={!clinicData}
            className="w-full px-8 py-5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100 transition-all duration-300 animate-slideUp animation-delay-600"
          >
            <span className="flex items-center justify-center space-x-2">
              <span>{isVoiceEnabled ? '🎤 Start talking with me' : '💬 Start chatting with me'}</span>
              <span className="animate-bounce">✨</span>
            </span>
          </button>
          
          <p className="text-sm text-gray-500 mt-6 animate-fadeIn animation-delay-800">
            ⏱️ Takes about 5 minutes - you&apos;ll love this!
          </p>
        </div>
      </div>
    );
  }

  // Main conversation interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.6s ease-out;
        }
        .animate-bounce {
          animation: bounce 2s infinite;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        .animation-delay-800 {
          animation-delay: 0.8s;
        }
      `}</style>
      
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/50 px-6 py-5 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-full animate-pulse shadow-sm"></div>
            <span className="font-semibold text-gray-800 text-lg">
              {conversationState === 'selecting_provider' ? '👥 Selecting Your Provider' : 
               conversationState === 'explaining_study' ? '📝 Explaining the Study' :
               conversationState === 'getting_consent' ? '✅ Getting Your Consent' :
               conversationState === 'answering_questions' ? '❓ Answering Your Questions' :
               conversationState === 'assistant_demo' ? '🤖 AI Assistant Demo' :
               conversationState === 'collecting_feedback' ? '💬 Collecting Your Feedback' :
               conversationState === 'complete' ? '🎉 Experience Complete' : '💬 In Conversation'}
            </span>
          </div>
          
          {/* Voice Toggle */}
          <label className="flex items-center text-sm text-gray-600 cursor-pointer hover:text-blue-600 transition-colors">
            <input 
              type="checkbox" 
              checked={isVoiceEnabled} 
              onChange={handleVoiceToggle}
              className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="font-medium">{isVoiceEnabled ? '🎤' : '💬'} Voice</span>
          </label>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-2xl mx-auto">
          
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="text-center mb-8 animate-fadeIn">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-500">
                <svg className="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.419L3 21l2.419-5.094A8.959 8.959 0 013 12a8 8 0 018-8 8 8 0 018 8z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 animate-slideUp">Hey there! 👋</h2>
              <p className="text-gray-700 mb-4 text-lg animate-slideUp animation-delay-200">I&apos;m here to make your visit today awesome!</p>
              <div className="text-sm text-gray-600 bg-gray-100 rounded-full px-4 py-2 inline-block animate-slideUp animation-delay-400">
                {isVoiceEnabled ? "🎤 I can hear you when you speak" : "💬 Type to chat with me"}
              </div>
            </div>
          )}
          
          {/* Messages */}
          <div className="space-y-6 mb-8 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-gray-100 pr-2">
            {messages.map((message, index) => (
              <div key={message.id} className={`flex items-start space-x-4 animate-slideUp`} style={{animationDelay: `${index * 0.1}s`}}>
                {message.role === 'ai' && (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg transition-shadow">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                )}
                
                <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block max-w-lg p-5 rounded-3xl transform transition-all hover:scale-105 ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto shadow-lg' 
                      : 'bg-white text-gray-800 shadow-md border border-gray-100 hover:shadow-lg'
                  }`}>
                    <p className="text-base leading-relaxed">{message.content}</p>
                  </div>
                </div>
                
                {message.role === 'user' && (
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Bottom Input Area */}
      <div className="px-4 sm:px-6 pb-6 bg-white/80 backdrop-blur-sm border-t border-gray-200/50">
        <div className="max-w-2xl mx-auto pt-4">
          
          {/* Status */}
          <div className="text-center mb-6">
            {isSpeaking && (
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full animate-pulse">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <span className="font-semibold">🔊 AI is speaking...</span>
              </div>
            )}
            {isListening && (
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-full animate-pulse">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                <span className="font-semibold">🎤 Listening to you...</span>
              </div>
            )}
            {!isSpeaking && !isListening && conversationState !== 'complete' && (
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">✨ Ready to chat!</span>
              </div>
            )}
          </div>

          {/* Provider Selection */}
          {conversationState === 'selecting_provider' && (
            <div className="space-y-6 animate-slideUp">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  👩‍⚕️ Which provider are you here to see?
                </h3>
                <p className="text-gray-600">This helps me give you the most relevant prep tips!</p>
              </div>
              
              <div className="space-y-3">
                {providers.map((provider, index) => (
                  <button
                    key={provider.id}
                    onClick={() => selectProvider(provider.name, provider.id)}
                    className="w-full p-5 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 border border-gray-200 hover:border-blue-300 rounded-2xl text-left transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 animate-slideUp"
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    <p className="font-bold text-gray-800 text-lg">{provider.name}</p>
                    {provider.specialty && (
                      <p className="text-sm text-gray-600 mt-1">🩺 {provider.specialty}</p>
                    )}
                  </button>
                ))}
                
                <button
                  onClick={() => selectProvider('your healthcare provider')}
                  className="w-full p-5 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 hover:border-gray-300 rounded-2xl text-left transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 animate-slideUp"
                  style={{animationDelay: `${providers.length * 0.1}s`}}
                >
                  <p className="font-bold text-gray-700">🤔 I&apos;m not sure</p>
                  <p className="text-sm text-gray-500 mt-1">I&apos;ll figure it out during my visit</p>
                </button>
              </div>
            </div>
          )}

          {/* Text Input */}
          {!isVoiceEnabled && conversationState !== 'complete' && conversationState !== 'selecting_provider' && (
            <div className="space-y-4">
              {/* Quick Response Buttons */}
              <div className="flex flex-wrap gap-3 justify-center mb-4">
                {getQuickResponses(conversationState).map((response, index) => (
                  <button
                    key={index}
                    onClick={() => sendResponse(response)}
                    className="px-5 py-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 hover:border-blue-300 rounded-full text-sm font-semibold text-blue-700 shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200 animate-slideUp"
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    {response}
                  </button>
                ))}
              </div>
              
              {/* Text Input */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2 hover:shadow-xl transition-shadow">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="Type your response... 😊"
                    className="flex-1 px-5 py-4 bg-transparent text-base placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 transition-colors"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget.value.trim();
                        if (input) {
                          sendResponse(input);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                      const text = input?.value.trim();
                      if (text) {
                        sendResponse(text);
                        input.value = '';
                      }
                    }}
                    className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Completion State */}
          {conversationState === 'complete' && (
            <div className="text-center animate-fadeIn">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-xl animate-bounce">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-3">🎉 All done!</h3>
              <p className="text-gray-700 mb-8 text-lg">Thanks for chatting with me - you&apos;re all set!</p>
              <button
                onClick={() => window.location.href = `/${clinicSlug}`}
                className="px-10 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                ✨ Continue to your visit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}