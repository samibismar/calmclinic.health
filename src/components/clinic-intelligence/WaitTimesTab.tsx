"use client";

import { useState, useEffect } from 'react';
import { Clock, ChevronUp, ChevronDown, Save, AlertCircle } from 'lucide-react';

interface Provider {
  id: number;
  name: string;
  title: string;
  specialties: string[];
  is_active: boolean;
  wait_time_minutes: number;
}

export default function WaitTimesTab() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clinic-intelligence/wait-times');
      if (!response.ok) {
        throw new Error('Failed to fetch providers');
      }
      const data = await response.json();
      setProviders(data.providers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const updateWaitTime = (providerId: number, delta: number) => {
    setProviders(prev => prev.map(provider => {
      if (provider.id === providerId) {
        const newTime = Math.max(0, Math.min(180, provider.wait_time_minutes + delta)); // 0-180 minutes max
        return { ...provider, wait_time_minutes: newTime };
      }
      return provider;
    }));
  };

  const handleManualTimeChange = (providerId: number, value: string) => {
    const minutes = parseInt(value) || 0;
    const clampedMinutes = Math.max(0, Math.min(180, minutes));
    
    setProviders(prev => prev.map(provider => {
      if (provider.id === providerId) {
        return { ...provider, wait_time_minutes: clampedMinutes };
      }
      return provider;
    }));
  };

  const saveWaitTimes = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch('/api/clinic-intelligence/wait-times', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          providers: providers.map(p => ({ 
            id: p.id, 
            wait_time_minutes: p.wait_time_minutes 
          })) 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save wait times');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save wait times');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="w-6 h-6 text-blue-300" />
          <h2 className="text-xl font-semibold text-white">Wait Time Management</h2>
        </div>
        <p className="text-blue-200 text-sm">
          Set expected wait times for each provider. Patients will see a countdown timer when they start a chat.
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-300" />
            <p className="text-red-100">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
          <p className="text-green-100">Wait times saved successfully!</p>
        </div>
      )}

      {/* Providers */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Provider Wait Times</h3>
        
        {providers.length === 0 ? (
          <p className="text-blue-200 text-center py-8">No active providers found.</p>
        ) : (
          <div className="space-y-4">
            {providers.filter(p => p.is_active).map((provider) => (
              <div key={provider.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{provider.name}</h4>
                    <p className="text-blue-200 text-sm">{provider.title}</p>
                    {provider.specialties.length > 0 && (
                      <p className="text-blue-300 text-xs mt-1">
                        {provider.specialties.join(', ')}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Wait Time Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateWaitTime(provider.id, -1)}
                        className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded border border-white/20 flex items-center justify-center transition-colors"
                        disabled={provider.wait_time_minutes <= 0}
                      >
                        <ChevronDown className="w-4 h-4 text-white" />
                      </button>
                      
                      <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2 border border-white/20">
                        <input
                          type="number"
                          value={provider.wait_time_minutes}
                          onChange={(e) => handleManualTimeChange(provider.id, e.target.value)}
                          className="w-12 text-center bg-transparent text-white text-sm focus:outline-none"
                          min="0"
                          max="180"
                        />
                        <span className="text-blue-200 text-sm">min</span>
                      </div>
                      
                      <button
                        onClick={() => updateWaitTime(provider.id, 1)}
                        className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded border border-white/20 flex items-center justify-center transition-colors"
                        disabled={provider.wait_time_minutes >= 180}
                      >
                        <ChevronUp className="w-4 h-4 text-white" />
                      </button>
                    </div>

                    {/* Quick Set Buttons */}
                    <div className="flex space-x-1">
                      {[5, 10, 15].map(minutes => (
                        <button
                          key={minutes}
                          onClick={() => setProviders(prev => prev.map(p => 
                            p.id === provider.id ? { ...p, wait_time_minutes: minutes } : p
                          ))}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            provider.wait_time_minutes === minutes
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/10 text-blue-200 hover:bg-white/20'
                          }`}
                        >
                          {minutes}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Save Button */}
        {providers.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={saveWaitTimes}
              disabled={saving}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Wait Times'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4">
        <h4 className="text-blue-100 font-medium mb-2">How it works:</h4>
        <ul className="text-blue-200 text-sm space-y-1">
          <li>• Set expected wait times for each active provider</li>
          <li>• Patients see a countdown timer when they start chatting</li>
          <li>• Use up/down arrows or type directly to adjust times</li>
          <li>• Quick buttons (5m, 10m, 15m) for common wait times</li>
          <li>• Maximum wait time is 180 minutes (3 hours)</li>
        </ul>
      </div>
    </div>
  );
}