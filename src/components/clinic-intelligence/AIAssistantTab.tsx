"use client";

import { useState } from "react";
import { Bot, Play, Settings, MessageCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ClinicData {
  id: number;
  practice_name: string;
  doctor_name: string;
  slug: string;
  specialty: string;
  primary_color: string;
}

interface AIAssistantTabProps {
  clinicData: ClinicData | null;
}

export default function AIAssistantTab({ clinicData }: AIAssistantTabProps) {
  const [assistantSettings] = useState({
    tone: 'professional',
    languages: ['English'],
    customInstructions: '',
    isEnabled: true
  });

  const [previewMessage, setPreviewMessage] = useState('');
  const [previewResponse, setPreviewResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePreview = async () => {
    if (!previewMessage.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: previewMessage,
          clinic_slug: clinicData?.slug,
          isPreview: true
        })
      });

      const data = await response.json();
      if (response.ok) {
        setPreviewResponse(data.response);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      setPreviewResponse('Error generating response. Please try again.');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">AI Assistant Configuration</h2>
          </div>
          <Link
            href="/dashboard/customize"
            className="flex items-center space-x-2 bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Advanced Settings</span>
          </Link>
        </div>

        <div className="text-center py-12">
          <Bot className="w-16 h-16 text-blue-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">AI Assistant Configuration</h3>
          <p className="text-blue-200 mb-6 max-w-md mx-auto">
            Configure your AI assistant&apos;s personality and behavior through our comprehensive customization system.
          </p>
          <Link
            href="/dashboard/customize"
            className="inline-flex items-center space-x-2 bg-white text-blue-900 font-semibold px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Bot className="w-5 h-5" />
            <span>Configure AI Assistant</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <Play className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white">Live Preview</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-2">
                Test Message
              </label>
              <textarea
                value={previewMessage}
                onChange={(e) => setPreviewMessage(e.target.value)}
                rows={4}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="Type a message to test your AI assistant..."
              />
            </div>

            <button
              onClick={handlePreview}
              disabled={!previewMessage.trim() || isGenerating}
              className="w-full flex items-center justify-center space-x-2 bg-white text-blue-900 font-semibold px-4 py-3 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isGenerating ? 'Generating...' : 'Test Response'}</span>
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
                    onClick={() => setPreviewMessage(question)}
                    className="w-full text-left p-3 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-sm text-blue-200"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview Response */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-2">
                AI Response
              </label>
              <div className="bg-white/5 border border-white/20 rounded-lg p-4 min-h-[200px]">
                {previewResponse ? (
                  <div className="text-sm text-white whitespace-pre-wrap">
                    {previewResponse}
                  </div>
                ) : (
                  <div className="text-sm text-blue-300 italic">
                    {isGenerating ? 'Generating response...' : 'AI response will appear here'}
                  </div>
                )}
              </div>
            </div>

            {/* Assistant Info */}
            <div className="bg-white/5 border border-white/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-white mb-2">Current Assistant Configuration</h4>
              <ul className="text-sm text-blue-200 space-y-1">
                <li>• Practice: {clinicData?.practice_name}</li>
                <li>• Primary Doctor: {clinicData?.doctor_name}</li>
                <li>• Specialty: {clinicData?.specialty}</li>
                <li>• Tone: {assistantSettings.tone}</li>
                <li>• Languages: {assistantSettings.languages.join(', ')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/dashboard/customize"
            className="flex items-center space-x-3 p-4 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Settings className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-sm font-medium text-white">Assistant Settings</div>
              <div className="text-xs text-blue-200">Tone, languages, instructions</div>
            </div>
          </Link>
          
          <Link
            href={`/chat?c=${clinicData?.slug}`}
            className="flex items-center space-x-3 p-4 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
          >
            <MessageCircle className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-sm font-medium text-white">Test Live Chat</div>
              <div className="text-xs text-blue-200">Full patient experience</div>
            </div>
          </Link>
          
          <button className="flex items-center space-x-3 p-4 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-left">
            <Bot className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-sm font-medium text-white">Export Configuration</div>
              <div className="text-xs text-blue-200">Download settings backup</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}