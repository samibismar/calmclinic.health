"use client";

import React from "react";
import Link from "next/link";

interface EngagementTipsCardProps {
  hasCompletedSetup: boolean;
}

export default function EngagementTipsCard({ hasCompletedSetup }: EngagementTipsCardProps) {
  if (!hasCompletedSetup) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-3">What Happens After Setup?</h2>
        <p className="text-blue-100 mb-4">
          Once your AI assistant is live, you’ll unlock tools to help patients access it easily and engage with it often.
        </p>
        <ul className="text-sm text-blue-200 list-disc list-inside space-y-1">
          <li>Print and post your QR code in the waiting room</li>
          <li>Share your assistant in reminder texts</li>
          <li>Embed your assistant on your clinic’s website</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-3">📣 Boost Patient Engagement</h2>
      <p className="text-blue-100 mb-3">
        Now that your assistant is live, use these tools to help more patients interact with it before and during their visit:
      </p>
      <ul className="text-sm text-blue-200 list-disc list-inside space-y-1 mb-3">
        <li>📎 Print your QR code and post it in your waiting room</li>
        <li>📱 Use the reminder message template in texts or emails</li>
        <li>🌐 Embed your assistant on your clinic website</li>
        <li>🌍 Support additional languages to serve more patients</li>
      </ul>
      <p className="text-blue-300 text-sm">
        Scroll down to access each tool, ready to use.
      </p>
    </div>
  );
}