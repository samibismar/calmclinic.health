"use client";

import Link from "next/link";
import { BarChart3, ArrowRight, Database, Settings, Brain } from "lucide-react";

export default function ClinicIntelligenceCard() {

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Clinic Intelligence</h2>
            <p className="text-blue-100 text-sm">Comprehensive clinic data management</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <p className="text-blue-200 text-sm">
          Manage your clinic&apos;s comprehensive information, services, insurance plans, and AI assistant configuration in one powerful dashboard.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/5 border border-white/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Rich Data</span>
            </div>
            <p className="text-xs text-blue-200 mt-1">Services, insurance, policies</p>
          </div>
          
          <div className="bg-white/5 border border-white/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Management</span>
            </div>
            <p className="text-xs text-blue-200 mt-1">Complete clinic oversight</p>
          </div>
          
          <div className="bg-white/5 border border-white/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">AI Integration</span>
            </div>
            <p className="text-xs text-blue-200 mt-1">Smart assistant configuration</p>
          </div>
        </div>
        
        <Link
          href="/dashboard/clinic-intelligence"
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold px-4 py-3 rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
        >
          <span>Open Clinic Intelligence</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        
        <div className="mt-4 bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-200">
            💡 <strong>Tip:</strong> Check your clinic intelligence sections to ensure all information is complete for optimal AI assistant performance.
          </p>
        </div>
      </div>
    </div>
  );
}