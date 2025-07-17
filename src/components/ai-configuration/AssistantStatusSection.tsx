"use client";

import { useState } from "react";
import { Play, MessageCircle, CheckCircle, AlertTriangle, Users, BarChart3, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ClinicData {
  id: number;
  practice_name: string;
  doctor_name: string;
  slug: string;
  specialty: string;
  primary_color: string;
  has_completed_setup: boolean;
}

interface AIConfiguration {
  system_prompt: string;
  tone: string;
  languages: string[];
  last_updated: string;
  version: number;
}

interface AssistantStatusSectionProps {
  clinicData: ClinicData | null;
  aiConfig: AIConfiguration | null;
}

export default function AssistantStatusSection({ clinicData, aiConfig }: AssistantStatusSectionProps) {
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleTestMessage = async () => {
    if (!testMessage.trim() || !clinicData) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai-configuration/test-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testMessage,
          clinic_slug: clinicData.slug,
          isPreview: true
        })
      });

      const data = await response.json();
      if (response.ok) {
        setTestResponse(data.response);
      } else {
        setTestResponse('Error generating test response. Please try again.');
      }
    } catch (error) {
      console.error('Error testing message:', error);
      setTestResponse('Error generating test response. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const sampleQuestions = [
    "What should I bring to my appointment?",
    "Do you accept my insurance?", 
    "What are your office hours?",
    "How do I schedule an appointment?",
    "What services do you offer?"
  ];

  const assistantStatus = clinicData?.has_completed_setup ? 'live' : 'setup_required';

  // Dynamic stats that show setup status rather than fake metrics
  const stats = {
    totalConversations: assistantStatus === 'live' ? 'Analytics Coming Soon' : 'Not Active',
    avgResponseTime: assistantStatus === 'live' ? 'Real-time' : 'N/A',
    satisfactionRate: assistantStatus === 'live' ? 'Monitoring' : 'N/A',
    activeToday: assistantStatus === 'live' ? 'Live' : 'Inactive'
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              assistantStatus === 'live' 
                ? 'bg-green-500' 
                : 'bg-orange-500'
            }`}>
              {assistantStatus === 'live' ? (
                <CheckCircle className="w-5 h-5 text-white" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Assistant Status</h2>
              <p className={`text-sm ${
                assistantStatus === 'live' 
                  ? 'text-green-200' 
                  : 'text-orange-200'
              }`}>
                {assistantStatus === 'live' 
                  ? 'Live & Responding to Patients' 
                  : 'Setup Required - Complete Clinic Intelligence'}
              </p>
            </div>
          </div>
          
          {assistantStatus === 'live' && (
            <Link
              href={`/chat?c=${clinicData?.slug}`}
              className="flex items-center space-x-2 bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Live Chat</span>
            </Link>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <MessageCircle className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-200">Total Conversations</span>
            </div>
            <div className="text-2xl font-semibold text-white">{stats.totalConversations}</div>
          </div>
          
          <div className="bg-white/5 border border-white/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="w-4 h-4 text-green-400" />
              <span className="text-sm text-blue-200">Avg Response Time</span>
            </div>
            <div className="text-2xl font-semibold text-white">{stats.avgResponseTime}</div>
          </div>
          
          <div className="bg-white/5 border border-white/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-blue-200">Satisfaction Rate</span>
            </div>
            <div className="text-2xl font-semibold text-white">{stats.satisfactionRate}</div>
          </div>
          
          <div className="bg-white/5 border border-white/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-blue-200">Active Today</span>
            </div>
            <div className="text-2xl font-semibold text-white">{stats.activeToday}</div>
          </div>
        </div>
      </div>

      {/* Quick Test Environment */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
            <Play className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white">Quick Test Environment</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-2">
                Test Message
              </label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={4}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                placeholder="Type a message to test your AI assistant..."
              />
            </div>

            <button
              onClick={handleTestMessage}
              disabled={!testMessage.trim() || isGenerating}
              className="w-full flex items-center justify-center space-x-2 bg-white text-blue-900 font-semibold px-4 py-3 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isGenerating ? 'Generating Response...' : 'Test Response'}</span>
            </button>

            {/* Sample Questions */}
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-2">
                Try these sample questions:
              </label>
              <div className="space-y-2">
                {sampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setTestMessage(question)}
                    className="w-full text-left p-3 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-sm text-blue-200"
                  >
                    &quot;{question}&quot;
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Test Response */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-2">
                AI Response
              </label>
              <div className="bg-white/5 border border-white/20 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
                {testResponse ? (
                  <div className="text-sm text-white whitespace-pre-wrap">
                    {testResponse}
                  </div>
                ) : (
                  <div className="text-sm text-blue-300 italic flex items-center justify-center h-full">
                    {isGenerating ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Generating response...</span>
                      </div>
                    ) : (
                      'AI response will appear here after testing'
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Current Configuration Preview */}
            <div className="bg-white/5 border border-white/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-white mb-2">Current Configuration</h4>
              <ul className="text-sm text-blue-200 space-y-1">
                <li>• Practice: {clinicData?.practice_name}</li>
                <li>• Doctor: {clinicData?.doctor_name}</li>
                <li>• Specialty: {clinicData?.specialty}</li>
                <li>• Tone: {aiConfig?.tone || 'Professional'}</li>
                <li>• Languages: {aiConfig?.languages?.join(', ') || 'English'}</li>
                <li>• Last Updated: {aiConfig?.last_updated ? new Date(aiConfig.last_updated).toLocaleDateString() : 'Never'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}