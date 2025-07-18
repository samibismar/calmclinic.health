"use client";

import { useState, useEffect } from "react";
import { Save, AlertCircle, CheckCircle, Info, X } from "lucide-react";

export default function AdditionalInfoTab() {
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalInfo, setOriginalInfo] = useState("");

  useEffect(() => {
    fetchAdditionalInfo();
  }, []);

  useEffect(() => {
    setHasUnsavedChanges(additionalInfo !== originalInfo);
  }, [additionalInfo, originalInfo]);

  const fetchAdditionalInfo = async () => {
    try {
      const response = await fetch('/api/clinic-intelligence/additional-info');
      const data = await response.json();
      if (response.ok) {
        const info = data.additional_info || "";
        setAdditionalInfo(info);
        setOriginalInfo(info);
      }
    } catch (error) {
      console.error('Error fetching additional info:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/clinic-intelligence/additional-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          additional_info: additionalInfo
        }),
      });

      if (response.ok) {
        setOriginalInfo(additionalInfo);
        setSaveMessage({ type: 'success', text: 'Additional information saved successfully!' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to save additional information. Please try again.' });
        setTimeout(() => setSaveMessage(null), 5000);
      }
    } catch (error) {
      console.error('Error saving additional info:', error);
      setSaveMessage({ type: 'error', text: 'An error occurred while saving. Please try again.' });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const goodPractices = [
    "Include unique aspects of your practice that set you apart",
    "Mention special programs, services, or technologies you offer",
    "Add information about your clinic's philosophy or approach to care",
    "Include details about your team's specializations or certifications",
    "Mention any awards, accreditations, or partnerships",
    "Add information about accessibility features or special accommodations"
  ];

  const badPractices = [
    "Don't include personal contact information (phone numbers, personal emails)",
    "Avoid medical advice or diagnostic information",
    "Don't include pricing, costs, or insurance details (use other tabs)",
    "Avoid repetitive information already covered in other sections",
    "Don't include outdated or temporary information",
    "Avoid overly promotional or sales-focused language"
  ];

  return (
    <div className="space-y-6">
      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="bg-yellow-900/50 border border-yellow-500/50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-200 font-medium">You have unsaved changes</span>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      )}

      {/* Save Message */}
      {saveMessage && (
        <div className={`border rounded-lg p-4 flex items-center justify-between ${
          saveMessage.type === 'success' 
            ? 'bg-green-900/50 border-green-500/50 text-green-200'
            : 'bg-red-900/50 border-red-500/50 text-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {saveMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <span className="font-medium">{saveMessage.text}</span>
          </div>
          <button
            onClick={() => setSaveMessage(null)}
            className="text-current opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Info className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Additional Information</h2>
        </div>
        <p className="text-blue-100">
          Add any additional information about your clinic that doesn&apos;t fit in the other categories. 
          This content will be included in your AI assistant&apos;s knowledge base.
        </p>
      </div>

      {/* Writing Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Good Practices */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>Good Practices</span>
          </h3>
          <ul className="space-y-3">
            {goodPractices.map((practice, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-blue-100 text-sm">{practice}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bad Practices */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center space-x-2">
            <X className="w-5 h-5" />
            <span>Avoid These</span>
          </h3>
          <ul className="space-y-3">
            {badPractices.map((practice, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-blue-100 text-sm">{practice}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Content Input */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="mb-4">
          <label htmlFor="additional-info" className="block text-sm font-medium text-blue-200 mb-2">
            Additional Information
          </label>
          <div className="text-xs text-blue-300 mb-4">
            This information will be included in your AI assistant&apos;s system prompt to help provide more personalized responses to patients.
          </div>
        </div>
        
        <textarea
          id="additional-info"
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          placeholder="Enter any additional information about your clinic that would help your AI assistant provide better responses to patients..."
          className="w-full h-64 bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-vertical"
        />
        
        <div className="mt-2 text-xs text-blue-300">
          {additionalInfo.length} characters
        </div>
      </div>

      {/* Save Button */}
      {hasUnsavedChanges && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>{isSaving ? 'Saving...' : 'Save Additional Information'}</span>
          </button>
        </div>
      )}
    </div>
  );
}