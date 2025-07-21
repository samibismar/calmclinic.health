"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft,
  BarChart3,
  MessageSquare,
  Clock,
  TrendingUp,
  FileText,
  Eye,
  Heart,
  Info
} from "lucide-react";

const engagementTools = [
  {
    title: "Update Clinic Information",
    description: "Keep your clinic details current for accurate patient responses",
    href: "/dashboard/clinic-intelligence",
    icon: FileText,
    color: "bg-blue-600 hover:bg-blue-700"
  },
  {
    title: "Configure AI Personality",
    description: "Adjust tone and communication style for better patient experience",
    href: "/dashboard/ai-configuration",
    icon: Heart,
    color: "bg-purple-600 hover:bg-purple-700"
  },
  {
    title: "View Live Assistant",
    description: "Test your AI assistant and see how it responds to patient questions",
    href: "/chat",
    icon: Eye,
    color: "bg-green-600 hover:bg-green-700"
  }
];

export default function EngagePage() {
  const [interactions, setInteractions] = useState({
    totalInteractions: 0,
    todayInteractions: 0,
    thisWeekInteractions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInteractionCount = async () => {
      try {
        const response = await fetch('/api/interactions/count');
        if (response.ok) {
          const data = await response.json();
          setInteractions(data);
        }
      } catch (error) {
        console.error('Failed to fetch interaction count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInteractionCount();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-blue-200 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Patient Engagement</h1>
              </div>
              <p className="text-blue-100">
                Monitor and improve your AI assistant&apos;s impact on patient care
              </p>
            </div>
          </div>
        </div>

        {/* Patient Activity */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 mb-8">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              {loading ? (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Loading Activity...</h2>
                  <div className="animate-pulse bg-white/5 rounded-lg h-20 mb-4"></div>
                </div>
              ) : interactions.totalInteractions > 0 ? (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Patients are using your AI assistant!</h2>
                  <p className="text-blue-200 text-lg leading-relaxed mb-6">
                    Great news! Patients in your waiting room are actively chatting with your AI assistant. 
                    This means they&apos;re getting instant help with their questions, reducing interruptions to your front desk staff.
                  </p>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Your AI Assistant is Ready!</h2>
                  <p className="text-blue-200 text-lg leading-relaxed mb-6">
                    Your CalmClinic AI assistant is set up and waiting to help patients. 
                    Make sure your QR code is displayed prominently in your waiting room so patients can easily scan it and start chatting.
                  </p>
                </div>
              )}
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <MessageSquare className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-sm text-blue-200">Total Chats</div>
                  <div className="text-3xl font-bold text-white">
                    {loading ? "..." : interactions.totalInteractions}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <Clock className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-sm text-blue-200">Today</div>
                  <div className="text-3xl font-bold text-white">
                    {loading ? "..." : interactions.todayInteractions}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <BarChart3 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-sm text-blue-200">This Week</div>
                  <div className="text-3xl font-bold text-white">
                    {loading ? "..." : interactions.thisWeekInteractions}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Notice */}
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <Info className="w-6 h-6 text-blue-400 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-blue-200 mb-2">Patient Insights Coming Soon</h3>
              <p className="text-blue-300 text-sm leading-relaxed">
                We&apos;re building detailed analytics to show you how your AI assistant is helping patients. 
                You&apos;ll soon be able to see common questions, interaction patterns, and estimated time saved 
                for your front desk staff. For now, focus on sharing your QR code and ensuring your clinic 
                information is up-to-date.
              </p>
            </div>
          </div>
        </div>

        {/* Engagement Tools */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <FileText className="w-5 h-5 text-purple-400 mr-2" />
            Improve Patient Experience
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {engagementTools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <a
                  key={index}
                  href={tool.href}
                  className={`${tool.color} text-white p-6 rounded-lg transition-all duration-200 hover:scale-105 group`}
                >
                  <Icon className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="text-lg font-semibold mb-2">{tool.title}</h3>
                  <p className="text-sm opacity-90">{tool.description}</p>
                </a>
              );
            })}
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">💡 Tips for Better Patient Engagement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-blue-200 mb-2">Display Your QR Code</h4>
              <p className="text-sm text-blue-300">
                Place your QR code prominently in your waiting room so patients can easily find and scan it.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-200 mb-2">Keep Information Current</h4>
              <p className="text-sm text-blue-300">
                Regularly update your clinic information to ensure patients get accurate responses about hours, services, and policies.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-200 mb-2">Test Your Assistant</h4>
              <p className="text-sm text-blue-300">
                Regularly test your AI assistant to make sure it&apos;s giving helpful and accurate responses to common patient questions.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-200 mb-2">Monitor and Adjust</h4>
              <p className="text-sm text-blue-300">
                Pay attention to questions your staff still receive and consider if your AI needs more information to help patients.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}