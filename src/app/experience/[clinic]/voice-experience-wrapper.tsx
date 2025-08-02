'use client';

import { useState, useEffect, useRef } from 'react';
import ChatInterface from '@/components/ChatInterface';
import { ConversationManager, ConversationConfig } from '@/lib/conversation-manager';

interface VoiceExperienceWrapperProps {
  clinicSlug: string;
}

type ExperiencePhase = 'welcome' | 'chat' | 'feedback' | 'complete';

interface TranscriptEntry {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ClinicData {
  practice_name: string;
  doctor_name?: string;
}

export default function VoiceExperienceWrapper({ clinicSlug }: VoiceExperienceWrapperProps) {
  const [currentPhase, setCurrentPhase] = useState<ExperiencePhase>('welcome');
  const [clinicData, setClinicData] = useState<ClinicData | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  
  const conversationManager = useRef<ConversationManager | null>(null);

  // Show content after a brief moment
  useEffect(() => {
    setTimeout(() => setShowContent(true), 300);
  }, []);

  // Fetch clinic data
  useEffect(() => {
    async function fetchClinicData() {
      try {
        console.log('🏥 Fetching clinic data for:', clinicSlug);
        const response = await fetch(`/api/providers/${clinicSlug}`);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Clinic data loaded:', data.clinic?.practice_name);
          setClinicData(data.clinic);
        } else {
          console.error('❌ Failed to fetch clinic data:', response.status);
        }
      } catch (error) {
        console.error('❌ Error fetching clinic data:', error);
      }
    }
    
    fetchClinicData();
  }, [clinicSlug]);

  // Voice toggle logic for dev
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

  // Initialize conversation manager
  useEffect(() => {
    const config: ConversationConfig = {
      clinicSlug,
      clinicName: clinicData?.practice_name,
      phase: currentPhase,
      onPhaseChange: setCurrentPhase,
      onTranscript: (text: string, isUser: boolean) => {
        console.log('💬 Transcript:', isUser ? '(User)' : '(AI)', text);
        
        // Handle special AI state messages
        if (!isUser && text.includes('[AI finished speaking - ready for response]')) {
          console.log('🎯 AI finished speaking, ready to listen');
          setIsSpeaking(false);
          return; // Don't add this to transcript
        }
        
        setTranscript(prev => [...prev, { text, isUser, timestamp: new Date() }]);
        
        // Set speaking state based on who is talking
        if (!isUser) {
          setIsSpeaking(true); // AI is speaking
        } else {
          setIsSpeaking(false); // User spoke, AI is done
        }
      },
      onError: setError
    };

    conversationManager.current = new ConversationManager(config);
    
    return () => {
      conversationManager.current?.stop();
    };
  }, [clinicSlug, clinicData, currentPhase]);

  const enableVoice = async () => {
    if (!conversationManager.current) return;
    // Only enable if toggle is on
    if (!isVoiceEnabled) return;
    
    const success = await conversationManager.current.initialize();
    if (success) {
      setError(null);
      await conversationManager.current.startConversation();
    }
  };

  const startListening = async () => {
    if (!conversationManager.current || !isVoiceEnabled) return;
    
    try {
      setIsListening(true);
      const userInput = await conversationManager.current.listen();
      
      // Handle user input based on current phase
      await handleUserInput(userInput);
    } catch (err) {
      setError(`Listening failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsListening(false);
    }
  };

  const handleUserInput = async (input: string) => {
    const lowercaseInput = input.toLowerCase();
    
    if (currentPhase === 'welcome') {
      if (lowercaseInput.includes('yes') || lowercaseInput.includes('continue') || lowercaseInput.includes('okay')) {
        setCurrentPhase('chat');
      } else if (lowercaseInput.includes('no') || lowercaseInput.includes('skip')) {
        setCurrentPhase('complete');
      }
    } else if (currentPhase === 'feedback') {
      // Store the feedback
      setFeedbackText(prev => prev + '\n' + input);
      
      // Move to completion after feedback
      setTimeout(() => setCurrentPhase('complete'), 2000);
    }
  };

  // Welcome Phase
  if (currentPhase === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        {/* Always show voice toggle */}
        <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 1000 }}>
          <label style={{ fontSize: 14, fontWeight: 500 }}>
            <input type="checkbox" checked={isVoiceEnabled} onChange={handleVoiceToggle} />
            &nbsp;Enable ElevenLabs Voice
          </label>
        </div>
        <div className={`max-w-3xl w-full text-center transition-all duration-1000 ${
          showContent ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}>
          
          {/* Header */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-blue-500 rounded-full flex items-center justify-center shadow-xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a5 5 0 1110 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI Voice Assistant Study
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              You&apos;re about to experience the future of healthcare communication
            </p>
          </div>

          {/* Voice Transcript */}
          {transcript.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-8 text-left max-h-60 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Conversation</h3>
              {transcript.map((entry, index) => (
                <div key={index} className={`mb-2 p-2 rounded-lg ${
                  entry.isUser ? 'bg-blue-100 ml-8' : 'bg-gray-100 mr-8'
                }`}>
                  <span className="text-sm font-medium">
                    {entry.isUser ? 'You' : 'AI Assistant'}:
                  </span>
                  <p className="text-sm mt-1">{entry.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-300 rounded-2xl p-4 mb-6">
              <p className="text-red-700">{error}</p>
              <p className="text-sm text-red-600 mt-2">You can still continue with the text-based experience.</p>
            </div>
          )}

          {/* Voice Controls */}
          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Ready to start?</h2>
            
            {!isVoiceEnabled ? (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  This study uses voice interaction. Click below to enable your microphone and begin.
                </p>
                <button
                  onClick={enableVoice}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  🎤 Enable Voice & Start Study
                </button>
                <p className="text-sm text-gray-500">
                  We&apos;ll ask for microphone permission to begin the voice experience
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  {isSpeaking && (
                    <div className="flex items-center text-blue-600 text-lg">
                      <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse mr-2"></div>
                      AI is speaking...
                    </div>
                  )}
                  
                  {!isSpeaking && (
                    <div className="text-center">
                      <p className="text-gray-700 mb-4">Ready for your response!</p>
                      <button
                        onClick={startListening}
                        disabled={isListening}
                        className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 ${
                          isListening
                            ? 'bg-red-500 text-white animate-pulse shadow-lg'
                            : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        }`}
                      >
                        {isListening ? '🎤 Listening...' : '🎤 Say "Yes" to Continue'}
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-6 mt-6 text-center">
                  <p className="text-sm text-gray-600 mb-3">Or use these options:</p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setCurrentPhase('chat')}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200"
                    >
                      Continue to Chat
                    </button>
                    <button
                      onClick={() => setCurrentPhase('chat')}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                    >
                      Skip Voice
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500">
            This experience will take about 5 minutes
          </p>
        </div>
      </div>
    );
  }

  // Chat Phase - Use existing ChatInterface with voice overlay
  if (currentPhase === 'chat') {
    return (
      <div className="min-h-screen bg-white relative">
        {/* Progress bar */}
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
          <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: '50%' }} />
        </div>
        
        {/* Voice controls overlay */}
        {isVoiceEnabled && (
          <div className="fixed top-6 right-6 z-40 bg-white rounded-full shadow-lg p-3">
            <div className="flex items-center space-x-2">
              {isSpeaking && (
                <div className="flex items-center text-blue-600 text-sm">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-2"></div>
                  AI speaking
                </div>
              )}
              
              {!isSpeaking && (
                <button
                  onClick={startListening}
                  disabled={isListening}
                  className={`text-sm px-3 py-2 rounded-full transition-all ${
                    isListening
                      ? 'bg-red-100 text-red-600 animate-pulse'
                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                >
                  {isListening ? 'Listening...' : '🎤 Voice'}
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Continue button */}
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setCurrentPhase('feedback')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Continue to feedback →
          </button>
        </div>

        {/* Chat interface */}
        <div className="pt-1">
          <ChatInterface 
            clinic={clinicSlug}
            providerId={null}
          />
        </div>
      </div>
    );
  }

  // Feedback Phase
  if (currentPhase === 'feedback') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-blue-500 rounded-full transition-all duration-300" style={{ width: '75%' }} />
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">Step 2 of 3</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How was that experience?</h2>
            
            {/* Voice Transcript for Feedback */}
            {transcript.filter(t => t.isUser && currentPhase === 'feedback').length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Your voice feedback:</h3>
                {transcript
                  .filter(t => t.isUser)
                  .slice(-3) // Show last 3 user inputs
                  .map((entry, index) => (
                    <p key={index} className="text-blue-800 text-sm">&quot;{entry.text}&quot;</p>
                  ))}
              </div>
            )}

            <div className="space-y-6">
              {/* Voice feedback option */}
              {isVoiceEnabled && (
                <div className="border rounded-lg p-4">
                  <p className="text-lg font-medium text-gray-900 mb-4">Share your thoughts by voice:</p>
                  <div className="flex justify-center">
                    <button
                      onClick={startListening}
                      disabled={isListening}
                      className={`px-6 py-3 rounded-lg font-medium transition-all ${
                        isListening
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {isListening ? '🎤 Recording...' : '🎤 Record Voice Feedback'}
                    </button>
                  </div>
                </div>
              )}

              {/* Text feedback option */}
              <div>
                <p className="text-lg font-medium text-gray-900 mb-4">Or type your thoughts:</p>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us what you thought about the AI assistant experience..."
                  className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                />
              </div>

              <button
                onClick={() => setCurrentPhase('complete')}
                className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200"
              >
                Submit feedback
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Completion Phase
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        {/* Success animation */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center shadow-xl">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Thank you! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            You&apos;ve completed the AI voice assistant study. Your participation helps us improve healthcare for everyone.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">What happens next?</h2>
          <div className="text-left space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-700">Continue with your normal check-in process</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-700">Your feedback helps improve this AI assistant experience</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-700">You&apos;re helping shape the future of healthcare AI</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => window.location.href = `/${clinicSlug}`}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200"
        >
          Continue to clinic
        </button>
      </div>
    </div>
  );
}