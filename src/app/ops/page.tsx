"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface DashboardData {
  clinicId: number;
  dateRange: {
    startDate: string;
    endDate: string;
    days: number;
  };
  metrics: {
    qrScans: number;
    totalSessions: number;
    activeSessions: number;
    totalMessages: number;
    userMessages: number;
    aiMessages: number;
    avgResponseTime: number;
    avgFirstResponseTime: number;
    positiveFeedback: number;
    negativeFeedback: number;
    feedbackRatio: number;
    activationRate: number;
  };
  dailyData: Record<string, number>;
}

interface Clinic {
  id: number;
  practice_name: string;
  slug: string;
  specialty: string;
}

export default function OpsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<number | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [days, setDays] = useState(7);

  // Load clinics on mount
  useEffect(() => {
    fetchClinics();
  }, []);

  // Load dashboard data when clinic or days change
  useEffect(() => {
    if (selectedClinicId) {
      fetchDashboardData(selectedClinicId, days);
    }
  }, [selectedClinicId, days]);

  const fetchClinics = async () => {
    try {
      const response = await fetch('/api/debug/clinics');
      const data = await response.json();
      if (response.ok && data.clinics) {
        setClinics(data.clinics);
        if (data.clinics.length > 0) {
          setSelectedClinicId(data.clinics[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async (clinicId: number, daysBack: number) => {
    setDataLoading(true);
    try {
      const response = await fetch(`/api/analytics/dashboard?clinicId=${clinicId}&days=${daysBack}`);
      const data = await response.json();
      if (response.ok) {
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const selectedClinic = clinics.find(c => c.id === selectedClinicId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading clinics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">CalmClinic Operations Analytics</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Time Range Selector */}
              <select
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Last 24 hours</option>
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>

              {/* Clinic Selector */}
              <select
                value={selectedClinicId || ''}
                onChange={(e) => setSelectedClinicId(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
              >
                {clinics.map(clinic => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.practice_name} ({clinic.specialty})
                  </option>
                ))}
              </select>

              <button
                onClick={() => selectedClinicId && fetchDashboardData(selectedClinicId, days)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {selectedClinic && (
          <div className="mb-6 bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-blue-900">{selectedClinic.practice_name}</h2>
                <p className="text-blue-700">
                  {selectedClinic.specialty} • Slug: {selectedClinic.slug}
                </p>
              </div>
              {/* <Link
                href={`/experience/${selectedClinic.slug}`}
                target="_blank"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="w-4 h-4" />
                View Live Chat
              </Link> */}
            </div>
          </div>
        )}

        {dashboardData ? (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* QR Scans */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">QR Scans</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.metrics.qrScans}</p>
                  </div>
                </div>
              </div>

              {/* Sessions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.metrics.totalSessions}</p>
                    <p className="text-xs text-gray-500">{dashboardData.metrics.activeSessions} active</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Messages</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.metrics.totalMessages}</p>
                    <p className="text-xs text-gray-500">{dashboardData.metrics.userMessages}👤 {dashboardData.metrics.aiMessages}🤖</p>
                  </div>
                </div>
              </div>

              {/* Activation Rate */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Activation Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.metrics.activationRate}%</p>
                    <p className="text-xs text-gray-500">Visitors who start chatting</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Feedback */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Positive</span>
                    </div>
                    <span className="text-sm font-medium">{dashboardData.metrics.positiveFeedback}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-gray-600">Negative</span>
                    </div>
                    <span className="text-sm font-medium">{dashboardData.metrics.negativeFeedback}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Satisfaction</span>
                      <span className="text-sm font-medium">{dashboardData.metrics.feedbackRatio}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Engagement Summary */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Engagement</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">QR Code Scans</span>
                    <span className="text-sm font-medium">{dashboardData.metrics.qrScans}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Started Conversations</span>
                    <span className="text-sm font-medium">{dashboardData.metrics.totalSessions}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Engagement Rate</span>
                      <span className="text-sm font-medium text-blue-600">{dashboardData.metrics.activationRate}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link 
                    href={`/ops/sessions?clinicId=${selectedClinicId}`}
                    className="block w-full bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    View All Sessions
                  </Link>
                  <Link 
                    href={`/ops/questions?clinicId=${selectedClinicId}`}
                    className="block w-full bg-purple-50 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
                  >
                    Repeated Questions
                  </Link>
                  {/* <Link 
                    href={`/experience/${selectedClinic?.slug}`}
                    target="_blank"
                    className="block w-full bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                  >
                    Test Live Chat
                  </Link> */}
                </div>
              </div>
            </div>

            {/* Daily Sessions Simple List */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Sessions</h3>
              <div className="grid grid-cols-7 gap-2">
                {Object.entries(dashboardData.dailyData)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .slice(-7)
                  .map(([date, count]) => (
                    <div key={date} className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">{new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                      <p className="text-lg font-semibold text-gray-900">{count}</p>
                      <p className="text-xs text-gray-500">{new Date(date).getDate()}</p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Data Range Info */}
            <div className="mt-6 text-center text-sm text-gray-500">
              Data from {new Date(dashboardData.dateRange.startDate).toLocaleDateString()} to{' '}
              {new Date(dashboardData.dateRange.endDate).toLocaleDateString()} 
              ({dashboardData.dateRange.days} days)
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400">
              {dataLoading ? (
                <>
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p>Loading analytics data...</p>
                </>
              ) : (
                <>
                  <BarChart3 className="w-8 h-8 mx-auto mb-4" />
                  <p>Select a clinic to view analytics</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}