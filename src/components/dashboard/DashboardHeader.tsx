

"use client";

import { useRouter } from "next/navigation";
import { HelpCircle, TrendingUp, LogOut } from "lucide-react";

interface DashboardHeaderProps {
  practiceName: string;
  viewChatUrl?: string;
}

export default function DashboardHeader({ practiceName }: DashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 3a2 2 0 00-2 2H4a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2-2H8zm0 2h4v1H8V5zM4 7h12v9H4V7z" />
                </svg>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-white">{practiceName}</h1>
              </div>
            </div>
          </div>

          {/* Right side navigation */}
          <div className="flex items-center space-x-4">
            {/* Support */}
            <a
              href="/support"
              className="flex items-center space-x-2 text-blue-200 hover:text-white transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Support</span>
            </a>

            {/* Engage */}
            <a
              href="/dashboard/engage"
              className="flex items-center space-x-2 text-blue-200 hover:text-white transition-colors"
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Engage</span>
            </a>

            {/* View Chat button */}
            {/* {viewChatUrl && (
              <a
                href={viewChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-blue-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors flex items-center space-x-2"
              >
                <span>View Chat</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )} */}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-red-200 hover:text-red-100 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}