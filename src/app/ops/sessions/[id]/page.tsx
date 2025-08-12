"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft,
  MessageSquare, 
  User, 
  Bot, 
  ExternalLink,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Search
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  responseTimeMs: number | null;
  toolsUsed: string[] | null;
  ragConfidence: number | null;
  messageIntent: string | null;
  containsMedicalTerms: boolean;
  feedback: {
    feedback_type: 'positive' | 'negative';
    feedback_text: string | null;
    created_at: string;
  } | null;
  order: number;
}

interface SessionDetail {
  id: string;
  clinicId: number;
  clinicSlug: string;
  startedAt: string;
  endedAt: string | null;
  status: 'active' | 'completed';
  language: string;
  totalMessages: number;
  userMessages: number;
  aiMessages: number;
  firstResponseTimeMs: number | null;
  avgResponseTimeMs: number | null;
  sessionDurationMs: number;
  provider: { name: string; title: string; specialties: string[] } | null;
  qrScan: { scan_timestamp: string; scan_source: string; user_agent: string } | null;
}

interface RagLog {
  id: string;
  query: string;
  results_count: number;
  confidence_score: number | null;
  processing_time_ms: number;
  created_at: string;
}

interface SessionData {
  session: SessionDetail;
  messages: Message[];
  ragLogs: RagLog[];
}

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const fetchSessionData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/sessions/${sessionId}`);
      const data: SessionData = await response.json();
      
      if (response.ok) {
        setSessionData(data);
      }
    } catch (error) {
      console.error('Error fetching session data:', error);
    } finally {
      setLoading(false);
    }
  };


  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Filter messages based on search
  const filteredMessages = sessionData?.messages.filter(message =>
    !searchQuery || message.content.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Not Found</h2>
          <p className="text-gray-600 mb-4">The requested session could not be found.</p>
          <Link 
            href="/ops/sessions"
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Sessions
          </Link>
        </div>
      </div>
    );
  }

  const { session } = sessionData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/ops/sessions?clinicId=${session.clinicId}`}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Sessions
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Session Details</h1>
                <p className="text-gray-600 mt-1">
                  Session {session.id.slice(0, 8)} • Started {new Date(session.startedAt).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                session.status === 'active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {session.status}
              </div>
              
              <Link
                href={`/experience/${session.clinicSlug}`}
                target="_blank"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="w-4 h-4" />
                View Live Chat
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Session Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{session.totalMessages}</div>
              <div className="text-sm text-gray-600">Total Messages</div>
              <div className="text-xs text-gray-500 mt-1">{session.userMessages} from patient</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {session.status === 'active' ? 'In Progress' : 'Completed'}
              </div>
              <div className="text-sm text-gray-600">Status</div>
              <div className="text-xs text-gray-500 mt-1">
                Started {new Date(session.startedAt).toLocaleDateString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{session.language.toUpperCase()}</div>
              <div className="text-sm text-gray-600">Language</div>
              <div className="text-xs text-gray-500 mt-1">Patient preference</div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {session.provider && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Provider</div>
                  <div className="text-gray-900">{session.provider.name}</div>
                  <div className="text-sm text-gray-600">{session.provider.title}</div>
                  {session.provider.specialties && session.provider.specialties.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {session.provider.specialties.join(', ')}
                    </div>
                  )}
                </div>
              )}
              
              {session.qrScan && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">QR Scan Source</div>
                  <div className="text-gray-900">{session.qrScan.scan_source}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(session.qrScan.scan_timestamp).toLocaleString()}
                  </div>
                </div>
              )}
              
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Session Info</div>
                <div className="text-gray-900">Language: {session.language}</div>
                <div className="text-sm text-gray-600">Clinic: {session.clinicSlug}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Search */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Conversation */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b p-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Conversation ({filteredMessages.length} messages)
            </h3>
          </div>
          
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {filteredMessages.map((message) => (
              <div key={message.id} className="p-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-purple-100 text-purple-600'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Message Header */}
                    <div className="flex items-center gap-4 mb-2">
                      <span className="font-medium text-gray-900">
                        {message.role === 'user' ? 'Patient' : 'AI Assistant'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>

                    {/* Message Content */}
                    <div className="prose prose-sm max-w-none mb-3">
                      <div className="whitespace-pre-wrap text-gray-900">
                        {message.content}
                      </div>
                    </div>

                    {/* Keep only important medical terms indicator for office managers */}
                    {message.role === 'assistant' && message.containsMedicalTerms && (
                      <div className="mb-2">
                        <div className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          Contains medical information
                        </div>
                      </div>
                    )}

                    {/* Feedback */}
                    {message.feedback && (
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
                        message.feedback.feedback_type === 'positive'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {message.feedback.feedback_type === 'positive' ? (
                          <ThumbsUp className="w-4 h-4" />
                        ) : (
                          <ThumbsDown className="w-4 h-4" />
                        )}
                        <span>User feedback: {message.feedback.feedback_type}</span>
                        {message.feedback.feedback_text && (
                          <span>- &quot;{message.feedback.feedback_text}&quot;</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredMessages.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No messages match your search</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}