"use client";

import { useState, useEffect } from "react";
import { Shield, Plus, Edit, Trash2, Save, X, AlertTriangle, Clock, MessageSquare } from "lucide-react";
import { toast } from "react-hot-toast";

interface FallbackResponse {
  id: number;
  trigger_type: string;
  trigger_description: string;
  response_text: string;
  is_active: boolean;
}

interface ClinicData {
  id: number;
  practice_name: string;
  doctor_name: string;
  slug: string;
  specialty: string;
  primary_color: string;
}

interface AIConfiguration {
  system_prompt: string;
  tone: string;
  languages: string[];
  last_updated: string;
  version: number;
  fallback_responses?: {
    uncertain: string;
    after_hours: string;
    emergency: string;
  };
}

interface FallbackResponsesTabProps {
  clinicData: ClinicData | null;
  aiConfig: AIConfiguration | null;
  onConfigChange: () => void;
}

export default function FallbackResponsesTab({ aiConfig, onConfigChange }: FallbackResponsesTabProps) {
  const [fallbackResponses, setFallbackResponses] = useState({
    uncertain: "I'm not sure about that. Let me connect you with our staff who can help you better.",
    after_hours: "We're currently closed. For urgent matters, please call our emergency line at [phone]. Otherwise, I'm happy to help you schedule an appointment for when we reopen.",
    emergency: "This sounds like it might be urgent. Please call 911 for emergencies, or contact our clinic directly at [phone] for immediate medical concerns."
  });
  
  const [customFallbacks, setCustomFallbacks] = useState<FallbackResponse[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingFallback, setEditingFallback] = useState<FallbackResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for custom fallbacks
  const [customFormData, setCustomFormData] = useState({
    trigger_type: 'custom',
    trigger_description: '',
    response_text: ''
  });

  useEffect(() => {
    if (aiConfig?.fallback_responses) {
      setFallbackResponses(prev => ({
        ...prev,
        ...aiConfig.fallback_responses
      }));
    }
    fetchCustomFallbacks();
  }, [aiConfig]);

  const fetchCustomFallbacks = async () => {
    try {
      const response = await fetch('/api/ai-configuration/custom-fallbacks');
      if (response.ok) {
        const data = await response.json();
        setCustomFallbacks(data.fallbacks || []);
      } else {
        // API endpoint doesn't exist yet, use empty array
        setCustomFallbacks([]);
      }
    } catch (error) {
      console.error('Error fetching custom fallbacks:', error);
      // Fallback to empty array if API doesn't exist
      setCustomFallbacks([]);
    }
  };

  const handleSaveFallbacks = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/ai-configuration/save-fallbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fallback_responses: fallbackResponses
        })
      });

      if (response.ok) {
        toast.success('Fallback responses saved successfully!');
        onConfigChange();
      } else {
        toast.error('Failed to save fallback responses');
      }
    } catch (error) {
      console.error('Error saving fallback responses:', error);
      toast.error('Failed to save fallback responses');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCustomFallback = async () => {
    try {
      const url = editingFallback 
        ? `/api/ai-configuration/custom-fallbacks/${editingFallback.id}`
        : '/api/ai-configuration/custom-fallbacks';
      
      const method = editingFallback ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customFormData)
      });

      if (response.ok) {
        await fetchCustomFallbacks();
        setShowCustomForm(false);
        setEditingFallback(null);
        resetCustomForm();
        toast.success(`Custom fallback ${editingFallback ? 'updated' : 'created'} successfully!`);
      } else {
        toast.error('API endpoint not implemented yet');
      }
    } catch (error) {
      console.error('Error saving custom fallback:', error);
      toast.error('API endpoint not implemented yet');
    }
  };

  const handleDeleteCustomFallback = async (id: number) => {
    if (!confirm('Are you sure you want to delete this custom fallback?')) return;

    try {
      const response = await fetch(`/api/ai-configuration/custom-fallbacks/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchCustomFallbacks();
        toast.success('Custom fallback deleted successfully!');
      } else {
        toast.error('API endpoint not implemented yet');
      }
    } catch (error) {
      console.error('Error deleting custom fallback:', error);
      toast.error('API endpoint not implemented yet');
    }
  };

  const startEditCustomFallback = (fallback: FallbackResponse) => {
    setEditingFallback(fallback);
    setCustomFormData({
      trigger_type: fallback.trigger_type,
      trigger_description: fallback.trigger_description,
      response_text: fallback.response_text
    });
    setShowCustomForm(true);
  };

  const resetCustomForm = () => {
    setCustomFormData({
      trigger_type: 'custom',
      trigger_description: '',
      response_text: ''
    });
  };

  const fallbackTypes = [
    {
      key: 'uncertain',
      title: 'When Uncertain or Doesn\'t Know',
      description: 'Used when the assistant is unsure how to answer a question or lacks information.',
      icon: AlertTriangle,
      color: 'text-orange-400'
    },
    {
      key: 'after_hours',
      title: 'After Hours / Clinic Closed',
      description: 'Response when patients contact outside business hours.',
      icon: Clock,
      color: 'text-blue-400'
    },
    {
      key: 'emergency',
      title: 'Emergency or Urgent Situations',
      description: 'When the assistant detects potential emergency situations that need immediate attention.',
      icon: MessageSquare,
      color: 'text-red-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Fallback Responses</h2>
            <p className="text-sm text-blue-200">Configure how your assistant handles uncertain or special situations</p>
          </div>
        </div>

        {/* What are Fallback Responses */}
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-200 mb-2">🛡️ What are Fallback Responses?</h3>
          <p className="text-xs text-blue-300 mb-2">
            Fallback responses are optional safety measures that provide backup messages for specific situations. 
            Your AI is highly capable and won&apos;t say anything inappropriate or incorrect thanks to extensive system prompt configuration.
          </p>
          <p className="text-xs text-blue-300 mb-2">
            <strong>These are NOT required</strong> - your AI is smart and well-trained. Fallback responses are simply an extra layer of control 
            for situations where you want guaranteed, specific responses (like emergency detection or after-hours contact).
          </p>
          <p className="text-xs text-blue-300">
            <strong>How they work:</strong> When your AI detects specific triggers (uncertainty, after-hours, emergencies), 
            it can use these pre-written responses instead of generating its own. Think of them as &quot;safety nets&quot; for extra peace of mind.
          </p>
        </div>

        {/* Standard Fallback Responses */}
        <div className="space-y-6">
          {fallbackTypes.map((type) => {
            const Icon = type.icon;
            return (
              <div key={type.key} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Icon className={`w-5 h-5 ${type.color}`} />
                  <label className="block text-sm font-medium text-blue-100">
                    {type.title}
                  </label>
                </div>
                <p className="text-xs text-blue-300 mb-2">{type.description}</p>
                <textarea
                  value={fallbackResponses[type.key as keyof typeof fallbackResponses]}
                  onChange={(e) => setFallbackResponses({
                    ...fallbackResponses,
                    [type.key]: e.target.value
                  })}
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                  placeholder={`What should the assistant say when ${type.key === 'uncertain' ? 'it doesn\'t know something' : type.key === 'after_hours' ? 'contacted outside business hours' : 'it detects an emergency'}?`}
                />
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSaveFallbacks}
            disabled={isSaving}
            className="flex items-center space-x-2 bg-white text-blue-900 font-semibold px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Fallback Responses</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Custom Fallback Responses */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Custom Fallback Responses</h3>
              <p className="text-sm text-blue-200">Create custom responses for specific patient queries or situations</p>
            </div>
          </div>
          <button
            onClick={() => setShowCustomForm(true)}
            className="flex items-center space-x-2 bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Fallback</span>
          </button>
        </div>

        {/* Custom Fallbacks List */}
        <div className="space-y-4">
          {customFallbacks.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <p className="text-blue-200 mb-2">No custom fallbacks configured yet</p>
              <p className="text-sm text-blue-300">Create custom responses for specific situations your patients encounter</p>
            </div>
          ) : (
            customFallbacks.map((fallback) => (
              <div key={fallback.id} className="bg-white/5 border border-white/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white">{fallback.trigger_description}</h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEditCustomFallback(fallback)}
                      className="text-blue-400 hover:text-blue-300 p-1"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomFallback(fallback.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-blue-200 bg-white/5 rounded p-3">
                  {fallback.response_text}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Usage Tips */}
        <div className="mt-6 bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-200 mb-2">💡 Custom Fallback Ideas</h4>
          <ul className="text-xs text-blue-300 space-y-1">
            <li>• Specific procedure questions: &quot;What happens during an eye exam?&quot;</li>
            <li>• Payment-related queries: &quot;Do you accept payment plans?&quot;</li>
            <li>• Location or parking questions: &quot;Where do I park?&quot;</li>
            <li>• Preparation instructions: &quot;How should I prepare for my appointment?&quot;</li>
          </ul>
        </div>
      </div>

      {/* Add/Edit Custom Fallback Modal */}
      {showCustomForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-blue-950 to-blue-900 rounded-xl p-6 w-full max-w-md border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                {editingFallback ? 'Edit Custom Fallback' : 'Add Custom Fallback'}
              </h3>
              <button
                onClick={() => {
                  setShowCustomForm(false);
                  setEditingFallback(null);
                  resetCustomForm();
                }}
                className="text-blue-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Trigger Description
                </label>
                <input
                  type="text"
                  value={customFormData.trigger_description}
                  onChange={(e) => setCustomFormData(prev => ({ ...prev, trigger_description: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="e.g., Payment plan questions"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Response Text
                </label>
                <textarea
                  value={customFormData.response_text}
                  onChange={(e) => setCustomFormData(prev => ({ ...prev, response_text: e.target.value }))}
                  rows={4}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                  placeholder="What should the assistant respond when this situation occurs?"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCustomForm(false);
                    setEditingFallback(null);
                    resetCustomForm();
                  }}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCustomFallback}
                  disabled={!customFormData.trigger_description.trim() || !customFormData.response_text.trim()}
                  className="flex-1 bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingFallback ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}