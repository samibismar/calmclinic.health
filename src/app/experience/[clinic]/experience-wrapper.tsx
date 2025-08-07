'use client';

import { useState, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';

interface ExperienceWrapperProps {
  clinicSlug: string;
}

type ExperiencePhase = 'welcome' | 'chat' | 'feedback' | 'complete';

export default function ExperienceWrapper({ clinicSlug }: ExperienceWrapperProps) {
  const [currentPhase, setCurrentPhase] = useState<ExperiencePhase>('welcome');
  const [showContent, setShowContent] = useState(false);

  // Show content after a brief moment
  useEffect(() => {
    setTimeout(() => setShowContent(true), 300);
  }, []);

  // Welcome Phase
  if (currentPhase === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className={`max-w-2xl w-full text-center transition-all duration-1000 ${
          showContent ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}>
          
          {/* Header */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-blue-500 rounded-full flex items-center justify-center shadow-xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Your AI Assistant Experience
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              You&apos;re about to try something special - an AI assistant designed to help you prepare for your appointment.
            </p>
          </div>

          {/* What to expect */}
          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8 text-left">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">What to expect:</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                <p className="text-gray-700"><strong>Chat with the AI</strong> - Ask questions about your appointment, symptoms, or concerns</p>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-semibold">2</span>
                </div>
                <p className="text-gray-700"><strong>Share feedback</strong> - Tell us about your experience to help us improve</p>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-semibold">3</span>
                </div>
                <p className="text-gray-700"><strong>Get prepared</strong> - Feel more confident and ready for your visit</p>
              </div>
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={() => setCurrentPhase('chat')}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Let&apos;s start! ✨
          </button>
          
          <p className="text-sm text-gray-500 mt-4">
            This will take about 5 minutes
          </p>
        </div>
      </div>
    );
  }

  // Chat Phase - Use existing ChatInterface
  if (currentPhase === 'chat') {
    return (
      <div className="min-h-screen bg-white relative">
        {/* Progress bar */}
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
          <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: '50%' }} />
        </div>
        
        {/* Floating next button */}
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
            
            <div className="space-y-6">
              {/* Quick rating */}
              <div>
                <p className="text-lg font-medium text-gray-900 mb-4">How helpful was the AI assistant?</p>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      className="w-12 h-12 rounded-full border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-200 font-semibold"
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick feedback */}
              <div>
                <p className="text-lg font-medium text-gray-900 mb-4">Any thoughts to share?</p>
                <textarea
                  placeholder="Tell us what you thought..."
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
            You&apos;ve completed the AI assistant experience. Your feedback helps us make healthcare better for everyone.
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
              <p className="text-gray-700">Your responses help improve this experience</p>
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