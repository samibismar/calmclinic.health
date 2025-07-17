"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CompactAIStatusCard from "@/components/dashboard/CompactAIStatusCard";
import OptionalLinksSection from "@/components/dashboard/OptionalLinksSection";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import QRCodeCard from "@/components/dashboard/QRCodeCard";
import ReminderMessageCard from "@/components/dashboard/ReminderMessageCard";
import EmbedCodeCard from "@/components/dashboard/EmbedCodeCard";
import BillingCard from "@/components/dashboard/BillingCard";
import ProviderManagement from "@/components/dashboard/ProviderManagement";
import ClinicIntelligenceCard from "@/components/dashboard/ClinicIntelligenceCard";
import AIConfigurationCard from "@/components/dashboard/AIConfigurationCard";

interface DashboardData {
  clinic: {
    id: number;
    practice_name: string;
    doctor_name: string;
    slug: string;
    email: string;
    specialty: string;
    status: string;
    trial_ends_at: string;
    primary_color: string;
    has_completed_setup: boolean;
    is_paid?: boolean;
    subscription_status?: string;
    current_period_end?: string;
  };
  baseUrl: string;
}

function SearchParamsHandler({ onSetupComplete, onPaymentSuccess }: { 
  onSetupComplete: () => void;
  onPaymentSuccess: () => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("setup") === "complete") {
      onSetupComplete();
      window.history.replaceState({}, "", "/dashboard");
    }
    
    // Handle Stripe success/cancel
    if (searchParams.get("success") === "true") {
      onPaymentSuccess();
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams, onSetupComplete, onPaymentSuccess]);

  return null;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [showPaymentSuccessBanner, setShowPaymentSuccessBanner] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/dashboard/data?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 text-white">
      <Suspense fallback={null}>
        <SearchParamsHandler
          onSetupComplete={() => {
            setShowSuccessBanner(true);
            setTimeout(() => setShowSuccessBanner(false), 5000);
          }}
          onPaymentSuccess={() => {
            setShowPaymentSuccessBanner(true);
            setTimeout(() => setShowPaymentSuccessBanner(false), 7000);
            // Refresh data to get updated payment status - NO PAGE RELOAD
            fetchDashboardData();
          }}
        />
      </Suspense>

      {/* Success Banner for Setup */}
      {showSuccessBanner && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Setup complete! Your AI assistant is ready.</span>
          </div>
        </div>
      )}

      {/* Success Banner for Payment */}
      {showPaymentSuccessBanner && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-purple-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">🎉 Payment successful! Welcome to CalmClinic Pro!</span>
            <button 
              onClick={() => setShowPaymentSuccessBanner(false)}
              className="ml-2 text-white/80 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <DashboardHeader
        practiceName={data.clinic.practice_name}
        doctorName={data.clinic.doctor_name}
        viewChatUrl={data.clinic.has_completed_setup ? `/chat?c=${data.clinic.slug}` : undefined}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        {/* Top Row: Clinic Intelligence + AI Status */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            <ClinicIntelligenceCard />
          </div>
          {data.clinic.has_completed_setup && (
            <div className="xl:col-span-1">
              <CompactAIStatusCard viewChatUrl={`/chat?c=${data.clinic.slug}`} />
            </div>
          )}
        </div>

        {/* Provider Management Section (only if setup complete) */}
        {data.clinic.has_completed_setup && (
          <div className="grid grid-cols-1 gap-6">
            <ProviderManagement />
          </div>
        )}

        {/* AI Configuration Section (only if setup complete) */}
        {data.clinic.has_completed_setup && (
          <div className="grid grid-cols-1 gap-6">
            <AIConfigurationCard />
          </div>
        )}

        {/* QR Code, Reminder, Embed (only if setup complete) */}
        {data.clinic.has_completed_setup && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <QRCodeCard slug={data.clinic.slug} clinic={data.clinic} />
            <ReminderMessageCard slug={data.clinic.slug} />
            <EmbedCodeCard slug={data.clinic.slug} />
          </div>
        )}

        {/* Billing Card (always above optional links) */}
        <div className="grid grid-cols-1 gap-6">
          <BillingCard clinic={data.clinic} />
        </div>

        {/* Optional Links Section (always at the very bottom) */}
        <OptionalLinksSection />
      </div>
    </div>
  );
}