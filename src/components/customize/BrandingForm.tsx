"use client";

import React from "react";

type Props = {
  brandColor: string;
  setBrandColor: (val: string) => void;
  backgroundStyle: string;
  setBackgroundStyle: (val: string) => void;
  chatAvatarName: string;
  setChatAvatarName: (val: string) => void;
};

const BrandingForm = ({
  brandColor,
  setBrandColor,
  backgroundStyle,
  setBackgroundStyle,
  chatAvatarName,
  setChatAvatarName,
}: Props) => {
  return (
    <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl shadow-xl border border-gray-700 p-8 space-y-6 text-white">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">🎨 Visual & Branding</h2>
        <p className="text-sm text-gray-400 mb-6">Style your assistant to match your clinic’s brand.</p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Primary Brand Color</label>
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-20 h-10 rounded-md border border-gray-600 bg-[#0f172a]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Background Style</label>
            <select
              value={backgroundStyle}
              onChange={(e) => setBackgroundStyle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-600 rounded-md bg-[#0f172a] text-white focus:ring-cyan-400 focus:border-cyan-500"
            >
              <option value="">Default</option>
              <option value="calm-gradient">Calm Gradient</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Chat Avatar Name</label>
            <input
              type="text"
              value={chatAvatarName}
              onChange={(e) => setChatAvatarName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-600 rounded-md bg-[#0f172a] text-white placeholder-gray-400 focus:ring-cyan-400 focus:border-cyan-500"
              placeholder="e.g., Sunny, CareBot, Dr. Chat"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingForm;