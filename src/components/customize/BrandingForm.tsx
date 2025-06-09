"use client";

import React from "react";

type Props = {
  brandColor: string;
  setBrandColor: (val: string) => void;
};

const BrandingForm = ({ brandColor, setBrandColor }: Props) => {
  return (
    <div className="space-y-8 bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl shadow-xl border border-gray-700 p-8 text-white">
      <h2 className="text-2xl font-bold text-white">🎨 Branding</h2>
      <p className="text-gray-400">Customize the visual identity of your assistant.</p>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-sm">
        <label htmlFor="brandColor" className="block text-sm font-medium text-white mb-2">
          Primary Brand Color
        </label>
        <input
          type="color"
          id="brandColor"
          value={brandColor}
          onChange={(e) => setBrandColor(e.target.value)}
          className="w-full h-10 rounded-md border-gray-600 bg-gray-900 cursor-pointer"
        />
        <p className="mt-2 text-xs text-gray-400">This color will be used for primary elements like buttons and headers.</p>
      </div>
    </div>
  );
};

export default BrandingForm;