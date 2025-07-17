"use client";

import { useState, useEffect } from "react";
import { Bot, Brain, TestTube, Settings, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

interface AIConfigData {
  system_prompt: string;
  tone: string;
  languages: string[];
  last_updated: string;
  version: number;
  fallback_responses: {
    uncertain: string;
    after_hours: string;
    emergency: string;
  };
}

export default function AIConfigurationCard() {
  const [aiConfig, setAIConfig] = useState<AIConfigData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAIConfiguration();
  }, []);

  const fetchAIConfiguration = async () => {
    try {
      const response = await fetch('/api/ai-configuration/settings');
      const data = await response.json();
      
      if (response.ok) {
        setAIConfig(data.config);
      } else {
        console.error('Failed to fetch AI configuration:', data.error);
      }
    } catch (error) {
      console.error('Error fetching AI configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfigurationStatus = () => {
    if (!aiConfig) return { status: 'incomplete', message: 'Not configured', color: 'text-red-400' };
    
    const hasSystemPrompt = aiConfig.system_prompt && aiConfig.system_prompt.trim().length > 0;
    const hasTone = aiConfig.tone && aiConfig.tone !== '';
    const hasLanguages = aiConfig.languages && aiConfig.languages.length > 0;
    
    if (hasSystemPrompt && hasTone && hasLanguages) {
      return { status: 'complete', message: 'Fully configured', color: 'text-green-400' };
    } else {
      return { status: 'partial', message: 'Partially configured', color: 'text-orange-400' };
    }
  };

  const configStatus = getConfigurationStatus();

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-6 bg-white/20 rounded w-48"></div>
              <div className="h-4 bg-white/20 rounded w-64"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-20 bg-white/20 rounded"></div>
            <div className="h-10 bg-white/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">AI Configuration</h2>
            <p className="text-blue-200 text-sm">Configure your AI assistant's behavior and personality</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {configStatus.status === 'complete' ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-orange-400" />
          )}
          <span className={`text-sm font-medium ${configStatus.color}`}>
            {configStatus.message}
          </span>
        </div>
      </div>

      {/* Configuration Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white/5 border border-white/20 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <Brain className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-medium text-white">System Prompt</h3>
          </div>
          <p className="text-xs text-blue-200">
            {aiConfig?.system_prompt && aiConfig.system_prompt.trim().length > 0 
              ? `${aiConfig.system_prompt.length} characters configured`
              : 'Not configured'
            }
          </p>
          <p className="text-xs text-blue-300 mt-1">
            {aiConfig?.last_updated 
              ? `Updated ${new Date(aiConfig.last_updated).toLocaleDateString()}`
              : 'Never updated'
            }
          </p>
        </div>

        <div className="bg-white/5 border border-white/20 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <Settings className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-medium text-white">Personality</h3>
          </div>
          <p className="text-xs text-blue-200 capitalize">
            Tone: {aiConfig?.tone || 'Not set'}
          </p>
          <p className="text-xs text-blue-300 mt-1">
            Languages: {aiConfig?.languages?.join(', ') || 'None'}
          </p>
        </div>

        <div className="bg-white/5 border border-white/20 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <TestTube className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-medium text-white">Advanced</h3>
          </div>
          <p className="text-xs text-blue-200">
            Version: {aiConfig?.version || 1}
          </p>
          <p className="text-xs text-blue-300 mt-1">
            Fallback responses: {aiConfig?.fallback_responses ? 'Configured' : 'Default'}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link
          href="/dashboard/ai-configuration"
          className="flex items-center space-x-3 p-4 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors group"
        >
          <Brain className="w-5 h-5 text-purple-400" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white">System Prompt</div>
            <div className="text-xs text-blue-200">Configure AI behavior</div>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/dashboard/ai-configuration"
          className="flex items-center space-x-3 p-4 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors group"
        >
          <Settings className="w-5 h-5 text-green-400" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white">Personality</div>
            <div className="text-xs text-blue-200">Tone & language settings</div>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/dashboard/ai-configuration"
          className="flex items-center space-x-3 p-4 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors group"
        >
          <TestTube className="w-5 h-5 text-orange-400" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white">Test Assistant</div>
            <div className="text-xs text-blue-200">Live testing environment</div>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/dashboard/ai-configuration"
          className="flex items-center space-x-3 p-4 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors group"
        >
          <Bot className="w-5 h-5 text-blue-400" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white">Advanced Settings</div>
            <div className="text-xs text-blue-200">Fallbacks & history</div>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Main CTA */}
      <div className="text-center">
        <Link
          href="/dashboard/ai-configuration"
          className="inline-flex items-center space-x-2 bg-white text-blue-900 font-semibold px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Bot className="w-5 h-5" />
          <span>Configure AI Assistant</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {!aiConfig && (
        <div className="mt-4 bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-200">
            ✨ <strong>Get started:</strong> Configure your AI assistant's personality, behavior, and responses to create a unique experience for your patients.
          </p>
        </div>
      )}
    </div>
  );
}