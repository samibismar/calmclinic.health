

"use client";

import React from "react";

type Props = {
  tone: string;
  setTone: (val: string) => void;
  customTone: string;
  setCustomTone: (val: string) => void;
  welcomeMessage: string;
  setWelcomeMessage: (val: string) => void;
  promptInstructions: string;
  setPromptInstructions: (val: string) => void;
  languages: string[];
  setLanguages: (val: string[]) => void;
  customLanguage: string;
  setCustomLanguage: (val: string) => void;
  selectedPromptPreset: string;
  setSelectedPromptPreset: (val: string) => void;
};

const AssistantPersonalityForm = ({
  tone,
  setTone,
  customTone,
  setCustomTone,
  welcomeMessage,
  setWelcomeMessage,
  promptInstructions,
  setPromptInstructions,
  languages,
  setLanguages,
  customLanguage,
  setCustomLanguage,
  selectedPromptPreset,
  setSelectedPromptPreset,
}: Props) => {
  const promptPresets = [
    { label: "Empathetic & Reassuring", value: "empathetic" },
    { label: "Friendly & Casual", value: "friendly" },
    { label: "Professional & Direct", value: "professional" },
  ];

  const toggleLanguage = (lang: string) => {
    setLanguages(
      languages.includes(lang)
        ? languages.filter((l) => l !== lang)
        : [...languages, lang]
    );
  };

  return (
    <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl shadow-xl border border-gray-700 p-8 space-y-6 text-white">
      <h2 className="text-xl font-semibold text-white mb-4">🤖 Assistant Personality</h2>

      <label className="block text-sm font-medium text-gray-200 mb-1">Tone of Voice</label>
      <select
        value={tone}
        onChange={(e) => setTone(e.target.value)}
        className="w-full px-4 py-2 border border-gray-600 rounded-md bg-[#0f172a] text-white placeholder-gray-400 focus:ring-cyan-400 focus:border-cyan-500 mb-4"
      >
        <option value="">Select a tone</option>
        <option value="calm">Calm</option>
        <option value="friendly">Friendly</option>
        <option value="professional">Professional</option>
        <option value="custom">Custom</option>
      </select>

      {tone === "custom" && (
        <input
          type="text"
          placeholder="Describe your tone"
          value={customTone}
          onChange={(e) => setCustomTone(e.target.value)}
          className="w-full px-4 py-2 border border-gray-600 rounded-md bg-[#0f172a] text-white placeholder-gray-400 focus:ring-cyan-400 focus:border-cyan-500 mb-4"
        />
      )}

      <label className="block text-sm font-medium text-gray-200 mb-1">Welcome Message</label>
      <textarea
        value={welcomeMessage}
        onChange={(e) => setWelcomeMessage(e.target.value)}
        className="w-full px-4 py-2 border border-gray-600 rounded-md bg-[#0f172a] text-white placeholder-gray-400 focus:ring-cyan-400 focus:border-cyan-500 mb-4"
        placeholder="Hi! I’m here to help while you wait."
      />

      <label className="block text-sm font-medium text-gray-200 mb-1">Prompt Instructions</label>
      <select
        value={selectedPromptPreset}
        onChange={(e) => setSelectedPromptPreset(e.target.value)}
        className="w-full px-4 py-2 border border-gray-600 rounded-md bg-[#0f172a] text-white placeholder-gray-400 focus:ring-cyan-400 focus:border-cyan-500 mb-2"
      >
        <option value="">Select a behavior preset</option>
        {promptPresets.map((preset) => (
          <option key={preset.value} value={preset.value}>
            {preset.label}
          </option>
        ))}
        <option value="custom">Custom instructions</option>
      </select>

      {selectedPromptPreset === "custom" && (
        <textarea
          value={promptInstructions}
          onChange={(e) => setPromptInstructions(e.target.value)}
          className="w-full px-4 py-2 border border-gray-600 rounded-md bg-[#0f172a] text-white placeholder-gray-400 focus:ring-cyan-400 focus:border-cyan-500 mb-4"
          placeholder="e.g., Always be concise and friendly. Never give medical advice."
        />
      )}

      <label className="block text-sm font-medium text-gray-200 mb-2">Languages Supported</label>
      <div className="space-y-1 flex flex-col mb-2">
        {["English", "Spanish", "French", "Arabic"].map((lang) => (
          <label key={lang} className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={languages.includes(lang)}
              onChange={() => toggleLanguage(lang)}
              className="accent-cyan-500"
            />
            {lang}
          </label>
        ))}
      </div>
      <input
        type="text"
        placeholder="Add a custom language"
        value={customLanguage}
        onChange={(e) => setCustomLanguage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && customLanguage.trim()) {
            e.preventDefault();
            setLanguages([...languages, customLanguage.trim()]);
            setCustomLanguage("");
          }
        }}
        className="w-full px-4 py-2 border border-gray-600 rounded-md bg-[#0f172a] text-white placeholder-gray-400 focus:ring-cyan-400 focus:border-cyan-500"
      />
    </div>
  );
};

export default AssistantPersonalityForm;