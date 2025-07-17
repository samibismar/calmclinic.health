"use client";

import { useState, useEffect } from "react";
import { FlaskConical, BarChart3, TrendingUp, Users, Settings } from "lucide-react";
import { toast } from "react-hot-toast";

interface ABTest {
  id: number;
  name: string;
  description: string;
  variant_a_prompt: string;
  variant_b_prompt: string;
  traffic_percentage: number;
  is_active: boolean;
  start_date: string;
  end_date?: string;
  metrics: {
    variant_a_conversations: number;
    variant_b_conversations: number;
    variant_a_satisfaction: number;
    variant_b_satisfaction: number;
    variant_a_completion_rate: number;
    variant_b_completion_rate: number;
  };
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

interface ABTestingTabProps {
  clinicData: ClinicData | null;
  aiConfig: AIConfiguration | null;
  onConfigChange: () => void;
}

export default function ABTestingTab({ onConfigChange }: ABTestingTabProps) {
  const [abTests, setAbTests] = useState<ABTest[]>([]);
  const [abTestingEnabled, setAbTestingEnabled] = useState(false);
  const [trafficPercentage, setTrafficPercentage] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchABTests();
  }, []);

  const fetchABTests = async () => {
    try {
      const response = await fetch('/api/ai-configuration/ab-tests');
      if (response.ok) {
        const data = await response.json();
        setAbTests(data.tests || []);
        setAbTestingEnabled(data.enabled || false);
        setTrafficPercentage(data.traffic_percentage || 10);
      } else {
        // API endpoint doesn't exist yet, use defaults
        setAbTests([]);
        setAbTestingEnabled(false);
        setTrafficPercentage(10);
      }
    } catch (error) {
      console.error('Error fetching A/B tests:', error);
      // Fallback to defaults if API doesn't exist
      setAbTests([]);
      setAbTestingEnabled(false);
      setTrafficPercentage(10);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleABTesting = async () => {
    try {
      const response = await fetch('/api/ai-configuration/ab-testing-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: !abTestingEnabled,
          traffic_percentage: trafficPercentage
        })
      });

      if (response.ok) {
        setAbTestingEnabled(!abTestingEnabled);
        toast.success(`A/B testing ${!abTestingEnabled ? 'enabled' : 'disabled'}`);
        onConfigChange();
      } else {
        toast.error('API endpoint not implemented yet');
      }
    } catch (error) {
      console.error('Error updating A/B testing settings:', error);
      toast.error('API endpoint not implemented yet');
    }
  };

  const handleUpdateTrafficPercentage = async (percentage: number) => {
    try {
      const response = await fetch('/api/ai-configuration/ab-testing-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: abTestingEnabled,
          traffic_percentage: percentage
        })
      });

      if (response.ok) {
        setTrafficPercentage(percentage);
        toast.success('Traffic percentage updated');
        onConfigChange();
      } else {
        toast.error('API endpoint not implemented yet');
      }
    } catch (error) {
      console.error('Error updating traffic percentage:', error);
      toast.error('API endpoint not implemented yet');
    }
  };

  const mockABTest: ABTest = {
    id: 1,
    name: "Friendly vs Professional Tone",
    description: "Testing whether a more friendly tone improves patient satisfaction",
    variant_a_prompt: "Current prompt with professional tone...",
    variant_b_prompt: "Modified prompt with friendly tone...",
    traffic_percentage: 20,
    is_active: true,
    start_date: "2024-01-15",
    metrics: {
      variant_a_conversations: 156,
      variant_b_conversations: 144,
      variant_a_satisfaction: 4.2,
      variant_b_satisfaction: 4.7,
      variant_a_completion_rate: 78,
      variant_b_completion_rate: 85
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/20 rounded w-1/3"></div>
            <div className="h-32 bg-white/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Settings */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">A/B Testing</h2>
            <p className="text-sm text-blue-200">Test different prompt versions to optimize performance</p>
          </div>
        </div>

        {/* What is A/B Testing */}
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-200 mb-3">🧪 What is A/B Testing?</h3>
          <div className="space-y-2 text-xs text-blue-300">
            <p>A/B testing lets you compare two versions of your AI prompt to see which performs better.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div className="space-y-1">
                <p className="font-medium">How it works:</p>
                <ul className="space-y-1">
                  <li>• Create two prompt versions (A and B)</li>
                  <li>• Split your traffic between them</li>
                  <li>• Monitor performance metrics</li>
                  <li>• Choose the winning version</li>
                </ul>
              </div>
              <div className="space-y-1">
                <p className="font-medium">What we measure:</p>
                <ul className="space-y-1">
                  <li>• Patient satisfaction scores</li>
                  <li>• Conversation completion rates</li>
                  <li>• Response quality metrics</li>
                  <li>• User engagement levels</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* A/B Testing Toggle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="ab-testing"
                checked={abTestingEnabled}
                onChange={handleToggleABTesting}
                className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
              />
              <label htmlFor="ab-testing" className="text-white font-medium">
                Enable A/B Testing
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded text-xs ${
                abTestingEnabled 
                  ? 'bg-green-900/50 text-green-300' 
                  : 'bg-gray-900/50 text-gray-300'
              }`}>
                {abTestingEnabled ? 'Active' : 'Disabled'}
              </span>
            </div>
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
                    value={trafficPercentage}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setTrafficPercentage(value);
                    }}
                    onMouseUp={(e) => {
                      const value = Number((e.target as HTMLInputElement).value);
                      handleUpdateTrafficPercentage(value);
                    }}
                    className="flex-1"
                  />
                  <span className="text-white font-medium w-12">{trafficPercentage}%</span>
                </div>
                <p className="text-xs text-blue-300 mt-1">
                  {trafficPercentage}% of visitors will see the test version, {100 - trafficPercentage}% will see the current version
                </p>
              </div>

              <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-orange-200 mb-2">⚠️ Important Notes</h4>
                <ul className="text-xs text-orange-300 space-y-1">
                  <li>• Start with small traffic percentages (5-10%) to minimize risk</li>
                  <li>• Run tests for at least 1-2 weeks to gather sufficient data</li>
                  <li>• Only test one change at a time for clear results</li>
                  <li>• Monitor closely during the first few days</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Tests */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Active Tests</h3>
          <button
            disabled={!abTestingEnabled}
            className="flex items-center space-x-2 bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FlaskConical className="w-4 h-4" />
            <span>Create New Test</span>
          </button>
        </div>

        {abTests.length === 0 ? (
          <div className="text-center py-8">
            <FlaskConical className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <p className="text-blue-200 mb-2">No active A/B tests</p>
            <p className="text-sm text-blue-300">
              {abTestingEnabled 
                ? 'Create your first test to start optimizing your AI prompts'
                : 'Enable A/B testing to start creating tests'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mock test for demonstration */}
            <div className="bg-white/5 border border-white/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-white">{mockABTest.name}</h4>
                  <p className="text-sm text-blue-200">{mockABTest.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-green-900/50 text-green-300 px-2 py-1 rounded text-xs">
                    Active
                  </span>
                  <button className="text-blue-400 hover:text-blue-300 p-1">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Test Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="bg-white/5 border border-white/20 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-blue-200">Conversations</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-white">A: {mockABTest.metrics.variant_a_conversations}</div>
                    <div className="text-sm text-white">B: {mockABTest.metrics.variant_b_conversations}</div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/20 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-blue-200">Satisfaction</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-white">A: {mockABTest.metrics.variant_a_satisfaction}/5</div>
                    <div className="text-sm text-white">B: {mockABTest.metrics.variant_b_satisfaction}/5</div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/20 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-blue-200">Completion</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-white">A: {mockABTest.metrics.variant_a_completion_rate}%</div>
                    <div className="text-sm text-white">B: {mockABTest.metrics.variant_b_completion_rate}%</div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/20 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <FlaskConical className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-blue-200">Traffic Split</span>
                  </div>
                  <div className="text-sm text-white">{mockABTest.traffic_percentage}% test</div>
                </div>
              </div>

              {/* Winner Indication */}
              <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-200">
                    Variant B is performing better (+12% satisfaction, +9% completion)
                  </span>
                </div>
                <div className="mt-2 flex space-x-2">
                  <button className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded transition-colors">
                    Promote to Live
                  </button>
                  <button className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1 rounded transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* How to Create Tests */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How to Create Effective Tests</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-green-400 mb-2">✅ Good Test Ideas</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Different greeting styles (formal vs casual)</li>
              <li>• Varying response lengths (brief vs detailed)</li>
              <li>• Different appointment booking flows</li>
              <li>• Alternative ways to handle insurance questions</li>
              <li>• Various empathy levels in responses</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-red-400 mb-2">❌ Avoid These</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Testing multiple changes simultaneously</li>
              <li>• Very small traffic percentages (&lt;5%)</li>
              <li>• Running tests for less than a week</li>
              <li>• Testing during atypical periods (holidays)</li>
              <li>• Making drastic personality changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}