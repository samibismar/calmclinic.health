"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Clock, Play, BarChart3, AlertTriangle, Star, DollarSign } from "lucide-react";
import { toast } from "react-hot-toast";

interface EvaluationResult {
  id: string;
  test_name: string;
  prompt_version: string;
  scenarios_tested: string[];
  overall_score: number;
  category_scores: {
    healthcare_compliance: number;
    personality_match: number;
    response_quality: number;
    safety: number;
  };
  cost: number;
  created_at: string;
  detailed_feedback: string;
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

interface PromptVersion {
  version: number;
  version_name: string;
  created_at: string;
  created_by: string;
  is_current: boolean;
}

interface EvaluationTabProps {
  clinicData: ClinicData | null;
  aiConfig: AIConfiguration | null;
  onConfigChange: () => void;
  onConfigSaved?: () => void;
}

const testScenarios = [
  {
    id: 'healthcare_compliance',
    name: 'Healthcare Compliance',
    description: 'Tests medical information accuracy and safety',
    scenarios: [
      'Patient asks for medical diagnosis',
      'Emergency situation handling',
      'Prescription medication questions',
      'Insurance coverage inquiries'
    ]
  },
  {
    id: 'personality_match',
    name: 'Clinic Personality',
    description: 'Evaluates tone and personality consistency',
    scenarios: [
      'Greeting new patients',
      'Handling anxious patients',
      'Appointment scheduling',
      'Practice information requests'
    ]
  },
  {
    id: 'common_scenarios',
    name: 'Common Interactions',
    description: 'Everyday patient conversation handling',
    scenarios: [
      'Office hours and location',
      'Billing and payment questions',
      'Appointment rescheduling',
      'General practice information'
    ]
  },
  {
    id: 'edge_cases',
    name: 'Edge Cases',
    description: 'Difficult or unusual patient interactions',
    scenarios: [
      'Angry or frustrated patients',
      'Complex medical history questions',
      'Multi-language communication',
      'Unclear or confusing requests'
    ]
  }
];

export default function EvaluationTab({ clinicData, aiConfig, onConfigChange, onConfigSaved }: EvaluationTabProps) {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(['healthcare_compliance', 'personality_match']);
  const [isRunning, setIsRunning] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [estimatedCost, setEstimatedCost] = useState(0.75);

  useEffect(() => {
    fetchEvaluationHistory();
  }, []);

  useEffect(() => {
    // Calculate estimated cost based on selected scenarios
    const scenarioCount = selectedScenarios.length;
    const testCasesPerScenario = 4;
    const totalTests = scenarioCount * testCasesPerScenario;
    // Estimated cost: $0.03-0.06 per evaluation (GPT-4 usage)
    const cost = totalTests * 0.045;
    setEstimatedCost(Math.round(cost * 100) / 100);
  }, [selectedScenarios]);

  const fetchEvaluationHistory = async () => {
    try {
      const response = await fetch('/api/ai-configuration/evaluations');
      if (response.ok) {
        const data = await response.json();
        setEvaluationResults(data.evaluations || []);
      }
    } catch (error) {
      console.error('Error fetching evaluation history:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleScenarioToggle = (scenarioId: string) => {
    setSelectedScenarios(prev => {
      if (prev.includes(scenarioId)) {
        return prev.filter(id => id !== scenarioId);
      } else {
        return [...prev, scenarioId];
      }
    });
    onConfigChange();
  };

  const runEvaluation = async () => {
    if (selectedScenarios.length === 0) {
      toast.error('Please select at least one test scenario');
      return;
    }

    if (!aiConfig?.system_prompt) {
      toast.error('No system prompt found to evaluate');
      return;
    }

    setIsRunning(true);
    try {
      const response = await fetch('/api/ai-configuration/run-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_prompt: aiConfig.system_prompt,
          selected_scenarios: selectedScenarios,
          prompt_version: 'current',
          clinic_info: {
            practice_name: clinicData?.practice_name,
            specialty: clinicData?.specialty,
            doctor_name: clinicData?.doctor_name
          }
        })
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(`Evaluation completed! Overall score: ${data.result.overall_score}/100`);
        setEvaluationResults(prev => [data.result, ...prev]);
        onConfigSaved?.();
      } else {
        toast.error(data.error || 'Failed to run evaluation');
      }
    } catch (error) {
      console.error('Error running evaluation:', error);
      toast.error('Failed to run evaluation');
    } finally {
      setIsRunning(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-900/30 border-green-500/30';
    if (score >= 60) return 'bg-yellow-900/30 border-yellow-500/30';
    return 'bg-red-900/30 border-red-500/30';
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
      {/* Header & Info */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Prompt Evaluation</h2>
            <p className="text-sm text-blue-200">Test your AI prompt performance with automated scenarios</p>
          </div>
        </div>

        {/* What is Evaluation */}
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-200 mb-3">🔍 How Evaluation Works</h3>
          <div className="space-y-2 text-xs text-blue-300">
            <p>AI evaluation uses GPT-4 as an expert judge to score your prompt's performance across different scenarios.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div className="space-y-1">
                <p className="font-medium">Evaluation Process:</p>
                <ul className="space-y-1">
                  <li>• Tests your prompt against realistic scenarios</li>
                  <li>• GPT-4 judges response quality and safety</li>
                  <li>• Scores healthcare compliance and personality match</li>
                  <li>• Provides actionable improvement feedback</li>
                </ul>
              </div>
              <div className="space-y-1">
                <p className="font-medium">Scoring Categories:</p>
                <ul className="space-y-1">
                  <li>• Healthcare Compliance (0-100)</li>
                  <li>• Personality Match (0-100)</li>
                  <li>• Response Quality (0-100)</li>
                  <li>• Safety & Ethics (0-100)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Information */}
        <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <h4 className="text-sm font-medium text-green-200">Cost-Effective Testing</h4>
          </div>
          <div className="text-xs text-green-300 space-y-1">
            <p>Estimated cost for selected scenarios: <span className="font-medium">${estimatedCost}</span></p>
            <p>Each evaluation tests multiple scenarios to give you comprehensive feedback while keeping costs low.</p>
          </div>
        </div>

        {/* Current Prompt Notice */}
        <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-medium text-purple-200">Evaluating Current Prompt</h4>
          </div>
          <div className="text-xs text-purple-300 space-y-1">
            <p>This evaluation will test your <strong>current active prompt</strong> (Version {aiConfig?.version || 1}).</p>
            <p>💡 To test a different prompt version, go to the <strong>Version History</strong> tab, make it current, then return here.</p>
            <p>📋 <strong>Note:</strong> Evaluations use the fully assembled prompt including personality settings, tools, and fallback responses.</p>
          </div>
        </div>
      </div>

      {/* Test Scenario Selection */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Select Test Scenarios</h3>
          <div className="text-sm text-blue-200">
            {selectedScenarios.length} of {testScenarios.length} selected
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {testScenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedScenarios.includes(scenario.id)
                  ? 'bg-white/10 border-white/30'
                  : 'bg-white/5 border-white/20 hover:bg-white/10'
              }`}
              onClick={() => handleScenarioToggle(scenario.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-white">{scenario.name}</h4>
                <input
                  type="checkbox"
                  checked={selectedScenarios.includes(scenario.id)}
                  onChange={() => handleScenarioToggle(scenario.id)}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                />
              </div>
              <p className="text-sm text-blue-200 mb-3">{scenario.description}</p>
              <div className="space-y-1">
                {scenario.scenarios.slice(0, 2).map((test, index) => (
                  <div key={index} className="text-xs text-blue-300">
                    • {test}
                  </div>
                ))}
                {scenario.scenarios.length > 2 && (
                  <div className="text-xs text-blue-400">
                    +{scenario.scenarios.length - 2} more tests...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-blue-300">
            <span className="font-medium">Estimated cost:</span> ${estimatedCost}
            <span className="ml-2 text-xs">({selectedScenarios.length * 4} test cases)</span>
          </div>
          <button
            onClick={runEvaluation}
            disabled={isRunning || selectedScenarios.length === 0}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>Running Evaluation...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Run Evaluation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Evaluation Results */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Evaluation History</h3>

        {evaluationResults.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <p className="text-blue-200 mb-2">No evaluations yet</p>
            <p className="text-sm text-blue-300">
              Run your first evaluation to see how your AI prompt performs
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {evaluationResults.slice(0, 5).map((result) => (
              <div key={result.id} className="bg-white/5 border border-white/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-white">{result.test_name}</h4>
                    <p className="text-sm text-blue-200">
                      {new Date(result.created_at).toLocaleDateString()} • Version {result.prompt_version}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-blue-200">
                      Cost: ${result.cost}
                    </div>
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded ${getScoreBg(result.overall_score)}`}>
                      <Star className="w-4 h-4" />
                      <span className={`font-medium ${getScoreColor(result.overall_score)}`}>
                        {result.overall_score}/100
                      </span>
                    </div>
                  </div>
                </div>

                {/* Category Scores */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white/5 border border-white/20 rounded-lg p-3">
                    <div className="text-xs text-blue-200 mb-1">Healthcare</div>
                    <div className={`text-sm font-medium ${getScoreColor(result.category_scores.healthcare_compliance)}`}>
                      {result.category_scores.healthcare_compliance}/100
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/20 rounded-lg p-3">
                    <div className="text-xs text-blue-200 mb-1">Personality</div>
                    <div className={`text-sm font-medium ${getScoreColor(result.category_scores.personality_match)}`}>
                      {result.category_scores.personality_match}/100
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/20 rounded-lg p-3">
                    <div className="text-xs text-blue-200 mb-1">Quality</div>
                    <div className={`text-sm font-medium ${getScoreColor(result.category_scores.response_quality)}`}>
                      {result.category_scores.response_quality}/100
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/20 rounded-lg p-3">
                    <div className="text-xs text-blue-200 mb-1">Safety</div>
                    <div className={`text-sm font-medium ${getScoreColor(result.category_scores.safety)}`}>
                      {result.category_scores.safety}/100
                    </div>
                  </div>
                </div>

                {/* Feedback Summary */}
                <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
                  <div className="text-xs text-blue-200 mb-1">Key Feedback:</div>
                  <div className="text-sm text-blue-100">{result.detailed_feedback}</div>
                </div>
              </div>
            ))}

            {evaluationResults.length > 5 && (
              <div className="text-center pt-4">
                <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                  View All Evaluations ({evaluationResults.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Best Practices */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Evaluation Best Practices</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-green-400 mb-2">✅ For Best Results</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Run evaluations after major prompt changes</li>
              <li>• Test all scenario categories regularly</li>
              <li>• Compare scores over time to track improvements</li>
              <li>• Focus on healthcare compliance and safety scores</li>
              <li>• Use feedback to refine your prompts</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-400 mb-2">💡 Scoring Guide</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• <span className="text-green-400">80-100:</span> Excellent performance</li>
              <li>• <span className="text-yellow-400">60-79:</span> Good, room for improvement</li>
              <li>• <span className="text-red-400">Below 60:</span> Needs significant work</li>
              <li>• Healthcare compliance should always be 80+</li>
              <li>• Safety scores below 70 need immediate attention</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}