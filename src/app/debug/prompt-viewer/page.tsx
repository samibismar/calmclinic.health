"use client";

import { useState } from "react";
import { assembleSystemPrompt } from "@/lib/prompt-assembly";
import { Download, Copy, Eye, EyeOff } from "lucide-react";

export default function PromptViewerPage() {
  const [assembledPrompt, setAssembledPrompt] = useState("");
  const [clinicId, setClinicId] = useState("44"); // Default to Fort Worth Eye
  const [providerId, setProviderId] = useState("72"); // Default provider
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  const handleAssemblePrompt = async () => {
    setLoading(true);
    setError("");
    
    try {
      const clinicIdNum = parseInt(clinicId);
      const providerIdNum = providerId ? parseInt(providerId) : undefined;
      
      if (isNaN(clinicIdNum)) {
        throw new Error("Invalid clinic ID");
      }
      
      const prompt = await assembleSystemPrompt(clinicIdNum, undefined, providerIdNum);
      setAssembledPrompt(prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assemble prompt");
      console.error("Error assembling prompt:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(assembledPrompt);
      alert("Prompt copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy to clipboard");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([assembledPrompt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-prompt-clinic-${clinicId}-provider-${providerId || 'none'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatPromptWithLineNumbers = (prompt: string) => {
    const lines = prompt.split('\n');
    return lines.map((line, index) => (
      <div key={index} className="flex">
        {showLineNumbers && (
          <span className="text-gray-400 text-xs mr-4 select-none min-w-[3rem] text-right">
            {(index + 1).toString().padStart(3, ' ')}
          </span>
        )}
        <span className="whitespace-pre">{line}</span>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">System Prompt Debugger</h1>
          <p className="text-gray-400">
            View the fully assembled system prompt that gets sent to your AI
          </p>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Clinic ID
              </label>
              <input
                type="text"
                value={clinicId}
                onChange={(e) => setClinicId(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="44"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Provider ID (Optional)
              </label>
              <input
                type="text"
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="72"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleAssemblePrompt}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium px-4 py-2 rounded transition-colors"
              >
                {loading ? "Assembling..." : "Assemble Prompt"}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded p-3 text-red-200">
              Error: {error}
            </div>
          )}
        </div>

        {/* Prompt Display */}
        {assembledPrompt && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="bg-gray-700 px-4 py-3 border-b border-gray-600 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold">Assembled System Prompt</h2>
                <span className="text-sm text-gray-400">
                  {assembledPrompt.length.toLocaleString()} characters • {assembledPrompt.split('\n').length} lines
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowLineNumbers(!showLineNumbers)}
                  className="flex items-center space-x-1 bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  {showLineNumbers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showLineNumbers ? 'Hide' : 'Show'} Lines</span>
                </button>
                
                <button
                  onClick={handleCopyToClipboard}
                  className="flex items-center space-x-1 bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
                
                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Prompt Content */}
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              <div className="font-mono text-sm text-gray-100 leading-relaxed">
                {formatPromptWithLineNumbers(assembledPrompt)}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">How to Use</h3>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• Enter your clinic ID (find it in your database or URL)</li>
            <li>• Optionally enter a provider ID to see provider-specific context</li>
            <li>• Click &quot;Assemble Prompt&quot; to generate the full system prompt</li>
            <li>• Use the toolbar to toggle line numbers, copy, or download the prompt</li>
            <li>• This shows exactly what instructions your AI receives</li>
          </ul>
        </div>

        {/* Common Clinic IDs */}
        <div className="mt-4 bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Quick Fill</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setClinicId("44"); setProviderId("72"); }}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded text-sm transition-colors"
            >
              Fort Worth Eye (44)
            </button>
            <button
              onClick={() => { setClinicId("44"); setProviderId(""); }}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded text-sm transition-colors"
            >
              Fort Worth Eye (No Provider)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}