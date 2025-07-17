"use client";

import { useState, useEffect } from "react";
import { Bot, ExternalLink } from "lucide-react";
import Link from "next/link";

interface AIStatusData {
  system_prompt: string;
  tone: string;
  languages: string[];
  last_updated: string;
  version: number;
}

interface CompactAIStatusCardProps {
  viewChatUrl?: string;
}

export default function CompactAIStatusCard({ viewChatUrl }: CompactAIStatusCardProps) {
  const [aiStatus, setAIStatus] = useState<AIStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAIStatus();
  }, []);

  const fetchAIStatus = async () => {
    try {
      const response = await fetch('/api/ai-configuration/settings');
      const data = await response.json();
      
      if (response.ok) {
        setAIStatus(data.config);
      }
    } catch (error) {
      console.error('Error fetching AI status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = () => {
    if (!aiStatus) return { status: 'inactive', label: 'Not Setup', color: 'text-red-400', bgColor: 'bg-red-500' };
    
    const hasSystemPrompt = aiStatus.system_prompt && aiStatus.system_prompt.trim().length > 0;
    const hasTone = aiStatus.tone && aiStatus.tone !== '';
    const hasLanguages = aiStatus.languages && aiStatus.languages.length > 0;
    
    if (hasSystemPrompt && hasTone && hasLanguages) {
      return { status: 'active', label: 'Live', color: 'text-green-400', bgColor: 'bg-green-500' };
    } else {
      return { status: 'partial', label: 'Partial', color: 'text-orange-400', bgColor: 'bg-orange-500' };
    }
  };

  const statusInfo = getStatusInfo();

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 w-64">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-white/20 rounded w-3/4"></div>
          <div className="h-3 bg-white/20 rounded w-1/2"></div>
          <div className="h-8 bg-white/20 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 h-fit">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${statusInfo.bgColor}`}></div>
          <span className={`text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Status Info */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-200">Version</span>
          <span className="text-sm text-white font-medium">v{aiStatus?.version || 1}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-200">Tone</span>
          <span className="text-sm text-white font-medium capitalize">{aiStatus?.tone || 'Default'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-200">Languages</span>
          <span className="text-sm text-white font-medium">{aiStatus?.languages?.length || 1}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {viewChatUrl && (
          <Link
            href={viewChatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 bg-white text-blue-900 font-medium px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm"
          >
            <span>View Live Chat</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        )}
        
        <Link
          href="/dashboard/ai-configuration"
          className="flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Bot className="w-4 h-4" />
          <span>Configure AI</span>
        </Link>
      </div>

      {/* Status Message */}
      {statusInfo.status === 'inactive' && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-200">
            Complete setup to activate your AI assistant
          </p>
        </div>
      )}
      
      {statusInfo.status === 'partial' && (
        <div className="mt-4 p-3 bg-orange-900/30 border border-orange-500/30 rounded-lg">
          <p className="text-sm text-orange-200">
            Configuration incomplete - review settings
          </p>
        </div>
      )}
      
    </div>
  );
}