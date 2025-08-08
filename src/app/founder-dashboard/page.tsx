'use client';

import { useState, useEffect, useCallback } from 'react';

interface QueryLog {
  id: number;
  clinic_id: number;
  query_text: string;
  query_intent: string;
  rag_confidence: number;
  used_web_search: boolean;
  urls_fetched: string[];
  cache_hit: boolean;
  total_response_time_ms: number;
  final_confidence: number;
  created_at: string;
}

interface ClinicStats {
  clinic_id: number;
  clinic_name: string;
  website_url: string;
  total_queries: number;
  avg_confidence: number;
  cache_hit_rate: number;
  web_search_rate: number;
  avg_response_time: number;
  recent_queries: QueryLog[];
}

export default function FounderDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [stats, setStats] = useState<ClinicStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7');

  const authenticate = () => {
    // Simple PIN validation - in production, use proper authentication
    if (pin === process.env.NEXT_PUBLIC_FOUNDER_PIN || pin === '2006') {
      setIsAuthenticated(true);
      loadDashboardData();
    } else {
      alert('Incorrect PIN');
      setPin(''); // Clear PIN on failure
    }
  };

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Get all clinic stats
      const clinics = [41, 45, 44]; // Your test clinics (prioritizing ENT clinic 45)
      const clinicData = await Promise.all(
        clinics.map(async (clinicId) => {
          const response = await fetch(`/api/debug/clinic-stats?clinicId=${clinicId}&days=${selectedTimeframe}`);
          if (response.ok) {
            return await response.json();
          }
          return null;
        })
      );

      setStats(clinicData.filter(Boolean));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTimeframe]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, loadDashboardData]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">🏥 Founder Dashboard</h1>
          <p className="text-gray-600 text-center mb-4">Enter PIN to access clinic analytics</p>
          <div className="space-y-4">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              className="w-full p-3 border rounded-lg text-center text-lg"
              onKeyPress={(e) => e.key === 'Enter' && authenticate()}
            />
            <button
              onClick={authenticate}
              className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700"
            >
              Access Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🏥 Founder Dashboard</h1>
            <p className="text-gray-600">Real-time clinic AI analytics</p>
          </div>
          
          <div className="flex gap-4 items-center">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="p-2 border rounded-lg"
            >
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
            
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="text-lg">Loading clinic data...</div>
          </div>
        )}

        {/* Clinic Stats Grid */}
        <div className="grid gap-6">
          {stats.map((clinic) => (
            <div key={clinic.clinic_id} className="bg-white rounded-lg shadow-md border">
              {/* Clinic Header */}
              <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {clinic.clinic_name} 
                      <span className="text-sm text-gray-500 ml-2">(ID: {clinic.clinic_id})</span>
                    </h2>
                    <p className="text-gray-600">{clinic.website_url}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-white p-3 rounded-lg border">
                      <div className="text-2xl font-bold text-blue-600">{clinic.total_queries}</div>
                      <div className="text-sm text-gray-600">Total Queries</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <div className="text-2xl font-bold text-green-600">
                        {(clinic.avg_confidence * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-600">Avg Confidence</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="p-6 border-b">
                <h3 className="font-semibold mb-4">📊 Performance Metrics</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-bold text-purple-600">
                      {(clinic.cache_hit_rate * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-600">Cache Hit Rate</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-bold text-orange-600">
                      {(clinic.web_search_rate * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-600">Web Search Rate</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-bold text-indigo-600">
                      {clinic.avg_response_time.toFixed(0)}ms
                    </div>
                    <div className="text-sm text-gray-600">Avg Response Time</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-bold text-teal-600">
                      {clinic.recent_queries?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Recent Queries</div>
                  </div>
                </div>
              </div>

              {/* Recent Queries */}
              {clinic.recent_queries && clinic.recent_queries.length > 0 && (
                <div className="p-6">
                  <h3 className="font-semibold mb-4">💬 Recent Patient Questions</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {clinic.recent_queries.slice(0, 10).map((query) => (
                      <div key={query.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-gray-900 flex-1 mr-4">
                            &quot;{query.query_text}&quot;
                          </div>
                          <div className="text-xs text-gray-500 whitespace-nowrap">
                            {new Date(query.created_at).toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="flex gap-4 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            query.rag_confidence > 0.6 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            Confidence: {(query.rag_confidence * 100).toFixed(0)}%
                          </span>
                          
                          <span className={`px-2 py-1 rounded text-xs ${
                            query.cache_hit || (!query.used_web_search && query.rag_confidence > 0.6)
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {query.cache_hit || (!query.used_web_search && query.rag_confidence > 0.6) 
                              ? '📚 Cache Hit' 
                              : '🌐 Web Search'}
                          </span>
                          
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {query.total_response_time_ms}ms
                          </span>
                          
                          {query.urls_fetched && query.urls_fetched.length > 0 && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                              {query.urls_fetched.length} URLs fetched
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {stats.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="text-gray-500 text-lg">No clinic data found</div>
            <p className="text-gray-400">Try refreshing or check your clinic setup</p>
          </div>
        )}
      </div>
    </div>
  );
}