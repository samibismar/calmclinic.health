'use client';

import { useState, useEffect } from 'react';

interface TestStep {
  step: string;
  status: 'pending' | 'running' | 'success' | 'error';
  details: any;
  timestamp: string;
  duration?: number;
}

interface RAGTestResult {
  query: string;
  clinicId: number;
  steps: TestStep[];
  finalAnswer: string;
  totalDuration: number;
  summary: {
    usedCache: boolean;
    usedWebSearch: boolean;
    confidence: number;
    urlsSelected: string[];
    contentSummaries: number;
    errors: string[];
  };
}

export default function HybridRAGTestPage() {
  const [testResult, setTestResult] = useState<RAGTestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [testQuery, setTestQuery] = useState('What are your office hours?');
  const [availableClinics, setAvailableClinics] = useState<any[]>([]);

  useEffect(() => {
    loadClinics();
  }, []);

  const loadClinics = async () => {
    try {
      const response = await fetch('/api/debug/clinics');
      if (response.ok) {
        const clinics = await response.json();
        setAvailableClinics(clinics);
        if (clinics.length > 0) {
          setSelectedClinicId(clinics[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Failed to load clinics:', error);
    }
  };

  const runTest = async () => {
    if (!selectedClinicId || !testQuery) return;

    setIsRunning(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/debug/hybrid-rag-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: parseInt(selectedClinicId),
          query: testQuery,
          debug: true
        })
      });

      if (!response.ok) {
        throw new Error(`Test failed: ${response.status}`);
      }

      const result = await response.json();
      setTestResult(result);

    } catch (error) {
      console.error('Test failed:', error);
      setTestResult({
        query: testQuery,
        clinicId: parseInt(selectedClinicId),
        steps: [{
          step: 'Test Execution',
          status: 'error',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date().toISOString()
        }],
        finalAnswer: 'Test failed',
        totalDuration: 0,
        summary: {
          usedCache: false,
          usedWebSearch: false,
          confidence: 0,
          urlsSelected: [],
          contentSummaries: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        }
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">RAG Test Dashboard</h1>
      
      {/* Test Config */}
      <div className="border p-4 rounded mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2">Clinic:</label>
            <select 
              value={selectedClinicId}
              onChange={(e) => setSelectedClinicId(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={isRunning}
            >
              {availableClinics.map(clinic => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.practice_name} (ID: {clinic.id})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block mb-2">Query:</label>
            <input
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={isRunning}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={runTest}
            disabled={isRunning || !selectedClinicId || !testQuery}
            className={`px-4 py-2 rounded ${
              isRunning 
                ? 'bg-gray-400' 
                : 'bg-blue-600 text-white'
            }`}
          >
            {isRunning ? 'Running...' : 'Run Test'}
          </button>
          
          {['What are your office hours?', 'Where do I park?', 'What insurance do you accept?'].map(example => (
            <button
              key={example}
              onClick={() => setTestQuery(example)}
              className="px-2 py-1 bg-gray-100 border rounded text-xs"
              disabled={isRunning}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {testResult && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="border p-4 rounded">
            <h3 className="font-bold mb-2">Summary</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>Confidence: {testResult.summary.confidence.toFixed(2)}</div>
              <div>Used Cache: {testResult.summary.usedCache ? '✓' : '✗'}</div>
              <div>Web Search: {testResult.summary.usedWebSearch ? '✓' : '✗'}</div>
              <div>Time: {testResult.totalDuration}ms</div>
            </div>
            
            {testResult.summary.urlsSelected.length > 0 && (
              <div className="mt-2">
                <strong>URLs:</strong>
                {testResult.summary.urlsSelected.map((url, i) => (
                  <div key={i} className="text-xs text-blue-600">{url}</div>
                ))}
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="border p-4 rounded">
            <h3 className="font-bold mb-2">Steps</h3>
            {testResult.steps.map((step, index) => (
              <div key={index} className="mb-2 pb-2 border-b">
                <div className="flex items-center gap-2 mb-1">
                  <span>{step.status === 'success' ? '✓' : step.status === 'error' ? '✗' : '⏳'}</span>
                  <span className="font-medium">{step.step}</span>
                  {step.duration && <span className="text-xs text-gray-500">({step.duration}ms)</span>}
                </div>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify(step.details, null, 2)}
                </pre>
              </div>
            ))}
          </div>

          {/* Final Answer */}
          <div className="border p-4 rounded">
            <h3 className="font-bold mb-2">Final Answer</h3>
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-sm text-blue-600 mb-2">Query: "{testResult.query}"</div>
              <div>{testResult.finalAnswer}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}