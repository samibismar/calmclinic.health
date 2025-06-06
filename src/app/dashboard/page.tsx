"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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

  const qrRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch real clinic data from your API
        const response = await fetch('/api/dashboard/data');
        
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mx-auto animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Access Required</h1>
          <p className="text-gray-600 mb-4">{error || "Please log in to access your dashboard"}</p>
          <Link 
            href="/login" 
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const chatUrl = `${data.baseUrl}/?c=${data.clinic.slug}`;
  const daysUntilTrialEnd = Math.ceil((new Date(data.clinic.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const handleDownloadQR = () => {
    const canvas = qrRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clinic-qr-code.png';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {/* Hamburger Menu */}
              <MobileSidebar />
              
              {/* Logo and Title */}
              <div className="flex items-center ml-4">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 3a2 2 0 00-2 2H4a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2-2H8zm0 2h4v1H8V5zM4 7h12v9H4V7z"/>
                  </svg>
                </div>
                <div className="ml-4">
                  <h1 className="text-xl font-semibold text-gray-900">{data.clinic.practice_name}</h1>
                  <p className="text-sm text-gray-500">Dr. {data.clinic.doctor_name}</p>
                </div>
              </div>
            </div>
            
            {/* Right side - View Chat button */}
            <div className="flex items-center">
              <Link
                href={chatUrl}
                target="_blank"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
              >
                View Chat
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Trial Status Banner */}
        {data.clinic.status === 'trial' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Free Trial - {daysUntilTrialEnd} days remaining
                </h3>
                <p className="text-sm text-yellow-700">
                  Upgrade to Pro for $49/month to continue using your AI assistant
                </p>
              </div>
              <button className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm hover:bg-yellow-700">
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Patient Chats</h3>
            <p className="text-2xl font-bold text-gray-900">{data.stats.totalChats}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">This Week</h3>
            <p className="text-2xl font-bold text-gray-900">{data.stats.thisWeek}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Avg. Session Length</h3>
            <p className="text-2xl font-bold text-gray-900">{data.stats.avgSessionLength}</p>
          </div>
        </div>

        {/* Chat URL Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Patient Chat Link</h3>
          <div className="flex">
            <input
              type="text"
              value={chatUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
            />
            <button
              onClick={() => navigator.clipboard.writeText(chatUrl)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-r-md hover:bg-blue-700"
            >
              Copy
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Share this link with patients or embed it on your website
          </p>
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8 flex flex-col items-center">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Patient Chat QR Code</h3>
          <QRCodeCanvas
            value={chatUrl}
            size={160}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
            ref={qrRef}
          />
          <p className="mt-2 text-sm text-gray-500">
            Scan this QR code to open the chat link on your mobile device
          </p>
          <button
            onClick={handleDownloadQR}
            className="mt-3 px-4 py-2 bg-gray-200 text-sm rounded hover:bg-gray-300"
          >
            Download QR Code
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/dashboard/customize"
              className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-medium text-gray-900">Customize AI Assistant</h4>
              <p className="text-sm text-gray-500">Update specialty, colors, and responses</p>
            </Link>
            <Link
              href="/dashboard/analytics"
              className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-medium text-gray-900">View Analytics</h4>
              <p className="text-sm text-gray-500">See detailed patient engagement metrics</p>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}