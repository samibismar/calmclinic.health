"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react"; 
import MobileSidebar from "@/components/dashboard/mobile-sidebar";

interface DashboardData {
  clinic: {
    practice_name: string;
    doctor_name: string;
    slug: string;
    email: string;
    specialty: string;
    status: string;
    trial_ends_at: string;
    primary_color: string;
    has_completed_setup: boolean;
  };
  stats: {
    totalChats: number;
    thisWeek: number;
    avgSessionLength: string;
  };
  baseUrl: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  
  const searchParams = useSearchParams();
  const qrRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Check if we just came from setup
    if (searchParams.get('setup') === 'complete') {
      setShowSuccessBanner(true);
      // Remove the query param from URL without reload
      window.history.replaceState({}, '', '/dashboard');
      // Hide the banner after 5 seconds
      setTimeout(() => setShowSuccessBanner(false), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Add a cache buster to ensure fresh data
        const response = await fetch(`/api/dashboard/data?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const result = await response.json();
        setData(result);
        
      } catch (err) {
        console.error('Dashboard error:', err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-xl animate-pulse"></div>
          <div className="h-8 bg-white/20 rounded w-48 mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 bg-white/20 rounded w-64 mx-auto animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-white mb-4">Dashboard Access Required</h1>
          <p className="text-blue-100 mb-6">{error || "Please log in to access your dashboard"}</p>
          <Link 
            href="/login" 
            className="bg-white text-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const chatUrl = `${data.baseUrl}/chat?c=${data.clinic.slug}`;
  const daysUntilTrialEnd = Math.ceil((new Date(data.clinic.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 text-white">
      {/* Success Banner */}
      {showSuccessBanner && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Setup complete! Your AI assistant is ready.</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MobileSidebar />
              <div className="flex items-center ml-4">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 3a2 2 0 00-2 2H4a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2-2H8zm0 2h4v1H8V5zM4 7h12v9H4V7z"/>
                  </svg>
                </div>
                <div className="ml-4">
                  <h1 className="text-xl font-semibold text-white">{data.clinic.practice_name}</h1>
                  <p className="text-sm text-blue-100">Dr. {data.clinic.doctor_name}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {data.clinic.has_completed_setup && (
                <Link
                  href={chatUrl}
                  target="_blank"
                  className="bg-white text-blue-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors flex items-center space-x-2"
                >
                  <span>View Chat</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Setup Reminder Banner */}
        {!data.clinic.has_completed_setup && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl p-12 mb-16 max-w-3xl mx-auto text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Welcome to CalmClinic! 
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-xl mx-auto">
              Let&apos;s set up your AI medical assistant in just 2 minutes. Customize how it talks to your patients and matches your practice style.
            </p>
            <Link
              href="/dashboard/customize"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-900 font-bold rounded-xl shadow-lg hover:bg-blue-50 transform hover:scale-105 transition-all duration-200"
            >
              <span className="mr-2">Start Customization</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        )}

        {/* Main Dashboard Content */}
        {data.clinic.has_completed_setup && (
          <>
            {/* Trial Banner */}
            {data.clinic.status === 'trial' && daysUntilTrialEnd <= 7 && (
              <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-xl p-4 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-300 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-semibold text-yellow-100">
                        Free Trial - {daysUntilTrialEnd} days remaining
                      </h3>
                      <p className="text-sm text-yellow-200/80">
                        Upgrade to Pro for $49/month to keep your AI assistant active
                      </p>
                    </div>
                  </div>
                  <button className="bg-yellow-400 text-yellow-900 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors">
                    Upgrade Now
                  </button>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-100">Total Patient Chats</h3>
                    <p className="text-3xl font-bold text-white mt-1">{data.stats.totalChats}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-100">This Week</h3>
                    <p className="text-3xl font-bold text-white mt-1">{data.stats.thisWeek}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-100">Avg. Session</h3>
                    <p className="text-3xl font-bold text-white mt-1">{data.stats.avgSessionLength}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Link Section */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Your Patient Chat Link
              </h3>
              <div className="flex">
                <input
                  type="text"
                  value={chatUrl}
                  readOnly
                  className="flex-1 px-4 py-3 border border-white/20 rounded-l-lg bg-white/5 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(chatUrl);
                    // You could add a toast notification here
                  }}
                  className="px-6 py-3 bg-white text-blue-900 font-semibold rounded-r-lg hover:bg-blue-50 transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="mt-3 text-sm text-blue-100">
                Share this link with patients or embed it on your website for instant access to your AI assistant
              </p>
            </div>

            {/* QR Code Section */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg p-8 mb-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-6">Quick Access QR Code</h3>
                <div className="bg-white p-4 rounded-xl inline-block">
                  <QRCodeCanvas
                    value={chatUrl}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                    includeMargin={true}
                    ref={qrRef}
                  />
                </div>
                <p className="mt-4 text-sm text-blue-100 max-w-md mx-auto">
                  Display this in your waiting room or on printed materials for easy patient access
                </p>
                <button
                  onClick={() => {
                    const canvas = qrRef.current;
                    if (!canvas) return;
                    const url = canvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${data.clinic.slug}-qr-code.png`;
                    link.click();
                  }}
                  className="mt-4 px-6 py-2 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition-colors inline-flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download QR Code</span>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/dashboard/customize"
                  className="group relative overflow-hidden rounded-xl border-2 border-white/30 bg-white/5 hover:bg-white/10 p-6 transition-all duration-300"
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-white flex items-center">
                          <span className="text-2xl mr-3">⚙️</span>
                          Customize AI Assistant
                        </h4>
                        <p className="text-sm text-blue-100 mt-1">
                          Adjust personality, welcome messages, and branding
                        </p>
                      </div>
                      <svg className="w-6 h-6 text-white/50 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>

                <Link
                  href="/dashboard/analytics"
                  className="group relative overflow-hidden rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 p-6 transition-all duration-300"
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-white flex items-center">
                          <span className="text-2xl mr-3">📊</span>
                          View Analytics
                        </h4>
                        <p className="text-sm text-blue-100 mt-1">
                          Track patient engagement and chat insights
                        </p>
                      </div>
                      <svg className="w-6 h-6 text-white/50 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}