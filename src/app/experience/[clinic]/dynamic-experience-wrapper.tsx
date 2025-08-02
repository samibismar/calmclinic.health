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
              .filter((p: any) => p.is_active)
              .slice(0, 4) // Limit to 4 options
              .map((p: any) => ({
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
        return ['Yes, I can hear you clearly', 'I\'m ready to start'];
        
      case 'explaining_study':
        return ['That sounds helpful', 'I\'d like to try it', 'I have questions'];
        
      case 'getting_consent':
        return ['Yes, let\'s try it', 'Sure, I\'ll participate', 'I have questions first'];
        
      case 'answering_questions':
        return ['I\'m ready to try it', 'Let\'s begin', 'I understand now'];
        
      case 'assistant_demo':
        // Support proactive value demonstration flow
        if (userInteractionCount === 0) {
          // First interaction - encourage engagement or trigger demo
          return ['I don\'t really have anything to ask', 'What should I expect at my appointment?', 'How can you help me?'];
        } else if (lastAIMessage.toLowerCase().includes('show you') || lastAIMessage.toLowerCase().includes('demonstrate')) {
          // AI is offering to demonstrate capabilities
          return ['Yes, show me that', 'That sounds helpful', 'What else can you do?'];
        } else if (lastAIMessage.toLowerCase().includes('anything else') || lastAIMessage.toLowerCase().includes('other')) {
          // AI is checking if they need more help
          return ['No, I think I\'m prepared', 'Yes, one more thing', 'That was really helpful'];
        } else if (lastAIMessage.toLowerCase().includes('questions for') || lastAIMessage.toLowerCase().includes('discuss with')) {
          // AI suggested questions for the doctor
          return ['That\'s a good suggestion', 'What other questions should I ask?', 'I\'ll remember to ask that'];
        } else {
          // General walkthrough responses
          return ['Tell me more about that', 'What else should I know?', 'How does that work?'];
        }
        
      case 'collecting_feedback':
        // Support specific feedback questions
        if (lastAIMessage.toLowerCase().includes('helpful today')) {
          return ['Yes, very helpful', 'It was somewhat helpful', 'Not really helpful'];
        } else if (lastAIMessage.toLowerCase().includes('use this again')) {
          return ['Yes, I\'d definitely use it again', 'Maybe, depending on the situation', 'Probably not'];
        } else if (lastAIMessage.toLowerCase().includes('do better') || lastAIMessage.toLowerCase().includes('improve')) {
          return ['It was great as is', 'Maybe respond faster', 'More personalized advice'];
        } else {
          // General feedback responses
          return ['It was easy to use', 'This would reduce my anxiety', 'I\'d recommend this to others'];
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
          <div className="mb-8">
            <div className="w-16 h-16 mx-auto mb-6 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.419L3 21l2.419-5.094A8.959 8.959 0 013 12a8 8 0 018-8 8 8 0 018 8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Welcome to {clinicData?.name || 'your clinic'}
            </h1>
            <p className="text-gray-600">
              I'm your AI assistant, here to help guide you through your visit today
            </p>
          </div>

          {/* Voice Toggle */}
          <div className="mb-8">
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="flex items-center justify-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isVoiceEnabled} 
                  onChange={handleVoiceToggle}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="font-medium text-gray-700">
                  {isVoiceEnabled ? '🎤 Voice conversation' : '💬 Text conversation'}
                </span>
              </label>
              <p className="text-sm text-gray-500 mt-2">
                {isVoiceEnabled 
                  ? 'We\'ll have a natural voice conversation together' 
                  : 'We\'ll chat by typing back and forth'}
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
            className="w-full px-8 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-xl transition-colors"
          >
            {isVoiceEnabled ? '🎤 Start talking with me' : '💬 Start chatting with me'}
          </button>
          
          <p className="text-sm text-gray-500 mt-4">
            Takes about 5 minutes
          </p>
        </div>
      </div>
    );
  }

  // Main conversation interface
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="font-medium text-gray-700">
              {conversationState === 'selecting_provider' ? 'Selecting Your Provider' : 
               conversationState === 'explaining_study' ? 'Explaining the Study' :
               conversationState === 'getting_consent' ? 'Getting Your Consent' :
               conversationState === 'answering_questions' ? 'Answering Your Questions' :
               conversationState === 'assistant_demo' ? 'AI Assistant Demo' :
               conversationState === 'collecting_feedback' ? 'Collecting Your Feedback' :
               conversationState === 'complete' ? 'Experience Complete' : 'In Conversation'}
            </span>
          </div>
          
          {/* Voice Toggle */}
          <label className="flex items-center text-sm text-gray-500 cursor-pointer">
            <input 
              type="checkbox" 
              checked={isVoiceEnabled} 
              onChange={handleVoiceToggle}
              className="mr-2 w-3 h-3"
            />
            Voice
          </label>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.419L3 21l2.419-5.094A8.959 8.959 0 013 12a8 8 0 018-8 8 8 0 018 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Hello there!</h2>
              <p className="text-gray-600 mb-4">I'm here to help you with your visit today</p>
              <div className="text-sm text-gray-500">
                {isVoiceEnabled ? "🎤 I can hear you when you speak" : "💬 Type to chat with me"}
              </div>
            </div>
          )}
          
          {/* Messages */}
          <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start space-x-3">
                {message.role === 'ai' && (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                )}
                
                <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block max-w-lg p-4 rounded-2xl ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white ml-auto' 
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100'
                  }`}>
                    <p className="text-base leading-relaxed">{message.content}</p>
                  </div>
                </div>
                
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="px-4 pb-6">
        <div className="max-w-2xl mx-auto">
          
          {/* Status */}
          <div className="text-center mb-4">
            {isSpeaking && <p className="text-blue-600 font-medium">🔊 Speaking...</p>}
            {isListening && <p className="text-green-600 font-medium">🎤 Listening...</p>}
            {!isSpeaking && !isListening && conversationState !== 'complete' && (
              <p className="text-gray-500">Ready</p>
            )}
          </div>

          {/* Provider Selection */}
          {conversationState === 'selecting_provider' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium text-gray-800">
                  Which provider are you here to see?
                </h3>
              </div>
              
              <div className="space-y-2">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => selectProvider(provider.name, provider.id)}
                    className="w-full p-4 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl text-left transition-colors"
                  >
                    <p className="font-medium text-gray-800">{provider.name}</p>
                    {provider.specialty && (
                      <p className="text-sm text-gray-600">{provider.specialty}</p>
                    )}
                  </button>
                ))}
                
                <button
                  onClick={() => selectProvider('your healthcare provider')}
                  className="w-full p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-left transition-colors"
                >
                  <p className="font-medium text-gray-700">I'm not sure</p>
                  <p className="text-sm text-gray-500">I'll figure it out during my visit</p>
                </button>
              </div>
            </div>
          )}

          {/* Text Input */}
          {!isVoiceEnabled && conversationState !== 'complete' && conversationState !== 'selecting_provider' && (
            <div className="space-y-4">
              {/* Quick Response Buttons */}
              <div className="flex flex-wrap gap-2 justify-center">
                {getQuickResponses(conversationState).map((response, index) => (
                  <button
                    key={index}
                    onClick={() => sendResponse(response)}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-full text-sm font-medium text-blue-700 transition-colors"
                  >
                    {response}
                  </button>
                ))}
              </div>
              
              {/* Text Input */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Type your response..."
                    className="flex-1 px-4 py-3 bg-transparent text-base placeholder-gray-400 focus:outline-none"
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
                    className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Completion State */}
          {conversationState === 'complete' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">All done!</h3>
              <p className="text-gray-600 mb-6">Thank you for chatting with me today</p>
              <button
                onClick={() => window.location.href = `/${clinicSlug}`}
                className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
              >
                Continue to your visit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}