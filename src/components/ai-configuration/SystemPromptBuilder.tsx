"use client";

import { useState, useEffect } from "react";
import { Brain, Wand2, Save, RefreshCw, Eye, Download, FileText } from "lucide-react";
import { toast } from "react-hot-toast";

interface ClinicData {
  id: number;
  practice_name: string;
  doctor_name: string;
  slug: string;
  specialty: string;
  primary_color: string;
  ai_instructions?: string;
}

interface AIConfiguration {
  system_prompt: string;
  tone: string;
  languages: string[];
  last_updated: string;
  version: number;
}

interface SystemPromptBuilderProps {
  clinicData: ClinicData | null;
  aiConfig: AIConfiguration | null;
  onConfigChange: () => void;
}

export default function SystemPromptBuilder({ clinicData, aiConfig, onConfigChange }: SystemPromptBuilderProps) {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    if (aiConfig?.system_prompt) {
      setSystemPrompt(aiConfig.system_prompt);
    } else if (clinicData?.ai_instructions) {
      setSystemPrompt(clinicData.ai_instructions);
    }
  }, [aiConfig, clinicData]);

  const templates = [
    {
      id: 'general',
      name: 'General Practice',
      description: 'Balanced approach for family medicine and general health'
    },
    {
      id: 'urgent-care',
      name: 'Urgent Care',
      description: 'Efficient triage and quick assessment focus'
    },
    {
      id: 'specialist',
      name: 'Medical Specialist',
      description: 'Detailed, condition-specific guidance'
    },
    {
      id: 'dental',
      name: 'Dental Practice',
      description: 'Oral health and dental procedure focused'
    },
    {
      id: 'mental-health',
      name: 'Mental Health',
      description: 'Compassionate, supportive, and non-judgmental'
    },
    {
      id: 'pediatric',
      name: 'Pediatric',
      description: 'Child-friendly and parent-focused communication'
    }
  ];

  const handleAutoGenerate = async () => {
    if (!clinicData) {
      toast.error('Clinic data not loaded');
      return;
    }

    setIsGenerating(true);
    try {
      // Fetch clinic intelligence data for comprehensive prompt generation
      const [profileResponse, servicesResponse, insuranceResponse] = await Promise.all([
        fetch('/api/clinic-intelligence/clinic-profile'),
        fetch('/api/clinic-intelligence/services'),
        fetch('/api/clinic-intelligence/insurance')
      ]);

      const profileData = profileResponse.ok ? await profileResponse.json() : {};
      const servicesData = servicesResponse.ok ? await servicesResponse.json() : {};
      const insuranceData = insuranceResponse.ok ? await insuranceResponse.json() : {};

      const response = await fetch('/api/ai-configuration/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic: clinicData,
          profile: profileData,
          services: servicesData,
          insurance: insuranceData,
          template: selectedTemplate
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSystemPrompt(data.prompt);
        onConfigChange();
        toast.success('Intelligent prompt generated successfully!');
      } else {
        toast.error('Failed to generate prompt');
      }
    } catch (error) {
      console.error('Error generating prompt:', error);
      toast.error('Failed to generate prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!systemPrompt.trim()) {
      toast.error('System prompt cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/ai-configuration/save-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_prompt: systemPrompt
        })
      });

      if (response.ok) {
        toast.success('System prompt saved successfully!');
        onConfigChange();
      } else {
        toast.error('Failed to save system prompt');
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error('Failed to save system prompt');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const exportData = {
      clinic: clinicData?.practice_name,
      doctor: clinicData?.doctor_name,
      specialty: clinicData?.specialty,
      system_prompt: systemPrompt,
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clinicData?.slug}-ai-prompt-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Prompt configuration exported!');
  };

  const characterCount = systemPrompt.length;
  const wordCount = systemPrompt.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">System Prompt Configuration</h2>
            <p className="text-blue-200 text-sm">
              Define how your AI assistant thinks, responds, and behaves with patients
            </p>
          </div>
        </div>

        {/* Template Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-blue-100">
              Choose a template (optional)
            </label>
            {selectedTemplate && (
              <button
                onClick={() => setSelectedTemplate('')}
                className="text-xs text-blue-300 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
              >
                Clear Selection
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedTemplate === template.id
                    ? 'bg-white text-blue-900 border-white'
                    : 'bg-white/5 text-white border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="font-medium text-sm">{template.name}</div>
                <div className="text-xs opacity-75 mt-1">{template.description}</div>
              </button>
            ))}
          </div>

          {/* Custom Mode Indicator */}
          {!selectedTemplate && (
            <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <h4 className="text-sm font-medium text-orange-200">Custom Mode Active</h4>
              </div>
              <p className="text-xs text-orange-300 mb-2">
                You&apos;re in custom mode without a template. Your system prompt may not be as effective.
              </p>
              <p className="text-xs text-orange-300">
                💡 <strong>Tip:</strong> Try selecting a template above, or describe your practice in one sentence for better results. 
                Look at the template descriptions for inspiration.
              </p>
            </div>
          )}
        </div>

        {/* Auto-Generate Section */}
        <div className="bg-white/5 border border-white/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium text-white">🧠 Intelligent Auto-Generation</h3>
              <p className="text-sm text-blue-200">
                Generate a smart prompt using all your clinic intelligence data
              </p>
            </div>
            <button
              onClick={handleAutoGenerate}
              disabled={isGenerating}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              <span>{isGenerating ? 'Generating...' : 'Auto-Generate'}</span>
            </button>
          </div>
          <div className="text-xs text-blue-300">
            ✨ Includes clinic profile, services, insurance, hours, and specialty-specific guidelines
          </div>
        </div>
      </div>

      {/* Prompt Editor */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">System Prompt Editor</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors text-sm"
            >
              <Eye className="w-4 h-4" />
              <span>{showPreview ? 'Edit' : 'Preview'}</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {showPreview ? (
          <div className="bg-white/5 border border-white/20 rounded-lg p-4">
            <div className="whitespace-pre-wrap text-sm text-white leading-relaxed">
              {systemPrompt || 'No system prompt configured yet.'}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <textarea
              value={systemPrompt}
              onChange={(e) => {
                setSystemPrompt(e.target.value);
                onConfigChange();
              }}
              rows={16}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent font-mono text-sm leading-relaxed resize-none"
              placeholder="Enter your system prompt here...

Example:
You are an AI assistant for [Practice Name], a [specialty] practice. You help patients with:
- Scheduling appointments
- Understanding procedures
- Insurance questions
- General health information

Always be:
- Professional and compassionate
- Clear and concise
- Helpful and informative

Never provide:
- Medical diagnoses
- Prescription advice
- Emergency medical care"
            />
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-300">
                {characterCount.toLocaleString()} characters • {wordCount.toLocaleString()} words
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving || !systemPrompt.trim()}
                className="flex items-center space-x-2 bg-white text-blue-900 font-semibold px-6 py-2 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSaving ? 'Saving...' : 'Save Prompt'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Guidelines & Tips */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <FileText className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Writing Guidelines</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-green-400 mb-2">✅ Best Practices</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Be specific about your practice and specialty</li>
              <li>• Include your clinic&apos;s values and approach</li>
              <li>• Mention key services and policies</li>
              <li>• Set clear communication guidelines</li>
              <li>• Include emergency contact information</li>
              <li>• Specify preferred language and tone</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-red-400 mb-2">❌ Avoid These</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Vague or generic instructions</li>
              <li>• Medical diagnosis capabilities</li>
              <li>• Prescription or treatment advice</li>
              <li>• Personal medical opinions</li>
              <li>• Overly complex language</li>
              <li>• Conflicting guidelines</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}