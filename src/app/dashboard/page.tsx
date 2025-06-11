"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import StatusCard from "@/components/dashboard/StatusCard";
import EngagementTipsCard from "@/components/dashboard/EngagementTipsCard";
import OptionalLinksSection from "@/components/dashboard/OptionalLinksSection";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import QRCodeCard from "@/components/dashboard/QRCodeCard";
import ReminderMessageCard from "@/components/dashboard/ReminderMessageCard";
import EmbedCodeCard from "@/components/dashboard/EmbedCodeCard";

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
  baseUrl: string;
}

function SearchParamsHandler({ onSetupComplete }: { onSetupComplete: () => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("setup") === "complete") {
      onSetupComplete();
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams, onSetupComplete]);

  return null;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  useEffect(() => {
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
        />
      </Suspense>

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

      <DashboardHeader
        practiceName={data.clinic.practice_name}
        doctorName={data.clinic.doctor_name}
        viewChatUrl={data.clinic.has_completed_setup ? `/chat?c=${data.clinic.slug}` : undefined}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatusCard clinic={data.clinic} />
          <EngagementTipsCard hasCompletedSetup={data.clinic.has_completed_setup} />
        </div>
        {data.clinic.has_completed_setup && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <QRCodeCard slug={data.clinic.slug} clinic={data.clinic} />
            <ReminderMessageCard slug={data.clinic.slug} />
            <EmbedCodeCard slug={data.clinic.slug} />
          </div>
        )}
        <OptionalLinksSection />
      </div>
    </div>
  );
}