"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft,
  BarChart3,
  MessageSquare,
  Users,
  Clock,
  Star,
  TrendingUp,
  FileText,
  Eye,
  Heart
} from "lucide-react";

const engagementMetrics = [
  {
    title: "Total Conversations",
    value: "1,247",
    change: "+12%",
    trend: "up",
    icon: MessageSquare
  },
  {
    title: "Average Response Time",
    value: "2.3s",
    change: "-0.5s",
    trend: "up",
    icon: Clock
  },
  {
    title: "Patient Satisfaction",
    value: "4.8/5",
    change: "+0.2",
    trend: "up",
    icon: Star
  },
  {
    title: "Active Users",
    value: "342",
    change: "+8%",
    trend: "up",
    icon: Users
  }
];

const recentFeedback = [
  {
    id: 1,
    rating: 5,
    comment: "The AI assistant was incredibly helpful and answered all my questions about my appointment.",
    date: "2 hours ago",
    anonymous: true
  },
  {
    id: 2,
    rating: 4,
    comment: "Quick responses and very informative. Made scheduling much easier.",
    date: "5 hours ago",
    anonymous: true
  },
  {
    id: 3,
    rating: 5,
    comment: "I love how the assistant knew about my insurance and could help me understand my coverage.",
    date: "1 day ago",
    anonymous: true
  }
];

const commonQuestions = [
  {
    question: "What are your office hours?",
    frequency: 156,
    category: "Hours"
  },
  {
    question: "Do you accept my insurance?",
    frequency: 134,
    category: "Insurance"
  },
  {
    question: "How do I schedule an appointment?",
    frequency: 98,
    category: "Scheduling"
  },
  {
    question: "What should I bring to my appointment?",
    frequency: 87,
    category: "Preparation"
  },
  {
    question: "Where is your clinic located?",
    frequency: 76,
    category: "Location"
  }
];

const engagementTools = [
  {
    title: "Update Common Questions",
    description: "Add or modify frequently asked questions to improve responses",
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
    title: "View Live Chat",
    description: "See your AI assistant in action with real-time conversations",
    href: "/chat",
    icon: Eye,
    color: "bg-green-600 hover:bg-green-700"
  }
];

export default function EngagePage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("7d");

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
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Patient Engagement</h1>
              </div>
              <p className="text-blue-100">
                Monitor and improve your AI assistant&apos;s performance with patients
              </p>
            </div>
            
            {/* Time selector */}
            <div className="mt-4 sm:mt-0 flex items-center space-x-2">
              <span className="text-sm text-blue-200">Time Period:</span>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {engagementMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-200">{metric.title}</p>
                    <p className="text-2xl font-bold text-white">{metric.value}</p>
                    <p className={`text-sm flex items-center ${
                      metric.trend === 'up' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {metric.change}
                    </p>
                  </div>
                  <Icon className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Feedback */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Star className="w-5 h-5 text-yellow-400 mr-2" />
              Recent Patient Feedback
            </h2>
            <div className="space-y-4">
              {recentFeedback.map((feedback) => (
                <div key={feedback.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < feedback.rating ? 'text-yellow-400' : 'text-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-blue-300">{feedback.date}</span>
                  </div>
                  <p className="text-sm text-blue-200">{feedback.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Common Questions */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 text-blue-400 mr-2" />
              Most Asked Questions
            </h2>
            <div className="space-y-3">
              {commonQuestions.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-white">{item.question}</p>
                    <p className="text-xs text-blue-300">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{item.frequency}</p>
                    <p className="text-xs text-blue-300">times</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Engagement Tools */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <FileText className="w-5 h-5 text-purple-400 mr-2" />
            Improve Patient Engagement
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
        <div className="mt-8 bg-blue-900/30 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">💡 Tips for Better Patient Engagement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-blue-200 mb-2">Keep Information Current</h4>
              <p className="text-sm text-blue-300">
                Regularly update your clinic intelligence data to ensure patients get accurate, up-to-date information.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-200 mb-2">Personalize Your AI&apos;s Tone</h4>
              <p className="text-sm text-blue-300">
                Match your AI assistant&apos;s communication style to your practice&apos;s personality for better patient connection.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-200 mb-2">Monitor Common Questions</h4>
              <p className="text-sm text-blue-300">
                Add frequently asked questions to your clinic intelligence to improve response accuracy.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-200 mb-2">Set Clear Expectations</h4>
              <p className="text-sm text-blue-300">
                Use fallback responses to guide patients appropriately when they need human assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}