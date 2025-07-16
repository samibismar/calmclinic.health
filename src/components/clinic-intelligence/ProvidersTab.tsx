"use client";

import { Users, ArrowRight } from "lucide-react";
import Link from "next/link";



export default function ProvidersTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">Provider Management</h2>
          </div>
          <Link
            href="/dashboard/providers"
            className="flex items-center space-x-2 bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span>Manage Providers</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="text-center py-12">
          <Users className="w-16 h-16 text-blue-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Provider Management</h3>
          <p className="text-blue-200 mb-6 max-w-md mx-auto">
            Manage your clinic&apos;s providers and their information through our dedicated provider management system.
          </p>
          <Link
            href="/dashboard/providers"
            className="inline-flex items-center space-x-2 bg-white text-blue-900 font-semibold px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Users className="w-5 h-5" />
            <span>Go to Provider Management</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}