"use client";

import { useState } from "react";
import { Timer, Zap, CheckCircle, AlertCircle } from "lucide-react";

interface TestResult {
  id: number;
  question: string;
  type: string;
  expectedTools: string[];
  latency: number;
  success: boolean;
  response?: string;
  toolsUsed: string[];
  usedRAG: boolean;
  usedIntelligence: boolean;
  hasSources: boolean;
  error?: string | null;
}

export default function LatencyTestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [clinicId, setClinicId] = useState("44");

  const testQuestions = [
    {
      id: 1,
      question: "What is a nasal polyp?",
      type: "medical_procedure",
      expectedTools: ["clinic_rag_search"]
    },
    {
      id: 2, 
      question: "What services do you offer?",
      type: "structured_data",
      expectedTools: ["get_clinic_services"]
    },
    {
      id: 3,
      question: "What are your hours?", 
      type: "structured_data",
      expectedTools: ["get_clinic_hours"]
    },
    {
      id: 4,
      question: "What insurance do you accept?",
      type: "structured_data", 
      expectedTools: ["get_insurance_info"]
    }
  ];

  const runTest = async (question: { id: number; question: string; type: string; expectedTools: string[]; }) => {
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/responses-hybrid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: question.question }],
          clinicId: parseInt(clinicId),
          maxWebPages: 2
        })
      });

      const endTime = Date.now();
      const latency = endTime - startTime;
      
      const data = await response.json();
      
      return {
        ...question,
        latency,
        success: response.ok,
        response: data.message || 'No message',
        toolsUsed: data.tools_used || [],
        usedRAG: data.hybrid_rag_used,
        usedIntelligence: data.clinic_intelligence_used,
        hasSources: data.message?.includes('Source:') || data.message?.includes('Sources:'),
        error: response.ok ? null : data.error
      };
    } catch (error) {
      return {
        ...question,
        latency: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        toolsUsed: [],
        usedRAG: false,
        usedIntelligence: false,
        hasSources: false
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const results = [];
    for (const question of testQuestions) {
      console.log(`🧪 Testing: "${question.question}"`);
      const result = await runTest(question);
      results.push(result);
      setTestResults([...results]);
    }
    
    setIsRunning(false);
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 2000) return "text-green-600";
    if (latency < 5000) return "text-yellow-600"; 
    return "text-red-600";
  };

  const getLatencyBadge = (latency: number) => {
    if (latency < 2000) return { color: "bg-green-100 text-green-800", text: "Fast" };
    if (latency < 5000) return { color: "bg-yellow-100 text-yellow-800", text: "Medium" };
    return { color: "bg-red-100 text-red-800", text: "Slow" };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Latency & Source Citation Test
          </h1>
          <p className="text-gray-600">
            Test response times and source citation for different query types
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clinic ID
              </label>
              <input
                type="text"
                value={clinicId}
                onChange={(e) => setClinicId(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-24"
                placeholder="44"
              />
            </div>
            <div className="flex-1" />
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {isRunning ? (
                <>
                  <Timer className="w-4 h-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Run Latency Tests
                </>
              )}
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Test Results</h3>
              <div className="space-y-4">
                {testResults.map((result, index) => {
                  const latencyBadge = getLatencyBadge(result.latency);
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {result.success ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          <h4 className="font-medium text-gray-900">
                            {result.question}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${latencyBadge.color}`}>
                            {latencyBadge.text}
                          </span>
                          <span className={`font-mono text-sm ${getLatencyColor(result.latency)}`}>
                            {result.latency}ms
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                        <div>
                          <span className="text-gray-500">Tools Used:</span>
                          <div className="font-medium text-blue-600">
                            {result.toolsUsed.length > 0 ? result.toolsUsed.join(', ') : 'None'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Used RAG:</span>
                          <div className={`font-medium ${result.usedRAG ? 'text-green-600' : 'text-gray-600'}`}>
                            {result.usedRAG ? 'Yes' : 'No'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Used Intelligence:</span>
                          <div className={`font-medium ${result.usedIntelligence ? 'text-green-600' : 'text-gray-600'}`}>
                            {result.usedIntelligence ? 'Yes' : 'No'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Has Sources:</span>
                          <div className={`font-medium ${result.hasSources ? 'text-green-600' : 'text-orange-600'}`}>
                            {result.hasSources ? 'Yes' : 'No'}
                          </div>
                        </div>
                      </div>

                      {result.error && (
                        <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
                          <span className="text-red-800 text-sm">Error: {result.error}</span>
                        </div>
                      )}

                      <div className="bg-gray-50 rounded p-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Response:</h5>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {result.response?.substring(0, 300)}
                          {(result.response?.length || 0) > 300 ? '...' : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {testResults.length === testQuestions.length && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-blue-700 font-medium">Avg Latency</div>
                      <div className="text-xl font-bold text-blue-900">
                        {Math.round(testResults.reduce((sum, r) => sum + r.latency, 0) / testResults.length)}ms
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-700 font-medium">Success Rate</div>
                      <div className="text-xl font-bold text-blue-900">
                        {Math.round((testResults.filter(r => r.success).length / testResults.length) * 100)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-700 font-medium">RAG Usage</div>
                      <div className="text-xl font-bold text-blue-900">
                        {testResults.filter(r => r.usedRAG).length}/{testResults.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-700 font-medium">Source Citations</div>
                      <div className="text-xl font-bold text-blue-900">
                        {testResults.filter(r => r.hasSources).length}/{testResults.length}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Test Questions</h3>
          <div className="space-y-2">
            {testQuestions.map((q, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="font-medium">{q.question}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {q.type}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                    {q.expectedTools.join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}