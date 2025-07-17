"use client";

import { useState, useEffect } from "react";
import { History, RefreshCw, Clock, Download, Eye, RotateCcw, Trash2, Edit2, Save, X } from "lucide-react";
import { toast } from "react-hot-toast";

interface PromptVersion {
  id: number;
  version: number;
  version_name: string;
  prompt_text: string;
  created_at: string;
  is_current: boolean;
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
}

interface VersionHistoryTabProps {
  clinicData: ClinicData | null;
  aiConfig: AIConfiguration | null;
}

export default function VersionHistoryTab({ clinicData }: VersionHistoryTabProps) {
  const [promptHistory, setPromptHistory] = useState<PromptVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editingVersion, setEditingVersion] = useState<number | null>(null);
  const [editingName, setEditingName] = useState<string>("");

  useEffect(() => {
    fetchPromptHistory();
  }, []);

  const fetchPromptHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch('/api/ai-configuration/prompt-history');
      if (response.ok) {
        const data = await response.json();
        const history = data.history || [];
        // Ensure version_name is always a string
        const processedHistory = history.map((version: {
          id: number;
          version: number;
          version_name: string | null;
          prompt_text: string;
          created_at: string;
          created_by: string;
          is_current: boolean;
        }) => ({
          ...version,
          version_name: version.version_name || `Version ${version.version}`,
          is_current: Boolean(version.is_current)
        }));
        setPromptHistory(processedHistory);
      } else {
        // API endpoint doesn't exist yet, use empty array
        setPromptHistory([]);
      }
    } catch (error) {
      console.error('Error fetching prompt history:', error);
      setPromptHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRestoreVersion = async (versionId: number, versionNumber: number) => {
    if (!confirm(`Are you sure you want to restore version ${versionNumber}? This will replace your current system prompt.`)) {
      return;
    }

    try {
      const response = await fetch('/api/ai-configuration/restore-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version_id: versionId })
      });

      if (response.ok) {
        toast.success(`Version ${versionNumber} restored successfully!`);
        await fetchPromptHistory();
      } else {
        const errorData = await response.text();
        console.error('Server error:', errorData);
        toast.error('API endpoint not implemented yet');
      }
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('API endpoint not implemented yet');
    }
  };

  const handleDeleteVersion = async (versionId: number, versionNumber: number) => {
    if (!confirm(`Are you sure you want to delete version ${versionNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/ai-configuration/prompt-history/${versionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success(`Version ${versionNumber} deleted successfully!`);
        await fetchPromptHistory();
      } else {
        const errorData = await response.text();
        console.error('Server error:', errorData);
        toast.error('API endpoint not implemented yet');
      }
    } catch (error) {
      console.error('Error deleting version:', error);
      toast.error('API endpoint not implemented yet');
    }
  };

  const handleStartEditName = (version: PromptVersion) => {
    setEditingVersion(version.id);
    // Ensure we always have a string value
    setEditingName(version.version_name || `Version ${version.version}`);
  };

  const handleSaveVersionName = async (versionId: number) => {
    if (!editingName.trim()) {
      toast.error('Version name cannot be empty');
      return;
    }

    try {
      const response = await fetch(`/api/ai-configuration/prompt-history/${versionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version_name: editingName.trim() })
      });

      if (response.ok) {
        toast.success('Version name updated successfully!');
        setEditingVersion(null);
        setEditingName("");
        await fetchPromptHistory();
      } else {
        const errorData = await response.text();
        console.error('Server error:', errorData);
        toast.error('API endpoint not implemented yet');
      }
    } catch (error) {
      console.error('Error updating version name:', error);
      toast.error('API endpoint not implemented yet');
    }
  };

  const handleCancelEditName = () => {
    setEditingVersion(null);
    setEditingName("");
  };

  const handleExportVersion = (version: PromptVersion) => {
    const exportData = {
      clinic: clinicData?.practice_name,
      version: version.version,
      version_name: version.version_name,
      prompt_text: version.prompt_text,
      created_at: version.created_at,
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clinicData?.slug}-prompt-v${version.version}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Version ${version.version} exported successfully!`);
  };

  // Find current version more robustly
  const currentVersion = promptHistory.find(v => v.is_current) || 
                        (promptHistory.length > 0 ? promptHistory[0] : null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Version History</h2>
              <p className="text-sm text-blue-200">Track prompt evolution and restore previous versions</p>
            </div>
          </div>
          <button
            onClick={fetchPromptHistory}
            disabled={loadingHistory}
            className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Basic Statistics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 border border-white/20 rounded-lg p-4">
            <div className="text-2xl font-semibold text-white">{promptHistory.length}</div>
            <div className="text-sm text-blue-200">Total Versions</div>
          </div>
          <div className="bg-white/5 border border-white/20 rounded-lg p-4">
            <div className="text-2xl font-semibold text-white">
              {currentVersion ? currentVersion.version_name : 'N/A'}
            </div>
            <div className="text-sm text-blue-200">Current Version</div>
          </div>
        </div>

        {/* Usage Guidelines */}
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-200 mb-2">📚 Version History Guide</h4>
          <ul className="text-xs text-blue-300 space-y-1">
            <li>• View and restore previous prompt versions</li>
            <li>• Rename versions to organize your prompt evolution</li>
            <li>• Export specific versions for backup or sharing</li>
            <li>• Delete old versions you no longer need</li>
          </ul>
        </div>
      </div>

      {/* Version List */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Saved Versions</h3>
        
        <div className="space-y-4">
          {promptHistory.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <p className="text-blue-200 mb-2">No version history available yet</p>
              <p className="text-sm text-blue-300">Versions will appear here after you save prompt changes</p>
            </div>
          ) : (
            promptHistory
              .sort((a, b) => b.version - a.version) // Sort by version descending
              .map((version) => (
                <div
                  key={version.id}
                  className={`bg-white/5 border border-white/20 rounded-lg p-4 transition-all ${
                    selectedVersion === version.id ? 'ring-2 ring-blue-400' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1">
                      {/* Version Info */}
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">v{version.version}</span>
                        </div>
                        
                        {/* Version Name */}
                        <div className="flex items-center space-x-2">
                          {editingVersion === version.id ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white text-sm min-w-[200px]"
                                placeholder="Version name..."
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveVersionName(version.id);
                                  } else if (e.key === 'Escape') {
                                    handleCancelEditName();
                                  }
                                }}
                              />
                              <button
                                onClick={() => handleSaveVersionName(version.id)}
                                className="text-green-400 hover:text-green-300 p-1 hover:bg-white/10 rounded"
                                title="Save"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEditName}
                                className="text-red-400 hover:text-red-300 p-1 hover:bg-white/10 rounded"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-white">{version.version_name}</span>
                              <button
                                onClick={() => handleStartEditName(version)}
                                className="text-blue-400 hover:text-blue-300 p-1 hover:bg-white/10 rounded transition-colors"
                                title="Edit name"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {version.is_current && (
                                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded font-medium">
                                  Current
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Date */}
                      <div className="text-sm text-blue-200">
                        {new Date(version.created_at).toLocaleDateString()} at {new Date(version.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedVersion(
                          selectedVersion === version.id ? null : version.id
                        )}
                        className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm px-2 py-1 rounded hover:bg-white/10 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{selectedVersion === version.id ? 'Hide' : 'View'}</span>
                      </button>
                      <button
                        onClick={() => handleExportVersion(version)}
                        className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm px-2 py-1 rounded hover:bg-white/10 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                      </button>
                      {!version.is_current && (
                        <>
                          <button
                            onClick={() => handleRestoreVersion(version.id, version.version)}
                            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => handleDeleteVersion(version.id, version.version)}
                            className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Prompt Preview */}
                  {selectedVersion === version.id && (
                    <div className="mt-4 p-4 bg-white/5 border border-white/20 rounded-lg">
                      <h4 className="text-sm font-medium text-white mb-2">Prompt Content</h4>
                      <div className="text-sm text-blue-100 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto bg-black/20 rounded p-3">
                        {version.prompt_text}
                      </div>
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}