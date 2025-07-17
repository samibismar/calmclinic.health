"use client";

import { useState, useEffect } from "react";
import { Settings, Plus, X, Save, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";


interface AIConfiguration {
  tone: string;
  languages: string[];
  custom_instructions: string;
}

interface PersonalitySettingsProps {
  aiConfig: AIConfiguration | null;
  onConfigChange: () => void;
}

export default function PersonalitySettings({ aiConfig, onConfigChange }: PersonalitySettingsProps) {
  const [tone, setTone] = useState('professional');
  const [customTone, setCustomTone] = useState('');
  const [languages, setLanguages] = useState<string[]>(['English']);
  const [newLanguage, setNewLanguage] = useState('');
  const [alwaysInclude, setAlwaysInclude] = useState<string[]>([]);
  const [neverInclude, setNeverInclude] = useState<string[]>([]);
  const [newAlwaysInclude, setNewAlwaysInclude] = useState('');
  const [newNeverInclude, setNewNeverInclude] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (aiConfig) {
      setTone(aiConfig.tone || 'professional');
      setLanguages(aiConfig.languages || ['English']);
    }
  }, [aiConfig]);

  const toneOptions = [
    { id: 'professional', name: 'Professional', description: 'Formal, respectful, and clinical' },
    { id: 'friendly', name: 'Friendly', description: 'Warm, approachable, and personable' },
    { id: 'calm', name: 'Calm', description: 'Soothing, reassuring, and peaceful' },
    { id: 'empathetic', name: 'Empathetic', description: 'Understanding, compassionate, and supportive' },
    { id: 'efficient', name: 'Efficient', description: 'Direct, concise, and to-the-point' },
    { id: 'custom', name: 'Custom', description: 'Define your own unique tone' }
  ];

  const commonLanguages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese', 
    'Korean', 'Arabic', 'Hindi', 'Russian', 'Dutch', 'Swedish', 'Norwegian', 'Danish'
  ];

  const suggestedAlwaysInclude = [
    'Friendly greeting',
    'Ask how they can help',
    'Mention office hours',
    'Offer to schedule appointments',
    'Provide contact information',
    'Check insurance coverage',
    'Recommend following up with doctor',
    'Offer emergency contact for urgent issues'
  ];

  const suggestedNeverInclude = [
    'Medical diagnoses',
    'Prescription advice',
    'Emergency medical care',
    'Personal medical opinions',
    'Treatment recommendations',
    'Medication dosages',
    'Surgery advice',
    'Mental health diagnoses'
  ];

  const handleAddLanguage = () => {
    if (newLanguage && !languages.includes(newLanguage)) {
      setLanguages([...languages, newLanguage]);
      setNewLanguage('');
      onConfigChange();
    }
  };

  const handleRemoveLanguage = (languageToRemove: string) => {
    if (languages.length > 1) { // Keep at least one language
      setLanguages(languages.filter(lang => lang !== languageToRemove));
      onConfigChange();
    }
  };

  const handleAddAlwaysInclude = () => {
    if (newAlwaysInclude && !alwaysInclude.includes(newAlwaysInclude)) {
      setAlwaysInclude([...alwaysInclude, newAlwaysInclude]);
      setNewAlwaysInclude('');
      onConfigChange();
    }
  };

  const handleRemoveAlwaysInclude = (item: string) => {
    setAlwaysInclude(alwaysInclude.filter(i => i !== item));
    onConfigChange();
  };

  const handleAddNeverInclude = () => {
    if (newNeverInclude && !neverInclude.includes(newNeverInclude)) {
      setNeverInclude([...neverInclude, newNeverInclude]);
      setNewNeverInclude('');
      onConfigChange();
    }
  };

  const handleRemoveNeverInclude = (item: string) => {
    setNeverInclude(neverInclude.filter(i => i !== item));
    onConfigChange();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/ai-configuration/save-personality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tone: tone === 'custom' ? customTone : tone,
          languages,
          always_include: alwaysInclude,
          never_include: neverInclude
        })
      });

      if (response.ok) {
        toast.success('Personality settings saved successfully!');
        onConfigChange();
      } else {
        toast.error('Failed to save personality settings');
      }
    } catch (error) {
      console.error('Error saving personality settings:', error);
      toast.error('Failed to save personality settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tone & Style */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Personality & Behavior</h2>
            <p className="text-blue-200 text-sm">
              Configure how your AI assistant communicates with patients
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Tone Selection */}
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-3">
              Tone of Voice
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {toneOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setTone(option.id);
                    onConfigChange();
                  }}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    tone === option.id
                      ? 'bg-white text-blue-900 border-white'
                      : 'bg-white/5 text-white border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="font-medium text-sm">{option.name}</div>
                  <div className="text-xs opacity-75 mt-1">{option.description}</div>
                </button>
              ))}
            </div>

            {tone === 'custom' && (
              <div className="mt-4">
                <input
                  type="text"
                  value={customTone}
                  onChange={(e) => {
                    setCustomTone(e.target.value);
                    onConfigChange();
                  }}
                  placeholder="Describe your custom tone (e.g., 'Warm but professional, with a touch of humor')"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Languages */}
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-3">
              Supported Languages
            </label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {languages.map((language) => (
                  <div
                    key={language}
                    className="flex items-center space-x-2 bg-white/10 border border-white/20 rounded-lg px-3 py-2"
                  >
                    <span className="text-sm text-white">{language}</span>
                    {languages.length > 1 && (
                      <button
                        onClick={() => handleRemoveLanguage(language)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <select
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select a language to add</option>
                  {commonLanguages
                    .filter(lang => !languages.includes(lang))
                    .map(lang => (
                      <option key={lang} value={lang} className="bg-blue-900">{lang}</option>
                    ))}
                </select>
                <button
                  onClick={handleAddLanguage}
                  disabled={!newLanguage}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Response Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Always Include */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">✅ Always Include</h3>
          <p className="text-sm text-blue-200 mb-4">
            Things your assistant should consistently mention or do
          </p>
          
          <div className="space-y-3">
            <div className="space-y-2">
              {alwaysInclude.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between bg-white/5 border border-white/20 rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-white">{item}</span>
                  <button
                    onClick={() => handleRemoveAlwaysInclude(item)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newAlwaysInclude}
                onChange={(e) => setNewAlwaysInclude(e.target.value)}
                placeholder="Add new guideline..."
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleAddAlwaysInclude()}
              />
              <button
                onClick={handleAddAlwaysInclude}
                disabled={!newAlwaysInclude}
                className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs text-blue-300 mb-2">Suggested guidelines:</p>
              <div className="flex flex-wrap gap-1">
                {suggestedAlwaysInclude
                  .filter(suggestion => !alwaysInclude.includes(suggestion))
                  .slice(0, 4)
                  .map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setAlwaysInclude([...alwaysInclude, suggestion]);
                        onConfigChange();
                      }}
                      className="text-xs bg-white/5 hover:bg-white/10 text-blue-200 px-2 py-1 rounded transition-colors"
                    >
                      + {suggestion}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Never Include */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">❌ Never Include</h3>
          <p className="text-sm text-blue-200 mb-4">
            Things your assistant should avoid saying or doing
          </p>
          
          <div className="space-y-3">
            <div className="space-y-2">
              {neverInclude.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between bg-white/5 border border-white/20 rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-white">{item}</span>
                  <button
                    onClick={() => handleRemoveNeverInclude(item)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newNeverInclude}
                onChange={(e) => setNewNeverInclude(e.target.value)}
                placeholder="Add new restriction..."
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleAddNeverInclude()}
              />
              <button
                onClick={handleAddNeverInclude}
                disabled={!newNeverInclude}
                className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs text-blue-300 mb-2">Suggested restrictions:</p>
              <div className="flex flex-wrap gap-1">
                {suggestedNeverInclude
                  .filter(suggestion => !neverInclude.includes(suggestion))
                  .slice(0, 4)
                  .map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setNeverInclude([...neverInclude, suggestion]);
                        onConfigChange();
                      }}
                      className="text-xs bg-white/5 hover:bg-white/10 text-blue-200 px-2 py-1 rounded transition-colors"
                    >
                      + {suggestion}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center space-x-2 bg-white text-blue-900 font-semibold px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSaving ? 'Saving...' : 'Save Personality Settings'}</span>
        </button>
      </div>
    </div>
  );
}