"use client";

import { useState, useEffect } from "react";
import { TestTube, History, RefreshCw, Save, Download, Upload, AlertTriangle, Clock } from "lucide-react";
import { toast } from "react-hot-toast";

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

interface PromptVersion {
  id: number;
  version: number;
  prompt_text: string;
  created_at: string;
  created_by: string;
  performance_metrics?: {
    satisfaction_rate: number;
    response_accuracy: number;
    usage_count: number;
  };
}

interface AdvancedSettingsProps {
  clinicData: ClinicData | null;
  aiConfig: AIConfiguration | null;
  onConfigChange: () => void;
}

export default function AdvancedSettings({ clinicData, aiConfig, onConfigChange }: AdvancedSettingsProps) {
  const [fallbackResponses, setFallbackResponses] = useState({
    uncertain: "I'm not sure about that. Let me connect you with our staff who can help you better.",
    after_hours: "We're currently closed. For urgent matters, please call our emergency line at [phone]. Otherwise, I'm happy to help you schedule an appointment for when we reopen.",
    emergency: "This sounds like it might be urgent. Please call 911 for emergencies, or contact our clinic directly at [phone] for immediate medical concerns."
  });
  
  const [promptHistory, setPromptHistory] = useState<PromptVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [abTestingEnabled, setAbTestingEnabled] = useState(false);
  const [abTestPercentage, setAbTestPercentage] = useState(10);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (aiConfig?.fallback_responses) {
      setFallbackResponses(prev => ({
        ...prev,
        ...aiConfig.fallback_responses
      }));
    }
    fetchPromptHistory();
  }, [aiConfig]);

  const fetchPromptHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch('/api/ai-configuration/prompt-history');
      const data = await response.json();
      if (response.ok) {
        setPromptHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching prompt history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSaveFallbacks = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/ai-configuration/save-fallbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fallback_responses: fallbackResponses,
          ab_testing_enabled: abTestingEnabled,
          ab_test_percentage: abTestPercentage
        })
      });

      if (response.ok) {
        toast.success('Advanced settings saved successfully!');
        onConfigChange();
      } else {
        toast.error('Failed to save advanced settings');
      }
    } catch (error) {
      console.error('Error saving advanced settings:', error);
      toast.error('Failed to save advanced settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreVersion = async (version: number) => {
    if (!confirm(`Are you sure you want to restore version ${version}? This will replace your current system prompt.`)) {
      return;
    }

    try {
      const response = await fetch('/api/ai-configuration/restore-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version })
      });

      if (response.ok) {
        toast.success(`Version ${version} restored successfully!`);
        onConfigChange();
      } else {
        toast.error('Failed to restore version');
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('Failed to restore version');
    }
  };

  const handleExportConfiguration = () => {
    const exportData = {
      clinic: {
        practice_name: clinicData?.practice_name,
        doctor_name: clinicData?.doctor_name,
        specialty: clinicData?.specialty
      },
      ai_configuration: aiConfig,
      fallback_responses: fallbackResponses,
      exported_at: new Date().toISOString(),
      export_version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clinicData?.slug}-ai-configuration-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Configuration exported successfully!');
  };

  const handleImportConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        if (importedData.fallback_responses) {
          setFallbackResponses(importedData.fallback_responses);
        }
        
        toast.success('Configuration imported successfully!');
        onConfigChange();
      } catch {
        toast.error('Invalid configuration file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Fallback Responses */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Fallback Responses</h2>
            <p className="text-blue-200 text-sm">
              Configure how your assistant handles uncertain or special situations
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">
              When Uncertain or Doesn't Know
            </label>
            <textarea
              value={fallbackResponses.uncertain}
              onChange={(e) => setFallbackResponses({
                ...fallbackResponses,
                uncertain: e.target.value
              })}
              rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
              placeholder="What should the assistant say when it doesn't know something?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">
              After Hours / Clinic Closed
            </label>
            <textarea
              value={fallbackResponses.after_hours}
              onChange={(e) => setFallbackResponses({
                ...fallbackResponses,
                after_hours: e.target.value
              })}
              rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
              placeholder="What should the assistant say when contacted outside business hours?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">
              Emergency or Urgent Situations
            </label>
            <textarea
              value={fallbackResponses.emergency}
              onChange={(e) => setFallbackResponses({
                ...fallbackResponses,
                emergency: e.target.value
              })}
              rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
              placeholder="What should the assistant say when it detects an emergency?"
            />
          </div>
        </div>
      </div>

      {/* A/B Testing */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
            <TestTube className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">A/B Testing</h2>
            <p className="text-blue-200 text-sm">
              Test different prompt versions with a percentage of your traffic
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="ab-testing"
              checked={abTestingEnabled}
              onChange={(e) => setAbTestingEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
            />
            <label htmlFor="ab-testing" className="text-white">
              Enable A/B Testing
            </label>
          </div>

          {abTestingEnabled && (
            <div className="space-y-4 pl-7">
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Traffic Percentage for Testing
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={abTestPercentage}
                    onChange={(e) => setAbTestPercentage(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-white font-medium w-12">{abTestPercentage}%</span>
                </div>
                <p className="text-xs text-blue-300 mt-1">
                  {abTestPercentage}% of visitors will see the test version, {100 - abTestPercentage}% will see the current version
                </p>
              </div>

              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-200 mb-2">How A/B Testing Works</h4>
                <ul className="text-xs text-blue-300 space-y-1">
                  <li>• Create a new prompt version using the System Prompt builder</li>
                  <li>• Enable testing to split traffic between versions</li>
                  <li>• Monitor performance metrics to see which performs better</li>
                  <li>• Promote the winning version when ready</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Version History */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Version History</h2>
              <p className="text-blue-200 text-sm">
                View and restore previous prompt configurations
              </p>
            </div>
          </div>
          <button
            onClick={fetchPromptHistory}
            disabled={loadingHistory}
            className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="space-y-4">
          {promptHistory.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-blue-200">No version history available yet</p>
              <p className="text-sm text-blue-300">Versions will appear here after you save prompt changes</p>
            </div>
          ) : (
            promptHistory.map((version) => (
              <div
                key={version.id}
                className={`bg-white/5 border border-white/20 rounded-lg p-4 ${
                  selectedVersion === version.version ? 'ring-2 ring-blue-400' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-white">Version {version.version}</span>
                    {version.version === aiConfig?.version && (
                      <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">Current</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedVersion(
                        selectedVersion === version.version ? null : version.version
                      )}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      {selectedVersion === version.version ? 'Hide' : 'View'}
                    </button>
                    {version.version !== aiConfig?.version && (
                      <button
                        onClick={() => handleRestoreVersion(version.version)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded transition-colors"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="text-sm text-blue-200">
                  Created: {new Date(version.created_at).toLocaleString()}
                </div>
                
                {version.performance_metrics && (
                  <div className="flex items-center space-x-4 mt-2 text-xs text-blue-300">
                    <span>Satisfaction: {version.performance_metrics.satisfaction_rate}/5</span>
                    <span>Accuracy: {version.performance_metrics.response_accuracy}%</span>
                    <span>Used: {version.performance_metrics.usage_count} times</span>
                  </div>
                )}

                {selectedVersion === version.version && (
                  <div className="mt-4 p-3 bg-white/5 border border-white/20 rounded text-sm text-white whitespace-pre-wrap">
                    {version.prompt_text}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Export/Import */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Configuration Management</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleExportConfiguration}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Configuration</span>
          </button>
          
          <label className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import Configuration</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportConfiguration}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveFallbacks}
          disabled={isSaving}
          className="flex items-center space-x-2 bg-white text-blue-900 font-semibold px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSaving ? 'Saving...' : 'Save Advanced Settings'}</span>
        </button>
      </div>
    </div>
  );
}