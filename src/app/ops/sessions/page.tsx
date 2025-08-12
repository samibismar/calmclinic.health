"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  MessageSquare, 
  Users, 
  Clock, 
  ChevronRight,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

interface Session {
  id: string;
  started_at: string;
  ended_at: string | null;
  total_messages: number;
  user_messages: number;
  ai_messages: number;
  first_response_time_ms: number | null;
  avg_response_time_ms: number | null;
  session_status: 'active' | 'completed';
  language: string;
  provider: { name: string; title: string } | null;
  qrScan: { scan_timestamp: string; scan_source: string } | null;
  firstMessage: string | null;
}

interface SessionsResponse {
  sessions: Session[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface Clinic {
  id: number;
  practice_name: string;
  slug: string;
  specialty: string;
}

function SessionsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<number | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Get clinic ID from URL params
  useEffect(() => {
    const clinicId = searchParams.get('clinicId');
    if (clinicId) {
      setSelectedClinicId(parseInt(clinicId));
    }
    fetchClinics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Load sessions when clinic changes
  useEffect(() => {
    if (selectedClinicId) {
      fetchSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClinicId, pagination.offset]);

  const fetchClinics = async () => {
    try {
      const response = await fetch('/api/debug/clinics');
      const data = await response.json();
      if (response.ok && data.clinics) {
        setClinics(data.clinics);
        if (!selectedClinicId && data.clinics.length > 0) {
          setSelectedClinicId(data.clinics[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  };

  const fetchSessions = async (offset = 0) => {
    if (!selectedClinicId) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/sessions?clinicId=${selectedClinicId}&limit=${pagination.limit}&offset=${offset}`
      );
      const data: SessionsResponse = await response.json();
      
      if (response.ok) {
        setSessions(data.sessions);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClinicChange = (clinicId: number) => {
    setSelectedClinicId(clinicId);
    setPagination(prev => ({ ...prev, offset: 0 }));
    router.push(`/ops/sessions?clinicId=${clinicId}`);
  };

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  const formatDuration = (startTime: string, endTime: string | null) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  const formatResponseTime = (timeMs: number | null) => {
    if (!timeMs) return 'N/A';
    return timeMs < 1000 ? `${timeMs}ms` : `${(timeMs / 1000).toFixed(1)}s`;
  };

  // Filter sessions based on search and status
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = !searchQuery || 
      session.firstMessage?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.provider?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || session.session_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const selectedClinic = clinics.find(c => c.id === selectedClinicId);

  if (loading && sessions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/ops"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sessions Browser</h1>
                {selectedClinic && (
                  <p className="text-gray-600 mt-1">
                    {selectedClinic.practice_name} • {pagination.total} total sessions
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Clinic Selector */}
              <select
                value={selectedClinicId || ''}
                onChange={(e) => handleClinicChange(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
              >
                {clinics.map(clinic => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.practice_name} ({clinic.specialty})
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => fetchSessions(pagination.offset)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search sessions by first message, provider, or session ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'completed')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sessions</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow-sm">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-8 h-8 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No sessions found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredSessions.map((session) => (
                <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Session Header */}
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            session.session_status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          <span className="text-sm font-medium text-gray-900">
                            Session {session.id.slice(0, 8)}
                          </span>
                          {session.provider && (
                            <span className="text-sm text-gray-500">
                              • {session.provider.name}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(session.started_at).toLocaleString()}
                          {session.qrScan && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              via {session.qrScan.scan_source}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* First Message Preview */}
                      {session.firstMessage && (
                        <div className="mb-3">
                          <p className="text-gray-700 text-sm line-clamp-2">
                            &quot;{session.firstMessage}&quot;
                          </p>
                        </div>
                      )}

                      {/* Session Stats */}
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{session.total_messages} messages ({session.user_messages} from patient)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            session.session_status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {session.session_status === 'active' ? 'Active Conversation' : 'Completed'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs">Language: {session.language.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link
                      href={`/ops/sessions/${session.id}`}
                      className="ml-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="border-t p-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} sessions
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                  disabled={pagination.offset === 0}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                  disabled={!pagination.hasMore}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-blue-600">{filteredSessions.length}</div>
            <div className="text-sm text-gray-600">Sessions Shown</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-green-600">
              {filteredSessions.filter(s => s.session_status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active Sessions</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-purple-600">
              {filteredSessions.reduce((sum, s) => sum + s.total_messages, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Messages</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round((filteredSessions.reduce((sum, s) => sum + s.total_messages, 0) / filteredSessions.length) * 10) / 10 || 0}
            </div>
            <div className="text-sm text-gray-600">Avg Messages per Session</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div>Loading...</div></div>}>
      <SessionsPageContent />
    </Suspense>
  );
}