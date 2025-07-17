"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Bot, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function DeprecatedCustomizePage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard/ai-configuration');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Warning Icon */}
          <div className="mx-auto w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>

          {/* Main Message */}
          <h1 className="text-4xl font-bold text-white mb-4">
            Page Deprecated
          </h1>
          <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
            This page has been replaced with a better, more comprehensive AI configuration system.
          </p>

          {/* Redirect Info */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 mb-8">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <span className="text-orange-200 font-medium">Old System</span>
              </div>
              
              <ArrowRight className="w-6 h-6 text-blue-400" />
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-medium">New AI Configuration</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="text-left">
                <h3 className="text-lg font-semibold text-white mb-3">What&apos;s New:</h3>
                <ul className="space-y-2 text-sm text-blue-200">
                  <li>• 🧠 Intelligent system prompt generation</li>
                  <li>• ⚡ Real-time testing environment</li>
                  <li>• 🎭 Advanced personality settings</li>
                  <li>• 📊 Version history & A/B testing</li>
                  <li>• 🔄 Fallback response configuration</li>
                </ul>
              </div>

              <div className="text-left">
                <h3 className="text-lg font-semibold text-white mb-3">Your Data:</h3>
                <ul className="space-y-2 text-sm text-blue-200">
                  <li>• ✅ All settings have been migrated</li>
                  <li>• ✅ Example questions moved to Clinic Intelligence</li>
                  <li>• ✅ System prompts preserved</li>
                  <li>• ✅ No data loss occurred</li>
                </ul>
              </div>
            </div>

            <p className="text-sm text-blue-300 italic">
              Redirecting automatically in 5 seconds...
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard/ai-configuration"
              className="inline-flex items-center space-x-2 bg-white text-blue-900 font-semibold px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Bot className="w-5 h-5" />
              <span>Go to AI Configuration</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard/clinic-intelligence"
              className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              <span>View Clinic Intelligence</span>
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <span>Return to Dashboard</span>
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-12 bg-blue-900/30 border border-blue-500/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-3">Need Help?</h3>
            <p className="text-sm text-blue-200 mb-4">
              The new AI Configuration system provides everything from the old customize page and much more. 
              Your existing settings have been automatically migrated.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="bg-white/10 text-blue-200 px-3 py-1 rounded-full text-xs">
                🎯 More Control
              </span>
              <span className="bg-white/10 text-blue-200 px-3 py-1 rounded-full text-xs">
                🧠 Smarter Prompts
              </span>
              <span className="bg-white/10 text-blue-200 px-3 py-1 rounded-full text-xs">
                ⚡ Real-time Testing
              </span>
              <span className="bg-white/10 text-blue-200 px-3 py-1 rounded-full text-xs">
                📊 Better Analytics
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}