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
  interview_responses?: {
    communicationStyle: string;
    anxietyHandling: string;
    practiceUniqueness: string;
    medicalDetailLevel: string;
    escalationPreference: string;
    culturalApproach: string;
    formalityLevel: string;
  };
}

interface AIConfiguration {
  system_prompt: string;
  tone: string;
  languages: string[];
  last_updated: string;
  version: number;
}

interface InterviewResponses {
  communicationStyle: string;
  anxietyHandling: string;
  practiceUniqueness: string;
  medicalDetailLevel: string;
  escalationPreference: string;
  culturalApproach: string;
  formalityLevel: string;
  patientComfortApproach?: string;
  topicsToAvoid?: string;
}

interface SystemPromptBuilderProps {
  clinicData: ClinicData | null;
  aiConfig: AIConfiguration | null;
  onConfigChange: () => void;
  onConfigSaved?: () => void;
}

export default function SystemPromptBuilder({ clinicData, aiConfig, onConfigChange, onConfigSaved }: SystemPromptBuilderProps) {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true); // Default to preview mode
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isNewlyGenerated, setIsNewlyGenerated] = useState(false); // Track if prompt is newly generated
  const [interviewResponses, setInterviewResponses] = useState<InterviewResponses>({
    communicationStyle: '',
    anxietyHandling: '',
    practiceUniqueness: '',
    medicalDetailLevel: '',
    escalationPreference: '',
    culturalApproach: '',
    formalityLevel: '',
    patientComfortApproach: '',
    topicsToAvoid: ''
  });
  const [showInterviewQuestions, setShowInterviewQuestions] = useState(false);
  const [isInterviewSaved, setIsInterviewSaved] = useState(false);
  const [isInterviewSaving, setIsInterviewSaving] = useState(false);
  const [isInterviewEditing, setIsInterviewEditing] = useState(false);

  useEffect(() => {
    if (aiConfig?.system_prompt) {
      setSystemPrompt(aiConfig.system_prompt);
    } else if (clinicData?.ai_instructions) {
      setSystemPrompt(clinicData.ai_instructions);
    }

    // Load interview responses from clinic data if available
    if (clinicData?.interview_responses) {
      console.log('Loading saved interview responses:', clinicData.interview_responses);
      setInterviewResponses(clinicData.interview_responses);
      setIsInterviewSaved(true);
      setIsInterviewEditing(false);
    } else {
      console.log('No saved interview responses found, starting fresh');
      setIsInterviewSaved(false);
      setIsInterviewEditing(true);
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
    },
    {
      id: 'custom',
      name: 'Custom Template',
      description: 'Write your own system prompt manually'
    }
  ];

  const handleAutoGenerate = async () => {
    if (!clinicData) {
      toast.error('Clinic data not loaded');
      return;
    }

    setIsGenerating(true);
    try {
      // New approach: focus on personality and template, no clinic intelligence data
      const response = await fetch('/api/ai-configuration/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic: {
            practice_name: clinicData.practice_name,
            doctor_name: clinicData.doctor_name,
            specialty: clinicData.specialty
          },
          template: selectedTemplate,
          custom_instructions: selectedTemplate === 'custom' ? customPrompt : '',
          interviewResponses: interviewResponses,
          useInterviewData: true
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSystemPrompt(data.prompt);
        setIsNewlyGenerated(true); // Mark as newly generated
        setShowPreview(false); // Show in EDIT mode for newly generated prompts
        onConfigChange();
        toast.success('Personalized prompt generated successfully!');
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

  const handleSaveAndMakeCurrent = async () => {
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
        toast.success('System prompt saved and made current!');
        setIsNewlyGenerated(false); // No longer newly generated
        setShowPreview(true); // Return to preview mode
        onConfigSaved?.(); // Call the saved callback to clear unsaved changes
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

  const handleSaveToHistory = async () => {
    if (!systemPrompt.trim()) {
      toast.error('System prompt cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      // Create a new API endpoint for saving to history without making current
      const response = await fetch('/api/ai-configuration/save-to-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_prompt: systemPrompt
        })
      });

      if (response.ok) {
        toast.success('System prompt saved to history!');
        setIsNewlyGenerated(false); // No longer newly generated
        setShowPreview(true); // Return to preview mode
        onConfigSaved?.(); // Call the saved callback to clear unsaved changes
      } else {
        toast.error('Failed to save to history');
      }
    } catch (error) {
      console.error('Error saving to history:', error);
      toast.error('Failed to save to history');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChanges = async () => {
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
        toast.success('Changes saved successfully!');
        setShowPreview(true); // Return to preview mode
        onConfigChange();
      } else {
        toast.error('Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    // Regenerate with the same settings
    await handleAutoGenerate();
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard this prompt? This action cannot be undone.\n\nYou can generate a new prompt by clicking the "Auto-Generate" button again.')) {
      setSystemPrompt('');
      setIsNewlyGenerated(false);
      setShowPreview(true); // Return to preview mode
      toast.success('Prompt discarded');
    }
  };

  const handleSaveInterview = async () => {
    setIsInterviewSaving(true);
    try {
      const response = await fetch('/api/ai-configuration/save-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview_responses: interviewResponses
        })
      });

      if (response.ok) {
        toast.success('Interview responses saved!');
        setIsInterviewSaved(true);
        setIsInterviewEditing(false);
        onConfigSaved?.(); // Trigger parent to reload clinic data
      } else {
        toast.error('Failed to save interview responses');
      }
    } catch (error) {
      console.error('Error saving interview responses:', error);
      toast.error('Failed to save interview responses');
    } finally {
      setIsInterviewSaving(false);
    }
  };

  const handleEditInterview = () => {
    setIsInterviewEditing(true);
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

          {/* Custom Template Input */}
          {selectedTemplate === 'custom' && (
            <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h4 className="text-sm font-medium text-blue-200">Custom Template Description</h4>
              </div>
              <p className="text-xs text-blue-300 mb-4">
                Describe your practice style and approach in 1-2 sentences or bullet points. This will guide the AI when generating your system prompt.
              </p>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-blue-100">
                  Template Description
                </label>
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g., Family-focused practice with emphasis on preventive care and patient education"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
                <div className="text-xs text-blue-300">
                  💡 <strong>Examples:</strong> &quot;Holistic approach with natural remedies focus&quot; • &quot;High-volume urgent care with efficient triage&quot; • &quot;Specialist practice emphasizing patient education&quot;
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Interview Questions Section */}
        <div className="mb-6">
          <div className="bg-white/5 border border-white/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-white">🎯 Clinic Personality Questions</h3>
                <p className="text-sm text-blue-200">
                  Answer these questions to enhance the AI&apos;s understanding of your clinic
                  {isInterviewSaved && <span className="text-green-400 ml-2">✓ Saved</span>}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {isInterviewSaved && !isInterviewEditing && (
                  <button
                    onClick={handleEditInterview}
                    className="text-blue-300 hover:text-white text-sm font-medium transition-colors"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => setShowInterviewQuestions(!showInterviewQuestions)}
                  className="text-blue-300 hover:text-white text-sm font-medium transition-colors"
                >
                  {showInterviewQuestions ? 'Hide Questions' : 'Show Questions'}
                </button>
              </div>
            </div>
            
            {showInterviewQuestions && (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    How would you describe your clinic&apos;s communication style with patients?
                  </label>
                  <textarea
                    value={interviewResponses.communicationStyle}
                    onChange={(e) => setInterviewResponses(prev => ({ ...prev, communicationStyle: e.target.value }))}
                    placeholder="e.g., Warm and personal, focusing on making patients feel heard and comfortable..."
                    disabled={isInterviewSaved && !isInterviewEditing}
                    className={`w-full border rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none ${
                      isInterviewSaved && !isInterviewEditing 
                        ? 'bg-gray-800 border-gray-600 cursor-not-allowed opacity-75' 
                        : 'bg-white/10 border-white/20'
                    }`}
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    How does your clinic handle patient anxiety or concerns?
                  </label>
                  <textarea
                    value={interviewResponses.anxietyHandling}
                    onChange={(e) => setInterviewResponses(prev => ({ ...prev, anxietyHandling: e.target.value }))}
                    placeholder="e.g., We take extra time to explain procedures and always validate patient concerns..."
                    disabled={isInterviewSaved && !isInterviewEditing}
                    className={`w-full border rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none ${
                      isInterviewSaved && !isInterviewEditing 
                        ? 'bg-gray-800 border-gray-600 cursor-not-allowed opacity-75' 
                        : 'bg-white/10 border-white/20'
                    }`}
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    What makes your practice unique or special?
                  </label>
                  <textarea
                    value={interviewResponses.practiceUniqueness}
                    onChange={(e) => setInterviewResponses(prev => ({ ...prev, practiceUniqueness: e.target.value }))}
                    placeholder="e.g., We focus on holistic care and spend more time with each patient than typical practices..."
                    disabled={isInterviewSaved && !isInterviewEditing}
                    className={`w-full border rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none ${
                      isInterviewSaved && !isInterviewEditing 
                        ? 'bg-gray-800 border-gray-600 cursor-not-allowed opacity-75' 
                        : 'bg-white/10 border-white/20'
                    }`}
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    How much medical detail do you prefer to share with patients?
                  </label>
                  <textarea
                    value={interviewResponses.medicalDetailLevel}
                    onChange={(e) => setInterviewResponses(prev => ({ ...prev, medicalDetailLevel: e.target.value }))}
                    placeholder="e.g., We explain things in simple terms but provide detailed information when patients ask..."
                    disabled={isInterviewSaved && !isInterviewEditing}
                    className={`w-full border rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none ${
                      isInterviewSaved && !isInterviewEditing 
                        ? 'bg-gray-800 border-gray-600 cursor-not-allowed opacity-75' 
                        : 'bg-white/10 border-white/20'
                    }`}
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    When should the AI escalate to human staff?
                  </label>
                  <textarea
                    value={interviewResponses.escalationPreference}
                    onChange={(e) => setInterviewResponses(prev => ({ ...prev, escalationPreference: e.target.value }))}
                    placeholder="e.g., Any medical questions, complex scheduling issues, or when patients seem frustrated..."
                    disabled={isInterviewSaved && !isInterviewEditing}
                    className={`w-full border rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none ${
                      isInterviewSaved && !isInterviewEditing 
                        ? 'bg-gray-800 border-gray-600 cursor-not-allowed opacity-75' 
                        : 'bg-white/10 border-white/20'
                    }`}
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    How does your clinic help patients feel comfortable and understood?
                  </label>
                  <textarea
                    value={interviewResponses.patientComfortApproach || ''}
                    onChange={(e) => setInterviewResponses(prev => ({ ...prev, patientComfortApproach: e.target.value }))}
                    placeholder="e.g., We greet every patient by name, explain each step, and check in about their concerns or anxieties..."
                    disabled={isInterviewSaved && !isInterviewEditing}
                    className={`w-full border rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none ${
                      isInterviewSaved && !isInterviewEditing 
                        ? 'bg-gray-800 border-gray-600 cursor-not-allowed opacity-75' 
                        : 'bg-white/10 border-white/20'
                    }`}
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    Are there any topics or types of information you want the AI to avoid discussing with patients, not just phrases but topics?
                  </label>
                  <textarea
                    value={interviewResponses.topicsToAvoid || ''}
                    onChange={(e) => setInterviewResponses(prev => ({ ...prev, topicsToAvoid: e.target.value }))}
                    placeholder="e.g., We do not want the AI to discuss billing disputes, legal advice, or specific medication recommendations..."
                    disabled={isInterviewSaved && !isInterviewEditing}
                    className={`w-full border rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none ${
                      isInterviewSaved && !isInterviewEditing 
                        ? 'bg-gray-800 border-gray-600 cursor-not-allowed opacity-75' 
                        : 'bg-white/10 border-white/20'
                    }`}
                    rows={2}
                  />
                </div>

                <div className="text-xs text-blue-300 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                  💡 <strong>Optional:</strong> These answers will help create a more personalized system prompt. You can skip any questions that don&apos;t apply to your practice.
                </div>

                {/* Save Interview Button */}
                {(isInterviewEditing || !isInterviewSaved) && (
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={handleSaveInterview}
                      disabled={isInterviewSaving}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isInterviewSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Interview Responses</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
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
                setIsNewlyGenerated(false); // Clear newly generated flag when editing
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
              <div className="flex items-center space-x-3">
                {showPreview ? (
                  // Preview mode - only show Edit button
                  <button
                    onClick={() => setShowPreview(false)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                ) : (
                  // Edit mode - show different buttons based on whether it's newly generated
                  <>
                    {isNewlyGenerated ? (
                      // 4 buttons for newly generated prompts
                      <>
                        <button
                          onClick={handleDiscard}
                          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                          <span>Discard</span>
                        </button>
                        <button
                          onClick={handleRegenerate}
                          disabled={isSaving || isGenerating}
                          className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Regenerate</span>
                        </button>
                        <button
                          onClick={handleSaveToHistory}
                          disabled={isSaving || !systemPrompt.trim()}
                          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save to History</span>
                        </button>
                        <button
                          onClick={handleSaveAndMakeCurrent}
                          disabled={isSaving || !systemPrompt.trim()}
                          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Brain className="w-4 h-4" />
                          <span>{isSaving ? 'Saving...' : 'Save & Make Current'}</span>
                        </button>
                      </>
                    ) : (
                      // Regular edit mode - only Save Changes button
                      <button
                        onClick={handleSaveChanges}
                        disabled={isSaving || !systemPrompt.trim()}
                        className="flex items-center space-x-2 bg-white text-blue-900 font-semibold px-6 py-2 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    )}
                  </>
                )}
              </div>
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