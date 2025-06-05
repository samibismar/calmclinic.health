"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const clinicSlug = searchParams.get('slug');
  const [copied, setCopied] = useState(false);
  
  const chatUrl = `${window.location.origin}/?c=${clinicSlug}`;
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(chatUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  if (!clinicSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Access</h1>
          <Link href="/signup" className="text-blue-600 hover:text-blue-500">
            Return to signup
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">🎉 You&apos;re All Set!</h1>
            <p className="mt-2 text-gray-600">Your AI assistant is ready to help your patients</p>
          </div>

          {/* Your Chat URL */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Patient Chat URL
            </label>
            <div className="flex">
              <input
                type="text"
                value={chatUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Share this link with your patients or add it to your website
            </p>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4 mb-8">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">✅ Next Steps</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Test your AI assistant with the link above</li>
                <li>• Add the chat link to your website or waiting room</li>
                <li>• Share with your front desk staff</li>
                <li>• Monitor patient engagement in your dashboard</li>
              </ul>
            </div>

            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Put a QR code in your waiting room linking to the chat</li>
                <li>• Include the link in appointment confirmation emails</li>
                <li>• Train your staff to mention it to nervous patients</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={`/?c=${clinicSlug}`}
              className="flex-1 bg-blue-600 text-white text-center py-3 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Test Your AI Assistant
            </Link>
            
            <Link
              href="/dashboard"
              className="flex-1 bg-gray-600 text-white text-center py-3 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              View Dashboard
            </Link>
          </div>

          {/* Contact Info */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Questions? Email us at{" "}
              <a href="mailto:support@calmclinic.health" className="text-blue-600 hover:text-blue-500">
                support@calmclinic.health
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}