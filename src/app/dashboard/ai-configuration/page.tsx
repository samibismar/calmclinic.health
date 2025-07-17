"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Bot, Brain, Settings, TestTube, AlertCircle, History, Shield, FlaskConical } from "lucide-react";
import Link from "next/link";

// AI Configuration components
import AssistantStatusSection from "@/components/ai-configuration/AssistantStatusSection";
import SystemPromptBuilder from "@/components/ai-configuration/SystemPromptBuilder";
import PersonalitySettings from "@/components/ai-configuration/PersonalitySettings";
import FallbackResponsesTab from "@/components/ai-configuration/FallbackResponsesTab";
import VersionHistoryTab from "@/components/ai-configuration/VersionHistoryTab";
import ABTestingTab from "@/components/ai-configuration/ABTestingTab";

interface ClinicData {
  id: number;
  practice_name: string;
  doctor_name: string;
  slug: string;
  specialty: string;
  primary_color: string;
  ai_instructions?: string;
  tone?: string;
  languages?: string[];
  has_completed_setup: boolean;
}

interface AIConfiguration {
  system_prompt: string;
  tone: string;
  languages: string[];
  custom_instructions: string;
  fallback_responses?: {
    uncertain: string;
    after_hours: string;
    emergency: string;
  };
  last_updated: string;
  version: number;
}

const sections = [
  {
    id: 'status',
    name: 'Assistant Status',
    icon: Bot,
    description: 'Monitor & test your AI'
  },
  {
    id: 'prompt',
    name: 'System Prompt',
    icon: Brain,
    description: 'Core AI instructions'
  },
  {
    id: 'personality',
    name: 'Personality',
    icon: Settings,
    description: 'Tone & behavior settings'
  },
  {
    id: 'fallbacks',
    name: 'Fallback Responses',
    icon: Shield,
    description: 'Emergency & uncertain responses'
  },
  {
    id: 'history',
    name: 'Version History',
    icon: History,
    description: 'Prompt evolution & rollback'
  },
  {
    id: 'testing',
    name: 'A/B Testing',
    icon: FlaskConical,
    description: 'Test prompt variations'
  }
];

export default function AIConfigurationPage() {
  const [activeSection, setActiveSection] = useState('status');
  const [clinicData, setClinicData] = useState<ClinicData | null>(null);
  const [aiConfig, setAIConfig] = useState<AIConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    fetchClinicData();
    fetchAIConfiguration();
  }, []);

  const fetchClinicData = async () => {
    try {
      const response = await fetch('/api/dashboard/data');
      const data = await response.json();
      if (response.ok) {
        setClinicData(data.clinic);
      }
    } catch (error) {
      console.error('Error fetching clinic data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIConfiguration = async () => {
    try {
      const response = await fetch('/api/ai-configuration/settings');
      const data = await response.json();
      if (response.ok) {
        setAIConfig(data.config);
      }
    } catch (error) {
      console.error('Error fetching AI configuration:', error);
    }
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'status':
        return <AssistantStatusSection clinicData={clinicData} aiConfig={aiConfig} />;
      case 'prompt':
        return (
          <SystemPromptBuilder 
            clinicData={clinicData} 
            aiConfig={aiConfig}
            onConfigChange={() => setHasUnsavedChanges(true)}
          />
        );
      case 'personality':
        return (
          <PersonalitySettings 
            aiConfig={aiConfig}
            onConfigChange={() => setHasUnsavedChanges(true)}
          />
        );
      case 'fallbacks':
        return (
          <FallbackResponsesTab 
            clinicData={clinicData} 
            aiConfig={aiConfig}
            onConfigChange={() => setHasUnsavedChanges(true)}
          />
        );
      case 'history':
        return (
          <VersionHistoryTab 
            clinicData={clinicData} 
            aiConfig={aiConfig}
          />
        );
      case 'testing':
        return (
          <ABTestingTab 
            clinicData={clinicData} 
            aiConfig={aiConfig}
            onConfigChange={() => setHasUnsavedChanges(true)}
          />
        );
      default:
        return <AssistantStatusSection clinicData={clinicData} aiConfig={aiConfig} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded w-1/3 mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-white/20 rounded"></div>
              <div className="h-96 bg-white/20 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-blue-200 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">AI Configuration</h1>
              </div>
              <p className="text-blue-100">
                Configure your AI assistant&apos;s brain - personality, behavior, and responses
              </p>
            </div>
            
            {/* Status indicators */}
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              {hasUnsavedChanges && (
                <div className="flex items-center space-x-2 bg-orange-900/50 text-orange-200 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Unsaved changes</span>
                </div>
              )}
              <div className="flex items-center space-x-2 bg-white/10 text-blue-200 px-3 py-2 rounded-lg">
                <Bot className="w-4 h-4" />
                <span className="text-sm font-medium">{clinicData?.practice_name}</span>
              </div>
              {clinicData?.has_completed_setup && (
                <Link
                  href={`/chat?c=${clinicData.slug}`}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors"
                >
                  <TestTube className="w-4 h-4" />
                  <span className="text-sm font-medium">Test Live</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-2">
            <nav className="flex flex-wrap gap-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 min-w-0 flex-1 sm:flex-initial ${
                      activeSection === section.id
                        ? 'bg-white text-blue-900 shadow-lg font-semibold'
                        : 'text-blue-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <div className="text-left min-w-0 hidden sm:block">
                      <div className="font-medium truncate">{section.name}</div>
                      <div className="text-xs opacity-75 truncate">{section.description}</div>
                    </div>
                    <div className="sm:hidden">
                      <span className="text-sm font-medium">{section.name}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Section Content */}
        <div className="mb-8">
          {renderSectionContent()}
        </div>
      </div>
    </div>
  );
}