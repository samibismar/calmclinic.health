"use client";

import { ArrowLeft, Globe, Upload, Brain, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ScraperSystemPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/clinic-intelligence"
            className="inline-flex items-center space-x-2 text-blue-200 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Clinic Intelligence</span>
          </Link>
          
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-blue-500/20 border-2 border-blue-400/30 rounded-full flex items-center justify-center">
                <Globe className="w-10 h-10 text-blue-400" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4">Website Data Extraction</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Automatically extract and organize your clinic information from your website
            </p>
          </div>
        </div>

        {/* Coming Soon Badge */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-purple-600/20 border border-purple-400/30 text-purple-200 px-6 py-3 rounded-full">
            <Clock className="w-5 h-5" />
            <span className="text-lg font-semibold">Coming Soon</span>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">How It Will Work</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">1. Provide Your Website</h3>
              <p className="text-blue-200 text-sm">
                Simply paste your clinic&apos;s website URL and we&apos;ll do the rest
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">2. AI Extraction</h3>
              <p className="text-blue-200 text-sm">
                Our AI will scan and extract key information like services, hours, contact details
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">3. Review & Approve</h3>
              <p className="text-blue-200 text-sm">
                Review the extracted data and approve it to populate your clinic intelligence
              </p>
            </div>
          </div>
        </div>

        {/* What Will Be Extracted */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8 mb-8">
          <h2 className="text-xl font-semibold mb-6">What We&apos;ll Extract From Your Website</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-blue-100">Contact Information</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-blue-100">Operating Hours</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-blue-100">Services Offered</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-blue-100">Insurance Plans</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-blue-100">Provider Information</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-blue-100">Office Policies</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-blue-100">Conditions Treated</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-blue-100">Location & Directions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Early Access */}
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-400/30 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-4">Want Early Access?</h2>
          <p className="text-blue-100 mb-6 max-w-md mx-auto">
            This feature is coming soon! We&apos;re working hard to make clinic data management effortless.
          </p>
          <p className="text-sm text-blue-200">
            For now, you can manually add your clinic information using the other tabs in Clinic Intelligence.
          </p>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <Link
            href="/dashboard/clinic-intelligence"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Return to Clinic Intelligence</span>
          </Link>
        </div>
      </div>
    </div>
  );
}