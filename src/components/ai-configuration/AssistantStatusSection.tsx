"use client";

import { MessageCircle, CheckCircle, Users, BarChart3, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ClinicData {
  id: number;
  practice_name: string;
  doctor_name: string;
  slug: string;
  specialty: string;
  primary_color: string;
  has_completed_setup: boolean;
}

interface AIConfiguration {
  system_prompt: string;
  tone: string;
  languages: string[];
  last_updated: string;
  version: number;
}

interface AssistantStatusSectionProps {
  clinicData: ClinicData | null;
  aiConfig: AIConfiguration | null;
}

export default function AssistantStatusSection({ clinicData, aiConfig }: AssistantStatusSectionProps) {
  const assistantStatus = clinicData?.has_completed_setup ? 'live' : 'setup_required';

  return (
    <div className="space-y-6">
      {/* Compact Analytics Link */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Analytics</h3>
              <p className="text-sm text-blue-200">
                {assistantStatus === 'live' 
                  ? 'View conversation metrics and engagement data'
                  : 'Analytics available after setup completion'
                }
              </p>
            </div>
          </div>
          
          {assistantStatus === 'live' ? (
            <Link 
              href="/dashboard/engage" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm group"
            >
              View Analytics
              <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <div className="px-4 py-2 bg-gray-600 text-gray-300 rounded-lg text-sm font-medium">
              Setup Required
            </div>
          )}
        </div>
      </div>

      {/* Assistant Status Overview */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="space-y-6">
          
          {/* Status Overview */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Assistant Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Current Status */}
              <div className="bg-white/5 border border-white/20 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-4 h-4 rounded-full ${
                    assistantStatus === 'live' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="font-medium text-white">Current Status</span>
                </div>
                <p className={`text-lg font-semibold ${
                  assistantStatus === 'live' ? 'text-green-200' : 'text-yellow-200'
                }`}>
                  {assistantStatus === 'live' ? 'Live & Active' : 'Setup Required'}
                </p>
                <p className="text-sm text-blue-200 mt-2">
                  {assistantStatus === 'live' 
                    ? 'Your AI assistant is responding to patients' 
                    : 'Complete clinic intelligence setup to go live'
                  }
                </p>
              </div>

              {/* System Info */}
              <div className="bg-white/5 border border-white/20 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                  <span className="font-medium text-white">System</span>
                </div>
                <p className="text-lg font-semibold text-blue-200">Modern API</p>
                <p className="text-sm text-blue-200 mt-2">
                  Using latest responses system with tool integration
                </p>
              </div>

              {/* Configuration */}
              <div className="bg-white/5 border border-white/20 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span className="font-medium text-white">Configuration</span>
                </div>
                <p className="text-lg font-semibold text-purple-200">
                  {aiConfig?.languages?.length || 1} Language{aiConfig?.languages?.length !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-blue-200 mt-2">
                  {clinicData?.specialty} • {aiConfig?.tone || 'Professional'} tone
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Quick Actions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {assistantStatus === 'live' && (
                <Link
                  href={`/chat?c=${clinicData?.slug}`}
                  className="flex flex-col items-center p-6 bg-blue-600/20 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors group"
                >
                  <ExternalLink className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-white text-center">Test Live Chat</span>
                  <span className="text-xs text-blue-200 text-center mt-1">Experience as patient</span>
                </Link>
              )}
              
              <Link
                href="/dashboard/clinic-intelligence"
                className="flex flex-col items-center p-6 bg-purple-600/20 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 transition-colors group"
              >
                <MessageCircle className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-white text-center">Edit Intelligence</span>
                <span className="text-xs text-purple-200 text-center mt-1">Questions & responses</span>
              </Link>
              
              <Link
                href="/dashboard/ai-configuration?section=personality"
                className="flex flex-col items-center p-6 bg-green-600/20 border border-green-500/30 rounded-lg hover:bg-green-600/30 transition-colors group"
              >
                <Users className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-white text-center">Edit Personality</span>
                <span className="text-xs text-green-200 text-center mt-1">Tone & behavior</span>
              </Link>
              
              <Link
                href="/dashboard/engage"
                className="flex flex-col items-center p-6 bg-orange-600/20 border border-orange-500/30 rounded-lg hover:bg-orange-600/30 transition-colors group"
              >
                <BarChart3 className="w-8 h-8 text-orange-400 mb-3 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-white text-center">View Analytics</span>
                <span className="text-xs text-orange-200 text-center mt-1">Performance metrics</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}