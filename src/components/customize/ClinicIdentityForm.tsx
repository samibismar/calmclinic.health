"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import type { Session } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type Props = {
  clinicName: string;
  setClinicName: (val: string) => void;
  brandColor: string;
  setBrandColor: (val: string) => void;
  doctorName: string;
  setDoctorName: (val: string) => void;
  specialty: string;
  setSpecialty: (val: string) => void;
  logoUrl: string;
  setLogoUrl: (val: string) => void;
  session: Session | null;
};

const ClinicIdentityForm = ({
  clinicName,
  setClinicName,
  brandColor,
  setBrandColor,
  doctorName,
  setDoctorName,
  specialty,
  setSpecialty,
  logoUrl,
  setLogoUrl,
}: Props) => {
  const supabase = createClientComponentClient();

  // Maps frontend field names to Supabase column names

  useEffect(() => {
    // Initialize session
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Initialized session:", session);
    };

    initializeSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  return (
    <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl shadow-xl border border-gray-700 p-8 space-y-8 text-white">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">🏥 Clinic Identity</h2>
        <p className="text-sm text-gray-200 mb-6">Personalize the assistant with your clinic&apos;s branding and details.</p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Clinic Name</label>
            <input
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="w-full px-4 py-2 bg-[#0f172a] text-white border border-gray-600 rounded-md shadow-sm focus:ring-cyan-400 focus:border-cyan-500"
              placeholder="e.g., Sunrise Health Center"
            />
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-sm mt-6">
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
            <p className="mt-2 text-xs text-gray-400">
              This color will be used for primary elements like buttons and headers.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Clinic Logo URL</label>
            <p className="text-sm text-gray-400 mb-2">
              Paste a public link to your logo image. We recommend uploading your image to <a href="https://postimages.org" target="_blank" rel="noopener noreferrer" className="underline text-cyan-300">postimages.org</a> and copying the <strong>Direct Link</strong> after upload.
            </p>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full px-4 py-2 bg-[#0f172a] text-white border border-gray-600 rounded-md shadow-sm focus:ring-cyan-400 focus:border-cyan-500"
              placeholder="e.g., https://i.imgur.com/your-logo.png"
            />
            {logoUrl && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-1">Preview:</p>
                <Image src={logoUrl} alt="Clinic Logo" width={80} height={80} className="h-20 object-contain rounded-md border border-gray-600" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Doctor Name</label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              className="w-full px-4 py-2 bg-[#0f172a] text-white border border-gray-600 rounded-md shadow-sm focus:ring-cyan-400 focus:border-cyan-500"
              placeholder="e.g., Dr. Elena Ramirez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Specialty</label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-4 py-2 bg-[#0f172a] text-white border border-gray-600 rounded-md shadow-sm focus:ring-cyan-400 focus:border-cyan-500"
              placeholder="e.g., Pediatrics"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicIdentityForm;
